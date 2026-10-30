import { useMemo, useState } from 'react';
import { CATEGORIES } from '../data/activities.js';
import { useStore, ensureItem, uid, helpfulIds } from '../lib/store.js';
import { useI18n } from '../i18n.js';
import { BottomNav, Icon, TopBar } from '../ui.jsx';

function Row({ item, status, onMark }) {
  const { t } = useI18n();
  return (
    <div className={`tool-row${status === 'no' ? ' is-no' : ''}`}>
      <span className="label">{item.label}</span>
      <button type="button" className="mark yes" aria-pressed={status === 'yes'} aria-label={t('toolbank.helps', { item: item.label })} onClick={() => onMark(item.id, 'yes')}>
        <Icon name="check" size={20} stroke={2.4} />
      </button>
      <button type="button" className="mark no" aria-pressed={status === 'no'} aria-label={t('toolbank.notForMe', { item: item.label })} onClick={() => onMark(item.id, 'no')}>
        <Icon name="x" size={20} stroke={2.4} />
      </button>
    </div>
  );
}

export default function Toolbank({ nav }) {
  const { state, update } = useStore();
  const { t } = useI18n();
  const fewer = state.settings.fewer;
  const cats = useMemo(() => {
    const list = CATEGORIES.map((c) => ({
      id: c.id,
      title: t(`categories.${c.id}.title`),
      note: t(`categories.${c.id}.note`),
      items: c.items.map((id) => ({ id, label: t(`items.${id}`) })),
    }));
    const mine = { id: 'mine', title: t('toolbank.mine'), note: t('toolbank.mineNote'), items: state.custom };
    return state.custom.length ? [mine, ...list] : list;
  }, [state.custom, t]);
  const [cat, setCat] = useState(fewer ? CATEGORIES[0].id : 'all');
  const [q, setQ] = useState('');
  const [adding, setAdding] = useState('');

  const mark = (id, v) => update((s) => {
    const r = ensureItem(s, id);
    r.status = r.status === v ? null : v;
  });

  const addOwn = (e) => {
    e.preventDefault();
    const label = adding.trim();
    if (!label) return;
    const id = `own-${uid()}`;
    update((s) => {
      s.custom.push({ id, label, cat: 'mine' });
      ensureItem(s, id).status = 'yes';
    });
    setAdding('');
    nav.toast(t('toolbank.added'));
  };

  const query = q.trim().toLocaleLowerCase();
  let shown = cats;
  if (query) {
    shown = cats.map((c) => ({ ...c, items: c.items.filter((i) => i.label.toLocaleLowerCase().includes(query)) })).filter((c) => c.items.length);
  } else if (cat !== 'all') {
    shown = cats.filter((c) => c.id === cat);
  }
  const helpful = helpfulIds(state).length;
  const no = Object.values(state.items).filter((r) => r.status === 'no').length;
  const catIdx = cats.findIndex((c) => c.id === cat);

  return (
    <div className="screen">
      <TopBar eyebrow={t('toolbank.eyebrow')} />
      <div className="content" style={{ gap: 14 }}>
        <div className="stack-s">
          <h1 className="title">{t('toolbank.title')}</h1>
          <p className="lede">{t('toolbank.lede')}</p>
        </div>
        <label className="search" htmlFor="tool-search">
          <Icon name="search" size={18} color="var(--muted)" />
          <span className="sr-only">{t('toolbank.searchLabel')}</span>
          <input id="tool-search" type="search" placeholder={t('toolbank.search')} value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
        {!query && (
          <div className="cat-scroller" role="tablist" aria-label={t('toolbank.groups')}>
            {!fewer && <button type="button" role="tab" className="chip" aria-selected={cat === 'all'} aria-pressed={cat === 'all'} onClick={() => setCat('all')}>{t('toolbank.all')}</button>}
            {cats.map((c) => (
              <button key={c.id} type="button" role="tab" className="chip" aria-selected={cat === c.id} aria-pressed={cat === c.id} onClick={() => setCat(c.id)}>{c.title}</button>
            ))}
          </div>
        )}
        {shown.map((c) => (
          <section key={c.id} className="stack-s" style={{ gap: 8 }} aria-label={c.title}>
            <div className="stack-s" style={{ gap: 0 }}>
              <h2 className="h2">{c.title}</h2>
              {c.note && <p className="small">{c.note}</p>}
            </div>
            {c.items.map((it) => <Row key={it.id} item={it} status={state.items[it.id]?.status} onMark={mark} />)}
          </section>
        ))}
        {query && !shown.length && <p className="empty">{t('toolbank.noMatch', { q })}</p>}
        {fewer && !query && catIdx >= 0 && catIdx < cats.length - 1 && (
          <button type="button" className="btn btn-outline" onClick={() => { setCat(cats[catIdx + 1].id); document.querySelector('.content')?.scrollTo(0, 0); }}>
            {t('toolbank.nextGroup', { group: cats[catIdx + 1].title })}
          </button>
        )}
        <form onSubmit={addOwn} className="card stack-s">
          <label className="field" htmlFor="own-item">{t('toolbank.addLabel')}</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input id="own-item" className="input" value={adding} onChange={(e) => setAdding(e.target.value)} placeholder={t('toolbank.addPlaceholder')} />
            <button type="submit" className="btn btn-primary" style={{ minHeight: 48, padding: '0 18px' }} disabled={!adding.trim()}>{t('common.add')}</button>
          </div>
        </form>
      </div>
      <div className="footer row">
        <span className="small">{t('toolbank.counts', { yes: helpful, no })}</span>
        <button type="button" className="btn btn-primary" style={{ minHeight: 48 }} disabled={!helpful} onClick={() => nav.go('stage', { key: 'access' })}>{t('toolbank.nextStep')}</button>
      </div>
      <BottomNav current="toolbank" go={nav.go} />
    </div>
  );
}
