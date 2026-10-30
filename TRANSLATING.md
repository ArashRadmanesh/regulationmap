# Translating Regulation Map

Every word the app shows lives in one file per language, in `src/locales/`:

- `en.js`: English (the reference)
- `is.js`: Icelandic

## Add a new language

1. Copy `src/locales/en.js` to `src/locales/<code>.js`, using the two-letter language code (for example `da.js` for Danish, `pl.js` for Polish).
2. Translate the text inside the quotes. The file has comments that explain each section.
3. Open `src/i18n.js` and add the language in two places:
   ```js
   import da from './locales/da.js';
   export const LOCALES = { en, is, da };
   ```
4. Run `npm run check-locales`. It lists anything missing, any `{placeholder}` that differs from English, and any list with the wrong number of entries.
5. Run `npm run build`. The new language appears in the language picker automatically.

The translator never needs to touch the screens or the code. Anything left untranslated shows in English, so a partial translation still works.

## Rules for translators

- **Don't change the keys.** Keys are the words before the colons, such as `title:` or `"cold-water-on-my-face":`.
- **Keep `{placeholders}` as they are.** `{n}`, `{item}`, `{name}`, `{when}` and so on are filled in by the app. You can move them within the sentence.
- **Plurals.** Entries written as `{ one: '…', other: '…' }` are plural forms. Use the forms your language needs: `zero`, `one`, `two`, `few`, `many`, `other` (see the [CLDR plural rules](https://cldr.unicode.org/index/cldr-spec/plural-rules)).
- **Grammar around inserted names.** Item names are inserted as they are, so they can't be declined for grammatical case. Where your language needs case endings, put the name in quotation marks, as the Icelandic file does: `Hvenær geturðu notað „{item}“?`.
- **`meta`** holds the language's own name for the picker, the month names, the date patterns, and the quotation-mark style (`common.quote`).
- **`vocab`** holds the words used in check-ins. Some of them are read inside a sentence; the comments say which sentence.
- **`items`** is the long list of ideas. Translate the text on the right and never the id on the left.

## Words the app itself doesn't translate

- Things people type themselves: their own items, their own names for states and their notes.
- The `{placeholders}`.
