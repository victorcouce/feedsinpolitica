import { useEffect, useState } from 'react';
import { DEFAULTS, KEY, TOTAL_KEY, getSettings, getTotal, parseSettings, saveSettings } from '../../src/storage/settings';
import { activate, deactivate, expire, isActive } from '../../src/features/sessions/session';
import { PLATFORM_INFO, PLATFORM_KEYS, platformOf, type Platform } from '../../src/platforms/registry';
import type { FilterMode, SessionType, Settings, StatsResponse } from '../../src/types';

const DURATIONS: { value: SessionType; label: string; aria: string; help: string }[] = [
  { value: '30m', label: '30 min', aria: '30 minutos', help: 'Se desactivará solo dentro de 30 minutos.' },
  { value: '2h', label: '2 h', aria: '2 horas', help: 'Se desactivará solo dentro de 2 horas.' },
  { value: '8h', label: '8 h', aria: '8 horas', help: 'Se desactivará solo dentro de 8 horas.' },
  { value: 'manual', label: 'Sin límite', aria: 'Hasta que lo desactive', help: 'Seguirá activo hasta que lo apagues.' },
];

const MODES: { value: FilterMode; label: string; help: string }[] = [
  { value: 'soft', label: 'Suave', help: 'Sólo contenido claramente electoral o partidista.' },
  { value: 'broad', label: 'Amplio', help: 'Incluye política institucional. Puede ocultar algo ambiguo.' },
];

function remaining(endsAt: number | null, now: number): { big: string; label: string } {
  if (endsAt === null) return { big: '∞', label: 'sin límite de tiempo' };
  const min = Math.max(0, Math.ceil((endsAt - now) / 60_000));
  if (min < 60) return { big: `${min} min`, label: 'quedan' };
  return { big: `${Math.floor(min / 60)}:${String(min % 60).padStart(2, '0')}`, label: 'horas restantes' };
}

/** Grito silenciado: bocadillo con pinchos tapado con cinta. Los colores salen de las variables CSS del tema. */
function Logo({ size, off }: { size: number; off?: boolean }) {
  return (
    <svg className={off ? 'off' : ''} width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <path className="mark-burst" strokeLinejoin="round" d="M32.0 4.0 37.8 14.0 48.7 10.1 46.7 21.5 57.6 25.5 48.7 33.0 54.5 43.0 42.9 43.0 40.9 54.4 32.0 47.0 16.0 61.0 21.1 43.0 9.5 43.0 15.3 33.0 6.4 25.5 17.3 21.5 15.3 10.1 26.2 14.0Z" />
      <path className="mark-tape" strokeWidth="2.4" strokeLinejoin="round" paintOrder="stroke" d="M3.5 30.5 58.5 20.8 60.5 32 5.5 41.7Z" />
    </svg>
  );
}

function Switch({ checked, labelId, small, disabled, onClick }: {
  checked: boolean;
  labelId: string;
  small?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-labelledby={labelId}
      className={`switch ${small ? 'small' : ''} ${checked ? 'on' : ''}`}
      disabled={disabled}
      onClick={onClick}
    >
      <span />
    </button>
  );
}

function Segmented<T extends string>({ items, value, onPick }: {
  items: { value: T; label: string; aria?: string }[];
  value: T;
  onPick: (v: T) => void;
}) {
  return (
    <div className="segmented" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
      {items.map((i) => (
        <button key={i.value} aria-pressed={value === i.value} aria-label={i.aria} onClick={() => onPick(i.value)}>
          {i.label}
        </button>
      ))}
    </div>
  );
}

