import type { ClienteHttp } from './http';
import { API_VIKIDIA } from './metadatos';

export interface ArticuloCrudo {
  tituloResuelto: string;
  html: string;
  categorias: string[];
  revid: number;
}

interface RespuestaParse {
  error?: { code: string };
  parse?: { title: string; text: string; revid: number; categories?: { category: string }[] };
}

export async function obtenerArticulo(cliente: ClienteHttp, titulo: string): Promise<ArticuloCrudo | null> {
  const params = new URLSearchParams({
    action: 'parse',
    page: titulo,
    prop: 'text|categories|revid',
    redirects: '1',
    format: 'json',
    formatversion: '2',
  });
  const datos = (await cliente.obtenerJson(`${API_VIKIDIA}?${params}`)) as RespuestaParse;
  if (datos.error) {
    if (datos.error.code === 'missingtitle') return null;
    throw new Error(`Vikidia respondió ${datos.error.code} para «${titulo}»`);
  }
  const p = datos.parse!;
  return {
    tituloResuelto: p.title,
    html: p.text,
    categorias: (p.categories ?? []).map((c) => c.category.replace(/_/g, ' ')),
    revid: p.revid,
  };
}

export function esEsbozo(c: ArticuloCrudo): boolean {
  return c.categorias.includes('Vikidia:Esbozos');
}

function rutaWiki(titulo: string): string {
  return encodeURIComponent(titulo.replace(/ /g, '_')).replace(/%2F/g, '/');
}

export function urlArticulo(titulo: string): string {
  return `https://es.vikidia.org/wiki/${rutaWiki(titulo)}`;
}

export function urlHistorial(titulo: string): string {
  return `https://es.vikidia.org/w/index.php?title=${rutaWiki(titulo)}&action=history`;
}
