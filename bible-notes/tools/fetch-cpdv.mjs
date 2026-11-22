/* Fetch the public-domain Catholic Public Domain Version (CPDV) from
   sacredbible.org and generate js/plan.js.

   The source pages are windows-1252. We decode them explicitly, strip the
   HTML, and pull the verses we need. Run: node tools/fetch-cpdv.mjs
*/
import { writeFile } from 'node:fs/promises';

const BASE = 'https://sacredbible.org/catholic/';

const BOOK_FILES = {
  Isaiah: 'OT-27_Isaiah.htm',
  Micah: 'OT-38_Micah.htm',
  Zephaniah: 'OT-41_Zephaniah.htm',
  Baruch: 'OT-30_Baruch.htm',
  Malachi: 'OT-44_Malachi.htm',
  Matthew: 'NT-01_Matthew.htm',
  Luke: 'NT-03_Luke.htm',
  John: 'NT-04_John.htm',
  Titus: 'NT-17_Titus.htm',
  Hebrews: 'NT-19_Hebrews.htm'
};

const PLAN = [
  { day: 1, theme: 'Hope', title: 'The Mountain of the Lord', ref: 'Isaiah 2:1-5', prompt: 'Where is God asking you to walk in his light this Advent?' },
  { day: 2, theme: 'Promise', title: 'The Shoot of Jesse', ref: 'Isaiah 11:1-10', prompt: 'Which fruit of the Spirit do you most need this season?' },
  { day: 3, theme: 'Feast', title: 'Death Swallowed Up', ref: 'Isaiah 25:6-10', prompt: 'What tears is God wiping away in your life right now?' },
  { day: 4, theme: 'Healing', title: 'The Desert Blooms', ref: 'Isaiah 35:1-10', prompt: 'Name one dry place where you are asking God for streams of water.' },
  { day: 5, theme: 'Comfort', title: 'Prepare the Way', ref: 'Isaiah 40:1-11', prompt: 'What valley needs to be filled in your heart before Christmas?' },
  { day: 6, theme: 'Anointing', title: 'Good News to the Poor', ref: 'Isaiah 61:1-11', prompt: 'Who near you needs good news, healing, or freedom today?' },
  { day: 7, theme: 'Sign', title: 'Emmanuel', ref: 'Isaiah 7:10-14', prompt: 'What would it mean for you to trust the sign God has already given?' },
  { day: 8, theme: 'Place', title: 'Bethlehem', ref: 'Micah 5:1-4', prompt: 'God chooses the small and overlooked. Where do you feel small?' },
  { day: 9, theme: 'Joy', title: 'The Lord in Your Midst', ref: 'Zephaniah 3:14-18', prompt: 'What would change if you believed God rejoices over you?' },
  { day: 10, theme: 'Glory', title: 'Jerusalem Restored', ref: 'Baruch 5:1-9', prompt: 'What robe of mourning is God asking you to take off?' },
  { day: 11, theme: 'Messenger', title: "The Refiner's Fire", ref: 'Malachi 3:1-4', prompt: 'What needs refining in you before the Lord comes?' },
  { day: 12, theme: 'Silence', title: "Zechariah's Silence", ref: 'Luke 1:5-25', prompt: 'What might God be saying in the silence you avoid?' },
  { day: 13, theme: 'Yes', title: "Mary's Fiat", ref: 'Luke 1:26-38', prompt: 'What is your "yes" to God this Christmas?' },
  { day: 14, theme: 'Praise', title: 'The Magnificat', ref: 'Luke 1:39-56', prompt: 'Write your own Magnificat: what has God done for you?' },
  { day: 15, theme: 'Mercy', title: 'The Benedictus', ref: 'Luke 1:57-80', prompt: 'How has God shown tender mercy to you this year?' },
  { day: 16, theme: 'Roots', title: 'The Genealogy of Jesus', ref: 'Matthew 1:1-17', prompt: 'God works through imperfect families. What does that say about yours?' },
  { day: 17, theme: 'Trust', title: "Joseph's Dream", ref: 'Matthew 1:18-25', prompt: 'Where is God asking you to trust him with a difficult decision?' },
  { day: 18, theme: 'Birth', title: 'The Manger', ref: 'Luke 2:1-7', prompt: 'Make room in the inn of your heart. What needs to move?' },
  { day: 19, theme: 'Witness', title: 'The Shepherds', ref: 'Luke 2:8-20', prompt: 'Who will you tell about the good news this Christmas?' },
  { day: 20, theme: 'Word', title: 'The Word and the Light', ref: 'John 1:1-18', prompt: 'Where is the light shining in your darkness?' },
  { day: 21, theme: 'Gift', title: 'A Child Is Born', ref: 'Isaiah 9:1-6', prompt: 'What name of the child means most to you today?' },
  { day: 22, theme: 'Grace', title: 'Grace Has Appeared', ref: 'Titus 2:11-14', prompt: 'What would a grace-filled Christmas look like for you?' },
  { day: 23, theme: 'Son', title: "God's Final Word", ref: 'Hebrews 1:1-6', prompt: 'What is God saying to you through his Son this Advent?' },
  { day: 24, theme: 'Offering', title: 'The Presentation', ref: 'Luke 2:22-40', prompt: 'What are you bringing to offer at Christmas?' },
  { day: 25, theme: 'Christmas', title: 'Glory to God', ref: 'Luke 2:1-20', prompt: 'On Christmas Day, what do you want to give the child in the manger?' }
];

