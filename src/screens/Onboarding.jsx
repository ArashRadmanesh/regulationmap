import { useStore } from '../lib/store.js';
import { useI18n, languageList } from '../i18n.js';
import { Icon, TopBar } from '../ui.jsx';

export function LanguagePicker({ compact }) {
  const { state, update } = useStore();
  const { t } = useI18n();
  const langs = languageList();
  const set = (code) => update((s) => { s.settings.lang = code; });
  if (compact) {
    return (
      <label htmlFor="lang-top" className="sr-only-label" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        <span className="sr-only">{t('common.language')}</span>
        <select id="lang-top" className="input" style={{ width: 'auto', minHeight: 40, padding: '6px 10px' }} value={state.settings.lang} onChange={(e) => set(e.target.value)}>
          {langs.map((l) => <option key={l.code} value={l.code} lang={l.code}>{l.name}</option>)}
        </select>
      </label>
    );
  }
  return (
    <div className="card" style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 12, padding: '8px 8px 8px 16px' }}>
      <span id="lang-label" style={{ flex: 1, fontWeight: 650 }}>{t('common.language')}</span>
      <div role="radiogroup" aria-labelledby="lang-label" className="tabs" style={{ gridTemplateColumns: `repeat(${langs.length}, auto)` }}>
        {langs.map((l) => (
          <button key={l.code} type="button" role="radio" lang={l.code} aria-checked={state.settings.lang === l.code}
            aria-selected={state.settings.lang === l.code} onClick={() => set(l.code)} style={{ padding: '0 14px' }}>{l.name}</button>
        ))}
      </div>
    </div>
  );
}

export function Welcome({ nav }) {
  const { t } = useI18n();
  const points = [1, 2, 3].map((i) => [t(`welcome.p${i}title`), t(`welcome.p${i}text`)]);
  return (
    <div className="screen">
      <div className="topbar" style={{ justifyContent: 'flex-end' }}><LanguagePicker compact /></div>
      <div className="content" style={{ paddingTop: 16, gap: 22 }}>
        <div style={{ width: 64, height: 64, borderRadius: 20, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="map" size={34} color="var(--accent-ink)" />
        </div>
        <div className="stack">
          <h1 className="title-lg">{t('welcome.title')}</h1>
          <p className="lede">{t('welcome.lede')}</p>
        </div>
        <ul className="stack" style={{ listStyle: 'none', padding: 0, margin: 0, gap: 14 }}>
          {points.map(([title, text], i) => (
            <li key={i} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <span className="num" aria-hidden="true" style={{ borderRadius: 12 }}>{i + 1}</span>
              <span className="opt-text"><span className="opt-title">{title}</span><span className="opt-sub">{text}</span></span>
            </li>
          ))}
        </ul>
      </div>
      <div className="footer">
        <button type="button" className="btn btn-primary" onClick={() => nav.go('setup')}>{t('welcome.start')}</button>
        <button type="button" className="btn btn-text" onClick={() => nav.go('restore', { fromWelcome: true })}>{t('welcome.haveBackup')}</button>
      </div>
    </div>
  );
}

const OPTS = ['alexithymia', 'fewer', 'remindAfter', 'largeText', 'reduceMotion'];

export function SettingsList({ compact }) {
  const { state, update } = useStore();
  const { t } = useI18n();
  return (
    <div className={compact ? 'card tight' : 'stack-s'}>
      {OPTS.map((key) => (
        <label key={key} htmlFor={`set-${key}`} className={compact ? 'toggle-row' : `option${state.settings[key] ? ' is-on' : ''}`}
          style={compact ? undefined : { cursor: 'pointer' }}>
          <span className="opt-text" style={{ flex: 1 }}><span className="opt-title">{t(`settings.${key}`)}</span><span className="opt-sub">{t(`settings.${key}Sub`)}</span></span>
          <input id={`set-${key}`} type="checkbox" checked={!!state.settings[key]}
            onChange={(e) => update((s) => { s.settings[key] = e.target.checked; })}
            style={{ width: 24, height: 24, accentColor: 'var(--accent)', margin: 0, flex: 'none' }} />
        </label>
      ))}
    </div>
  );
}

export function Setup({ nav }) {
  const { t } = useI18n();
  return (
    <div className="screen">
      <TopBar onBack={nav.back} />
      <div className="content">
        <div className="stack-s">
          <h1 className="title">{t('setup.title')}</h1>
          <p className="lede">{t('setup.lede')}</p>
        </div>
        <LanguagePicker />
        <SettingsList />
      </div>
      <div className="footer">
        <button type="button" className="btn btn-primary" onClick={() => nav.go('ready')}>{t('common.continue')}</button>
      </div>
    </div>
  );
}

export function Ready({ nav }) {
  const { update } = useStore();
  const { t } = useI18n();
  const start = (name) => {
    update((s) => { s.onboarded = true; });
    nav.reset('home');
    if (name !== 'home') nav.go(name);
  };
  const doors = [
    ['toolbank', t('ready.listTitle'), t('ready.listSub'), true],
    ['checkin', t('ready.nowTitle'), t('ready.nowSub')],
    ['home', t('ready.lookTitle'), t('ready.lookSub')],
  ];
  return (
    <div className="screen">
      <TopBar onBack={nav.back} />
      <div className="content">
        <div className="stack-s">
          <h1 className="title">{t('ready.title')}</h1>
          <p className="lede">{t('ready.lede')}</p>
        </div>
        <div className="stack">
          {doors.map(([id, title, sub, sug]) => (
            <button key={id} type="button" className={`option${sug ? ' is-on' : ''}`} onClick={() => start(id)} style={{ minHeight: 88 }}>
              <span className="opt-text">
                <span style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span className="opt-title" style={{ fontSize: '1.06em' }}>{title}</span>
                  {sug && <span className="badge">{t('ready.suggested')}</span>}
                </span>
                <span className="opt-sub">{sub}</span>
              </span>
            </button>
          ))}
        </div>
        <div className="note">
          <Icon name="shield" color="var(--accent)" />
          <p>{t('ready.therapist')}</p>
        </div>
      </div>
    </div>
  );
}
