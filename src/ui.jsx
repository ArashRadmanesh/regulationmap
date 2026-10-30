import { useEffect } from 'react';
import { useI18n } from './i18n.js';

const P = {
  back: <path d="M15 18l-6-6 6-6" />,
  next: <path d="M5 12h14M13 6l6 6-6 6" />,
  check: <path d="M5 12l5 5L20 7" />,
  x: <path d="M6 6l12 12M18 6L6 18" />,
  plus: <path d="M12 5v14M5 12h14" />,
  search: <><circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4" /></>,
  home: <path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />,
  list: <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />,
  map: <><path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2z" /><path d="M9 4v14M15 6v14" /></>,
  me: <><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></>,
  share: <path d="M12 3v12M7 8l5-5 5 5M5 14v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5" />,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 8h.01M11 12h1v4h1" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  shield: <path d="M12 3l7 4v5c0 4.5-3 8-7 9-4-1-7-4.5-7-9V7z" />,
  file: <><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5" /></>,
  heart: <path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10z" />,
};

export function Icon({ name, size = 22, stroke = 2, color = 'currentColor', style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke}
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={style}>
      {P[name]}
    </svg>
  );
}

export function TopBar({ onBack, eyebrow, right }) {
  const { t } = useI18n();
  return (
    <div className="topbar">
      {onBack ? (
        <button type="button" className="icon-btn" aria-label={t('common.back')} onClick={onBack}><Icon name="back" /></button>
      ) : <span className="spacer" />}
      <span className="eyebrow">{eyebrow}</span>
      {right || <span className="spacer" />}
    </div>
  );
}

export function Progress({ value }) {
  return <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(value)}><span style={{ width: `${value}%` }} /></div>;
}

// A row of single-choice buttons.
export function Radio({ options, value, onChange, className = 'choice', label, cols, noId }) {
  return (
    <div role="radiogroup" aria-label={label} className={cols ? undefined : 'row-wrap'}
      style={cols ? { display: 'grid', gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gap: 6 } : undefined}>
      {options.map((o) => (
        <button key={o.id} type="button" role="radio" aria-checked={value === o.id}
          className={`${className}${noId && o.id === noId ? ' no' : ''}`}
          onClick={() => onChange(value === o.id ? null : o.id)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

// Multi-select chips.
export function Chips({ options, values = [], onChange, className = 'chip' }) {
  const set = new Set(values);
  return (
    <div className="row-wrap">
      {options.map((o) => {
        const id = typeof o === 'string' ? o : o.id;
        const lab = typeof o === 'string' ? o : o.label;
        const on = set.has(id);
        return (
          <button key={id} type="button" aria-pressed={on} className={className}
            onClick={() => onChange(on ? values.filter((v) => v !== id) : [...values, id])}>
            {lab}
          </button>
        );
      })}
    </div>
  );
}

export function Toast({ text, onDone }) {
  useEffect(() => {
    if (!text) return undefined;
    const t = setTimeout(onDone, 2600);
    return () => clearTimeout(t);
  }, [text, onDone]);
  if (!text) return null;
  return <div className="toast" role="status">{text}</div>;
}

export function BottomNav({ current, go }) {
  const { t } = useI18n();
  const items = [
    ['home', t('nav.home'), 'home'],
    ['toolbank', t('nav.list'), 'list'],
    ['map', t('nav.map'), 'map'],
    ['me', t('nav.me'), 'me'],
  ];
  return (
    <nav className="bottom-nav" aria-label={t('nav.main')}>
      {items.map(([id, label, icon]) => (
        <button key={id} type="button" aria-current={current === id ? 'page' : undefined} onClick={() => go(id)}>
          <Icon name={icon} />{label}
        </button>
      ))}
    </nav>
  );
}

// "today", "yesterday", "3 days ago", "never" in the current language.
export function ago(ts, t) {
  if (!ts) return t('common.never');
  const d = Math.floor((Date.now() - ts) / 86400000);
  if (d <= 0) return t('common.today');
  if (d === 1) return t('common.yesterday');
  return t('common.daysAgo', { n: d });
}
