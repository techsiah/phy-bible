/* Christmas 2026 — Jesus Youth · Pazhassi Raja College
   Local-first reading, streaks, notes, groups, and a shared leaderboard. */
import { EVENT, DEPARTMENTS, YEARS, PROGRAMS, GENDERS, COUNTER_ACTIVITIES, isCleanName, yearLabel, readerKey } from './config.js';
import { PLAN, DAILY_VERSES, EDITION } from './plan.js';
import { PLAN_ML } from './plan-ml.js';
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
import { enhanceSelects } from './select.js';

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
  dailyText: $('dailyText'),
  dailyRef: $('dailyRef'),
  adventStrip: $('adventStrip'),
  adventProgress: $('adventProgress'),
  adventHint: $('adventHint'),
  readingCard: $('readingCard'),
  bibleLangSwitch: $('bibleLangSwitch'),
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
  counterActivityBox: $('counterActivityBox'),
  counterActivityBadge: $('counterActivityBadge'),
  counterActivityTitle: $('counterActivityTitle'),
  counterActivityDesc: $('counterActivityDesc'),
  counterActivityBtn: $('counterActivityBtn'),
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
  onboardDesc: $('onboardDesc'),
  onboardSubmit: $('onboardSubmit'),
  obTabRegister: $('obTabRegister'),
  obRestoreToggle: $('obRestoreToggle'),
  obName: $('obName'),
  obPhone: $('obPhone'),
  obRoll: $('obRoll'),
  obGender: $('obGender'),
  obDept: $('obDept'),
  obYear: $('obYear'),
  obProgram: $('obProgram'),
  obError: $('obError'),
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
  groupError: $('groupError'),
  groupCancel: $('groupCancel'),
  recoveryDialog: $('recoveryDialog'),
  recoveryTitle: $('recoveryTitle'),
  recoveryText: $('recoveryText'),
  recoveryRoll: $('recoveryRoll'),
  recoveryPhone: $('recoveryPhone'),
  recoveryRetry: $('recoveryRetry'),
  recoveryReset: $('recoveryReset'),
  recoveryClose: $('recoveryClose'),
  dayCompleteDialog: $('dayCompleteDialog'),
  dayCompleteKicker: $('dayCompleteKicker'),
  dayCompleteTitle: $('dayCompleteTitle'),
  dayCompleteText: $('dayCompleteText'),
  dayCompleteStreak: $('dayCompleteStreak'),
  dayCompletePoints: $('dayCompletePoints'),
  dayCompleteDays: $('dayCompleteDays'),
  dayCompleteNoteBtn: $('dayCompleteNoteBtn'),
  dayCompleteClose: $('dayCompleteClose'),
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
let onboardingRestore = false;

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

function normalizePhone(value) {
  const digits = String(value || '').replace(/\D/g, '');
  return digits.length === 12 && digits.startsWith('91') ? digits.slice(2) : digits;
}

