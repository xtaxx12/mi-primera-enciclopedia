import { describe, it, expect } from 'vitest';
import { buscar, cargarIndice, crearIndice, documentoDe, resaltar, sugerir, type DocBusqueda } from '../../src/lib/busqueda';
import type { Articulo } from '../../src/lib/tipos';

const docs: DocBusqueda[] = [
  { slug: 'arbol', titulo: 'Árbol', resumen: 'Planta grande con tronco.', texto: 'Tiene hojas y raíces.', categoria: 'planeta-tierra' },
  { slug: 'leon', titulo: 'León', resumen: 'Felino grande de África.', texto: 'El león es el rey de la sabana.', categoria: 'animales' },
  { slug: 'leopardo', titulo: 'Leopardo', resumen: 'Felino con manchas.', texto: 'El leopardo trepa árboles.', categoria: 'animales' },
  { slug: 'nino', titulo: 'Niño', resumen: 'Persona pequeña.', texto: 'Los niños juegan.', categoria: 'cuerpo-humano' },
];
const indice = crearIndice(docs);

describe('sugerir', () => {
  it('sugiere títulos por prefijo, sin importar acentos', () => {
    const titulos = sugerir(indice, 'leo').map((r) => r.titulo);
    expect(titulos).toContain('León');
    expect(titulos).toContain('Leopardo');
    expect(sugerir(indice, 'arb').map((r) => r.titulo)).toEqual(['Árbol']);
  });

  it('respeta el máximo de sugerencias', () => {
    expect(sugerir(indice, 'l', 1)).toHaveLength(1);
  });
});

describe('buscar', () => {
  it('encuentra sin acentos y prioriza el título', () => {
    expect(buscar(indice, 'arbol')[0].slug).toBe('arbol');
    expect(buscar(indice, 'NIÑO')[0].slug).toBe('nino');
  });

  it('tolera errores de escritura', () => {
    expect(buscar(indice, 'lein').map((r) => r.slug)).toContain('leon');
  });

  it('no falla con consultas vacías, de solo signos o muy largas', () => {
    expect(buscar(indice, '')).toEqual([]);
    expect(buscar(indice, '   ')).toEqual([]);
    expect(buscar(indice, '¿?!')).toEqual([]);
    expect(sugerir(indice, '  ')).toEqual([]);
    expect(() => buscar(indice, 'a'.repeat(500))).not.toThrow();
    expect(() => buscar(indice, 'león '.repeat(100))).not.toThrow();
  });

  it('funciona igual con el índice serializado', () => {
    const copia = cargarIndice(JSON.stringify(indice));
    expect(buscar(copia, 'arbol')[0].slug).toBe('arbol');
  });
});

describe('resaltar', () => {
  it('marca el término respetando el texto original', () => {
    expect(resaltar('El León come', 'leon')).toEqual([
      { texto: 'El ', marcado: false },
      { texto: 'León', marcado: true },
      { texto: ' come', marcado: false },
    ]);
    expect(resaltar('Árbol', 'ARBOL')).toEqual([{ texto: 'Árbol', marcado: true }]);
  });

  it('no marca nada si la consulta no tiene términos', () => {
    expect(resaltar('texto', '  ')).toEqual([{ texto: 'texto', marcado: false }]);
    expect(resaltar('', 'x')).toEqual([]);
  });
});

describe('documentoDe', () => {
  it('extrae el texto plano de los bloques HTML', () => {
    const a: Articulo = {
      slug: 'sol',
      titulo: 'Sol',
      categoria: 'espacio',
      resumen: 'La estrella.',
      bloques: [{ tipo: 'html', html: '<p>Es una <b>estrella</b>.</p>' }, { tipo: 'figura', archivo: 'x.jpg', pie: 'Foto' }],
      medios: [],
      relacionados: [],
      fuente: { url: 'https://x', historialUrl: 'https://x', revid: 1, fecha: '2026-10-14' },
    };
    expect(documentoDe(a)).toEqual({ slug: 'sol', titulo: 'Sol', resumen: 'La estrella.', texto: 'Es una estrella.', categoria: 'espacio' });
  });
});
