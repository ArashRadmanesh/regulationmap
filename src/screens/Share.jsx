import { useState } from 'react';
import { useStore, itemLabel } from '../lib/store.js';
import { buildMap } from '../lib/mapdata.js';
import { describeCheckin } from '../data/constants.js';
import { useI18n } from '../i18n.js';
import { TopBar } from '../ui.jsx';

const OPTIONS = [['helps', true], ['worst', true], ['names', true], ['watch', false], ['history', false]];

function summaryText(state, data, i18n) {
  const { t, date } = i18n;
  const m = buildMap(state, i18n);
  const o = data.opts;
  const L = [
    `${t('summary.defaultTitle')}${data.name ? ` — ${data.name}` : ''}`,
    `${t('summary.shared', { date: date(Date.now(), { day: 'numeric', month: 'long', year: 'numeric' }) })} · ${t('summary.basedOn', { checkins: t('common.checkins', { n: m.checkins }), tries: t('common.tries', { n: m.tries }) })}`,
    '',
  ];
  if (o.helps) {
    L.push(t('summary.helpsTitle').toLocaleUpperCase());
    for (const g of m.learnedGroups) for (const x of g.tools) L.push(`- ${g.title}: ${x.label} (${t('summary.helped', { h: x.helped, n: x.tried })})`);
    for (const g of m.said) L.push(`- ${g.title}: ${g.tools.map((x) => x.label).join(', ')}`);
    L.push('');
  }
  if (o.worst && m.worst.length) L.push(t('summary.worstTitle').toLocaleUpperCase(), m.worst.map((x) => x.label).join(', '), '');
  if (o.names && m.ownNames.length) {
    L.push(t('summary.namesTitle').toLocaleUpperCase());
    for (const n of m.ownNames) L.push(`- ${i18n.quote(n.label)}${n.detail ? `: ${n.detail}` : ''}`);
    L.push('');
  }
  if (o.watch && m.watch.length) {
    L.push(t('summary.watchTitle').toLocaleUpperCase());
    for (const w of m.watch) L.push(`- ${w.label}${w.note ? ` (${t('summary.tippingLower', { note: w.note })})` : ''}`);
    L.push('');
  }
  L.push(t('summary.textFoot'));
  return L.join('\n');
}

export function Share({ nav }) {
  const { state } = useStore();
  const i18n = useI18n();
  const { t } = i18n;
  const [opts, setOpts] = useState(() => Object.fromEntries(OPTIONS));
  const [name, setName] = useState('');
  const data = { opts, name: name.trim() };
  const nothing = !Object.values(opts).some(Boolean);

  const pdf = () => {
    nav.setPrintData(data);
    setTimeout(() => { try { window.print(); } catch { /* not available */ } }, 80);
  };
  const copy = async () => {
    const text = summaryText(state, data, i18n);
    try {
      await navigator.clipboard.writeText(text);
      nav.toast(t('share.copied'));
    } catch {
      nav.go('summary', { data, text: true });
    }
  };

  return (
    <div className="screen">
      <TopBar onBack={nav.back} />
      <div className="content">
        <div className="stack-s">
          <h1 className="title">{t('share.title')}</h1>
          <p className="lede">{t('share.lede')}</p>
        </div>
        <div className="card tight">
          {OPTIONS.map(([k]) => (
            <label key={k} className="toggle-row" htmlFor={`share-${k}`}>
              <span className="opt-text" style={{ flex: 1 }}><span className="opt-title">{t(`share.${k}`)}</span><span className="opt-sub">{t(`share.${k}Sub`)}</span></span>
              <input id={`share-${k}`} type="checkbox" checked={opts[k]} onChange={(e) => setOpts((o) => ({ ...o, [k]: e.target.checked }))} />
            </label>
          ))}
        </div>
        <label className="field" htmlFor="share-name">{t('share.nameLabel')} <span className="small" style={{ fontWeight: 400 }}>{t('common.optional')}</span>
          <input id="share-name" className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder={t('share.namePlaceholder')} />
        </label>
      </div>
      <div className="footer">
        <button type="button" className="btn btn-primary" disabled={nothing} onClick={() => nav.go('summary', { data })}>{t('share.preview')}</button>
        <div className="grid-2">
          <button type="button" className="btn btn-outline" disabled={nothing} onClick={pdf}>{t('share.pdf')}</button>
          <button type="button" className="btn btn-outline" disabled={nothing} onClick={copy}>{t('share.copy')}</button>
        </div>
        <p className="small" style={{ textAlign: 'center' }}>{t('share.pdfHint')}</p>
      </div>
    </div>
  );
}

