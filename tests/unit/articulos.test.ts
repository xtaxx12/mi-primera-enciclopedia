import { describe, it, expect } from 'vitest';
import { deCategoria, mediosDe, ordenarPorTitulo, textoLicencia } from '../../src/lib/articulos';
import type { Articulo, Medio } from '../../src/lib/tipos';

const art = (slug: string, titulo: string, categoria: Articulo['categoria']): Articulo => ({
  slug,
  titulo,
  categoria,
  resumen: '',
  bloques: [],
  medios: [],
  relacionados: [],
  fuente: { url: 'https://x', historialUrl: 'https://x', revid: 1, fecha: '2026-10-14' },
});

describe('articulos', () => {
  it('ordena por título en español', () => {
    expect(ordenarPorTitulo([{ titulo: 'Zorro' }, { titulo: 'oso' }, { titulo: 'Águila' }]).map((x) => x.titulo)).toEqual([
      'Águila',
      'oso',
      'Zorro',
    ]);
  });

  it('filtra por categoría y ordena', () => {
    const r = deCategoria([art('tigre', 'Tigre', 'animales'), art('sol', 'Sol', 'espacio'), art('aguila', 'Águila', 'animales')], 'animales');
    expect(r.map((a) => a.slug)).toEqual(['aguila', 'tigre']);
  });

  it('muestra el nombre de cada licencia', () => {
    expect(textoLicencia('dominio-publico')).toBe('Dominio público');
    expect(textoLicencia('cc0')).toBe('CC0');
    expect(textoLicencia('cc-by')).toBe('CC BY');
    expect(textoLicencia('cc-by-sa')).toBe('CC BY-SA');
  });
});

describe('mediosDe', () => {
  const m = (archivo: string): Medio => ({
    archivo,
    tipo: 'imagen',
    alt: archivo,
    autor: 'Ana',
    licencia: 'cc-by',
    licenciaUrl: '',
    fuenteUrl: `https://commons.wikimedia.org/wiki/File:${archivo}`,
  });

  it('pone la principal primero y no repite archivos', () => {
    expect(mediosDe({ principal: m('a.jpg'), medios: [m('b.jpg'), m('a.jpg'), m('c.jpg')] }).map((x) => x.archivo)).toEqual(['a.jpg', 'b.jpg', 'c.jpg']);
  });

  it('funciona sin principal y sin medios', () => {
    expect(mediosDe({ medios: [m('b.jpg')] }).map((x) => x.archivo)).toEqual(['b.jpg']);
    expect(mediosDe({ medios: [] })).toEqual([]);
  });
});
