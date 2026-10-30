import { useState } from 'react';
import { ENERGY_LEVELS, VALENCE, BODY, URGES, COLORS, TEXTURES, COMMON_FEELINGS, suggestLabels, describeCheckin, energyBand } from '../data/constants.js';
import { useStore, uid, nameLabel } from '../lib/store.js';
import { useI18n } from '../i18n.js';
import { Chips, Radio, TopBar } from '../ui.jsx';

export default function CheckIn({ nav }) {
  const { state, update } = useStore();
  const i18n = useI18n();
  const { t, raw } = i18n;
  const alex = state.settings.alexithymia;
  const [step, setStep] = useState(1);
  const [d, setD] = useState({ energy: null, valence: null, body: [], urges: [] });
  const [nm, setNm] = useState({ existing: null, label: null, color: null, texture: null, word: '' });
  const patch = (p) => setD((x) => ({ ...x, ...p }));
  const top = () => document.querySelector('.content')?.scrollTo(0, 0);

  const finish = ({ withName, safe }) => {
    const id = uid();
    let nameId = null;
    update((s) => {
      if (withName) {
        if (nm.existing) nameId = nm.existing;
        else if (nm.label || nm.color || nm.texture || nm.word.trim()) {
          const n = { label: nm.label, color: nm.color, texture: nm.texture, word: nm.word.trim() || null };
          const same = s.names.find((x) => x.label === n.label && x.color === n.color && x.texture === n.texture && (x.word || null) === n.word);
          if (same) nameId = same.id;
          else { nameId = uid(); s.names.push({ id: nameId, ...n, energy: d.energy, valence: d.valence }); }
        }
      }
      s.checkins.push({ id, t: Date.now(), ...d, nameId, safe: !!safe });
      s.onboarded = true;
    });
    nav.replace('neednow', { checkinId: id, safe: !!safe });
  };

  const skipBtn = <button type="button" className="btn-text" onClick={() => finish({ withName: false })}>{t('common.skip')}</button>;

  if (step === 1) {
    const energy = raw('vocab.energy');
    return (
      <div className="screen">
        <TopBar onBack={nav.back} eyebrow={t('checkin.eyebrow', { n: 1 })} right={skipBtn} />
        <div className="content">
          <div className="stack-s">
            <h1 className="title">{t('checkin.bodyTitle')}</h1>
            <p className="lede">{alex ? t('checkin.bodyLedeAlex') : t('checkin.bodyLede')}</p>
          </div>
          <section className="stack" aria-labelledby="q-energy">
            <h2 id="q-energy" className="h2">{t('checkin.energyQ')}</h2>
            <div role="radiogroup" aria-labelledby="q-energy" className="grid-5">
              {ENERGY_LEVELS.map((i) => (
                <button key={i} type="button" role="radio" aria-checked={d.energy === i} className="choice choice-sm"
                  onClick={() => patch({ energy: d.energy === i ? null : i })}>
                  <EnergyBars level={i} />
                  <span>{energy[i]}</span>
                </button>
              ))}
            </div>
          </section>
          <section className="stack" aria-labelledby="q-val">
            <h2 id="q-val" className="h2">{t('checkin.valenceQ')}</h2>
            <Radio label={t('checkin.valenceQ')} options={VALENCE.map((v) => ({ id: v, label: t(`vocab.valence.${v}`) }))} cols={2} value={d.valence} onChange={(v) => patch({ valence: v })} />
          </section>
          <section className="stack" aria-labelledby="q-body">
            <h2 id="q-body" className="h2">{t('checkin.bodyQ')} <span className="small" style={{ fontWeight: 400 }}>{t('common.optional')}</span></h2>
            <Chips options={BODY.map((b) => ({ id: b, label: t(`vocab.body.${b}`) }))} values={d.body} onChange={(v) => patch({ body: v })} />
          </section>
        </div>
        <div className="footer">
          <button type="button" className="btn btn-primary" onClick={() => { setStep(2); top(); }}>{t('common.next')}</button>
          <button type="button" className="btn btn-outline" onClick={() => finish({ withName: false, safe: true })}>{t('checkin.safe')}</button>
        </div>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="screen">
        <TopBar onBack={() => setStep(1)} eyebrow={t('checkin.eyebrow', { n: 2 })} right={skipBtn} />
        <div className="content">
          <div className="stack-s">
            <h1 className="title">{t('checkin.urgesTitle')}</h1>
            <p className="lede">{t('checkin.urgesLede')}</p>
          </div>
          <div className="stack-s" style={{ gap: 8 }}>
            {URGES.map((u) => {
              const on = d.urges.includes(u);
              return (
                <button key={u} type="button" aria-pressed={on} className="choice" style={{ textAlign: 'left', padding: '0 16px' }}
                  onClick={() => patch({ urges: on ? d.urges.filter((x) => x !== u) : [...d.urges, u] })}>{t(`vocab.urges.${u}`)}</button>
              );
            })}
            <button type="button" className="choice" style={{ textAlign: 'left', padding: '0 16px', borderStyle: 'dashed', color: 'var(--accent)' }}
              onClick={() => { patch({ urges: [] }); setStep(3); top(); }}>{t('checkin.noPull')}</button>
          </div>
        </div>
        <div className="footer">
          <button type="button" className="btn btn-primary" onClick={() => { setStep(3); top(); }}>{t('common.next')}</button>
        </div>
      </div>
    );
  }

  const suggestions = suggestLabels(d);
  const ids = alex ? suggestions : [...new Set([...suggestions, ...COMMON_FEELINGS])];
  const seen = new Set();
  const words = ids.map((id) => ({ id, label: t(`vocab.feelings.${id}`) })).filter((w) => !seen.has(w.label) && seen.add(w.label));
  const band = energyBand(d.energy);
  const used = [...state.names]
    .sort((a, b) => ((b.valence === d.valence) + (energyBand(b.energy) === band)) - ((a.valence === d.valence) + (energyBand(a.energy) === band)))
    .slice(0, 4);
  const draftName = nm.existing ? nameLabel(state.names.find((n) => n.id === nm.existing), i18n)
    : nameLabel({ label: nm.label, color: nm.color, texture: nm.texture, word: nm.word.trim() }, i18n);
  const setName = (p) => setNm((x) => ({ ...x, existing: null, ...p }));
  const sofar = describeCheckin(d, i18n);

  return (
    <div className="screen">
      <TopBar onBack={() => setStep(2)} eyebrow={t('checkin.eyebrowOptional')} />
      <div className="content">
        {sofar && (
          <div className="card stack-s" style={{ gap: 2, padding: '12px 16px' }}>
            <span className="small">{t('checkin.soFar')}</span>
            <span className="opt-title">{sofar}</span>
          </div>
        )}
        <h1 className="title">{t('checkin.nameTitle')}</h1>
        {used.length > 0 && (
          <section className="stack-s" style={{ gap: 8 }}>
            <h2 className="h2">{t('checkin.usedBefore')}</h2>
            <div className="row-wrap">
              {used.map((n) => (
                <button key={n.id} type="button" className="chip" aria-pressed={nm.existing === n.id}
                  onClick={() => setNm({ existing: nm.existing === n.id ? null : n.id, label: null, color: null, texture: null, word: '' })}>{nameLabel(n, i18n)}</button>
              ))}
            </div>
          </section>
        )}
        {words.length > 0 && (
          <section className="stack-s" style={{ gap: 8 }}>
            <h2 className="h2">{alex ? t('checkin.couldBe') : t('checkin.feelingWords')}</h2>
            <Radio label={t('checkin.feelingWords')} className="chip" options={words} value={nm.label} onChange={(v) => setName({ label: v })} />
            {alex && <p className="small">{t('checkin.justIdeas')}</p>}
          </section>
        )}
        <section className="card stack" aria-labelledby="own-way">
          <h2 id="own-way" className="h2">{words.length ? t('checkin.ownWay') : t('checkin.ownWayOnly')}</h2>
          <div role="radiogroup" aria-label={t('checkin.colour')} className="row-wrap">
            {COLORS.map((c) => (
              <button key={c.id} type="button" role="radio" aria-checked={nm.color === c.id} aria-label={t(`vocab.colors.${c.id}`)} className="swatch"
                style={{ background: c.hex }} onClick={() => setName({ color: nm.color === c.id ? null : c.id })} />
            ))}
          </div>
          <Radio label={t('checkin.texture')} className="chip" options={TEXTURES.map((x) => ({ id: x, label: t(`vocab.textures.${x}`) }))} value={nm.texture} onChange={(v) => setName({ texture: v })} />
          <label className="field" htmlFor="own-word">{t('checkin.ownWord')}
            <input id="own-word" className="input" value={nm.word} placeholder={t('checkin.ownWordPlaceholder')} onChange={(e) => setName({ word: e.target.value })} />
          </label>
        </section>
      </div>
      <div className="footer">
        <button type="button" className="btn btn-primary" onClick={() => finish({ withName: true })}>
          {draftName ? t('checkin.saveName', { name: draftName }) : t('common.continue')}
        </button>
        <button type="button" className="btn btn-quiet" onClick={() => finish({ withName: false })}>{t('checkin.noName')}</button>
      </div>
    </div>
  );
}

function EnergyBars({ level }) {
  const heights = [5, 9, 13, 18];
  return (
    <span aria-hidden="true" style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 18 }}>
      {heights.map((h, i) => (
        <span key={h} style={{ width: 4, height: h, borderRadius: 1, background: 'currentColor', opacity: i < level ? 1 : 0.25 }} />
      ))}
    </span>
  );
}
