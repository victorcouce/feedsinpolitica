// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ContentController } from '../../src/core/content/controller';
import { classify } from '../../src/core/classifier/classify';
import { youtubeAdapter } from '../../src/platforms/youtube/adapter';

const item = (title: string, channel = 'Canal de prueba') =>
  `<ytd-rich-item-renderer><div id="content"><yt-lockup-view-model>
     <a id="video-title">${title}</a><ytd-channel-name>${channel}</ytd-channel-name>
   </yt-lockup-view-model></div></ytd-rich-item-renderer>`;

let c: ContentController;
const tick = () => vi.advanceTimersByTimeAsync(200);
const items = () => Array.from(document.querySelectorAll<HTMLElement>('ytd-rich-item-renderer'));

beforeEach(() => {
  vi.useFakeTimers();
  document.body.innerHTML = `<div id="grid">
    ${item('Debate electoral entre candidatos: Feijóo y Sánchez')}
    ${item('Receta de tortilla española paso a paso')}
    ${item('Resumen de la jornada', 'Congreso de los Diputados')}
  </div>`;
  c = new ContentController(youtubeAdapter, classify, document);
});
afterEach(() => {
  c.stop();
  vi.useRealTimers();
});

describe('YouTube', () => {
  it('oculta sólo los vídeos políticos, con la tarjeta dentro del elemento', async () => {
    c.start('soft');
    await tick();
    const [a, b, d] = items();
    expect(a!.getAttribute('data-modopaz')).toBe('hidden-in');
    expect(a!.firstElementChild!.classList.contains('modopaz-card')).toBe(true);
    expect(b!.hasAttribute('data-modopaz')).toBe(false);
    expect(d!.hasAttribute('data-modopaz')).toBe(false); // sólo el canal: ambiguo
    expect(c.hiddenCount).toBe(1);
  });

  it('actúa sobre el contenedor externo, no sobre el lockup anidado', async () => {
    c.start('soft');
    await tick();
    expect(document.querySelectorAll('yt-lockup-view-model[data-modopaz]')).toHaveLength(0);
    expect(document.querySelectorAll('.modopaz-card')).toHaveLength(1);
  });

  it('el texto de la tarjeta no se reclasifica ni se duplica', async () => {
    c.start('soft');
    await tick();
    await tick();
    expect(document.querySelectorAll('.modopaz-card')).toHaveLength(1);
  });

  it('revela, vuelve a ocultar y restaura al parar', async () => {
    c.start('soft');
    await tick();
    const first = items()[0]!;
    (first.querySelector('.modopaz-card button') as HTMLButtonElement).click();
    expect(first.getAttribute('data-modopaz')).toBe('revealed');
    (first.querySelector('.modopaz-card button') as HTMLButtonElement).click();
    expect(first.getAttribute('data-modopaz')).toBe('hidden-in');
    c.stop();
    expect(document.querySelectorAll('.modopaz-card, [data-modopaz]')).toHaveLength(0);
  });

  it('detecta vídeos cargados al hacer scroll', async () => {
    c.start('soft');
    await tick();
    document.getElementById('grid')!.insertAdjacentHTML('beforeend', item('Mitin de campaña electoral en directo'));
    await tick();
    expect(c.hiddenCount).toBe(2);
  });
});
