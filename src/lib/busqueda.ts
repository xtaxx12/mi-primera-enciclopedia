import MiniSearch, { type SearchResult } from 'minisearch';
import { normalizar } from './normalizar';
import { textoPlano } from './texto';
import type { Articulo } from './tipos';

export interface DocBusqueda {
  slug: string;
  titulo: string;
  resumen: string;
  texto: string;
  categoria: string;
}

export interface ResultadoBusqueda {
  slug: string;
  titulo: string;
  resumen: string;
  categoria: string;
}

export interface Fragmento {
  texto: string;
  marcado: boolean;
}

export const LONGITUD_MAXIMA_CONSULTA = 200;

export const OPCIONES_BUSQUEDA = {
  idField: 'slug',
  fields: ['titulo', 'resumen', 'texto'],
  storeFields: ['slug', 'titulo', 'resumen', 'categoria'],
  processTerm: (termino: string) => normalizar(termino) || null,
};

export function documentoDe(a: Articulo): DocBusqueda {
  const html = a.bloques.flatMap((b) => (b.tipo === 'html' ? [b.html] : [])).join(' ');
  return { slug: a.slug, titulo: a.titulo, resumen: a.resumen, texto: textoPlano(html), categoria: a.categoria };
}

export function crearIndice(docs: DocBusqueda[]): MiniSearch<DocBusqueda> {
  const indice = new MiniSearch<DocBusqueda>(OPCIONES_BUSQUEDA);
  indice.addAll(docs);
  return indice;
}

export function cargarIndice(json: string): MiniSearch<DocBusqueda> {
  return MiniSearch.loadJSON<DocBusqueda>(json, OPCIONES_BUSQUEDA);
}

const tieneTexto = (consulta: string) => /[\p{L}\p{N}]/u.test(consulta);

const aResultado = (r: SearchResult): ResultadoBusqueda => ({
  slug: r.slug,
  titulo: r.titulo,
  resumen: r.resumen,
  categoria: r.categoria,
});

export function sugerir(indice: MiniSearch<DocBusqueda>, consulta: string, max = 8): ResultadoBusqueda[] {
  if (!tieneTexto(consulta)) return [];
  return indice
    .search(consulta.slice(0, LONGITUD_MAXIMA_CONSULTA), { fields: ['titulo'], prefix: true, combineWith: 'AND' })
    .slice(0, max)
    .map(aResultado);
}

export function buscar(indice: MiniSearch<DocBusqueda>, consulta: string): ResultadoBusqueda[] {
  if (!tieneTexto(consulta)) return [];
  return indice
    .search(consulta.slice(0, LONGITUD_MAXIMA_CONSULTA), {
      prefix: true,
      fuzzy: 0.2,
      boost: { titulo: 3, resumen: 2 },
      combineWith: 'AND',
    })
    .map(aResultado);
}

/** Divide `texto` en fragmentos marcando las apariciones de los términos de `consulta` (sin acentos ni mayúsculas). */
export function resaltar(texto: string, consulta: string): Fragmento[] {
  if (!texto) return [];
  const terminos = normalizar(consulta)
    .split(/[^\p{L}\p{N}]+/u)
    .filter((t) => t.length >= 2);
  if (!terminos.length) return [{ texto, marcado: false }];

  let normalizado = '';
  const origen: number[] = [];
  for (let i = 0; i < texto.length; ) {
    const caracter = String.fromCodePoint(texto.codePointAt(i)!);
    const n = normalizar(caracter);
    for (let k = 0; k < n.length; k++) {
      normalizado += n[k];
      origen.push(i);
    }
    i += caracter.length;
  }
  origen.push(texto.length);

  const marcas = new Array<boolean>(texto.length).fill(false);
  for (const t of terminos) {
    for (let pos = normalizado.indexOf(t); pos !== -1; pos = normalizado.indexOf(t, pos + t.length)) {
      for (let k = origen[pos]; k < origen[pos + t.length]; k++) marcas[k] = true;
    }
  }

  const fragmentos: Fragmento[] = [];
  for (let i = 0; i < texto.length; i++) {
    const ultimo = fragmentos[fragmentos.length - 1];
    if (ultimo && ultimo.marcado === marcas[i]) ultimo.texto += texto[i];
    else fragmentos.push({ texto: texto[i], marcado: marcas[i] });
  }
  return fragmentos;
}
