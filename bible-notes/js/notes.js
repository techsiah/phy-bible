/* Note normalisation and merge helpers. */
import { parseReference, assembleReference, parseTags } from './refs.js';

function makeId() {
  if (window.crypto && typeof window.crypto.randomUUID === 'function') {
    return window.crypto.randomUUID();
  }
  return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
}

export function normalizeNote(raw) {
  if (!raw || typeof raw !== 'object') return null;

  let ref = typeof raw.ref === 'string' ? raw.ref.trim().slice(0, 120) : '';
  let book = typeof raw.book === 'string' ? raw.book.trim().slice(0, 60) : '';
  let chapter = typeof raw.chapter === 'string' ? raw.chapter.trim().slice(0, 20) : '';
  let verse = typeof raw.verse === 'string' ? raw.verse.trim().slice(0, 40) : '';

  if (!ref && (book || chapter || verse)) {
    ref = assembleReference(book, chapter, verse);
  } else if (ref && (!book && !chapter && !verse)) {
    const parsed = parseReference(ref);
    book = parsed.book;
    chapter = parsed.chapter;
    verse = parsed.verse;
  }

  const text = typeof raw.text === 'string' ? raw.text.slice(0, 20000) : '';
  if (!ref && !text) return null;

  const now = Date.now();
  const tags = Array.isArray(raw.tags)
    ? raw.tags
        .filter((tag) => typeof tag === 'string')
        .map((tag) => tag.trim().replace(/^#/, '').slice(0, 24))
        .filter(Boolean)
        .slice(0, 8)
    : parseTags(raw.tags || '');

  const createdAt = Number.isFinite(raw.createdAt) ? raw.createdAt : now;
  const updatedAt = Number.isFinite(raw.updatedAt) ? raw.updatedAt : createdAt;

  return {
    id: typeof raw.id === 'string' && raw.id ? raw.id.slice(0, 80) : makeId(),
    ref,
    book,
    chapter,
    verse,
    text,
    tags,
    pinned: Boolean(raw.pinned),
    createdAt,
    updatedAt
  };
}

export function mergeNotes(localNotes, remoteNotes) {
  const byId = new Map();
  for (const note of localNotes || []) {
    const normalized = normalizeNote(note);
    if (normalized) byId.set(normalized.id, normalized);
  }
  for (const note of remoteNotes || []) {
    const normalized = normalizeNote(note);
    if (!normalized) continue;
    const existing = byId.get(normalized.id);
    if (!existing || normalized.updatedAt >= existing.updatedAt) {
      byId.set(normalized.id, normalized);
    }
  }
  return [...byId.values()].sort(
    (a, b) => (Number(b.pinned) - Number(a.pinned)) || (b.updatedAt - a.updatedAt)
  );
}

export function noteMatches(note, query) {
  const q = String(query || '').trim().toLowerCase();
  if (!q) return true;
  return (
    note.ref.toLowerCase().includes(q) ||
    note.text.toLowerCase().includes(q) ||
    note.tags.some((tag) => tag.toLowerCase().includes(q))
  );
}
