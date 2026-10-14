import { createHash } from 'node:crypto';
import type { ClienteHttp } from './http';
import type { Licencia, TipoMedio } from '../../src/lib/tipos';
import { licenciaPermitida } from './licencias';
import { textoPlano } from '../../src/lib/texto';
import { slugificar } from '../../src/lib/normalizar';

export const API_VIKIDIA = 'https://es.vikidia.org/w/api.php';
export const API_COMMONS = 'https://commons.wikimedia.org/w/api.php';

export interface Derivado {
  tipo: string;
  clave: string | null;
  url: string;
}

export interface MetadatosArchivo {
  clave: string;
  mime: string;
  urlOriginal: string;
  urlMiniatura: string | null;
  fuenteUrl: string;
  autor: string;
  licencia: Licencia | null;
  licenciaUrl: string;
  descripcion: string;
  derivados: Derivado[];
}

export interface Descarga {
  url: string;
  extension: string;
  aviso?: string;
}

interface InfoApi {
  mime?: string;
  url?: string;
  thumburl?: string;
  descriptionurl?: string;
  extmetadata?: Record<string, { value: string }>;
  derivatives?: { type?: string; transcodekey?: string; src: string }[];
}

interface PaginaApi {
  title: string;
  imageinfo?: InfoApi[];
  videoinfo?: InfoApi[];
}

/** "Archivo:Lion_waiting.jpg" → "Lion waiting.jpg" (como lo normaliza MediaWiki). */
export function claveArchivo(nombre: string): string {
  let n = nombre.replace(/^(archivo|file|imagen|image):/i, '');
  try {
    n = decodeURIComponent(n);
  } catch {
    // contiene un "%" literal: se deja tal cual
  }
  n = n.replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
  return n.charAt(0).toUpperCase() + n.slice(1);
}

export async function obtenerMetadatos(
  cliente: ClienteHttp,
  api: string,
  nombres: string[],
): Promise<Map<string, MetadatosArchivo>> {
  const claves = [...new Set(nombres.map(claveArchivo))];
  const resultado = new Map<string, MetadatosArchivo>();
  const esCommons = api === API_COMMONS;
  const prefijo = esCommons ? 'File:' : 'Archivo:';
  const prop = esCommons ? 'videoinfo' : 'imageinfo';
  const p = esCommons ? 'vi' : 'ii';

  for (let i = 0; i < claves.length; i += 50) {
    const lote = claves.slice(i, i + 50);
    const params = new URLSearchParams({
      action: 'query',
      format: 'json',
      formatversion: '2',
      titles: lote.map((c) => prefijo + c).join('|'),
      prop,
      [`${p}prop`]: esCommons ? 'url|mime|extmetadata|derivatives' : 'url|mime|extmetadata',
      [`${p}urlwidth`]: '500',
      [`${p}extmetadatafilter`]: 'Artist|LicenseShortName|License|LicenseUrl|ImageDescription',
    });
    const datos = (await cliente.obtenerJson(`${api}?${params}`)) as { query?: { pages?: PaginaApi[] } };
    for (const pagina of datos.query?.pages ?? []) {
      const info = pagina.imageinfo?.[0] ?? pagina.videoinfo?.[0];
      if (!info?.url) continue;
      const meta = info.extmetadata ?? {};
      const clave = claveArchivo(pagina.title);
      resultado.set(clave, {
        clave,
        mime: info.mime ?? '',
        urlOriginal: info.url,
        urlMiniatura: info.thumburl ?? null,
        fuenteUrl: info.descriptionurl ?? '',
        autor: textoPlano(meta.Artist?.value ?? ''),
        licencia: licenciaPermitida(meta.License?.value),
        licenciaUrl: meta.LicenseUrl?.value ?? '',
        descripcion: textoPlano(meta.ImageDescription?.value ?? '').slice(0, 160),
        derivados: (info.derivatives ?? []).map((d) => ({ tipo: d.type ?? '', clave: d.transcodekey ?? null, url: d.src })),
      });
    }
  }
  return resultado;
}

export function tipoDe(m: Pick<MetadatosArchivo, 'mime' | 'derivados'>): TipoMedio | null {
  if (m.mime.startsWith('image/')) return 'imagen';
  if (m.mime.startsWith('audio/')) return 'audio';
  if (m.mime.startsWith('video/')) return 'video';
  if (m.mime === 'application/ogg') return m.derivados.some((d) => d.tipo.startsWith('video/')) ? 'video' : 'audio';
  return null;
}

const EXTENSIONES_IMAGEN = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp']);

function extensionDe(url: string): string {
  const m = /\.([a-z0-9]+)$/i.exec(new URL(url).pathname);
  return m ? m[1].toLowerCase() : '';
}

export function elegirDescarga(m: MetadatosArchivo): Descarga | null {
  const tipo = tipoDe(m);
  if (tipo === 'imagen') {
    const url = m.urlMiniatura ?? m.urlOriginal;
    const extension = extensionDe(url);
    if (!EXTENSIONES_IMAGEN.has(extension)) return null;
    return { url, extension: extension === 'jpeg' ? 'jpg' : extension };
  }
  if (tipo === 'audio') {
    if (m.mime === 'audio/mpeg') return { url: m.urlOriginal, extension: 'mp3' };
    const mp3 = m.derivados.find((d) => d.tipo.startsWith('audio/mpeg'));
    if (mp3) return { url: mp3.url, extension: 'mp3' };
    const ogg = m.derivados.find((d) => d.tipo.startsWith('audio/ogg'))?.url ?? (/ogg/.test(m.mime) ? m.urlOriginal : null);
    return ogg ? { url: ogg, extension: 'ogg', aviso: 'solo hay audio Ogg; puede no sonar en Safari' } : null;
  }
  if (tipo === 'video') {
    const mp4 = m.derivados.find((d) => d.tipo.startsWith('video/mp4'));
    if (mp4) return { url: mp4.url, extension: 'mp4' };
    for (const clave of ['480p.vp9.webm', '360p.vp9.webm', '240p.vp9.webm']) {
      const d = m.derivados.find((x) => x.clave === clave);
      if (d) return { url: d.url, extension: 'webm', aviso: 'solo hay video WebM' };
    }
    if (m.mime === 'video/webm') return { url: m.urlOriginal, extension: 'webm', aviso: 'solo hay video WebM' };
  }
  return null;
}

export function nombreLocal(clave: string, extension: string): string {
  const base = clave.replace(/\.[^.]+$/, '');
  const hash = createHash('sha1').update(clave).digest('hex').slice(0, 8);
  return `${slugificar(base).slice(0, 60) || 'archivo'}-${hash}.${extension}`;
}
