import { describe, it, expect } from 'vitest';
import { validarContenido, type DatosValidacion } from '../../scripts/validar';
import type { Articulo, Cuestionario, Medio, Pregunta } from '../../src/lib/tipos';

const medio = (archivo: string, tipo: Medio['tipo'] = 'imagen'): Medio => ({
  archivo,
  tipo,
  alt: 'x',
  autor: 'Ana',
  licencia: 'cc-by-sa',
  licenciaUrl: 'https://creativecommons.org/licenses/by-sa/4.0',
  fuenteUrl: `https://commons.wikimedia.org/wiki/File:${archivo}`,
});

const articulo = (slug: string, cambios: Partial<Articulo> = {}): Articulo => ({
  slug,
  titulo: slug,
  categoria: 'animales',
  resumen: 'r',
  bloques: [{ tipo: 'html', html: '<p>Hola</p>' }],
  principal: medio(`${slug}.jpg`),
  medios: [medio(`${slug}.jpg`)],
  relacionados: [],
  fuente: { url: 'https://es.vikidia.org/wiki/X', historialUrl: 'https://es.vikidia.org/w/index.php?title=X&action=history', revid: 1, fecha: '2026-10-14' },
  ...cambios,
});

const pregunta = (n: number, cambios: Partial<Pregunta> = {}): Pregunta => ({
  id: `animales-${String(n).padStart(2, '0')}`,
  texto: '¿Pregunta?',
  imagen: 'leon.jpg',
  opciones: ['a', 'b', 'c'],
  correcta: 1,
  articulo: 'leon',
  explicacion: 'Dato.',
  ...cambios,
});

const cuestionario = (preguntas: Pregunta[] = Array.from({ length: 10 }, (_, i) => pregunta(i + 1))): Cuestionario => ({
  slug: 'animales',
  titulo: '¿Cuánto sabes de animales?',
  categoria: 'animales',
  preguntas,
});

const datos = (cambios: Partial<DatosValidacion> = {}): DatosValidacion => ({
  articulos: [
    { id: 'leon', datos: articulo('leon', { relacionados: ['tigre'], bloques: [{ tipo: 'html', html: '<p><a href="/articulo/tigre">tigre</a></p>' }] }) },
    { id: 'tigre', datos: articulo('tigre') },
    { id: 'mexico', datos: articulo('mexico', { categoria: 'paises', pais: { adm0: 'MEX' } }) },
  ],
  cuestionarios: [{ id: 'animales', datos: cuestionario() }],
  adm0Atlas: new Set(['MEX']),
  imagenes: new Set(['leon.jpg', 'tigre.jpg', 'mexico.jpg']),
  publicos: new Set(),
  ...cambios,
});

describe('validarContenido', () => {
  it('acepta contenido válido', () => {
    expect(validarContenido(datos())).toEqual([]);
  });

  it('exige al menos un artículo', () => {
    expect(validarContenido(datos({ articulos: [], cuestionarios: [] }))).toContain('no hay artículos en src/content/articulos');
  });

  it('detecta fuente incompleta y slug distinto del archivo', () => {
    const d = datos();
    d.articulos[1] = { id: 'tigre', datos: articulo('tigrito', { fuente: { url: '', historialUrl: '', revid: 0, fecha: '' } }) };
    const e = validarContenido(d).join('\n');
    expect(e).toContain('el slug «tigrito» no coincide');
    expect(e).toContain('fuente incompleta');
  });

  it('detecta medios sin autor, con licencia no permitida o sin archivo', () => {
    const d = datos();
    d.articulos[1] = { id: 'tigre', datos: articulo('tigre', { principal: undefined, medios: [{ ...medio('tigre.jpg'), autor: ' ', licencia: 'cc-by-nc' as never }, medio('falta.mp3', 'audio')] }) };
    const e = validarContenido(d).join('\n');
    expect(e).toContain('medio «tigre.jpg»: sin autor');
    expect(e).toContain('licencia no permitida «cc-by-nc»');
    expect(e).toContain('medio «falta.mp3»: el archivo no existe');
  });

  it('detecta figuras sin medio, enlaces rotos, relacionados inexistentes y países desconocidos', () => {
    const d = datos();
    d.articulos[0] = {
      id: 'leon',
      datos: articulo('leon', {
        relacionados: ['puma'],
        bloques: [
          { tipo: 'html', html: '<p><a href="/articulo/puma">puma</a></p>' },
          { tipo: 'figura', archivo: 'otra.jpg', pie: '' },
        ],
      }),
    };
    d.adm0Atlas = new Set();
    const e = validarContenido(d).join('\n');
    expect(e).toContain('la figura «otra.jpg» no está entre sus medios');
    expect(e).toContain('enlace interno roto a «puma»');
    expect(e).toContain('relacionado inexistente «puma»');
    expect(e).toContain('el país «MEX» no existe en Natural Earth');
  });

  it('valida los cuestionarios', () => {
    const malas = [
      pregunta(1, { opciones: ['a', 'b'] as never }),
      pregunta(2, { correcta: 3 as never }),
      pregunta(3, { articulo: 'puma' }),
      pregunta(4, { imagen: 'tigre.jpg' }),
      pregunta(4),
    ];
    const e = validarContenido(datos({ cuestionarios: [{ id: 'animales', datos: cuestionario(malas) }] })).join('\n');
    expect(e).toContain('tiene 5 preguntas (deben ser 10)');
    expect(e).toContain('debe tener exactamente 3 opciones');
    expect(e).toContain('debe ser 0, 1 o 2');
    expect(e).toContain('el artículo «puma» no existe');
    expect(e).toContain('la imagen «tigre.jpg» no es una imagen del artículo «leon»');
    expect(e).toContain('id repetido');
  });
});
