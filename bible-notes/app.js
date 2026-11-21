/* ============================================================
   Bible Notes — private, local, offline.
   No network calls. No accounts. Notes live in localStorage.
   ============================================================ */

(() => {
  'use strict';

  const NOTES_KEY = 'bible-notes.notes.v1';
  const DRAFT_KEY = 'bible-notes.draft.v1';
  const THEME_KEY = 'bible-notes.theme.v1';

  const BOOKS = [
    'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy', 'Joshua', 'Judges', 'Ruth',
    '1 Samuel', '2 Samuel', '1 Kings', '2 Kings', '1 Chronicles', '2 Chronicles', 'Ezra',
    'Nehemiah', 'Esther', 'Job', 'Psalms', 'Proverbs', 'Ecclesiastes', 'Song of Solomon',
    'Isaiah', 'Jeremiah', 'Lamentations', 'Ezekiel', 'Daniel', 'Hosea', 'Joel', 'Amos',
    'Obadiah', 'Jonah', 'Micah', 'Nahum', 'Habakkuk', 'Zephaniah', 'Haggai', 'Zechariah',
    'Malachi', 'Matthew', 'Mark', 'Luke', 'John', 'Acts', 'Romans', '1 Corinthians',
    '2 Corinthians', 'Galatians', 'Ephesians', 'Philippians', 'Colossians', '1 Thessalonians',
    '2 Thessalonians', '1 Timothy', '2 Timothy', 'Titus', 'Philemon', 'Hebrews', 'James',
    '1 Peter', '2 Peter', '1 John', '2 John', '3 John', 'Jude', 'Revelation'
  ];

  const BOOK_CHAPTERS = {
    'Genesis': 50, 'Exodus': 40, 'Leviticus': 27, 'Numbers': 36, 'Deuteronomy': 34,
    'Joshua': 24, 'Judges': 21, 'Ruth': 4, '1 Samuel': 31, '2 Samuel': 24,
    '1 Kings': 22, '2 Kings': 25, '1 Chronicles': 29, '2 Chronicles': 36,
    'Ezra': 10, 'Nehemiah': 13, 'Esther': 10, 'Job': 42, 'Psalms': 150, 'Psalm': 150,
    'Proverbs': 31, 'Ecclesiastes': 12, 'Song of Solomon': 8, 'Isaiah': 66,
    'Jeremiah': 52, 'Lamentations': 5, 'Ezekiel': 48, 'Daniel': 12, 'Hosea': 14,
    'Joel': 3, 'Amos': 9, 'Obadiah': 1, 'Jonah': 4, 'Micah': 7, 'Nahum': 3,
    'Habakkuk': 3, 'Zephaniah': 3, 'Haggai': 2, 'Zechariah': 14, 'Malachi': 4,
    'Matthew': 28, 'Mark': 16, 'Luke': 24, 'John': 21, 'Acts': 28, 'Romans': 16,
    '1 Corinthians': 16, '2 Corinthians': 13, 'Galatians': 6, 'Ephesians': 6,
    'Philippians': 4, 'Colossians': 4, '1 Thessalonians': 5, '2 Thessalonians': 3,
    '1 Timothy': 6, '2 Timothy': 4, 'Titus': 3, 'Philemon': 1, 'Hebrews': 13,
    'James': 5, '1 Peter': 5, '2 Peter': 3, '1 John': 5, '2 John': 1, '3 John': 1,
    'Jude': 1, 'Revelation': 22
  };

  // Public-domain KJV verses, bundled so the page never needs the internet.
  const VERSES = [
    { ref: 'Psalm 119:105', text: 'Thy word is a lamp unto my feet, and a light unto my path.' },
    { ref: 'John 1:1', text: 'In the beginning was the Word, and the Word was with God, and the Word was God.' },
    { ref: 'Proverbs 3:5-6', text: 'Trust in the LORD with all thine heart; and lean not unto thine own understanding.' },
    { ref: 'Isaiah 40:31', text: 'They that wait upon the LORD shall renew their strength; they shall mount up with wings as eagles.' },
    { ref: 'Psalm 23:1', text: 'The LORD is my shepherd; I shall not want.' },
    { ref: 'Philippians 4:6', text: 'Be careful for nothing; but in every thing by prayer and supplication with thanksgiving let your requests be made known unto God.' },
    { ref: 'Matthew 11:28', text: 'Come unto me, all ye that labour and are heavy laden, and I will give you rest.' },
    { ref: 'John 14:27', text: 'Peace I leave with you, my peace I give unto you: not as the world giveth, give I unto you.' },
    { ref: 'Romans 8:28', text: 'All things work together for good to them that love God, to them who are the called according to his purpose.' },
    { ref: 'Jeremiah 29:11', text: 'For I know the thoughts that I think toward you, saith the LORD, thoughts of peace, and not of evil, to give you an expected end.' },
    { ref: 'Psalm 46:10', text: 'Be still, and know that I am God.' },
    { ref: '2 Timothy 3:16', text: 'All scripture is given by inspiration of God, and is profitable for doctrine, for reproof, for correction, for instruction in righteousness.' },
    { ref: 'Hebrews 4:12', text: 'For the word of God is quick, and powerful, and sharper than any twoedged sword.' },
    { ref: 'Joshua 1:9', text: 'Be strong and of a good courage; be not afraid, neither be thou dismayed: for the LORD thy God is with thee whithersoever thou goest.' },
    { ref: 'Psalm 27:1', text: 'The LORD is my light and my salvation; whom shall I fear?' },
    { ref: '1 Corinthians 13:4', text: 'Charity suffereth long, and is kind; charity envieth not; charity vaunteth not itself, is not puffed up.' },
    { ref: 'Galatians 5:22', text: 'But the fruit of the Spirit is love, joy, peace, longsuffering, gentleness, goodness, faith.' },
    { ref: 'Ephesians 2:8', text: 'For by grace are ye saved through faith; and that not of yourselves: it is the gift of God.' },
    { ref: 'Lamentations 3:22-23', text: 'It is of the LORD\u2019s mercies that we are not consumed, because his compassions fail not. They are new every morning.' },
    { ref: 'Psalm 34:8', text: 'O taste and see that the LORD is good: blessed is the man that trusteth in him.' },
    { ref: 'Matthew 6:33', text: 'But seek ye first the kingdom of God, and his righteousness; and all these things shall be added unto you.' },
    { ref: 'John 15:5', text: 'I am the vine, ye are the branches: He that abideth in me, and I in him, the same bringeth forth much fruit.' },
    { ref: 'Romans 12:2', text: 'Be not conformed to this world: but be ye transformed by the renewing of your mind.' },
    { ref: 'Psalm 139:14', text: 'I will praise thee; for I am fearfully and wonderfully made.' },
    { ref: 'Isaiah 41:10', text: 'Fear thou not; for I am with thee: be not dismayed; for I am thy God.' },
    { ref: '1 Peter 5:7', text: 'Casting all your care upon him; for he careth for you.' },
    { ref: 'Micah 6:8', text: 'What doth the LORD require of thee, but to do justly, and to love mercy, and to walk humbly with thy God?' },
    { ref: 'Revelation 21:4', text: 'And God shall wipe away all tears from their eyes; and there shall be no more death, neither sorrow, nor crying.' }
  ];

  const $ = (id) => document.getElementById(id);

  const cover = $('cover');
  const coverPanel = $('coverPanel');
  const openBtn = $('openBtn');
  const desk = $('desk');
  const themeBtn = $('themeBtn');
  const settingsBtn = $('settingsBtn');
  const backupBtn = $('backupBtn');
  const printBtn = $('printBtn');
  const printBtn2 = $('printBtn2');
  const dailyText = $('dailyText');
  const dailyRef = $('dailyRef');
  const todayDate = $('todayDate');
  const printHead = $('printHead');
  const noteForm = $('noteForm');
  const bookInput = $('bookInput');
  const chapterInput = $('chapterInput');
  const verseInput = $('verseInput');
  const refPreview = $('refPreview');
  const chapterList = $('chapterList');
  const refInput = $('refInput');
  const noteText = $('noteText');
  const tagsInput = $('tagsInput');
  const saveBtn = $('saveBtn');
  const cancelEdit = $('cancelEdit');
  const draftStatus = $('draftStatus');
  const searchInput = $('searchInput');
  const notesList = $('notesList');
  const noteCount = $('noteCount');
  const emptyState = $('emptyState');
  const emptyTitle = $('emptyTitle');
  const emptyHint = $('emptyHint');
  const bookList = $('bookList');
  const settingsDialog = $('settingsDialog');
  const closeSettings = $('closeSettings');
  const exportBtn = $('exportBtn');
  const importBtn = $('importBtn');
  const importFile = $('importFile');
  const clearBtn = $('clearBtn');
  const toastEl = $('toast');
  const toastText = $('toastText');
  const toastAction = $('toastAction');

  let notes = [];
  let editingId = null;
  let query = '';
  let opened = false;
  let toastTimer = null;
  let draftTimer = null;
  let storageWarned = false;

  /* ── Small helpers ──────────────────────────────────────── */

  function uid() {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') {
      return window.crypto.randomUUID();
    }
    return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
  }

  function readJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (err) {
      return fallback;
    }
  }

  function writeJSON(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (err) {
      return false;
    }
  }

  function removeKey(key) {
    try { localStorage.removeItem(key); } catch (err) { /* ignore */ }
  }

  function warnStorage() {
    if (storageWarned) return;
    storageWarned = true;
    toast('This browser blocked local saving. Export a backup before closing.');
  }

  function persistNotes() {
    const ok = writeJSON(NOTES_KEY, notes);
    if (!ok) warnStorage();
    return ok;
  }

  function setDraftStatus(message) {
    draftStatus.textContent = message || '';
    draftStatus.classList.toggle('is-visible', Boolean(message));
  }

  function formatDate(ts) {
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

  function longDate(date) {
    return new Intl.DateTimeFormat(undefined, {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  }

  function normalizeNote(raw) {
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
      : [];

    const createdAt = Number.isFinite(raw.createdAt) ? raw.createdAt : now;
    const updatedAt = Number.isFinite(raw.updatedAt) ? raw.updatedAt : createdAt;

    return {
      id: typeof raw.id === 'string' && raw.id ? raw.id.slice(0, 80) : uid(),
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

  function loadNotes() {
    const raw = readJSON(NOTES_KEY, []);
    if (!Array.isArray(raw)) return [];
    const seen = new Set();
    return raw
      .map(normalizeNote)
      .filter((note) => {
        if (!note || seen.has(note.id)) return false;
        seen.add(note.id);
        return true;
      });
  }

  function formatBookName(raw) {
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

  function parseReference(raw) {
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
          if (!bestBook || candidate.length > bestBook.length) {
            bestBook = candidate;
          }
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

    if (!remainder) {
      return { book: bookName, chapter: '', verse: '' };
    }

    remainder = remainder.replace(/\s*[\u2013\u2014-]\s*/g, '\u2013');
    const isSingleChapter = BOOK_CHAPTERS[bookName] === 1;

    const cvMatch = remainder.match(/^(\d+)\s*[:\.]\s*(\S+.*)$/);
    if (cvMatch) {
      return {
        book: bookName,
        chapter: cvMatch[1].trim(),
        verse: cvMatch[2].trim()
      };
    }

    if (/^\d+$/.test(remainder)) {
      if (isSingleChapter) {
        return {
          book: bookName,
          chapter: '1',
          verse: remainder
        };
      }
      return {
        book: bookName,
        chapter: remainder,
        verse: ''
      };
    }

    const vMatch = remainder.match(/^(?:v|vs|verse|verses)\.?\s*(\S+.*)$/i);
    if (vMatch) {
      return {
        book: bookName,
        chapter: isSingleChapter ? '1' : '',
        verse: vMatch[1].trim()
      };
    }

    return {
      book: bookName,
      chapter: remainder,
      verse: ''
    };
  }

  function assembleReference(book, chapter, verse) {
    const b = formatBookName(book);
    const c = (chapter || '').trim();
    let v = (verse || '').trim().replace(/\s*[\u2013\u2014-]\s*/g, '\u2013');

    if (!b && !c && !v) return '';

    if (!c && !v) {
      return b;
    }

    if (b) {
      if (c && v) return `${b} ${c}:${v}`;
      if (c) return `${b} ${c}`;
      return `${b} :${v}`;
    }

    if (c && v) return `${c}:${v}`;
    if (c) return `${c}`;
    return `${v}`;
  }

  function formatReference(raw) {
    const parsed = parseReference(raw);
    return assembleReference(parsed.book, parsed.chapter, parsed.verse);
  }

  function updateChapterList(bookName) {
    if (!chapterList) return;
    chapterList.replaceChildren();
    const count = BOOK_CHAPTERS[bookName] || (bookName === 'Psalm' ? 150 : 0);
    if (!count) return;
    const fragment = document.createDocumentFragment();
    for (let i = 1; i <= count; i++) {
      const opt = document.createElement('option');
      opt.value = String(i);
      fragment.append(opt);
    }
    chapterList.append(fragment);
  }

  function updateReferenceFromParts() {
    const full = assembleReference(bookInput.value, chapterInput.value, verseInput.value);
    refInput.value = full;
    if (refPreview) {
      refPreview.textContent = full || '';
    }
    return full;
  }

  function setReferenceFields(refString) {
    const parsed = parseReference(refString || '');
    bookInput.value = parsed.book;
    chapterInput.value = parsed.chapter;
    verseInput.value = parsed.verse;
    updateChapterList(parsed.book);
    updateReferenceFromParts();
  }

  function parseTags(raw) {
    const seen = new Set();
    const tags = [];
    raw.split(',').forEach((part) => {
      const tag = part.trim().replace(/^#/, '').replace(/\s+/g, ' ').slice(0, 24);
      if (!tag) return;
      const key = tag.toLowerCase();
      if (seen.has(key) || tags.length >= 8) return;
      seen.add(key);
      tags.push(tag);
    });
    return tags;
  }

  /* ── Toast ──────────────────────────────────────────────── */

  function hideToast() {
    window.clearTimeout(toastTimer);
    toastEl.classList.remove('is-visible');
    toastEl.hidden = true;
  }

  function toast(message, action) {
    window.clearTimeout(toastTimer);
    toastText.textContent = message;

    if (action) {
      toastAction.hidden = false;
      toastAction.textContent = action.label;
      toastAction.onclick = () => {
        hideToast();
        action.onClick();
      };
    } else {
      toastAction.hidden = true;
      toastAction.onclick = null;
    }

    toastEl.hidden = false;
    requestAnimationFrame(() => toastEl.classList.add('is-visible'));
    toastTimer = window.setTimeout(hideToast, action ? (action.duration || 7000) : 3200);
  }

  /* ── Theme ──────────────────────────────────────────────── */

  function setTheme(theme) {
    const next = theme === 'candle' ? 'candle' : 'day';
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem(THEME_KEY, next); } catch (err) { /* ignore */ }

    themeBtn.setAttribute(
      'aria-label',
      next === 'day' ? 'Switch to candlelight' : 'Switch to daylight'
    );

    document.querySelectorAll('[data-theme-choice]').forEach((btn) => {
      btn.setAttribute('aria-pressed', String(btn.dataset.themeChoice === next));
    });

    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', next === 'day' ? '#140f0c' : '#090706');
  }

  /* ── Cover ──────────────────────────────────────────────── */

  function openBible() {
    if (opened) return;
    opened = true;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.body.classList.remove('cover-open');
    document.body.classList.add('is-open');
    desk.inert = false;
    cover.inert = true;

    window.setTimeout(() => { cover.hidden = true; }, reduced ? 20 : 1200);
    window.setTimeout(() => {
      const target = noteText.value.trim() ? noteText : (bookInput.value.trim() ? chapterInput : bookInput);
      target.focus({ preventScroll: true });
      if (target === noteText) {
        const end = noteText.value.length;
        noteText.setSelectionRange(end, end);
      }
    }, reduced ? 60 : 950);
  }

  /* ── Daily verse and dates ──────────────────────────────── */

  function renderDaily() {
    const now = new Date();
    const dayNumber = Math.floor(
      new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() / 86400000
    );
    const verse = VERSES[((dayNumber % VERSES.length) + VERSES.length) % VERSES.length];
    dailyText.textContent = '\u201C' + verse.text + '\u201D';
    dailyRef.textContent = '\u2014 ' + verse.ref;

    todayDate.textContent = new Intl.DateTimeFormat(undefined, {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    }).format(now);

    printHead.textContent = 'Bible Notes \u00B7 ' + longDate(now);
  }

  function populateBooks() {
    BOOKS.forEach((book) => {
      const option = document.createElement('option');
      option.value = book;
      bookList.append(option);
    });
  }

  /* ── Rendering the margins ──────────────────────────────── */

  function filteredNotes() {
    const q = query.toLowerCase();
    return notes
      .filter((note) => {
        if (!q) return true;
        return (
          note.ref.toLowerCase().includes(q) ||
          (note.book && note.book.toLowerCase().includes(q)) ||
          note.text.toLowerCase().includes(q) ||
          note.tags.some((tag) => tag.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => (Number(b.pinned) - Number(a.pinned)) || (b.updatedAt - a.updatedAt));
  }

  function actionButton(act, label, note, extraClass) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'note-action' + (extraClass ? ' ' + extraClass : '');
    btn.dataset.act = act;
    btn.textContent = label;
    btn.setAttribute('aria-label', label + ' note' + (note.ref ? ' ' + note.ref : ''));
    return btn;
  }

  function buildNote(note) {
    const item = document.createElement('li');
    item.className = 'note' + (note.pinned ? ' pinned' : '');
    item.dataset.id = note.id;

    const labelParts = [];
    if (note.ref) labelParts.push(note.ref);
    if (note.text) labelParts.push(note.text);
    if (note.tags.length) labelParts.push('Tags: ' + note.tags.join(', '));
    if (labelParts.length) item.setAttribute('aria-label', labelParts.join('. '));

    const top = document.createElement('div');
    top.className = 'note-top';

    const title = document.createElement('div');
    title.className = 'note-title';

    if (note.ref) {
      const ref = document.createElement('button');
      ref.type = 'button';
      ref.className = 'note-ref';
      ref.dataset.act = 'copy';
      ref.title = 'Copy reference';
      ref.textContent = note.ref;
      title.append(ref);
    } else {
      const ref = document.createElement('span');
      ref.className = 'note-ref is-empty';
      ref.textContent = 'Note';
      title.append(ref);
    }

    if (note.pinned) {
      const pin = document.createElement('span');
      pin.className = 'pin-mark';
      pin.textContent = '\u2726';
      pin.title = 'Pinned';
      pin.setAttribute('aria-label', 'Pinned');
      title.append(pin);
    }

    const date = document.createElement('span');
    date.className = 'note-date';
    date.textContent = formatDate(note.updatedAt);

    top.append(title, date);
    item.append(top);

    if (note.text) {
      const text = document.createElement('p');
      text.className = 'note-text';
      text.textContent = note.text;
      item.append(text);
    }

    if (note.tags.length) {
      const tags = document.createElement('div');
      tags.className = 'note-tags';
      note.tags.forEach((tag) => {
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'tag';
        chip.dataset.act = 'tag';
        chip.dataset.tag = tag;
        chip.textContent = '#' + tag;
        chip.setAttribute('aria-label', 'Search notes tagged ' + tag);
        tags.append(chip);
      });
      item.append(tags);
    }

    const actions = document.createElement('div');
    actions.className = 'note-actions';
    actions.append(
      actionButton('pin', note.pinned ? 'Unpin' : 'Pin', note),
      actionButton('edit', 'Edit', note),
      actionButton('delete', 'Delete', note, 'danger')
    );
    item.append(actions);

    return item;
  }

  function renderNotes() {
    const visible = filteredNotes();
    notesList.replaceChildren(...visible.map(buildNote));

    const total = notes.length;
    if (!total) {
      noteCount.textContent = '';
    } else if (query) {
      noteCount.textContent = visible.length + ' of ' + total;
    } else {
      noteCount.textContent = total + ' ' + (total === 1 ? 'note' : 'notes');
    }

    emptyState.hidden = visible.length > 0;
    if (!visible.length) {
      if (query) {
        emptyTitle.textContent = 'Nothing found in the margins.';
        emptyHint.textContent =
          'No notes match \u201C' + searchInput.value.trim() + '\u201D. Clear the search to see them all.';
      } else {
        emptyTitle.textContent = 'Your margins are waiting.';
        emptyHint.textContent = 'Write your first note on the left.';
      }
    }
  }

  /* ── Writing, editing, deleting ─────────────────────────── */

  function setEditing(id) {
    editingId = id || null;
    saveBtn.textContent = editingId ? 'Update note' : 'Save note';
    cancelEdit.hidden = !editingId;
  }

  function saveDraftNow() {
    const fullRef = updateReferenceFromParts();
    const hasContent =
      fullRef || noteText.value.trim() || tagsInput.value.trim();
    if (!hasContent) {
      removeKey(DRAFT_KEY);
      setDraftStatus('');
      return;
    }
    const ok = writeJSON(DRAFT_KEY, {
      ref: fullRef,
      book: bookInput.value,
      chapter: chapterInput.value,
      verse: verseInput.value,
      text: noteText.value,
      tags: tagsInput.value,
      editingId
    });
    setDraftStatus(ok ? 'Draft kept on this device' : 'This browser blocked the draft');
  }

  function saveDraftSoon() {
    window.clearTimeout(draftTimer);
    draftTimer = window.setTimeout(saveDraftNow, 250);
  }

  function resetForm() {
    noteForm.reset();
    bookInput.value = '';
    chapterInput.value = '';
    verseInput.value = '';
    refInput.value = '';
    if (refPreview) refPreview.textContent = '';
    updateChapterList('');
    setEditing(null);
    setDraftStatus('');
    window.clearTimeout(draftTimer);
    removeKey(DRAFT_KEY);
  }

  function saveNote() {
    const ref = updateReferenceFromParts();
    const book = bookInput.value.trim();
    const chapter = chapterInput.value.trim();
    const verse = verseInput.value.trim();
    const text = noteText.value.trim();
    const tags = parseTags(tagsInput.value);

    if (!ref && !text) {
      toast('Write a reference or a note first.');
      bookInput.focus();
      return;
    }

    const now = Date.now();

    if (editingId) {
      const existing = notes.find((note) => note.id === editingId);
      if (existing) {
        existing.ref = ref;
        existing.book = book;
        existing.chapter = chapter;
        existing.verse = verse;
        existing.text = text;
        existing.tags = tags;
        existing.updatedAt = now;
        persistNotes();
        renderNotes();
        resetForm();
        toast('Note updated.');
        bookInput.focus();
        return;
      }
      setEditing(null);
    }

    notes.unshift({
      id: uid(),
      ref,
      book,
      chapter,
      verse,
      text,
      tags,
      pinned: false,
      createdAt: now,
      updatedAt: now
    });
    persistNotes();
    renderNotes();
    resetForm();
    toast('Note saved.');
    bookInput.focus();
  }

  function startEdit(note) {
    setEditing(note.id);
    if (note.book || note.chapter || note.verse) {
      bookInput.value = note.book || '';
      chapterInput.value = note.chapter || '';
      verseInput.value = note.verse || '';
      updateChapterList(note.book);
      updateReferenceFromParts();
    } else {
      setReferenceFields(note.ref || '');
    }
    noteText.value = note.text;
    tagsInput.value = note.tags.join(', ');
    setDraftStatus('Editing a saved note');
    saveDraftNow();

    if (window.innerWidth < 900) {
      noteForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    noteText.focus({ preventScroll: true });
    const end = noteText.value.length;
    noteText.setSelectionRange(end, end);
  }

  function deleteNote(id) {
    const index = notes.findIndex((note) => note.id === id);
    if (index < 0) return;
    const removed = notes.splice(index, 1)[0];
    persistNotes();
    renderNotes();
    if (editingId === id) resetForm();

    toast('Note deleted.', {
      label: 'Undo',
      duration: 7000,
      onClick() {
        notes.push(removed);
        persistNotes();
        renderNotes();
        toast('Note restored.');
      }
    });
  }

  function clearAllNotes() {
    if (!notes.length) {
      settingsDialog.close();
      toast('There are no notes to delete.');
      return;
    }
    if (!window.confirm('Delete all notes? This cannot be undone.')) return;
    notes = [];
    persistNotes();
    resetForm();
    renderNotes();
    settingsDialog.close();
    toast('All notes deleted.');
  }

  /* ── Clipboard ──────────────────────────────────────────── */

  async function copyText(text) {
    if (!text) return;
    try {
      if (!navigator.clipboard) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(text);
    } catch (err) {
      const helper = document.createElement('textarea');
      helper.value = text;
      helper.setAttribute('readonly', '');
      helper.style.position = 'fixed';
      helper.style.opacity = '0';
      document.body.append(helper);
      helper.select();
      try {
        document.execCommand('copy');
      } catch (copyErr) {
        helper.remove();
        toast('Could not copy the reference.');
        return;
      }
      helper.remove();
    }
    toast('Reference copied.');
  }

  /* ── Backup and restore ─────────────────────────────────── */

  function exportBackup() {
    if (!notes.length) {
      settingsDialog.close();
      toast('There are no notes to back up yet.');
      return;
    }

    const payload = {
      app: 'Bible Notes',
      version: 1,
      exportedAt: new Date().toISOString(),
      notes
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'bible-notes-' + new Date().toISOString().slice(0, 10) + '.json';
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1500);

    settingsDialog.close();
    toast('Backup downloaded.');
  }

  async function importBackupFile(file) {
    if (file.size > 5 * 1024 * 1024) {
      settingsDialog.close();
      toast('That backup is too large.');
      return;
    }

    try {
      const raw = await file.text();
      const data = JSON.parse(raw);
      const list = Array.isArray(data)
        ? data
        : data && Array.isArray(data.notes)
          ? data.notes
          : null;
      if (!list) throw new Error('Not a backup');

      let added = 0;
      let updated = 0;
      list.forEach((rawNote) => {
        const incoming = normalizeNote(rawNote);
        if (!incoming) return;
        const existing = notes.find((note) => note.id === incoming.id);
        if (!existing) {
          notes.push(incoming);
          added += 1;
        } else if (incoming.updatedAt > existing.updatedAt) {
          Object.assign(existing, incoming);
          updated += 1;
        }
      });

      if (!added && !updated) {
        settingsDialog.close();
        toast('No new notes in that backup.');
        return;
      }

      persistNotes();
      renderNotes();
      settingsDialog.close();
      const count = added + updated;
      toast('Imported ' + count + ' note' + (count === 1 ? '.' : 's.'));
    } catch (err) {
      settingsDialog.close();
      toast('That file is not a Bible Notes backup.');
    }
  }

  /* ── Printing ───────────────────────────────────────────── */

  function printNotes() {
    const savedQuery = query;
    if (savedQuery) {
      searchInput.value = '';
      query = '';
      renderNotes();
    }

    printHead.textContent = 'Bible Notes \u00B7 ' + longDate(new Date());

    let restored = false;
    const restore = () => {
      if (restored) return;
      restored = true;
      if (savedQuery) {
        searchInput.value = savedQuery;
        query = savedQuery;
        renderNotes();
      }
      window.removeEventListener('afterprint', restore);
    };

    window.addEventListener('afterprint', restore);
    window.print();
    window.setTimeout(restore, 1500);
  }

  /* ── Settings dialog ────────────────────────────────────── */

  function openSettings() {
    if (typeof settingsDialog.showModal === 'function') {
      settingsDialog.showModal();
    } else {
      settingsDialog.setAttribute('open', '');
    }
  }

  /* ── Event handling ─────────────────────────────────────── */

  function handleNoteAction(event) {
    const button = event.target.closest('button');
    if (!button || !notesList.contains(button)) return;

    const item = button.closest('.note');
    if (!item) return;
    const note = notes.find((entry) => entry.id === item.dataset.id);
    if (!note) return;

    const act = button.dataset.act;
    if (act === 'copy') {
      copyText(note.ref);
      return;
    }
    if (act === 'tag') {
      searchInput.value = button.dataset.tag || '';
      query = searchInput.value.trim().toLowerCase();
      renderNotes();
      return;
    }
    if (act === 'pin') {
      note.pinned = !note.pinned;
      persistNotes();
      renderNotes();
      toast(note.pinned ? 'Pinned to the top.' : 'Unpinned.');
      return;
    }
    if (act === 'edit') {
      startEdit(note);
      return;
    }
    if (act === 'delete') {
      deleteNote(note.id);
    }
  }

  function isTyping(target) {
    if (!target) return false;
    const tag = target.tagName;
    return (
      tag === 'INPUT' ||
      tag === 'TEXTAREA' ||
      tag === 'SELECT' ||
      target.isContentEditable
    );
  }

  function handleShortcuts(event) {
    if (!opened) {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openBible();
      }
      return;
    }

    const mod = event.ctrlKey || event.metaKey;

    if (mod && event.key.toLowerCase() === 's') {
      event.preventDefault();
      if (!settingsDialog.open) saveNote();
      return;
    }

    if (mod && event.key === 'Enter') {
      event.preventDefault();
      if (!settingsDialog.open) saveNote();
      return;
    }

    if (event.key === '/' && !isTyping(event.target) && !settingsDialog.open) {
      event.preventDefault();
      searchInput.focus();
    }
  }

  function restoreDraft() {
    const draft = readJSON(DRAFT_KEY, null);
    if (!draft || typeof draft !== 'object') return;

    if (draft.book || draft.chapter || draft.verse) {
      bookInput.value = typeof draft.book === 'string' ? draft.book : '';
      chapterInput.value = typeof draft.chapter === 'string' ? draft.chapter : '';
      verseInput.value = typeof draft.verse === 'string' ? draft.verse : '';
      updateChapterList(bookInput.value);
      updateReferenceFromParts();
    } else if (typeof draft.ref === 'string' && draft.ref) {
      setReferenceFields(draft.ref);
    }

    noteText.value = typeof draft.text === 'string' ? draft.text : '';
    tagsInput.value = typeof draft.tags === 'string' ? draft.tags : '';

    if (typeof draft.editingId === 'string' && notes.some((note) => note.id === draft.editingId)) {
      setEditing(draft.editingId);
      setDraftStatus('Editing a saved note \u00B7 draft restored');
    } else if (refInput.value.trim() || noteText.value.trim()) {
      setDraftStatus('Draft restored');
    }
  }

  function bindEvents() {
    openBtn.addEventListener('click', (event) => {
      event.stopPropagation();
      openBible();
    });
    cover.addEventListener('click', openBible);

    themeBtn.addEventListener('click', () => {
      const current = document.documentElement.dataset.theme;
      setTheme(current === 'candle' ? 'day' : 'candle');
    });

    document.querySelectorAll('[data-theme-choice]').forEach((btn) => {
      btn.addEventListener('click', () => setTheme(btn.dataset.themeChoice));
    });

    settingsBtn.addEventListener('click', openSettings);
    backupBtn.addEventListener('click', openSettings);
    closeSettings.addEventListener('click', () => settingsDialog.close());
    settingsDialog.addEventListener('click', (event) => {
      if (event.target === settingsDialog) settingsDialog.close();
    });

    noteForm.addEventListener('submit', (event) => {
      event.preventDefault();
      saveNote();
    });

    bookInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        if (chapterInput.value.trim()) {
          (verseInput.value.trim() ? noteText : verseInput).focus();
        } else {
          chapterInput.focus();
        }
      }
    });

    chapterInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        verseInput.focus();
      }
    });

    verseInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        noteText.focus();
      }
    });

    bookInput.addEventListener('input', () => {
      const raw = bookInput.value;
      if (/\d/.test(raw) || raw.includes(':')) {
        const parsed = parseReference(raw);
        if (parsed.chapter || parsed.verse) {
          bookInput.value = parsed.book;
          if (parsed.chapter) chapterInput.value = parsed.chapter;
          if (parsed.verse) verseInput.value = parsed.verse;
        }
      }
      updateChapterList(bookInput.value);
      updateReferenceFromParts();
      saveDraftSoon();
    });

    bookInput.addEventListener('blur', () => {
      bookInput.value = formatBookName(bookInput.value);
      updateChapterList(bookInput.value);
      updateReferenceFromParts();
      saveDraftSoon();
    });

    chapterInput.addEventListener('input', () => {
      updateReferenceFromParts();
      saveDraftSoon();
    });

    chapterInput.addEventListener('blur', () => {
      chapterInput.value = chapterInput.value.trim();
      updateReferenceFromParts();
      saveDraftSoon();
    });

    verseInput.addEventListener('input', () => {
      updateReferenceFromParts();
      saveDraftSoon();
    });

    verseInput.addEventListener('blur', () => {
      verseInput.value = verseInput.value.trim().replace(/\s*[\u2013\u2014-]\s*/g, '\u2013');
      updateReferenceFromParts();
      saveDraftSoon();
    });

    [noteText, tagsInput].forEach((input) => {
      input.addEventListener('input', saveDraftSoon);
    });

    cancelEdit.addEventListener('click', () => {
      resetForm();
      bookInput.focus();
    });

    searchInput.addEventListener('input', () => {
      query = searchInput.value.trim().toLowerCase();
      renderNotes();
    });
    searchInput.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && searchInput.value) {
        searchInput.value = '';
        query = '';
        renderNotes();
      }
    });

    notesList.addEventListener('click', handleNoteAction);

    printBtn.addEventListener('click', printNotes);
    printBtn2.addEventListener('click', printNotes);
    exportBtn.addEventListener('click', exportBackup);
    importBtn.addEventListener('click', () => importFile.click());
    importFile.addEventListener('change', async () => {
      const file = importFile.files && importFile.files[0];
      importFile.value = '';
      if (file) await importBackupFile(file);
    });
    clearBtn.addEventListener('click', clearAllNotes);

    document.addEventListener('keydown', handleShortcuts);
  }

  /* ── Begin ──────────────────────────────────────────────── */

  function init() {
    setTheme(document.documentElement.dataset.theme === 'candle' ? 'candle' : 'day');
    populateBooks();
    renderDaily();
    notes = loadNotes();
    restoreDraft();
    renderNotes();
    bindEvents();
  }

  init();
})();
