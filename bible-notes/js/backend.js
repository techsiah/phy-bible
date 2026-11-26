/* Data layer. Firestore only — this build is production-only.

   Firestore layout:
     readers/{roll}            private profile + stats (owner only)
     readers/{roll}/days/{d}   reading history (owner only)
     readers/{roll}/notes/{n}  private notes (owner only)
     board/{roll}              public projection for the leaderboard
     groups/{code}             { name, code, memberRolls[<=4], ... } (public read)

   A student signs in with their roll number and the phone number they
   registered with. There is no device code: registering that pair on a new
   device transfers the private entry to it automatically, so the same
   student gets the same streak and notes on any device.

   The public projection in `board` means the phone number and private
   history never appear on the leaderboard.
*/
import { EVENT, readerKey } from './config.js';
import { normalizeReads } from './store.js';

export class BackendError extends Error {
  constructor(code, message) {
    super(message || code);
    this.name = 'BackendError';
    this.code = code;
  }
}

function configIsReal() {
  const cfg = window.FIREBASE_CONFIG;
  return Boolean(
    cfg &&
    cfg.apiKey && !String(cfg.apiKey).includes('YOUR_') &&
    cfg.projectId && !String(cfg.projectId).includes('your-project') &&
    cfg.appId && !String(cfg.appId).includes('YOUR_')
  );
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[data-src="${src}"]`);
    if (existing) {
      if (existing.dataset.loaded === '1') resolve();
      else existing.addEventListener('load', () => resolve(), { once: true });
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.dataset.src = src;
    script.onload = () => {
      script.dataset.loaded = '1';
      resolve();
    };
    script.onerror = () => reject(new Error(`Could not load ${src}`));
    document.head.append(script);
  });
}

export async function initBackend() {
  if (!configIsReal()) {
    throw new BackendError(
      'CONFIG_MISSING',
      'Firebase is not configured. Add your production project config to firebase-config.js.'
    );
  }

  try {
    await loadScript('vendor/firebase/firebase-app-compat.js');
    await loadScript('vendor/firebase/firebase-auth-compat.js');
    await loadScript('vendor/firebase/firebase-firestore-compat.js');

    if (!window.firebase.apps.length) {
      window.firebase.initializeApp(window.FIREBASE_CONFIG);
    }
    const auth = window.firebase.auth();
    try {
      await auth.setPersistence(window.firebase.auth.Auth.Persistence.LOCAL);
    } catch (err) { /* ignore */ }
    // If the browser already has a signed-in user (e.g. an admin who signed in
    // with Email/Password), keep that session. Only fall back to anonymous auth
    // when there is no existing user — this is the student-app path.
    let user = auth.currentUser;
    if (!user) {
      const credential = await auth.signInAnonymously();
      user = credential.user;
    }
    const db = window.firebase.firestore();
    try {
      await db.enablePersistence({ synchronizeTabs: true });
    } catch (err) {
      // Multi-tab or a browser without IndexedDB; Firestore still works.
    }
    return createFirestoreBackend(db, user.uid);
  } catch (err) {
    console.error('Firebase could not start.', err);
    const code = err && err.code;
    const hints = {
      'auth/admin-restricted-operation': 'Firebase sign-in is disabled. Enable Anonymous authentication in Firebase Console → Authentication → Sign-in method.',
      'auth/operation-not-allowed': 'Firebase sign-in is disabled. Enable Anonymous authentication in Firebase Console → Authentication → Sign-in method.',
      'auth/configuration-not-found': 'Firebase Authentication is not set up for this project. Enable Anonymous sign-in in the Firebase Console.',
      'auth/invalid-api-key': 'The Firebase API key is invalid. Check firebase-config.js.',
      'auth/unauthorized-domain': 'This domain is not authorised. Add it under Firebase Console → Authentication → Settings → Authorized domains.',
      'auth/network-request-failed': 'Cannot reach Firebase. Check your internet connection and try again.'
    };
    throw new BackendError(
      code || 'CONNECT_FAILED',
      hints[code] || 'Could not connect to the reading server. Check your connection and try again.'
    );
  }
}

/* ── Firestore backend ──────────────────────────────────────── */

function errorCode(err) {
  return String((err && (err.code || err.message)) || '');
}

function isPermissionDenied(err) {
  return /permission|insufficient/i.test(errorCode(err));
}

function isNotFound(err) {
  return /not-found|notfound|no document/i.test(errorCode(err));
}

function isAlreadyExists(err) {
  return /already-exists|alreadyexists/i.test(errorCode(err));
}

function createFirestoreBackend(db, initialUid) {
  let uid = initialUid;
  async function ensureUid() {
    const auth = window.firebase && window.firebase.auth ? window.firebase.auth() : null;
    if (auth) {
      if (auth.currentUser && auth.currentUser.uid) {
        uid = auth.currentUser.uid;
        return uid;
      }
      // Only fall back to anonymous if no user is signed in at all.
      // Never downgrade an Email/Password (admin) session.
      const cred = await auth.signInAnonymously();
      if (cred && cred.user && cred.user.uid) {
        uid = cred.user.uid;
        return uid;
      }
    }
    return uid;
  }
  const readerRef = (idOrProfile) => db.collection('readers').doc(readerKey(idOrProfile));
  const boardRef = (idOrProfile) => db.collection('board').doc(readerKey(idOrProfile));
  const groupRef = (code) => db.collection('groups').doc(code);

  function boardDoc(data) {
    return {
      roll: data.roll,
      name: data.name || '',
      gender: data.gender || '',
      dept: data.dept || '',
      year: data.year || '',
      program: data.program || '',
      groupCode: data.groupCode || null,
      currentStreak: Number(data.currentStreak) || 0,
      longestStreak: Number(data.longestStreak) || 0,
      totalDays: Number(data.totalDays) || 0,
      points: Number(data.points) || 0,
      updatedAt: Date.now()
    };
  }

  async function writeBoard(idOrProfile, data) {
    try {
      const id = readerKey(idOrProfile);
      const roll = data.roll || (id.includes('|') ? id.split('|')[0] : id);
      const doc = boardDoc({ ...data, roll });
      await boardRef(id).set(doc, { merge: true });
    } catch (err) {
      console.warn('Board sync deferred', err);
    }
  }

  function phoneMismatch() {
    return new BackendError(
      'PHONE_MISMATCH',
      'This roll number is registered with a different phone number.'
    );
  }

  /* Attach this browser to an existing entry when the roll number and the
     registration details all match. The security rules allow the write only
     if the submitted phone, department, and year equal the stored ones, so the
     check happens on the server and a wrong entry cannot be taken over. */
  async function transferReader(roll, phone, dept, year) {
    const activeUid = await ensureUid();
    const now = Date.now();
    const patch = { uid: activeUid, phone: String(phone || ''), updatedAt: now };
    if (dept) patch.dept = String(dept);
    if (year) patch.year = String(year);
    try {
      await readerRef(roll).update(patch);
    } catch (err) {
      if (isNotFound(err)) {
        throw new BackendError('NOT_FOUND', 'No entry was found for that roll number.');
      }
      if (isPermissionDenied(err)) throw phoneMismatch();
      throw err;
    }
    const snap = await readerRef(roll).get();
    if (!snap.exists) {
      throw new BackendError('NOT_FOUND', 'No entry was found for that roll number.');
    }
    return snap.data();
  }

  return {
    mode: 'firebase',
    warning: null,
    async claimReader(profile) {
      const activeUid = await ensureUid();
      const now = Date.now();
      const phone = String(profile.phone || '');
      const id = readerKey(profile);
      const ref = readerRef(id);
      let reader = null;
      let existedOrDeniedRead = false;
      try {
        await db.runTransaction(async (tx) => {
          let existing;
          try {
            existing = await tx.get(ref);
          } catch (readErr) {
            if (isPermissionDenied(readErr)) existedOrDeniedRead = true;
            throw readErr;
          }
          if (existing.exists) {
            existedOrDeniedRead = true;
            const err = new Error('Already exists');
            err.code = 'already-exists';
            throw err;
          }
          tx.set(ref, {
            ...profile,
            phone,
            uid: activeUid,
            createdAt: now,
            updatedAt: now
          });
        });
      } catch (err) {
        if (existedOrDeniedRead && (isAlreadyExists(err) || isPermissionDenied(err))) {
          // The entry is already registered for this roll + dept + year.
          // The phone number decides whether this is the same student.
          reader = await transferReader(id, phone, profile.dept, profile.year);
        } else {
          throw err;
        }
      }

      if (!reader) {
        const snap = await ref.get();
        reader = snap.exists ? snap.data() : { ...profile, phone, uid, createdAt: now, updatedAt: now };
      }
      await writeBoard(id, reader);
      return reader;
    },
    async restoreReader(roll, phone, dept, year, program) {
      const id = readerKey({ roll, dept, year, program });
      const reader = await transferReader(id, phone, dept, year);
      await writeBoard(id, reader);
      return reader;
    },
    async updateReader(roll, patch) {
      await readerRef(roll).set({ ...patch, uid, updatedAt: Date.now() }, { merge: true });
      await writeBoard(roll, patch);
    },
    async getReader(roll) {
      const snap = await readerRef(roll).get();
      return snap.exists ? snap.data() : null;
    },
    async getBoard(roll) {
      const snap = await boardRef(roll).get();
      return snap.exists ? snap.data() : null;
    },
    async setEarlyAccess(roll, enabled) {
      await boardRef(roll).set({ earlyAccess: Boolean(enabled) }, { merge: true });
    },
    subscribeSelf(key, { onBoard, onReader, onDeleted } = {}) {
      let deleted = false;
      const notifyDeleted = () => {
        if (deleted) return;
        deleted = true;
        if (onDeleted) onDeleted();
      };
      const unsubBoard = boardRef(key).onSnapshot(
        (snap) => {
          if (!snap.exists) {
            if (!snap.metadata.fromCache) notifyDeleted();
            return;
          }
          if (onBoard) onBoard(snap.data());
        },
        (err) => console.warn('self board subscription error', err)
      );
      const unsubReader = readerRef(key).onSnapshot(
        (snap) => {
          if (!snap.exists) {
            if (!snap.metadata.fromCache) notifyDeleted();
            return;
          }
          if (onReader) onReader(snap.data());
        },
        (err) => {
          if (isPermissionDenied(err)) {
            notifyDeleted();
            return;
          }
          console.warn('self reader subscription error', err);
        }
      );
      return () => {
        unsubBoard();
        unsubReader();
      };
    },
    async getDays(roll) {
      const snap = await readerRef(roll).collection('days').get();
      const out = {};
      snap.forEach((doc) => { out[doc.id] = doc.data(); });
      return normalizeReads(out);
    },
    async saveDay(roll, day, data) {
      await readerRef(roll).collection('days').doc(day).set(data, { merge: true });
    },
    async getNotes(roll) {
      const snap = await readerRef(roll).collection('notes').get();
      const out = [];
      snap.forEach((doc) => out.push({ ...doc.data(), id: doc.id }));
      return out;
    },
    async saveNote(roll, note) {
      await readerRef(roll).collection('notes').doc(note.id).set(note, { merge: true });
    },
    async deleteNote(roll, id) {
      await readerRef(roll).collection('notes').doc(id).delete();
    },
    async listReaders() {
      // Primary source: board (public projection)
      const boardSnap = await db.collection('board').limit(EVENT.leaderboardLimit).get();
      const out = [];
      boardSnap.forEach((doc) => {
        const data = doc.data();
        out.push({ ...data, id: doc.id, roll: data.roll || doc.id });
      });
      // Fallback: if board is empty, read from readers and backfill board docs
      if (!out.length) {
        const readersSnap = await db.collection('readers').limit(EVENT.leaderboardLimit).get();
        const writes = [];
        readersSnap.forEach((doc) => {
          const data = doc.data();
          const id = doc.id;
          const roll = data.roll || (id.includes('|') ? id.split('|')[0] : id);
          out.push({ ...data, id, roll });
          // Backfill board doc for this reader so future reads hit board
          const boardData = {
            roll,
            name: data.name || '',
            gender: data.gender || '',
            dept: data.dept || '',
            year: data.year || '',
            program: data.program || '',
            groupCode: data.groupCode || null,
            currentStreak: Number(data.currentStreak) || 0,
            longestStreak: Number(data.longestStreak) || 0,
            totalDays: Number(data.totalDays) || 0,
            points: Number(data.points) || 0,
            updatedAt: Date.now()
          };
          writes.push(db.collection('board').doc(id).set(boardData, { merge: true }));
        });
        if (writes.length) {
          await Promise.all(writes).catch((err) => console.warn('Board backfill failed', err));
        }
      }
      return out;
    },
    /**
     * Real-time subscription to the board collection.
     * cb(readers) is called immediately and on every change.
     * Returns an unsubscribe function.
     */
    subscribeReaders(cb) {
      let boardEmpty = false;
      // Helper: convert a snapshot to our reader array shape
      function snapToReaders(snap) {
        const out = [];
        snap.forEach((doc) => {
          const data = doc.data();
          const id = doc.id;
          // Parse composite key "roll|dept|yearLabel program" to fill missing fields
          const parts = id.includes('|') ? id.split('|') : [];
          const roll = data.roll || parts[0] || id;
          const dept = data.dept || parts[1] || '';
          // yearLabel is like "1st Year UG" → extract year number and program
          const yearRaw = parts[2] || '';
          const yearMatch = yearRaw.match(/^(\d+)/);
          const yearNum = data.year || (yearMatch ? yearMatch[1] : (yearRaw.startsWith('PG') ? 'PG' : ''));
          const program = data.program || (yearRaw.includes(' ') ? yearRaw.split(' ').slice(-1)[0] : '');
          out.push({ ...data, id, roll, dept: dept || data.dept || '', year: yearNum || data.year || '', program: program || data.program || '' });
        });
        return out;
      }
      // Try board first. If it turns out to be empty on the first snapshot,
      // fall back to a live listener on `readers` and backfill board in the bg.
      let unsubReaders = null;
      const unsubBoard = db.collection('board')
        .limit(EVENT.leaderboardLimit)
        .onSnapshot((snap) => {
          const readers = snapToReaders(snap);
          if (readers.length) {
            boardEmpty = false;
            // Kill any readers fallback listener that may be running
            if (unsubReaders) { unsubReaders(); unsubReaders = null; }
            cb(readers);
          } else if (!boardEmpty) {
            boardEmpty = true;
            // Board is empty — start a parallel listener on `readers`
            if (!unsubReaders) {
              unsubReaders = db.collection('readers')
                .limit(EVENT.leaderboardLimit)
                .onSnapshot((rsnap) => {
                  const rreaders = snapToReaders(rsnap);
                  cb(rreaders);
                  // Backfill board docs so future loads use board
                  const writes = [];
                  rsnap.forEach((doc) => {
                    const data = doc.data();
                    const id = doc.id;
                    const roll = data.roll || (id.includes('|') ? id.split('|')[0] : id);
                    const boardData = {
                      roll, name: data.name || '', gender: data.gender || '',
                      dept: data.dept || '', year: data.year || '',
                      program: data.program || '', groupCode: data.groupCode || null,
                      currentStreak: Number(data.currentStreak) || 0,
                      longestStreak: Number(data.longestStreak) || 0,
                      totalDays: Number(data.totalDays) || 0,
                      points: Number(data.points) || 0,
                      updatedAt: Date.now()
                    };
                    writes.push(db.collection('board').doc(id).set(boardData, { merge: true }));
                  });
                  Promise.all(writes).catch((err) => console.warn('Board backfill failed', err));
                }, (err) => console.warn('readers subscription error', err));
            }
          }
        }, (err) => console.warn('board subscription error', err));

      // Return a single cleanup function
      return () => {
        unsubBoard();
        if (unsubReaders) unsubReaders();
      };
    },
    /**
     * Real-time subscription to the groups collection.
     * cb(groups) is called immediately and on every change.
     * Returns an unsubscribe function.
     */
    subscribeGroups(cb) {
      return db.collection('groups').limit(500).onSnapshot((snap) => {
        const out = [];
        snap.forEach((doc) => out.push({ ...doc.data(), code: doc.id }));
        cb(out);
      }, (err) => console.warn('groups subscription error', err));
    },
    async listGroups() {
      const snap = await db.collection('groups').limit(500).get();
      const out = [];
      snap.forEach((doc) => out.push({ ...doc.data(), code: doc.id }));
      return out;
    },
    async findGroup(code) {
      const snap = await groupRef(code).get();
      return snap.exists ? { ...snap.data(), code } : null;
    },
    async createGroup(name, code, profile) {
      const memberId = readerKey(profile);
      await db.runTransaction(async (tx) => {
        const ref = groupRef(code);
        const snap = await tx.get(ref);
        if (snap.exists) throw new BackendError('GROUP_EXISTS', 'That code is already taken.');
        tx.set(ref, {
          name,
          code,
          memberRolls: [memberId],
          companionRoll: memberId,
          createdBy: uid,
          createdAt: Date.now(),
          updatedAt: Date.now()
        });
        tx.set(readerRef(memberId), { groupCode: code, updatedAt: Date.now() }, { merge: true });
      });
      return { name, code, memberRolls: [memberId], companionRoll: memberId, createdBy: uid };
    },
    async joinGroup(code, profile) {
      const memberId = readerKey(profile);
      let result = null;
      await db.runTransaction(async (tx) => {
        const ref = groupRef(code);
        const snap = await tx.get(ref);
        if (!snap.exists) throw new BackendError('GROUP_NOT_FOUND', 'No group has that code.');
        const data = snap.data();
        const memberRolls = Array.isArray(data.memberRolls) ? data.memberRolls : [];
        if (memberRolls.includes(memberId)) {
          result = { ...data, memberRolls, code };
          return;
        }
        if (memberRolls.length >= EVENT.groupMax) {
          throw new BackendError('GROUP_FULL', 'That group already has four members.');
        }
        const next = [...memberRolls, memberId];
        tx.update(ref, { memberRolls: next, updatedAt: Date.now() });
        tx.set(readerRef(memberId), { groupCode: code, updatedAt: Date.now() }, { merge: true });
        result = { ...data, memberRolls: next, code };
      });
      return result;
    },
    async leaveGroup(code, profile) {
      const memberId = readerKey(profile);
      await db.runTransaction(async (tx) => {
        const ref = groupRef(code);
        const snap = await tx.get(ref);
        if (snap.exists) {
          const data = snap.data();
          const current = Array.isArray(data.memberRolls) ? data.memberRolls : [];
          if (current.includes(memberId)) {
            const memberRolls = current.filter((id) => id !== memberId);
            if (!memberRolls.length) tx.delete(ref);
            else tx.update(ref, { memberRolls, updatedAt: Date.now() });
          }
        }
        tx.set(readerRef(memberId), { groupCode: null, updatedAt: Date.now() }, { merge: true });
      });
    },
    /* The group owner removes one member. The removed reader's own entry is
       left untouched (rules only let a device write its own entry), so their
       app clears the stale code the next time it loads the group. */
    async removeGroupMember(code, memberId) {
      await db.runTransaction(async (tx) => {
        const ref = groupRef(code);
        const snap = await tx.get(ref);
        if (!snap.exists) throw new BackendError('GROUP_NOT_FOUND', 'That group no longer exists.');
        const current = Array.isArray(snap.data().memberRolls) ? snap.data().memberRolls : [];
        const next = current.filter((id) => id !== memberId);
        if (next.length === current.length) return;
        if (!next.length) tx.delete(ref);
        else tx.update(ref, { memberRolls: next, updatedAt: Date.now() });
      });
    },
    /* The owner clears the whole group: everyone else is removed first so the
       one-at-a-time membership rule still holds, then the owner leaves. */
    async dissolveGroup(code, profile) {
      const memberId = readerKey(profile);
      const snap = await groupRef(code).get();
      if (snap.exists) {
        const others = (Array.isArray(snap.data().memberRolls) ? snap.data().memberRolls : [])
          .filter((id) => id !== memberId);
        for (const id of others) await this.removeGroupMember(code, id);
      }
      await this.leaveGroup(code, profile);
    },
    async adminUpdateReader(id, patch) {
      const clean = {
        roll: String(patch.roll || '').trim(),
        name: String(patch.name || '').trim(),
        gender: String(patch.gender || ''),
        dept: String(patch.dept || ''),
        year: String(patch.year || ''),
        program: String(patch.program || ''),
        groupCode: patch.groupCode ? String(patch.groupCode).trim().toUpperCase() : null,
        updatedAt: Date.now()
      };
      await boardRef(id).set(clean, { merge: true });
      try {
        await readerRef(id).update(clean);
      } catch (err) {
        /* Reader doc may not exist or may be legacy; board is already updated. */
      }
    },
    async adminDeleteReader(id, groupCode) {
      // Delete private reader doc first so subscribeReaders fallback never backfills board
      try {
        await readerRef(id).delete();
      } catch (err) {
        if (isPermissionDenied(err)) {
          throw new BackendError('PERMISSION_DENIED', 'Permission denied. Deploy the updated firestore.rules to Firebase.');
        }
      }
      try {
        await boardRef(id).delete();
      } catch (err) {
        if (isPermissionDenied(err)) {
          throw new BackendError('PERMISSION_DENIED', 'Permission denied. Deploy the updated firestore.rules to Firebase.');
        }
        throw err;
      }
      if (groupCode) {
        try {
          await this.removeGroupMember(groupCode, id);
        } catch (err) {
          /* Group may already be deleted */
        }
      }
    },
    async adminUpdateGroup(code, patch, removedMemberIds = []) {
      const updateData = {
        name: String(patch.name || '').trim(),
        updatedAt: Date.now()
      };
      if (Array.isArray(patch.memberRolls)) {
        updateData.memberRolls = patch.memberRolls;
      }
      await groupRef(code).update(updateData);
      for (const memberId of removedMemberIds) {
        try {
          await boardRef(memberId).set({ groupCode: null, updatedAt: Date.now() }, { merge: true });
          await readerRef(memberId).update({ groupCode: null, updatedAt: Date.now() });
        } catch (err) {
          /* Best-effort cleanup on removed member */
        }
      }
    },
    async adminDeleteGroup(code) {
      const snap = await groupRef(code).get();
      const memberRolls = snap.exists && Array.isArray(snap.data().memberRolls)
        ? snap.data().memberRolls
        : [];
      await groupRef(code).delete();
      for (const memberId of memberRolls) {
        try {
          await boardRef(memberId).set({ groupCode: null, updatedAt: Date.now() }, { merge: true });
          await readerRef(memberId).update({ groupCode: null, updatedAt: Date.now() });
        } catch (err) {
          /* Best-effort cleanup */
        }
      }
    },
    async signOut() {
      try { await window.firebase.auth().signOut(); } catch (err) { /* ignore */ }
    }
  };
}
