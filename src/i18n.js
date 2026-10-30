// Language support.
// To add a language: copy src/locales/en.js to src/locales/<code>.js, translate the text,
// then add one line to LOCALES below. Anything left untranslated falls back to English.
// `npm run check-locales` lists what is missing in each language.
import { createContext, createElement, Fragment, useContext } from 'react';
import en from './locales/en.js';
import is from './locales/is.js';

export const LOCALES = { en, is };
export const DEFAULT_LANG = 'en';

export function detectLang() {
  try {
    for (const l of navigator.languages || [navigator.language]) {
      const code = (l || '').slice(0, 2).toLowerCase();
      if (LOCALES[code]) return code;
    }
  } catch { /* ignore */ }
  return DEFAULT_LANG;
}

const get = (obj, path) => path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);

function pick(value, lang, vars) {
  if (value && typeof value === 'object' && !Array.isArray(value) && 'other' in value) {
    const n = vars?.n ?? 0;
    let cat = 'other';
    try { cat = new Intl.PluralRules(lang).select(n); } catch { /* ignore */ }
    if (n === 0 && value.zero != null) return value.zero;
    return value[cat] ?? value.other;
  }
  return value;
}

const fill = (s, vars) => (vars ? s.replace(/\{(\w+)\}/g, (m, k) => (vars[k] == null ? m : String(vars[k]))) : s);

export function makeI18n(lang) {
  const loc = LOCALES[lang] || LOCALES[DEFAULT_LANG];
  const code = LOCALES[lang] ? lang : DEFAULT_LANG;
  const raw = (path) => {
    const v = get(loc, path);
    return v === undefined || v === '' ? get(en, path) : v;
  };
  // Text with {placeholders}. Plural forms: { one: '...', other: '...' } chosen by vars.n.
  const t = (path, vars) => {
    const v = pick(raw(path), code, vars);
    return typeof v === 'string' ? fill(v, vars) : path;
  };
  // Same as t, but placeholders may be React elements (e.g. a highlighted item name).
  const tn = (path, vars) => {
    const s = pick(raw(path), code, vars);
    if (typeof s !== 'string') return path;
    const parts = s.split(/(\{\w+\})/g).filter(Boolean);
    return createElement(Fragment, null, ...parts.map((p, i) => {
      const m = p.match(/^\{(\w+)\}$/);
      if (m && vars && m[1] in vars) {
        const v = vars[m[1]];
        return typeof v === 'object' ? createElement(Fragment, { key: i }, v) : String(v);
      }
      return p;
    }));
  };
  // Dates use the month names in the language file, so they look right on every phone.
  const date = (ts, opts = { day: 'numeric', month: 'short' }) => {
    const d = new Date(ts);
    const m = loc.meta.months || en.meta.months;
    const long = opts.month === 'long';
    const vars = { d: d.getDate(), month: (long ? m.long : m.short)[d.getMonth()], y: d.getFullYear() };
    const f = opts.year ? (loc.meta.dateLong || en.meta.dateLong) : (loc.meta.dateShort || en.meta.dateShort);
    return fill(f, vars);
  };
  // Quotation marks around a name, in the language's own style.
  const quote = (text) => fill(raw('common.quote'), { text });
  return { lang: code, t, tn, raw, date, quote, meta: loc.meta };
}

const Ctx = createContext(makeI18n(DEFAULT_LANG));
export const I18nProvider = Ctx.Provider;
export const useI18n = () => useContext(Ctx);

export const languageList = () => Object.entries(LOCALES).map(([code, l]) => ({ code, name: l.meta.name }));
