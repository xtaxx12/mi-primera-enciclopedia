/** Minúsculas y sin diacríticos: "Árbol" → "arbol", "NIÑO" → "nino". */
export function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/\p{M}+/gu, '').toLowerCase();
}

/** Identificador para URLs: "Arte y música" → "arte-y-musica". */
export function slugificar(texto: string): string {
  return normalizar(texto)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
