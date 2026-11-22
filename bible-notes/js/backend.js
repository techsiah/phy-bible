/* Data layer. Uses Firestore when firebase-config.js is filled in, otherwise a
   local demo backend so the app can be used and tested immediately.

   Firestore layout:
     readers/{roll}            private profile + stats (owner only)  ← organizer
                               edits `uid` here to recover/transfer
     readers/{roll}/days/{d}   reading history (owner only)
     readers/{roll}/notes/{n}  private notes (owner only)
     board/{roll}              public projection for the leaderboard
     groups/{code}             { name, code, members[<=4], ... } (public read)

   Keeping the public projection in `board` means the device UID and private
   history never appear on the leaderboard.
*/
import { EVENT } from './config.js';
import { normalizeReads, readJSON, writeJSON, localUid } from './store.js';

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
    return createLocalBackend('Local mode — add firebase-config.js to share the leaderboard.');
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
    const credential = await auth.signInAnonymously();
    const db = window.firebase.firestore();
    try {
      await db.enablePersistence({ synchronizeTabs: true });
    } catch (err) {
      // Multi-tab or a browser without IndexedDB; Firestore still works.
    }
    return createFirestoreBackend(db, credential.user.uid);
  } catch (err) {
    console.warn('Firebase could not start; using local mode.', err);
    return createLocalBackend('Firebase could not start — using local mode on this device.');
  }
}

/* ── Local demo backend ─────────────────────────────────────── */

