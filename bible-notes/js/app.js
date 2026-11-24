/* Christmas 2026 — Jesus Youth · Pazhassi Raja College
   Local-first reading, streaks, notes, groups, and a shared leaderboard. */
import { EVENT, DEPARTMENTS, YEARS, PROGRAMS, GENDERS, isCleanName } from './config.js';
import { PLAN, DAILY_VERSES, EDITION } from './plan.js';
import {
  BOOKS, chaptersFor, formatBookName, parseReference, assembleReference, formatReference,
  parseTags, normalizeRoll, isValidRoll, normalizeGroupCode
} from './refs.js';
import {
  dayKey, daysBetween, dateForDay, eventPhase, todayIndex, dayPoints, computeStats,
  buildDayStates, formatLongDate, daysUntil
} from './streak.js';
import * as store from './store.js';
import { normalizeNote, mergeNotes, noteMatches } from './notes.js';
import { initBackend } from './backend.js';

const $ = (id) => document.getElementById(id);

const dom = {
  cover: $('cover'),
  openBtn: $('openBtn'),
  app: $('app'),
  appHeader: $('appHeader'),
  main: $('main'),
  nav: $('bottomNav'),
  navIndicator: $('navIndicator'),
  coverOrg: $('coverOrg'),
  coverTitle: $('coverTitle'),
  coverSub: $('coverSub'),
  coverEdition: $('coverEdition'),
  themeBtn: $('themeBtn'),
  settingsBtn: $('settingsBtn'),
  syncBadge: $('syncBadge'),
  dailyText: $('dailyText'),
  dailyRef: $('dailyRef'),
  adventStrip: $('adventStrip'),
  adventProgress: $('adventProgress'),
  adventHint: $('adventHint'),
  readingCard: $('readingCard'),
  readingDay: $('readingDay'),
  readingTheme: $('readingTheme'),
  readingRef: $('readingRef'),
  readingTitle: $('readingTitle'),
  passageText: $('passageText'),
  readingPrompt: $('readingPrompt'),
  markReadBtn: $('markReadBtn'),
  writeNoteBtn: $('writeNoteBtn'),
  extraReadBtn: $('extraReadBtn'),
  readStatus: $('readStatus'),
  streakNumber: $('streakNumber'),
  streakLabel: $('streakLabel'),
  streakNote: $('streakNote'),
  streakFlame: $('streakFlame'),
  statPoints: $('statPoints'),
  statDays: $('statDays'),
  statLongest: $('statLongest'),
  journeyHero: $('journeyHero'),
  journeyGrid: $('journeyGrid'),
  badges: $('badges'),
  pointsBreakdown: $('pointsBreakdown'),
  boardTabs: $('boardTabs'),
  refreshBoard: $('refreshBoard'),
  exportBoard: $('exportBoard'),
  myGroup: $('myGroup'),
  boardList: $('boardList'),
  boardFoot: $('boardFoot'),
  noteSearch: $('noteSearch'),
  newNoteBtn: $('newNoteBtn'),
  notesList: $('notesList'),
  notesEmpty: $('notesEmpty'),
  settingsDialog: $('settingsDialog'),
  closeSettings: $('closeSettings'),
  profileSummary: $('profileSummary'),
  deviceId: $('deviceId'),
  copyDevice: $('copyDevice'),
  fontRange: $('fontRange'),
  fontValue: $('fontValue'),
  exportBtn: $('exportBtn'),
  importBtn: $('importBtn'),
  importFile: $('importFile'),
  printBtn: $('printBtn'),
  leaveDevice: $('leaveDevice'),
  syncNote: $('syncNote'),
  syncNote2: $('syncNote2'),
  dailyLabel: $('dailyLabel'),
  headerUserName: $('headerUserName'),
  openReadingBtn: $('openReadingBtn'),
  quickReflectBtn: $('quickReflectBtn'),
  quickStreakBtn: $('quickStreakBtn'),
  quickTogetherBtn: $('quickTogetherBtn'),
  centerActionBtn: $('centerActionBtn'),
  onboarding: $('onboarding'),
  registerBtn: $('registerBtn'),
  accountBtn: $('accountBtn'),
  accountLabel: $('accountLabel'),
  coverRegBtn: $('coverRegBtn'),
  coverThemeBtn: $('coverThemeBtn'),
  coverAvatar: $('coverAvatar'),
  coverIdentityName: $('coverIdentityName'),
  coverIdentitySub: $('coverIdentitySub'),
  coverStats: $('coverStats'),
  coverStreak: $('coverStreak'),
  coverPoints: $('coverPoints'),
  coverDays: $('coverDays'),
  coverCountdown: $('coverCountdown'),
  closeOnboarding: $('closeOnboarding'),
  cancelOnboarding: $('cancelOnboarding'),
  guestBanner: $('guestBanner'),
  guestBannerBtn: $('guestBannerBtn'),
  guestReadingHint: $('guestReadingHint'),
  guestInlineRegisterBtn: $('guestInlineRegisterBtn'),
  onboardForm: $('onboardForm'),
  obName: $('obName'),
  obPhone: $('obPhone'),
  obRoll: $('obRoll'),
  obGender: $('obGender'),
  obDept: $('obDept'),
  obYear: $('obYear'),
  obProgram: $('obProgram'),
  obGroupName: $('obGroupName'),
  obGroupCode: $('obGroupCode'),
  obError: $('obError'),
  obDevice: $('obDevice'),
  deptList: $('deptList'),
  bookList: $('bookList'),
  chapterList: $('chapterList'),
  noteDialog: $('noteDialog'),
  noteForm: $('noteForm'),
  noteDialogTitle: $('noteDialogTitle'),
  noteRef: $('noteRef'),
  noteText: $('noteText'),
  noteTags: $('noteTags'),
  noteCancel: $('noteCancel'),
  extraDialog: $('extraDialog'),
  extraForm: $('extraForm'),
  extraBook: $('extraBook'),
  extraChapter: $('extraChapter'),
  extraVerse: $('extraVerse'),
  extraPreview: $('extraPreview'),
  extraCancel: $('extraCancel'),
  groupDialog: $('groupDialog'),
  groupForm: $('groupForm'),
  groupName: $('groupName'),
  groupCancel: $('groupCancel'),
  recoveryDialog: $('recoveryDialog'),
  recoveryTitle: $('recoveryTitle'),
  recoveryText: $('recoveryText'),
  recoveryRoll: $('recoveryRoll'),
  recoveryDevice: $('recoveryDevice'),
  recoveryRetry: $('recoveryRetry'),
  recoveryReset: $('recoveryReset'),
  recoveryClose: $('recoveryClose'),
  toast: $('toast'),
  toastText: $('toastText'),
  toastAction: $('toastAction')
};

const state = {
  backend: null,
  backendReady: null,
  profile: null,
  reader: null,
  reads: {},
  notes: [],
  milestones: [],
  stats: computeStats({}, dayKey(), EVENT),
  today: dayKey(),
  phase: eventPhase(dayKey(), EVENT.start, EVENT.end),
  selectedDay: 1,
  view: 'today',
  board: 'streaks',
  earlyAccess: false,
  cache: null,
  group: null,
  noteQuery: '',
  editingNoteId: null,
  entered: false,
  loadingBoard: false,
  warning: null,
  recoveryReason: null
};

let toastTimer = null;
let clockTimer = null;

/* Tab order drives swipe direction, view transitions, and history. */
const VIEW_ORDER = ['today', 'journey', 'together', 'notes'];
const viewScroll = new Map();

