import type { SessionType, Settings } from '../../types';

export const DURATIONS: Record<SessionType, number | null> = {
  manual: null,
  '30m': 30 * 60_000,
  '2h': 2 * 3_600_000,
  '8h': 8 * 3_600_000,
};

/** Fuente de verdad: marca temporal absoluta persistida. */
export function isActive(s: Settings, now = Date.now()): boolean {
  if (!s.enabled) return false;
  const { endsAt } = s.session;
  return endsAt === null || endsAt > now;
}

export function activate(s: Settings, type: SessionType, now = Date.now()): Settings {
  const d = DURATIONS[type];
  return { ...s, enabled: true, session: { type, endsAt: d === null ? null : now + d } };
}

export function deactivate(s: Settings): Settings {
  return { ...s, enabled: false, session: { ...s.session, endsAt: null } };
}

/** Si la sesión ya expiró, devuelve el estado desactivado; si no, el mismo objeto. */
export function expire(s: Settings, now = Date.now()): Settings {
  return s.enabled && !isActive(s, now) ? deactivate(s) : s;
}
