import { describe, expect, it } from 'vitest';
import { classify } from '../../src/core/classifier/classify';

const soft = (t: string) => classify(t, 'soft').political;
const broad = (t: string) => classify(t, 'broad').political;

describe('classifier — ejemplos del PRD', () => {
  it('electoral explícito se oculta en ambos niveles', () => {
    const t = 'Hoy hay un debate entre candidatos a las elecciones';
    expect(soft(t)).toBe(true);
    expect(broad(t)).toBe(true);
  });

  it('política institucional', () => {
    expect(soft('Se aprueba una reforma fiscal en el Congreso')).toBe(true);
  });

  it('un partido + vivienda es ambiguo: sólo Amplio', () => {
    const t = 'Un partido presenta una propuesta de vivienda';
    expect(soft(t)).toBe(false);
    expect(broad(t)).toBe(true);
  });

  it.each([
    'He encontrado un piso para alquilar',
    'La política de devoluciones de esta tienda es buena',
    'Mañana tenemos partido de fútbol',
    'Hoy he preparado una tortilla española',
    'Gran partido de la Champions, qué gol',
    'Vivienda de lujo en venta, impuestos incluidos',
    '',
  ])('no político: %s', (t) => {
    expect(soft(t)).toBe(false);
    expect(broad(t)).toBe(false);
  });
});

describe('classifier — mecánica', () => {
  it('ignora acentos y mayúsculas', () => {
    expect(soft('CAMPAÑA ELECTORAL: MÍTIN del candidato')).toBe(true);
  });
  it('sólo palabras completas', () => {
    expect(soft('el electoralismo y los candidatoss')).toBe(false);
  });
  it('devuelve resultado estructurado sin términos del texto', () => {
    const r = classify('Debate electoral entre candidatos', 'soft');
    expect(r.categories).toContain('electoral');
    expect(r.reasonCodes.every((c) => /^(cat|score):/.test(c))).toBe(true);
  });
  it('maneja entradas mal formadas', () => {
    expect(classify(undefined as any, 'soft').political).toBe(false);
  });
});

describe('classifier — neutralidad', () => {
  // Cada par de homólogos debe producir exactamente el mismo resultado.
  const pairs = [
    ['El PSOE critica al gobierno en el Congreso', 'El Partido Popular critica al gobierno en el Congreso'],
    ['Vox presenta su candidato a las elecciones', 'Sumar presenta su candidata a las elecciones'.replace('Sumar', 'Movimiento Sumar')],
    ['Feijóo y la moción de censura', 'Pedro Sánchez y la moción de censura'],
    ['Abascal en el Congreso de los Diputados', 'Yolanda Díaz en el Congreso de los Diputados'],
    ['Junts y la investidura', 'EH Bildu y la investidura'],
  ];
  it.each(pairs)('mismo tratamiento: %s / %s', (a, b) => {
    for (const mode of ['soft', 'broad'] as const) {
      expect(classify(a, mode).political).toBe(classify(b, mode).political);
    }
  });
});

describe('classifier — frases que contienen otros términos', () => {
  it('"congreso de los diputados" no puntúa también como "congreso" y "diputados"', () => {
    const r = classify('Congreso de los Diputados', 'soft');
    expect(r.reasonCodes).toContain('score:3');
    expect(r.political).toBe(false);
  });
});
