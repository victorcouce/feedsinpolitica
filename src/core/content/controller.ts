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

const CSS = `
[${ATTR}="hidden"]{display:none!important}
[${ATTR}="hidden-in"]>:not(.modopaz-card){display:none!important}
.modopaz-card{--mp-bg:#f3f6f4;--mp-fg:#1c1f1d;--mp-muted:#566059;--mp-line:#c9d1cc;--mp-accent:#2f6b49;--mp-hover:#e2e9e5;
 box-sizing:border-box;margin:8px 16px;padding:12px 14px;border:1px solid var(--mp-line);border-radius:12px;
 background:var(--mp-bg);color:var(--mp-fg);font:14px/1.4 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;text-align:left}
.modopaz-card[data-theme="dark"]{--mp-bg:#1b201d;--mp-fg:#eceeed;--mp-muted:#a9b1ab;--mp-line:#3a423d;--mp-accent:#7cc496;--mp-hover:#2a312d}
.modopaz-card p{margin:0}.modopaz-card .t{font-weight:600}
.modopaz-card .s{color:var(--mp-muted);margin-top:2px}
.modopaz-card .row{display:flex;gap:8px;margin-top:8px;flex-wrap:wrap;align-items:center}
.modopaz-card .row span{color:var(--mp-muted)}
.modopaz-card button{font:inherit;cursor:pointer;padding:4px 12px;border-radius:999px;color:var(--mp-fg);
 background:transparent;border:1px solid var(--mp-accent)}
.modopaz-card button:hover{background:var(--mp-hover)}
.modopaz-card button:focus-visible{outline:2px solid var(--mp-accent);outline-offset:2px}
.modopaz-card[data-state="revealed"]{padding:6px 14px}
.modopaz-card[data-state="revealed"] .row{margin-top:0}
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
    const row = el('div', undefined, 'row');

    if (st.revealed) {
      row.append(el('span', 'Publicación mostrada.'), btn('Ocultar de nuevo', () => this.setRevealed(post, st, false)));
      card.append(row);
      return;
    }
    const why = el('p', `Coincide con: ${reason}.`, 's');
    why.hidden = true;
    why.setAttribute('role', 'status');
    card.append(
      el('p', 'Publicación oculta por NoPoliticsPlease', 't'),
      el('p', 'Este contenido coincide con el filtro político que has activado.', 's'),
      why,
    );
    row.append(
      btn('Mostrar publicación', () => this.setRevealed(post, st, true)),
      btn('¿Por qué?', () => (why.hidden = !why.hidden)),
    );
    card.append(row);
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
