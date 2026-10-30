import { useStore, helpfulIds, itemLabel } from '../lib/store.js';
import { useI18n } from '../i18n.js';
import { BottomNav, Icon, ago } from '../ui.jsx';

export const STAGES = [
  { id: 1, key: 'toolbank' },
  { id: 2, key: 'access' },
  { id: 3, key: 'effect' },
  { id: 4, key: 'states' },
  { id: 5, key: 'nourish' },
];

export function isAnswered(r, key) {
  if (r.skip?.[key]) return true;
  if (key === 'access') return r.access && Object.keys(r.access).length > 0;
  if (key === 'effect') return (r.effects || []).length > 0;
  if (key === 'states') return (r.states || []).length > 0;
  if (key === 'nourish') return !!r.nourish;
  return false;
}

const BACKUP_DAYS = { weekly: 7, monthly: 30 };

export default function Home({ nav }) {
  const { state } = useStore();
  const i18n = useI18n();
  const { t } = i18n;
  const helpful = helpfulIds(state);
  const marked = Object.values(state.items).filter((r) => r.status === 'yes' || r.status === 'no').length;
  const no = marked - helpful.length;

  const openTrial = state.settings.remindAfter
    ? [...state.trials].reverse().find((x) => !x.after && Date.now() - x.t < 48 * 3600 * 1000)
    : null;

  const every = BACKUP_DAYS[state.settings.backupReminder];
  const since = state.lastBackup || state.createdAt;
  const backupDue = every && state.checkins.length + helpful.length > 3 && Date.now() - since > every * 86400000;

  const hour = new Date().getHours();
  const greet = t(hour < 5 ? 'home.hello' : hour < 12 ? 'home.morning' : hour < 18 ? 'home.afternoon' : 'home.evening');

  return (
    <div className="screen">
      <div className="content" style={{ paddingTop: 28 }}>
        <div className="stack-s" style={{ gap: 2 }}>
          <p className="small">{greet}</p>
          <h1 className="title-lg">{t('home.title')}</h1>
        </div>

        {openTrial && (
          <button type="button" className="option is-on" onClick={() => nav.go('after', { trialId: openTrial.id })}>
            <Icon name="clock" color="var(--accent)" />
            <span className="opt-text" style={{ flex: 1 }}>
              <span className="opt-title">{t('home.didHelp', { item: itemLabel(state, openTrial.itemId, i18n) })}</span>
              <span className="opt-sub">{t('home.didHelpSub')}</span>
            </span>
            <Icon name="next" />
          </button>
        )}

        <button type="button" className="hero-btn" onClick={() => nav.go('checkin')}>
          <span className="stack-s" style={{ gap: 4 }}>
            <span style={{ fontSize: '1.2em', fontWeight: 650 }}>{t('home.heroTitle')}</span>
            <span className="sub">{t('home.heroSub')}</span>
          </span>
          <Icon name="next" size={28} />
        </button>

        {backupDue && (
          <button type="button" className="note warm" style={{ border: 0, textAlign: 'left', color: 'var(--fg)' }} onClick={() => nav.go('backup')}>
            <Icon name="clock" color="var(--warm)" />
            <span className="opt-text"><span className="opt-title">{t('home.backupDue')}</span><span className="opt-sub">{t('home.lastBackup', { when: ago(state.lastBackup, t) })}</span></span>
          </button>
        )}

        <div className="stack-s">
          <h2 className="h2">{t('home.buildTitle')}</h2>
          <p className="small">{t('home.buildSub')}</p>
        </div>
        <div className="stack-s" style={{ gap: 8 }}>
          {STAGES.map((st) => {
            let sub;
            let done = false;
            if (st.id === 1) {
              sub = marked ? t('home.stage1Sub', { yes: helpful.length, no }) : t('home.startHere');
              done = helpful.length > 0;
            } else {
              const n = helpful.filter((id) => isAnswered(state.items[id], st.key)).length;
              sub = helpful.length ? t('home.nOfM', { n, m: helpful.length }) : t('home.afterStep1');
              if (st.id === 4 && !n && helpful.length) sub = t('home.easierLater');
              done = helpful.length > 0 && n === helpful.length;
            }
            const disabled = st.id > 1 && !helpful.length;
            return (
              <button key={st.id} type="button" className="nav-card" disabled={disabled} style={disabled ? { opacity: 0.6 } : undefined}
                onClick={() => (st.id === 1 ? nav.go('toolbank') : nav.go('stage', { key: st.key }))}>
                <span className={`num${done ? ' done' : ''}`}>{done ? <Icon name="check" size={18} /> : st.id}</span>
                <span className="opt-text" style={{ flex: 1 }}><span className="opt-title">{t(`home.stage${st.id}`)}</span><span className="opt-sub">{sub}</span></span>
              </button>
            );
          })}
        </div>
        {state.checkins.length > 0 && (
          <p className="small">{t('home.stats', { checkins: t('common.checkins', { n: state.checkins.length }), tried: t('common.things', { n: state.trials.filter((x) => x.after).length }) })}</p>
        )}
      </div>
      <BottomNav current="home" go={nav.go} />
    </div>
  );
}
