import { useState } from 'react';
import { CONTEXTS, EFFECTS, STATES, NOURISH } from '../data/constants.js';
import { useStore, helpfulIds, itemLabel, ensureItem } from '../lib/store.js';
import { useI18n } from '../i18n.js';
import { Chips, Icon, Progress, Radio, TopBar } from '../ui.jsx';
import { STAGES, isAnswered } from './Home.jsx';

export default function StageFlow({ nav, params }) {
  const { key } = params;
  const stage = STAGES.find((s) => s.key === key);
  const { state, update } = useStore();
  const i18n = useI18n();
  const { t, tn } = i18n;
  const [queue, setQueue] = useState(() => helpfulIds(state).filter((id) => !isAnswered(state.items[id], key)));
  const [i, setI] = useState(0);
  const id = queue[i];
  const r = (id && state.items[id]) || {};
  const label = id ? itemLabel(state, id, i18n) : '';
  const hl = <span className="hl">{label}</span>;
  const set = (fn) => update((s) => fn(ensureItem(s, id)));
  const next = () => {
    setI((n) => n + 1);
    document.querySelector('.content')?.scrollTo(0, 0);
  };
  const nextStage = STAGES.find((s) => s.id === stage.id + 1);
  const ynm = [
    { id: 'y', label: t('common.yes') },
    { id: 'm', label: t('common.notSure') },
    { id: 'n', label: t('common.no') },
  ];

  if (!id) {
    const total = helpfulIds(state).length;
    return (
      <div className="screen">
        <TopBar onBack={nav.back} eyebrow={t('stage.eyebrowShort', { s: stage.id })} />
        <div className="content">
          <div className="empty" style={{ paddingTop: 48 }}>
            <span className="num done" style={{ width: 56, height: 56 }}><Icon name="check" size={28} /></span>
            <h1 className="title">{queue.length ? t('stage.doneTitle') : t('stage.emptyTitle')}</h1>
            <p className="lede">{t('stage.doneLede')}</p>
            {total > 0 && (
              <button type="button" className="btn btn-text" onClick={() => { setQueue(helpfulIds(state)); setI(0); }}>{t('stage.again', { n: total })}</button>
            )}
          </div>
        </div>
        <div className="footer">
          {nextStage && <button type="button" className="btn btn-primary" onClick={() => nav.replace('stage', { key: nextStage.key })}>{t('stage.nextStage', { title: t(`home.stage${nextStage.id}`) })}</button>}
          <button type="button" className="btn btn-outline" onClick={() => nav.go('map')}>{t('stage.seeMap')}</button>
        </div>
      </div>
    );
  }

  let body;
  let skipLabel = t('common.skip');
  let onSkip = next;
  if (key === 'access') {
    body = (
      <>
        <h1 className="title">{tn('stage.accessTitle', { item: hl })}</h1>
        <div className="stack">
          {CONTEXTS.map((c) => {
            const lab = t(`vocab.contexts.${c}`);
            return (
              <div key={c} className="card stack-s" style={c === 'worst' ? { boxShadow: 'inset 0 0 0 2px var(--accent)' } : undefined}>
                <span className="opt-title">{lab}</span>
                <Radio label={lab} options={ynm} cols={3} noId="n" value={r.access?.[c] ?? null}
                  onChange={(v) => set((x) => { x.access = { ...(x.access || {}), [c]: v }; if (!v) delete x.access[c]; })} />
              </div>
            );
          })}
        </div>
      </>
    );
  } else if (key === 'effect') {
    skipLabel = t('stage.findOut');
    onSkip = () => { set((x) => { x.skip = { ...(x.skip || {}), effect: true }; }); next(); };
    body = (
      <>
        <h1 className="title">{tn('stage.effectTitle', { item: hl })}</h1>
        <p className="lede">{t('stage.effectLede')}</p>
        <Chips options={EFFECTS.map((e) => ({ id: e, label: t(`vocab.effects.${e}`) }))} values={r.effects || []} onChange={(v) => set((x) => { x.effects = v; })} />
        <div className="card stack-s">
          <label className="field" htmlFor={`note-${id}`}>{t('stage.effectNote')} <span className="small" style={{ fontWeight: 400 }}>{t('common.optional')}</span></label>
          <textarea id={`note-${id}`} className="input" rows={3} value={r.effectNote || ''} placeholder={t('stage.effectNotePlaceholder')}
            onChange={(e) => set((x) => { x.effectNote = e.target.value; })} />
        </div>
      </>
    );
  } else if (key === 'states') {
    skipLabel = t('stage.askLater');
    body = (
      <>
        <h1 className="title">{tn('stage.statesTitle', { item: hl })}</h1>
        <p className="lede">{t('stage.statesLede')}</p>
        <Chips options={STATES.map((s) => ({ id: s, label: t(`vocab.states.${s}`) }))} values={r.states || []} onChange={(v) => set((x) => { x.states = v; })} />
        <div className="note">
          <Icon name="info" color="var(--accent)" />
          <p>{state.settings.alexithymia ? t('stage.statesTipAlex') : t('stage.statesTip')}</p>
        </div>
      </>
    );
  } else {
    body = (
      <>
        <h1 className="title">{tn('stage.nourishTitle', { item: hl })}</h1>
        <p className="lede">{t('stage.nourishLede')}</p>
        <div role="radiogroup" aria-label={t('stage.nourishGroup')} className="stack-s" style={{ gap: 10 }}>
          {NOURISH.map((o) => {
            const warm = o === 'stuck' || o === 'avoid';
            return (
              <button key={o} type="button" role="radio" aria-checked={r.nourish === o} className={`option${warm ? ' warm' : ''}`}
                onClick={() => set((x) => { x.nourish = x.nourish === o ? null : o; })}>
                <span className="dot" />
                <span className="opt-text"><span className="opt-title">{t(`vocab.nourish.${o}`)}</span><span className="opt-sub">{t(`vocab.nourish.${o}Sub`)}</span></span>
              </button>
            );
          })}
        </div>
        {(r.nourish === 'stuck' || r.nourish === 'avoid' || r.nourish === 'sometimes') && (
          <div className="card stack-s">
            <label className="field" htmlFor={`tip-${id}`}>{t('stage.tipLabel')}</label>
            <textarea id={`tip-${id}`} className="input" rows={2} value={r.tipNote || ''} placeholder={t('stage.tipPlaceholder')}
              onChange={(e) => set((x) => { x.tipNote = e.target.value; })} />
          </div>
        )}
      </>
    );
  }

  return (
    <div className="screen">
      <TopBar onBack={nav.back} eyebrow={t('stage.eyebrow', { s: stage.id, i: i + 1, n: queue.length })} />
      <div className="content">
        <Progress value={(i / queue.length) * 100} />
        {body}
      </div>
      <div className="footer row">
        <button type="button" className="btn btn-quiet" style={{ padding: '0 8px' }} onClick={onSkip}>{skipLabel}</button>
        <button type="button" className="btn btn-primary" style={{ minHeight: 48 }} onClick={next}>{i + 1 < queue.length ? t('stage.nextItem') : t('stage.finish')}</button>
      </div>
    </div>
  );
}
