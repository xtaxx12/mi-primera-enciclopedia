import { parse } from 'yaml';
import { SLUGS_CATEGORIAS, type CategoriaSlug } from '../../src/config';
import { slugificar } from '../../src/lib/normalizar';

export interface EntradaCuracion {
  titulo: string;
  slug: string;
  categoria: CategoriaSlug;
  extras: string[];
  adm0?: string;
}

interface Documento {
  categorias?: { slug?: unknown; articulos?: unknown[] }[];
  paises?: unknown[];
}

function entrada(valor: unknown, categoria: CategoriaSlug): EntradaCuracion {
  const v = (valor ?? {}) as { titulo?: unknown; extras?: unknown };
  const titulo = typeof v.titulo === 'string' ? v.titulo.trim() : '';
  const slug = slugificar(titulo);
  if (!titulo || !slug) throw new Error(`Entrada sin título válido en la categoría «${categoria}»`);
  return { titulo, slug, categoria, extras: Array.isArray(v.extras) ? v.extras.map(String) : [] };
}

export function leerCuracion(texto: string): EntradaCuracion[] {
  const doc = (parse(texto) ?? {}) as Documento;
  const entradas: EntradaCuracion[] = [];

  for (const cat of doc.categorias ?? []) {
    const slug = String(cat.slug ?? '');
    if (slug === 'paises' || !(SLUGS_CATEGORIAS as string[]).includes(slug)) {
      throw new Error(`Categoría desconocida en curacion.yaml: «${slug}»`);
    }
    for (const a of cat.articulos ?? []) entradas.push(entrada(a, slug as CategoriaSlug));
  }

  for (const p of doc.paises ?? []) {
    const e = entrada(p, 'paises');
    const adm0 = String((p as { adm0?: unknown }).adm0 ?? '');
    if (!/^[A-Z]{3}$/.test(adm0)) throw new Error(`El país «${e.titulo}» necesita un código adm0 de 3 letras mayúsculas`);
    entradas.push({ ...e, adm0 });
  }

  const vistos = new Map<string, string>();
  for (const e of entradas) {
    const previo = vistos.get(e.slug);
    if (previo) throw new Error(`Slug repetido «${e.slug}»: «${previo}» y «${e.titulo}»`);
    vistos.set(e.slug, e.titulo);
  }
  return entradas;
}
