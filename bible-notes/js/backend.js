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
    // Anonymous auth is only the gate that lets a signed-in browser reach
    // Firestore. It is never shown to students and is not their identity.
    const credential = await auth.signInAnonymously();
    const db = window.firebase.firestore();
    try {
      await db.enablePersistence({ synchronizeTabs: true });
    } catch (err) {
      // Multi-tab or a browser without IndexedDB; Firestore still works.
    }
    return createFirestoreBackend(db, credential.user.uid);
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

function createFirestoreBackend(db, uid) {
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
    const now = Date.now();
    const patch = { uid, phone: String(phone || ''), updatedAt: now };
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
      const now = Date.now();
      const phone = String(profile.phone || '');
      const id = readerKey(profile);
      const ref = readerRef(id);
      let reader = null;
      try {
        await db.runTransaction(async (tx) => {
          const existing = await tx.get(ref);
          if (existing.exists) {
            const err = new Error('Already exists');
            err.code = 'already-exists';
            throw err;
          }
          tx.set(ref, {
            ...profile,
            phone,
            uid,
            createdAt: now,
            updatedAt: now
          });
        });
      } catch (err) {
        if (isAlreadyExists(err) || isPermissionDenied(err)) {
          // The entry is already registered. The phone, department, and year
          // decide whether this is the same student.
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
      const snap = await db.collection('board').limit(EVENT.leaderboardLimit).get();
      const out = [];
      snap.forEach((doc) => {
        const data = doc.data();
        out.push({ ...data, id: doc.id, roll: data.roll || doc.id });
      });
      return out;
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
          createdBy: uid,
          createdAt: Date.now(),
          updatedAt: Date.now()
        });
        tx.set(readerRef(memberId), { groupCode: code, updatedAt: Date.now() }, { merge: true });
      });
      return { name, code, memberRolls: [memberId], createdBy: uid };
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
    async signOut() {
      try { await window.firebase.auth().signOut(); } catch (err) { /* ignore */ }
    }
  };
}
