/* Streak, points, and calendar maths. Pure functions so they can be tested. */

export function dayKey(date = new Date()) {
  // India has no DST: shift to IST and take the UTC date.
  const ist = new Date(date.getTime() + 5.5 * 60 * 60 * 1000);
  return ist.toISOString().slice(0, 10);
}

export function addDays(key, delta) {
  const d = new Date(`${key}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}

export function daysBetween(a, b) {
  const start = new Date(`${a}T00:00:00Z`).getTime();
  const end = new Date(`${b}T00:00:00Z`).getTime();
  return Math.round((end - start) / 86400000);
}

export function dateForDay(start, day) {
  return addDays(start, day - 1);
}

export function eventPhase(today, start, end) {
  if (today < start) return 'before';
  if (today > end) return 'after';
  return 'during';
}

export function todayIndex(today, start, end) {
  if (today < start) return 0;
  const index = daysBetween(start, today) + 1;
  return Math.min(index, daysBetween(start, end) + 1);
}

export function isReadDay(day) {
  return Boolean(day && (day.planRead || Number(day.extraReads) > 0));
}

export function dayPoints(day, pointsConfig) {
  if (!day) return 0;
  const plan = Boolean(day.planRead);
  const extras = Math.max(0, Math.min(pointsConfig.maxExtras, Number(day.extraReads) || 0));
  if (!plan && extras === 0) return 0;
  const base = pointsConfig.plan;
  const paidExtras = plan ? extras : Math.max(0, extras - 1);
  return Math.min(pointsConfig.dailyCap, base + paidExtras * pointsConfig.extra);
}

export function milestonesReached(longest, config) {
  return config.milestones.filter((milestone) => longest >= milestone.days);
}

export function milestoneBonus(milestones, config) {
  const reached = new Set(milestones.map((m) => (typeof m === 'number' ? m : m.days)));
  return config.milestones
    .filter((m) => reached.has(m.days))
    .reduce((sum, m) => sum + m.points, 0);
}

export function computeStats(reads, today, config) {
  const inWindow = (key) => key >= config.start && key <= config.end;
  const readDays = Object.keys(reads || {})
    .filter((key) => inWindow(key) && isReadDay(reads[key]))
    .sort();

  const totalDays = readDays.length;
  const lastDay = totalDays ? readDays[totalDays - 1] : null;

  let currentStreak = 0;
  if (today >= config.start) {
    let cursor = today > config.end ? config.end : today;
    if (!isReadDay(reads[cursor])) cursor = addDays(cursor, -1);
    while (cursor >= config.start && isReadDay(reads[cursor])) {
      currentStreak += 1;
      cursor = addDays(cursor, -1);
    }
  }

  let longestStreak = 0;
  let run = 0;
  let previous = null;
  for (const key of readDays) {
    if (previous && addDays(previous, 1) === key) run += 1;
    else run = 1;
    if (run > longestStreak) longestStreak = run;
    previous = key;
  }

  const milestones = milestonesReached(longestStreak, config);
  const dailyPoints = readDays.reduce(
    (sum, key) => sum + dayPoints(reads[key], config.points),
    0
  );
  const bonus = milestoneBonus(milestones, config);
  const todayRead = inWindow(today) && isReadDay(reads[today]);

  return {
    currentStreak,
    longestStreak,
    totalDays,
    points: dailyPoints + bonus,
    dailyPoints,
    milestonePoints: bonus,
    lastDay,
    readDays,
    milestones,
    todayRead
  };
}

export function buildDayStates(reads, today, config) {
  const total = daysBetween(config.start, config.end) + 1;
  const states = [];
  for (let day = 1; day <= total; day += 1) {
    const date = dateForDay(config.start, day);
    const read = isReadDay(reads[date]);
    let state;
    if (date > today) state = 'future';
    else if (date === today) state = read ? 'done' : 'today';
    else state = read ? 'done' : 'missed';
    states.push({ day, date, read, state });
  }
  return states;
}

export function formatLongDate(key) {
  return new Intl.DateTimeFormat('en-IN', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: 'Asia/Kolkata'
  }).format(new Date(`${key}T12:00:00+05:30`));
}

export function daysUntil(key, today) {
  return daysBetween(today, key);
}
