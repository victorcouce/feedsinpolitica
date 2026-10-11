// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ContentController } from '../../src/core/content/controller';
import { classify } from '../../src/core/classifier/classify';
import { xAdapter } from '../../src/platforms/x/adapter';

const tweet = (text: string) =>
  `<div data-testid="cellInnerDiv"><article data-testid="tweet"><div data-testid="tweetText">${text}</div><button id="like">like</button></article></div>`;

const POLITICAL = 'Debate electoral entre candidatos a las elecciones';
const NEUTRAL = 'Hoy he preparado una tortilla española';

let c: ContentController;
const tick = () => vi.advanceTimersByTimeAsync(200);
const articles = () => Array.from(document.querySelectorAll<HTMLElement>('article'));
const hiddenArticles = () => articles().filter((a) => a.getAttribute('data-modopaz') === 'hidden');

beforeEach(() => {
  vi.useFakeTimers();
  document.body.innerHTML = `<main id="feed">${tweet(POLITICAL)}${tweet(NEUTRAL)}</main>`;
  c = new ContentController(xAdapter, classify, document);
});
afterEach(() => {
  c.stop();
  vi.useRealTimers();
});

describe('ContentController', () => {
  it('oculta sólo la publicación política y deja una tarjeta', async () => {
    c.start('soft');
    await tick();
    expect(hiddenArticles()).toHaveLength(1);
    expect(articles()[1]!.hasAttribute('data-modopaz')).toBe(false);
    expect(document.querySelectorAll('.modopaz-card')).toHaveLength(1);
    expect(c.hiddenCount).toBe(1);
  });

  it('no elimina el nodo original', async () => {
    c.start('soft');
    await tick();
    expect(articles()).toHaveLength(2);
    expect(document.getElementById('like')).not.toBeNull();
  });

  it('detecta publicaciones cargadas dinámicamente', async () => {
    c.start('soft');
    await tick();
    document.getElementById('feed')!.insertAdjacentHTML('beforeend', tweet(POLITICAL));
    await tick();
    expect(hiddenArticles()).toHaveLength(2);
  });

  it('revela y vuelve a ocultar individualmente', async () => {
    c.start('soft');
    await tick();
    const card = document.querySelector('.modopaz-card')!;
    (card.querySelectorAll('button')[0] as HTMLButtonElement).click();
    expect(articles()[0]!.getAttribute('data-modopaz')).toBe('revealed');
    (document.querySelector('.modopaz-card button') as HTMLButtonElement).click();
    expect(articles()[0]!.getAttribute('data-modopaz')).toBe('hidden');
  });

  it('stop() restaura todo sin dejar residuos', async () => {
    c.start('soft');
    await tick();
    c.stop();
    expect(document.querySelectorAll('.modopaz-card')).toHaveLength(0);
    expect(document.querySelectorAll('[data-modopaz]')).toHaveLength(0);
    expect(document.getElementById('modopaz-style')).toBeNull();
  });

  it('reclasifica un nodo reciclado cuyo texto cambia', async () => {
    c.start('soft');
    await tick();
    articles()[0]!.querySelector('[data-testid="tweetText"]')!.textContent = NEUTRAL;
    await tick();
    expect(hiddenArticles()).toHaveLength(0);
    expect(document.querySelectorAll('.modopaz-card')).toHaveLength(0);
  });

  it('no cuenta dos veces la misma publicación', async () => {
    c.start('soft');
    await tick();
    document.getElementById('feed')!.insertAdjacentHTML('beforeend', tweet(POLITICAL));
    await tick();
    expect(c.hiddenCount).toBe(1);
  });

  it('cambiar de nivel reclasifica sin recargar', async () => {
    document.getElementById('feed')!.insertAdjacentHTML('beforeend', tweet('Un partido presenta una propuesta de vivienda'));
    c.start('soft');
    await tick();
    expect(hiddenArticles()).toHaveLength(1);
    c.setMode('broad');
    await tick();
    expect(hiddenArticles()).toHaveLength(2);
  });

  it('lee tarjetas de enlace y alt de imágenes', async () => {
    document.getElementById('feed')!.insertAdjacentHTML(
      'beforeend',
      `<div><article data-testid="tweet"><div data-testid="tweetText">Mirad esto</div>
       <div data-testid="card.wrapper">Feijóo y Sánchez chocan en el Congreso</div></article></div>
       <div><article data-testid="tweet"><div data-testid="tweetText">Foto del día</div>
       <div data-testid="tweetPhoto"><img alt="Abascal en un mitin de campaña electoral"></div></article></div>
       <div><article data-testid="tweet"><div data-testid="tweetText">Mi gato</div>
       <div data-testid="tweetPhoto"><img alt="Imagen"></div></article></div>`,
    );
    c.start('soft');
    await tick();
    expect(hiddenArticles()).toHaveLength(3);
  });

  it('un líder o partido inequívoco basta en Suave', async () => {
    document.body.innerHTML = `<main id="feed">${tweet('Feijóo')}${tweet('Abascal')}${tweet('Yolanda Díaz')}${tweet('PSOE')}</main>`;
    c.start('soft');
    await tick();
    expect(hiddenArticles()).toHaveLength(4);
  });
});
