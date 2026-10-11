import type { Platform } from '../platforms/registry';

export type FilterMode = 'soft' | 'broad';
export type SessionType = 'manual' | '30m' | '2h' | '8h';

export interface Settings {
  version: 1;
  enabled: boolean;
  filterMode: FilterMode;
  session: { type: SessionType; endsAt: number | null };
  platforms: Record<Platform, boolean>;
  display: { hiddenPostStyle: 'compact' };
}

export type Category = 'actors' | 'electoral' | 'institutions' | 'expressions' | 'debates';

export interface Classification {
  political: boolean;
  confidence: number;
  categories: Category[];
  reasonCodes: string[];
}

export type Classifier = (text: string, mode: FilterMode) => Classification;

/** Mensajes content script <-> popup. */
export interface StatsResponse {
  hidden: number;
}
