const ENTIDADES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };

export function decodificarEntidades(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (original, e: string) => {
    if (e.startsWith('#')) {
      const n = e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isInteger(n) && n > 0 && n <= 0x10ffff ? String.fromCodePoint(n) : original;
    }
    return ENTIDADES[e.toLowerCase()] ?? original;
  });
}

const ETIQUETAS_DE_BLOQUE = /<\/?(p|div|h[1-6]|li|ul|ol|br|tr|td|th|table|figure|figcaption)\b[^>]*>/gi;

/** Las etiquetas de bloque separan palabras; las de línea (b, i, a…) no agregan espacios. */
export function textoPlano(html: string): string {
  return decodificarEntidades(html.replace(ETIQUETAS_DE_BLOQUE, ' ').replace(/<[^>]*>/g, ''))
    .replace(/\s+/g, ' ')
    .trim();
}

export function recortar(texto: string, max = 300): string {
  if (texto.length <= max) return texto;
  const corte = texto.slice(0, max - 1);
  const espacio = corte.lastIndexOf(' ');
  return `${(espacio > max * 0.6 ? corte.slice(0, espacio) : corte).trimEnd()}…`;
}
