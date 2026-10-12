import { fingerprint } from '../classifier/normalize';
import { detectTheme } from './theme';
import type { Category, Classification, Classifier, FilterMode } from '../../types';

export interface PlatformAdapter {
  /** Publicaciones contenidas en (o que contienen a) `root`. */
  findPosts(root: ParentNode | Element): HTMLElement[];
  extractText(post: HTMLElement): string;
  /** 'before' (por defecto): la tarjeta es hermana y se oculta la publicación.
   *  'inside': la tarjeta va dentro y se ocultan sus hijos (para rejillas con layout propio). */
  placement?: 'before' | 'inside';
}

interface PostState {
  fp: string;
  card?: HTMLElement;
  revealed: boolean;
}

const ATTR = 'data-modopaz';
const STYLE_ID = 'modopaz-style';
const BATCH = 20;

const LABELS: Record<Category, string> = {
  actors: 'actores políticos',
  electoral: 'procesos electorales',
  institutions: 'instituciones',
  expressions: 'expresiones políticas',
  debates: 'debates públicos',
};

const ICON = `<svg viewBox="0 0 48 48" width="28" height="28" aria-hidden="true" focusable="false"><path fill="currentColor" d="M24 2l5.2 9.6L38.8 7l-2.6 10.6L47 20l-8.6 7.2L44 37l-10.6-1.4L30 46l-6-8.6L18 46l-3.4-10.4L4 37l5.6-9.8L1 20l10.8-2.4L9.2 7l9.6 4.6z"/><path fill="#f6ff8a" d="M2 20.5l36-6.5 1.4 6.4-36 6.6z"/></svg>`;

const CSS = `
[${ATTR}="hidden"]{display:none!important}
[${ATTR}="hidden-in"]>:not(.modopaz-card){display:none!important}
.modopaz-card{--mp-bg:#f1f1ef;--mp-fg:#0f0f0f;--mp-btn:#e1e1de;--mp-btn-hover:#d3d3cf;
 box-sizing:border-box;display:flex;align-items:center;gap:14px;margin:8px 12px;padding:14px 18px 14px 20px;
 border-radius:28px;background:var(--mp-bg);color:var(--mp-fg);
 font:600 17px/1.3 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;text-align:left}
.modopaz-card[data-theme="dark"]{--mp-bg:#2a2a28;--mp-fg:#f4f4f2;--mp-btn:#3d3d3a;--mp-btn-hover:#4b4b47}
.modopaz-card .ic{flex:none;display:flex;color:var(--mp-fg)}
.modopaz-card .t{flex:1;min-width:0;margin:0}
.modopaz-card button{flex:none;font:inherit;font-size:16px;font-weight:700;cursor:pointer;padding:10px 24px;border:0;
 border-radius:999px;color:var(--mp-fg);background:var(--mp-btn)}
.modopaz-card button:hover{background:var(--mp-btn-hover)}
.modopaz-card button:focus-visible{outline:2px solid var(--mp-fg);outline-offset:2px}
.modopaz-card[data-state="revealed"]{padding:8px 18px 8px 20px;font-size:15px;font-weight:500}
.modopaz-card[data-state="revealed"] .ic{display:none}
.modopaz-card[data-state="revealed"] button{padding:6px 16px;font-size:14px}
`;

export class ContentController {
  private state = new WeakMap<HTMLElement, PostState>();
  private seen = new Set<string>();
  /** Huellas ocultadas alguna vez en esta página: evita contar dos veces al reclasificar. */
  private everHidden = new Set<string>();
  /** Se llama una vez por cada publicación nueva ocultada. */
  onHidden?: () => void;
  private queue = new Set<HTMLElement>();
  private observer: MutationObserver | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private mode: FilterMode = 'soft';
  private themeObserver: MutationObserver | null = null;
  private themeQuery: MediaQueryList | null = null;
  private onTheme = () => this.retheme();

  constructor(
    private adapter: PlatformAdapter,
    private classify: Classifier,
    private doc: Document = document,
  ) {}

  private get inside(): boolean {
    return this.adapter.placement === 'inside';
  }

  private get hiddenValue(): string {
    return this.inside ? 'hidden-in' : 'hidden';
  }

  get hiddenCount(): number {
    return this.seen.size;
  }

  get running(): boolean {
    return this.observer !== null;
  }

  start(mode: FilterMode): void {
    this.mode = mode;
    if (this.observer) return;
    this.seen.clear();
    this.injectStyle();
    this.observer = new MutationObserver((muts) => this.onMutations(muts));
    this.observer.observe(this.doc.body, { childList: true, subtree: true, characterData: true });
    this.watchTheme();
    this.enqueue(this.adapter.findPosts(this.doc));
  }

  /** Cambio de nivel: reclasifica todo sin recargar. */
  setMode(mode: FilterMode): void {
    if (mode === this.mode) return;
    this.mode = mode;
    if (!this.observer) return;
    this.restoreAll();
    this.state = new WeakMap();
    this.seen.clear();
    this.enqueue(this.adapter.findPosts(this.doc));
  }

  stop(): void {
    this.observer?.disconnect();
    this.observer = null;
    this.unwatchTheme();
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    this.queue.clear();
    this.restoreAll();
    this.state = new WeakMap();
    this.seen.clear();
    this.doc.getElementById(STYLE_ID)?.remove();
  }

  // --- detección ---------------------------------------------------------

