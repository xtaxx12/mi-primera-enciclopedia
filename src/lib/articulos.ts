import type { Articulo, Licencia, Medio } from './tipos';

export function ordenarPorTitulo<T extends { titulo: string }>(lista: T[]): T[] {
  return [...lista].sort((a, b) => a.titulo.localeCompare(b.titulo, 'es'));
}

export function deCategoria(articulos: Articulo[], categoria: string): Articulo[] {
  return ordenarPorTitulo(articulos.filter((a) => a.categoria === categoria));
}

const NOMBRES_LICENCIA: Record<Licencia, string> = {
  'dominio-publico': 'Dominio público',
  cc0: 'CC0',
  'cc-by': 'CC BY',
  'cc-by-sa': 'CC BY-SA',
};

export function textoLicencia(licencia: Licencia): string {
  return NOMBRES_LICENCIA[licencia];
}

/** Medios del artículo para recuadros y galería: la imagen principal primero, sin repetir archivos. */
export function mediosDe(a: Pick<Articulo, 'principal' | 'medios'>): Medio[] {
  const vistos = new Set<string>();
  const lista: Medio[] = [];
  for (const m of [...(a.principal ? [a.principal] : []), ...a.medios]) {
    if (vistos.has(m.archivo)) continue;
    vistos.add(m.archivo);
    lista.push(m);
  }
  return lista;
}
