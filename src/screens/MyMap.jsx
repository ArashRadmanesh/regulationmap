import { useState } from 'react';
import { useStore } from '../lib/store.js';
import { buildMap } from '../lib/mapdata.js';
import { useI18n } from '../i18n.js';
import { BottomNav, Icon } from '../ui.jsx';

function Group({ title, sub, children }) {
  return (
    <section className="card stack-s" style={{ gap: 0 }}>
      <div className="stack-s" style={{ gap: 2, paddingBottom: 6 }}>
        <h2 className="h2">{title}</h2>
        {sub && <p className="small">{sub}</p>}
      </div>
      {children}
    </section>
  );
}

function ToolLine({ label, stat, worst, badge }) {
  const { t } = useI18n();
  return (
    <div className="list-row" style={{ borderTop: '1px solid var(--surface-2)' }}>
      <span className="opt-text" style={{ flex: 1 }}>
        <span className="opt-title" style={{ fontWeight: 600 }}>{label}</span>
        {stat && <span className="opt-sub">{stat}</span>}
      </span>
      {badge}
      {worst && <span className="badge">{t('common.atWorst')}</span>}
    </div>
  );
}

export default function MyMap({ nav }) {
  const { state } = useStore();
  const i18n = useI18n();
  const { t } = i18n;
  const [tab, setTab] = useState('state');
  const m = buildMap(state, i18n);
  const nothing = !m.helpfulCount && !m.tries;

  return (
    <div className="screen">
      <div className="content" style={{ paddingTop: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <h1 className="title-lg">{t('map.title')}</h1>
          <button type="button" className="btn" style={{ minHeight: 44, background: 'var(--accent-soft)', color: 'var(--accent-strong)', padding: '0 16px' }} onClick={() => nav.go('share')}>
            <Icon name="share" size={18} />{t('common.share')}
          </button>
        </div>

        {nothing ? (
          <div className="empty">
            <p>{t('map.empty')}</p>
            <button type="button" className="btn btn-primary" onClick={() => nav.go('toolbank')}>{t('map.buildList')}</button>
          </div>
        ) : (
          <>
            <div className="tabs" role="tablist" aria-label={t('map.view')}>
              {[['state', t('map.byState')], ['effect', t('map.byEffect')], ['watch', t('map.watch')]].map(([id, label]) => (
                <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => setTab(id)}>{label}</button>
              ))}
            </div>

            {tab === 'state' && (
              <>
                {m.worst.length > 0 && (
                  <Group title={t('map.worstTitle')} sub={t('map.worstSub')}>
                    {m.worst.map((x) => <ToolLine key={x.id} label={x.label} />)}
                  </Group>
                )}
                {m.learnedGroups.map((g) => (
                  <Group key={g.key} title={g.own ? i18n.quote(g.title) : g.title} sub={g.detail}>
                    {g.tools.map((x) => <ToolLine key={x.id} label={x.label} worst={x.worst} stat={t('common.helpedOf', { h: x.helped, n: x.tried })} />)}
                  </Group>
                ))}
                {m.said.map((g) => (
                  <Group key={g.id} title={g.title} sub={t('map.fromSaid')}>
                    {g.tools.map((x) => <ToolLine key={x.id} label={x.label} worst={x.worst} />)}
                  </Group>
                ))}
                {!m.learnedGroups.length && !m.said.length && (
                  <div className="note">
                    <Icon name="info" color="var(--accent)" />
                    <p>{t('map.hint')}</p>
                  </div>
                )}
              </>
            )}

            {tab === 'effect' && (
              m.byEffect.length ? m.byEffect.map((g) => (
                <Group key={g.id} title={g.title}>
                  {g.tools.map((x) => <ToolLine key={x.id} label={x.label} badge={x.learned ? <span className="badge">{t('map.noticed')}</span> : null} />)}
                </Group>
              )) : <p className="empty">{t('map.effectEmpty')}</p>
            )}

            {tab === 'watch' && (
              m.watch.length ? (
                <Group title={t('map.watchTitle')} sub={t('map.watchSub')}>
                  {m.watch.map((x) => (
                    <ToolLine key={x.id} label={x.label} stat={x.note ? t('map.tipping', { note: x.note }) : null}
                      badge={<span className="badge warm">{x.kind === 'avoid' ? t('common.oftenAvoidance') : t('common.canGetStuck')}</span>} />
                  ))}
                </Group>
              ) : <p className="empty">{t('map.watchEmpty')}</p>
            )}
          </>
        )}
      </div>
      <BottomNav current="map" go={nav.go} />
    </div>
  );
}