function createLocalBackend(warning) {
  const uid = localUid();
  const READERS = 'xmas2026.demo.readers';
  const GROUPS = 'xmas2026.demo.groups';
  const DEMO_SEEDED = 'xmas2026.demo.seeded.v2';
  const notesKey = (roll) => `xmas2026.demo.notes.${roll}`;
  const daysKey = (roll) => `xmas2026.demo.days.${roll}`;

  const readers = () => readJSON(READERS, {});
  const groups = () => readJSON(GROUPS, {});
  const saveReaders = (value) => writeJSON(READERS, value);
  const saveGroups = (value) => writeJSON(GROUPS, value);

  // Seed initial demo participant accounts so the leaderboard and groups
  // show realistic college participants right out of the box in local mode.
  if (!readJSON(DEMO_SEEDED, false)) {
    const initialReaders = {
      'CS24-012': { roll: 'CS24-012', dept: 'Department of Commerce', year: '2', program: 'UG', currentStreak: 6, longestStreak: 6, totalDays: 6, points: 85, groupCode: 'EMMANU' },
      'EN23-045': { roll: 'EN23-045', dept: 'Department of English', year: '3', program: 'UG', currentStreak: 5, longestStreak: 5, totalDays: 5, points: 70, groupCode: 'EMMANU' },
      'PH24-008': { roll: 'PH24-008', dept: 'Department of Biochemistry', year: '1', program: 'UG', currentStreak: 4, longestStreak: 4, totalDays: 4, points: 55, groupCode: 'LIGHTS' },
      'CM22-102': { roll: 'CM22-102', dept: 'Department of Commerce', year: '3', program: 'UG', currentStreak: 3, longestStreak: 3, totalDays: 3, points: 40, groupCode: 'LIGHTS' },
      'MA23-019': { roll: 'MA23-019', dept: 'Department of Economics', year: '2', program: 'UG', currentStreak: 2, longestStreak: 2, totalDays: 2, points: 25, groupCode: null },
      'HS24-031': { roll: 'HS24-031', dept: 'Department of History', year: '1', program: 'UG', currentStreak: 1, longestStreak: 1, totalDays: 1, points: 10, groupCode: null }
    };
    const initialGroups = {
      'EMMANU': { name: 'Emmanuel JY', code: 'EMMANU', members: ['demo1', 'demo2'], memberRolls: ['CS24-012', 'EN23-045'], createdAt: Date.now() },
      'LIGHTS': { name: 'Bethlehem Lights', code: 'LIGHTS', members: ['demo3', 'demo4'], memberRolls: ['PH24-008', 'CM22-102'], createdAt: Date.now() }
    };
    saveReaders({ ...initialReaders, ...readers() });
    saveGroups({ ...initialGroups, ...groups() });
    writeJSON(DEMO_SEEDED, true);
  }

  return {
    mode: 'local',
    uid,
    warning,
    async claimReader(profile) {
      const all = readers();
      const existing = all[profile.roll];
      if (existing && existing.uid && existing.uid !== uid) {
        throw new BackendError('ROLL_TAKEN', 'This roll number is linked to another device.');
      }
      all[profile.roll] = { ...(existing || {}), ...profile, uid, updatedAt: Date.now() };
      saveReaders(all);
      return all[profile.roll];
    },
    async updateReader(roll, patch) {
      const all = readers();
      all[roll] = { ...(all[roll] || {}), ...patch, uid, updatedAt: Date.now() };
      saveReaders(all);
      return all[roll];
    },
    async getReader(roll) {
      return readers()[roll] || null;
    },
    async getDays(roll) {
      return normalizeReads(readJSON(daysKey(roll), {}));
    },
    async saveDay(roll, day, data) {
      const all = readJSON(daysKey(roll), {});
      all[day] = data;
      writeJSON(daysKey(roll), all);
    },
    async getNotes(roll) {
      const list = readJSON(notesKey(roll), []);
      return Array.isArray(list) ? list : [];
    },
    async saveNote(roll, note) {
      const list = readJSON(notesKey(roll), []);
      const next = Array.isArray(list) ? list.filter((n) => n.id !== note.id) : [];
      next.push(note);
      writeJSON(notesKey(roll), next);
    },
    async deleteNote(roll, id) {
      const list = readJSON(notesKey(roll), []);
      writeJSON(notesKey(roll), (Array.isArray(list) ? list : []).filter((n) => n.id !== id));
    },
    async listReaders() {
      return Object.values(readers());
    },
    async listGroups() {
      return Object.values(groups());
    },
    async findGroup(code) {
      return groups()[code] || null;
    },
    async createGroup(name, code, profile) {
      const all = groups();
      if (all[code]) throw new BackendError('GROUP_EXISTS', 'That code is already taken.');
      const group = {
        name,
        code,
        members: [uid],
        memberRolls: [profile.roll],
        createdBy: uid,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      all[code] = group;
      saveGroups(all);
      const readerList = readers();
      readerList[profile.roll] = { ...(readerList[profile.roll] || {}), groupCode: code, uid };
      saveReaders(readerList);
      return group;
    },
    async joinGroup(code, profile) {
      const all = groups();
      const group = all[code];
      if (!group) throw new BackendError('GROUP_NOT_FOUND', 'No group has that code.');
      if (group.members.includes(uid)) return group;
      if (group.members.length >= EVENT.groupMax) {
        throw new BackendError('GROUP_FULL', 'That group already has four members.');
      }
      group.members.push(uid);
      group.memberRolls.push(profile.roll);
      group.updatedAt = Date.now();
      saveGroups(all);
      const readerList = readers();
      readerList[profile.roll] = { ...(readerList[profile.roll] || {}), groupCode: code, uid };
      saveReaders(readerList);
      return group;
    },
    async leaveGroup(code, profile) {
      const all = groups();
      const group = all[code];
      if (group) {
        group.members = group.members.filter((id) => id !== uid);
        group.memberRolls = group.memberRolls.filter((roll) => roll !== profile.roll);
        group.updatedAt = Date.now();
        if (!group.members.length) delete all[code];
        saveGroups(all);
      }
      const readerList = readers();
      if (readerList[profile.roll]) {
        readerList[profile.roll].groupCode = null;
        readerList[profile.roll].updatedAt = Date.now();
        saveReaders(readerList);
      }
    },
    async signOut() { /* nothing to do */ }
  };
}

/* ── Firestore backend ──────────────────────────────────────── */

function createFirestoreBackend(db, uid) {
  const readerRef = (roll) => db.collection('readers').doc(roll);
  const boardRef = (roll) => db.collection('board').doc(roll);
  const groupRef = (code) => db.collection('groups').doc(code);

  function boardDoc(data) {
    return {
      roll: data.roll,
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

  async function writeBoard(roll, data) {
    try {
      await boardRef(roll).set(boardDoc({ ...data, roll }), { merge: true });
    } catch (err) {
      console.warn('Board sync deferred', err);
    }
  }

  return {
    mode: 'firebase',
    uid,
    warning: null,
    async claimReader(profile) {
      try {
        await db.runTransaction(async (tx) => {
          const ref = readerRef(profile.roll);
          const snap = await tx.get(ref);
          if (snap.exists && snap.data().uid !== uid) {
            throw new BackendError('ROLL_TAKEN', 'This roll number is linked to another device.');
          }
          tx.set(ref, { ...profile, uid, updatedAt: Date.now() }, { merge: true });
        });
      } catch (err) {
        if (err instanceof BackendError) throw err;
        const code = err && (err.code || '');
        if (code === 'permission-denied' || /permission/i.test(err && err.message || '')) {
          throw new BackendError('ROLL_TAKEN', 'This roll number is linked to another device.');
        }
        throw err;
      }
      const snap = await readerRef(profile.roll).get();
      const data = snap.exists ? snap.data() : { ...profile };
      await writeBoard(profile.roll, data);
      return data;
    },
    async updateReader(roll, patch) {
      await readerRef(roll).set({ ...patch, uid, updatedAt: Date.now() }, { merge: true });
      await writeBoard(roll, patch);
    },
    async getReader(roll) {
      const snap = await readerRef(roll).get();
      return snap.exists ? snap.data() : null;
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
      snap.forEach((doc) => out.push({ ...doc.data(), roll: doc.id }));
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
      await db.runTransaction(async (tx) => {
        const ref = groupRef(code);
        const snap = await tx.get(ref);
        if (snap.exists) throw new BackendError('GROUP_EXISTS', 'That code is already taken.');
        tx.set(ref, {
          name,
          code,
          members: [uid],
          memberRolls: [profile.roll],
          createdBy: uid,
          createdAt: Date.now(),
          updatedAt: Date.now()
        });
        tx.set(readerRef(profile.roll), { groupCode: code, updatedAt: Date.now() }, { merge: true });
      });
      return { name, code, members: [uid], memberRolls: [profile.roll], createdBy: uid };
    },
    async joinGroup(code, profile) {
      let result = null;
      await db.runTransaction(async (tx) => {
        const ref = groupRef(code);
        const snap = await tx.get(ref);
        if (!snap.exists) throw new BackendError('GROUP_NOT_FOUND', 'No group has that code.');
        const data = snap.data();
        if (data.members.includes(uid)) {
          result = { ...data, code };
          return;
        }
        if (data.members.length >= EVENT.groupMax) {
          throw new BackendError('GROUP_FULL', 'That group already has four members.');
        }
        const members = [...data.members, uid];
        const memberRolls = [...data.memberRolls, profile.roll];
        tx.update(ref, { members, memberRolls, updatedAt: Date.now() });
        tx.set(readerRef(profile.roll), { groupCode: code, updatedAt: Date.now() }, { merge: true });
        result = { ...data, members, memberRolls, code };
      });
      return result;
    },
    async leaveGroup(code, profile) {
      await db.runTransaction(async (tx) => {
        const ref = groupRef(code);
        const snap = await tx.get(ref);
        if (snap.exists) {
          const data = snap.data();
          const members = data.members.filter((id) => id !== uid);
          const memberRolls = data.memberRolls.filter((roll) => roll !== profile.roll);
          if (!members.length) tx.delete(ref);
          else tx.update(ref, { members, memberRolls, updatedAt: Date.now() });
        }
        tx.set(readerRef(profile.roll), { groupCode: null, updatedAt: Date.now() }, { merge: true });
      });
    },
    async signOut() {
      try { await window.firebase.auth().signOut(); } catch (err) { /* ignore */ }
    }
  };
}
