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
| Device UID, reading history, notes | `readers/{roll}` and its subcollections | Owner only |

Notes and reading history are **never** included in the leaderboard. The public
board is a separate projection, so the device UID and private entries stay out of
it.

The app uses Firebase **Anonymous Auth**. The anonymous user is stored in the
browser, so a returning student keeps the same identity. Clearing site data,
switching phones, or reinstalling the browser creates a new identity.

---

## Recovering or transferring an entry

Every entry is keyed by the normalized roll number. The first device to register
a roll owns it.

If a student changes phones (or clears browser data), they will see:

> This roll is already linked. Show the device ID below to an organizer.

The organizer can open **`admin.html`** (or Firestore → `readers/{ROLL}`) and update the `uid` with the new device ID shown on the student's screen. The student taps **Try again** and their streak and notes return. The same edit transfers an entry between devices.

---

## Organizer & Admin Portal (`admin.html`)

An organizer portal is included at `admin.html` (with a PIN lock, default: `JYPRC2026`).

Features:
- **College Analytics & Overview**: Live total readers, active streaks, points, top records, department breakdown bars (all 8 departments), and milestone unlock trackers.
- **Participants Directory**: Search and filter by roll number, department, year level, streak status (active vs broken), and group membership with multi-column sorting.
- **Teams & Groups Moderation**: View all teams, member rolls, average streaks, points, and automatic profanity check status.
- **Student Device Recovery Tool**: Dedicated interface to look up a student's roll and link their new Device ID in one click.
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
manifest.webmanifest        Installable app metadata
icon.svg                    App icon
sw.js                       Offline shell cache
js/admin.js                 Admin portal controller, analytics, and device recovery
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
