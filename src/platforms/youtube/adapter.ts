import type { PlatformAdapter } from '../../core/content/controller';

/** Tarjetas de vídeo: portada, búsqueda, recomendados y Shorts. */
const ITEMS = [
  'ytd-rich-item-renderer',
  'ytd-video-renderer',
  'ytd-compact-video-renderer',
  'ytd-grid-video-renderer',
  'ytd-reel-item-renderer',
  'yt-lockup-view-model',
  'ytm-shorts-lockup-view-model',
].join(',');

/** Título, canal, metadatos y extracto de descripción (nunca el texto de nuestra tarjeta). */
const TEXT = [
  '#video-title',
  '.yt-lockup-metadata-view-model-wiz__title',
  '.yt-lockup-metadata-view-model__title',
  '.shortsLockupViewModelHostMetadataTitle',
  'ytd-channel-name',
  '#channel-name',
  '.yt-content-metadata-view-model-wiz__metadata-text',
  '.yt-content-metadata-view-model__metadata-text',
  '.metadata-snippet-text',
  '#description-text',
].join(',');

/** Ante elementos anidados (rich-item > lockup) se actúa siempre sobre el más externo. */
const outermostOf = (el: HTMLElement): HTMLElement => {
  let cur = el;
  for (let p = cur.parentElement?.closest<HTMLElement>(ITEMS); p; p = cur.parentElement?.closest<HTMLElement>(ITEMS)) cur = p;
  return cur;
};

/** Único módulo que conoce el DOM de YouTube. */
export const youtubeAdapter: PlatformAdapter = {
  placement: 'inside',

  findPosts(root) {
    const found = new Set<HTMLElement>();
    if (root instanceof Element) {
      const self = root.closest<HTMLElement>(ITEMS);
      if (self) found.add(outermostOf(self));
    }
    root.querySelectorAll<HTMLElement>(ITEMS).forEach((el) => found.add(outermostOf(el)));
    return [...found];
  },

  extractText(post) {
    return Array.from(post.querySelectorAll(TEXT))
      .filter((n) => !n.closest('.modopaz-card'))
      .map((n) => n.textContent?.trim() ?? '')
      .filter(Boolean)
      .join(' ');
  },
};
