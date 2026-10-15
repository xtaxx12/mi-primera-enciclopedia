import type { CategoriaSlug } from '../config';
import { SUBCATEGORIAS, type Subcategoria } from '../data/subcategorias';

type Reparto = Partial<Record<string, Subcategoria[]>>;

export function subcategoriasDe(categoria: CategoriaSlug, reparto: Reparto = SUBCATEGORIAS): Subcategoria[] {
  return reparto[categoria] ?? [];
}

export function subcategoriaDe(
  slug: string,
  reparto: Reparto = SUBCATEGORIAS,
): { categoria: CategoriaSlug; subcategoria: Subcategoria } | undefined {
  for (const [categoria, subs] of Object.entries(reparto)) {
    const subcategoria = subs?.find((s) => s.articulos.includes(slug));
    if (subcategoria) return { categoria: categoria as CategoriaSlug, subcategoria };
  }
  return undefined;
}

/** Cada artículo debe estar en exactamente una subcategoría de su propia categoría. */
export function validarReparto(articulos: { slug: string; categoria: string }[], reparto: Reparto = SUBCATEGORIAS): string[] {
  const errores: string[] = [];
  const categoriaDe = new Map(articulos.map((a) => [a.slug, a.categoria]));
  const vistos = new Map<string, string>();
  for (const [categoria, subs] of Object.entries(reparto)) {
    const slugs = new Set<string>();
    for (const s of subs ?? []) {
      const donde = `subcategoría «${categoria}/${s.slug}»`;
      if (slugs.has(s.slug)) errores.push(`${donde}: slug repetido`);
      slugs.add(s.slug);
      if (!s.articulos.length) errores.push(`${donde}: está vacía`);
      for (const a of s.articulos) {
        const suya = categoriaDe.get(a);
        if (!suya) errores.push(`${donde}: el artículo «${a}» no existe`);
        else if (suya !== categoria) errores.push(`${donde}: el artículo «${a}» es de la categoría «${suya}»`);
        const previa = vistos.get(a);
        if (previa) errores.push(`${donde}: el artículo «${a}» ya está en «${previa}»`);
        else vistos.set(a, `${categoria}/${s.slug}`);
      }
    }
  }
  for (const a of articulos) {
    if (!vistos.has(a.slug)) errores.push(`artículo «${a.slug}»: no está en ninguna subcategoría de «${a.categoria}»`);
  }
  return errores;
}
