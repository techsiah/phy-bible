/* ============================================================
   Christmas 2026 · Jesus Youth · Pazhassi Raja College
   Admin & Organizer Portal Controller
   ============================================================ */

import { EVENT, DEPARTMENTS, YEARS, PROGRAMS, GENDERS, isCleanName } from './config.js';
import { initBackend } from './backend.js';

// Default organizer passcode
const PASSCODE = 'JYPRC2026';
const AUTH_KEY = 'xmas2026.admin.auth.v1';

// Professional SVG Icon Library
const ICONS = {
  flame: '<svg class="table-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>',
  star: '<svg class="table-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
  users: '<svg class="table-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
  alert: '<svg class="table-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
  check: '<svg class="table-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>'
};

// Global Admin State
const adminState = {
  backend: null,
  authenticated: false,
  readers: [],
  groups: [],
  activeTab: 'overview',
  filters: {
    search: '',
    dept: 'all',
    year: 'all',
    status: 'all',
    sort: 'points_desc'
  },
  selectedReader: null,
  selectedGroup: null
};

// DOM Helper
const $ = (id) => document.getElementById(id);

function genderLabel(value) {
  const found = GENDERS.find((gender) => gender.value === value);
  return found ? found.label : '';
}

/* ── Authentication ────────────────────────────────────────── */

function checkAuth() {
  const isAuth = sessionStorage.getItem(AUTH_KEY) === '1';
  if (isAuth) {
    adminState.authenticated = true;
    $('lockScreen').hidden = true;
    $('adminShell').hidden = false;
    bootPortal();
  } else {
    adminState.authenticated = false;
    $('lockScreen').hidden = false;
    $('adminShell').hidden = true;
  }
}

function handleLogin(e) {
  if (e) e.preventDefault();
  const input = $('passcodeInput');
  const error = $('passcodeError');
  const code = (input.value || '').trim();

  if (code === PASSCODE) {
    sessionStorage.setItem(AUTH_KEY, '1');
    input.value = '';
    error.hidden = true;
    checkAuth();
  } else {
    error.textContent = 'Incorrect passcode. Please try again.';
    error.hidden = false;
    input.focus();
  }
}

function handleLogout() {
  sessionStorage.removeItem(AUTH_KEY);
  checkAuth();
}

/* ── Theme Handling ────────────────────────────────────────── */

function initTheme() {
  const current = localStorage.getItem('xmas2026.theme.v1') || 'day';
  document.documentElement.dataset.theme = current;
  updateThemeIcon(current);

  $('themeBtn')?.addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'candle' ? 'day' : 'candle';
    document.documentElement.dataset.theme = next;
    localStorage.setItem('xmas2026.theme.v1', next);
    updateThemeIcon(next);
  });
}

function updateThemeIcon(theme) {
  const btn = $('themeBtn');
  if (!btn) return;
  const isCandle = theme === 'candle';
  const sun = btn.querySelector('.icon-sun');
  const moon = btn.querySelector('.icon-moon');
  if (sun && moon) {
    sun.style.display = isCandle ? 'block' : 'none';
    moon.style.display = isCandle ? 'none' : 'block';
  }
}

/* ── Boot Portal & Data Fetching ────────────────────────────── */

async function bootPortal() {
  showLoading(true);
  try {
    if (!adminState.backend) {
      adminState.backend = await initBackend();
    }
    updateModeBadge();
    await refreshData();
  } catch (err) {
    console.error('Portal boot failed:', err);
    updateModeBadge();
    showToast(err.message || 'Failed to load portal data. Check connection.');
  } finally {
    showLoading(false);
  }
}

function updateModeBadge() {
  const badge = $('syncBadge');
  if (!badge) return;
  const connected = Boolean(adminState.backend);
  badge.textContent = connected ? 'Firebase Connected' : 'Not Connected';
  badge.dataset.mode = connected ? 'firebase' : 'offline';
  badge.title = connected ? 'Live Firestore data' : 'Could not connect to Firebase';
}

async function refreshData() {
  if (!adminState.backend) return;
  try {
    const [readers, groups] = await Promise.all([
      adminState.backend.listReaders(),
      adminState.backend.listGroups()
    ]);

    adminState.readers = Array.isArray(readers) ? readers : [];
    adminState.groups = Array.isArray(groups) ? groups : [];

    renderAll();
  } catch (err) {
    console.error('Refresh error:', err);
    showToast('Could not fetch updated data.');
  }
}