export function SummaryBody({ data }) {
  const { state } = useStore();
  const i18n = useI18n();
  const { t, date } = i18n;
  const m = buildMap(state, i18n);
  const o = data.opts;
  const notShared = Object.keys(o).filter((k) => !o[k]).map((k) => t(`share.${k}`));
  const rows = [];
  for (const g of m.learnedGroups) g.tools.forEach((x, i) => rows.push({ state: i === 0 ? (g.own ? i18n.quote(g.title) : g.title) : '', detail: i === 0 ? g.detail : '', tool: x.label, helped: t('summary.helped', { h: x.helped, n: x.tried }), worst: x.worst }));
  for (const g of m.said) g.tools.forEach((x, i) => rows.push({ state: i === 0 ? g.title : '', detail: i === 0 ? t('summary.saidByClient') : '', tool: x.label, helped: '—', worst: x.worst }));
  const history = [...state.checkins].reverse().slice(0, 30);
  const tries = state.trials.filter((x) => x.after);

  return (
    <article className="summary" lang={i18n.lang}>
      <header className="s-head">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span className="s-eyebrow">{t('summary.eyebrow')}</span>
          <h1>{data.name || t('summary.defaultTitle')}</h1>
        </div>
        <div className="s-muted" style={{ display: 'flex', flexDirection: 'column' }}>
          <span>{t('summary.shared', { date: date(Date.now(), { day: 'numeric', month: 'long', year: 'numeric' }) })}</span>
          <span>{t('summary.basedOn', { checkins: t('common.checkins', { n: m.checkins }), tries: t('common.tries', { n: m.tries }) })}</span>
        </div>
      </header>

      {o.helps && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <h2>{t('summary.helpsTitle')}</h2>
          {rows.length ? (
            <div className="s-table-wrap">
              <table>
                <thead><tr><th>{t('summary.thState')}</th><th>{t('summary.thTool')}</th><th>{t('summary.thHelped')}</th><th>{t('summary.thWorst')}</th></tr></thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i}>
                      <td>{r.state && <strong>{r.state}</strong>}{r.detail && <div className="s-muted">{r.detail}</div>}</td>
                      <td>{r.tool}</td><td>{r.helped}</td><td>{r.worst ? t('summary.yes') : ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <p className="s-muted">{t('summary.noTries')}</p>}
        </section>
      )}

      {(o.worst || o.names) && (
        <div className="s-grid">
          {o.worst && (
            <div className="s-box"><h2>{t('summary.worstTitle')}</h2><p>{m.worst.length ? m.worst.map((x) => x.label).join(' · ') : t('summary.noneMarked')}</p></div>
          )}
          {o.names && (
            <div className="s-box"><h2>{t('summary.namesTitle')}</h2>
              {m.ownNames.length ? m.ownNames.map((n) => <p key={n.id}>{i18n.quote(n.label)}{n.detail ? `: ${n.detail}` : ''}</p>) : <p>{t('summary.noneYet')}</p>}
            </div>
          )}
        </div>
      )}

      {o.watch && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <h2>{t('summary.watchTitle')}</h2>
          {m.watch.length ? m.watch.map((w) => (
            <p key={w.id}>{w.label} <span className="s-muted">({w.kind === 'avoid' ? t('summary.avoidLower') : t('summary.stuckLower')}{w.note ? `; ${t('summary.tippingLower', { note: w.note })}` : ''})</span></p>
          )) : <p className="s-muted">{t('summary.noneWatch')}</p>}
        </section>
      )}

      {o.history && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <h2>{t('summary.historyTitle', { n: history.length })}</h2>
          <div className="s-table-wrap">
            <table>
              <thead><tr><th>{t('summary.thDate')}</th><th>{t('summary.thCheckin')}</th><th>{t('summary.thTried')}</th><th>{t('summary.thAfter')}</th></tr></thead>
              <tbody>
                {history.map((c) => {
                  const x = tries.find((y) => y.checkinId === c.id);
                  return (
                    <tr key={c.id}>
                      <td>{date(c.t)}</td>
                      <td>{describeCheckin(c, i18n) || '—'}</td>
                      <td>{x ? itemLabel(state, x.itemId, i18n) : ''}</td>
                      <td>{x ? t(`vocab.compare.${x.after.compare}`) : ''}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {notShared.length > 0 && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <h2>{t('summary.notShared')}</h2>
          <p className="s-muted">{notShared.join(' · ')}</p>
        </section>
      )}
      <p className="s-foot">{t('summary.foot')}</p>
    </article>
  );
}

export function SummaryScreen({ nav, params }) {
  const { state } = useStore();
  const i18n = useI18n();
  const { t } = i18n;
  if (params.text) {
    return (
      <div className="screen">
        <TopBar onBack={nav.back} eyebrow={t('share.copyTitle')} />
        <div className="content">
          <p className="small">{t('share.copyHint')}</p>
          <textarea id="summary-text" className="input" readOnly rows={18} value={summaryText(state, params.data, i18n)} onFocus={(e) => e.target.select()} />
        </div>
      </div>
    );
  }
  return (
    <div className="screen">
      <TopBar onBack={nav.back} eyebrow={t('share.theySee')} />
      <div className="content"><SummaryBody data={params.data} /></div>
    </div>
  );
}

export function PrintSummary({ data }) {
  return <SummaryBody data={data} />;
}
