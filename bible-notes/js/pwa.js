/* Installable-app glue: service worker registration, the in-app install
   controls, standalone detection, and platform-specific instructions.

   The app is a PWA, so this file never depends on app.js. Everything here is
   best-effort: browsers without install support simply get a text hint. */

const installBtn = document.getElementById('installBtn');
const installSettingsBtn = document.getElementById('installSettingsBtn');
const installNote = document.getElementById('installNote');

const DISPLAY_MODES = ['standalone', 'minimal-ui', 'fullscreen', 'window-controls-overlay'];
const VIEWS = ['today', 'notes', 'together', 'journey'];

const ua = navigator.userAgent || '';
const isIos = /iphone|ipad|ipod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const isAndroid = /android/i.test(ua);
const isEmbedded = /FBAN|FBAV|FB_IAB|Instagram|Line\/|WhatsApp|Twitter/i.test(ua);
const isFile = location.protocol === 'file:';

let deferredPrompt = null;
let installed = false;

function isStandalone() {
  return DISPLAY_MODES.some((mode) => window.matchMedia(`(display-mode: ${mode})`).matches)
    || window.navigator.standalone === true;
}

function setNote(text) {
  if (installNote) installNote.textContent = text;
}

function setControls({ header, settings, label }) {
  if (installBtn) installBtn.hidden = !header;
  if (installSettingsBtn) {
    installSettingsBtn.hidden = !settings;
    if (label) installSettingsBtn.textContent = label;
  }
}

function refresh() {
  const standalone = installed || isStandalone();
  document.documentElement.classList.toggle('is-standalone', standalone);

  if (standalone) {
    setControls({ header: false, settings: false });
    setNote('Installed. Open Advent 26 from your home screen or app list.');
    return;
  }

  if (isEmbedded) {
    setControls({ header: false, settings: false });
    setNote('This browser cannot install apps. Open this page in Chrome or Safari, then use its Install or Add to Home Screen option.');
    return;
  }

  if (deferredPrompt) {
    setControls({ header: true, settings: true, label: 'Install app' });
    setNote(isAndroid
      ? 'Install to open full screen, keep your streak offline, and launch straight from your home screen.'
      : 'Install for a full-screen window and offline access. Your notes stay on this device.');
    return;
  }

  setControls({ header: false, settings: false });
  if (isIos) {
    setNote('On iPhone or iPad: open this page in Safari, tap the Share button, then choose “Add to Home Screen”.');
  } else {
    setNote('Use your browser menu and choose Install app (Chrome or Edge), or Add to Home Screen (Safari and Firefox).');
  }
}

async function promptInstall() {
  if (!deferredPrompt) {
    refresh();
    return;
  }
  const prompt = deferredPrompt;
  deferredPrompt = null;
  setControls({ header: false, settings: false });
  try {
    await prompt.prompt();
    const choice = await prompt.userChoice;
    if (choice && choice.outcome === 'accepted') {
      installed = true;
      setNote('Installing… the app will appear on your home screen in a moment.');
      window.dispatchEvent(new CustomEvent('pwa:installing'));
    } else {
      setNote('Install cancelled. You can install later from your browser menu.');
      refresh();
    }
  } catch (err) {
    refresh();
  }
}

/* Chrome/Edge fire this once the install criteria are met. Firefox and Safari
   never do, so the text instructions above stay visible instead. */
window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
  deferredPrompt = event;
  refresh();
});

window.addEventListener('appinstalled', () => {
  installed = true;
  deferredPrompt = null;
  refresh();
  window.dispatchEvent(new CustomEvent('pwa:installed'));
});

installBtn?.addEventListener('click', promptInstall);
installSettingsBtn?.addEventListener('click', promptInstall);

['standalone', 'minimal-ui', 'fullscreen', 'window-controls-overlay'].forEach((mode) => {
  const query = window.matchMedia(`(display-mode: ${mode})`);
  if (typeof query.addEventListener === 'function') query.addEventListener('change', refresh);
});

document.addEventListener('visibilitychange', () => {
  if (!document.hidden) refresh();
});

/* App shortcuts open ./?view=notes. Let the main controller decide when to
   enter, but strip the parameter so a later refresh starts at the cover. */
function consumeShortcut() {
  const params = new URLSearchParams(location.search);
  const view = params.get('view');
  if (view && VIEWS.includes(view)) document.documentElement.dataset.startView = view;
  if (!view && !params.has('source')) return;
  params.delete('view');
  params.delete('source');
  const query = params.toString();
  try {
    history.replaceState(null, '', location.pathname + (query ? `?${query}` : '') + location.hash);
  } catch (err) {
    // Some file:// contexts refuse replaceState; the view is already queued.
  }
}

consumeShortcut();
refresh();

