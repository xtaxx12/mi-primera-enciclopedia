import { describe, it, expect } from 'vitest';
import { aCoordenadasMapa, acercar, desplazar, interpolarCaja, limitarCaja, MUNDO } from '../../src/lib/vista';
import type { Caja } from '../../src/lib/tipos';

describe('vista del atlas', () => {
  it('interpola entre dos cajas', () => {
    const a: Caja = [0, 0, 960, 500];
    const b: Caja = [400, 20, 200, 120];
    expect(interpolarCaja(a, b, 0)).toEqual(a);
    expect(interpolarCaja(a, b, 1)).toEqual(b);
    expect(interpolarCaja(a, b, 0.5)).toEqual([200, 10, 580, 310]);
  });

  it('acerca manteniendo fijo el punto elegido', () => {
    expect(acercar(MUNDO, 2, 480, 250)).toEqual([240, 125, 480, 250]);
  });

  it('no acerca más allá del ancho mínimo ni aleja más allá del mundo', () => {
    expect(acercar(MUNDO, 100, 480, 250)[2]).toBe(60);
    expect(acercar(MUNDO, 0.5, 480, 250)).toEqual(MUNDO);
  });

  it('desplaza sin salirse del mapa', () => {
    expect(desplazar([0, 0, 480, 250], 100, 0)).toEqual([0, 0, 480, 250]);
    expect(desplazar([240, 125, 480, 250], 100, 50)).toEqual([140, 75, 480, 250]);
    expect(limitarCaja([900, 400, 480, 250])).toEqual([480, 250, 480, 250]);
  });

  it('convierte píxeles de pantalla en coordenadas del mapa', () => {
    expect(aCoordenadasMapa(MUNDO, 480, 250, 960, 500)).toEqual([480, 250]);
    expect(aCoordenadasMapa(MUNDO, 960, 500, 1920, 1000)).toEqual([480, 250]);
    expect(aCoordenadasMapa([240, 125, 480, 250], 0, 0, 960, 500)).toEqual([240, 125]);
  });
});
