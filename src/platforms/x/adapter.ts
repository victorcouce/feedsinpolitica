import type { PlatformAdapter } from '../../core/content/controller';

const GENERIC_ALT = /^(imagen|image|foto|photo|video|vídeo|)$/i;
const POST = 'article[data-testid="tweet"]';

/** Único módulo que conoce el DOM de X. */
export const xAdapter: PlatformAdapter = {
  findPosts(root) {
    const found: HTMLElement[] = [];
    if (root instanceof Element) {
      const self = root.closest<HTMLElement>(POST);
      if (self) found.push(self);
    }
    root.querySelectorAll<HTMLElement>(POST).forEach((el) => found.push(el));
    return found;
  },

  // Primer bloque de usuario: nombre visible y @usuario del autor (no del citado).
  extractAuthor(post) {
    const user = post.querySelector('[data-testid="User-Name"]');
    if (!user) return [];
    const handle = user.querySelector('a[href^="/"]:not([href*="/status/"])')?.getAttribute('href')?.slice(1) ?? '';
    return [user.querySelector('span')?.textContent ?? '', handle];
  },

  // Texto del tuit y del citado (mismo <article>), título de la tarjeta de
  // enlace y texto alternativo de imágenes escrito por el autor.
  extractText(post) {
    const parts = Array.from(post.querySelectorAll('[data-testid="tweetText"]')).map((n) => n.textContent ?? '');
    post.querySelectorAll('[data-testid="card.wrapper"]').forEach((n) => parts.push(n.textContent ?? ''));
    post.querySelectorAll<HTMLImageElement>('[data-testid="tweetPhoto"] img[alt]').forEach((img) => {
      if (!GENERIC_ALT.test(img.alt)) parts.push(img.alt);
    });
    return parts.join(' ').trim();
  },
};
