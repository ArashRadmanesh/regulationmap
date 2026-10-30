import { energyBand, inferNeeds } from '../data/constants.js';
import { STARTERS, BUILTIN } from '../data/activities.js';
import { helpfulIds, rec } from './store.js';

// Two check-ins count as "the same kind of state" if they share a name the person gave,
// or the same energy band and the same pleasant/unpleasant answer.
export function similar(a, b) {
  if (!a || !b) return false;
  if (a.nameId && a.nameId === b.nameId) return true;
  return a.energy != null && energyBand(a.energy) === energyBand(b.energy) && a.valence && a.valence === b.valence && a.valence !== 'unsure';
}

// Rank the person's own tools for this check-in.
// safeOnly: the person said "I can't tell" -> only things usable at their very worst.
export function recommend(state, checkin, { worstOnly = false, showAvoid = false, limit = 6 } = {}) {
  const needs = checkin ? inferNeeds(checkin) : { effects: new Set(), states: new Set(), contexts: new Set() };
  const byId = Object.fromEntries(state.checkins.map((c) => [c.id, c]));
  const ids = helpfulIds(state);
  const out = [];
  let hiddenAvoid = 0;

  for (const id of ids) {
    const r = rec(state, id);
    if (r.nourish === 'avoid' && !showAvoid) { hiddenAvoid += 1; continue; }
    const access = r.access || {};
    if (worstOnly && access.worst !== 'y') continue;

    let score = 0;
    const why = { helped: 0, tried: 0, similar: !!checkin, effects: [] };

    // Learned from before/after check-ins.
    let helped = 0;
    let tried = 0;
    for (const t of state.trials) {
      if (t.itemId !== id || !t.after || t.after.compare === 'unsure') continue;
      const base = byId[t.checkinId];
      if (checkin && !similar(base, checkin)) continue;
      tried += 1;
      if (t.after.compare === 'better') helped += 1;
    }
    if (tried) score += helped * 3 - (tried - helped) * 2;
    why.helped = helped;
    why.tried = tried;

    // What the person said in stages 2-4.
    const effHits = (r.effects || []).filter((e) => needs.effects.has(e));
    score += effHits.length;
    why.effects = effHits;
    const stateHits = (r.states || []).filter((s) => needs.states.has(s));
    score += stateHits.length * 2;
    for (const ctx of needs.contexts) {
      if (access[ctx] === 'y') score += 1;
      if (access[ctx] === 'n') score -= 3;
    }
    if (access.worst === 'y') score += 0.5;
    if (r.nourish === 'always') score += 1;
    if (r.nourish === 'stuck') score -= 1;

    out.push({ id, score, why, worst: access.worst === 'y', nourish: r.nourish });
  }

  out.sort((a, b) => b.score - a.score);
  return { items: out.slice(0, limit), hiddenAvoid, total: out.length };
}

// Ideas for people who haven't marked anything yet.
export function starterIdeas(state, checkin, limit = 4) {
  const needs = checkin ? inferNeeds(checkin) : { effects: new Set() };
  const groups = [];
  if (needs.effects.has('calm') || needs.effects.has('safe')) groups.push('calm', 'ground');
  if (needs.effects.has('energise')) groups.push('activate');
  if (needs.effects.has('connect')) groups.push('connect');
  if (!groups.length) groups.push('calm', 'ground', 'activate');
  const seen = new Set();
  const out = [];
  for (const g of groups) for (const id of STARTERS[g] || []) {
    if (seen.has(id) || !BUILTIN[id] || rec(state, id).status === 'no') continue;
    seen.add(id);
    out.push({ id, starter: true });
  }
  return out.slice(0, limit);
}

// What a finished before/after pair tells us, in plain words.
export function learnFromTrial(before, after) {
  const notes = [];
  if (before?.energy != null && after?.energy != null) {
    if (after.energy < before.energy && before.energy >= 3) notes.push('calm');
    if (after.energy > before.energy && before.energy <= 1) notes.push('energise');
  }
  if (before?.valence === 'unpleasant' && (after?.valence === 'neither' || after?.valence === 'pleasant')) notes.push('eases');
  return notes;
}
