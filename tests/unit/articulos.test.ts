import { describe, it, expect } from 'vitest';
import { deCategoria, ordenarPorTitulo, textoLicencia } from '../../src/lib/articulos';
import type { Articulo } from '../../src/lib/tipos';

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
