import { describe, it, expect } from 'vitest';
import { placasInicio } from '../../src/lib/placas';

describe('placas del inicio', () => {
  it('hay 10 placas: las 8 categorías, Atlas y Juega y aprende', () => {
    expect(placasInicio().map((p) => p.id)).toEqual([
      'animales',
      'planeta-tierra',
      'espacio',
      'cuerpo-humano',
      'historia',
      'arte-y-musica',
      'ciencia-y-tecnologia',
      'paises',
      'atlas',
      'juegos',
    ]);
  });

  it('cada categoría enlaza a su página y a sus subcategorías', () => {
    const animales = placasInicio()[0];
    expect(animales).toMatchObject({ nombre: 'Animales', href: '/categoria/animales' });
    expect(animales.enlaces.map((e) => e.href)).toEqual([
      '/categoria/animales/mamiferos',
      '/categoria/animales/aves',
      '/categoria/animales/reptiles-y-dinosaurios',
      '/categoria/animales/animales-del-mar',
      '/categoria/animales/insectos',
    ]);
  });

  it('Atlas abre cada vista y Juega y aprende lleva a los cuestionarios', () => {
    const [atlas, juegos] = placasInicio().slice(8);
    expect(atlas).toMatchObject({ nombre: 'Atlas', href: '/atlas' });
    expect(atlas.enlaces.map((e) => e.href)).toEqual([
      '/atlas?vista=mundo',
      '/atlas?vista=africa',
      '/atlas?vista=america',
      '/atlas?vista=asia',
      '/atlas?vista=europa',
      '/atlas?vista=oceania',
    ]);
    expect(juegos).toMatchObject({ nombre: 'Juega y aprende', href: '/juegos' });
    expect(juegos.enlaces).toEqual([{ nombre: 'Cuestionarios', icono: '2753', href: '/juegos' }]);
  });
});
