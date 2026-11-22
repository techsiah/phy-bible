import test from 'node:test';
import assert from 'node:assert/strict';

import { EVENT } from '../js/config.js';
import {
  dayKey, addDays, daysBetween, dateForDay, eventPhase, todayIndex,
  dayPoints, computeStats, buildDayStates, isReadDay
} from '../js/streak.js';

const plan = (extra = 0) => ({ planRead: true, extraReads: extra, refs: [] });

test('dayKey uses the IST midnight boundary', () => {
  assert.equal(dayKey(new Date('2026-11-30T18:29:59Z')), '2026-11-30');
  assert.equal(dayKey(new Date('2026-11-30T18:30:00Z')), '2026-12-01');
  assert.equal(dayKey(new Date('2026-12-25T18:29:59Z')), '2026-12-25');
  assert.equal(dayKey(new Date('2026-12-25T18:30:00Z')), '2026-12-26');
});

test('calendar arithmetic crosses months and years', () => {
  assert.equal(addDays('2026-12-01', 24), '2026-12-25');
  assert.equal(addDays('2026-12-31', 1), '2027-01-01');
  assert.equal(addDays('2026-03-01', -1), '2026-02-28');
  assert.equal(daysBetween('2026-12-01', '2026-12-25'), 24);
  assert.equal(dateForDay('2026-12-01', 25), '2026-12-25');
});

test('the event runs exactly 25 days', () => {
  assert.equal(EVENT.start, '2026-12-01');
  assert.equal(EVENT.end, '2026-12-25');
  assert.equal(daysBetween(EVENT.start, EVENT.end) + 1, 25);
});

test('event phase and day index', () => {
  assert.equal(eventPhase('2026-11-30', EVENT.start, EVENT.end), 'before');
  assert.equal(eventPhase('2026-12-01', EVENT.start, EVENT.end), 'during');
  assert.equal(eventPhase('2026-12-25', EVENT.start, EVENT.end), 'during');
  assert.equal(eventPhase('2026-12-26', EVENT.start, EVENT.end), 'after');

  assert.equal(todayIndex('2026-11-30', EVENT.start, EVENT.end), 0);
  assert.equal(todayIndex('2026-12-01', EVENT.start, EVENT.end), 1);
  assert.equal(todayIndex('2026-12-13', EVENT.start, EVENT.end), 13);
  assert.equal(todayIndex('2027-01-10', EVENT.start, EVENT.end), 25);
});

test('day points: plan, extras, cap', () => {
  assert.equal(dayPoints(undefined, EVENT.points), 0);
  assert.equal(dayPoints({ planRead: false, extraReads: 0 }, EVENT.points), 0);
  assert.equal(dayPoints({ planRead: true }, EVENT.points), 10);
  assert.equal(dayPoints({ planRead: true, extraReads: 1 }, EVENT.points), 15);
  assert.equal(dayPoints({ planRead: true, extraReads: 3 }, EVENT.points), 25);
  assert.equal(dayPoints({ planRead: true, extraReads: 99 }, EVENT.points), 25);
  assert.equal(dayPoints({ planRead: false, extraReads: 1 }, EVENT.points), 10);
  assert.equal(dayPoints({ planRead: false, extraReads: 2 }, EVENT.points), 15);
  assert.equal(dayPoints({ planRead: false, extraReads: 3 }, EVENT.points), 20);
});

test('isReadDay counts the plan or any extra reading', () => {
  assert.equal(isReadDay(null), false);
  assert.equal(isReadDay({ planRead: false, extraReads: 0 }), false);
  assert.equal(isReadDay({ planRead: true, extraReads: 0 }), true);
  assert.equal(isReadDay({ planRead: false, extraReads: 1 }), true);
});

test('streak, points, and the three-day milestone', () => {
  const reads = {
    '2026-12-01': plan(),
    '2026-12-02': plan(3),
    '2026-12-03': { planRead: false, extraReads: 1, refs: ['Psalm 23'] }
  };
  const stats = computeStats(reads, '2026-12-03', EVENT);

  assert.equal(stats.currentStreak, 3);
  assert.equal(stats.longestStreak, 3);
  assert.equal(stats.totalDays, 3);
  assert.equal(stats.dailyPoints, 10 + 25 + 10);
  assert.equal(stats.milestonePoints, 10);
  assert.equal(stats.points, 55);
  assert.equal(stats.todayRead, true);
  assert.deepEqual(stats.milestones.map((m) => m.days), [3]);
});

