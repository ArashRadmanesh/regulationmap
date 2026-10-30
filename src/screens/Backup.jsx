import { useState } from 'react';
import { useStore } from '../lib/store.js';
import { makeBackup, openBackup, readHeader, summarise, mergeStates, saveFile, backupFileName } from '../lib/backup.js';
import { useI18n } from '../i18n.js';
import { Icon, TopBar, ago } from '../ui.jsx';

// Error codes from lib/backup.js -> text in the current language.
const errText = (t, e) => (/^err\w+$/.test(e?.message || '') ? t(`backup.${e.message}`) : String(e?.message || e));

export function Backup({ nav }) {
  const { state, update } = useStore();
  const { t } = useI18n();
  const [protect, setProtect] = useState(true);
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [copyText, setCopyText] = useState('');
  const since = state.checkins.filter((c) => !state.lastBackup || c.t > state.lastBackup).length;
  const pwProblem = protect && (pw.length < 6 ? t('backup.errShort') : pw !== pw2 ? t('backup.errMatch') : '');

  const build = async () => {
    setError('');
    if (pwProblem) { setError(pwProblem); return null; }
    setBusy(true);
    try {
      return await makeBackup(state, protect ? pw : null);
    } catch (e) {
      setError(errText(t, e));
      return null;
    } finally {
      setBusy(false);
    }
  };
  const done = () => update((s) => { s.lastBackup = Date.now(); });

  const saveIt = async () => {
    const text = await build();
    if (!text) return;
    const how = await saveFile(text, backupFileName());
    if (how === 'shared' || how === 'downloaded') {
      done();
      nav.toast(how === 'shared' ? t('backup.saved') : t('backup.downloaded'));
    } else if (how === 'failed') {
      setError(t('backup.errSave'));
    }
  };
  const copyIt = async () => {
    const text = await build();
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      done();
      nav.toast(t('backup.copied'));
    } catch {
      setCopyText(text);
      done();
    }
  };

  return (
    <div className="screen">
      <TopBar onBack={nav.back} />
      <div className="content">
        <div className="stack-s">
          <h1 className="title">{t('backup.title')}</h1>
          <p className="lede">{t('backup.lede')}</p>
        </div>
        <div className="note warm">
          <Icon name="clock" color="var(--warm)" />
          <span className="opt-text"><span className="opt-title">{t('backup.last', { when: ago(state.lastBackup, t) })}</span>
            <span className="opt-sub">{state.lastBackup ? t('backup.since', { n: since }) : t('backup.none')}</span></span>
        </div>
        <div className="card stack">
          <label className="toggle-row" htmlFor="bk-protect" style={{ borderTop: 0, padding: 0 }}>
            <span className="opt-text" style={{ flex: 1 }}><span className="opt-title">{t('backup.protect')}</span><span className="opt-sub">{t('backup.protectSub')}</span></span>
            <input id="bk-protect" type="checkbox" checked={protect} onChange={(e) => setProtect(e.target.checked)} />
          </label>
          {protect && (
            <>
              <label className="field" htmlFor="bk-pw">{t('backup.pw')}
                <input id="bk-pw" className="input" type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} />
              </label>
              <label className="field" htmlFor="bk-pw2">{t('backup.pw2')}
                <input id="bk-pw2" className="input" type="password" autoComplete="new-password" value={pw2} onChange={(e) => setPw2(e.target.value)} />
              </label>
              <p className="small" style={{ color: 'var(--warm)' }}>{t('backup.pwWarn')}</p>
            </>
          )}
        </div>
        <div className="card tight">
          <label className="toggle-row" htmlFor="bk-remind" style={{ borderTop: 0 }}>
            <span style={{ flex: 1, fontWeight: 650 }}>{t('backup.remind')}</span>
            <select id="bk-remind" className="input" style={{ width: 'auto' }} value={state.settings.backupReminder}
              onChange={(e) => update((s) => { s.settings.backupReminder = e.target.value; })}>
              <option value="never">{t('backup.never')}</option>
              <option value="weekly">{t('backup.weekly')}</option>
              <option value="monthly">{t('backup.monthly')}</option>
            </select>
          </label>
        </div>
        {error && <p role="alert" className="note warm">{error}</p>}
        {copyText && (
          <label className="field" htmlFor="bk-text">{t('backup.copyLabel')}
            <textarea id="bk-text" className="input" rows={6} readOnly value={copyText} onFocus={(e) => e.target.select()} />
          </label>
        )}
      </div>
      <div className="footer">
        <button type="button" className="btn btn-primary" disabled={busy} onClick={saveIt}>{busy ? t('backup.preparing') : t('backup.save')}</button>
        <p className="small" style={{ textAlign: 'center' }}>{t('backup.saveHint')}</p>
        <div className="grid-2">
          <button type="button" className="btn btn-outline" disabled={busy} onClick={copyIt}>{t('backup.copy')}</button>
          <button type="button" className="btn btn-outline" onClick={() => nav.go('restore')}>{t('backup.restore')}</button>
        </div>
      </div>
    </div>
  );
}

