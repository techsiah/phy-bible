/* Event configuration — edit this file, not the app code. */
export const EVENT = {
  id: 'xmas2026',
  org: 'Jesus Youth',
  college: 'Pazhassi Raja College',
  title: 'Christmas 2026',
  tagline: '25 Days of the Word',
  start: '2026-12-01',
  end: '2026-12-25',
  timezone: 'Asia/Kolkata',
  points: {
    plan: 10,
    extra: 5,
    maxExtras: 3,
    dailyCap: 25
  },
  milestones: [
    { days: 3, points: 10, label: 'First Light', desc: 'Three days in the Word' },
    { days: 7, points: 25, label: 'Sevenfold', desc: 'A full week of reading' },
    { days: 14, points: 50, label: 'Halfway Star', desc: 'Fourteen days of reading' },
    { days: 25, points: 100, label: 'Christmas Crown', desc: 'Every door opened' }
  ],
  groupMax: 4,
  groupCodeLength: 6,
  groupCodeAlphabet: 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789',
  leaderboardLimit: 1000,
  boardCacheMs: 5 * 60 * 1000,
  maxNotes: 500,
  maxNoteLength: 20000
};

export const DEPARTMENTS = [
  'Department of Economics',
  'Department of English',
  'Department of History',
  'Department of Microbiology',
  'Department of Travel and Tourism',
  'Department of Journalism and Mass Communication',
  'Department of Biochemistry',
  'Department of Commerce'
];

export const YEARS = [
  { value: '1', label: '1st Year' },
  { value: '2', label: '2nd Year' },
  { value: '3', label: '3rd Year' },
  { value: '4', label: '4th Year' },
  { value: 'PG', label: 'PG' }
];

export const PROGRAMS = [
  { value: 'UG', label: 'UG' },
  { value: 'PG', label: 'PG' }
];

/* A light first line of defence for group names. The organizer can delete a
   group from the Firebase console if something unpleasant slips through. */
export const PROFANITY = [
  'fuck', 'shit', 'bitch', 'bastard', 'asshole', 'dick', 'piss', 'slut',
  'whore', 'rape', 'sex', 'porn', 'nude', 'kill', 'hate'
];

export function isCleanName(name) {
  const lower = String(name || '').toLowerCase();
  return !PROFANITY.some((word) => lower.includes(word));
}
