import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { subcategoriaDe, subcategoriasDe, validarReparto } from '../../src/lib/subcategorias';
import type { Subcategoria } from '../../src/data/subcategorias';

const reales = readdirSync('src/content/articulos')
  .filter((f) => f.endsWith('.json'))
  .map((f) => JSON.parse(readFileSync(`src/content/articulos/${f}`, 'utf8')) as { slug: string; categoria: string });

const sub = (slug: string, articulos: string[]): Subcategoria => ({ slug, nombre: slug, icono: '2B50', articulos });
const arts = [
  { slug: 'leon', categoria: 'animales' },
  { slug: 'sol', categoria: 'espacio' },
];

describe('reparto real', () => {
  it('cubre cada artículo de su categoría exactamente una vez', () => {
    expect(validarReparto(reales)).toEqual([]);
  });
});

describe('validarReparto', () => {
  it('acepta un reparto completo', () => {
    expect(validarReparto(arts, { animales: [sub('m', ['leon'])], espacio: [sub('s', ['sol'])] })).toEqual([]);
  });

  it('informa un artículo sin subcategoría', () => {
    expect(validarReparto(arts, { animales: [sub('m', ['leon'])] })).toEqual([
      'artículo «sol»: no está en ninguna subcategoría de «espacio»',
    ]);
  });

  it('informa un artículo repetido', () => {
    expect(validarReparto(arts, { animales: [sub('a', ['leon']), sub('b', ['leon'])], espacio: [sub('s', ['sol'])] })).toEqual([
      'subcategoría «animales/b»: el artículo «leon» ya está en «animales/a»',
    ]);
  });

  it('informa un artículo de otra categoría', () => {
    expect(validarReparto(arts, { animales: [sub('m', ['leon', 'sol'])] })).toEqual([
      'subcategoría «animales/m»: el artículo «sol» es de la categoría «espacio»',
    ]);
  });

  it('informa un artículo inexistente', () => {
    expect(validarReparto(arts, { animales: [sub('m', ['leon', 'tigre'])], espacio: [sub('s', ['sol'])] })).toEqual([
      'subcategoría «animales/m»: el artículo «tigre» no existe',
    ]);
  });

  it('informa una subcategoría vacía y un slug repetido', () => {
    const e = validarReparto(arts, { animales: [sub('m', ['leon']), sub('m', [])], espacio: [sub('s', ['sol'])] });
    expect(e).toContain('subcategoría «animales/m»: slug repetido');
    expect(e).toContain('subcategoría «animales/m»: está vacía');
  });
});

describe('consultas', () => {
  it('subcategoriasDe devuelve las de la categoría en orden', () => {
    expect(subcategoriasDe('animales').map((s) => s.slug)).toEqual([
      'mamiferos',
      'aves',
      'reptiles-y-dinosaurios',
      'animales-del-mar',
      'insectos',
    ]);
  });

  it('subcategoriaDe encuentra la subcategoría de un artículo', () => {
    expect(subcategoriaDe('guacamayo')).toMatchObject({ categoria: 'animales', subcategoria: { slug: 'aves' } });
  });

  it('subcategoriaDe devuelve undefined si el artículo no está', () => {
    expect(subcategoriaDe('tigre')).toBeUndefined();
  });
});
