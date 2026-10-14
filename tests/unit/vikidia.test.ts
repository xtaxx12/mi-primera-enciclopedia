import { describe, it, expect, vi } from 'vitest';
import { esEsbozo, obtenerArticulo, urlArticulo, urlHistorial } from '../../scripts/import/vikidia';

const cliente = (respuesta: unknown) => ({ obtenerJson: vi.fn(async () => respuesta), descargar: vi.fn() });

describe('obtenerArticulo', () => {
  it('pide el artículo con redirecciones y lo interpreta', async () => {
    const c = cliente({
      parse: {
        title: 'Panthera leo',
        revid: 158442,
        text: '<div class="mw-parser-output"><p>Hola</p></div>',
        categories: [{ category: 'Felinos' }, { category: 'Vikidia:Artículos_sin_referencias' }],
      },
    });
    const r = await obtenerArticulo(c, 'León');
    const params = new URL(String(c.obtenerJson.mock.calls[0][0])).searchParams;
    expect(params.get('page')).toBe('León');
    expect(params.get('redirects')).toBe('1');
    expect(params.get('prop')).toBe('text|categories|revid');
    expect(r).toEqual({
      tituloResuelto: 'Panthera leo',
      html: '<div class="mw-parser-output"><p>Hola</p></div>',
      categorias: ['Felinos', 'Vikidia:Artículos sin referencias'],
      revid: 158442,
    });
  });

  it('devuelve null si el artículo no existe', async () => {
    expect(await obtenerArticulo(cliente({ error: { code: 'missingtitle' } }), 'Nada')).toBeNull();
  });

  it('lanza un error ante otros errores de la API', async () => {
    await expect(obtenerArticulo(cliente({ error: { code: 'ratelimited' } }), 'León')).rejects.toThrow('ratelimited');
  });
});

describe('utilidades', () => {
  it('detecta esbozos', () => {
    expect(esEsbozo({ tituloResuelto: 'X', html: '', revid: 1, categorias: ['Vikidia:Esbozos'] })).toBe(true);
    expect(esEsbozo({ tituloResuelto: 'X', html: '', revid: 1, categorias: ['Mamíferos'] })).toBe(false);
  });

  it('arma las URL de Vikidia', () => {
    expect(urlArticulo('Panthera leo')).toBe('https://es.vikidia.org/wiki/Panthera_leo');
    expect(urlArticulo('México')).toBe('https://es.vikidia.org/wiki/M%C3%A9xico');
    expect(urlHistorial('Panthera leo')).toBe('https://es.vikidia.org/w/index.php?title=Panthera_leo&action=history');
  });
});
