import { PLATFORM_KEYS, type Platform } from '../platforms/registry';
import type { FilterMode, SessionType, Settings } from '../types';

export const KEY = 'settings';
export const ALARM = 'modopaz-session-end';

export const DEFAULTS: Settings = {
  version: 1,
  enabled: false,
  filterMode: 'soft',
  session: { type: 'manual', endsAt: null },
  platforms: Object.fromEntries(PLATFORM_KEYS.map((k) => [k, true])) as Record<Platform, boolean>,
  display: { hiddenPostStyle: 'compact' },
};

const SESSION_TYPES: SessionType[] = ['manual', '30m', '2h', '8h'];
const MODES: FilterMode[] = ['soft', 'broad'];

/** Valida y migra cualquier valor guardado hacia el esquema actual. */
export function parseSettings(raw: unknown): Settings {
  const o = (raw && typeof raw === 'object' ? raw : {}) as Record<string, any>;
  const type = SESSION_TYPES.includes(o.session?.type) ? o.session.type : DEFAULTS.session.type;
  const endsAt = typeof o.session?.endsAt === 'number' ? o.session.endsAt : null;
  return {
    version: 1,
    enabled: o.enabled === true,
    filterMode: MODES.includes(o.filterMode) ? o.filterMode : DEFAULTS.filterMode,
    session: { type, endsAt },
    platforms: Object.fromEntries(PLATFORM_KEYS.map((k) => [k, o.platforms?.[k] !== false])) as Record<Platform, boolean>,
    display: { hiddenPostStyle: 'compact' },
  };
}

export async function getSettings(): Promise<Settings> {
  const res = await chrome.storage.local.get(KEY);
  return parseSettings(res[KEY]);
}

export async function saveSettings(s: Settings): Promise<void> {
  await chrome.storage.local.set({ [KEY]: s });
  if (s.enabled && s.session.endsAt !== null) {
    await chrome.alarms.create(ALARM, { when: s.session.endsAt });
  } else {
    await chrome.alarms.clear(ALARM);
  }
}

export const TOTAL_KEY = 'totalHidden';

export async function getTotal(): Promise<number> {
  const n = (await chrome.storage.local.get(TOTAL_KEY))[TOTAL_KEY];
  return typeof n === 'number' && n >= 0 ? n : 0;
}