function renderAll() {
  renderOverview();
  renderParticipants();
  renderGroups();
  renderRecoveryDropdown();
  renderConfigInfo();
}

/* ── Tab Switching ─────────────────────────────────────────── */

function initTabs() {
  document.querySelectorAll('.admin-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.admin-tab').forEach((t) => t.classList.remove('active'));
      document.querySelectorAll('.tab-pane').forEach((p) => (p.hidden = true));

      tab.classList.add('active');
      const targetId = tab.dataset.pane;
      const targetPane = $(targetId);
      if (targetPane) targetPane.hidden = false;
      adminState.activeTab = tab.dataset.tab;
    });
  });
}

/* ── Overview & Analytics ──────────────────────────────────── */

function renderOverview() {
  const readers = adminState.readers;
  const groups = adminState.groups;

  // Key metrics
  const totalReaders = readers.length;
  const activeStreaks = readers.filter((r) => Number(r.currentStreak) > 0).length;
  const totalGroups = groups.length;
  const totalPoints = readers.reduce((acc, r) => acc + (Number(r.points) || 0), 0);
  const maxStreak = readers.reduce((max, r) => Math.max(max, Number(r.currentStreak) || 0), 0);
  const maxPoints = readers.reduce((max, r) => Math.max(max, Number(r.points) || 0), 0);

  $('metricTotalReaders').textContent = totalReaders;
  $('metricActiveStreaks').textContent = activeStreaks;
  $('metricTotalGroups').textContent = totalGroups;
  $('metricTotalPoints').textContent = totalPoints.toLocaleString();
  $('metricMaxStreak').textContent = `${maxStreak} days`;
  $('metricMaxPoints').textContent = `${maxPoints} pts`;

  // Update tab counts
  $('tabCountParticipants').textContent = totalReaders;
  $('tabCountGroups').textContent = totalGroups;

  // Department Breakdown
  renderDepartmentBars();

  // Milestone Progress
  const m3 = readers.filter((r) => Number(r.longestStreak) >= 3).length;
  const m7 = readers.filter((r) => Number(r.longestStreak) >= 7).length;
  const m14 = readers.filter((r) => Number(r.longestStreak) >= 14).length;
  const m25 = readers.filter((r) => Number(r.longestStreak) >= 25).length;

  $('mCount3').textContent = m3;
  $('mCount7').textContent = m7;
  $('mCount14').textContent = m14;
  $('mCount25').textContent = m25;

  // Year breakdown
  const yearCounts = { '1': 0, '2': 0, '3': 0, '4': 0, 'PG': 0 };
  readers.forEach((r) => {
    const yr = String(r.year || '1');
    if (yearCounts[yr] !== undefined) yearCounts[yr] += 1;
    else yearCounts['1'] += 1;
  });

  const yearContainer = $('yearPillsContainer');
  if (yearContainer) {
    yearContainer.innerHTML = Object.entries(yearCounts)
      .map(([yr, count]) => `
        <div class="milestone-box">
          <div class="milestone-box-head">
            <span class="milestone-badge">${yr === 'PG' ? 'PG' : yr + ' Year'}</span>
            <span class="milestone-count">${count}</span>
          </div>
          <span class="milestone-title">${totalReaders > 0 ? Math.round((count / totalReaders) * 100) : 0}% of readers</span>
        </div>
      `)
      .join('');
  }
}

function renderDepartmentBars() {
  const container = $('deptBarsList');
  if (!container) return;

  const readers = adminState.readers;
  const total = readers.length || 1;

  // Aggregate by department
  const counts = {};
  DEPARTMENTS.forEach((d) => { counts[d] = 0; });
  readers.forEach((r) => {
    if (r.dept && counts[r.dept] !== undefined) {
      counts[r.dept] += 1;
    } else if (r.dept) {
      counts[r.dept] = (counts[r.dept] || 0) + 1;
    }
  });

  const sortedDepts = Object.entries(counts).sort((a, b) => b[1] - a[1]);

  container.innerHTML = sortedDepts.map(([name, count]) => {
    const pct = Math.round((count / total) * 100);
    const shortName = name.replace(/^Department of\s+/i, '');
    return `
      <div class="dept-bar-item">
        <div class="dept-bar-labels">
          <span class="dept-bar-name" title="${name}">${shortName}</span>
          <span class="dept-bar-val">${count} (${pct}%)</span>
        </div>
        <div class="dept-bar-track">
          <div class="dept-bar-fill" style="width: ${pct}%"></div>
        </div>
      </div>
    `;
  }).join('');
}

