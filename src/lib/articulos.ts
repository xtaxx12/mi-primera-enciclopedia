import type { Articulo, Licencia } from './tipos';

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
