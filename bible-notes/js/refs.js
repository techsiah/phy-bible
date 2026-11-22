/* Scripture reference parsing and validation. Catholic canon, CPDV-friendly. */

export const BOOKS = [
  'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy', 'Joshua', 'Judges', 'Ruth',
  '1 Samuel', '2 Samuel', '1 Kings', '2 Kings', '1 Chronicles', '2 Chronicles', 'Ezra',
  'Nehemiah', 'Tobit', 'Judith', 'Esther', '1 Maccabees', '2 Maccabees', 'Job', 'Psalms',
  'Proverbs', 'Ecclesiastes', 'Song of Solomon', 'Wisdom', 'Sirach', 'Isaiah', 'Jeremiah',
  'Lamentations', 'Baruch', 'Ezekiel', 'Daniel', 'Hosea', 'Joel', 'Amos', 'Obadiah', 'Jonah',
  'Micah', 'Nahum', 'Habakkuk', 'Zephaniah', 'Haggai', 'Zechariah', 'Malachi', 'Matthew',
  'Mark', 'Luke', 'John', 'Acts', 'Romans', '1 Corinthians', '2 Corinthians', 'Galatians',
  'Ephesians', 'Philippians', 'Colossians', '1 Thessalonians', '2 Thessalonians', '1 Timothy',
  '2 Timothy', 'Titus', 'Philemon', 'Hebrews', 'James', '1 Peter', '2 Peter', '1 John',
  '2 John', '3 John', 'Jude', 'Revelation'
];

export const BOOK_CHAPTERS = {
  Genesis: 50, Exodus: 40, Leviticus: 27, Numbers: 36, Deuteronomy: 34,
  Joshua: 24, Judges: 21, Ruth: 4, '1 Samuel': 31, '2 Samuel': 24,
  '1 Kings': 22, '2 Kings': 25, '1 Chronicles': 29, '2 Chronicles': 36,
  Ezra: 10, Nehemiah: 13, Tobit: 14, Judith: 16, Esther: 16,
  '1 Maccabees': 16, '2 Maccabees': 15, Job: 42, Psalms: 150, Psalm: 150,
  Proverbs: 31, Ecclesiastes: 12, 'Song of Solomon': 8, Wisdom: 19, Sirach: 51,
  Isaiah: 66, Jeremiah: 52, Lamentations: 5, Baruch: 6, Ezekiel: 48, Daniel: 14,
  Hosea: 14, Joel: 3, Amos: 9, Obadiah: 1, Jonah: 4, Micah: 7, Nahum: 3,
  Habakkuk: 3, Zephaniah: 3, Haggai: 2, Zechariah: 14, Malachi: 4,
  Matthew: 28, Mark: 16, Luke: 24, John: 21, Acts: 28, Romans: 16,
  '1 Corinthians': 16, '2 Corinthians': 13, Galatians: 6, Ephesians: 6,
  Philippians: 4, Colossians: 4, '1 Thessalonians': 5, '2 Thessalonians': 3,
  '1 Timothy': 6, '2 Timothy': 4, Titus: 3, Philemon: 1, Hebrews: 13,
  James: 5, '1 Peter': 5, '2 Peter': 3, '1 John': 5, '2 John': 1, '3 John': 1,
  Jude: 1, Revelation: 22
};

const SINGLE_CHAPTER = new Set(['Obadiah', 'Philemon', '2 John', '3 John', 'Jude']);

export function chaptersFor(book) {
  return BOOK_CHAPTERS[book] || (book === 'Psalm' ? 150 : 0);
}

