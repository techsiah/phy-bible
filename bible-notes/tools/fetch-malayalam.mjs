/* Fetches Catholic Malayalam (POC Bible — Pastoral Orientation Centre, KCBC)
   verses from pocbible.com for all 25 days (including Baruch 5:1-9 on Day 10).
   Writes js/plan-ml.js. */
import { writeFile } from 'node:fs/promises';
import { PLAN } from '../js/plan.js';

const BOOK_SLUG = {
  'Isaiah': 'isaiah',
  'Micah': 'micah',
  'Zephaniah': 'zephaniah',
  'Baruch': 'baruch',
  'Malachi': 'malachi',
  'Matthew': 'matthew',
  'Luke': 'luke',
  'John': 'john',
  'Titus': 'titus',
  'Hebrews': 'hebrews'
};

const BOOK_ML = {
  'Isaiah': 'ഏശയ്യാ',
  'Micah': 'മിക്കാ',
  'Zephaniah': 'സെഫാനിയാ',
  'Baruch': 'ബാറൂക്ക്',
  'Malachi': 'മലാക്കി',
  'Matthew': 'മത്തായി',
  'Luke': 'ലൂക്കാ',
  'John': 'യോഹന്നാൻ',
  'Titus': 'തീത്തോസ്',
  'Hebrews': 'ഹെബ്രായർ'
};

const TITLES_ML = {
  1: 'കർത്താവിന്റെ പർവ്വതം',
  2: 'യിശ്ശായിയുടെ മുള',
  3: 'മരണം എന്നേക്കും നീങ്ങിപ്പോകുന്നു',
  4: 'മരുഭൂമി പുഷ്പിക്കും',
  5: 'വഴി ഒരുക്കുവിൻ',
  6: 'ദരിദ്രർക്ക് സുവിശേഷം',
  7: 'ഇമ്മാനൂവേൽ',
  8: 'ബേത്‌ലഹേം',
  9: 'നിന്റെ നടുവിൽ കർത്താവ്',
  10: 'യെരൂശലേമിന്റെ പുനരുദ്ധാരണം',
  11: 'ശുദ്ധീകരിക്കുന്നവന്റെ തീ',
  12: 'സെഖര്യാവിന്റെ മൗനം',
  13: 'മറിയത്തിന്റെ സമ്മതം',
  14: 'മറിയത്തിന്റെ സ്തോത്രഗീതം',
  15: 'സെഖര്യാവിന്റെ സ്തോത്രഗീതം',
  16: 'യേശുവിന്റെ വംശാവലി',
  17: 'യോസേഫിന്റെ സ്വപ്നം',
  18: 'പുൽക്കൂട്',
  19: 'ആട്ടിടയന്മാർ',
  20: 'വചനവും വെളിച്ചവും',
  21: 'ഒരു ശിശു നമുക്കു ജനിച്ചിരിക്കുന്നു',
  22: 'ദൈവകൃപ പ്രത്യക്ഷമായി',
  23: 'ദൈവത്തിന്റെ അന്തിമ വചനം',
  24: 'ദൈവാലയത്തിലെ സമർപ്പണം',
  25: 'ദൈവത്തിനു മഹത്വം'
};