test('a missed day resets the streak at midnight', () => {
  const reads = {
    '2026-12-01': plan(),
    '2026-12-02': plan()
  };
  // Still day 3: yesterday's streak is shown until the day ends.
  assert.equal(computeStats(reads, '2026-12-03', EVENT).currentStreak, 2);
  // Day 4: day 3 was missed, so the streak is gone.
  const reset = computeStats(reads, '2026-12-04', EVENT);
  assert.equal(reset.currentStreak, 0);
  assert.equal(reset.longestStreak, 2);
  assert.equal(reset.totalDays, 2);
});

test('longest streak survives a reset', () => {
  const reads = {
    '2026-12-01': plan(), '2026-12-02': plan(), '2026-12-03': plan(),
    '2026-12-04': plan(), '2026-12-05': plan(),
    '2026-12-08': plan(), '2026-12-09': plan()
  };
  const stats = computeStats(reads, '2026-12-09', EVENT);
  assert.equal(stats.longestStreak, 5);
  assert.equal(stats.currentStreak, 2);
  assert.equal(stats.totalDays, 7);
  assert.equal(stats.milestonePoints, 10);
});

test('all milestones and the 810-point ceiling', () => {
  const reads = {};
  for (let i = 0; i < 25; i += 1) reads[addDays(EVENT.start, i)] = plan(3);

  const stats = computeStats(reads, '2026-12-25', EVENT);
  assert.equal(stats.currentStreak, 25);
  assert.equal(stats.longestStreak, 25);
  assert.equal(stats.dailyPoints, 625);
  assert.equal(stats.milestonePoints, 10 + 25 + 50 + 100);
  assert.equal(stats.points, 810);
  assert.deepEqual(stats.milestones.map((m) => m.days), [3, 7, 14, 25]);
});

test('a completed event keeps its final streak', () => {
  const reads = {};
  for (let i = 0; i < 25; i += 1) reads[addDays(EVENT.start, i)] = plan();
  const stats = computeStats(reads, '2027-01-02', EVENT);
  assert.equal(stats.currentStreak, 25);
  assert.equal(stats.todayRead, false);
  assert.equal(stats.points, 250 + 185);
});

test('readings outside the window never count', () => {
  const reads = {
    '2026-11-30': plan(),
    '2026-12-01': plan(),
    '2026-12-26': plan()
  };
  const stats = computeStats(reads, '2026-12-01', EVENT);
  assert.equal(stats.totalDays, 1);
  assert.equal(stats.dailyPoints, 10);
  assert.equal(stats.points, 10);
});

test('day states describe doors, today, and missed days', () => {
  const reads = { '2026-12-01': plan(), '2026-12-03': plan() };
  const states = buildDayStates(reads, '2026-12-05', EVENT);

  assert.equal(states.length, 25);
  assert.equal(states[0].date, '2026-12-01');
  assert.equal(states[24].date, '2026-12-25');

  assert.equal(states[0].state, 'done');
  assert.equal(states[1].state, 'missed');
  assert.equal(states[2].state, 'done');
  assert.equal(states[3].state, 'missed');
  assert.equal(states[4].state, 'today');
  assert.equal(states[5].state, 'future');
  assert.equal(states[24].state, 'future');
});

test('before the event every door is closed', () => {
  const states = buildDayStates({}, '2026-11-21', EVENT);
  assert.ok(states.every((entry) => entry.state === 'future'));
});

test('an extra reading alone keeps the streak alive', () => {
  const reads = {
    '2026-12-01': { planRead: false, extraReads: 1, refs: ['Romans 8'] }
  };
  const stats = computeStats(reads, '2026-12-01', EVENT);
  assert.equal(stats.currentStreak, 1);
  assert.equal(stats.points, 10);
  assert.equal(stats.todayRead, true);
});
