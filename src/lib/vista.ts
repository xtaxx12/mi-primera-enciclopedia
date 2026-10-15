import type { Caja, VistaAtlas } from './tipos';

export const MUNDO: Caja = [0, 0, 960, 500];
export const ANCHO_MINIMO = 60;

export function suavizar(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
}

export function interpolarCaja(a: Caja, b: Caja, t: number): Caja {
  const s = suavizar(Math.min(1, Math.max(0, t)));
  return a.map((v, i) => v + (b[i] - v) * s) as Caja;
}

/** Mantiene la caja dentro de los límites, con un ancho mínimo y la misma proporción. */
export function limitarCaja(c: Caja, limites: Caja = MUNDO): Caja {
  let [x, y, w, h] = c;
  const crecer = Math.max(ANCHO_MINIMO / w, 1);
  w *= crecer;
  h *= crecer;
  const reducir = Math.min(limites[2] / w, limites[3] / h, 1);
  w *= reducir;
  h *= reducir;
  x = Math.min(Math.max(x, limites[0]), limites[0] + limites[2] - w);
  y = Math.min(Math.max(y, limites[1]), limites[1] + limites[3] - h);
  return [x, y, w, h];
}

/** factor > 1 acerca y < 1 aleja; (cx, cy) es el punto del mapa que queda fijo. */
export function acercar(c: Caja, factor: number, cx: number, cy: number): Caja {
  const [x, y, w, h] = c;
  return limitarCaja([cx - (cx - x) / factor, cy - (cy - y) / factor, w / factor, h / factor]);
}

/** Desplaza la vista como si se arrastrara el mapa dx, dy unidades del mapa. */
export function desplazar(c: Caja, dx: number, dy: number): Caja {
  return limitarCaja([c[0] - dx, c[1] - dy, c[2], c[3]]);
}

/** Convierte un punto en píxeles dentro del SVG (preserveAspectRatio "xMidYMid meet") en coordenadas del mapa. */
export function aCoordenadasMapa(c: Caja, px: number, py: number, anchoPx: number, altoPx: number): [number, number] {
  const escala = Math.min(anchoPx / c[2], altoPx / c[3]);
  const ox = (anchoPx - c[2] * escala) / 2;
  const oy = (altoPx - c[3] * escala) / 2;
  return [c[0] + (px - ox) / escala, c[1] + (py - oy) / escala];
}

const VISTAS: readonly VistaAtlas[] = ['mundo', 'africa', 'america', 'asia', 'europa', 'oceania'];

/** Vista inicial del atlas a partir de `?vista=`; cualquier otro valor da el mundo. */
export function vistaDesdeUrl(busqueda: string): VistaAtlas {
  const vista = new URLSearchParams(busqueda).get('vista');
  return VISTAS.find((v) => v === vista) ?? 'mundo';
}