const DAILY_REFS = [
  'Isaiah 2:5', 'Isaiah 7:14', 'Isaiah 9:2', 'Isaiah 9:6', 'Isaiah 11:1', 'Isaiah 11:2',
  'Isaiah 25:8', 'Isaiah 35:4', 'Isaiah 40:3', 'Isaiah 40:5', 'Isaiah 61:1', 'Micah 5:2',
  'Zephaniah 3:17', 'Baruch 5:5', 'Malachi 3:1', 'Luke 1:28', 'Luke 1:37', 'Luke 1:46-47',
  'Luke 1:68', 'Luke 1:78-79', 'Luke 2:10-11', 'Luke 2:14', 'John 1:5', 'John 1:14',
  'Titus 2:11', 'Hebrews 1:1-2', 'Matthew 1:21', 'Luke 2:30-32'
];

const CP1252_FIX = {
  '\u0080': '\u20AC', '\u0082': '\u201A', '\u0083': '\u0192', '\u0084': '\u201E',
  '\u0085': '\u2026', '\u0086': '\u2020', '\u0087': '\u2021', '\u0088': '\u02C6',
  '\u0089': '\u2030', '\u008A': '\u0160', '\u008B': '\u2039', '\u008C': '\u0152',
  '\u008E': '\u017D', '\u0091': '\u2018', '\u0092': '\u2019', '\u0093': '\u201C',
  '\u0094': '\u201D', '\u0095': '\u2022', '\u0096': '\u2013', '\u0097': '\u2014',
  '\u0098': '\u02DC', '\u0099': '\u2122', '\u009A': '\u0161', '\u009B': '\u203A',
  '\u009C': '\u0153', '\u009E': '\u017E', '\u009F': '\u0178', '\u00A0': ' '
};

function fixCp1252(text) {
  return text.replace(/[\u0080-\u009F\u00A0]/g, (ch) => CP1252_FIX[ch] || '');
}

function decodeEntities(text) {
  return text
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#0?39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&mdash;/gi, '\u2014')
    .replace(/&ndash;/gi, '\u2013')
    .replace(/&hellip;/gi, '\u2026')
    .replace(/&rsquo;/gi, '\u2019')
    .replace(/&lsquo;/gi, '\u2018')
    .replace(/&ldquo;/gi, '\u201C')
    .replace(/&rdquo;/gi, '\u201D');
}

