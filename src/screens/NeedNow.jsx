import { useState } from 'react';
import { describeCheckin } from '../data/constants.js';
import { useStore, uid, nameLabel, helpfulIds, itemLabel } from '../lib/store.js';
import { recommend, starterIdeas } from '../lib/recommend.js';
import { useI18n } from '../i18n.js';
import { TopBar } from '../ui.jsx';

export default function NeedNow({ nav, params }) {
  const { state, update } = useStore();
  const i18n = useI18n();
  const { t } = i18n;
  const c = state.checkins.find((x) => x.id === params.checkinId) || null;
  const name = c?.nameId ? state.names.find((n) => n.id === c.nameId) : null;
  const [worstOnly, setWorstOnly] = useState(!!params.safe || c?.energy === 0 || c?.energy === 4);
  const [showAvoid, setShowAvoid] = useState(false);
  const [started, setStarted] = useState(null); // trial id
  const limit = state.settings.fewer ? 4 : 6;

  const res = recommend(state, c, { worstOnly, showAvoid, limit });
  const fewMarked = helpfulIds(state).length < 3;
  const ideas = fewMarked ? starterIdeas(state, c, 4).filter((x) => !res.items.some((r) => r.id === x.id)) : [];
  const worstCount = helpfulIds(state).filter((id) => state.items[id]?.access?.worst === 'y').length;

  const tryIt = (itemId) => {
    const id = uid();
    update((s) => { s.trials.push({ id, itemId, checkinId: c?.id || null, t: Date.now(), after: null }); });
    setStarted(id);
    nav.toast(t('neednow.toast'));
  };

  const reason = (r) => {
    if (r.starter) return t('neednow.idea');
    const parts = [];
    if (r.why?.tried) parts.push(t(r.why.similar ? 'common.helpedOfLikeThis' : 'common.helpedOf', { h: r.why.helped, n: r.why.tried }));
    if (r.why?.effects?.length) parts.push(r.why.effects.map((e) => t(`vocab.effects.${e}`)).join(' · '));
    return parts.length ? parts.join(' · ') : t('neednow.onList');
  };

  const summary = c ? describeCheckin(c, i18n) : '';
  const activeItem = started && state.trials.find((x) => x.id === started)?.itemId;

  const card = (r) => {
    const active = activeItem === r.id;
    return (
      <div key={r.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 12px 12px 16px', boxShadow: active ? 'inset 0 0 0 2px var(--accent)' : undefined }}>
        <span className="opt-text" style={{ flex: 1 }}>
          <span className="opt-title">{itemLabel(state, r.id, i18n)}</span>
          <span className="opt-sub">{reason(r)}</span>
          {(r.worst || r.nourish === 'stuck' || r.nourish === 'avoid') && (
            <span className="row-wrap" style={{ gap: 6, marginTop: 4 }}>
              {r.worst && <span className="badge">{t('common.atWorst')}</span>}
              {r.nourish === 'stuck' && <span className="badge warm">{t('common.canGetStuck')}</span>}
              {r.nourish === 'avoid' && <span className="badge warm">{t('common.oftenAvoidance')}</span>}
            </span>
          )}
        </span>
        {active ? (
          <span className="badge" style={{ padding: '8px 12px' }}>{t('common.trying')}</span>
        ) : (
          <button type="button" className="btn btn-outline" style={{ minHeight: 44, padding: '0 16px', flex: 'none' }} onClick={() => tryIt(r.id)}>{t('common.tryIt')}</button>
        )}
      </div>
    );
  };

  return (
    <div className="screen">
      <TopBar onBack={nav.back} />
      <div className="content">
        <h1 className="title">{params.safe ? t('neednow.titleSafe') : t('neednow.title')}</h1>
        {c && (summary || name) && (
          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 8px 12px 16px' }}>
            <span className="opt-text" style={{ flex: 1 }}>
              <span className="small">{t('neednow.yourCheckin')}</span>
              {summary && <span className="opt-title">{summary}</span>}
              {name && <span className="opt-sub">{t('neednow.youCalledIt', { name: nameLabel(name, i18n) })}</span>}
            </span>
            <button type="button" className="btn-text" onClick={() => nav.replace('checkin')}>{t('common.change')}</button>
          </div>
        )}
        {worstCount > 0 && (
          <label className="toggle-row" htmlFor="worst-only" style={{ borderTop: 0, minHeight: 44, padding: 0 }}>
            <input id="worst-only" type="checkbox" checked={worstOnly} onChange={(e) => setWorstOnly(e.target.checked)} />
            <span>{t('neednow.worstOnly')}</span>
          </label>
        )}

        {res.items.length > 0 && <div className="stack">{res.items.map(card)}</div>}

        {res.items.length === 0 && !ideas.length && (
          <div className="empty">
            <p>{worstOnly ? t('neednow.emptyWorst') : t('neednow.emptyList')}</p>
            {worstOnly
              ? <button type="button" className="btn btn-outline" onClick={() => setWorstOnly(false)}>{t('neednow.showAll')}</button>
              : <button type="button" className="btn btn-outline" onClick={() => nav.go('toolbank')}>{t('neednow.buildList')}</button>}
          </div>
        )}

        {ideas.length > 0 && (
          <section className="stack">
            <div className="stack-s" style={{ gap: 2 }}>
              <h2 className="h2">{t('neednow.ideasTitle')}</h2>
              <p className="small">{t('neednow.ideasSub')}</p>
            </div>
            {ideas.map(card)}
          </section>
        )}

        {res.hiddenAvoid > 0 && (
          <p className="small">
            {t('neednow.hidden', { n: res.hiddenAvoid })}{' '}
            <button type="button" className="btn-text" style={{ minHeight: 0, padding: 0 }} onClick={() => setShowAvoid(true)}>{t('neednow.showHidden', { n: res.hiddenAvoid })}</button>
          </p>
        )}
        <p className="small">{t('common.crisis')}</p>
      </div>
      <div className="footer">
        {started ? (
          <button type="button" className="btn btn-primary" onClick={() => nav.replace('after', { trialId: started })}>{t('neednow.done')}</button>
        ) : (
          <button type="button" className="btn btn-quiet" onClick={() => nav.reset('home')}>{t('neednow.home')}</button>
        )}
      </div>
    </div>
  );
}
