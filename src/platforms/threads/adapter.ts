import { createAdapter } from '../create-adapter';

// Contadores ("2,6 mil", "1.2K") y fechas ("28/09/2026") no son contenido.
const NOISE = /^[\d.,/\s]+(mil|k|m|mill\.?)?$/i;

export const threadsAdapter = createAdapter({
  items: '[data-pressable-container="true"]',
  text: 'span[dir="auto"]',
  placement: 'inside',
  keep: (t) => !NOISE.test(t),
  author: (post) => [post.querySelector('a[href^="/@"]')?.getAttribute('href')?.slice(2).split('/')[0] ?? ''],
});