export function App() {
  const [s, setS] = useState<Settings>(DEFAULTS);
  const [loaded, setLoaded] = useState(false);
  const [site, setSite] = useState<Platform | null>(null);
  const [hasTab, setHasTab] = useState(false);
  const [hidden, setHidden] = useState(0);
  const [total, setTotal] = useState(0);
  const [now, setNow] = useState(Date.now());
  const [view, setView] = useState<'main' | 'networks'>('main');
  const [privacyOpen, setPrivacyOpen] = useState(false);

  useEffect(() => {
    getSettings().then((v) => {
      const e = expire(v);
      if (e !== v) saveSettings(e);
      setS(e);
      setLoaded(true);
    });
    const listener = (c: Record<string, chrome.storage.StorageChange>, area: string) => {
      if (area === 'local' && c[KEY]) setS(parseSettings(c[KEY].newValue));
    };
    getTotal().then(setTotal);
    chrome.storage.onChanged.addListener(listener);
    const tick = setInterval(() => setNow(Date.now()), 15_000);
    return () => {
      chrome.storage.onChanged.removeListener(listener);
      clearInterval(tick);
    };
  }, []);

  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }).then(([tab]) => {
      if (!tab) return;
      const p = platformOf(tab.url);
      setHasTab(true);
      setSite(p);
      if (p && tab.id !== undefined) {
        chrome.tabs
          .sendMessage(tab.id, { type: 'modopaz:stats' })
          .then((r: StatsResponse) => setHidden(r?.hidden ?? 0))
          .catch(() => setHidden(0));
      }
    });
  }, [s.enabled, s.filterMode, s.platforms]);

  const update = (next: Settings) => {
    setS(next);
    saveSettings(next);
  };

  const active = isActive(s, now);
  const unsupported = hasTab && site === null;
  const siteOff = site !== null && !s.platforms[site];
  const filtering = active && site !== null && !siteOff;
  const enabledCount = PLATFORM_KEYS.filter((k) => s.platforms[k]).length;

  if (view === 'networks') {
    return (
      <main className="networks">
        <header>
          <button className="back" aria-label="Volver a ajustes" onClick={() => setView('main')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M19 12H5M11 6l-6 6 6 6" />
            </svg>
          </button>
          <h1>Redes</h1>
          <span className="count">{enabledCount} de {PLATFORM_KEYS.length}</span>
        </header>

        <ul>
          {PLATFORM_KEYS.map((k) => {
            const info = PLATFORM_INFO[k];
            return (
              <li key={k}>
                <span className="initial" aria-hidden="true">{info.name.charAt(0)}</span>
                <span className="net-text">
                  <span className="net-name">
                    <span id={`net-${k}`}>{info.name}</span>
                    {info.beta && <span className="beta">Beta</span>}
                  </span>
                  <span className="domains">{info.domains}</span>
                </span>
                <Switch
                  small
                  checked={s.platforms[k]}
                  labelId={`net-${k}`}
                  onClick={() => update({ ...s, platforms: { ...s.platforms, [k]: !s.platforms[k] } })}
                />
              </li>
            );
          })}
        </ul>

        <p className="help">
          Beta: funciona, pero esa red cambia a menudo y puede dejar pasar alguna publicación.
        </p>
      </main>
    );
  }

  let siteLine = site ? `Filtrando en ${PLATFORM_INFO[site].name}` : 'Se aplicará en las redes activas';
  if (!active) siteLine = 'Las publicaciones se muestran todas';
  else if (unsupported) siteLine = 'Listo para las redes activas';
  else if (siteOff && site) siteLine = `${PLATFORM_INFO[site].name} está desactivada en Redes`;

  const mode = MODES.find((m) => m.value === s.filterMode)!;
  const left = remaining(s.session.endsAt, now);

  return (
    <main>
      <header className="brand">
        <Logo size={32} off={!active} />
        <h1>
          NoPolitics<span>Please</span>
        </h1>
        <span className="tag">Menos ruido. Más calma.</span>
      </header>

      <section className={`status ${active ? '' : 'off'}`}>
        <div>
          <strong id="sw-label">{active ? 'Activado' : 'Desactivado'}</strong>
          <span className="line" aria-live="polite">{siteLine}</span>
        </div>
        <Switch
          checked={active}
          labelId="sw-label"
          disabled={!loaded}
          onClick={() => update(active ? deactivate(s) : activate(s, s.session.type))}
        />
      </section>

      {filtering && (
        <div className="stats">
          <div className="stat hero">
            <span className="big">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true">
                <path d="M3 12s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6Z" />
                <path d="m4 4 16 16" />
              </svg>
              {hidden}
            </span>
            <span>{hidden === 1 ? 'oculta en esta pestaña' : 'ocultas en esta pestaña'}</span>
          </div>
          <div className="stat">
            <span className="big">{left.big}</span>
            <span>{left.label}</span>
          </div>
        </div>
      )}

      {!active && !unsupported && (
        <p className="note">En pausa. Verás todas las publicaciones hasta que lo vuelvas a activar.</p>
      )}

      {unsupported && (
        <div className="note-block">
          <p>Esta web no es compatible. Funciona en:</p>
          <div className="chips">
            {PLATFORM_KEYS.map((k) => (
              <span key={k}>{PLATFORM_INFO[k].name}</span>
            ))}
          </div>
        </div>
      )}

      <section className="group">
        <h2>Duración</h2>
        <Segmented
          items={DURATIONS}
          value={s.session.type}
          onPick={(v) => update(active ? activate(s, v) : { ...s, session: { type: v, endsAt: null } })}
        />
      </section>

      <section className="group">
        <h2>Nivel de filtrado</h2>
        <Segmented items={MODES} value={s.filterMode} onPick={(v) => update({ ...s, filterMode: v })} />
        <p className="help">{mode.help}</p>
      </section>

      <button className="link-row" onClick={() => setView('networks')}>
        <span className="text">
          <span className="title">Redes</span>
          <span className="muted">{enabledCount} de {PLATFORM_KEYS.length} activas</span>
        </span>
        <span className="arrow">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </span>
      </button>

      <div className="total">
        <span>
          <strong>{total.toLocaleString('es')}</strong> {total === 1 ? 'publicación ocultada' : 'publicaciones ocultadas'} en total
        </span>
        <button disabled={total === 0} onClick={() => chrome.storage.local.set({ [TOTAL_KEY]: 0 })}>
          Reiniciar
        </button>
      </div>

      <footer>
        <button aria-expanded={privacyOpen} onClick={() => setPrivacyOpen(!privacyOpen)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="5" y="11" width="14" height="10" rx="2" />
            <path d="M8 11V8a4 4 0 0 1 8 0v3" />
          </svg>
          <span className="grow">Todo se analiza en tu navegador</span>
          <svg className={`chevron ${privacyOpen ? 'open' : ''}`} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>
        {privacyOpen && (
          <p className="help">
            El texto de las publicaciones no se envía a ningún servidor ni se guarda. No se elimina nada de la red: el
            filtro puede equivocarse y siempre puedes mostrar la publicación.
          </p>
        )}
      </footer>
    </main>
  );
}
