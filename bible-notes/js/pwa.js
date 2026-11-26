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
