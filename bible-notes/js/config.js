/* Event configuration — edit this file, not the app code. */
export const EVENT = {
  id: 'xmas2026',
  org: 'Jesus Youth',
  college: 'Pazhassi Raja College',
  title: 'Advent 26',
  tagline: '25 Days · 25 Reflections · One Journey',
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

export const GENDERS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
  { value: 'prefer-not', label: 'Prefer not to say' }
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

export function yearLabel(year) {
  if (year === 'PG') return 'PG';
  const suffix = year === '1' ? 'st' : year === '2' ? 'nd' : year === '3' ? 'rd' : 'th';
  return `${year}${suffix} Year`;
}

/* Composite Firestore document ID so students with the same roll number
   in different departments/years never collide:
   e.g. "21|Department of Microbiology|2nd Year PG" */
export function readerKey(profile) {
  if (typeof profile === 'string') return profile;
  const roll = String(profile?.roll || '').trim();
  const dept = String(profile?.dept || '').trim().replace(/\//g, '-');
  const yr = yearLabel(String(profile?.year || '').trim());
  const prog = String(profile?.program || '').trim();
  const level = yr && prog && yr !== prog ? `${yr} ${prog}` : (yr || prog);
  return [roll, dept, level].filter(Boolean).join('|');
}

export const COUNTER_ACTIVITIES = [
  { title: 'Tea without sugar', detail: 'Skip sugar in your tea or coffee today as a quiet Advent offering.' },
  { title: 'Zero complaints today', detail: 'Catch every complaint before it leaves your lips and replace it with gratitude.' },
  { title: 'Message someone you miss', detail: 'Reach out to a friend or relative you have not spoken to in a while.' },
  { title: '10 minutes screen-free', detail: 'Set your phone aside for 10 quiet minutes and simply sit in silence.' },
  { title: 'Skip one snack or treat', detail: 'Say no to one extra craving today and pray for someone in need.' },
  { title: 'Compliment 3 people', detail: 'Notice something good in three people around you and tell them sincerely.' },
  { title: 'Drink only water today', detail: 'Skip soft drinks, juice, and sweet beverages for the whole day.' },
  { title: 'Help without being asked', detail: 'Spot one small chore at home or on campus and do it quietly.' },
  { title: '15 mins phone-free morning', detail: 'Wait 15 minutes after waking up before checking messages or social feeds.' },
  { title: 'Pray for someone difficult', detail: 'Offer a sincere prayer for someone who annoyed or hurt you recently.' },
  { title: 'Give up your seat or turn', detail: 'Let someone else go ahead of you in line, on the bus, or in class.' },
  { title: 'No gossip or idle talk', detail: 'Keep every conversation today kind, honest, and free of criticism.' },
  { title: 'One mindful meal', detail: 'Eat one meal today without scrolling or watching anything — just give thanks.' },
  { title: 'Call parents or an elder', detail: 'Take 5 minutes to call and truly listen to your parents or an elder.' },
  { title: 'Silent commute', detail: 'Skip music on your travel today and pray quietly for the people you pass.' },
  { title: 'Forgive & let go', detail: 'Release one small grudge you have been holding and wish that person well.' },
  { title: 'Share generously', detail: 'Share your snacks, notes, or time freely with someone around you.' },
  { title: 'Sleep 30 mins earlier', detail: 'Put screens away half an hour early tonight and end the day in prayer.' },
  { title: 'No reels or shorts today', detail: 'Avoid short-form video feeds all day and guard your attention.' },
  { title: 'Thank someone behind the scenes', detail: 'Thank a driver, canteen worker, cleaner, or security staff with a smile.' },
  { title: 'Send a thank-you note', detail: 'Text or write to someone telling them why you are grateful for them.' },
  { title: 'Sit with someone alone', detail: 'Notice someone sitting by themselves on campus and keep them company.' },
  { title: 'Pause one comfort habit', detail: 'Step back from one daily comfort for 24 hours and say a short prayer.' },
  { title: 'Make peace before Christmas', detail: 'Reach out and reconcile with anyone you have been distant from.' },
  { title: 'Celebrate with pure joy', detail: 'Be the first to bring warmth, peace, and a smile into every room today.' }
];
