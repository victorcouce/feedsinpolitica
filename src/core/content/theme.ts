export type Theme = 'light' | 'dark';

type RGBA = { r: number; g: number; b: number; a: number };

function parse(css: string): RGBA | null {
  const m = css.match(/rgba?\(([^)]+)\)/);
  if (!m) return null;
  const [r, g, b, a] = m[1]!.split(/[,\s/]+/).filter(Boolean).map(Number);
  if ([r, g, b].some((v) => v === undefined || Number.isNaN(v))) return null;
  return { r: r!, g: g!, b: b!, a: a === undefined || Number.isNaN(a) ? 1 : a };
}

const luminance = (c: RGBA) => (0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b) / 255;

/**
 * El tema lo decide la página (X y YouTube tienen el suyo, independiente del
 * sistema): primero por el fondo, luego por el color del texto y, si no hay
 * datos, por la preferencia del sistema.
 */
export function detectTheme(doc: Document): Theme {
  const view = doc.defaultView;
  if (view) {
    for (const el of [doc.body, doc.documentElement]) {
      const bg = el && parse(view.getComputedStyle(el).backgroundColor);
      if (bg && bg.a > 0.5) return luminance(bg) < 0.5 ? 'dark' : 'light';
    }
    const fg = doc.body && parse(view.getComputedStyle(doc.body).color);
    if (fg && fg.a > 0.5) return luminance(fg) > 0.6 ? 'dark' : 'light';
  }
  return view?.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}
