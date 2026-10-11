// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ContentController, type PlatformAdapter } from '../../src/core/content/controller';
import { classify } from '../../src/core/classifier/classify';
import { redditAdapter } from '../../src/platforms/reddit/adapter';
import { blueskyAdapter } from '../../src/platforms/bluesky/adapter';
import { meneameAdapter } from '../../src/platforms/meneame/adapter';
import { threadsAdapter } from '../../src/platforms/threads/adapter';
import { mastodonAdapter } from '../../src/platforms/mastodon/adapter';
import { linkedinAdapter } from '../../src/platforms/linkedin/adapter';
import { isSupportedUrl } from '../../src/platforms/registry';

const POLI = 'Debate electoral entre candidatos a las elecciones';
const NEUTRAL = 'Hoy he preparado una tortilla española';

// Estructura tomada de las webs reales (Bluesky, Menéame, Mastodon, Threads) o de la
// estructura conocida (Reddit, LinkedIn).
const fixtures: Record<string, { adapter: PlatformAdapter; item: (t: string) => string; sel: string }> = {
  bluesky: {
    adapter: blueskyAdapter,
    sel: '[data-testid^="feedItem-by-"]',
    item: (t) => `<div data-testid="feedItem-by-alguien.bsky.social"><div data-testid="contentHider-post"><div data-testid="postText">${t}</div></div><button data-testid="likeBtn">x</button></div>`,
  },
  meneame: {
    adapter: meneameAdapter,
    sel: '.news-summary',
    item: (t) => `<div class="news-summary"><div class="news-body"><div class="center-content"><h2><a href="#">${t}</a></h2><div class="news-content">Resumen</div></div></div></div>`,
  },
  mastodon: {
    adapter: mastodonAdapter,
    sel: 'article[data-id]',
    item: (t) => `<article data-id="1" tabindex="-1"><div class="status__content"><div class="status__content__text"><p>${t}</p></div></div></article>`,
  },
  threads: {
    adapter: threadsAdapter,
    sel: '[data-pressable-container="true"]',
    item: (t) => `<div data-pressable-container="true"><span dir="auto">zuck</span><span dir="auto">28/09/2026</span><span dir="auto">${t}</span><span dir="auto">2,6 mil</span></div>`,
  },
  reddit: {
    adapter: redditAdapter,
    sel: 'shreddit-post',
    item: (t) => `<article><shreddit-post post-title="${t}"><a slot="title">${t}</a></shreddit-post></article>`,
  },
  linkedin: {
    adapter: linkedinAdapter,
    sel: 'div[data-urn^="urn:li:activity:"]',
    item: (t) => `<div data-urn="urn:li:activity:1"><div class="update-components-text">${t}</div></div>`,
  },
};

const tick = () => vi.advanceTimersByTimeAsync(200);
beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe.each(Object.entries(fixtures))('%s', (_name, f) => {
  it('oculta lo político, respeta lo neutral y restaura', async () => {
    document.body.innerHTML = `<main id="feed">${f.item(POLI)}${f.item(NEUTRAL)}</main>`;
    const c = new ContentController(f.adapter, classify, document);
    c.start('soft');
    await tick();
    const posts = Array.from(document.querySelectorAll<HTMLElement>(f.sel));
    expect(posts).toHaveLength(2);
    expect(posts[0]!.getAttribute('data-modopaz')).toMatch(/^hidden/);
    expect(posts[1]!.hasAttribute('data-modopaz')).toBe(false);
    expect(document.querySelectorAll('.modopaz-card')).toHaveLength(1);
    expect(c.hiddenCount).toBe(1);

    document.getElementById('feed')!.insertAdjacentHTML('beforeend', f.item(POLI));
    await tick();
    expect(document.querySelectorAll('.modopaz-card')).toHaveLength(2);

    c.stop();
    expect(document.querySelectorAll('.modopaz-card, [data-modopaz]')).toHaveLength(0);
  });
});

describe('Threads: los contadores no cuentan como texto', () => {
  it('"2,6 mil" y fechas se ignoran', () => {
    document.body.innerHTML = fixtures.threads!.item('Hola');
    const post = document.querySelector<HTMLElement>('[data-pressable-container]')!;
    expect(threadsAdapter.extractText(post)).toBe('zuck Hola');
  });
});

describe('registro de sitios', () => {
  it.each([
    ['https://x.com/home', true],
    ['https://www.youtube.com/watch?v=1', true],
    ['https://www.reddit.com/r/spain/', true],
    ['https://bsky.app/profile/a', true],
    ['https://meneame.net/', true],
    ['https://www.threads.com/@zuck', true],
    ['https://mastodon.social/@Gargron', true],
    ['https://www.linkedin.com/feed/', true],
    ['https://example.com/', false],
    ['https://notx.com/', false],
    [undefined, false],
  ])('%s → %s', (url, ok) => expect(isSupportedUrl(url as string | undefined)).toBe(ok));
});