/* ── Participants Directory ────────────────────────────────── */

function filterAndSortReaders() {
  const { search, dept, year, status, sort } = adminState.filters;
  const q = search.trim().toLowerCase();

  let list = adminState.readers.filter((r) => {
    // Search query
    if (q) {
      const matchName = (r.name || '').toLowerCase().includes(q);
      const matchRoll = (r.roll || '').toLowerCase().includes(q);
      const matchDept = (r.dept || '').toLowerCase().includes(q);
      const matchGroup = (r.groupCode || '').toLowerCase().includes(q);
      if (!matchName && !matchRoll && !matchDept && !matchGroup) return false;
    }

    // Department filter
    if (dept !== 'all' && r.dept !== dept) return false;

    // Year filter
    if (year !== 'all' && String(r.year) !== year) return false;

    // Status filter
    if (status === 'active' && Number(r.currentStreak || 0) <= 0) return false;
    if (status === 'broken' && Number(r.currentStreak || 0) > 0) return false;
    if (status === 'grouped' && !r.groupCode) return false;
    if (status === 'solo' && r.groupCode) return false;

    return true;
  });

  // Sorting
  list.sort((a, b) => {
    if (sort === 'points_desc') {
      const pDiff = (Number(b.points) || 0) - (Number(a.points) || 0);
      if (pDiff !== 0) return pDiff;
      return (Number(b.currentStreak) || 0) - (Number(a.currentStreak) || 0);
    }
    if (sort === 'streak_desc') {
      const sDiff = (Number(b.currentStreak) || 0) - (Number(a.currentStreak) || 0);
      if (sDiff !== 0) return sDiff;
      return (Number(b.points) || 0) - (Number(a.points) || 0);
    }
    if (sort === 'longest_desc') {
      return (Number(b.longestStreak) || 0) - (Number(a.longestStreak) || 0);
    }
    if (sort === 'days_desc') {
      return (Number(b.totalDays) || 0) - (Number(a.totalDays) || 0);
    }
    if (sort === 'roll_asc') {
      return String(a.roll || '').localeCompare(String(b.roll || ''));
    }
    return 0;
  });

  return list;
}

