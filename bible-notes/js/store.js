/* Local persistence. Everything here is device-local; Firestore sync lives in
   backend.js. Notes are mirrored to Firestore when a profile exists. */
import { EVENT } from './config.js';
import { normalizeNote } from './notes.js';

const P = 'xmas2026';
const KEYS = {
  profile: `${P}.profile.v1`,
  notes: `${P}.notes.v1`,
  reads: `${P}.reads.v1`,
  milestones: `${P}.milestones.v1`,
  cache: `${P}.cache.v1`,
  theme: `${P}.theme.v1`,
  font: `${P}.font.v1`,
  uid: `${P}.uid.v1`,
  legacyNotes: 'bible-notes.notes.v1',
  legacyTheme: 'bible-notes.theme.v1'
};

export function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (err) {
    return fallback;
  }
}

export function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (err) {
    return false;
  }
}

export function removeKey(key) {
  try { localStorage.removeItem(key); } catch (err) { /* ignore */ }
}

export function uid() {
  if (window.crypto && typeof window.crypto.randomUUID === 'function') {
    return window.crypto.randomUUID();
  }
  return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
}

export function localUid() {
  let id = readJSON(KEYS.uid, null);
  if (!id) {
    id = 'local-' + uid();
    writeJSON(KEYS.uid, id);
  }
  return id;
}

export function loadProfile() {
  const profile = readJSON(KEYS.profile, null);
  if (!profile || typeof profile !== 'object' || !profile.roll) return null;
  return profile;
}

export function saveProfile(profile) {
  return writeJSON(KEYS.profile, profile);
}

export function clearProfile() {
  removeKey(KEYS.profile);
}

export function clearData() {
  Object.values(KEYS).forEach((key) => removeKey(key));
}

export function clearDemo() {
  try {
    const doomed = [];
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (key && key.startsWith('xmas2026.demo.')) doomed.push(key);
    }
    doomed.forEach((key) => localStorage.removeItem(key));
  } catch (err) { /* ignore */ }
}

export function normalizeReads(raw) {
  const out = {};
  if (!raw || typeof raw !== 'object') return out;
  for (const [key, value] of Object.entries(raw)) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(key) || !value || typeof value !== 'object') continue;
    const extraReads = Math.max(0, Math.min(EVENT.points.maxExtras, Number(value.extraReads) || 0));
    const refs = Array.isArray(value.refs)
      ? value.refs.filter((ref) => typeof ref === 'string').map((ref) => ref.slice(0, 120)).slice(0, 4)
      : [];
    out[key] = {
      planRead: Boolean(value.planRead),
      extraReads,
      refs
    };
  }
  return out;
}

export function loadReads() {
  return normalizeReads(readJSON(KEYS.reads, {}));
}

export function saveReads(reads) {
  return writeJSON(KEYS.reads, reads);
}

export function loadNotes() {
  const fresh = readJSON(KEYS.notes, null);
  if (Array.isArray(fresh)) {
    return fresh.map(normalizeNote).filter(Boolean);
  }

  const legacy = readJSON(KEYS.legacyNotes, null);
  if (Array.isArray(legacy)) {
    const migrated = legacy.map(normalizeNote).filter(Boolean);
    writeJSON(KEYS.notes, migrated);
    return migrated;
  }

  return [];
}

export function saveNotes(notes) {
  return writeJSON(KEYS.notes, notes.slice(0, EVENT.maxNotes));
}

export function loadMilestones() {
  const raw = readJSON(KEYS.milestones, []);
  return Array.isArray(raw)
    ? [...new Set(raw.filter((n) => Number.isFinite(n)).map(Number))].sort((a, b) => a - b)
    : [];
}

export function saveMilestones(milestones) {
  return writeJSON(KEYS.milestones, milestones);
}

export function loadCache() {
  const cache = readJSON(KEYS.cache, null);
  if (!cache || !Array.isArray(cache.readers) || !Array.isArray(cache.groups)) return null;
  return cache;
}

export function saveCache(cache) {
  return writeJSON(KEYS.cache, cache);
}

export function getTheme() {
  const theme = readJSON(KEYS.theme, null);
  if (theme === 'day' || theme === 'candle') return theme;
  const legacy = readJSON(KEYS.legacyTheme, null);
  return legacy === 'candle' ? 'candle' : 'day';
}

export function setTheme(theme) {
  const next = theme === 'candle' ? 'candle' : 'day';
  writeJSON(KEYS.theme, next);
  return next;
}

export function getFont() {
  const size = Number(readJSON(KEYS.font, 18));
  return Number.isFinite(size) ? Math.min(24, Math.max(15, size)) : 18;
}

export function setFont(size) {
  const next = Math.min(24, Math.max(15, Number(size) || 18));
  writeJSON(KEYS.font, next);
  return next;
}

export function formatDate(ts) {
  const date = new Date(ts);
  const now = new Date();
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();
  if (sameDay) return 'Today';
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() === now.getFullYear() ? undefined : 'numeric'
  }).format(date);
}

export function longDate(date) {
  return new Intl.DateTimeFormat(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  }).format(date);
}

export function download(filename, text, type = 'application/json') {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export async function copyText(text) {
  if (!text) return false;
  try {
    if (!navigator.clipboard) throw new Error('Clipboard unavailable');
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    const helper = document.createElement('textarea');
    helper.value = text;
    helper.setAttribute('readonly', '');
    helper.style.position = 'fixed';
    helper.style.opacity = '0';
    document.body.append(helper);
    helper.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch (copyErr) { ok = false; }
    helper.remove();
    return ok;
  }
}

export function exportBackup(state) {
  return JSON.stringify({
    app: 'Christmas 2026 · Bible Notes',
    version: 2,
    exportedAt: new Date().toISOString(),
    event: EVENT.id,
    profile: state.profile,
    notes: state.notes,
    reads: state.reads,
    milestones: state.milestones
  }, null, 2);
}

export async function importBackup(file) {
  if (file.size > 5 * 1024 * 1024) throw new Error('That backup is too large.');
  const raw = await file.text();
  const data = JSON.parse(raw);
  const notes = Array.isArray(data)
    ? data
    : Array.isArray(data.notes)
      ? data.notes
      : null;
  if (!notes) throw new Error('Not a Bible Notes backup.');

  return {
    profile: data.profile && data.profile.roll ? data.profile : null,
    notes: notes.map(normalizeNote).filter(Boolean),
    reads: normalizeReads(data.reads || {}),
    milestones: Array.isArray(data.milestones)
      ? [...new Set(data.milestones.filter((n) => Number.isFinite(n)).map(Number))]
      : []
  };
}
