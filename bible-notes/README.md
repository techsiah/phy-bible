# Christmas 2026 · 25 Days of the Word

A private Advent reading companion for **Jesus Youth · Pazhassi Raja College**.
One door opens each day from **December 1 to December 25, 2026** (IST). Read the
day's passage, keep a streak, write notes that only you can open, and compare
streaks and points with the college.

- Scripture: **Catholic Public Domain Version (CPDV)**, bundled offline.
- No build step. Plain HTML, CSS, and ES modules.
- Works offline. Syncs through Firebase when configured.

---

## Quick start

Open `index.html` directly, or serve the folder:

```powershell
cd bible-notes
npx --yes http-server . -p 8080 -c-1
# then visit http://localhost:8080
```

Out of the box the app starts in **production mode** and requires Firebase. Fill in
`firebase-config.js` and deploy the Firestore rules before opening the app, or it
will show “Not connected” and registration will be unavailable.

> A service worker is registered when served over HTTP(S). It is skipped when the
> page is opened as a `file://` URL.

---

## Install it as an app

The site is a full PWA. It installs to a home screen or desktop with its own icon,
runs full screen without browser chrome, and opens offline. Installation needs
HTTPS (or `localhost`) and the deployed site — not a `file://` page.

| Platform | How |
| --- | --- |
| Android (Chrome, Edge) | Tap **Install app** in the app header or **Settings → Install the app**, or use the browser's *Install app* menu. |
| iPhone / iPad (Safari) | Tap **Share**, then **Add to Home Screen**. iOS does not show an in-page install prompt. |
| Windows / macOS (Chrome, Edge) | Click the install icon in the address bar, or **Settings → Install the app**. |
| Firefox | Use the browser menu's **Add to Home Screen** / **Install** entry. |

Once installed, long-press or right-click the icon for shortcuts to **Today**,
**Notes**, and **Together**. The browser can also install straight from the web
manifest, so no app store or build step is involved.

---

## Firebase setup (required)

1. Create a Firebase project at <https://console.firebase.google.com>.
2. **Authentication → Sign-in method → Anonymous → Enable.**
3. **Firestore Database → Create database** (production mode is fine).
4. **Project settings → Your apps → Web app** and copy the config.
5. Paste it into `firebase-config.js`:

   ```js
   window.FIREBASE_CONFIG = {
     apiKey: 'AIza...',
     authDomain: 'your-project.firebaseapp.com',
     projectId: 'your-project',
     storageBucket: 'your-project.appspot.com',
     messagingSenderId: '123456789012',
     appId: '1:123456789012:web:abcdef123456'
   };
   ```

6. Deploy the security rules:

   ```powershell
   npm install -g firebase-tools
   firebase login
   firebase use your-project
   firebase deploy --only firestore:rules
   ```

7. Deploy the site (optional):

   ```powershell
   firebase deploy --only hosting
   ```

The web API key is public by design. `firestore.rules` is what protects data.

If the config is missing or still contains placeholders, the app will not fall
back to local storage. It shows **Not connected** and registration stays
unavailable until a real Firebase project is configured.

---

## What is public, what is private

| Data | Where | Who can read it |
| --- | --- | --- |
| Roll, name, gender, department, year, program, group, streak, points | `board/{roll}` | Everyone signed in |
| Group name, code, member rolls | `groups/{code}` | Everyone signed in |
| Roll, phone, reading history, notes | `readers/{roll}` and its subcollections | Owner only |

Notes and reading history are **never** included in the leaderboard. The public
board is a separate projection, so the phone number and private entries stay out
of it.

The app signs each browser in anonymously only so it can reach Firestore. That
session is not the student's identity and is never shown. A student's entry is
opened by their **roll number** plus the **phone number, department, and year**
they registered with. Entering the same details on another device transfers the
private entry to that device, so streaks and notes follow the student.

---

## Moving to a new device

Every entry is keyed by the roll number and protected by the registration
details. On a new phone (or after clearing site data), open the app, tap
**Already registered? Restore my entry**, choose the roll number, and enter the
same phone number, department, and year. The streak, notes, and profile come
back.

The server checks all four values (roll, phone, department, year) before it
transfers the entry. If any of them is different, the transfer is refused, so a
student cannot accidentally create a second entry or take over someone else's.
An organizer can correct a stored value in Firestore at `readers/{ROLL}` after
verifying the student in person. No device ID is needed anywhere.

---

## Organizer & Admin Portal (`admin.html`)

An organizer portal is included at `admin.html` (with a PIN lock, default: `JYPRC2026`).