function renderParticipants() {
  const tbody = $('participantsTableBody');
  if (!tbody) return;

  const filtered = filterAndSortReaders();
  $('filteredParticipantsCount').textContent = `Showing ${filtered.length} of ${adminState.readers.length} participants`;

  if (!filtered.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9" style="text-align: center; padding: 32px; color: var(--ink-faint);">
          No participants match the selected filters.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtered.map((r, index) => {
    let rankBadge = `<span class="rank-pill">${index + 1}</span>`;
    if (index === 0) rankBadge = `<span class="rank-pill gold" title="1st Place">1</span>`;
    else if (index === 1) rankBadge = `<span class="rank-pill silver" title="2nd Place">2</span>`;
    else if (index === 2) rankBadge = `<span class="rank-pill bronze" title="3rd Place">3</span>`;

    const deptShort = (r.dept || '—').replace(/^Department of\s+/i, '');
    const yrLabel = r.year === 'PG' ? 'PG' : (r.year ? `${r.year}Y` : '—');
    const groupBadge = r.groupCode
      ? `<span class="group-badge" title="Group: ${r.groupCode}">${ICONS.users}${r.groupCode}</span>`
      : `<span style="color: var(--ink-faint); font-size: 0.75rem;">Solo</span>`;

    return `
      <tr data-roll="${r.roll}">
        <td>${rankBadge}</td>
        <td class="roll-cell">
          <strong>${r.name || r.roll || '—'}</strong>
          <span style="font-size: 0.74rem; color: var(--ink-faint);">${r.roll || '—'} · ${r.program || 'UG'}</span>
        </td>
        <td>
          <div style="font-weight: 500;">${deptShort}</div>
          <div style="font-size: 0.74rem; color: var(--ink-faint);">${yrLabel}</div>
        </td>
        <td>
          <span class="streak-val">${ICONS.flame}${r.currentStreak || 0}</span>
        </td>
        <td>${r.longestStreak || 0}d</td>
        <td>${r.totalDays || 0}d</td>
        <td>
          <span class="points-val">${ICONS.star}${r.points || 0}</span>
        </td>
        <td>${groupBadge}</td>
        <td>
          <div class="action-btn-row">
            <button class="action-btn" data-action="view-reader" data-roll="${r.roll}">Details</button>
            <button class="action-btn primary" data-action="relink-reader" data-roll="${r.roll}">Relink</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  // Attach button listeners
  tbody.querySelectorAll('button[data-action="view-reader"]').forEach((btn) => {
    btn.addEventListener('click', () => openReaderModal(btn.dataset.roll));
  });

  tbody.querySelectorAll('button[data-action="relink-reader"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      $('recoveryRollSelect').value = btn.dataset.roll;
      $('recoveryRollSelect').dispatchEvent(new Event('change'));
      // Switch to recovery tab
      document.querySelector('.admin-tab[data-tab="recovery"]')?.click();
    });
  });
}

function initParticipantsFilters() {
  // Populate Department Dropdown
  const deptSelect = $('filterDept');
  if (deptSelect) {
    deptSelect.innerHTML = `<option value="all">All Departments</option>` +
      DEPARTMENTS.map((d) => `<option value="${d}">${d.replace(/^Department of\s+/i, '')}</option>`).join('');
  }

  // Populate Year Dropdown
  const yearSelect = $('filterYear');
  if (yearSelect) {
    yearSelect.innerHTML = `<option value="all">All Years</option>` +
      YEARS.map((y) => `<option value="${y.value}">${y.label}</option>`).join('');
  }

  // Event Listeners
  $('searchParticipants')?.addEventListener('input', (e) => {
    adminState.filters.search = e.target.value;
    renderParticipants();
  });

  $('filterDept')?.addEventListener('change', (e) => {
    adminState.filters.dept = e.target.value;
    renderParticipants();
  });

  $('filterYear')?.addEventListener('change', (e) => {
    adminState.filters.year = e.target.value;
    renderParticipants();
  });

  $('filterStatus')?.addEventListener('change', (e) => {
    adminState.filters.status = e.target.value;
    renderParticipants();
  });

  $('sortParticipants')?.addEventListener('change', (e) => {
    adminState.filters.sort = e.target.value;
    renderParticipants();
  });

  $('clearFiltersBtn')?.addEventListener('click', () => {
    adminState.filters.search = '';
    adminState.filters.dept = 'all';
    adminState.filters.year = 'all';
    adminState.filters.status = 'all';
    adminState.filters.sort = 'points_desc';

    $('searchParticipants').value = '';
    $('filterDept').value = 'all';
    $('filterYear').value = 'all';
    $('filterStatus').value = 'all';
    $('sortParticipants').value = 'points_desc';

    renderParticipants();
  });
}

/* ── Groups Management ─────────────────────────────────────── */

function renderGroups() {
  const tbody = $('groupsTableBody');
  if (!tbody) return;

  const groups = adminState.groups;
  $('filteredGroupsCount').textContent = `Total ${groups.length} groups created`;

  if (!groups.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 32px; color: var(--ink-faint);">
          No groups have been created yet.
        </td>
      </tr>
    `;
    return;
  }

  // Calculate each group's average streak & points from members on the board
  const readerMap = new Map();
  adminState.readers.forEach((r) => readerMap.set(r.roll, r));

  tbody.innerHTML = groups.map((g) => {
    const rolls = Array.isArray(g.memberRolls) ? g.memberRolls : [];
    const members = rolls.map((roll) => readerMap.get(roll)).filter(Boolean);

    const avgStreak = members.length
      ? (members.reduce((acc, m) => acc + (Number(m.currentStreak) || 0), 0) / members.length).toFixed(1)
      : '0.0';

    const avgPoints = members.length
      ? Math.round(members.reduce((acc, m) => acc + (Number(m.points) || 0), 0) / members.length)
      : 0;

    const isClean = isCleanName(g.name);
    const modBadge = isClean
      ? `<span class="group-badge" style="background: var(--pastel-mint); color: var(--pastel-mint-ink);">${ICONS.check}Clean</span>`
      : `<span class="group-badge" style="background: var(--pastel-peach); color: var(--pastel-peach-ink);" title="Flagged by profanity filter">${ICONS.alert}Review</span>`;

    const memberRollChips = rolls
      .map((roll) => `<span style="font-family: var(--font-mono); font-size: 0.74rem; background: var(--panel-3); padding: 2px 6px; border-radius: 4px;">${roll}</span>`)
      .join(' ');

    return `
      <tr>
        <td>
          <code style="font-weight: 700; color: var(--gold-deep); font-size: 0.95rem;">${g.code}</code>
        </td>
        <td>
          <strong>${g.name}</strong>
        </td>
        <td>
          <span>${rolls.length} / ${EVENT.groupMax}</span>
        </td>
        <td>
          <div style="display: flex; flex-wrap: wrap; gap: 4px;">${memberRollChips || '—'}</div>
        </td>
        <td>
          <span class="streak-val">${ICONS.flame}${avgStreak}d</span>
        </td>
        <td>
          <span class="points-val">${ICONS.star}${avgPoints}</span>
        </td>
        <td>${modBadge}</td>
      </tr>
    `;
  }).join('');
}

/* ── Device Recovery / Account Transfer ─────────────────────── */

function renderRecoveryDropdown() {
  const select = $('recoveryRollSelect');
  if (!select) return;

  const currentVal = select.value;
  select.innerHTML = `<option value="">-- Choose student roll number --</option>` +
    adminState.readers
      .map((r) => `<option value="${r.roll}">${r.roll} — ${r.dept ? r.dept.replace(/^Department of\s+/i, '') : 'Unknown'} (${r.points || 0} pts)</option>`)
      .join('');

  if (currentVal) select.value = currentVal;
}

function initRecoveryHandlers() {
  const select = $('recoveryRollSelect');
  const preview = $('recoveryPreviewBox');
  const rollInput = $('recoveryManualRoll');
  const deviceInput = $('recoveryNewDeviceUid');
  const transferBtn = $('executeTransferBtn');
  const copyConsoleBtn = $('copyConsoleHelpBtn');

  select?.addEventListener('change', () => {
    const roll = select.value;
    if (roll) rollInput.value = roll;
    updateRecoveryPreview(roll);
  });

  rollInput?.addEventListener('input', () => {
    updateRecoveryPreview(rollInput.value.trim());
  });

  function updateRecoveryPreview(roll) {
    if (!roll) {
      preview.hidden = true;
      return;
    }

    const reader = adminState.readers.find((r) => r.roll.toLowerCase() === roll.toLowerCase());
    if (reader) {
      preview.hidden = false;
      $('prevRoll').textContent = reader.roll;
      $('prevDept').textContent = reader.dept || '—';
      $('prevStreak').textContent = `${reader.currentStreak || 0} days (longest: ${reader.longestStreak || 0})`;
      $('prevPoints').textContent = `${reader.points || 0} pts`;
      $('prevGroup').textContent = reader.groupCode || 'Solo';
      $('prevCurrentUid').textContent = reader.uid || '(Firestore private)';
    } else {
      preview.hidden = false;
      $('prevRoll').textContent = roll;
      $('prevDept').textContent = 'Not registered yet';
      $('prevStreak').textContent = '—';
      $('prevPoints').textContent = '—';
      $('prevGroup').textContent = '—';
      $('prevCurrentUid').textContent = 'None';
    }
  }

  transferBtn?.addEventListener('click', async () => {
    const roll = (rollInput.value || select.value || '').trim();
    const newUid = (deviceInput.value || '').trim();

    if (!roll) {
      showToast('Please specify a roll number.');
      rollInput.focus();
      return;
    }

    if (!newUid) {
      showToast('Please enter the student\'s new Device ID.');
      deviceInput.focus();
      return;
    }

    transferBtn.disabled = true;
    transferBtn.textContent = 'Transferring...';

    try {
      const db = window.firebase ? window.firebase.firestore() : null;
      if (db) {
        try {
          await db.collection('readers').doc(roll).set({ uid: newUid, updatedAt: Date.now() }, { merge: true });
          showToast(`Firestore updated! Roll ${roll} linked to ${newUid}`);
          $('transferSuccessAlert').hidden = false;
          $('transferSuccessMsg').innerHTML = `
            <strong>Firestore updated successfully!</strong><br>
            Student <code>${roll}</code> can now tap <strong>"Try again"</strong> on their phone.
          `;
        } catch (ruleErr) {
          console.warn('Direct client update blocked by security rules:', ruleErr);
          // Show Firebase Console instructions
          $('transferConsoleAlert').hidden = false;
          $('consoleTargetRoll').textContent = roll;
          $('consoleTargetUid').textContent = newUid;
          showToast('Direct edit restricted by security rules. Follow console steps below.');
        }
      } else {
        showToast('Firebase connection not initialized.');
      }
    } catch (err) {
      console.error('Transfer failed:', err);
      showToast('Transfer failed: ' + (err.message || 'Unknown error'));
    } finally {
      transferBtn.disabled = false;
      transferBtn.textContent = 'Transfer Account to New Device';
    }
  });

  copyConsoleBtn?.addEventListener('click', () => {
    const roll = (rollInput.value || select.value || '').trim();
    const newUid = (deviceInput.value || '').trim();
    const snippet = `Collection: readers\nDocument: ${roll}\nField: uid\nNew Value: ${newUid}`;
    navigator.clipboard.writeText(snippet);
    showToast('Copied Firestore instructions to clipboard!');
  });
}

/* ── Participant Details Modal ─────────────────────────────── */

function openReaderModal(roll) {
  const reader = adminState.readers.find((r) => r.roll === roll);
  if (!reader) return;

  adminState.selectedReader = reader;
  $('modalName').textContent = reader.name || '—';
  $('modalRoll').textContent = reader.roll;
  $('modalGender').textContent = genderLabel(reader.gender) || '—';
  $('modalDept').textContent = reader.dept || '—';
  $('modalYear').textContent = reader.year ? `${reader.year} Year (${reader.program || 'UG'})` : '—';
  $('modalGroup').textContent = reader.groupCode || 'Solo reader';
  $('modalStreak').textContent = `${reader.currentStreak || 0} days (Record: ${reader.longestStreak || 0} days)`;
  $('modalTotalDays').textContent = `${reader.totalDays || 0} days active`;
  $('modalPoints').textContent = `${reader.points || 0} points`;
  $('modalUid').textContent = reader.uid || '(Firestore private)';
  $('modalLastUpdated').textContent = reader.updatedAt ? new Date(reader.updatedAt).toLocaleString() : '—';

  $('readerModalBackdrop').hidden = false;
}

function initModals() {
  $('closeReaderModal')?.addEventListener('click', () => {
    $('readerModalBackdrop').hidden = true;
  });

  $('modalRelinkBtn')?.addEventListener('click', () => {
    if (adminState.selectedReader) {
      $('readerModalBackdrop').hidden = true;
      $('recoveryRollSelect').value = adminState.selectedReader.roll;
      $('recoveryRollSelect').dispatchEvent(new Event('change'));
      document.querySelector('.admin-tab[data-tab="recovery"]')?.click();
    }
  });

  $('readerModalBackdrop')?.addEventListener('click', (e) => {
    if (e.target === $('readerModalBackdrop')) {
      $('readerModalBackdrop').hidden = true;
    }
  });
}

/* ── Export & Print ─────────────────────────────────────────── */

function initExportHandlers() {
  $('exportParticipantsCsvBtn')?.addEventListener('click', () => {
    exportParticipantsCSV();
  });

  $('exportGroupsCsvBtn')?.addEventListener('click', () => {
    exportGroupsCSV();
  });

  $('exportJsonBackupBtn')?.addEventListener('click', () => {
    exportFullJSON();
  });

  $('printLeaderboardBtn')?.addEventListener('click', () => {
    window.print();
  });
}

function escapeCSV(val) {
  const str = String(val === undefined || val === null ? '' : val);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function downloadFile(content, fileName, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function exportParticipantsCSV() {
  const readers = adminState.readers;
  if (!readers.length) {
    showToast('No participants to export.');
    return;
  }

  const headers = ['Roll Number', 'Name', 'Gender', 'Department', 'Year', 'Program', 'Group Code', 'Current Streak', 'Longest Streak', 'Total Days', 'Points', 'Last Updated'];
  const rows = readers.map((r) => [
    r.roll,
    r.name || '',
    genderLabel(r.gender) || '',
    r.dept || '',
    r.year || '',
    r.program || '',
    r.groupCode || '',
    r.currentStreak || 0,
    r.longestStreak || 0,
    r.totalDays || 0,
    r.points || 0,
    r.updatedAt ? new Date(r.updatedAt).toISOString() : ''
  ]);

  const csv = [headers.map(escapeCSV).join(','), ...rows.map((row) => row.map(escapeCSV).join(','))].join('\r\n');
  downloadFile(csv, `advent-2026-participants-${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv;charset=utf-8;');
  showToast('Participants CSV exported!');
}

function exportGroupsCSV() {
  const groups = adminState.groups;
  if (!groups.length) {
    showToast('No groups to export.');
    return;
  }

  const headers = ['Group Code', 'Group Name', 'Members Count', 'Member Rolls', 'Created Date'];
  const rows = groups.map((g) => [
    g.code,
    g.name,
    Array.isArray(g.memberRolls) ? g.memberRolls.length : 0,
    Array.isArray(g.memberRolls) ? g.memberRolls.join('; ') : '',
    g.createdAt ? new Date(g.createdAt).toISOString() : ''
  ]);

  const csv = [headers.map(escapeCSV).join(','), ...rows.map((row) => row.map(escapeCSV).join(','))].join('\r\n');
  downloadFile(csv, `advent-2026-groups-${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv;charset=utf-8;');
  showToast('Groups CSV exported!');
}

function exportFullJSON() {
  const backup = {
    event: EVENT,
    exportedAt: new Date().toISOString(),
    participants: adminState.readers,
    groups: adminState.groups
  };
  const json = JSON.stringify(backup, null, 2);
  downloadFile(json, `advent-2026-full-backup-${new Date().toISOString().slice(0, 10)}.json`, 'application/json');
  showToast('JSON backup exported!');
}

/* ── Event Configuration ────────────────────────────────────── */

function renderConfigInfo() {
  $('cfgOrg').textContent = `${EVENT.org} · ${EVENT.college}`;
  $('cfgDates').textContent = `${EVENT.start} to ${EVENT.end} (${EVENT.timezone})`;
  $('cfgPointsRules').textContent = `Plan: +${EVENT.points.plan} pts, Extras: +${EVENT.points.extra} pts (max ${EVENT.points.maxExtras}/day), Daily Cap: ${EVENT.points.dailyCap} pts`;
  $('cfgGroupMax').textContent = `Max ${EVENT.groupMax} members per group`;
}

/* ── UI Feedback Helpers ───────────────────────────────────── */

let toastTimeout = null;
function showToast(msg) {
  const toast = $('toast');
  const text = $('toastText');
  if (!toast || !text) return;

  text.textContent = msg;
  toast.hidden = false;
  toast.classList.add('visible');

  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.classList.remove('visible');
    toast.hidden = true;
  }, 3200);
}

function showLoading(show) {
  const spinner = $('loadingSpinner');
  if (spinner) spinner.hidden = !show;
}

/* ── Initialization ────────────────────────────────────────── */

window.addEventListener('DOMContentLoaded', () => {
  initTheme();

  // Auth setup
  $('loginForm')?.addEventListener('submit', handleLogin);
  $('lockBtn')?.addEventListener('click', handleLogout);

  // Tab setup
  initTabs();

  // Toolbar & filter setup
  initParticipantsFilters();

  // Modals & Handlers
  initModals();
  initRecoveryHandlers();
  initExportHandlers();

  // Refresh button
  $('refreshBtn')?.addEventListener('click', async () => {
    showToast('Refreshing data...');
    await refreshData();
    showToast('Data refreshed!');
  });

  // Check auth and boot
  checkAuth();
});