/* ── Small helpers ─────────────────────────────────────────── */

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function clear(node) {
  if (node) node.replaceChildren();
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function yearLabel(year) {
  if (year === 'PG') return 'PG';
  const suffix = year === '1' ? 'st' : year === '2' ? 'nd' : year === '3' ? 'rd' : 'th';
  return `${year}${suffix} Year`;
}

function normalizePhone(value) {
  const digits = String(value || '').replace(/\D/g, '');
  return digits.length === 12 && digits.startsWith('91') ? digits.slice(2) : digits;
}

function genderLabel(gender) {
  const found = GENDERS.find((item) => item.value === gender);
  return found ? found.label : '';
}

function displayReader(reader) {
  const base = [reader.roll, reader.dept, yearLabel(reader.year), reader.program]
    .filter(Boolean)
    .join(' · ');
  const name = String(reader.name || '').trim();
  return name ? `${name} · ${base}` : base;
}

function setBusy(button, busy, label) {
  if (!button) return;
  if (busy) {
    button.dataset.label = button.textContent;
    button.disabled = true;
    if (label) button.textContent = label;
  } else {
    button.disabled = false;
    if (button.dataset.label) button.textContent = button.dataset.label;
    delete button.dataset.label;
  }
}

async function safe(fn, fallback = null) {
  try { return await fn(); } catch (err) { console.warn(err); return fallback; }
}

function showToast(message, action) {
  if (!dom.toast) return;
  window.clearTimeout(toastTimer);
  dom.toastText.textContent = message;
  if (action) {
    dom.toastAction.hidden = false;
    dom.toastAction.textContent = action.label;
    dom.toastAction.onclick = () => {
      hideToast();
      action.onClick();
    };
  } else {
    dom.toastAction.hidden = true;
    dom.toastAction.onclick = null;
  }
  dom.toast.hidden = false;
  requestAnimationFrame(() => dom.toast.classList.add('is-visible'));
  toastTimer = window.setTimeout(hideToast, action ? 7000 : 3500);
}

function hideToast() {
  window.clearTimeout(toastTimer);
  if (!dom.toast) return;
  dom.toast.classList.remove('is-visible');
  dom.toast.hidden = true;
}

/* ── App-shell behavior: history, motion, haptics ──────────── */

function haptic(ms = 8) {
  if (typeof navigator.vibrate !== 'function') return;
  try { navigator.vibrate(ms); } catch (err) { /* unsupported */ }
}

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function pushViewHistory(view) {
  if (!window.history || typeof history.pushState !== 'function') return;
  if (history.state && (history.state.xmasView === view || history.state.xmasDialog)) return;
  try { history.pushState({ xmasView: view }, '', location.href); } catch (err) { /* no history */ }
}

function ensureViewHistory() {
  if (!window.history || typeof history.replaceState !== 'function') return;
  if (history.state && history.state.xmasView) return;
  try {
    history.replaceState({ ...(history.state || {}), xmasView: state.view }, '', location.href);
  } catch (err) { /* no history */ }
}

function hasDialogEntry(dialog) {
  return Boolean(dialog && window.history && history.state && history.state.xmasDialog === dialog.id);
}

function openDialog(dialog) {
  if (!dialog || dialog.open) return;
  ensureViewHistory();
  if (typeof dialog.showModal === 'function') dialog.showModal();
  else dialog.setAttribute('open', '');
  try { history.pushState({ xmasDialog: dialog.id }, '', location.href); } catch (err) { /* no history */ }
}

function closeDialog(dialog, options = {}) {
  if (!dialog || !dialog.open) return;
  const hadEntry = hasDialogEntry(dialog);
  if (typeof dialog.close === 'function') dialog.close();
  else dialog.removeAttribute('open');
  if (hadEntry && !options.fromHistory) {
    // Turn the dialog's history entry into the view underneath so a later
    // preview or navigation never resurfaces a closed sheet.
    try { history.replaceState({ xmasView: state.view }, '', location.href); } catch (err) { /* no history */ }
  }
}

function animateView(section, direction) {
  if (!section || prefersReducedMotion() || typeof section.animate !== 'function') return;
  const offset = direction === 'back' ? -18 : 18;
  section.animate(
    [
      { opacity: 0, transform: `translate3d(${offset}px, 0, 0)` },
      { opacity: 1, transform: 'translate3d(0, 0, 0)' }
    ],
    { duration: 240, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }
  );
}

function positionNavIndicator() {
  if (!dom.nav || !dom.navIndicator || !dom.nav.getClientRects().length) return;
  const active = dom.nav.querySelector('.nav-btn[aria-current="true"]');
  if (!active) return;
  const navRect = dom.nav.getBoundingClientRect();
  const rect = active.getBoundingClientRect();
  const pad = 6;
  dom.navIndicator.style.width = `${Math.max(0, rect.width - pad * 2)}px`;
  dom.navIndicator.style.transform = `translate3d(${rect.left - navRect.left + pad}px, 0, 0)`;
  dom.navIndicator.style.opacity = '1';
}

function scrollToTop(options = {}) {
  window.scrollTo({
    top: 0,
    behavior: options.smooth && !prefersReducedMotion() ? 'smooth' : 'auto'
  });
}

/* Elevate the app bar once content scrolls beneath it, like a native title bar.
   Hysteresis keeps the bar from flickering around the threshold. */
function updateHeaderElevation() {
  if (!dom.appHeader) return;
  const y = window.scrollY;
  const scrolled = dom.appHeader.dataset.scrolled === 'true';
  if (!scrolled && y > 48) dom.appHeader.dataset.scrolled = 'true';
  else if (scrolled && y < 12) dom.appHeader.dataset.scrolled = 'false';
}

function bindAppShell() {
  ensureViewHistory();
  requestAnimationFrame(positionNavIndicator);
  requestAnimationFrame(updateHeaderElevation);

  window.addEventListener('scroll', updateHeaderElevation, { passive: true });

  if (dom.syncBadge) {
    dom.syncBadge.addEventListener('click', () => {
      if (!state.backend) retryBackend();
    });
  }

  window.addEventListener('resize', () => requestAnimationFrame(positionNavIndicator));
  window.addEventListener('orientationchange', () => requestAnimationFrame(positionNavIndicator));

  window.addEventListener('popstate', () => {
    const dialogId = history.state && history.state.xmasDialog;
    if (!dialogId) {
      document.querySelectorAll('dialog[open]').forEach((dialog) => {
        closeDialog(dialog, { fromHistory: true });
      });
    }
    const view = history.state && history.state.xmasView;
    if (view && view !== state.view) {
      switchView(view, { fromHistory: true, history: false });
    }
  });

  // Swipe left/right between tabs, ignoring form controls and horizontal scrollers.
  const main = dom.main;
  if (!main) return;
  let startX = 0;
  let startY = 0;
  let tracking = false;

  main.addEventListener('touchstart', (event) => {
    if (!state.entered || event.touches.length !== 1) return;
    if (event.target.closest('input, textarea, select, [contenteditable="true"], dialog, .advent-strip, .board-tabs')) return;
    startX = event.touches[0].clientX;
    startY = event.touches[0].clientY;
    tracking = true;
  }, { passive: true });

  main.addEventListener('touchend', (event) => {
    if (!tracking) return;
    tracking = false;
    const touch = event.changedTouches[0];
    if (!touch) return;
    const dx = touch.clientX - startX;
    const dy = touch.clientY - startY;
    if (Math.abs(dx) < 56 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    const current = VIEW_ORDER.indexOf(state.view);
    if (current < 0) return;
    const next = dx < 0 ? current + 1 : current - 1;
    if (next < 0 || next >= VIEW_ORDER.length) return;
    switchView(VIEW_ORDER[next], { direction: dx < 0 ? 'forward' : 'back' });
  }, { passive: true });

  main.addEventListener('touchcancel', () => { tracking = false; }, { passive: true });
}

function applyTheme(theme) {
  const next = theme === 'candle' ? 'candle' : 'day';
  document.documentElement.dataset.theme = next;
  store.setTheme(next);
  if (dom.themeBtn) {
    dom.themeBtn.setAttribute('aria-label', next === 'day' ? 'Switch to candlelight' : 'Switch to daylight');
  }
  if (dom.coverThemeBtn) {
    dom.coverThemeBtn.setAttribute('aria-label', next === 'day' ? 'Switch to candlelight' : 'Switch to daylight');
  }
  document.querySelectorAll('[data-theme-choice]').forEach((btn) => {
    btn.setAttribute('aria-pressed', String(btn.dataset.themeChoice === next));
  });
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', next === 'day' ? '#F7F5F0' : '#0F1A15');
}

function applyFont(size) {
  const value = store.setFont(size);
  document.documentElement.style.setProperty('--reading-size', `${value}px`);
  if (dom.fontRange) dom.fontRange.value = String(value);
  if (dom.fontValue) dom.fontValue.textContent = `${value}px`;
}

function currentPlan() {
  return PLAN[clamp(state.selectedDay, 1, PLAN.length) - 1];
}

function currentTodayIndex() {
  return todayIndex(state.today, EVENT.start, EVENT.end);
}

/* Preview mode: the organizer can open the calendar early for one reader.
   It only shows the readings; points and streaks still start on December 1. */
function earlyOpen() {
  return state.phase === 'before' && state.earlyAccess && Boolean(state.profile);
}

async function loadEarlyAccess() {
  if (!state.backend || !state.profile || state.phase !== 'before') {
    state.earlyAccess = false;
    return;
  }
  try {
    const board = await state.backend.getBoard(state.profile.roll);
    state.earlyAccess = Boolean(board && board.earlyAccess);
  } catch (err) {
    state.earlyAccess = false;
  }
}

function readState(day) {
  return state.reads[day] || { planRead: false, extraReads: 0, refs: [] };
}

/* ── Boot ──────────────────────────────────────────────────── */

function init() {
  state.today = dayKey();
  state.phase = eventPhase(state.today, EVENT.start, EVENT.end);
  state.selectedDay = state.phase === 'before' ? 1 : state.phase === 'after' ? PLAN.length : clamp(currentTodayIndex(), 1, PLAN.length);
  store.clearDemo(); // purge legacy demo accounts from local storage
  applyTheme(store.getTheme());
  applyFont(store.getFont());
  populateStatic();
  bindEvents();

  state.profile = store.loadProfile();
  state.reads = store.loadReads();
  state.notes = store.loadNotes();
  state.milestones = store.loadMilestones();
  state.cache = store.loadCache();
  recompute();
  renderCover();
  renderAll();

  state.backendReady = bootBackend();
  startClock();

  // Home-screen shortcuts and manifest shortcuts queue a view on <html>.
  const startView = document.documentElement.dataset.startView;
  if (startView && ['today', 'notes', 'together', 'journey'].includes(startView)) {
    openApp();
    switchView(startView);
  }
}

async function bootBackend() {
  try {
    state.backend = await initBackend();
  } catch (err) {
    state.backend = null;
    state.warning = err.message || 'Could not connect to the reading server. Check your connection and try again.';
    updateSyncBadge();
    renderCover();
    showToast(state.warning);
    return null;
  }
  state.warning = null;
  updateSyncBadge();
  if (state.profile) {
    const ok = await hydrate();
    if (!ok && state.backend?.mode === 'firebase') showRecovery();
    await loadEarlyAccess();
    renderAll();
  }
  // Splash screen stays until user clicks 'Explore the readings' or 'Register / Join'
  renderCover();
  return state.backend;
}

let backendRetrying = false;

async function retryBackend() {
  if (state.backend || backendRetrying) return;
  backendRetrying = true;
  if (dom.syncBadge) dom.syncBadge.textContent = 'Connecting…';
  state.backendReady = bootBackend();
  await state.backendReady;
  backendRetrying = false;
  if (state.backend) {
    recompute();
    renderAll();
    renderCover();
  }
}

async function hydrate(options = {}) {
  if (!state.profile || !state.backend) return false;
  const claim = options.claim !== false;

  if (claim) {
    try {
      await state.backend.claimReader(state.profile);
    } catch (err) {
      state.recoveryReason = err.code === 'ROLL_TAKEN' ? 'taken' : 'offline';
      if (err.code !== 'ROLL_TAKEN') showToast(err.message || 'Could not reach the reading server.');
      return false;
    }
  }

  const roll = state.profile.roll;
  const localNotes = state.notes;
  let reader;
  let remoteDays;
  let remoteNotes;
  try {
    [reader, remoteDays, remoteNotes] = await Promise.all([
      state.backend.getReader(roll),
      state.backend.getDays(roll),
      state.backend.getNotes(roll)
    ]);
  } catch (err) {
    // Never replace a synced entry with an empty local copy just because a
    // read failed. The device copy stays usable and sync resumes later.
    console.warn('Could not load the synced entry; keeping this device copy.', err);
    state.reader = null;
    recompute();
    persist();
    return true;
  }

  const merged = mergeReads(state.reads, remoteDays || {});
  state.reads = merged.reads;
  state.notes = mergeNotes(state.notes, remoteNotes || []);
  if (reader) state.profile = { ...state.profile, ...reader };
  state.reader = reader || null;
  if (state.profile.groupCode) {
    state.group = await safe(() => state.backend.findGroup(state.profile.groupCode), null);
  }
  state.milestones = uniqueNumbers([
    ...state.milestones,
    ...((reader && Array.isArray(reader.milestones)) ? reader.milestones : [])
  ]);
  recompute();
  persist();
  await pushChanged(merged.changed, localNotes, remoteNotes || []);
  return true;
}

function uniqueNumbers(list) {
  return [...new Set(list.filter((n) => Number.isFinite(Number(n))).map(Number))].sort((a, b) => a - b);
}

function sameDay(a, b) {
  return Boolean(a && a.planRead) === Boolean(b && b.planRead) &&
    (Number(a && a.extraReads) || 0) === (Number(b && b.extraReads) || 0) &&
    JSON.stringify((a && a.refs) || []) === JSON.stringify((b && b.refs) || []);
}

function mergeReads(local, remote) {
  const out = {};
  const changed = [];
  const days = new Set([...Object.keys(local || {}), ...Object.keys(remote || {})]);
  for (const day of days) {
    const a = (local || {})[day];
    const b = (remote || {})[day];
    const merged = {
      planRead: Boolean(a && a.planRead) || Boolean(b && b.planRead),
      extraReads: Math.max(Number(a && a.extraReads) || 0, Number(b && b.extraReads) || 0),
      refs: [...new Set([...(a && a.refs ? a.refs : []), ...(b && b.refs ? b.refs : [])])].slice(0, 4)
    };
    out[day] = merged;
    if (!b || !sameDay(b, merged)) changed.push(day);
  }
  return { reads: store.normalizeReads(out), changed };
}

function recompute() {
  state.stats = computeStats(state.reads, state.today, EVENT);
  state.milestones = uniqueNumbers([...state.milestones, ...state.stats.milestones.map((m) => m.days)]);
  store.saveMilestones(state.milestones);
}

function persist() {
  if (state.profile) store.saveProfile(state.profile);
  store.saveReads(state.reads);
  store.saveNotes(state.notes);
  store.saveMilestones(state.milestones);
}

async function pushDay(day) {
  if (!state.backend || !state.profile) return;
  const data = state.reads[day] || { planRead: false, extraReads: 0, refs: [] };
  await state.backend.saveDay(state.profile.roll, day, {
    ...data,
    day,
    points: dayPoints(data, EVENT.points),
    updatedAt: Date.now()
  });
}

/* Upload only what changed locally, so opening the app does not rewrite every
   document (Firestore counts each write against the free daily quota). */
async function pushChanged(changedDays, localNotes, remoteNotes) {
  if (!state.backend || !state.profile) return;
  const roll = state.profile.roll;
  try {
    for (const day of changedDays) await pushDay(day);
    const remoteById = new Map((remoteNotes || []).map((note) => [note.id, note]));
    for (const note of state.notes) {
      const remote = remoteById.get(note.id);
      if (!remote || (Number(note.updatedAt) || 0) > (Number(remote.updatedAt) || 0)) {
        await state.backend.saveNote(roll, note);
      }
    }
    await syncReader();
  } catch (err) {
    console.warn('Sync deferred', err);
  }
}

async function pushLocal() {
  if (!state.backend || !state.profile) return;
  try {
    for (const day of Object.keys(state.reads)) await pushDay(day);
    for (const note of state.notes) await state.backend.saveNote(state.profile.roll, note);
    await syncReader();
  } catch (err) {
    console.warn('Sync deferred', err);
  }
}

async function syncReader() {
  if (!state.backend || !state.profile) return;
  const patch = {
    roll: state.profile.roll,
    name: state.profile.name || '',
    phone: state.profile.phone || '',
    gender: state.profile.gender || '',
    dept: state.profile.dept,
    year: state.profile.year,
    program: state.profile.program,
    groupCode: state.profile.groupCode || null,
    createdAt: state.profile.createdAt || Date.now(),
    currentStreak: state.stats.currentStreak,
    longestStreak: state.stats.longestStreak,
    totalDays: state.stats.totalDays,
    points: state.stats.points,
    lastDay: state.stats.lastDay,
    milestones: state.stats.milestones.map((m) => m.days)
  };
  try {
    await state.backend.updateReader(state.profile.roll, patch);
  } catch (err) {
    console.warn('Reader sync deferred', err);
  }
  updateSyncBadge();
}

async function saveDay(day) {
  if (!state.backend || !state.profile) return;
  try {
    await pushDay(day);
  } catch (err) {
    console.warn('Day sync deferred', err);
  }
}

function updateSyncBadge() {
  if (!dom.syncBadge) return;
  const connected = Boolean(state.backend);
  const online = connected && navigator.onLine;
  dom.syncBadge.textContent = connected ? (online ? 'Synced' : 'Offline') : 'Not connected';
  dom.syncBadge.dataset.mode = online ? 'online' : 'offline';
  dom.syncBadge.title = connected ? 'Sync status' : 'Tap to retry the connection';
  dom.syncBadge.style.cursor = connected ? '' : 'pointer';
  if (dom.syncNote) {
    dom.syncNote.textContent = connected
      ? 'Your notes and reading history sync privately. Only your name, roll, gender, department, year, program, group, streak and points are public.'
      : (state.warning || 'Cannot reach the reading server. Check your connection and try again.');
  }
  if (dom.syncNote2) {
    dom.syncNote2.textContent = connected
      ? 'Notes and reading history sync privately to your roll. Only you can open them.'
      : (state.warning || 'The reading server is unavailable right now.');
  }
}

/* ── Static content ────────────────────────────────────────── */

function populateStatic() {
  if (dom.coverOrg) dom.coverOrg.textContent = `${EVENT.org} · ${EVENT.college}`;
  if (dom.coverTitle) dom.coverTitle.textContent = EVENT.title;
  if (dom.coverSub) dom.coverSub.textContent = EVENT.tagline;
  if (dom.coverEdition) dom.coverEdition.textContent = `${EDITION.name} · ${EDITION.license}`;

  if (dom.deptList) {
    // Legacy datalist fallback — no-op when obDept is now a <select>
  }
  if (dom.obRoll) {
    // Populate roll number dropdown 1–150
    const frag = document.createDocumentFragment();
    for (let i = 1; i <= 150; i++) {
      const opt = document.createElement('option');
      opt.value = String(i);
      opt.textContent = String(i);
      frag.append(opt);
    }
    dom.obRoll.append(frag);
  }
  if (dom.obGender) {
    const frag = document.createDocumentFragment();
    GENDERS.forEach((gender) => {
      const opt = document.createElement('option');
      opt.value = gender.value;
      opt.textContent = gender.label;
      frag.append(opt);
    });
    dom.obGender.append(frag);
  }
  if (dom.obDept) {
    // Populate department dropdown from DEPARTMENTS list
    const frag = document.createDocumentFragment();
    DEPARTMENTS.forEach((dept) => {
      const opt = document.createElement('option');
      opt.value = dept;
      opt.textContent = dept;
      frag.append(opt);
    });
    dom.obDept.append(frag);
  }
  if (dom.bookList) {
    BOOKS.forEach((book) => {
      const option = document.createElement('option');
      option.value = book;
      dom.bookList.append(option);
    });
  }
  if (dom.obYear) {
    YEARS.forEach((year) => {
      const option = document.createElement('option');
      option.value = year.value;
      option.textContent = year.label;
      dom.obYear.append(option);
    });
  }
  if (dom.obProgram) {
    PROGRAMS.forEach((program) => {
      const option = document.createElement('option');
      option.value = program.value;
      option.textContent = program.label;
      dom.obProgram.append(option);
    });
  }
  applyFont(store.getFont());
}

/* ── Rendering ─────────────────────────────────────────────── */

function renderCover() {
  if (dom.coverOrg) dom.coverOrg.textContent = `${EVENT.org} · ${EVENT.college}`;
  if (dom.coverTitle) dom.coverTitle.textContent = EVENT.title;
  if (dom.coverSub) dom.coverSub.textContent = EVENT.tagline;
  if (dom.coverEdition) dom.coverEdition.textContent = `${EDITION.name} · ${EDITION.license}`;

  const profile = state.profile;
  const name = String(profile?.name || '').trim();
  if (dom.coverAvatar) {
    dom.coverAvatar.textContent = profile ? (name.charAt(0).toUpperCase() || profile.roll) : '+';
  }
  if (dom.coverIdentityName) {
    dom.coverIdentityName.textContent = profile ? (name || `Roll ${profile.roll}`) : 'Register / Join';
  }
  if (dom.coverIdentitySub) {
    const year = profile?.year ? yearLabel(profile.year) : '';
    dom.coverIdentitySub.textContent = profile
      ? [`Roll ${profile.roll}`, year].filter(Boolean).join(' · ')
      : 'Create your reading pass in 20 seconds';
  }
  if (dom.coverRegBtn) {
    dom.coverRegBtn.setAttribute(
      'aria-label',
      profile ? `Signed in as ${name || profile.roll}. Tap to edit your registration.` : 'Register or join a group'
    );
  }

  if (dom.coverStats) dom.coverStats.hidden = !profile;
  if (dom.coverStreak) dom.coverStreak.textContent = String(state.stats.currentStreak || 0);
  if (dom.coverPoints) dom.coverPoints.textContent = String(state.stats.points || 0);
  if (dom.coverDays) dom.coverDays.textContent = String(state.stats.totalDays || 0);

  if (dom.coverCountdown) {
    let label;
    if (state.phase === 'before') {
      if (earlyOpen()) {
        label = 'Early access open';
      } else {
        const days = daysUntil(EVENT.start, state.today);
        label = days === 1 ? 'Opens tomorrow' : `Opens in ${days} days`;
      }
    } else if (state.phase === 'after') {
      label = 'The 25 days are complete';
    } else {
      label = `Day ${currentTodayIndex()} of 25`;
    }
    dom.coverCountdown.textContent = label;
  }

  if (dom.openBtn) {
    const span = dom.openBtn.querySelector('span');
    const label = profile ? 'Continue reading' : 'Explore the readings';
    if (span) span.textContent = label;
    else dom.openBtn.textContent = label;
  }
}

function renderDaily() {
  const index = state.phase === 'before'
    ? 1
    : clamp(currentTodayIndex() || 1, 1, PLAN.length);
  const verse = DAILY_VERSES[(index - 1) % DAILY_VERSES.length];
  if (dom.dailyLabel) {
    dom.dailyLabel.textContent = state.phase === 'before'
      ? 'A word for the season'
      : state.phase === 'after'
        ? 'The Word at Christmas'
        : 'Today’s word';
  }
  if (dom.dailyText) dom.dailyText.textContent = `“${verse.text}”`;
  if (dom.dailyRef) dom.dailyRef.textContent = `— ${verse.ref}`;
}

function renderToday() {
  renderDaily();
  renderAdvent();
  renderReading();
}

function renderAdvent() {
  if (!dom.adventStrip) return;
  const states = buildDayStates(state.reads, state.today, EVENT, { openAll: earlyOpen() });
  const fragment = document.createDocumentFragment();
  states.forEach((entry) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `door door-${entry.state}`;
    button.dataset.day = String(entry.day);
    button.disabled = entry.state === 'future';
    button.setAttribute(
      'aria-label',
      `Day ${entry.day}${entry.read ? ', read' : ''}${entry.state === 'future' ? ', locked' : ''}${entry.state === 'open' ? ', early access' : ''}`
    );
    if (entry.day === state.selectedDay) button.classList.add('is-selected');

    // Parse weekday from date string (e.g. '2026-12-01' -> 'Tue')
    let weekdayStr = '';
    try {
      const d = new Date(entry.date + 'T00:00:00');
      weekdayStr = d.toLocaleDateString('en-US', { weekday: 'short' });
    } catch (e) {
      weekdayStr = 'Day';
    }

    const weekday = el('span', 'door-weekday', weekdayStr);
    const number = el('span', 'door-num', String(entry.day));
    const mark = el('span', 'door-mark', entry.read ? '✓' : entry.state === 'today' ? '•' : '');
    button.append(weekday, number, mark);
    fragment.append(button);
  });
  dom.adventStrip.replaceChildren(fragment);

  const selectedBtn = dom.adventStrip.querySelector('.door.is-selected');
  if (selectedBtn) {
    window.setTimeout(() => {
      selectedBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }, 60);
  }

  const read = states.filter((entry) => entry.read).length;
  if (dom.adventProgress) dom.adventProgress.textContent = `${read} of ${states.length} doors`;
  if (dom.adventHint) {
    if (state.phase === 'before') {
      if (earlyOpen()) {
        dom.adventHint.textContent = 'Early access · every door is open. Points begin December 1.';
      } else {
        const days = daysUntil(EVENT.start, state.today);
        dom.adventHint.textContent = `The calendar opens in ${days} day${days === 1 ? '' : 's'}.`;
      }
    } else if (state.phase === 'after') {
      dom.adventHint.textContent = 'The calendar is complete. Every door stays open for reading.';
    } else {
      dom.adventHint.textContent = `Today is Day ${currentTodayIndex()}. Only today’s reading earns points.`;
    }
  }
}

function renderReading() {
  if (!dom.readingCard) return;
  const preview = earlyOpen();
  const plan = currentPlan();
  const selectedDate = dateForDay(EVENT.start, state.selectedDay);
  const today = state.selectedDay === currentTodayIndex() && state.phase === 'during';
  const isFuture = !preview && selectedDate > state.today;

  dom.readingCard.classList.toggle('is-today', today);
  dom.readingCard.classList.toggle('is-future', isFuture);
  dom.readingCard.classList.toggle('is-past', selectedDate < state.today);

  if (state.phase === 'before' && !preview) {
    if (dom.readingDay) dom.readingDay.textContent = 'Advent';
    if (dom.readingTheme) dom.readingTheme.textContent = 'Get ready';
    if (dom.readingRef) dom.readingRef.textContent = '';
    if (dom.readingTitle) dom.readingTitle.textContent = 'The calendar opens on December 1';
    if (dom.passageText) {
      dom.passageText.replaceChildren(
        el('p', 'passage-note', `Twenty-five doors, one for each day leading to Christmas. Come back on December 1 to open the first one.`)
      );
    }
    if (dom.readingPrompt) dom.readingPrompt.textContent = 'Prepare your heart. The Word is on its way.';
    if (dom.markReadBtn) dom.markReadBtn.hidden = true;
    if (dom.writeNoteBtn) dom.writeNoteBtn.hidden = true;
    if (dom.extraReadBtn) dom.extraReadBtn.hidden = true;
    if (dom.readStatus) dom.readStatus.textContent = `Begins in ${daysUntil(EVENT.start, state.today)} days.`;
    return;
  }

  if (isFuture) {
    if (dom.readingDay) dom.readingDay.textContent = `Day ${state.selectedDay}`;
    if (dom.readingTheme) dom.readingTheme.textContent = plan.theme;
    if (dom.readingRef) dom.readingRef.textContent = plan.ref;
    if (dom.readingTitle) dom.readingTitle.textContent = plan.title;
    if (dom.passageText) {
      dom.passageText.replaceChildren(
        el('p', 'passage-note', `This door opens on ${formatLongDate(selectedDate)}.`)
      );
    }
    if (dom.readingPrompt) dom.readingPrompt.textContent = '';
    if (dom.markReadBtn) dom.markReadBtn.hidden = true;
    if (dom.writeNoteBtn) dom.writeNoteBtn.hidden = true;
    if (dom.extraReadBtn) dom.extraReadBtn.hidden = true;
    if (dom.readStatus) dom.readStatus.textContent = `Opens ${formatLongDate(selectedDate)}.`;
    return;
  }

  if (dom.readingDay) dom.readingDay.textContent = `Day ${state.selectedDay}`;
  if (dom.readingTheme) dom.readingTheme.textContent = plan.theme;
  if (dom.readingRef) dom.readingRef.textContent = plan.ref;
  if (dom.readingTitle) dom.readingTitle.textContent = plan.title;
  if (dom.passageText) {
    const fragment = document.createDocumentFragment();
    plan.verses.forEach((verse) => {
      const p = document.createElement('p');
      const sup = el('sup', '', String(verse.v));
      p.append(sup, document.createTextNode(` ${verse.t}`));
      fragment.append(p);
    });
    dom.passageText.replaceChildren(fragment);
  }
  if (dom.readingPrompt) dom.readingPrompt.textContent = plan.prompt;

  const data = readState(selectedDate);
  const before = dayPoints(data, EVENT.points);
  const after = dayPoints({ ...data, planRead: true }, EVENT.points);
  const gain = Math.max(0, after - before);

  if (dom.markReadBtn) {
    const show = today && !data.planRead;
    dom.markReadBtn.hidden = !show;
    dom.markReadBtn.disabled = !show;
    dom.markReadBtn.textContent = data.planRead ? 'Read today ✓' : `Mark as read (+${gain})`;
  }
  if (dom.writeNoteBtn) {
    dom.writeNoteBtn.hidden = false;
    dom.writeNoteBtn.textContent = data.planRead || selectedDate < state.today ? 'Add a note' : 'Write a note';
  }
  if (dom.extraReadBtn) {
    dom.extraReadBtn.hidden = !today;
    const extras = Number(data.extraReads) || 0;
    const capped = extras >= EVENT.points.maxExtras;
    const nextGain = capped
      ? 0
      : Math.max(0, dayPoints({ ...data, extraReads: extras + 1 }, EVENT.points) - dayPoints(data, EVENT.points));
    dom.extraReadBtn.textContent = capped ? 'Extra readings logged' : `Read something else (+${nextGain})`;
    dom.extraReadBtn.disabled = capped;
  }

  if (dom.readStatus) {
    if (preview) {
      dom.readStatus.textContent = `Early access · reading only. Points and streaks begin ${formatLongDate(EVENT.start)}.`;
    } else if (today) {
      dom.readStatus.textContent = data.planRead
        ? `Read today · ${dayPoints(data, EVENT.points)} points · ${state.stats.currentStreak} day streak`
        : 'Not yet read today. Mark it to keep your streak.';
    } else if (selectedDate < state.today) {
      if (state.phase === 'after' && !data.planRead) {
        dom.readStatus.textContent = 'The 25 days are complete. You can still read and add notes.';
      } else {
        dom.readStatus.textContent = data.planRead
          ? `Read on ${formatLongDate(selectedDate)} · ${dayPoints(data, EVENT.points)} points`
          : 'This door is open for reading and notes, but only today’s reading earns points.';
      }
    } else {
      dom.readStatus.textContent = `Opens ${formatLongDate(selectedDate)}.`;
    }
  }
}

function renderStreak() {
  if (dom.streakNumber) dom.streakNumber.textContent = String(state.stats.currentStreak);
  if (dom.streakLabel) dom.streakLabel.textContent = state.phase === 'after' ? 'final streak' : 'day streak';
  if (dom.statPoints) dom.statPoints.textContent = String(state.stats.points);
  if (dom.statDays) dom.statDays.textContent = String(state.stats.totalDays);
  if (dom.statLongest) dom.statLongest.textContent = String(state.stats.longestStreak);
  if (dom.streakFlame) dom.streakFlame.classList.toggle('is-lit', state.stats.currentStreak > 0);

  if (dom.streakNote) {
    if (state.phase === 'before') {
      const days = daysUntil(EVENT.start, state.today);
      dom.streakNote.textContent = `Advent begins in ${days} day${days === 1 ? '' : 's'}.`;
    } else if (state.phase === 'after') {
      dom.streakNote.textContent = 'The calendar is complete. Your final streak is in the book.';
    } else if (state.stats.todayRead) {
      dom.streakNote.textContent = 'Today is marked. Come back tomorrow to keep it alive.';
    } else {
      dom.streakNote.textContent = 'Read today to keep your streak alive.';
    }
  }
}

function renderJourney() {
  if (dom.journeyHero) {
    const fragment = document.createDocumentFragment();
    const items = [
      ['Current streak', state.stats.currentStreak, 'days'],
      ['Longest streak', state.stats.longestStreak, 'days'],
      ['Days read', state.stats.totalDays, 'of 25'],
      ['Points', state.stats.points, 'total']
    ];
    items.forEach(([label, value, suffix]) => {
      const card = el('div', 'hero-stat');
      card.append(el('span', 'hero-value', String(value)), el('span', 'hero-label', label), el('span', 'hero-suffix', suffix));
      fragment.append(card);
    });
    dom.journeyHero.replaceChildren(fragment);
  }

  if (dom.journeyGrid) {
    const states = buildDayStates(state.reads, state.today, EVENT, { openAll: earlyOpen() });
    const fragment = document.createDocumentFragment();
    states.forEach((entry) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `journey-day journey-${entry.state}`;
      button.dataset.day = String(entry.day);
      button.disabled = entry.state === 'future';
      button.setAttribute('aria-label', `Day ${entry.day}, ${entry.state}`);
      button.append(
        el('span', 'journey-num', String(entry.day)),
        el('span', 'journey-date', formatLongDate(entry.date).split(',')[1]?.trim() || ''),
        el('span', 'journey-mark', entry.read ? '★' : entry.state === 'today' ? '✦' : '')
      );
      fragment.append(button);
    });
    dom.journeyGrid.replaceChildren(fragment);
  }

  if (dom.badges) {
    const fragment = document.createDocumentFragment();
    EVENT.milestones.forEach((milestone) => {
      const earned = state.stats.longestStreak >= milestone.days;
      const card = el('div', `badge${earned ? ' is-earned' : ''}`);
      card.append(
        el('span', 'badge-mark', earned ? '★' : '☆'),
        el('span', 'badge-name', milestone.label),
        el('span', 'badge-desc', milestone.desc),
        el('span', 'badge-points', `+${milestone.points} pts`)
      );
      fragment.append(card);
    });
    dom.badges.replaceChildren(fragment);
  }

  if (dom.pointsBreakdown) {
    const extras = state.stats.readDays.reduce(
      (sum, key) => sum + (Number(state.reads[key]?.extraReads) || 0),
      0
    );
    const rows = [
      ['Readings & extras', state.stats.dailyPoints],
      ['Milestone bonuses', state.stats.milestonePoints],
      ['Total points', state.stats.points]
    ];
    const fragment = document.createDocumentFragment();
    rows.forEach(([label, value], index) => {
      const row = el('div', `points-row${index === rows.length - 1 ? ' is-total' : ''}`);
      row.append(el('span', '', label), el('strong', '', String(value)));
      fragment.append(row);
    });
    if (extras) {
      fragment.append(el('p', 'points-note', `${extras} extra reading${extras === 1 ? '' : 's'} logged.`));
    }
    dom.pointsBreakdown.replaceChildren(fragment);
  }
}

