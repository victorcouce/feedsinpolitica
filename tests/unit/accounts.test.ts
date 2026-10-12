import { describe, expect, it } from 'vitest';
import { isPartyAccount } from '../../src/core/classifier/accounts';

describe('cuentas de partidos', () => {
  it.each([
    ['PSOE'], ['@PSOE'], ['Partido Popular ✔️'], ['ppopular'], ['Vox'], ['vox_es'], ['Podemos'], ['Sumar'],
    ['Junts per Catalunya'], ['ERC'], ['EH Bildu'], ['PSOE de Madrid'], ['Nuevas Generaciones'],
  ])('%s es cuenta de partido', (id) => expect(isPartyAccount([id])).toBe(true));

  it.each([
    ['María García'], ['voxel_art'], ['Podemos Mejorar'], ['pp_fotos'], ['El País'], [''],
  ])('%s no lo es', (id) => expect(isPartyAccount([id])).toBe(false));
});
