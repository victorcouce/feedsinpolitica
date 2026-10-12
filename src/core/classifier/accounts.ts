import { normalize } from './normalize';

/** Forma compacta: sin acentos, sin @, sin signos, emojis ni espacios. */
const compact = (s: string) => normalize(s).replace(/[^a-z0-9]/g, '');

/**
 * Cuentas oficiales de partidos (nombre visible o identificador), coincidencia exacta.
 * Cubren el espectro de forma equivalente: si se añade una, hay que añadir sus homólogas.
 */
const EXACT = new Set(
  [
    'psoe', 'ppopular', 'partidopopular', 'pp', 'vox', 'voxespana', 'voxes', 'vox_es', 'podemos', 'sumar',
    'erc', 'junts', 'juntsxcat', 'pnv', 'eajpnv', 'bng', 'upn', 'compromis', 'iu', 'ciudadanos', 'cs',
    'cup', 'pacma', 'psc', 'ehbildu', 'bildu', 'masmadrid', 'coalicioncanaria', 'movimientosumar',
    'izquierdaunida', 'partidosocialista', 'esquerrarepublicana',
  ].map(compact),
);

/** Ramas territoriales y juventudes ("PSOE de Madrid", "Nuevas Generaciones"…). */
const PREFIXES = [
  'psoe', 'partidopopular', 'partidosocialista', 'esquerrarepublicana', 'ehbildu', 'juntsper',
  'izquierdaunida', 'masmadrid', 'nuevasgeneraciones', 'juventudessocialistas', 'voxespana',
].map(compact);

export function isPartyAccount(identities: readonly string[]): boolean {
  return identities.some((id) => {
    const c = compact(id);
    return c.length > 1 && (EXACT.has(c) || PREFIXES.some((p) => c.startsWith(p)));
  });
}
