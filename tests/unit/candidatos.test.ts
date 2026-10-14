import { describe, it, expect, vi } from 'vitest';
import { formatearCandidatos, listarCandidatos, ordenarCandidatos } from '../../scripts/import/candidatos';

describe('ordenarCandidatos', () => {
  it('pone primero los que no son esbozos y luego por longitud', () => {
    const r = ordenarCandidatos([
      { titulo: 'A', longitud: 9000, esbozo: true },
      { titulo: 'B', longitud: 3000, esbozo: false },
      { titulo: 'C', longitud: 8000, esbozo: false },
    ]);
    expect(r.map((c) => c.titulo)).toEqual(['C', 'B', 'A']);
  });
});

describe('formatearCandidatos', () => {
  it('muestra longitud, título y marca de esbozo', () => {
    expect(formatearCandidatos([{ titulo: 'León', longitud: 14576, esbozo: false }, { titulo: 'Jirafa', longitud: 900, esbozo: true }])).toBe(
      '  14576  León\n    900  Jirafa  [esbozo]',
    );
  });
});

describe('listarCandidatos', () => {
  it('separa páginas y subcategorías y marca los esbozos', async () => {
    const obtenerJson = vi
      .fn()
      .mockResolvedValueOnce({
        query: {
          categorymembers: [
            { ns: 0, title: 'León' },
            { ns: 0, title: 'Jirafa' },
            { ns: 14, title: 'Categoría:Felinos' },
          ],
        },
      })
      .mockResolvedValueOnce({
        query: {
          pages: [
            { title: 'León', length: 14576 },
            { title: 'Jirafa', length: 900, categories: [{ title: 'Categoría:Vikidia:Esbozos' }] },
          ],
        },
      });
    const r = await listarCandidatos({ obtenerJson, descargar: vi.fn() }, 'Mamíferos');
    expect(r.subcategorias).toEqual(['Felinos']);
    expect(r.paginas).toEqual([
      { titulo: 'León', longitud: 14576, esbozo: false },
      { titulo: 'Jirafa', longitud: 900, esbozo: true },
    ]);
    const params = new URL(String(obtenerJson.mock.calls[0][0])).searchParams;
    expect(params.get('cmtitle')).toBe('Categoría:Mamíferos');
  });
});