function renderNotes() {
  if (!dom.notesList) return;
  const visible = state.notes
    .filter((note) => noteMatches(note, state.noteQuery))
    .sort((a, b) => (Number(b.pinned) - Number(a.pinned)) || (b.updatedAt - a.updatedAt));

  const fragment = document.createDocumentFragment();
  visible.forEach((note) => {
    const item = el('li', `note${note.pinned ? ' is-pinned' : ''}`);
    item.dataset.id = note.id;

    const top = el('div', 'note-top');
    const refButton = document.createElement('button');
    refButton.type = 'button';
    refButton.className = 'note-ref';
    refButton.dataset.act = 'copy';
    refButton.textContent = note.ref || 'Note';
    refButton.title = 'Copy reference';
    top.append(refButton, el('span', 'note-date', store.formatDate(note.updatedAt)));
    item.append(top);

    if (note.text) item.append(el('p', 'note-text', note.text));

    if (note.tags.length) {
      const tags = el('div', 'note-tags');
      note.tags.forEach((tag) => {
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'tag';
        chip.dataset.act = 'tag';
        chip.dataset.tag = tag;
        chip.textContent = `#${tag}`;
        tags.append(chip);
      });
      item.append(tags);
    }

    const actions = el('div', 'note-actions');
    const action = (act, label, extra) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `note-action${extra ? ` ${extra}` : ''}`;
      button.dataset.act = act;
      button.textContent = label;
      return button;
    };
    actions.append(
      action('pin', note.pinned ? 'Unpin' : 'Pin'),
      action('edit', 'Edit'),
      action('delete', 'Delete', 'danger')
    );
    item.append(actions);
    fragment.append(item);
  });
  dom.notesList.replaceChildren(fragment);

  if (dom.notesEmpty) {
    dom.notesEmpty.hidden = visible.length > 0;
    if (!visible.length) {
      dom.notesEmpty.textContent = state.noteQuery
        ? `No notes match “${state.noteQuery}”.`
        : 'Your margins are waiting. Write your first note from Today.';
    }
  }
}

