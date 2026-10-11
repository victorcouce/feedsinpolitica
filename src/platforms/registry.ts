/** Única lista de sitios compatibles: la usan el manifiesto, los content scripts y el popup. */
export const PLATFORMS = {
  x: ['*://x.com/*', '*://twitter.com/*'],
  youtube: ['*://www.youtube.com/*', '*://m.youtube.com/*'],
  reddit: ['*://www.reddit.com/*', '*://old.reddit.com/*'],
  bluesky: ['*://bsky.app/*'],
  meneame: ['*://www.meneame.net/*', '*://meneame.net/*'],
  threads: ['*://www.threads.com/*', '*://www.threads.net/*'],
  mastodon: ['*://mastodon.social/*', '*://mastodon.online/*', '*://mas.to/*'],
  linkedin: ['*://www.linkedin.com/*'],
} as const;

export type Platform = keyof typeof PLATFORMS;
export const PLATFORM_KEYS = Object.keys(PLATFORMS) as Platform[];
export const ALL_MATCHES: string[] = PLATFORM_KEYS.flatMap((k) => [...PLATFORMS[k]]);

const toRegExp = (pattern: string) =>
  new RegExp('^' + pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$');

export function isSupportedUrl(url?: string): boolean {
  return platformOf(url) !== null;
}

/** Red a la que pertenece una URL, o null si la web no es compatible. */
export function platformOf(url?: string): Platform | null {
  if (!url) return null;
  return PLATFORM_KEYS.find((k) => PLATFORMS[k].some((p) => toRegExp(p).test(url))) ?? null;
}

/** Nombre, dominios que se muestran y si la red sigue en beta (selectores sin verificar del todo). */
export const PLATFORM_INFO: Record<Platform, { name: string; domains: string; beta: boolean }> = {
  x: { name: 'X', domains: 'x.com · twitter.com', beta: false },
  youtube: { name: 'YouTube', domains: 'youtube.com · m.youtube.com', beta: true },
  bluesky: { name: 'Bluesky', domains: 'bsky.app', beta: false },
  meneame: { name: 'Menéame', domains: 'meneame.net', beta: false },
  mastodon: { name: 'Mastodon', domains: 'mastodon.social · mastodon.online · mas.to', beta: false },
  threads: { name: 'Threads', domains: 'threads.com · threads.net', beta: false },
  reddit: { name: 'Reddit', domains: 'reddit.com · old.reddit.com', beta: true },
  linkedin: { name: 'LinkedIn', domains: 'linkedin.com', beta: true },
};