function maskPhone(value) {
  const digits = normalizePhone(value);
  if (digits.length < 4) return digits || '—';
  return `••••••${digits.slice(-4)}`;
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

/* Custom dropdowns hide the native select, so validation should focus the
   visible trigger instead of the invisible control. */
function focusField(control) {
  if (!control) return;
  const target = control._focusTarget || control;
  target.focus();
}

async function safe(fn, fallback = null) {
  try { return await fn(); } catch (err) { console.warn(err); return fallback; }
}

/* Firestore queues writes while it cannot reach the server, so a restore on a
   bad connection can stay pending forever. Bound it so the form can recover. */
function withTimeout(promise, ms, message) {
  let timer = null;
  const timeout = new Promise((_, reject) => {
    timer = window.setTimeout(() => reject(new Error(message)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => window.clearTimeout(timer));
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
  if (meta) meta.setAttribute('content', next === 'day' ? '#F7F5F0' : '#000000');
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
    const board = await state.backend.getBoard(readerKey(state.profile));
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
  enhanceSelects();
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

let unsubSelf = null;
let unsubBoardReaders = null;
let unsubBoardGroups = null;

function stopSelfRealtime() {
  if (unsubSelf) {
    unsubSelf();
    unsubSelf = null;
  }
}

function stopBoardRealtime() {
  if (unsubBoardReaders) {
    unsubBoardReaders();
    unsubBoardReaders = null;
  }
  if (unsubBoardGroups) {
    unsubBoardGroups();
    unsubBoardGroups = null;
  }
}

async function revokeDeletedAccount() {
  stopSelfRealtime();
  state.profile = null;
  state.reader = null;
  state.group = null;
  state.earlyAccess = false;
  state.reads = {};
  state.notes = [];
  state.milestones = [];
  store.clearData();
  await safe(() => state.backend && state.backend.signOut());
  recompute();
  [dom.settingsDialog, dom.groupDialog, dom.noteDialog, dom.recoveryDialog, dom.dayCompleteDialog, dom.onboarding].forEach((dlg) => {
    if (dlg && dlg.open) closeDialog(dlg);
  });
  renderCover();
  renderAll();
  showToast('Your account was removed by an organizer.');
}

function startSelfRealtime() {
  stopSelfRealtime();
  if (!state.profile || !state.backend || typeof state.backend.subscribeSelf !== 'function') return;
  const key = readerKey(state.profile);
  unsubSelf = state.backend.subscribeSelf(key, {
    onBoard(board) {
      if (!state.profile) return;
      const nextEarly = Boolean(board.earlyAccess);
      const nextGroupCode = board.groupCode || null;
      const prevGroupCode = state.profile.groupCode || null;
      let changed = nextEarly !== state.earlyAccess;
      state.earlyAccess = nextEarly;

      ['name', 'gender', 'dept', 'year', 'program'].forEach((field) => {
        if (board[field] && board[field] !== state.profile[field]) {
          state.profile[field] = board[field];
          changed = true;
        }
      });
      if (nextGroupCode !== prevGroupCode) {
        state.profile.groupCode = nextGroupCode;
        if (!nextGroupCode) {
          state.group = null;
        } else if (state.cache?.groups) {
          state.group = state.cache.groups.find((g) => g.code === nextGroupCode) || null;
        }
        changed = true;
      }
      if (changed) {
        persist();
        renderAll();
        renderCover();
      }
    },
    onReader(reader) {
      if (!state.profile) return;
      state.reader = reader;
      let changed = false;
      ['name', 'gender', 'dept', 'year', 'program', 'groupCode'].forEach((field) => {
        if (reader[field] !== undefined && reader[field] !== state.profile[field]) {
          state.profile[field] = reader[field];
          changed = true;
        }
      });
      if (changed) {
        persist();
        renderAll();
        renderCover();
      }
    },
    onDeleted() {
      revokeDeletedAccount();
    }
  });
}

function startBoardRealtime() {
  stopBoardRealtime();
  if (!state.backend || typeof state.backend.subscribeReaders !== 'function') return;
  let liveReaders = state.cache?.readers || [];
  let liveGroups = state.cache?.groups || [];
  const commit = () => {
    state.cache = { at: Date.now(), readers: liveReaders, groups: liveGroups };
    store.saveCache(state.cache);
    if (state.profile?.groupCode) {
      state.group = liveGroups.find((g) => g.code === state.profile.groupCode) || null;
    }
    renderMyGroup();
    renderProfile();
    renderBoard();
  };
  unsubBoardReaders = state.backend.subscribeReaders((readers) => {
    liveReaders = readers;
    commit();
  });
  unsubBoardGroups = state.backend.subscribeGroups((groups) => {
    liveGroups = groups;
    commit();
  });
}

async function bootBackend() {
  try {
    state.backend = await initBackend();
  } catch (err) {
    state.backend = null;
    state.warning = err.message || 'Could not connect to the reading server. Check your connection and try again.';
    updateSyncNotes();
    renderCover();
    showToast(state.warning);
    return null;
  }
  state.warning = null;
  updateSyncNotes();
  startBoardRealtime();
  if (state.profile) {
    const ok = await hydrate({ claim: false });
    if (!ok && state.backend?.mode === 'firebase' && state.profile) showRecovery();
    if (state.profile) {
      await loadEarlyAccess();
      startSelfRealtime();
    }
    renderAll();
  }
  // Splash screen stays until user clicks 'Explore the readings' or 'Register / Join'
  renderCover();
  return state.backend;
}

async function hydrate(options = {}) {
  if (!state.profile || !state.backend) return false;
  const claim = options.claim !== false;

  if (claim) {
    try {
      await state.backend.claimReader(state.profile);
    } catch (err) {
      state.recoveryReason = err.code === 'PHONE_MISMATCH' ? 'phone' : 'offline';
      if (err.code !== 'PHONE_MISMATCH') showToast(err.message || 'Could not reach the reading server.');
      return false;
    }
  }

  const key = readerKey(state.profile);
  const localNotes = state.notes;
  let reader;
  let board;
  let remoteDays;
  let remoteNotes;
  try {
    [reader, board, remoteDays, remoteNotes] = await Promise.all([
      state.backend.getReader(key),
      state.backend.getBoard(key),
      state.backend.getDays(key),
      state.backend.getNotes(key)
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

  if (!claim && !reader && !board) {
    await revokeDeletedAccount();
    return false;
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
  await state.backend.saveDay(readerKey(state.profile), day, {
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
  const key = readerKey(state.profile);
  try {
    for (const day of changedDays) await pushDay(day);
    const remoteById = new Map((remoteNotes || []).map((note) => [note.id, note]));
    for (const note of state.notes) {
      const remote = remoteById.get(note.id);
      if (!remote || (Number(note.updatedAt) || 0) > (Number(remote.updatedAt) || 0)) {
        await state.backend.saveNote(key, note);
      }
    }
    await syncReader();
  } catch (err) {
    console.warn('Sync deferred', err);
  }
}

async function pushLocal() {
  if (!state.backend || !state.profile) return;
  const key = readerKey(state.profile);
  try {
    for (const day of Object.keys(state.reads)) await pushDay(day);
    for (const note of state.notes) await state.backend.saveNote(key, note);
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
    await state.backend.updateReader(readerKey(state.profile), patch);
  } catch (err) {
    console.warn('Reader sync deferred', err);
  }
  updateSyncNotes();
}

async function saveDay(day) {
  if (!state.backend || !state.profile) return;
  try {
    await pushDay(day);
  } catch (err) {
    console.warn('Day sync deferred', err);
  }
}

function updateSyncNotes() {
  const connected = Boolean(state.backend);
  if (dom.syncNote) {
    dom.syncNote.textContent = connected
      ? 'Your notes and reading history sync privately. Only your name, roll, gender, department, year, program, group, streak and points are public.'
      : (state.warning || 'Cannot reach the reading server. Check your connection and try again.');
  }
  if (dom.syncNote2) {
    dom.syncNote2.textContent = connected
      ? 'Notes and reading history sync privately to your roll number and registration details. Only you can open them.'
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
    if (profile) {
      dom.coverAvatar.textContent = name.charAt(0).toUpperCase() || profile.roll;
      dom.coverAvatar.classList.add('is-signed-in');
    } else {
      dom.coverAvatar.innerHTML = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;
      dom.coverAvatar.classList.remove('is-signed-in');
    }
  }
  if (dom.coverIdentityName) {
    dom.coverIdentityName.textContent = profile ? (name || `Roll ${profile.roll}`) : 'Register with Roll Number';
  }
  if (dom.coverIdentitySub) {
    const year = profile?.year ? yearLabel(profile.year) : '';
    dom.coverIdentitySub.textContent = profile
      ? [`Roll ${profile.roll}`, year].filter(Boolean).join(' · ')
      : 'Save streaks & join your college group';
  }
  if (dom.coverRegBtn) {
    dom.coverRegBtn.setAttribute(
      'aria-label',
      profile ? `Signed in as ${name || profile.roll}. Tap to continue reading.` : 'Register with Roll Number'
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
    if (entry.read) {
      const check = el('span', 'door-check');
      check.setAttribute('aria-hidden', 'true');
      check.innerHTML = '<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 6.3 5 8.8 9.5 3.6"/></svg>';
      number.append(check);
    }
    button.append(weekday, number);
    fragment.append(button);
  });
  dom.adventStrip.replaceChildren(fragment);

  const selectedBtn = dom.adventStrip.querySelector('.door.is-selected');
  if (selectedBtn) {
    window.setTimeout(() => {
      const strip = dom.adventStrip;
      if (!strip) return;
      const stripRect = strip.getBoundingClientRect();
      const btnRect = selectedBtn.getBoundingClientRect();
      const targetLeft = strip.scrollLeft + (btnRect.left - stripRect.left) - (stripRect.width - btnRect.width) / 2;
      strip.scrollTo({
        left: Math.max(0, targetLeft),
        behavior: prefersReducedMotion() ? 'auto' : 'smooth'
      });
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

const READ_TIMER_SECONDS = 15;
const unlockedReadDays = new Set();
let readTimerInterval = null;
let readTimerState = { dayKey: null, remaining: 0 };

function stopReadTimer() {
  if (readTimerInterval) {
    window.clearInterval(readTimerInterval);
    readTimerInterval = null;
  }
}

function updateMarkReadButton(selectedDate, data, today, gain) {
  if (!dom.markReadBtn) return;
  dom.markReadBtn.hidden = false;
  if (data.planRead) {
    dom.markReadBtn.disabled = true;
    dom.markReadBtn.textContent = 'Completed ✓';
    return;
  }
  const remaining = readTimerState.dayKey === selectedDate ? readTimerState.remaining : 0;
  if (!unlockedReadDays.has(selectedDate) && remaining > 0) {
    dom.markReadBtn.disabled = true;
    dom.markReadBtn.textContent = `Completed (${remaining}s)`;
  } else {
    dom.markReadBtn.disabled = false;
    dom.markReadBtn.textContent = today ? `Completed (+${gain})` : 'Completed';
  }
}

function ensureReadTimer(selectedDate, data, today, gain) {
  if (data.planRead || unlockedReadDays.has(selectedDate)) {
    stopReadTimer();
    readTimerState = { dayKey: selectedDate, remaining: 0 };
    return;
  }
  if (readTimerState.dayKey === selectedDate && readTimerInterval) {
    return;
  }
  stopReadTimer();
  readTimerState = { dayKey: selectedDate, remaining: READ_TIMER_SECONDS };
  readTimerInterval = window.setInterval(() => {
    if (readTimerState.dayKey !== selectedDate) {
      stopReadTimer();
      return;
    }
    readTimerState.remaining = Math.max(0, readTimerState.remaining - 1);
    if (readTimerState.remaining <= 0) {
      unlockedReadDays.add(selectedDate);
      stopReadTimer();
    }
    updateMarkReadButton(selectedDate, readState(selectedDate), today, gain);
  }, 1000);
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
    stopReadTimer();
    if (dom.bibleLangSwitch) dom.bibleLangSwitch.hidden = true;
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
    if (dom.counterActivityBox) dom.counterActivityBox.hidden = true;
    if (dom.readStatus) dom.readStatus.textContent = `Begins in ${daysUntil(EVENT.start, state.today)} days.`;
    return;
  }

  if (isFuture) {
    stopReadTimer();
    if (dom.bibleLangSwitch) dom.bibleLangSwitch.hidden = true;
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
    if (dom.counterActivityBox) dom.counterActivityBox.hidden = true;
    if (dom.readStatus) dom.readStatus.textContent = `Opens ${formatLongDate(selectedDate)}.`;
    return;
  }

  const bibleLang = getBibleLang();
  const mlPlan = bibleLang === 'ml' ? PLAN_ML.find((entry) => entry.day === plan.day) : null;

  if (dom.bibleLangSwitch) {
    dom.bibleLangSwitch.hidden = false;
    dom.bibleLangSwitch.querySelectorAll('[data-bible-lang]').forEach((btn) => {
      const active = btn.dataset.bibleLang === bibleLang;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-pressed', String(active));
    });
  }

  if (dom.readingDay) dom.readingDay.textContent = `Day ${state.selectedDay}`;
  if (dom.readingTheme) dom.readingTheme.textContent = plan.theme;
  if (dom.readingRef) {
    dom.readingRef.classList.toggle('is-ml', Boolean(mlPlan));
    dom.readingRef.textContent = mlPlan ? mlPlan.ref : plan.ref;
  }
  if (dom.readingTitle) {
    dom.readingTitle.classList.toggle('is-ml', Boolean(mlPlan));
    dom.readingTitle.textContent = mlPlan ? mlPlan.title : plan.title;
  }
  if (dom.passageText) {
    dom.passageText.classList.toggle('is-ml', Boolean(mlPlan));
    const verses = mlPlan ? mlPlan.verses : plan.verses;
    const fragment = document.createDocumentFragment();
    verses.forEach((verse) => {
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
    ensureReadTimer(selectedDate, data, today, gain);
    updateMarkReadButton(selectedDate, data, today, gain);
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

  if (dom.counterActivityBox) {
    const activity = COUNTER_ACTIVITIES[state.selectedDay - 1] || COUNTER_ACTIVITIES[0];
    const showActivity = Boolean(activity) && (data.planRead || preview);
    dom.counterActivityBox.hidden = !showActivity;
    if (showActivity) {
      const done = Boolean(data.counterDone);
      dom.counterActivityBox.classList.toggle('is-done', done);
      if (dom.counterActivityTitle) dom.counterActivityTitle.textContent = activity.title;
      if (dom.counterActivityDesc) dom.counterActivityDesc.textContent = activity.detail;
      if (dom.counterActivityBadge) dom.counterActivityBadge.textContent = done ? 'Completed' : 'After reading';
      if (dom.counterActivityBtn) {
        dom.counterActivityBtn.textContent = done ? 'Completed ✓' : 'Mark as done';
        dom.counterActivityBtn.setAttribute('aria-pressed', String(done));
      }
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
    const owner = isGroupOwner();
    const head = el('div', 'group-head');
    head.append(el('p', 'kicker', 'Your group'), el('h3', '', state.group.name));
    const code = el('button', 'group-code', state.group.code);
    code.type = 'button';
    code.dataset.act = 'copy-code';
    code.title = 'Copy join code';
    head.append(code);
    card.append(head);

    const members = Array.isArray(state.group.memberRolls) ? state.group.memberRolls : [];
    const myKey = readerKey(state.profile);
    const companionId = state.group.companionRoll || members[0];
    card.append(el('p', 'group-count', `${members.length} of ${EVENT.groupMax} members · ${owner ? 'You are the Companion' : 'The Companion manages the group'}`));
    if (members.length) {
      const list = el('ul', 'group-members');
      members.forEach((m) => {
        const isMe = m === myKey || m === state.profile.roll;
        const isCompanion = m === companionId;
        const label = m.includes('|') ? m.split('|').slice(0, 2).join(' · ') : m;
        const tags = [isMe ? 'you' : '', isCompanion ? 'Companion' : ''].filter(Boolean).join(' · ');
        const item = el('li', isMe ? 'is-me' : '');
        item.append(el('span', 'member-name', tags ? `${label} (${tags})` : label));
        if (owner && !isMe) {
          const remove = document.createElement('button');
          remove.type = 'button';
          remove.className = 'member-remove';
          remove.dataset.act = 'remove-member';
          remove.dataset.member = m;
          remove.setAttribute('aria-label', `Remove roll ${memberShortLabel(m)}`);
          remove.title = `Remove roll ${memberShortLabel(m)}`;
          remove.textContent = '×';
          item.append(remove);
        }
        list.append(item);
      });
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
  const soloHead = el('div', 'group-head');
  soloHead.append(
    el('p', 'kicker', 'Your group'),
    el('span', 'group-status-pill', 'Solo')
  );
  card.append(
    soloHead,
    el('p', 'group-desc', 'Read with friends in groups of up to 4. Create a group or join with an invite code.')
  );
  const create = document.createElement('button');
  create.type = 'button';
  create.className = 'btn btn-ghost group-create-btn';
  create.dataset.act = 'create-group';
  create.textContent = 'Create a group';
  card.append(create);

  const divider = el('div', 'group-divider');
  divider.append(el('span', '', 'or join with a code'));
  card.append(divider);

  const form = document.createElement('form');
  form.className = 'join-form';
  form.dataset.act = 'join-form';
  const input = document.createElement('input');
  input.id = 'joinCode';
  input.name = 'joinCode';
  input.maxLength = EVENT.groupCodeLength;
  input.placeholder = 'Enter 6-letter code';
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
    const byRoll = new Map();
    readers.forEach((reader) => {
      if (reader.id) byRoll.set(reader.id, reader);
      byRoll.set(readerKey(reader), reader);
      if (!byRoll.has(reader.roll)) byRoll.set(reader.roll, reader);
    });
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
      const myId = state.profile ? readerKey(state.profile) : null;
      sorted.slice(0, 100).forEach((reader, index) => {
        const item = el('li', 'board-row');
        const rId = reader.id || readerKey(reader);
        if (myId && rId === myId) item.classList.add('is-me');
        const rank = el('span', 'board-rank', String(index + 1));
        if (index === 0) rank.classList.add('rank-1');
        else if (index === 1) rank.classList.add('rank-2');
        else if (index === 2) rank.classList.add('rank-3');

        const value = el('span', 'board-value');
        if (state.board === 'points') {
          value.append(el('strong', '', String(Number(reader.points) || 0)), el('small', '', 'points'));
        } else {
          value.append(el('strong', '', String(Number(reader.currentStreak) || 0)), el('small', '', 'day streak'));
        }
        const shortDept = String(reader.dept || '').replace(/^Department of\s+/i, '');
        const yr = yearLabel(reader.year);
        const level = [yr, reader.program].filter(Boolean).join(' ');
        const meta = [shortDept, level].filter(Boolean).join(' · ');
        const statText = state.board === 'points'
          ? `${Number(reader.totalDays) || 0}d · Best ${Number(reader.longestStreak) || 0}`
          : `Best ${Number(reader.longestStreak) || 0} · ${Number(reader.points) || 0} pts`;
        const subText = [meta, statText].filter(Boolean).join(' · ');
        const titleName = String(reader.name || '').trim() || `Roll ${reader.roll || ''}`.trim();
        const titleText = reader.roll && String(reader.name || '').trim()
          ? `${titleName} · #${reader.roll}`
          : titleName;

        const main = el('span', 'board-main');
        main.append(
          el('span', 'board-name', titleText),
          el('span', 'board-sub', subText)
        );
        item.append(rank, main, value);
        fragment.append(item);
      });
      dom.boardList.replaceChildren(fragment);
    }
  }

  if (dom.boardFoot) {
    dom.boardFoot.textContent = `Updated ${new Date(cache.at).toLocaleTimeString()} · Phone numbers & notes stay private.`;
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
  const displayName = state.profile.name || state.profile.roll || 'Reader';
  const initial = String(displayName).trim()[0]?.toUpperCase() || '?';
  const deptShort = String(state.profile.dept || '').replace(/^Department of\s+/i, '');
  const yearProgram = [yearLabel(state.profile.year), state.profile.program].filter(Boolean).join(' · ');

  const card = el('div', 'profile-card');

  // Hero row: avatar + name/dept + roll pill
  const hero = el('div', 'profile-hero');
  const avatar = el('span', 'profile-avatar', initial);
  avatar.setAttribute('aria-hidden', 'true');
  const info = el('div', 'profile-hero-info');
  info.append(
    el('strong', 'profile-name', displayName),
    el('span', 'profile-sub', deptShort || '—')
  );
  const rollBadge = el('span', 'profile-roll-pill', `Roll ${state.profile.roll}`);
  hero.append(avatar, info, rollBadge);

  // Detail rows: label on left, value on right
  const rows = [
    ['Phone', state.profile.phone || '—'],
    ['Year', yearProgram || '—'],
    ['Gender', genderLabel(state.profile.gender) || '—'],
    ['Group', state.group ? `${state.group.name} (${state.group.code})` : 'Solo']
  ];
  const details = el('div', 'profile-details');
  rows.forEach(([label, value]) => {
    const row = el('div', 'profile-detail-row');
    row.append(el('span', 'profile-detail-label', label), el('span', 'profile-detail-value', value));
    details.append(row);
  });

  card.append(hero, details);
  dom.profileSummary.append(card);
}

function renderAll() {
  renderToday();
  renderStreak();
  renderJourney();
  renderNotes();
  renderProfile();
  renderMyGroup();
  renderBoard();
  updateSyncNotes();
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
    const initialEl = $('avatarInitial');
    if (initialEl) {
      const display = String(state.profile?.name || state.profile?.roll || '').trim();
      initialEl.textContent = display ? display[0].toUpperCase() : 'G';
    }
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
  setRestoreMode(false);
  dom.obError.textContent = '';
  openDialog(dom.onboarding);
  window.setTimeout(() => dom.obName?.focus(), 100);
}

/* Restore mode asks for the roll number and the details used at
   registration (phone, department, year, program), so a returning student
   can pull their streak and notes onto a new device. */
function setRestoreMode(on) {
  onboardingRestore = on;
  document.querySelectorAll('[data-register-only]').forEach((node) => {
    node.hidden = on;
  });
  ['obName', 'obGender'].forEach((id) => {
    const node = $(id);
    if (node) node.required = !on;
  });
  if (dom.onboardDesc) {
    dom.onboardDesc.textContent = on
      ? 'Enter your roll number, phone number, department, year, and program exactly as you registered.'
      : 'Your roll number and phone number are your entry. No email, no password.';
  }
  if (dom.onboardSubmit) dom.onboardSubmit.textContent = on ? 'Restore my entry' : 'Start reading';
  if (dom.onboardForm) dom.onboardForm.classList.toggle('is-restore', on);
  if (dom.obTabRegister) {
    dom.obTabRegister.classList.toggle('is-active', !on);
    dom.obTabRegister.setAttribute('aria-selected', String(!on));
  }
  if (dom.obRestoreToggle) {
    dom.obRestoreToggle.classList.toggle('is-active', on);
    dom.obRestoreToggle.setAttribute('aria-selected', String(on));
  }
  if (dom.obError) dom.obError.textContent = '';
}

async function submitOnboarding(event) {
  event.preventDefault();
  if (state.backendReady) await state.backendReady;
  if (!state.backend) {
    dom.obError.textContent = state.warning || 'Cannot reach the reading server. Check your connection and try again.';
    return;
  }

  const phone = normalizePhone(dom.obPhone.value);
  const roll = String(dom.obRoll.value).trim();
  const dept = dom.obDept.value;
  const year = dom.obYear.value;
  const program = dom.obProgram.value;

  if (!isValidRoll(roll)) {
    dom.obError.textContent = 'Please select a roll number.';
    focusField(dom.obRoll);
    return;
  }
  if (!/^[6-9]\d{9}$/.test(phone)) {
    dom.obError.textContent = 'Enter a 10-digit mobile number starting with 6–9.';
    dom.obPhone.focus();
    return;
  }
  if (!dept) {
    dom.obError.textContent = 'Please select your department.';
    focusField(dom.obDept);
    return;
  }
  if (!year) {
    dom.obError.textContent = 'Please select your year of study.';
    focusField(dom.obYear);
    return;
  }
  if (!program) {
    dom.obError.textContent = 'Please select your program.';
    focusField(dom.obProgram);
    return;
  }

  const submit = dom.onboardSubmit || dom.onboardForm.querySelector('button[type="submit"]');
  dom.obError.textContent = '';

  /* Returning student: roll + phone + department + year restore the same entry. */
  if (onboardingRestore) {
    if (navigator.onLine === false) {
      dom.obError.textContent = 'You appear to be offline. Connect to the internet and try again.';
      return;
    }
    setBusy(submit, true, 'Restoring…');
    try {
      const reader = await withTimeout((async () => {
        const found = await state.backend.restoreReader(roll, phone, dept, year, program);
        state.profile = { ...found, roll: found.roll || roll, phone: found.phone || phone };
        store.saveProfile(state.profile);
        const restored = await hydrate({ claim: false });
        if (!restored) throw new Error('Could not load your saved entry. Try again.');
        await loadEarlyAccess();
        startSelfRealtime();
        return found;
      })(), 15000, 'Restore is taking too long. Check your internet connection and try again.');
      if (!reader) throw new Error('Could not restore your entry. Try again.');
      closeDialog(dom.onboarding);
      enterApp();
      showToast('Welcome back. Your streak and notes are restored.');
    } catch (err) {
      if (err.code === 'PHONE_MISMATCH') {
        dom.obError.textContent = 'Those details do not match the registration: the phone number, department, year, or program is different. Check them and try again.';
      } else if (err.code === 'NOT_FOUND') {
        dom.obError.textContent = 'No entry was found for those details. Check the roll number, year, and program, or register as a new reader.';
      } else {
        dom.obError.textContent = err.message || 'Could not restore your entry. Check your connection and try again.';
      }
    } finally {
      setBusy(submit, false);
    }
    return;
  }

  const name = dom.obName.value.trim().replace(/\s+/g, ' ').slice(0, 60);
  const gender = dom.obGender.value;

  if (name.length < 2) {
    dom.obError.textContent = 'Please enter your full name.';
    dom.obName.focus();
    return;
  }
  if (!gender) {
    dom.obError.textContent = 'Please select your gender.';
    focusField(dom.obGender);
    return;
  }

  setBusy(submit, true, 'Registering…');

  try {
    const profile = {
      roll,
      name,
      phone,
      gender,
      dept,
      year,
      program,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    await state.backend.claimReader(profile);

    state.profile = profile;
    store.saveProfile(profile);

    // Load the synced entry for this roll. On a returning student this
    // restores the existing streak, notes, and profile details.
    const restored = await hydrate({ claim: false });
    if (!restored) throw new Error('Could not load your saved entry. Try again.');
    await loadEarlyAccess();
    startSelfRealtime();

    closeDialog(dom.onboarding);
    enterApp();
    showToast('Welcome to the 25-day journey.');
  } catch (err) {
    if (err.code === 'PHONE_MISMATCH') {
      dom.obError.textContent = `Roll ${dom.obRoll?.value || ''} in that department and year is already registered with a different phone number. Use the original phone number or “Restore my entry”.`;
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

function openDayCompleteDialog(dayIndex) {
  if (!dom.dayCompleteDialog) return;
  const entry = currentEntry(dayIndex) || PLAN[dayIndex - 1];
  const isFinal = dayIndex === 25;
  if (dom.dayCompleteKicker) {
    dom.dayCompleteKicker.textContent = `Day ${dayIndex} Complete`;
  }
  if (dom.dayCompleteTitle) {
    dom.dayCompleteTitle.textContent = isFinal
      ? 'You completed all 25 days!'
      : `You completed Day ${dayIndex}!`;
  }
  if (dom.dayCompleteText) {
    dom.dayCompleteText.textContent = entry && entry.ref
      ? `${entry.ref} and today’s counter activity are both finished.`
      : 'Today’s Bible reading and counter activity are both finished.';
  }
  if (dom.dayCompleteStreak) dom.dayCompleteStreak.textContent = String(state.stats.currentStreak);
  if (dom.dayCompletePoints) dom.dayCompletePoints.textContent = String(state.stats.points);
  if (dom.dayCompleteDays) dom.dayCompleteDays.textContent = String(state.stats.totalDays);
  openDialog(dom.dayCompleteDialog);
}

async function markRead() {
  if (!requireProfile()) return;
  const preview = earlyOpen();
  const day = dateForDay(EVENT.start, state.selectedDay);
  const today = state.selectedDay === currentTodayIndex() && state.phase === 'during';
  const isFuture = !preview && day > state.today;
  if ((state.phase === 'before' && !preview) || isFuture) return;

  const data = readState(day);
  if (data.planRead) {
    showToast('Already marked as completed.');
    return;
  }
  if (!unlockedReadDays.has(day)) {
    showToast('Please finish reading the passage first.');
    return;
  }
  const beforeStreak = state.stats.currentStreak;
  const beforePoints = dayPoints(data, EVENT.points);
  state.reads[day] = {
    planRead: true,
    extraReads: Number(data.extraReads) || 0,
    refs: data.refs || [],
    counterDone: Boolean(data.counterDone)
  };
  recompute();
  persist();
  if (!preview && day >= EVENT.start && day <= EVENT.end && state.phase !== 'before') {
    await saveDay(day);
    await syncReader();
  }
  renderAll();
  if (today) {
    const gained = Math.max(0, dayPoints(state.reads[day], EVENT.points) - beforePoints);
    const streak = state.stats.currentStreak;
    showToast(
      streak > beforeStreak
        ? `+${gained} points · ${streak} day streak`
        : `+${gained} points`
    );
  } else {
    showToast('Reading marked as completed!');
  }
  if (state.reads[day].planRead && state.reads[day].counterDone) {
    openDayCompleteDialog(state.selectedDay);
  }
}

async function toggleCounterActivity() {
  if (!requireProfile()) return;
  const selectedDate = dateForDay(EVENT.start, state.selectedDay);
  const preview = earlyOpen();
  if (!preview && selectedDate > state.today) return;
  const data = readState(selectedDate);
  if (!data.planRead && !preview) return;
  const nextDone = !data.counterDone;
  state.reads[selectedDate] = {
    planRead: Boolean(data.planRead),
    extraReads: Number(data.extraReads) || 0,
    refs: data.refs || [],
    counterDone: nextDone
  };
  persist();
  if (!preview && selectedDate >= EVENT.start && selectedDate <= EVENT.end) {
    await saveDay(selectedDate);
  }
  renderReading();
  if (nextDone && Boolean(data.planRead)) {
    openDayCompleteDialog(state.selectedDay);
  } else {
    showToast(nextDone ? 'Counter activity completed!' : 'Counter activity unmarked.');
  }
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
    refs: [...(data.refs || []), ref].slice(0, 4),
    counterDone: Boolean(data.counterDone)
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
    if (state.backend && state.profile) await state.backend.saveNote(readerKey(state.profile), note);
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
    await safe(() => state.backend.deleteNote(readerKey(state.profile), id));
  }
  showToast('Note deleted.', {
    label: 'Undo',
    onClick: async () => {
      state.notes.push(removed);
      persist();
      renderNotes();
      if (state.backend && state.profile) await safe(() => state.backend.saveNote(readerKey(state.profile), removed));
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
  if (state.backend && state.profile) await safe(() => state.backend.saveNote(readerKey(state.profile), note));
  showToast(note.pinned ? 'Pinned to the top.' : 'Unpinned.');
}

/* ── Groups ────────────────────────────────────────────────── */

/* Only a registered reader may create a group, and only while reading solo.
   Everyone who creates one can manage it from the Together section. */
function setGroupError(message) {
  if (dom.groupError) dom.groupError.textContent = message;
}

async function waitForBackend() {
  if (state.backend) return true;
  if (state.backendReady) {
    try { await state.backendReady; } catch (err) { /* bootBackend reports it */ }
  }
  return Boolean(state.backend);
}

function memberShortLabel(memberId) {
  return String(memberId || '').split('|')[0] || 'this member';
}

function isGroupOwner() {
  if (!state.group || !state.profile) return false;
  const members = Array.isArray(state.group.memberRolls) ? state.group.memberRolls : [];
  const myKey = readerKey(state.profile);
  return state.group.createdBy === state.profile.uid
    || state.group.companionRoll === myKey
    || (members[0] && members[0] === myKey);
}

function openGroupDialog() {
  if (!state.profile) {
    showToast('Register your roll number first. Groups are for registered readers.');
    showOnboarding();
    return;
  }
  if (state.group || state.profile.groupCode) {
    showToast('You are already in a group. Manage it from the Together section.');
    return;
  }
  if (dom.groupForm) dom.groupForm.reset();
  setGroupError('');
  openDialog(dom.groupDialog);
  window.setTimeout(() => dom.groupName?.focus(), 100);
}

async function submitGroup(event) {
  event.preventDefault();
  setGroupError('');
  if (!state.profile) {
    setGroupError('Register your roll number first. Groups are for registered readers.');
    return;
  }
  if (state.group || state.profile.groupCode) {
    setGroupError('You are already in a group. Leave it before creating another one.');
    return;
  }
  if (!state.profile.program) {
    setGroupError('Your registration is missing the program. Restore your entry first.');
    return;
  }
  const name = dom.groupName.value.trim().replace(/\s+/g, ' ').slice(0, 30);
  if (name.length < 2) {
    setGroupError('Give your group a name (at least 2 characters).');
    dom.groupName.focus();
    return;
  }
  if (!isCleanName(name)) {
    setGroupError('Please choose a different group name.');
    dom.groupName.focus();
    return;
  }
  const submit = dom.groupForm.querySelector('button[type="submit"]');
  setBusy(submit, true, 'Creating…');
  try {
    if (!(await waitForBackend())) {
      throw new Error('Cannot reach the reading server. Check your connection and try again.');
    }
    const code = await withTimeout(
      generateGroupCode(),
      12000,
      'Could not reserve a group code. Check your connection and try again.'
    );
    const group = await withTimeout(
      state.backend.createGroup(name, code, state.profile),
      20000,
      'Creating the group is taking too long. Check your internet connection and try again.'
    );
    state.profile.groupCode = group.code;
    store.saveProfile(state.profile);
    state.group = group;
    closeDialog(dom.groupDialog);
    renderMyGroup();
    renderProfile();
    loadBoard(true);
    showToast(`Group created. Share code ${group.code}.`);
    safe(() => syncReader());
  } catch (err) {
    setGroupError(err.message || 'Could not create the group. Check your connection and try again.');
  } finally {
    setBusy(submit, false);
  }
}

async function joinGroup(code) {
  if (!state.profile) {
    showToast('Register your roll number first to join a group.');
    showOnboarding();
    return;
  }
  if (state.group || state.profile.groupCode) {
    showToast('Leave your current group before joining another one.');
    return;
  }
  const normalized = normalizeGroupCode(code);
  if (normalized.length !== EVENT.groupCodeLength) {
    showToast(`Enter the ${EVENT.groupCodeLength}-character group code.`);
    return;
  }
  try {
    if (!(await waitForBackend())) throw new Error('Cannot reach the reading server. Check your connection.');
    const group = await withTimeout(
      state.backend.joinGroup(normalized, state.profile),
      20000,
      'Joining is taking too long. Check your internet connection and try again.'
    );
    state.profile.groupCode = normalized;
    store.saveProfile(state.profile);
    state.group = group;
    renderMyGroup();
    renderProfile();
    loadBoard(true);
    showToast(`Joined ${group.name}.`);
    safe(() => syncReader());
  } catch (err) {
    showToast(err.message || 'Could not join the group.');
  }
}

async function leaveGroup() {
  if (!state.profile || !state.profile.groupCode) return;
  if (!window.confirm('Leave this group? You can join another one later.')) return;
  const code = state.profile.groupCode;
  try {
    if (!(await waitForBackend())) throw new Error('Cannot reach the reading server. Check your connection.');
    await withTimeout(
      state.backend.leaveGroup(code, state.profile),
      15000,
      'Leaving is taking too long. Check your internet connection and try again.'
    );
    state.profile.groupCode = null;
    store.saveProfile(state.profile);
    state.group = null;
    renderMyGroup();
    renderProfile();
    loadBoard(true);
    showToast('You are reading solo again.');
    safe(() => syncReader());
  } catch (err) {
    showToast(err.message || 'Could not leave the group.');
  }
}

async function removeGroupMember(memberId) {
  if (!state.group || !isGroupOwner()) return;
  const label = memberShortLabel(memberId);
  if (!window.confirm(`Remove roll ${label} from ${state.group.name}?`)) return;
  try {
    if (!(await waitForBackend())) throw new Error('Cannot reach the reading server. Check your connection.');
    await withTimeout(
      state.backend.removeGroupMember(state.group.code, memberId),
      15000,
      'Removing the member is taking too long. Check your internet connection and try again.'
    );
    state.group = {
      ...state.group,
      memberRolls: (state.group.memberRolls || []).filter((id) => id !== memberId)
    };
    renderMyGroup();
    loadBoard(true);
    showToast(`Roll ${label} was removed from the group.`);
  } catch (err) {
    showToast(err.message || 'Could not remove that member.');
  }
}

async function deleteGroup() {
  if (!state.group || !isGroupOwner()) return;
  const name = state.group.name;
  if (!window.confirm(`Delete ${name}? Every member will be removed and the join code will stop working.`)) return;
  try {
    if (!(await waitForBackend())) throw new Error('Cannot reach the reading server. Check your connection.');
    await withTimeout(
      state.backend.dissolveGroup(state.group.code, state.profile),
      30000,
      'Deleting the group is taking too long. Check your internet connection and try again.'
    );
    state.profile.groupCode = null;
    store.saveProfile(state.profile);
    state.group = null;
    renderMyGroup();
    renderProfile();
    loadBoard(true);
    showToast(`${name} was deleted.`);
    safe(() => syncReader());
  } catch (err) {
    showToast(err.message || 'Could not delete the group.');
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
  const mismatch = state.recoveryReason === 'phone';
  if (dom.recoveryTitle) {
    dom.recoveryTitle.textContent = mismatch ? 'Those details do not match' : 'We could not open your entry';
  }
  if (dom.recoveryText) {
    dom.recoveryText.textContent = mismatch
      ? `“${state.profile.roll}” is registered with different details. Start over and enter the same phone number, department, and year you used the first time.`
      : 'Your notes are safe on this device. Check your connection and try again.';
  }
  dom.recoveryRoll.textContent = state.profile.roll;
  if (dom.recoveryPhone) dom.recoveryPhone.textContent = maskPhone(state.profile.phone);
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
    updateSyncNotes();
  }, 30000);
}

/* ── Events ────────────────────────────────────────────────── */

const BIBLE_LANG_KEY = 'xmas2026.bibleLang.v1';

function getBibleLang() {
  try {
    return localStorage.getItem(BIBLE_LANG_KEY) === 'ml' ? 'ml' : 'en';
  } catch (err) {
    return 'en';
  }
}

function setBibleLang(lang) {
  const next = lang === 'ml' ? 'ml' : 'en';
  try {
    localStorage.setItem(BIBLE_LANG_KEY, next);
  } catch (err) {
    /* ignore */
  }
  renderReading();
}

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
    if (state.profile) {
      openApp();
    } else {
      enterApp();
      showOnboarding();
    }
  });
  // Splash screen stays until user clicks one of the 2 action buttons

  if (dom.bibleLangSwitch) {
    dom.bibleLangSwitch.addEventListener('click', (event) => {
      const btn = event.target.closest('[data-bible-lang]');
      if (!btn) return;
      setBibleLang(btn.dataset.bibleLang);
    });
  }

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
  if (dom.leaveDevice) dom.leaveDevice.addEventListener('click', leaveDevice);

  if (dom.obTabRegister) dom.obTabRegister.addEventListener('click', () => {
    if (!onboardingRestore) return;
    setRestoreMode(false);
    window.setTimeout(() => focusField(dom.obName), 50);
  });
  if (dom.obRestoreToggle) dom.obRestoreToggle.addEventListener('click', () => {
    if (onboardingRestore) return;
    setRestoreMode(true);
    window.setTimeout(() => focusField(dom.obRoll), 50);
  });
  if (dom.onboardForm) dom.onboardForm.addEventListener('submit', submitOnboarding);

  if (dom.markReadBtn) dom.markReadBtn.addEventListener('click', markRead);
  if (dom.counterActivityBtn) dom.counterActivityBtn.addEventListener('click', toggleCounterActivity);
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
  if (dom.dayCompleteClose) dom.dayCompleteClose.addEventListener('click', () => closeDialog(dom.dayCompleteDialog));
  if (dom.dayCompleteNoteBtn) {
    dom.dayCompleteNoteBtn.addEventListener('click', () => {
      closeDialog(dom.dayCompleteDialog);
      const entry = currentEntry(state.selectedDay) || PLAN[state.selectedDay - 1];
      openNote(null, entry && entry.ref ? entry.ref : '');
    });
  }

  window.addEventListener('online', updateSyncNotes);
  window.addEventListener('offline', updateSyncNotes);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) updateSyncNotes();
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
