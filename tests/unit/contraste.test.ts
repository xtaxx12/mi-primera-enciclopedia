import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

const tokens = readFileSync('src/styles/tokens.css', 'utf8');
const ventana = readFileSync('src/components/Ventana.astro', 'utf8');

function token(nombre: string): string {
  const m = new RegExp(`--${nombre}:\\s*([^;]+);`).exec(tokens);
  if (!m) throw new Error(`Falta el token --${nombre}`);
  return m[1].trim();
}

function rgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as [number, number, number];
}

function luminancia([r, g, b]: [number, number, number]): number {
  const canal = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * canal(r) + 0.7152 * canal(g) + 0.0722 * canal(b);
}

function contraste(a: [number, number, number], b: [number, number, number]): number {
  const [l1, l2] = [luminancia(a), luminancia(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

/** Mezcla un color con blanco, como lo hace un degradado blanco semitransparente encima. */
function conBlanco(c: [number, number, number], alfa: number): [number, number, number] {
  return c.map((v) => v * (1 - alfa) + 255 * alfa) as [number, number, number];
}

const BLANCO: [number, number, number] = [255, 255, 255];

describe('contraste AA', () => {
  it('el título blanco se lee sobre la parte más clara de la barra de título (texto grande, 3:1)', () => {
    expect(ventana).toMatch(/\.barra-titulo \{[^}]*var\(--brillo-titulo\)/);
    const alfa = Number(/rgb\(255 255 255 \/ ([\d.]+)\)/.exec(token('brillo-titulo'))![1]);
    expect(contraste(BLANCO, conBlanco(rgb(token('barra-titulo-1')), alfa))).toBeGreaterThanOrEqual(3);
  });

  it('el texto blanco se lee sobre el color de cada categoría (4.5:1)', () => {
    for (const cat of ['animales', 'planeta-tierra', 'espacio', 'cuerpo-humano', 'historia', 'arte-y-musica', 'ciencia-y-tecnologia', 'paises']) {
      expect(contraste(BLANCO, rgb(token(`cat-${cat}`))), cat).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('los textos principales se leen sobre fondo claro (4.5:1)', () => {
    expect(contraste(rgb(token('texto')), rgb(token('ventana')))).toBeGreaterThanOrEqual(4.5);
    expect(contraste(rgb(token('texto-suave')), BLANCO)).toBeGreaterThanOrEqual(4.5);
    expect(contraste(rgb(token('enlace')), BLANCO)).toBeGreaterThanOrEqual(4.5);
  });
});
