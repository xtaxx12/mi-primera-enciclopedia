import { describe, it, expect, vi } from 'vitest';
import {
  API_COMMONS,
  API_VIKIDIA,
  claveArchivo,
  elegirDescarga,
  nombreLocal,
  obtenerMetadatos,
  tipoDe,
  type MetadatosArchivo,
} from '../../scripts/import/metadatos';

const base: MetadatosArchivo = {
  clave: 'X.jpg',
  mime: 'image/jpeg',
  urlOriginal: 'https://upload.wikimedia.org/a/X.jpg',
  urlMiniatura: 'https://upload.wikimedia.org/thumb/a/X.jpg/960px-X.JPG?utm_source=commons',
  fuenteUrl: 'https://commons.wikimedia.org/wiki/File:X.jpg',
  autor: 'Ana',
  licencia: 'cc-by',
  licenciaUrl: '',
  descripcion: '',
  derivados: [],
};

describe('claveArchivo', () => {
  it('quita el prefijo, decodifica y cambia guiones bajos por espacios', () => {
    expect(claveArchivo('Archivo:Lion_waiting_in_Namibia.jpg')).toBe('Lion waiting in Namibia.jpg');
    expect(claveArchivo('File:Le%C3%B3n_rugiendo.jpg')).toBe('León rugiendo.jpg');
    expect(claveArchivo('lion.jpg')).toBe('Lion.jpg');
    expect(claveArchivo('100%_seguro.jpg')).toBe('100% seguro.jpg');
  });
});

describe('tipoDe', () => {
  it('clasifica por MIME', () => {
    expect(tipoDe({ mime: 'image/png', derivados: [] })).toBe('imagen');
    expect(tipoDe({ mime: 'audio/mpeg', derivados: [] })).toBe('audio');
    expect(tipoDe({ mime: 'video/webm', derivados: [] })).toBe('video');
    expect(tipoDe({ mime: 'application/ogg', derivados: [{ tipo: 'video/webm', clave: '480p.vp9.webm', url: 'u' }] })).toBe('video');
    expect(tipoDe({ mime: 'application/ogg', derivados: [] })).toBe('audio');
    expect(tipoDe({ mime: 'application/pdf', derivados: [] })).toBeNull();
  });
});

describe('elegirDescarga', () => {
  it('usa la miniatura de las imágenes', () => {
    expect(elegirDescarga(base)).toEqual({ url: base.urlMiniatura, extension: 'jpg' });
  });
  it('usa el original si no hay miniatura', () => {
    expect(elegirDescarga({ ...base, mime: 'image/png', urlMiniatura: null, urlOriginal: 'https://u/a/Y.png' })).toEqual({ url: 'https://u/a/Y.png', extension: 'png' });
  });
  it('descarta lo que no es imagen, audio ni video', () => {
    expect(elegirDescarga({ ...base, mime: 'application/pdf' })).toBeNull();
  });
  it('prefiere MP3 para el audio', () => {
    expect(elegirDescarga({ ...base, mime: 'audio/mpeg', urlMiniatura: null, urlOriginal: 'https://u/a.mp3' })).toEqual({ url: 'https://u/a.mp3', extension: 'mp3' });
    expect(
      elegirDescarga({ ...base, mime: 'application/ogg', urlMiniatura: null, derivados: [{ tipo: 'audio/mpeg', clave: 'mp3', url: 'https://u/a.ogg.mp3' }] }),
    ).toEqual({ url: 'https://u/a.ogg.mp3', extension: 'mp3' });
  });
  it('acepta Ogg con aviso si no hay MP3', () => {
    const r = elegirDescarga({ ...base, mime: 'audio/ogg', urlMiniatura: null, urlOriginal: 'https://u/a.ogg' });
    expect(r).toMatchObject({ url: 'https://u/a.ogg', extension: 'ogg' });
    expect(r?.aviso).toContain('Safari');
  });
  it('elige WebM de 480p con aviso si no hay MP4', () => {
    const derivados = [
      { tipo: 'video/webm; codecs="vp9, opus"', clave: '240p.vp9.webm', url: 'https://u/240.webm' },
      { tipo: 'video/webm; codecs="vp9, opus"', clave: '480p.vp9.webm', url: 'https://u/480.webm' },
    ];
    const r = elegirDescarga({ ...base, mime: 'video/webm', urlMiniatura: null, derivados });
    expect(r).toMatchObject({ url: 'https://u/480.webm', extension: 'webm' });
    expect(r?.aviso).toContain('WebM');
  });
  it('prefiere MP4 para el video', () => {
    const derivados = [{ tipo: 'video/mp4', clave: '480p.mp4', url: 'https://u/480.mp4' }];
    expect(elegirDescarga({ ...base, mime: 'video/webm', urlMiniatura: null, derivados })).toEqual({ url: 'https://u/480.mp4', extension: 'mp4' });
  });
});

