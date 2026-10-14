import { describe, it, expect } from 'vitest';
import {
  clavesDeImagenes,
  completarRelacionados,
  construirArticulo,
  motivoRechazo,
  prepararMedio,
  textoAlternativo,
} from '../../scripts/import/ensamblar';
import type { ResultadoLimpieza } from '../../scripts/import/limpiar';
import type { MetadatosArchivo } from '../../scripts/import/metadatos';
import type { Articulo, Medio } from '../../src/lib/tipos';

const limpieza = (cambios: Partial<ResultadoLimpieza> = {}): ResultadoLimpieza => ({
  bloques: [{ tipo: 'html', html: '<p>El león.</p>' }],
  resumen: 'El león.',
  palabras: 200,
  enlacesInternos: [],
  imagenes: [],
  ...cambios,
});

const crudo = { tituloResuelto: 'Panthera leo', html: '', categorias: [], revid: 158442 };

const medio = (archivo: string, tipo: Medio['tipo'] = 'imagen'): Medio => ({
  archivo,
  tipo,
  alt: archivo,
  autor: 'Ana',
  licencia: 'cc-by',
  licenciaUrl: '',
  fuenteUrl: `https://commons.wikimedia.org/wiki/File:${archivo}`,
});

describe('motivoRechazo', () => {
  it('rechaza artículos inexistentes, esbozos y cortos', () => {
    expect(motivoRechazo(null, null)).toBe('no existe en Vikidia');
    expect(motivoRechazo({ ...crudo, categorias: ['Vikidia:Esbozos'] }, limpieza())).toBe('es un esbozo');
    expect(motivoRechazo(crudo, limpieza({ palabras: 149 }))).toBe('solo 149 palabras (mínimo 150)');
    expect(motivoRechazo(crudo, limpieza({ palabras: 150 }))).toBeNull();
  });
});

describe('prepararMedio', () => {
  const base: MetadatosArchivo = {
    clave: 'Leona.jpg',
    mime: 'image/jpeg',
    urlOriginal: 'https://u/Leona.jpg',
    urlMiniatura: 'https://u/thumb/960px-Leona.jpg',
    fuenteUrl: 'https://commons.wikimedia.org/wiki/File:Leona.jpg',
    autor: 'Ana',
    licencia: 'cc-by-sa',
    licenciaUrl: 'https://creativecommons.org/licenses/by-sa/4.0',
    descripcion: '',
    derivados: [],
  };

  it('prepara una imagen con licencia permitida', () => {
    const r = prepararMedio(base, 'Una leona');
    expect(r).toMatchObject({ medio: { tipo: 'imagen', alt: 'Una leona', autor: 'Ana', licencia: 'cc-by-sa' }, descarga: { extension: 'jpg' } });
    expect('medio' in r && r.medio.archivo).toMatch(/^leona-[0-9a-f]{8}\.jpg$/);
  });

  it('descarta archivos sin licencia, sin autor o de tipo no soportado', () => {
    expect(prepararMedio({ ...base, licencia: null }, 'x')).toEqual({ descartado: 'licencia no permitida o desconocida' });
    expect(prepararMedio({ ...base, autor: '' }, 'x')).toEqual({ descartado: 'sin autor' });
    expect(prepararMedio({ ...base, mime: 'application/pdf' }, 'x')).toEqual({ descartado: 'tipo no soportado (application/pdf)' });
  });
});

describe('textoAlternativo', () => {
  it('usa el pie de la figura y, si no hay, el título del artículo', () => {
    expect(textoAlternativo('Una leona', 'León')).toBe('Una leona');
    expect(textoAlternativo(undefined, 'León')).toBe('León');
    expect(textoAlternativo('   ', 'León')).toBe('León');
  });
});

