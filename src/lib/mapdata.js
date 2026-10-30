import { energyBand, EFFECTS, STATES } from '../data/constants.js';
import { helpfulIds, itemLabel, nameLabel } from './store.js';

const lower = (s) => (s ? s.charAt(0).toLocaleLowerCase() + s.slice(1) : s);
const upper = (s) => (s ? s.charAt(0).toLocaleUpperCase() + s.slice(1) : s);

// Everything the map and the therapist summary show, in the current language.
export function buildMap(state, i18n) {
  const { t, raw } = i18n;
  const checkins = Object.fromEntries(state.checkins.map((c) => [c.id, c]));
  const names = Object.fromEntries(state.names.map((n) => [n.id, n]));
  const groups = new Map();
  const label = (id) => itemLabel(state, id, i18n);

  const detailOf = (c) => {
    const bits = [];
    if (c.energy != null) bits.push(t('map.detailEngine', { level: raw('vocab.energyLower')[c.energy] }));
    if (c.valence && c.valence !== 'unsure') bits.push(lower(t(`vocab.valence.${c.valence}`)));
    const u = (c.urges || [])[0];
    if (u) bits.push(lower(t(`vocab.urgeWant.${u}`)));
    return bits.join(' · ');
  };
  const clusterTitle = (band, valence) => {
    const b = band ? raw(`vocab.bands.${band}`) : null;
    if (!b) return t('map.otherTimes');
    if (!valence || valence === 'unsure') return t('map.clusterBand', { band: b });
    return t('map.cluster', { band: b, valence: lower(t(`vocab.valence.${valence}`)) });
  };

  for (const tr of state.trials) {
    if (!tr.after || tr.after.compare === 'unsure') continue;
    const c = checkins[tr.checkinId];
    let key;
    let title;
    let own = false;
    if (c?.nameId && names[c.nameId]) {
      key = `n:${c.nameId}`;
      title = nameLabel(names[c.nameId], i18n);
      own = true;
    } else if (c) {
      key = `c:${energyBand(c.energy)}|${c.valence}`;
      title = clusterTitle(energyBand(c.energy), c.valence);
    } else {
      key = 'none';
      title = t('map.noCheckin');
    }
    const detail = c ? detailOf(c) : '';
    if (!groups.has(key)) groups.set(key, { key, title, detail, own, tools: new Map() });
    const g = groups.get(key);
    if (!g.detail && detail) g.detail = detail;
    const s = g.tools.get(tr.itemId) || { id: tr.itemId, tried: 0, helped: 0 };
    s.tried += 1;
    if (tr.after.compare === 'better') s.helped += 1;
    g.tools.set(tr.itemId, s);
  }

  const learnedGroups = [...groups.values()].map((g) => ({
    ...g,
    tools: [...g.tools.values()]
      .map((s) => ({ ...s, label: label(s.id), worst: state.items[s.id]?.access?.worst === 'y' }))
      .sort((a, b) => b.helped / b.tried - a.helped / a.tried || b.tried - a.tried),
  })).sort((a, b) => (b.own - a.own) || b.tools.length - a.tools.length);

  const helpful = helpfulIds(state);
  const said = STATES.map((st) => ({
    id: st,
    title: upper(t('map.whenState', { state: lower(t(`vocab.states.${st}`)) })),
    tools: helpful.filter((id) => (state.items[id].states || []).includes(st)).map((id) => ({ id, label: label(id), worst: state.items[id].access?.worst === 'y' })),
  })).filter((g) => g.tools.length);

  const byEffect = EFFECTS.map((e) => ({
    id: e,
    title: t('map.helpsMe', { effect: lower(t(`vocab.effects.${e}`)) }),
    tools: helpful
      .filter((id) => (state.items[id].effects || []).includes(e) || (state.items[id].learned || []).includes(e))
      .map((id) => ({ id, label: label(id), learned: !(state.items[id].effects || []).includes(e) })),
  })).filter((g) => g.tools.length);

  const worst = helpful.filter((id) => state.items[id].access?.worst === 'y').map((id) => ({ id, label: label(id) }));

  const watch = helpful
    .filter((id) => ['stuck', 'avoid'].includes(state.items[id].nourish))
    .map((id) => ({ id, label: label(id), kind: state.items[id].nourish, note: state.items[id].tipNote || '' }));

  const ownNames = state.names.map((n) => ({ id: n.id, label: nameLabel(n, i18n), detail: detailOf({ energy: n.energy, valence: n.valence }) }));

  const tries = state.trials.filter((x) => x.after).length;
  return { learnedGroups, said, byEffect, worst, watch, ownNames, tries, checkins: state.checkins.length, helpfulCount: helpful.length };
}