describe('nombreLocal', () => {
  it('genera un nombre seguro y estable', () => {
    const a = nombreLocal('Lion waiting in Namibia.jpg', 'jpg');
    expect(a).toMatch(/^lion-waiting-in-namibia-[0-9a-f]{8}\.jpg$/);
    expect(nombreLocal('Lion waiting in Namibia.jpg', 'jpg')).toBe(a);
    expect(nombreLocal('¿?.png', 'png')).toMatch(/^archivo-[0-9a-f]{8}\.png$/);
  });
});

const respuestaVikidia = {
  query: {
    pages: [
      {
        title: 'Archivo:Lion waiting in Namibia.jpg',
        missing: true,
        known: true,
        imagerepository: 'commonswiki',
        imageinfo: [
          {
            mime: 'image/jpeg',
            url: 'https://upload.wikimedia.org/wikipedia/commons/7/73/Lion_waiting_in_Namibia.jpg',
            thumburl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/73/Lion_waiting_in_Namibia.jpg/960px-Lion_waiting_in_Namibia.jpg',
            descriptionurl: 'https://commons.wikimedia.org/wiki/File:Lion_waiting_in_Namibia.jpg',
            extmetadata: {
              Artist: { value: '<a href="https://www.flickr.com/photos/x">Kevin Pluck</a>' },
              License: { value: 'cc-by-2.0' },
              LicenseUrl: { value: 'https://creativecommons.org/licenses/by/2.0' },
              ImageDescription: { value: '<i>León</i> descansando' },
            },
          },
        ],
      },
      {
        title: 'Archivo:Cabeza olmeca.jpg',
        imagerepository: 'local',
        imageinfo: [
          {
            mime: 'image/jpeg',
            url: 'https://download.vikidia.org/es/images/4/4a/Cabeza_olmeca.jpg',
            descriptionurl: 'https://es.vikidia.org/wiki/Archivo:Cabeza_olmeca.jpg',
            extmetadata: {},
          },
        ],
      },
    ],
  },
};

describe('obtenerMetadatos', () => {
  it('interpreta archivos de Commons y locales desde Vikidia', async () => {
    const cliente = { obtenerJson: vi.fn(async () => respuestaVikidia), descargar: vi.fn() };
    const m = await obtenerMetadatos(cliente, API_VIKIDIA, ['Lion_waiting_in_Namibia.jpg', 'Archivo:Cabeza_olmeca.jpg']);
    const url = String(cliente.obtenerJson.mock.calls[0][0]);
    expect(url.startsWith(API_VIKIDIA)).toBe(true);
    expect(new URL(url).searchParams.get('titles')).toBe('Archivo:Lion waiting in Namibia.jpg|Archivo:Cabeza olmeca.jpg');
    expect(new URL(url).searchParams.get('prop')).toBe('imageinfo');
    expect(m.get('Lion waiting in Namibia.jpg')).toMatchObject({
      autor: 'Kevin Pluck',
      licencia: 'cc-by',
      descripcion: 'León descansando',
      fuenteUrl: 'https://commons.wikimedia.org/wiki/File:Lion_waiting_in_Namibia.jpg',
    });
    expect(m.get('Cabeza olmeca.jpg')).toMatchObject({ autor: '', licencia: null });
  });

  it('pide de a 50 títulos', async () => {
    const cliente = { obtenerJson: vi.fn(async () => ({ query: { pages: [] } })), descargar: vi.fn() };
    const nombres = Array.from({ length: 120 }, (_, i) => `Foto ${i}.jpg`);
    await obtenerMetadatos(cliente, API_VIKIDIA, nombres);
    expect(cliente.obtenerJson).toHaveBeenCalledTimes(3);
  });

  it('usa File: y videoinfo con Commons', async () => {
    const cliente = { obtenerJson: vi.fn(async () => ({ query: { pages: [] } })), descargar: vi.fn() };
    await obtenerMetadatos(cliente, API_COMMONS, ['Rugido.ogg']);
    const params = new URL(String(cliente.obtenerJson.mock.calls[0][0])).searchParams;
    expect(params.get('titles')).toBe('File:Rugido.ogg');
    expect(params.get('prop')).toBe('videoinfo');
    expect(params.get('viprop')).toBe('url|mime|extmetadata|derivatives');
  });
});