/* Offline shell. Served pages only; file:// has no service worker support. */
if ('serviceWorker' in navigator && !isFile) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js', { scope: './' }).catch(() => {
      /* Offline support is optional; the app still works online. */
    });
  });
}

/* ── Pull-to-refresh (essential in installed standalone PWAs) ── */
function initPullToRefresh() {
  if (!('ontouchstart' in window) && !(navigator.maxTouchPoints > 0)) return;

  const THRESHOLD = 72;
  const MAX_PULL = 116;

  const pill = document.createElement('div');
  pill.className = 'ptr-pill';
  pill.setAttribute('role', 'status');
  pill.setAttribute('aria-live', 'polite');
  pill.innerHTML = `
    <span class="ptr-spinner" aria-hidden="true">
      <svg class="ptr-arrow" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 5v14"/>
        <path d="m19 12-7 7-7-7"/>
      </svg>
      <svg class="ptr-ring" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round">
        <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
      </svg>
    </span>
    <span class="ptr-label">Pull to refresh</span>
  `;
  document.body.append(pill);

  const labelEl = pill.querySelector('.ptr-label');
  const arrowEl = pill.querySelector('.ptr-arrow');

  let startX = 0;
  let startY = 0;
  let pulling = false;
  let refreshing = false;
  let currentPull = 0;

  function canPullFrom(target) {
    if (refreshing) return false;
    if (document.querySelector('dialog[open]')) return false;
    if ((window.scrollY || document.documentElement.scrollTop || 0) > 2) return false;
    if (target && target.closest && target.closest('input, textarea, select, [contenteditable="true"], .advent-strip')) {
      return false;
    }
    return true;
  }

  function applyPull(dist) {
    currentPull = dist;
    const progress = Math.min(1, dist / THRESHOLD);
    const ready = dist >= THRESHOLD;
    const translateY = Math.min(MAX_PULL, dist) * 0.72;

    pill.classList.add('is-visible');
    pill.classList.toggle('is-ready', ready);
    pill.style.transform = `translate3d(-50%, ${translateY}px, 0) scale(${0.86 + 0.14 * progress})`;
    pill.style.opacity = String(Math.min(1, progress * 1.3));
    if (arrowEl) {
      arrowEl.style.transform = `rotate(${ready ? 180 : Math.round(progress * 140)}deg)`;
    }
    if (labelEl) {
      labelEl.textContent = ready ? 'Release to refresh' : 'Pull to refresh';
    }
  }

  function resetPull() {
    pulling = false;
    currentPull = 0;
    pill.classList.remove('is-visible', 'is-ready');
    pill.style.transform = '';
    pill.style.opacity = '';
    if (arrowEl) arrowEl.style.transform = '';
  }

  async function triggerRefresh() {
    refreshing = true;
    pulling = false;
    pill.classList.add('is-visible', 'is-refreshing');
    pill.classList.remove('is-ready');
    pill.style.transform = 'translate3d(-50%, 56px, 0) scale(1)';
    pill.style.opacity = '1';
    if (labelEl) labelEl.textContent = 'Refreshing…';

    try {
      if ('serviceWorker' in navigator && !isFile) {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg) await Promise.race([reg.update(), new Promise((r) => setTimeout(r, 800))]);
      }
    } catch (err) { /* ignore update check failures */ }

    window.setTimeout(() => {
      window.location.reload();
    }, 420);
  }

  window.addEventListener('touchstart', (e) => {
    if (e.touches.length !== 1 || !canPullFrom(e.target)) {
      pulling = false;
      return;
    }
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    pulling = true;
    currentPull = 0;
  }, { passive: true });

  window.addEventListener('touchmove', (e) => {
    if (!pulling || refreshing || e.touches.length !== 1) return;
    if ((window.scrollY || document.documentElement.scrollTop || 0) > 2) {
      resetPull();
      return;
    }
    const dx = e.touches[0].clientX - startX;
    const dy = e.touches[0].clientY - startY;

    if (currentPull === 0) {
      if (dy < 10) return;
      if (Math.abs(dx) > Math.abs(dy) * 0.8) {
        pulling = false;
        return;
      }
    }

    if (dy > 0) {
      // Elastic resistance as the user pulls further down
      const damped = Math.min(MAX_PULL, dy * 0.52);
      applyPull(damped);
    } else if (currentPull > 0) {
      resetPull();
    }
  }, { passive: true });

  window.addEventListener('touchend', () => {
    if (!pulling || refreshing) return;
    if (currentPull >= THRESHOLD) {
      triggerRefresh();
    } else {
      resetPull();
    }
  }, { passive: true });

  window.addEventListener('touchcancel', () => {
    if (pulling && !refreshing) resetPull();
  }, { passive: true });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPullToRefresh, { once: true });
} else {
  initPullToRefresh();
}