function stripHtml(html) {
  return decodeEntities(
    html
      .replace(/<BR\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, '')
  )
    .replace(/\r/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function parseBook(html, bookName) {
  // Chapter anchors look like <A NAME=2> or <A NAME="2">. Slice each chapter.
  const chapters = {};
  const chapterRe = /<A\s+NAME=["']?(\d+)["']?>/gi;
  const marks = [];
  let match;
  while ((match = chapterRe.exec(html))) {
    marks.push({ chapter: Number(match[1]), index: match.index, end: chapterRe.lastIndex });
  }

  for (let i = 0; i < marks.length; i += 1) {
    const { chapter, end } = marks[i];
    const next = i + 1 < marks.length ? marks[i + 1].index : html.length;
    const chunk = html.slice(end, next);
    const text = stripHtml(chunk);
    const verses = {};
    const verseRe = new RegExp(`\\{${chapter}:(\\d+)\\}\\s*([\\s\\S]*?)(?=\\{${chapter}:\\d+\\}|$)`, 'g');
    let vm;
    while ((vm = verseRe.exec(text))) {
      const v = Number(vm[1]);
      const t = vm[2].replace(/\s+/g, ' ').trim();
      if (t) verses[v] = t;
    }
    if (Object.keys(verses).length) chapters[chapter] = verses;
  }

  if (!Object.keys(chapters).length) {
    throw new Error(`Could not parse any chapters for ${bookName}`);
  }
  return chapters;
}

function parseRef(ref) {
  const m = ref.match(/^(.+?)\s+(\d+):([\d,\-\s]+)$/);
  if (!m) throw new Error(`Bad reference: ${ref}`);
  const book = m[1];
  const chapter = Number(m[2]);
  const parts = m[3].split(',').map((part) => part.trim()).filter(Boolean);
  const verseNumbers = [];
  for (const part of parts) {
    const range = part.match(/^(\d+)\s*-\s*(\d+)$/);
    if (range) {
      for (let v = Number(range[1]); v <= Number(range[2]); v += 1) verseNumbers.push(v);
    } else if (/^\d+$/.test(part)) {
      verseNumbers.push(Number(part));
    }
  }
  return { book, chapter, verseNumbers };
}

async function fetchBook(book) {
  const file = BOOK_FILES[book];
  if (!file) throw new Error(`No source file for ${book}`);
  const response = await fetch(BASE + file);
  if (!response.ok) throw new Error(`${book}: HTTP ${response.status}`);
  const buffer = await response.arrayBuffer();
  const html = fixCp1252(new TextDecoder('windows-1252').decode(buffer));
  return parseBook(html, book);
}

function extract(books, ref) {
  const { book, chapter, verseNumbers } = parseRef(ref);
  const chapterVerses = books[book] && books[book][chapter];
  if (!chapterVerses) throw new Error(`Missing ${book} ${chapter} for ${ref}`);
  const verses = [];
  for (const v of verseNumbers) {
    if (!chapterVerses[v]) throw new Error(`Missing ${ref} verse ${v}`);
    verses.push({ v, t: chapterVerses[v] });
  }
  return verses;
}

function formatRef(ref) {
  return ref.replace(/-/g, '\u2013');
}

const books = {};
for (const book of Object.keys(BOOK_FILES)) {
  process.stdout.write(`Fetching ${book}... `);
  books[book] = await fetchBook(book);
  process.stdout.write(`${Object.keys(books[book]).length} chapters\n`);
}

const plan = PLAN.map((entry) => ({
  ...entry,
  ref: formatRef(entry.ref),
  verses: extract(books, entry.ref)
}));

const dailyVerses = DAILY_REFS.map((ref) => {
  const verses = extract(books, ref);
  return {
    ref: formatRef(ref),
    text: verses.map((v) => v.t).join(' ')
  };
});

const output = `/* Generated by tools/fetch-cpdv.mjs — do not edit by hand.
   Text: Catholic Public Domain Version (CPDV), translated by Ronald L. Conte Jr.
   Public domain. Source: https://sacredbible.org/catholic/
*/
export const EDITION = {
  name: 'Catholic Public Domain Version',
  short: 'CPDV',
  license: 'Public domain',
  source: 'https://sacredbible.org/catholic/'
};

export const PLAN = ${JSON.stringify(plan, null, 2)};

export const DAILY_VERSES = ${JSON.stringify(dailyVerses, null, 2)};
`;

await writeFile(new URL('../js/plan.js', import.meta.url), output, 'utf8');
console.log(`\nWrote js/plan.js — ${plan.length} days, ${dailyVerses.length} daily verses.`);
