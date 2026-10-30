// Errors are thrown as codes (errCrypto, errNotBackup, errNeedPw, errWrongPw); the screens show them in the person's language.
// Backup files: plain JSON, optionally encrypted with a password (PBKDF2 + AES-GCM, Web Crypto).
// Nothing is sent anywhere; the person saves the file where they like (iCloud Drive, Google Drive, Files, email...).

const ITERATIONS = 310000;
const enc = new TextEncoder();
const dec = new TextDecoder();

const toB64 = (buf) => {
  const bytes = new Uint8Array(buf);
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
};
const fromB64 = (b64) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));

async function keyFrom(password, salt) {
  const base = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations: ITERATIONS },
    base,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

export async function makeBackup(state, password) {
  const payload = JSON.stringify(state);
  const head = { app: 'regulation-map', format: 1, createdAt: new Date().toISOString() };
  if (!password) return JSON.stringify({ ...head, encrypted: false, data: JSON.parse(payload) });
  if (!crypto?.subtle) throw new Error('errCrypto');
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await keyFrom(password, salt);
  const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(payload));
  return JSON.stringify({
    ...head,
    encrypted: true,
    kdf: { name: 'PBKDF2', hash: 'SHA-256', iterations: ITERATIONS, salt: toB64(salt) },
    cipher: { name: 'AES-GCM', iv: toB64(iv) },
    data: toB64(cipher),
  });
}

export function readHeader(text) {
  let obj;
  try {
    obj = JSON.parse(text);
  } catch {
    throw new Error('errNotBackup');
  }
  if (!obj || obj.app !== 'regulation-map') throw new Error('errNotBackup');
  return obj;
}

export async function openBackup(text, password) {
  const obj = readHeader(text);
  if (!obj.encrypted) return obj.data;
  if (!password) throw new Error('errNeedPw');
  try {
    const key = await keyFrom(password, fromB64(obj.kdf.salt));
    const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromB64(obj.cipher.iv) }, key, fromB64(obj.data));
    return JSON.parse(dec.decode(plain));
  } catch {
    throw new Error('errWrongPw');
  }
}

export function summarise(s) {
  return {
    tools: Object.values(s.items || {}).filter((r) => r.status === 'yes').length,
    checkins: (s.checkins || []).length,
    names: (s.names || []).length,
  };
}

// Combine a backup with what is on this phone. Answers already on the phone win;
// lists (check-ins, tries, names, own items) are joined without duplicates.
export function mergeStates(current, incoming) {
  const out = structuredClone(current);
  for (const [id, r] of Object.entries(incoming.items || {})) {
    const mine = out.items[id];
    if (!mine) out.items[id] = r;
    else for (const [k, v] of Object.entries(r)) if (mine[k] == null || (Array.isArray(mine[k]) && !mine[k].length)) mine[k] = v;
  }
  for (const key of ['custom', 'names', 'checkins', 'trials']) {
    const ids = new Set(out[key].map((x) => x.id));
    for (const x of incoming[key] || []) if (!ids.has(x.id)) out[key].push(x);
  }
  out.checkins.sort((a, b) => a.t - b.t);
  out.trials.sort((a, b) => a.t - b.t);
  out.onboarded = true;
  return out;
}

export const backupFileName = () => `regulation-map-${new Date().toISOString().slice(0, 10)}.rmap`;

// Save a file: the phone's share sheet when it can share files (lets people pick iCloud Drive,
// Google Drive, Files, email...), otherwise a normal download.
export async function saveFile(text, name, type = 'application/json') {
  const file = new File([text], name, { type });
  try {
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: name });
      return 'shared';
    }
  } catch (e) {
    if (e?.name === 'AbortError') return 'cancelled';
  }
  try {
    const url = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    return 'downloaded';
  } catch {
    return 'failed';
  }
}