export function formatBookName(raw) {
  let value = (raw || '').trim().replace(/\s+/g, ' ');
  if (!value) return '';

  const lower = value.toLowerCase();
  if (lower === 'psalm') return 'Psalm';

  let matched = null;
  for (const candidate of BOOKS) {
    const cl = candidate.toLowerCase();
    if (lower === cl) return candidate;
    if (lower.startsWith(cl + ' ') || lower.startsWith(cl + ':')) {
      if (!matched || candidate.length > matched.length) matched = candidate;
    }
  }

  if (matched) return matched;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function parseReference(raw) {
  if (!raw || typeof raw !== 'string') return { book: '', chapter: '', verse: '' };
  const trimmed = raw.trim().replace(/\s+/g, ' ');
  if (!trimmed) return { book: '', chapter: '', verse: '' };

  const lower = trimmed.toLowerCase();
  let bestBook = null;

  if (lower === 'psalm' || lower.startsWith('psalm ') || lower.startsWith('psalm:')) {
    bestBook = 'Psalm';
  } else {
    for (const candidate of BOOKS) {
      const bl = candidate.toLowerCase();
      if (lower === bl || lower.startsWith(bl + ' ') || lower.startsWith(bl + ':')) {
        if (!bestBook || candidate.length > bestBook.length) bestBook = candidate;
      }
    }
  }

  let remainder = '';
  let bookName = '';

  if (bestBook) {
    bookName = bestBook;
    remainder = trimmed.slice(bestBook.length).trim();
    if (remainder.startsWith(':')) remainder = remainder.slice(1).trim();
  } else {
    const match = trimmed.match(/^(.+?)(?:\s+(\d+.*))?$/);
    if (match) {
      bookName = match[1].trim();
      remainder = (match[2] || '').trim();
    } else {
      bookName = trimmed;
    }
  }

  if (!remainder) return { book: bookName, chapter: '', verse: '' };

  remainder = remainder.replace(/\s*[\u2013\u2014-]\s*/g, '\u2013');
  const isSingleChapter = SINGLE_CHAPTER.has(bookName);

  const cvMatch = remainder.match(/^(\d+)\s*[:.]\s*(\S.*)$/);
  if (cvMatch) {
    return { book: bookName, chapter: cvMatch[1].trim(), verse: cvMatch[2].trim() };
  }

  if (/^\d+$/.test(remainder)) {
    if (isSingleChapter) return { book: bookName, chapter: '1', verse: remainder };
    return { book: bookName, chapter: remainder, verse: '' };
  }

  const vMatch = remainder.match(/^(?:v|vs|verse|verses)\.?\s*(\S.*)$/i);
  if (vMatch) {
    return {
      book: bookName,
      chapter: isSingleChapter ? '1' : '',
      verse: vMatch[1].trim()
    };
  }

  return { book: bookName, chapter: remainder, verse: '' };
}

export function assembleReference(book, chapter, verse) {
  const b = formatBookName(book);
  const c = (chapter || '').trim();
  const v = (verse || '').trim().replace(/\s*[\u2013\u2014-]\s*/g, '\u2013');

  if (!b && !c && !v) return '';
  if (!c && !v) return b;
  if (b) {
    if (c && v) return `${b} ${c}:${v}`;
    if (c) return `${b} ${c}`;
    return `${b} :${v}`;
  }
  if (c && v) return `${c}:${v}`;
  if (c) return `${c}`;
  return `${v}`;
}

export function formatReference(raw) {
  const parsed = parseReference(raw);
  return assembleReference(parsed.book, parsed.chapter, parsed.verse);
}

export function parseTags(raw) {
  const seen = new Set();
  const tags = [];
  String(raw || '').split(',').forEach((part) => {
    const tag = part.trim().replace(/^#/, '').replace(/\s+/g, ' ').slice(0, 24);
    if (!tag) return;
    const key = tag.toLowerCase();
    if (seen.has(key) || tags.length >= 8) return;
    seen.add(key);
    tags.push(tag);
  });
  return tags;
}

export function normalizeRoll(raw) {
  return String(raw || '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, ' ')
    .replace(/\//g, '-')
    .replace(/[^A-Z0-9 ._-]/g, '')
    .slice(0, 24);
}

export function isValidRoll(raw) {
  const roll = normalizeRoll(raw);
  return roll.length >= 1 && roll.length <= 24 && roll !== '..' && roll !== '.';
}

export function normalizeGroupCode(raw) {
  return String(raw || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 6);
}
