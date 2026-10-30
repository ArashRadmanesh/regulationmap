import { useCallback, useEffect, useMemo, useState } from 'react';
import { StoreProvider, useCreateStore } from './lib/store.js';
import { I18nProvider, makeI18n } from './i18n.js';
import { Toast } from './ui.jsx';
import { Welcome, Setup, Ready } from './screens/Onboarding.jsx';
import Home from './screens/Home.jsx';
import Toolbank from './screens/Toolbank.jsx';
import StageFlow from './screens/StageFlow.jsx';
import CheckIn from './screens/CheckIn.jsx';
import NeedNow from './screens/NeedNow.jsx';
import AfterCheck from './screens/AfterCheck.jsx';
import MyMap from './screens/MyMap.jsx';
import { Share, SummaryScreen, PrintSummary } from './screens/Share.jsx';
import { Backup, Restore } from './screens/Backup.jsx';
import Me from './screens/Me.jsx';

const SCREENS = {
  welcome: Welcome, setup: Setup, ready: Ready,
  home: Home, toolbank: Toolbank, stage: StageFlow,
  checkin: CheckIn, neednow: NeedNow, after: AfterCheck,
  map: MyMap, share: Share, summary: SummaryScreen,
  backup: Backup, restore: Restore, me: Me,
};
const TABS = new Set(['home', 'toolbank', 'map', 'me']);
let seq = 0;

export default function App() {
  const store = useCreateStore();
  const { state } = store;
  const [stack, setStack] = useState(() => [{ name: state.onboarded ? 'home' : 'welcome', params: {}, k: 0 }]);
  const [toast, setToast] = useState('');
  const [printData, setPrintData] = useState(null);
  const clearToast = useCallback(() => setToast(''), []);

  const go = useCallback((name, params = {}) => {
    const e = { name, params, k: ++seq };
    setStack((s) => (TABS.has(name) ? [e] : [...s, e]));
  }, []);
  const back = useCallback(() => setStack((s) => (s.length > 1 ? s.slice(0, -1) : [{ name: 'home', params: {}, k: ++seq }])), []);
  const replace = useCallback((name, params = {}) => setStack((s) => [...s.slice(0, -1), { name, params, k: ++seq }]), []);
  const reset = useCallback((name = 'home', params = {}) => setStack([{ name, params, k: ++seq }]), []);

  const i18n = useMemo(() => makeI18n(state.settings.lang), [state.settings.lang]);
  useEffect(() => { document.documentElement.lang = i18n.lang; }, [i18n.lang]);

  useEffect(() => {
    const el = document.documentElement;
    el.classList.toggle('large-text', !!state.settings.largeText);
    el.classList.toggle('reduce-motion', !!state.settings.reduceMotion);
  }, [state.settings.largeText, state.settings.reduceMotion]);

  const top = stack[stack.length - 1];
  const Screen = SCREENS[top.name] || Home;
  const nav = useMemo(() => ({ go, back, replace, reset, toast: setToast, setPrintData, current: top.name }), [go, back, replace, reset, top.name]);

  return (
    <StoreProvider value={store}>
      <I18nProvider value={i18n}>
      <div className="app">
        {!store.storageOk && (
          <div className="note warm" role="alert" style={{ borderRadius: 0 }}>
            {i18n.t('common.storageWarning')}
          </div>
        )}
        <Screen key={top.k} nav={nav} params={top.params} />
        <Toast text={toast} onDone={clearToast} />
      </div>
      <div className="print-only">{printData && <PrintSummary data={printData} />}</div>
      </I18nProvider>
    </StoreProvider>
  );
}