const BARUCH_5_ML = [
  { v: 1, t: 'യെരൂശലേമേ, നിന്റെ ദുഃഖത്തിന്റെയും കഷ്ടതയുടെയും വസ്ത്രം അഴിച്ചുകളഞ്ഞ്, ദൈവത്തിൽനിന്നുള്ള മഹത്വത്തിന്റെ ശോഭ എന്നേക്കും ധരിക്കുക.' },
  { v: 2, t: 'ദൈവത്തിൽനിന്നുള്ള നീതിയുടെ മേലങ്കി പുതയ്ക്കുക; നിത്യനായവന്റെ മഹത്വത്തിന്റെ കിരീടം നിന്റെ ശിരസ്സിൽ വയ്ക്കുക.' },
  { v: 3, t: 'ആകാശത്തിനു കീഴിലുള്ള സകലർക്കും ദൈവം നിന്റെ പ്രകാശം കാണിച്ചുതരും.' },
  { v: 4, t: 'എന്തെന്നാൽ ദൈവം നിന്നെ എന്നേക്കും ‘നീതിയുടെ സമാധാനം’ എന്നും ‘ഭക്തിയുടെ മഹത്വം’ എന്നും വിളിക്കും.' },
  { v: 5, t: 'യെരൂശലേമേ, എഴുന്നേറ്റ് ഉയരത്തിൽ നിൽക്കുക; കിഴക്കോട്ടു നോക്കി, പരിശുദ്ധന്റെ വചനത്താൽ കിഴക്കുനിന്നും പടിഞ്ഞാറുനിന്നും ദൈവത്തെ ഓർത്തു സന്തോഷിക്കുന്ന നിന്റെ മക്കൾ ഒരുമിച്ചുകൂടുന്നതു കാണുക.' },
  { v: 6, t: 'അവർ നിന്നെ വിട്ടുപോയതു ശത്രുക്കളാൽ നയിക്കപ്പെട്ട് കാൽനടയായിട്ടായിരുന്നു; എന്നാൽ ദൈവം അവരെ രാജസിംഹാസനത്തിലെന്നപോലെ മഹത്വത്തോടെ നിന്റെ അടുക്കലേക്കു തിരികെ കൊണ്ടുവരുന്നു.' },
  { v: 7, t: 'ഇസ്രായേൽ ദൈവത്തിന്റെ മഹത്വത്തിൽ സുരക്ഷിതമായി നടക്കേണ്ടതിനു ഉയർന്ന ഓരോ മലയും നിത്യഗിരികളും താഴ്ത്താനും താഴ്വരകൾ നികത്തി ഭൂമി സമമാക്കാനും ദൈവം കല്പിച്ചിരിക്കുന്നു.' },
  { v: 8, t: 'ദൈവത്തിന്റെ കല്പനയാൽ വനങ്ങളും സകല സുഗന്ധവൃക്ഷങ്ങളും ഇസ്രായേലിനു തണലേകിയിരിക്കുന്നു.' },
  { v: 9, t: 'ദൈവം തന്നിൽനിന്നുള്ള കരുണയോടും നീതിയോടുംകൂടെ, തന്റെ മഹത്വത്തിന്റെ പ്രകാശത്തിൽ ഇസ്രായേലിനെ സന്തോഷത്തോടെ നയിക്കും.' }
];

const chapterCache = new Map();

function decodeHtml(str) {
  return str
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/\s+/g, ' ')
    .trim();
}

async function getChapter(bookSlug, chapter) {
  const key = `${bookSlug}:${chapter}`;
  if (chapterCache.has(key)) return chapterCache.get(key);
  const url = `https://www.pocbible.com/adyayam.asp?val=${chapter}&book=${bookSlug}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  const html = await res.text();
  const byNum = new Map();
  const re = /<span[^>]+id=['"]v(\d+)['"][^>]*>([\s\S]*?)<\/span>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const num = Number(m[1]);
    let text = decodeHtml(m[2]);
    // Strip leading verse number (e.g., "1  യൂദായെയും..." -> "യൂദായെയും...")
    text = text.replace(new RegExp(`^${num}\\s*`), '').trim();
    if (text) byNum.set(num, text);
  }
  chapterCache.set(key, byNum);
  return byNum;
}

async function main() {
  const out = [];
  for (const item of PLAN) {
    const match = item.ref.match(/^([A-Za-z]+)\s+(\d+):(.+)$/);
    if (!match) throw new Error(`Cannot parse ref: ${item.ref}`);
    const [, book, chapStr, verseRange] = match;
    const chapter = Number(chapStr);
    const refMl = `${BOOK_ML[book] || book} ${chapter}:${verseRange}`;
    const titleMl = TITLES_ML[item.day] || item.title;

    const bookSlug = BOOK_SLUG[book];
    if (!bookSlug) throw new Error(`Unknown book: ${book}`);
    const byNum = await getChapter(bookSlug, chapter);
    const verses = item.verses.map((v) => {
      const text = byNum.get(v.v);
      if (!text) throw new Error(`Missing verse ${book} ${chapter}:${v.v}`);
      return { v: v.v, t: text };
    });

    out.push({
      day: item.day,
      ref: refMl,
      title: titleMl,
      verses
    });
    console.log(`Day ${item.day}: ${refMl} (${verses.length} verses)`);
  }

  const fileContent = `/* Generated by tools/fetch-malayalam.mjs — do not edit by hand.\n   Text: Catholic Malayalam Bible (POC — Pastoral Orientation Centre, KCBC).\n*/\nexport const EDITION_ML = {\n  name: 'പി.ഒ.സി. ബൈബിൾ (POC Malayalam)',\n  short: 'POC',\n  license: 'KCBC / POC'\n};\n\nexport const PLAN_ML = ${JSON.stringify(out, null, 2)};\n`;

  await writeFile('js/plan-ml.js', fileContent, 'utf8');
  console.log('Wrote js/plan-ml.js');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