function renderMyGroup() {
  if (!dom.myGroup) return;
  clear(dom.myGroup);
  if (!state.profile) {
    const card = el('div', 'group-card');
    card.append(
      el('p', 'kicker', 'Jesus Youth Groups'),
      el('h3', '', 'Reading together with your friends?'),
      el('p', 'muted', 'Register your roll number to form a group of 4, or join with a code.')
    );
    const regBtn = document.createElement('button');
    regBtn.type = 'button';
    regBtn.className = 'btn btn-primary small';
    regBtn.style.marginTop = '10px';
    regBtn.textContent = 'Register to join a group';
    regBtn.onclick = showOnboarding;
    card.append(regBtn);
    dom.myGroup.append(card);
    return;
  }

  if (state.group) {
    const card = el('div', 'group-card');
    const head = el('div', 'group-head');
    head.append(el('p', 'kicker', 'Your group'), el('h3', '', state.group.name));
    const code = el('button', 'group-code', state.group.code);
    code.type = 'button';
    code.dataset.act = 'copy-code';
    code.title = 'Copy join code';
    head.append(code);
    card.append(head);

    const members = Array.isArray(state.group.memberRolls) ? state.group.memberRolls : [];
    card.append(el('p', 'group-count', `${members.length} of ${EVENT.groupMax} members`));
    if (members.length) {
      const list = el('ul', 'group-members');
      members.forEach((roll) => list.append(el('li', '', roll === state.profile.roll ? `${roll} (you)` : roll)));
      card.append(list);
    }

    const leave = document.createElement('button');
    leave.type = 'button';
    leave.className = 'link-btn danger';
    leave.dataset.act = 'leave-group';
    leave.textContent = 'Leave group';
    card.append(leave);
    dom.myGroup.append(card);
    return;
  }

  const card = el('div', 'group-card');
  card.append(
    el('p', 'kicker', 'Your group'),
    el('p', 'muted', 'You are reading solo. You still appear on the individual boards.')
  );
  const create = document.createElement('button');
  create.type = 'button';
  create.className = 'btn btn-ghost';
  create.dataset.act = 'create-group';
  create.textContent = 'Create a group';
  card.append(create);

  const form = document.createElement('form');
  form.className = 'join-form';
  form.dataset.act = 'join-form';
  const input = document.createElement('input');
  input.id = 'joinCode';
  input.name = 'joinCode';
  input.maxLength = EVENT.groupCodeLength;
  input.placeholder = 'Join code';
  input.autocomplete = 'off';
  input.setAttribute('aria-label', 'Group join code');
  const join = document.createElement('button');
  join.type = 'submit';
  join.className = 'btn btn-primary';
  join.textContent = 'Join';
  form.append(input, join);
  card.append(form);
  dom.myGroup.append(card);
}

