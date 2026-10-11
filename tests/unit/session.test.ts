import { describe, expect, it } from 'vitest';
import { DEFAULTS, parseSettings } from '../../src/storage/settings';
import { activate, deactivate, expire, isActive } from '../../src/features/sessions/session';

const T0 = 1_000_000;

describe('sesiones', () => {
  it('manual: activa sin fecha de fin', () => {
    const s = activate(DEFAULTS, 'manual', T0);
    expect(s.enabled).toBe(true);
    expect(s.session.endsAt).toBeNull();
    expect(isActive(s, T0 + 1e12)).toBe(true);
  });
  it('temporizada: fecha absoluta y expiración', () => {
    const s = activate(DEFAULTS, '30m', T0);
    expect(s.session.endsAt).toBe(T0 + 30 * 60_000);
    expect(isActive(s, T0 + 29 * 60_000)).toBe(true);
    expect(isActive(s, T0 + 31 * 60_000)).toBe(false);
  });
  it('expire() desactiva tras un reinicio con la sesión vencida', () => {
    const s = activate(DEFAULTS, '2h', T0);
    expect(expire(s, T0 + 1000)).toBe(s);
    expect(expire(s, T0 + 3 * 3_600_000).enabled).toBe(false);
  });
  it('deactivate limpia endsAt', () => {
    expect(deactivate(activate(DEFAULTS, '8h', T0)).session.endsAt).toBeNull();
  });
});

describe('parseSettings', () => {
  it('valores por defecto ante datos vacíos o inválidos', () => {
    expect(parseSettings(undefined)).toEqual(DEFAULTS);
    expect(parseSettings({ enabled: 'sí', filterMode: 'x', session: { type: 'zz', endsAt: 'a' } })).toEqual(DEFAULTS);
  });
  it('conserva valores válidos', () => {
    const s = parseSettings({ enabled: true, filterMode: 'broad', session: { type: '2h', endsAt: 5 } });
    expect(s.filterMode).toBe('broad');
    expect(s.session).toEqual({ type: '2h', endsAt: 5 });
  });
});
