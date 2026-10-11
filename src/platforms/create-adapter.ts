import type { PlatformAdapter } from '../core/content/controller';

interface Options {
  /** Selector CSS de cada publicación. */
  items: string;
  /** Selectores cuyo texto se analiza. */
  text: string;
  placement?: PlatformAdapter['placement'];
  /** Descarta fragmentos que no son contenido (contadores, fechas…). */
  keep?: (text: string) => boolean;
  /** Texto adicional que no está en nodos de texto (atributos, alt…). */
  extra?: (post: HTMLElement) => string[];
}

/** Adaptador genérico: sólo hay que describir el DOM de la plataforma. */
export function createAdapter({ items, text, placement, keep, extra }: Options): PlatformAdapter {
  // Ante elementos anidados se actúa siempre sobre el más externo.
  const outermost = (el: HTMLElement): HTMLElement => {
    let cur = el;
    for (let p = cur.parentElement?.closest<HTMLElement>(items); p; p = cur.parentElement?.closest<HTMLElement>(items)) cur = p;
    return cur;
  };

  return {
    placement,
    findPosts(root) {
      const found = new Set<HTMLElement>();
      if (root instanceof Element) {
        const self = root.closest<HTMLElement>(items);
        if (self) found.add(outermost(self));
      }
      root.querySelectorAll<HTMLElement>(items).forEach((el) => found.add(outermost(el)));
      return [...found];
    },
    extractText(post) {
      const parts = Array.from(post.querySelectorAll(text))
        .filter((n) => !n.closest('.modopaz-card'))
        .map((n) => n.textContent?.trim() ?? '');
      if (extra) parts.push(...extra(post));
      return parts.filter((t) => t && (!keep || keep(t))).join(' ');
    },
  };
}