export function Restore({ nav, params }) {
  const { state, replaceAll } = useStore();
  const { t, date } = useI18n();
  const [text, setText] = useState('');
  const [fileName, setFileName] = useState('');
  const [header, setHeader] = useState(null);
  const [pw, setPw] = useState('');
  const [mode, setMode] = useState('merge');
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');
  const [confirm, setConfirm] = useState(false);
  const [paste, setPaste] = useState(false);
  const hasData = state.checkins.length > 0 || Object.keys(state.items).length > 0;

  const accept = (txt, name) => {
    setError(''); setPreview(null); setConfirm(false);
    try {
      const h = readHeader(txt);
      setText(txt); setFileName(name); setHeader(h);
      if (!h.encrypted) setPreview(summarise(h.data));
    } catch (e) {
      setHeader(null); setError(errText(t, e));
    }
  };
  const onFile = async (e) => {
    const f = e.target.files?.[0];
    if (f) accept(await f.text(), f.name);
  };
  const unlock = async () => {
    setError('');
    try {
      setPreview(summarise(await openBackup(text, pw)));
    } catch (e) {
      setError(errText(t, e));
    }
  };
  const restore = async () => {
    if (mode === 'replace' && hasData && !confirm) { setConfirm(true); return; }
    try {
      const data = await openBackup(text, pw);
      // Keep the language chosen on this phone.
      const lang = state.settings.lang;
      const next = mode === 'merge' && hasData ? mergeStates(state, data) : { ...data, onboarded: true };
      replaceAll({ ...next, settings: { ...next.settings, lang } });
      nav.toast(t('restore.done'));
      nav.reset('home');
    } catch (e) {
      setError(errText(t, e));
    }
  };

  return (
    <div className="screen">
      <TopBar onBack={nav.back} />
      <div className="content">
        <h1 className="title">{t('restore.title')}</h1>
        <label className="card" htmlFor="rs-file" style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', padding: '12px 16px' }}>
          <Icon name="file" color="var(--accent)" />
          <span className="opt-text" style={{ flex: 1 }}>
            <span className="opt-title" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fileName || t('restore.choose')}</span>
            <span className="opt-sub">{header ? t('restore.made', { date: date(new Date(header.createdAt).getTime(), { day: 'numeric', month: 'short', year: 'numeric' }) }) : t('restore.chooseSub')}</span>
          </span>
          <span className="btn-text" aria-hidden="true">{fileName ? t('common.change') : t('restore.chooseBtn')}</span>
          <input id="rs-file" type="file" accept=".rmap,.json,application/json,text/plain" className="sr-only" onChange={onFile} />
        </label>
        {!paste ? (
          <button type="button" className="btn-text" style={{ alignSelf: 'flex-start' }} onClick={() => setPaste(true)}>{t('restore.pasteInstead')}</button>
        ) : (
          <label className="field" htmlFor="rs-paste">{t('restore.pasteLabel')}
            <textarea id="rs-paste" className="input" rows={4} onChange={(e) => e.target.value.trim() && accept(e.target.value.trim(), t('restore.pasted'))} />
          </label>
        )}

        {header?.encrypted && !preview && (
          <div className="card stack">
            <label className="field" htmlFor="rs-pw">{t('backup.pw')}
              <input id="rs-pw" className="input" type="password" autoComplete="current-password" value={pw} onChange={(e) => setPw(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') unlock(); }} />
            </label>
            <button type="button" className="btn btn-outline" onClick={unlock} disabled={!pw}>{t('restore.open')}</button>
          </div>
        )}

        {preview && (
          <>
            <div className="card stack-s" style={{ gap: 2 }}>
              <span className="small">{t('restore.contains')}</span>
              <span className="opt-title">{[t('common.tools', { n: preview.tools }), t('common.checkins', { n: preview.checkins }), t('common.names', { n: preview.names })].join(' · ')}</span>
            </div>
            {hasData && (
              <div role="radiogroup" aria-label={t('restore.how')} className="stack-s" style={{ gap: 8 }}>
                {['merge', 'replace'].map((id) => (
                  <button key={id} type="button" role="radio" aria-checked={mode === id} className={`option${id === 'replace' ? ' warm' : ''}`} onClick={() => { setMode(id); setConfirm(false); }}>
                    <span className="dot" /><span className="opt-text"><span className="opt-title">{t(`restore.${id}`)}</span><span className="opt-sub">{t(`restore.${id}Sub`)}</span></span>
                  </button>
                ))}
              </div>
            )}
            {confirm && <p className="note warm" role="alert">{t('restore.confirm')}</p>}
          </>
        )}
        {error && <p role="alert" className="note warm">{error}</p>}
      </div>
      <div className="footer">
        <button type="button" className={`btn ${confirm ? 'btn-danger' : 'btn-primary'}`} disabled={!preview} onClick={restore}>
          {confirm ? t('restore.replaceBtn') : t('restore.restoreBtn')}
        </button>
        {params.fromWelcome && <button type="button" className="btn btn-quiet" onClick={nav.back}>{t('restore.fresh')}</button>}
      </div>
    </div>
  );
}
