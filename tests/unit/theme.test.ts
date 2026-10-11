// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { detectTheme } from '../../src/core/content/theme';
import { ContentController } from '../../src/core/content/controller';
import { classify } from '../../src/core/classifier/classify';
import { xAdapter } from '../../src/platforms/x/adapter';

beforeEach(() => {
  document.documentElement.removeAttribute('style');
  document.body.removeAttribute('style');
  document.body.innerHTML = '';
});

describe('detectTheme', () => {
  it.each([
    ['rgb(255, 255, 255)', 'light'],
    ['rgb(21, 32, 43)', 'dark'], // X "Atenuado"
    ['rgb(0, 0, 0)', 'dark'], // X "Luces apagadas"
    ['rgb(15, 15, 15)', 'dark'], // YouTube oscuro
  ])('fondo %s → %s', (bg, expected) => {
    document.body.style.backgroundColor = bg;
    expect(detectTheme(document)).toBe(expected);
  });

  it('usa el fondo de <html> si el de <body> es transparente', () => {
    document.documentElement.style.backgroundColor = 'rgb(15, 15, 15)';
    expect(detectTheme(document)).toBe('dark');
  });

  it('cae al color del texto si no hay fondo', () => {
    document.body.style.color = 'rgb(240, 240, 240)';
    expect(detectTheme(document)).toBe('dark');
  });
});

describe('tarjeta y tema', () => {
  it('toma el tema de la página y lo actualiza al cambiarlo', async () => {
    vi.useFakeTimers();
    document.body.style.backgroundColor = 'rgb(255, 255, 255)';
    document.body.innerHTML =
      '<div><article data-testid="tweet"><div data-testid="tweetText">Debate electoral entre candidatos</div></article></div>';
    const c = new ContentController(xAdapter, classify, document);
    c.start('soft');
    await vi.advanceTimersByTimeAsync(200);
    const card = document.querySelector<HTMLElement>('.modopaz-card')!;
    expect(card.dataset.theme).toBe('light');
    document.body.style.backgroundColor = 'rgb(0, 0, 0)';
    await vi.advanceTimersByTimeAsync(10);
    expect(card.dataset.theme).toBe('dark');
    c.stop();
    vi.useRealTimers();
  });
});