function renderBoard() {
  if (!dom.boardList) return;
  const cache = state.cache;
  if (state.loadingBoard && !cache) {
    dom.boardList.replaceChildren(el('li', 'board-empty', 'Loading the board…'));
    return;
  }
  if (!cache) {
    dom.boardList.replaceChildren(el('li', 'board-empty', 'The board is empty. Read today to light it up.'));
    if (dom.boardFoot) dom.boardFoot.textContent = '';
    return;
  }

  const readers = Array.isArray(cache.readers) ? cache.readers : [];
  const groups = Array.isArray(cache.groups) ? cache.groups : [];

  if (state.board === 'groups') {
    const byRoll = new Map(readers.map((reader) => [reader.roll, reader]));
    const rows = groups.map((group) => {
      const memberRolls = Array.isArray(group.memberRolls) ? group.memberRolls : [];
      const members = memberRolls.map((roll) => byRoll.get(roll)).filter(Boolean);
      const avgStreak = members.length
        ? members.reduce((sum, reader) => sum + (Number(reader.currentStreak) || 0), 0) / members.length
        : 0;
      const avgPoints = members.length
        ? members.reduce((sum, reader) => sum + (Number(reader.points) || 0), 0) / members.length
        : 0;
      return { group, members, memberRolls, avgStreak, avgPoints };
    }).filter((row) => row.memberRolls.length > 0);

    rows.sort((a, b) =>
      (b.avgStreak - a.avgStreak) ||
      (b.avgPoints - a.avgPoints) ||
      String(a.group.name).localeCompare(String(b.group.name))
    );

    if (!rows.length) {
      dom.boardList.replaceChildren(el('li', 'board-empty', 'No groups yet. Start one from the card above.'));
    } else {
      const fragment = document.createDocumentFragment();
      rows.slice(0, 100).forEach((row, index) => {
        const item = el('li', 'board-row');
        if (row.group.code === state.profile?.groupCode) item.classList.add('is-me');
        item.append(
          el('span', 'board-rank', String(index + 1)),
          (() => {
            const main = el('span', 'board-main');
            main.append(
              el('span', 'board-name', row.group.name),
              el('span', 'board-sub', `${row.memberRolls.length}/${EVENT.groupMax} members · avg ${row.avgPoints.toFixed(0)} pts`)
            );
            return main;
          })(),
          (() => {
            const value = el('span', 'board-value');
            value.append(el('strong', '', row.avgStreak.toFixed(1)), el('small', '', 'avg streak'));
            return value;
          })()
        );
        fragment.append(item);
      });
      dom.boardList.replaceChildren(fragment);
    }
  } else {
    const sorted = [...readers].sort((a, b) => {
      if (state.board === 'points') {
        return (Number(b.points) || 0) - (Number(a.points) || 0) ||
          (Number(b.currentStreak) || 0) - (Number(a.currentStreak) || 0) ||
          String(a.roll).localeCompare(String(b.roll));
      }
      return (Number(b.currentStreak) || 0) - (Number(a.currentStreak) || 0) ||
        (Number(b.points) || 0) - (Number(a.points) || 0) ||
        (Number(b.totalDays) || 0) - (Number(a.totalDays) || 0) ||
        String(a.roll).localeCompare(String(b.roll));
    });

    if (!sorted.length) {
      dom.boardList.replaceChildren(el('li', 'board-empty', 'No readers yet. Be the first.'));
    } else {
      const fragment = document.createDocumentFragment();
      sorted.slice(0, 100).forEach((reader, index) => {
        const item = el('li', 'board-row');
        if (reader.roll === state.profile?.roll) item.classList.add('is-me');
        const value = el('span', 'board-value');
        if (state.board === 'points') {
          value.append(el('strong', '', String(Number(reader.points) || 0)), el('small', '', 'points'));
        } else {
          value.append(el('strong', '', String(Number(reader.currentStreak) || 0)), el('small', '', 'day streak'));
        }
        const main = el('span', 'board-main');
        main.append(
          el('span', 'board-name', displayReader(reader)),
          el('span', 'board-sub', state.board === 'points'
            ? `${Number(reader.totalDays) || 0} days read · longest ${Number(reader.longestStreak) || 0}`
            : `Longest ${Number(reader.longestStreak) || 0} · ${Number(reader.points) || 0} pts`)
        );
        item.append(el('span', 'board-rank', String(index + 1)), main, value);
        fragment.append(item);
      });
      dom.boardList.replaceChildren(fragment);
    }
  }

  if (dom.boardFoot) {
    dom.boardFoot.textContent = `Updated ${new Date(cache.at).toLocaleTimeString()} · Only your name, roll, gender, department, year, program, group, streak and points are public.`;
  }
}

function renderProfile() {
  if (!dom.profileSummary) return;
  clear(dom.profileSummary);
  if (!state.profile) {
    const p = el('p', 'muted', 'You are currently browsing as a guest.');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn btn-primary small';
    btn.style.marginTop = '10px';
    btn.textContent = 'Register your roll number';
    btn.onclick = () => {
      closeDialog(dom.settingsDialog);
      showOnboarding();
    };
    dom.profileSummary.append(p, btn);
    return;
  }
  const rows = [
    ['Name', state.profile.name || '—'],
    ['Phone', state.profile.phone || '—'],
    ['Roll number', state.profile.roll],
    ['Gender', genderLabel(state.profile.gender) || '—'],
    ['Department', state.profile.dept],
    ['Year', yearLabel(state.profile.year)],
    ['Program', state.profile.program],
    ['Group', state.group ? `${state.group.name} (${state.group.code})` : 'Solo']
  ];
  rows.forEach(([label, value]) => {
    const row = el('div', 'profile-row');
    row.append(el('span', '', label), el('strong', '', value));
    dom.profileSummary.append(row);
  });
  if (dom.deviceId) dom.deviceId.textContent = state.backend ? state.backend.uid : '—';
}

