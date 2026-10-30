// Lists text that is missing (or extra) in each language file compared with English.
// Run: npm run check-locales
import { readdirSync } from 'node:fs';

const dir = new URL('../src/locales/', import.meta.url);
const en = (await import(new URL('en.js', dir))).default;
const PLURAL = new Set(['zero', 'one', 'two', 'few', 'many', 'other']);

function paths(obj, prefix = '') {
  const out = [];
  for (const [k, v] of Object.entries(obj)) {
    const p = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v) && !Object.keys(v).every((x) => PLURAL.has(x))) out.push(...paths(v, p));
    else out.push(p);
  }
  return out;
}
const get = (o, p) => p.split('.').reduce((a, k) => (a == null ? undefined : a[k]), o);
const placeholders = (s) => (typeof s === 'string' ? (s.match(/\{\w+\}/g) || []).sort().join(',') : null);

const enPaths = paths(en);
let problems = 0;
for (const file of readdirSync(dir).filter((f) => f.endsWith('.js') && f !== 'en.js')) {
  const loc = (await import(new URL(file, dir))).default;
  const missing = enPaths.filter((p) => get(en, p) !== '' && (get(loc, p) === undefined || get(loc, p) === ''));
  const extra = paths(loc).filter((p) => get(en, p) === undefined);
  const badVars = enPaths.filter((p) => {
    const a = get(en, p); const b = get(loc, p);
    if (typeof a === 'string' && typeof b === 'string') return placeholders(a) !== placeholders(b);
    return false;
  });
  const arrays = enPaths.filter((p) => Array.isArray(get(en, p)) && (!Array.isArray(get(loc, p)) || get(loc, p).length !== get(en, p).length));
  console.log(`\n${file} (${loc.meta?.name || '?'}): ${enPaths.length - missing.length}/${enPaths.length} translated`);
  for (const p of missing) console.log(`  missing: ${p}`);
  for (const p of extra) console.log(`  not used (not in en.js): ${p}`);
  for (const p of badVars) console.log(`  {placeholders} differ: ${p}`);
  for (const p of arrays) console.log(`  list length differs: ${p}`);
  problems += missing.length + badVars.length + arrays.length;
}
if (!problems) console.log('\nAll languages complete.');
