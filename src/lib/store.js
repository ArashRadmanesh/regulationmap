import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { BUILTIN } from '../data/activities.js';
import { detectLang } from '../i18n.js';

const KEY = 'regulation-map:v1';
export const SCHEMA = 1;

export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

export function emptyState() {
  return {
    schema: SCHEMA,
    onboarded: false,
    settings: {
      alexithymia: true,
      fewer: true,
      remindAfter: true,
      largeText: false,
      reduceMotion: false,
      lang: detectLang(),
      backupReminder: 'monthly',
    },
    items: {}, // id -> { status, access, effects, states, nourish, effectNote, tipNote, skip }
    custom: [], // { id, label, cat }
    names: [], // { id, color, texture, word, label }
    checkins: [], // { id, t, energy, valence, body, urges, nameId, label }
    trials: [], // { id, itemId, checkinId, t, after: { t, energy, valence, compare } | null }
    lastBackup: null,
    createdAt: Date.now(),
  };
}

function migrate(s) {
  const base = emptyState();
  if (!s || typeof s !== 'object') return base;
  return { ...base, ...s, settings: { ...base.settings, ...(s.settings || {}) } };
}

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return migrate(JSON.parse(raw));
  } catch { /* storage unavailable: run in memory */ }
  return emptyState();
}

function save(s) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
    return true;
  } catch {
    return false;
  }
}

const Ctx = createContext(null);
export const StoreProvider = Ctx.Provider;
export const useStore = () => useContext(Ctx);

export function useCreateStore() {
  const [state, setState] = useState(load);
  const [storageOk, setStorageOk] = useState(true);
  const asked = useRef(false);

  useEffect(() => {
    setStorageOk(save(state));
    // Ask the browser to keep this data (reduces the chance it is cleared to free space).
    if (!asked.current && state.onboarded && navigator.storage?.persist) {
      asked.current = true;
      navigator.storage.persist().catch(() => {});
    }
  }, [state]);

  const update = useCallback((fn) => {
    setState((prev) => {
      const next = structuredClone(prev);
      fn(next);
      return next;
    });
  }, []);

  const replaceAll = useCallback((s) => setState(migrate(s)), []);

  return { state, update, replaceAll, storageOk };
}

// ---------- helpers on state ----------

// The words for an item in the current language (own items keep the words the person typed).
export function itemLabel(state, id, i18n) {
  const own = state.custom.find((c) => c.id === id);
  if (own) return own.label;
  const v = i18n.raw(`items.${id}`);
  return typeof v === 'string' ? v : id;
}

export const itemCat = (id) => BUILTIN[id]?.cat || 'mine';

export const rec = (state, id) => state.items[id] || {};

export function ensureItem(s, id) {
  if (!s.items[id]) s.items[id] = {};
  return s.items[id];
}

export const helpfulIds = (state) => Object.keys(state.items).filter((id) => state.items[id].status === 'yes');

// A name the person gave a state, e.g. "Fear, red, spiky, the static", in the current language.
export function nameLabel(n, i18n) {
  if (!n) return '';
  const word = (group, v) => {
    if (!v) return null;
    const w = i18n.raw(`vocab.${group}.${v}`) ?? i18n.raw(`vocab.${group}.${String(v).toLowerCase()}`);
    return typeof w === 'string' ? w : v;
  };
  const parts = [word('feelings', n.label), word('colors', n.color), word('textures', n.texture), n.word].filter(Boolean);
  const s = parts.map((p, i) => (i === 0 ? p : p.charAt(0).toLowerCase() + p.slice(1))).join(', ');
  return s;
}
