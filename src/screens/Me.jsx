import { useState } from 'react';
import { useStore, emptyState } from '../lib/store.js';
import { useI18n } from '../i18n.js';
import { BottomNav, Icon, ago } from '../ui.jsx';
import { SettingsList, LanguagePicker } from './Onboarding.jsx';

export default function Me({ nav }) {
  const { state, replaceAll } = useStore();
  const { t } = useI18n();
  const [confirm, setConfirm] = useState(false);
  const standalone = typeof window !== 'undefined' && (window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone);

  const link = (to, icon, title, sub) => (
    <button type="button" className="nav-card" onClick={() => nav.go(to)}>
      <Icon name={icon} color="var(--accent)" />
      <span className="opt-text" style={{ flex: 1 }}><span className="opt-title">{title}</span><span className="opt-sub">{sub}</span></span>
      <Icon name="next" />
    </button>
  );

  return (
    <div className="screen">
      <div className="content" style={{ paddingTop: 24 }}>
        <h1 className="title-lg">{t('me.title')}</h1>

        <section className="stack-s" style={{ gap: 8 }}>
          <h2 className="h2">{t('me.data')}</h2>
          {link('backup', 'shield', t('me.backup'), t('home.lastBackup', { when: ago(state.lastBackup, t) }))}
          {link('restore', 'file', t('me.restore'), t('me.restoreSub'))}
          {link('share', 'share', t('me.share'), t('me.shareSub'))}
          {!standalone && (
            <div className="note">
              <Icon name="info" color="var(--accent)" />
              <p>{t('me.homeScreen')}</p>
            </div>
          )}
        </section>

        <section className="stack-s" style={{ gap: 8 }}>
          <h2 className="h2">{t('me.settings')}</h2>
          <LanguagePicker />
          <SettingsList compact />
        </section>

        <section className="card stack-s">
          <h2 className="h2">{t('me.help')}</h2>
          <p>{t('me.emergency', { num: '112' })}</p>
          <p>{t('me.helpline', { num: '1717' })}</p>
          <p className="small">{t('me.disclaimer')}</p>
        </section>

        <section className="stack-s" style={{ gap: 8 }}>
          {!confirm ? (
            <button type="button" className="btn btn-quiet" style={{ color: 'var(--warm)' }} onClick={() => setConfirm(true)}>{t('me.delete')}</button>
          ) : (
            <div className="note warm" role="alert" style={{ flexDirection: 'column' }}>
              <p><strong>{t('me.deleteQ')}</strong> {t('me.deleteText')}</p>
              <div className="grid-2" style={{ width: '100%' }}>
                <button type="button" className="btn btn-outline" onClick={() => setConfirm(false)}>{t('me.keep')}</button>
                <button type="button" className="btn btn-danger" onClick={() => { const lang = state.settings.lang; const s = emptyState(); s.settings.lang = lang; replaceAll(s); nav.reset('welcome'); }}>{t('me.deleteBtn')}</button>
              </div>
            </div>
          )}
        </section>
      </div>
      <BottomNav current="me" go={nav.go} />
    </div>
  );
}