describe('clavesDeImagenes', () => {
  it('toma hasta 6 imágenes y agrega las de las figuras', () => {
    const imagenes = Array.from({ length: 10 }, (_, i) => `F${i}.jpg`);
    const r = clavesDeImagenes(limpieza({ imagenes, bloques: [{ tipo: 'figura', archivo: 'F9.jpg', pie: '' }] }));
    expect(r).toEqual([...imagenes.slice(0, 6), 'F9.jpg']);
  });
});

describe('construirArticulo', () => {
  const medios = new Map<string, Medio>([
    ['Lion waiting in Namibia.jpg', medio('lion.jpg')],
    ['Leona.jpg', medio('leona.jpg')],
    ['Rugido de león.ogg', medio('rugido.mp3', 'audio')],
  ]);
  const entrada = { titulo: 'León', slug: 'leon', categoria: 'animales' as const, extras: ['File:Rugido_de_león.ogg'] };
  const l = limpieza({
    bloques: [
      { tipo: 'html', html: '<p>El león.</p>' },
      { tipo: 'figura', archivo: 'Leona.jpg', pie: 'Una leona' },
      { tipo: 'figura', archivo: 'Sin licencia.jpg', pie: 'x' },
    ],
    enlacesInternos: ['tigre', 'leon'],
    imagenes: ['Lion waiting in Namibia.jpg', 'Leona.jpg', 'Sin licencia.jpg'],
  });

  it('arma el artículo con medios locales, figuras válidas y fuente', () => {
    const a = construirArticulo({ entrada, crudo, limpieza: l, medios, fecha: '2026-10-14' });
    expect(a.slug).toBe('leon');
    expect(a.titulo).toBe('León');
    expect(a.principal?.archivo).toBe('lion.jpg');
    expect(a.medios.map((m) => m.archivo)).toEqual(['lion.jpg', 'leona.jpg', 'rugido.mp3']);
    expect(a.bloques).toEqual([
      { tipo: 'html', html: '<p>El león.</p>' },
      { tipo: 'figura', archivo: 'leona.jpg', pie: 'Una leona' },
    ]);
    expect(a.relacionados).toEqual(['tigre']);
    expect(a.pais).toBeUndefined();
    expect(a.fuente).toEqual({
      url: 'https://es.vikidia.org/wiki/Panthera_leo',
      historialUrl: 'https://es.vikidia.org/w/index.php?title=Panthera_leo&action=history',
      revid: 158442,
      fecha: '2026-10-14',
    });
  });

  it('agrega el país si la entrada tiene adm0', () => {
    const a = construirArticulo({ entrada: { ...entrada, slug: 'mexico', titulo: 'México', categoria: 'paises', adm0: 'MEX' }, crudo, limpieza: l, medios, fecha: '2026-10-14' });
    expect(a.pais).toEqual({ adm0: 'MEX' });
  });
});

describe('completarRelacionados', () => {
  const art = (slug: string, titulo: string, categoria: Articulo['categoria'], relacionados: string[] = []): Articulo => ({
    slug,
    titulo,
    categoria,
    resumen: '',
    bloques: [],
    medios: [],
    relacionados,
    fuente: { url: 'https://x', historialUrl: 'https://x', revid: 1, fecha: '2026-10-14' },
  });

  it('quita los inexistentes y completa con la misma categoría en orden alfabético', () => {
    const r = completarRelacionados([
      art('leon', 'León', 'animales', ['no-existe', 'tigre']),
      art('tigre', 'Tigre', 'animales'),
      art('aguila', 'Águila', 'animales'),
      art('oso', 'Oso', 'animales'),
      art('sol', 'Sol', 'espacio'),
    ]);
    expect(r[0].relacionados).toEqual(['tigre', 'aguila', 'oso']);
    expect(r[4].relacionados).toEqual([]);
  });

  it('limita a 6 relacionados', () => {
    const muchos = Array.from({ length: 10 }, (_, i) => `a${i}`);
    const r = completarRelacionados([art('x', 'X', 'historia', muchos), ...muchos.map((s) => art(s, s, 'historia'))]);
    expect(r[0].relacionados).toHaveLength(6);
  });
});
