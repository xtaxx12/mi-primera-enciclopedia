import { describe, it, expect } from 'vitest';
import { ALTO, ANCHO, generarAtlas } from '../../scripts/atlas/generar';

// Anillos en sentido horario (convención de d3-geo para polígonos "pequeños").
const cuadrado = (x: number, y: number) => ({
  type: 'Polygon' as const,
  coordinates: [[[x, y], [x, y + 10], [x + 10, y + 10], [x + 10, y], [x, y]]],
});

const pais = (ADM0_A3: string, NAME: string, NAME_ES: string | null, CONTINENT: string, POP_EST: number, geometry: unknown) => ({
  type: 'Feature' as const,
  properties: { ADM0_A3, NAME, NAME_ES, CONTINENT, POP_EST },
  geometry,
});

const geo = {
  type: 'FeatureCollection' as const,
  features: [
    pais('ZZB', 'Zeta', 'Zeta', 'Europe', 10.6, cuadrado(10, 40)),
    pais('AAA', 'Alpha', null, 'North America', 5, cuadrado(-100, 20)),
    pais('MMM', 'Mu', 'Ñandú', 'South America', 7, cuadrado(-60, -20)),
    pais('NUL', 'Nada', 'Nada', 'Asia', 1, null),
  ],
};

describe('generarAtlas', () => {
  const { paises, vistas } = generarAtlas(geo);

  it('ordena por nombre en español y usa NAME si falta NAME_ES', () => {
    expect(paises.map((p) => p.nombre)).toEqual(['Alpha', 'Ñandú', 'Zeta']);
  });

  it('traduce continentes, redondea población y genera paths', () => {
    expect(paises[0]).toMatchObject({ adm0: 'AAA', continente: 'América', poblacion: 5 });
    expect(paises[2]).toMatchObject({ adm0: 'ZZB', continente: 'Europa', poblacion: 11 });
    expect(paises.every((p) => p.d.startsWith('M'))).toBe(true);
  });

  it('omite países sin geometría', () => {
    expect(paises.find((p) => p.adm0 === 'NUL')).toBeUndefined();
  });

  it('calcula las seis vistas', () => {
    expect(Object.keys(vistas).sort()).toEqual(['africa', 'america', 'asia', 'europa', 'mundo', 'oceania']);
    expect(vistas.mundo).toEqual([0, 0, ANCHO, ALTO]);
    for (const caja of Object.values(vistas)) {
      expect(caja[2]).toBeGreaterThan(0);
      expect(caja[3]).toBeGreaterThan(0);
    }
  });
});