function renderAll() {
  renderToday();
  renderStreak();
  renderJourney();
  renderNotes();
  renderProfile();
  renderMyGroup();
  renderBoard();
  updateSyncBadge();
  const isGuest = !state.profile;
  if (dom.headerUserName) {
    const firstName = String(state.profile?.name || '').trim().split(/\s+/)[0];
    dom.headerUserName.textContent = firstName || (state.profile ? state.profile.roll : 'Friend');
  }
  if (dom.registerBtn) dom.registerBtn.hidden = true; // always hidden – avatar btn + guest banner handle registration
  if (dom.guestBanner) dom.guestBanner.hidden = !isGuest;
  if (dom.guestReadingHint) dom.guestReadingHint.hidden = !isGuest;
  if (dom.accountLabel) {
    dom.accountLabel.textContent = isGuest ? 'Account' : state.profile.roll;
  }
  if (dom.accountBtn) {
    dom.accountBtn.classList.toggle('is-signed-in', !isGuest);
    dom.accountBtn.classList.toggle('is-guest', isGuest);
    dom.accountBtn.title = isGuest ? 'Guest (Click to sign in)' : `Signed in as ${state.profile.roll}`;
  }
}

/* ── Navigation ────────────────────────────────────────────── */

function switchView(view, options = {}) {
  if (!view) return;
  const previous = state.view;
  const changed = previous !== view;

  if (changed && state.entered) viewScroll.set(previous, window.scrollY);
  state.view = view;

  const section = document.getElementById(`view-${view}`);
  document.querySelectorAll('.view').forEach((item) => {
    item.hidden = item !== section;
  });
  document.querySelectorAll('[data-view]').forEach((button) => {
    button.setAttribute('aria-current', String(button.dataset.view === view));
  });
  if (view === 'together') loadBoard(false);
  if (view === 'notes') renderNotes();
  if (view === 'journey') renderJourney();

  const restore = changed ? (viewScroll.get(view) || 0) : 0;
  window.scrollTo(0, restore);

  if (changed && state.entered) {
    if (!options.fromHistory && options.history !== false) pushViewHistory(view);
    const prevIndex = VIEW_ORDER.indexOf(previous);
    const nextIndex = VIEW_ORDER.indexOf(view);
    if (options.animate !== false) {
      animateView(section, options.direction || (nextIndex < prevIndex ? 'back' : 'forward'));
    }
    haptic(6);
  }

  requestAnimationFrame(positionNavIndicator);
}

function enterApp() {
  state.entered = true;
  if (dom.cover) {
    dom.cover.style.opacity = '0';
    dom.cover.style.pointerEvents = 'none';
    window.setTimeout(() => { dom.cover.hidden = true; }, 350);
  }
  if (dom.app) dom.app.hidden = false;
  renderAll();
  switchView('today', { history: false });
  window.setTimeout(() => dom.openBtn?.blur(), 50);
}

async function openApp() {
  if (!state.profile) {
    if (state.entered) { switchView('today'); return; }
    enterApp();
    return;
  }
  if (state.entered) {
    enterApp();
    return;
  }
  enterApp();
  if (state.backendReady) {
    state.backendReady.then(async () => {
      const ok = await hydrate();
      if (!ok && state.backend && state.backend.mode === 'firebase') showRecovery();
    });
  }
}

/* ── Onboarding ────────────────────────────────────────────── */

/* Call this before any action that needs a registered profile.
   Returns true if the user is already registered, false (and opens
   the onboarding dialog) if they are not. */
function requireProfile() {
  if (state.profile) return true;
  showToast('Register first to track your reading and earn points.', {
    label: 'Register',
    onClick: showOnboarding
  });
  return false;
}

function showOnboarding() {
  if (!dom.onboarding) return;
  if (dom.obDevice && state.backend) dom.obDevice.textContent = `Device ID: ${state.backend.uid}`;
  dom.obError.textContent = '';
  openDialog(dom.onboarding);
  window.setTimeout(() => dom.obName?.focus(), 100);
}

function groupMode() {
  const checked = document.querySelector('input[name="groupMode"]:checked');
  return checked ? checked.value : 'solo';
}

function syncGroupFields() {
  const mode = groupMode();
  document.querySelectorAll('[data-group-field]').forEach((field) => {
    field.hidden = field.dataset.groupField !== mode;
  });
}

