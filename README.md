# Regulation Map

A web app (installable on phones) that helps clients find what helps them, and when.
Available in English and Icelandic, chosen on the first screen or under Me. More languages can be added: see TRANSLATING.md.

## What it does

- **First run**: welcome, settings ("naming feelings is hard for me", fewer choices, larger text, reduce motion), where to start.
- **Step 1, What helps me?**: about 230 ideas in 23 groups. Mark helps / not for me, search, add your own.
- **Steps 2–5**: one item at a time. When can I use it (including at my very worst), what it does, which state it helps, nourishment or avoidance (with "how do you notice it tipping over?").
- **Check-in** in three layers, with no feeling words needed:
  1. body state (engine speed + pleasant/unpleasant + optional body sensations),
  2. urges,
  3. optional name in the person's own words (suggested words, colour, texture, own phrase). Names are reused later.
  "I can't tell" always leads to the safe list.
- **What's helped before**: ranks the person's own tools for this check-in, using their earlier before/after results, what they said in steps 2–4, and what they can do at their worst. Things marked "often avoidance" are hidden unless asked for. If the list is short, it offers a few simple ideas.
- **After check-in**: the same questions again plus "compared to before". The app saves what changed, so the map fills itself in.
- **My map**: by state (the person's own names first), by effect, watch-outs.
- **Share with therapist**: the client picks what's included. Show on screen, save as PDF (print dialog), or copy as text.
- **Backup**: an optional password-encrypted file (AES-GCM, key from PBKDF2 with 310,000 rounds), saved through the phone's share sheet (iCloud Drive, Google Drive, Dropbox, Files, email) or downloaded. Can also be copied as text. Restore can combine with or replace the data on the phone. Optional weekly/monthly reminder.
- **Privacy**: everything stays in the browser's local storage on the phone. No accounts, no server, no analytics, and fonts are bundled (no Google Fonts calls).

## Run and build

```bash
npm install
npm run dev            # local development
npm run build          # -> dist/  (deploy this folder to any static host over HTTPS)
npm run build:single   # -> dist-single/index.html (one self-contained file, no offline mode)
```

Deploy `dist/` to any static HTTPS host (the same kind of hosting as app.afallamedferd.is works). Use HTTPS: offline mode and backup encryption need it.

## Notes for maintenance

- All text is in `src/locales/en.js` and `src/locales/is.js`. `npm run check-locales` checks that every language is complete. See TRANSLATING.md.

- `src/data/activities.js` holds the structure of the long list (groups and item ids). The wording is in the language files. **Never change or reuse an item id** once people use the app, because ids are stored in their data and backups. To reword an item, change only its text in the language files.
- `src/data/constants.js` has the check-in ids, what each check-in suggests (`inferNeeds`), and the feeling-word suggestions for layer 3 (`suggestLabels`). **The suggestion mapping is a first draft and should be reviewed clinically.**
- Data is stored under the localStorage key `regulation-map:v1` (see `src/lib/store.js`). If you change the data shape, bump `SCHEMA` and add a step in `migrate()`.
- Safari can clear website data after about 7 days without use unless the app is added to the home screen. The Me screen tells people this. Backups are the safety net.
- Crisis numbers shown: 112 and the Red Cross helpline 1717 (1717.is).