Features:
- **College Analytics & Overview**: Live total readers, active streaks, points, top records, department breakdown bars (all 8 departments), and milestone unlock trackers.
- **Participants Directory**: Search and filter by roll number, department, year level, streak status (active vs broken), and group membership with multi-column sorting.
- **Teams & Groups Moderation**: View all teams, member rolls, average streaks, points, and automatic profanity check status.
- **Export & Notice Board Reports**: One-click export for Participants CSV, Teams CSV, Full JSON snapshot, and high-contrast printable notice board sheets.

`readers/{ROLL}` also holds the profile and aggregate stats; `board/{ROLL}` is the
public copy. Update the profile in `readers/{ROLL}` if a roll was typed wrong, and
the app refreshes `board/{ROLL}` on next open.

---

## Streaks and points

One reading per day keeps the streak. Any reading counts: the day's Advent
passage, or any passage the student chooses.

- Plan or first reading of the day: **+10**
- Each extra reading: **+5**, up to **3 extras** a day
- Daily cap: **25 points**
- Milestones, based on the **longest** streak:
  - 3 days → **+10**
  - 7 days → **+25**
  - 14 days → **+50**
  - 25 days → **+100**

Maximum possible score: **25 × 25 + 185 = 810**.

The streak is **strict**: a missed IST day resets the current streak to zero at
midnight. The longest streak and its milestone points are kept.

Two separate boards:

- **Streaks** — ranked by current streak, points break ties.
- **Points** — ranked by points, streak breaks ties.

Groups are student-created, up to **four** members. The group board is ranked by
the **average** current streak of its members, then average points. Solo readers
still appear on the individual boards.

---

## Editing the event

Everything lives in `js/config.js`:

- organization, college, title, dates, timezone
- points and milestones
- group size and join-code alphabet
- departments, years, programs
- note limits and board cache time

The 25 readings are in `js/plan.js`. To change them, edit the `PLAN` array in
`tools/fetch-cpdv.mjs` and regenerate:

```powershell
node tools/fetch-cpdv.mjs
```

The script downloads the public-domain CPDV text from
<https://sacredbible.org/catholic/>, extracts the passages, and writes
`js/plan.js`.

---

## File map

```
index.html                  App shell and dialogs
admin.html                  Organizer & admin dashboard portal
admin.css                   Admin dashboard styling & responsive layout
styles.css                  Evergreen / cream / gold theme, daylight + candle
firebase-config.js          Your Firebase web config (placeholders by default)
firebase-config.example.js  Copy of the config shape
firestore.rules             Security rules (deploy these)
firebase.json               Hosting + rules config
manifest.webmanifest        Installable app metadata, icons, and shortcuts
icon.svg                    App icon (vector source)
icon.png                    1024px brand image used in the UI
icon-1024.png               1024px install icon
icon-192.png                Android install icon
icon-512.png                High-resolution install icon
icon-maskable-512.png       Maskable icon with safe-zone padding
apple-touch-icon.png        iOS home-screen icon (opaque, 180px)
sw.js                       Offline shell cache
js/pwa.js                   Install prompt, standalone mode, shortcuts
js/admin.js                 Admin portal controller, analytics, and reports
js/config.js                Event, points, departments, group rules
js/plan.js                  Generated CPDV passages (25 days + daily verses)
js/refs.js                  Bible book list, reference parsing, roll normalization
js/streak.js                Pure date, streak, and points functions
js/store.js                 localStorage, migration, backup, theme
js/notes.js                 Note normalization and merging
js/backend.js               Firestore production backend
js/app.js                   UI controller
tools/fetch-cpdv.mjs        Regenerates js/plan.js from sacredbible.org
tests/streak.test.mjs       Date, streak, and points tests
tests/pwa.test.mjs          Manifest, icon, and offline-shell checks
```

### Migrating the old notes app

The original app stored notes under `bible-notes.notes.v1`. On first load the new
app reads that key, normalizes the notes, and copies them to
`xmas2026.notes.v1`. The old theme preference is migrated too. Nothing is deleted
from the old keys.

---

## Tests

```powershell
npm test
```

Covers the IST midnight boundary, month/year rollover, the 25-day window, strict
streak resets, milestone bonuses, the daily cap, the 810-point ceiling, and door
states.

---

## Notes on the text

The Catholic Public Domain Version was translated by Ronald L. Conte Jr. and
released into the public domain. Source pages:
<https://sacredbible.org/catholic/>. The generated `js/plan.js` is bundled so the
app works with no network.

Other Catholic editions (NRSV-CE, NABRE, RSV-CE) are copyrighted and are **not**
included.

---

## Browser support

Modern Chrome, Edge, Firefox, and Safari. Requires ES modules, `dialog`, and
`localStorage`. Firestore offline persistence is used when available; the app
still works if the browser blocks IndexedDB.

---

Made for the students of Pazhassi Raja College.
*Come, Lord Jesus.*