  private onMutations(muts: MutationRecord[]): void {
    const posts: HTMLElement[] = [];
    for (const m of muts) {
      if (m.type === 'characterData') {
        const el = m.target.parentElement;
        if (el) posts.push(...this.adapter.findPosts(el));
        continue;
      }
      m.addedNodes.forEach((n) => {
        if (!(n instanceof Element) || n.closest('.modopaz-card')) return;
        posts.push(...this.adapter.findPosts(n));
      });
      // Texto que llega tarde dentro de una publicación ya presente.
      if (m.target instanceof Element && !m.target.closest('.modopaz-card')) {
        const owner = this.adapter.findPosts(m.target).find((p) => p.contains(m.target));
        if (owner) posts.push(owner);
      }
    }
    this.enqueue(posts);
  }

  private enqueue(posts: HTMLElement[]): void {
    posts.forEach((p) => this.queue.add(p));
    if (this.queue.size && !this.timer) this.timer = setTimeout(() => this.flush(), 50);
  }

  private flush(): void {
    this.timer = null;
    if (!this.observer) return;
    let n = 0;
    for (const post of this.queue) {
      this.queue.delete(post);
      if (post.isConnected) this.process(post);
      if (++n >= BATCH) break;
    }
    if (this.queue.size) this.timer = setTimeout(() => this.flush(), 0);
  }

  private process(post: HTMLElement): void {
    const text = this.adapter.extractText(post);
    const prev = this.state.get(post);
    const fp = fingerprint(text);
    if (prev && prev.fp === fp) return;
    if (prev) this.unhide(post, prev);
    if (!text) return;

    const result = this.classify(text, this.mode);
    const next: PostState = { fp, revealed: false };
    this.state.set(post, next);
    if (result.political) this.hide(post, next, result);
  }

  // --- presentación ------------------------------------------------------

  private hide(post: HTMLElement, st: PostState, result: Classification): void {
    this.seen.add(st.fp);
    if (!this.everHidden.has(st.fp)) {
      this.everHidden.add(st.fp);
      this.onHidden?.();
    }
    st.card = this.buildCard(post, st, result);
    if (this.inside) post.prepend(st.card);
    else post.before(st.card);
    post.setAttribute(ATTR, this.hiddenValue);
  }

  private unhide(post: HTMLElement, st: PostState): void {
    st.card?.remove();
    st.card = undefined;
    post.removeAttribute(ATTR);
  }

  private setRevealed(post: HTMLElement, st: PostState, revealed: boolean): void {
    st.revealed = revealed;
    post.setAttribute(ATTR, revealed ? 'revealed' : this.hiddenValue);
    this.renderCard(st.card!, post, st);
    st.card!.querySelector<HTMLButtonElement>('button')?.focus();
  }

  private buildCard(post: HTMLElement, st: PostState, result: Classification): HTMLElement {
    const card = this.doc.createElement('div');
    card.className = 'modopaz-card';
    card.dataset.theme = detectTheme(this.doc);
    card.setAttribute('role', 'group');
    card.setAttribute('aria-label', 'NoPoliticsPlease');
    (card as any)._reason = result.categories.map((c) => LABELS[c]).join(', ');
    this.renderCard(card, post, st);
    return card;
  }

  private renderCard(card: HTMLElement, post: HTMLElement, st: PostState): void {
    const d = this.doc;
    const el = (tag: string, text?: string, cls?: string) => {
      const e = d.createElement(tag);
      if (text) e.textContent = text;
      if (cls) e.className = cls;
      return e;
    };
    const btn = (label: string, onClick: () => void) => {
      const b = el('button', label) as HTMLButtonElement;
      b.type = 'button';
      b.addEventListener('click', onClick);
      return b;
    };
    const reason = (card as any)._reason as string;
    card.replaceChildren();
    card.dataset.state = st.revealed ? 'revealed' : 'hidden';

    if (st.revealed) {
      card.title = '';
      card.append(el('p', 'Publicación política mostrada', 't'), btn('Ocultar', () => this.setRevealed(post, st, false)));
      return;
    }
    card.title = `Coincide con: ${reason}`;
    const icon = el('span', undefined, 'ic');
    icon.innerHTML = ICON;
    card.append(icon, el('p', 'Publicación política oculta', 't'), btn('Mostrar', () => this.setRevealed(post, st, true)));
  }

  /** El usuario puede cambiar el tema de la página (o del sistema) sin recargar. */
  private watchTheme(): void {
    const opts = { attributes: true, attributeFilter: ['class', 'style', 'dark', 'data-theme', 'data-color-mode'] };
    this.themeObserver = new MutationObserver(this.onTheme);
    this.themeObserver.observe(this.doc.documentElement, opts);
    this.themeObserver.observe(this.doc.body, opts);
    this.themeQuery = this.doc.defaultView?.matchMedia?.('(prefers-color-scheme: dark)') ?? null;
    this.themeQuery?.addEventListener?.('change', this.onTheme);
  }

  private unwatchTheme(): void {
    this.themeObserver?.disconnect();
    this.themeObserver = null;
    this.themeQuery?.removeEventListener?.('change', this.onTheme);
    this.themeQuery = null;
  }

  private retheme(): void {
    const theme = detectTheme(this.doc);
    this.doc.querySelectorAll<HTMLElement>('.modopaz-card').forEach((c) => (c.dataset.theme = theme));
  }

  private restoreAll(): void {
    this.doc.querySelectorAll('.modopaz-card').forEach((c) => c.remove());
    this.doc.querySelectorAll(`[${ATTR}]`).forEach((p) => p.removeAttribute(ATTR));
  }

  private injectStyle(): void {
    if (this.doc.getElementById(STYLE_ID)) return;
    const s = this.doc.createElement('style');
    s.id = STYLE_ID;
    s.textContent = CSS;
    this.doc.head.append(s);
  }
}