async function submitOnboarding(event) {
  event.preventDefault();
  if (state.backendReady) await state.backendReady;
  if (!state.backend) {
    dom.obError.textContent = state.warning || 'Cannot reach the reading server. Check your connection and try again.';
    return;
  }

  const name = dom.obName.value.trim().replace(/\s+/g, ' ').slice(0, 60);
  const phone = normalizePhone(dom.obPhone.value);
  const roll = String(dom.obRoll.value).trim();
  const gender = dom.obGender.value;
  const dept = dom.obDept.value.trim();
  const year = dom.obYear.value;
  const program = dom.obProgram.value;
  const mode = groupMode();

  if (name.length < 2) {
    dom.obError.textContent = 'Please enter your full name.';
    dom.obName.focus();
    return;
  }
  if (!isValidRoll(roll)) {
    dom.obError.textContent = 'Please select a roll number.';
    dom.obRoll.focus();
    return;
  }
  if (!/^[6-9]\d{9}$/.test(phone)) {
    dom.obError.textContent = 'Enter a 10-digit mobile number starting with 6–9.';
    dom.obPhone.focus();
    return;
  }
  if (!gender) {
    dom.obError.textContent = 'Please select your gender.';
    dom.obGender.focus();
    return;
  }
  if (!dept) {
    dom.obError.textContent = 'Please select your department.';
    dom.obDept.focus();
    return;
  }

  let groupName = '';
  let groupCode = '';
  if (mode === 'create') {
    groupName = dom.obGroupName.value.trim().replace(/\s+/g, ' ').slice(0, 30);
    if (groupName.length < 2) {
      dom.obError.textContent = 'Give your group a name (at least 2 characters).';
      dom.obGroupName.focus();
      return;
    }
    if (!isCleanName(groupName)) {
      dom.obError.textContent = 'Please choose a different group name.';
      dom.obGroupName.focus();
      return;
    }
  }
  if (mode === 'join') {
    groupCode = normalizeGroupCode(dom.obGroupCode.value);
    if (groupCode.length !== EVENT.groupCodeLength) {
      dom.obError.textContent = `Enter the ${EVENT.groupCodeLength}-character group code.`;
      dom.obGroupCode.focus();
      return;
    }
  }

  const submit = dom.onboardForm.querySelector('button[type="submit"]');
  setBusy(submit, true, 'Registering…');
  dom.obError.textContent = '';

  try {
    const profile = {
      roll,
      name,
      phone,
      gender,
      dept,
      year,
      program,
      uid: state.backend.uid,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    const claimed = await state.backend.claimReader(profile);

    if (mode === 'create' || mode === 'join') {
      // Re-registering a roll can happen while its entry is still in a group.
      // Leave that group first so a student never appears in two groups.
      if (claimed && claimed.groupCode) {
        await state.backend.leaveGroup(claimed.groupCode, { ...profile, groupCode: claimed.groupCode });
      }
    }

    if (mode === 'create') {
      const code = await generateGroupCode();
      await state.backend.createGroup(groupName, code, profile);
      profile.groupCode = code;
    } else if (mode === 'join') {
      await state.backend.joinGroup(groupCode, profile);
      profile.groupCode = groupCode;
    }

    state.profile = profile;
    store.saveProfile(profile);

    // Load any entry that already belongs to this device, so re-registering a
    // roll after removing the local profile restores its streak and notes
    // instead of overwriting them with an empty local copy.
    const restored = await hydrate({ claim: false });
    if (!restored) throw new Error('Could not load your saved entry. Try again.');
    await loadEarlyAccess();

    closeDialog(dom.onboarding);
    enterApp();
    showToast('Welcome to the 25-day journey.');
  } catch (err) {
    if (err.code === 'ROLL_TAKEN') {
      dom.obError.textContent = `That roll number is linked to another device. Show this device ID to an organizer: ${state.backend.uid}`;
    } else if (err.code === 'GROUP_FULL') {
      dom.obError.textContent = 'That group already has four members.';
    } else if (err.code === 'GROUP_NOT_FOUND') {
      dom.obError.textContent = 'No group has that code.';
    } else {
      dom.obError.textContent = err.message || 'Could not register. Check your connection and try again.';
    }
  } finally {
    setBusy(submit, false);
  }
}

async function generateGroupCode() {
  const alphabet = EVENT.groupCodeAlphabet;
  for (let attempt = 0; attempt < 12; attempt += 1) {
    let code = '';
    for (let i = 0; i < EVENT.groupCodeLength; i += 1) {
      code += alphabet[Math.floor(Math.random() * alphabet.length)];
    }
    const existing = await safe(() => state.backend.findGroup(code), null);
    if (!existing) return code;
  }
  throw new Error('Could not generate a group code. Try again.');
}

/* ── Reading actions ───────────────────────────────────────── */

async function markRead() {
  if (!requireProfile()) return;
  if (state.phase !== 'during' || state.selectedDay !== currentTodayIndex()) return;
  const day = state.today;
  const data = readState(day);
  if (data.planRead) {
    showToast('Today is already marked.');
    return;
  }
  const beforeStreak = state.stats.currentStreak;
  const beforePoints = dayPoints(data, EVENT.points);
  state.reads[day] = {
    planRead: true,
    extraReads: Number(data.extraReads) || 0,
    refs: data.refs || []
  };
  recompute();
  persist();
  await saveDay(day);
  await syncReader();
  renderAll();
  const gained = Math.max(0, dayPoints(state.reads[day], EVENT.points) - beforePoints);
  const streak = state.stats.currentStreak;
  showToast(
    streak > beforeStreak
      ? `+${gained} points · ${streak} day streak`
      : `+${gained} points`
  );
}

async function logExtra(ref) {
  if (state.phase !== 'during') {
    showToast('Extra readings can be logged during the 25 days.');
    return false;
  }
  const day = state.today;
  const data = readState(day);
  if ((Number(data.extraReads) || 0) >= EVENT.points.maxExtras) {
    showToast(`You have already logged ${EVENT.points.maxExtras} extra readings today.`);
    return false;
  }
  state.reads[day] = {
    planRead: Boolean(data.planRead),
    extraReads: (Number(data.extraReads) || 0) + 1,
    refs: [...(data.refs || []), ref].slice(0, 4)
  };
  recompute();
  persist();
  await saveDay(day);
  await syncReader();
  renderAll();
  const before = dayPoints(data, EVENT.points);
  const after = dayPoints(state.reads[day], EVENT.points);
  showToast(`Reading logged · +${Math.max(0, after - before)} points`);
  return true;
}

function openExtraDialog() {
  if (!requireProfile()) return;
  if (state.phase !== 'during') return;
  if (dom.extraForm) dom.extraForm.reset();
  if (dom.extraPreview) dom.extraPreview.textContent = '';
  openDialog(dom.extraDialog);
  window.setTimeout(() => dom.extraBook?.focus(), 100);
}

function updateExtraPreview() {
  const ref = assembleReference(dom.extraBook.value, dom.extraChapter.value, dom.extraVerse.value);
  if (dom.extraPreview) dom.extraPreview.textContent = ref;
  const book = formatBookName(dom.extraBook.value);
  const count = chaptersFor(book);
  if (count) {
    const fragment = document.createDocumentFragment();
    for (let i = 1; i <= count; i += 1) {
      const option = document.createElement('option');
      option.value = String(i);
      fragment.append(option);
    }
    dom.chapterList.replaceChildren(fragment);
  }
}

async function submitExtra(event) {
  event.preventDefault();
  const ref = assembleReference(dom.extraBook.value, dom.extraChapter.value, dom.extraVerse.value);
  if (!ref) {
    showToast('Choose a passage first.');
    dom.extraBook.focus();
    return;
  }
  const submit = dom.extraForm.querySelector('button[type="submit"]');
  setBusy(submit, true, 'Logging…');
  const ok = await logExtra(ref);
  setBusy(submit, false);
  if (ok) closeDialog(dom.extraDialog);
}

/* ── Notes ─────────────────────────────────────────────────── */

function openNote(note) {
  if (!note && !requireProfile()) return;  // new note needs registration; editing existing is fine
  if (!dom.noteDialog) return;
  state.editingNoteId = note ? note.id : null;
  dom.noteDialogTitle.textContent = note ? 'Edit note' : 'New note';
  dom.noteRef.value = note ? note.ref : currentPlan().ref;
  dom.noteText.value = note ? note.text : '';
  dom.noteTags.value = note ? note.tags.join(', ') : '';
  openDialog(dom.noteDialog);
  window.setTimeout(() => dom.noteText?.focus(), 100);
}

async function submitNote(event) {
  event.preventDefault();
  const ref = formatReference(dom.noteRef.value);
  const text = dom.noteText.value.trim();
  const tags = parseTags(dom.noteTags.value);
  if (!ref && !text) {
    showToast('Write a reference or a note first.');
    dom.noteRef.focus();
    return;
  }

  const now = Date.now();
  let note;
  if (state.editingNoteId) {
    note = state.notes.find((entry) => entry.id === state.editingNoteId);
    if (!note) {
      state.editingNoteId = null;
      return submitNote(event);
    }
    Object.assign(note, { ref, text, tags, updatedAt: now });
  } else {
    note = normalizeNote({ ref, text, tags, createdAt: now, updatedAt: now });
    state.notes.unshift(note);
  }

  persist();
  renderNotes();
  closeDialog(dom.noteDialog);
  state.editingNoteId = null;
  try {
    if (state.backend && state.profile) await state.backend.saveNote(state.profile.roll, note);
    showToast('Note saved.');
  } catch (err) {
    showToast('Saved on this device. It will sync when you reconnect.');
  }
}

async function deleteNote(id) {
  const index = state.notes.findIndex((note) => note.id === id);
  if (index < 0) return;
  const removed = state.notes.splice(index, 1)[0];
  persist();
  renderNotes();
  if (state.backend && state.profile) {
    await safe(() => state.backend.deleteNote(state.profile.roll, id));
  }
  showToast('Note deleted.', {
    label: 'Undo',
    onClick: async () => {
      state.notes.push(removed);
      persist();
      renderNotes();
      if (state.backend && state.profile) await safe(() => state.backend.saveNote(state.profile.roll, removed));
      showToast('Note restored.');
    }
  });
}

async function togglePin(id) {
  const note = state.notes.find((entry) => entry.id === id);
  if (!note) return;
  note.pinned = !note.pinned;
  note.updatedAt = Date.now();
  persist();
  renderNotes();
  if (state.backend && state.profile) await safe(() => state.backend.saveNote(state.profile.roll, note));
  showToast(note.pinned ? 'Pinned to the top.' : 'Unpinned.');
}

/* ── Groups ────────────────────────────────────────────────── */

function openGroupDialog() {
  if (dom.groupForm) dom.groupForm.reset();
  openDialog(dom.groupDialog);
  window.setTimeout(() => dom.groupName?.focus(), 100);
}

async function submitGroup(event) {
  event.preventDefault();
  if (!state.profile || !state.backend) return;
  const name = dom.groupName.value.trim().replace(/\s+/g, ' ').slice(0, 30);
  if (name.length < 2) {
    showToast('Give your group a name (at least 2 characters).');
    dom.groupName.focus();
    return;
  }
  if (!isCleanName(name)) {
    showToast('Please choose a different group name.');
    dom.groupName.focus();
    return;
  }
  const submit = dom.groupForm.querySelector('button[type="submit"]');
  setBusy(submit, true, 'Creating…');
  try {
    const code = await generateGroupCode();
    const group = await state.backend.createGroup(name, code, state.profile);
    state.profile.groupCode = group.code;
    store.saveProfile(state.profile);
    state.group = group;
    await syncReader();
    closeDialog(dom.groupDialog);
    renderMyGroup();
    renderProfile();
    loadBoard(true);
    showToast(`Group created. Share code ${group.code}.`);
  } catch (err) {
    showToast(err.message || 'Could not create the group.');
  } finally {
    setBusy(submit, false);
  }
}

async function joinGroup(code) {
  if (!state.profile || !state.backend) return;
  const normalized = normalizeGroupCode(code);
  if (normalized.length !== EVENT.groupCodeLength) {
    showToast(`Enter the ${EVENT.groupCodeLength}-character group code.`);
    return;
  }
  try {
    const group = await state.backend.joinGroup(normalized, state.profile);
    state.profile.groupCode = normalized;
    store.saveProfile(state.profile);
    state.group = group;
    await syncReader();
    renderMyGroup();
    renderProfile();
    loadBoard(true);
    showToast(`Joined ${group.name}.`);
  } catch (err) {
    showToast(err.message || 'Could not join the group.');
  }
}

async function leaveGroup() {
  if (!state.profile || !state.profile.groupCode || !state.backend) return;
  if (!window.confirm('Leave this group? You can join another one later.')) return;
  const code = state.profile.groupCode;
  try {
    await state.backend.leaveGroup(code, state.profile);
    state.profile.groupCode = null;
    store.saveProfile(state.profile);
    state.group = null;
    await syncReader();
    renderMyGroup();
    renderProfile();
    loadBoard(true);
    showToast('You are reading solo again.');
  } catch (err) {
    showToast(err.message || 'Could not leave the group.');
  }
}

/* ── Leaderboard ───────────────────────────────────────────── */

async function loadBoard(force) {
  if (!state.backend) return;
  const fresh = state.cache && Date.now() - state.cache.at < EVENT.boardCacheMs;
  if (!force && fresh) {
    renderBoard();
    return;
  }
  if (state.loadingBoard) return;
  state.loadingBoard = true;
  renderBoard();
  try {
    const [readers, groups] = await Promise.all([
      state.backend.listReaders(),
      state.backend.listGroups()
    ]);
    state.cache = { at: Date.now(), readers, groups };
    store.saveCache(state.cache);
  } catch (err) {
    console.warn(err);
    if (!state.cache) showToast('Could not load the board. Check your connection.');
  } finally {
    state.loadingBoard = false;
    renderBoard();
  }
}

function exportBoardCsv() {
  if (!state.cache) {
    showToast('Load the board first.');
    return;
  }
  const rows = [['rank', 'roll', 'department', 'year', 'program', 'group', 'current_streak', 'longest_streak', 'days_read', 'points']];
  const readers = [...state.cache.readers].sort((a, b) =>
    (Number(b.currentStreak) || 0) - (Number(a.currentStreak) || 0) ||
    (Number(b.points) || 0) - (Number(a.points) || 0)
  );
  readers.forEach((reader, index) => {
    rows.push([
      index + 1,
      reader.roll,
      reader.dept,
      reader.year,
      reader.program,
      reader.groupCode || '',
      reader.currentStreak || 0,
      reader.longestStreak || 0,
      reader.totalDays || 0,
      reader.points || 0
    ]);
  });
  const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
  store.download(`christmas-2026-leaderboard-${dayKey()}.csv`, csv, 'text/csv');
  showToast('Leaderboard CSV downloaded.');
}

/* ── Settings, backup, recovery ────────────────────────────── */

function openSettings() {
  renderProfile();
  openDialog(dom.settingsDialog);
}

function exportBackup() {
  if (!state.profile && !state.notes.length) {
    showToast('There is nothing to back up yet.');
    return;
  }
  const text = store.exportBackup(state);
  store.download(`christmas-2026-notes-${dayKey()}.json`, text);
  showToast('Backup downloaded.');
}

async function importBackup(file) {
  try {
    const data = await store.importBackup(file);
    state.notes = mergeNotes(state.notes, data.notes);
    state.reads = mergeReads(state.reads, data.reads);
    state.milestones = uniqueNumbers([...state.milestones, ...data.milestones]);
    recompute();
    persist();
    await pushLocal();
    renderAll();
    showToast(`Imported ${data.notes.length} note${data.notes.length === 1 ? '' : 's'}.`);
  } catch (err) {
    showToast('That file is not a Christmas 2026 backup.');
  }
}

function showRecovery() {
  if (!state.profile) return;
  const taken = state.recoveryReason === 'taken';
  if (dom.recoveryTitle) {
    dom.recoveryTitle.textContent = taken ? 'This roll is already linked' : 'We could not reach your entry';
  }
  if (dom.recoveryText) {
    dom.recoveryText.textContent = taken
      ? `“${state.profile.roll}” is linked to another device. Show the device ID below to an organizer, who can transfer it to you.`
      : 'Your notes are safe on this device. Check your connection and try again, or show the device ID below to an organizer.';
  }
  dom.recoveryRoll.textContent = state.profile.roll;
  dom.recoveryDevice.textContent = state.backend ? state.backend.uid : '—';
  openDialog(dom.recoveryDialog);
}

async function retryRecovery() {
  closeDialog(dom.recoveryDialog);
  const ok = await hydrate();
  if (ok) {
    enterApp();
    showToast('Welcome back. Your streak and notes are restored.');
  } else {
    showRecovery();
  }
}

function resetThisDevice() {
  if (!window.confirm('Remove this device’s profile, notes, streak, and cache? Export a backup first if you need it.')) return;
  store.clearData();
  store.clearDemo();
  if (state.backend) state.backend.signOut();
  window.location.reload();
}

async function leaveDevice() {
  if (!window.confirm('Remove this student from this device? Notes and streak are kept in Firebase if you are online, but local copies will be deleted. Export a backup first if you need it.')) return;
  await safe(() => state.backend && state.backend.signOut());
  store.clearData();
  window.location.reload();
}

/* ── Clock and lifecycle ───────────────────────────────────── */

function startClock() {
  window.clearInterval(clockTimer);
  clockTimer = window.setInterval(() => {
    const today = dayKey();
    if (today !== state.today) {
      state.today = today;
      state.phase = eventPhase(today, EVENT.start, EVENT.end);
      state.selectedDay = state.phase === 'before' ? 1 : state.phase === 'after' ? PLAN.length : clamp(todayIndex(today, EVENT.start, EVENT.end), 1, PLAN.length);
      recompute();
      persist();
      renderAll();
      if (state.profile) syncReader();
    }
    updateSyncBadge();
  }, 30000);
}

/* ── Events ────────────────────────────────────────────────── */

function isTyping(target) {
  if (!target) return false;
  const tag = target.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable;
}

function bindEvents() {
  if (dom.openBtn) dom.openBtn.addEventListener('click', (event) => {
    event.stopPropagation();
    openApp();
  });
  if (dom.coverRegBtn) dom.coverRegBtn.addEventListener('click', (event) => {
    event.stopPropagation();
    enterApp();
    showOnboarding();
  });
  // Splash screen stays until user clicks one of the 2 action buttons

  document.querySelectorAll('[data-view]').forEach((button) => {
    button.addEventListener('click', () => {
      const view = button.dataset.view;
      if (!view) return;
      if (state.entered && view === state.view) {
        haptic(5);
        scrollToTop({ smooth: true });
        return;
      }
      switchView(view);
    });
  });

  if (dom.themeBtn) dom.themeBtn.addEventListener('click', () => {
    const current = document.documentElement.dataset.theme;
    applyTheme(current === 'candle' ? 'day' : 'candle');
  });

  if (dom.coverThemeBtn) dom.coverThemeBtn.addEventListener('click', () => {
    const current = document.documentElement.dataset.theme;
    applyTheme(current === 'candle' ? 'day' : 'candle');
  });

  if (dom.openReadingBtn) {
    dom.openReadingBtn.addEventListener('click', () => {
      dom.readingCard?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }
  if (dom.quickReflectBtn) {
    dom.quickReflectBtn.addEventListener('click', () => openNote());
  }
  if (dom.quickStreakBtn) {
    dom.quickStreakBtn.addEventListener('click', () => switchView('journey'));
  }
  if (dom.quickTogetherBtn) {
    dom.quickTogetherBtn.addEventListener('click', () => switchView('together'));
  }
  if (dom.centerActionBtn) {
    dom.centerActionBtn.addEventListener('click', () => openNote());
  }

  if (dom.settingsBtn) dom.settingsBtn.addEventListener('click', openSettings);
  if (dom.accountBtn) {
    dom.accountBtn.addEventListener('click', () => {
      if (!state.profile) {
        showOnboarding();
      } else {
        openSettings();
      }
    });
  }
  if (dom.registerBtn) dom.registerBtn.addEventListener('click', showOnboarding);
  if (dom.guestBannerBtn) dom.guestBannerBtn.addEventListener('click', showOnboarding);
  if (dom.guestInlineRegisterBtn) dom.guestInlineRegisterBtn.addEventListener('click', showOnboarding);
  if (dom.closeOnboarding) dom.closeOnboarding.addEventListener('click', () => closeDialog(dom.onboarding));
  if (dom.cancelOnboarding) dom.cancelOnboarding.addEventListener('click', () => closeDialog(dom.onboarding));
  if (dom.onboarding) dom.onboarding.addEventListener('click', (event) => {
    if (event.target === dom.onboarding) closeDialog(dom.onboarding);
  });
  if (dom.closeSettings) dom.closeSettings.addEventListener('click', () => closeDialog(dom.settingsDialog));
  if (dom.settingsDialog) dom.settingsDialog.addEventListener('click', (event) => {
    if (event.target === dom.settingsDialog) closeDialog(dom.settingsDialog);
  });

  document.querySelectorAll('[data-theme-choice]').forEach((button) => {
    button.addEventListener('click', () => applyTheme(button.dataset.themeChoice));
  });
  if (dom.fontRange) dom.fontRange.addEventListener('input', () => applyFont(dom.fontRange.value));

  if (dom.exportBtn) dom.exportBtn.addEventListener('click', exportBackup);
  if (dom.importBtn) dom.importBtn.addEventListener('click', () => dom.importFile.click());
  if (dom.importFile) dom.importFile.addEventListener('change', async () => {
    const file = dom.importFile.files && dom.importFile.files[0];
    dom.importFile.value = '';
    if (file) await importBackup(file);
  });
  if (dom.printBtn) dom.printBtn.addEventListener('click', () => window.print());
  if (dom.copyDevice) dom.copyDevice.addEventListener('click', async () => {
    if (!state.backend) return;
    const ok = await store.copyText(state.backend.uid);
    showToast(ok ? 'Device ID copied.' : 'Could not copy the device ID.');
  });
  if (dom.leaveDevice) dom.leaveDevice.addEventListener('click', leaveDevice);

  if (dom.onboardForm) dom.onboardForm.addEventListener('submit', submitOnboarding);
  document.querySelectorAll('input[name="groupMode"]').forEach((radio) => {
    radio.addEventListener('change', syncGroupFields);
  });
  syncGroupFields();

  if (dom.markReadBtn) dom.markReadBtn.addEventListener('click', markRead);
  if (dom.writeNoteBtn) dom.writeNoteBtn.addEventListener('click', () => openNote(null));
  if (dom.extraReadBtn) dom.extraReadBtn.addEventListener('click', openExtraDialog);

  if (dom.adventStrip) dom.adventStrip.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-day]');
    if (!button || button.disabled) return;
    state.selectedDay = Number(button.dataset.day);
    renderToday();
  });

  if (dom.journeyGrid) dom.journeyGrid.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-day]');
    if (!button || button.disabled) return;
    state.selectedDay = Number(button.dataset.day);
    switchView('today');
    renderToday();
  });

  if (dom.boardTabs) dom.boardTabs.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-board]');
    if (!button) return;
    state.board = button.dataset.board;
    dom.boardTabs.querySelectorAll('button').forEach((item) => {
      item.setAttribute('aria-pressed', String(item.dataset.board === state.board));
    });
    renderBoard();
  });
  if (dom.refreshBoard) dom.refreshBoard.addEventListener('click', () => loadBoard(true));
  if (dom.exportBoard) dom.exportBoard.addEventListener('click', exportBoardCsv);

  if (dom.myGroup) {
    dom.myGroup.addEventListener('click', (event) => {
      const button = event.target.closest('button[data-act]');
      if (!button) return;
      const act = button.dataset.act;
      if (act === 'create-group') openGroupDialog();
      if (act === 'leave-group') leaveGroup();
      if (act === 'copy-code') {
        store.copyText(state.profile?.groupCode || '').then((ok) => {
          showToast(ok ? 'Join code copied.' : 'Could not copy the code.');
        });
      }
    });
    dom.myGroup.addEventListener('submit', (event) => {
      const form = event.target.closest('form[data-act="join-form"]');
      if (!form) return;
      event.preventDefault();
      const input = form.querySelector('input');
      if (input) joinGroup(input.value);
    });
  }

  if (dom.noteSearch) dom.noteSearch.addEventListener('input', () => {
    state.noteQuery = dom.noteSearch.value.trim();
    renderNotes();
  });
  if (dom.newNoteBtn) dom.newNoteBtn.addEventListener('click', () => openNote(null));
  if (dom.notesList) dom.notesList.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-act]');
    if (!button) return;
    const item = button.closest('.note');
    const note = item && state.notes.find((entry) => entry.id === item.dataset.id);
    if (!note) return;
    const act = button.dataset.act;
    if (act === 'copy') store.copyText(note.ref).then((ok) => showToast(ok ? 'Reference copied.' : 'Could not copy.'));
    if (act === 'tag') {
      dom.noteSearch.value = button.dataset.tag || '';
      state.noteQuery = dom.noteSearch.value.trim();
      renderNotes();
    }
    if (act === 'pin') togglePin(note.id);
    if (act === 'edit') openNote(note);
    if (act === 'delete') deleteNote(note.id);
  });

  if (dom.noteForm) dom.noteForm.addEventListener('submit', submitNote);
  if (dom.noteCancel) dom.noteCancel.addEventListener('click', () => closeDialog(dom.noteDialog));

  if (dom.extraForm) dom.extraForm.addEventListener('submit', submitExtra);
  if (dom.extraCancel) dom.extraCancel.addEventListener('click', () => closeDialog(dom.extraDialog));
  if (dom.extraBook) dom.extraBook.addEventListener('input', updateExtraPreview);
  if (dom.extraChapter) dom.extraChapter.addEventListener('input', updateExtraPreview);
  if (dom.extraVerse) dom.extraVerse.addEventListener('input', updateExtraPreview);

  if (dom.groupForm) dom.groupForm.addEventListener('submit', submitGroup);
  if (dom.groupCancel) dom.groupCancel.addEventListener('click', () => closeDialog(dom.groupDialog));

  if (dom.recoveryRetry) dom.recoveryRetry.addEventListener('click', retryRecovery);
  if (dom.recoveryReset) dom.recoveryReset.addEventListener('click', resetThisDevice);
  if (dom.recoveryClose) dom.recoveryClose.addEventListener('click', () => closeDialog(dom.recoveryDialog));

  window.addEventListener('online', updateSyncBadge);
  window.addEventListener('offline', updateSyncBadge);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) updateSyncBadge();
  });

  bindAppShell();

  document.addEventListener('keydown', (event) => {
    const mod = event.ctrlKey || event.metaKey;
    if (mod && event.key.toLowerCase() === 's' && dom.noteDialog && dom.noteDialog.open) {
      event.preventDefault();
      submitNote(new Event('submit', { cancelable: true }));
      return;
    }
    if (event.key === '/' && !isTyping(event.target)) {
      event.preventDefault();
      switchView('notes');
      dom.noteSearch?.focus();
    }
  });
}

/* ── Start ─────────────────────────────────────────────────── */

init();
