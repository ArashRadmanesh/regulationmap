import { useState } from 'react';
import { ENERGY_LEVELS, VALENCE, COMPARE } from '../data/constants.js';
import { useStore, itemLabel, ensureItem, nameLabel } from '../lib/store.js';
import { learnFromTrial } from '../lib/recommend.js';
import { useI18n } from '../i18n.js';
import { TopBar } from '../ui.jsx';

function Marked({ options, value, before, onChange, label, cols, beforeText }) {
  return (
    <div role="radiogroup" aria-label={label} style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gap: 6 }}>
      {options.map((o) => (
        <div key={o.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <button type="button" role="radio" aria-checked={value === o.id} className="choice choice-sm" style={{ width: '100%' }}
            onClick={() => onChange(value === o.id ? null : o.id)}>{o.label}</button>
          <span className="small" style={{ fontSize: 11, fontWeight: 650, height: 14 }}>{before === o.id ? beforeText : ''}</span>
        </div>
      ))}
    </div>
  );
}

export default function AfterCheck({ nav, params }) {
  const { state, update } = useStore();
  const i18n = useI18n();
  const { t, tn, raw } = i18n;
  const trial = state.trials.find((x) => x.id === params.trialId);
  const before = trial?.checkinId ? state.checkins.find((c) => c.id === trial.checkinId) : null;
  const [energy, setEnergy] = useState(null);
  const [valence, setValence] = useState(null);
  const [compare, setCompare] = useState(null);

  if (!trial) {
    return (
      <div className="screen"><TopBar onBack={nav.back} /><div className="content"><p className="empty">{t('after.notFound')}</p></div></div>
    );
  }
  const name = before?.nameId ? state.names.find((n) => n.id === before.nameId) : null;
  const energyWords = raw('vocab.energy');
  const energyLower = raw('vocab.energyLower');

  const lines = [];
  if (before?.energy != null && energy != null && before.energy !== energy) {
    lines.push(t('after.change', { from: t('checkin.engine', { level: energyLower[before.energy] }), to: energyLower[energy] }));
  }
  if (before?.valence && valence && before.valence !== valence) {
    lines.push(t('after.change', { from: t(`vocab.valence.${before.valence}`), to: t(`vocab.valence.${valence}`).toLocaleLowerCase() }));
  }
  const learned = compare === 'better' ? learnFromTrial(before, { energy, valence }) : [];
  const what = t(`after.${learned.includes('calm') ? 'calm' : learned.includes('energise') ? 'energise' : learned.includes('eases') ? 'eases' : 'helps'}`);

  const save = () => {
    update((s) => {
      const x = s.trials.find((y) => y.id === trial.id);
      x.after = { t: Date.now(), energy, valence, compare: compare || 'unsure' };
      const r = ensureItem(s, trial.itemId);
      if (compare === 'better') {
        if (r.status !== 'yes') r.status = 'yes';
        r.learned = [...new Set([...(r.learned || []), ...learned.filter((y) => y !== 'eases')])];
      }
    });
    nav.toast(compare === 'better' ? t('after.toastBetter') : t('after.toastOther'));
    nav.reset('home');
  };

  return (
    <div className="screen">
      <TopBar onBack={nav.back} eyebrow={t('after.eyebrow')} />
      <div className="content">
        <div className="stack-s">
          <h1 className="title">{tn('after.title', { item: <span className="hl">{itemLabel(state, trial.itemId, i18n)}</span> })}</h1>
          <p className="lede">{before ? t('after.lede') : t('after.ledeNone')}</p>
        </div>
        <section className="stack">
          <h2 className="h2">{t('after.energyQ')}</h2>
          <Marked label={t('after.energyQ')} cols={5} beforeText={t('after.before')} options={ENERGY_LEVELS.map((i) => ({ id: i, label: energyWords[i] }))} value={energy} before={before?.energy} onChange={setEnergy} />
        </section>
        <section className="stack">
          <h2 className="h2">{t('after.valenceQ')}</h2>
          <Marked label={t('after.valenceQ')} cols={4} beforeText={t('after.before')} options={VALENCE.map((v) => ({ id: v, label: t(`vocab.valence.${v}`) }))} value={valence} before={before?.valence} onChange={setValence} />
        </section>
        <section className="stack">
          <h2 className="h2">{t('after.compareQ')}</h2>
          <Marked label={t('after.compareQ')} cols={2} options={COMPARE.map((x) => ({ id: x, label: t(`vocab.compare.${x}`) }))} value={compare} onChange={setCompare} />
        </section>
        {(lines.length > 0 || compare) && (
          <div className="note">
            <p>
              {lines.length > 0 && <>{lines.join(', ')}. </>}
              {compare === 'better' && (name ? t('after.savedAsWhen', { what, name: nameLabel(name, i18n) }) : t('after.savedAs', { what }))}
              {compare === 'same' && t('after.same')}
              {compare === 'worse' && t('after.worse')}
              {compare === 'unsure' && t('after.unsure')}
            </p>
          </div>
        )}
      </div>
      <div className="footer">
        <button type="button" className="btn btn-primary" onClick={save}>{t('after.save')}</button>
      </div>
    </div>
  );
}
