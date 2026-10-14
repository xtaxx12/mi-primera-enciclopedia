import { describe, it, expect } from 'vitest';
import { leerCuracion } from '../../scripts/import/curacion';

describe('leerCuracion', () => {
  it('lee categorías y países', () => {
    const yaml = `
categorias:
  - slug: animales
    articulos:
      - titulo: León
        extras:
          - File:Rugido.ogg
      - titulo: Tigre
paises:
  - titulo: México
    adm0: MEX
`;
    expect(leerCuracion(yaml)).toEqual([
      { titulo: 'León', slug: 'leon', categoria: 'animales', extras: ['File:Rugido.ogg'] },
      { titulo: 'Tigre', slug: 'tigre', categoria: 'animales', extras: [] },
      { titulo: 'México', slug: 'mexico', categoria: 'paises', extras: [], adm0: 'MEX' },
    ]);
  });

  it('rechaza categorías desconocidas', () => {
    expect(() => leerCuracion('categorias:\n  - slug: deportes\n    articulos: []\n')).toThrow('Categoría desconocida');
  });

  it('no permite poner países dentro de categorias', () => {
    expect(() => leerCuracion('categorias:\n  - slug: paises\n    articulos: []\n')).toThrow('Categoría desconocida');
  });

  it('exige un código adm0 de 3 letras mayúsculas', () => {
    expect(() => leerCuracion('paises:\n  - titulo: México\n')).toThrow('adm0');
    expect(() => leerCuracion('paises:\n  - titulo: México\n    adm0: mex\n')).toThrow('adm0');
  });

  it('detecta títulos que generan el mismo slug', () => {
    const yaml = 'categorias:\n  - slug: historia\n    articulos:\n      - titulo: Perú\n      - titulo: Peru\n';
    expect(() => leerCuracion(yaml)).toThrow('Slug repetido «peru»');
  });

  it('rechaza entradas sin título', () => {
    expect(() => leerCuracion('categorias:\n  - slug: espacio\n    articulos:\n      - extras: []\n')).toThrow('sin título');
  });
});
