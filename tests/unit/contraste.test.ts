import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

const tokens = readFileSync('src/styles/tokens.css', 'utf8');

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

function contraste(a: string, b: string): number {
  const [l1, l2] = [luminancia(rgb(a)), luminancia(rgb(b))].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

const BLANCO = '#ffffff';

describe('contraste de la paleta', () => {
  it('los títulos naranjas se leen sobre blanco como texto grande (3:1)', () => {
    expect(contraste(token('naranja-titulo'), BLANCO)).toBeGreaterThanOrEqual(3);
  });

  it('el texto de la barra se lee sobre sus tres verdes (4.5:1)', () => {
    for (const v of ['verde-claro', 'verde', 'verde-oscuro']) {
      expect(contraste(token('verde-texto'), token(v)), v).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('el texto blanco se lee sobre los azules (4.5:1)', () => {
    for (const a of ['azul-panel-1', 'azul-panel-2', 'azul-elegido']) {
      expect(contraste(BLANCO, token(a)), a).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('la subcategoría elegida se lee (4.5:1)', () => {
    expect(contraste(token('amarillo-elegido'), token('azul-elegido'))).toBeGreaterThanOrEqual(4.5);
  });

  it('el texto de las placas se lee sobre todo su amarillo, normal y activo (4.5:1)', () => {
    for (const fondo of ['amarillo-1', 'amarillo-2', 'amarillo-3', 'amarillo-4']) {
      expect(contraste(token('placa-texto'), token(fondo)), fondo).toBeGreaterThanOrEqual(4.5);
      expect(contraste(token('placa-texto-activo'), token(fondo)), fondo).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('el texto de los botones naranjas se lee (4.5:1)', () => {
    for (const fondo of ['boton-naranja-1', 'boton-naranja-2']) {
      expect(contraste(token('texto'), token(fondo)), fondo).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('enlaces, títulos de recuadro y textos se leen sobre blanco (4.5:1)', () => {
    for (const t of ['enlace', 'recuadro-titulo', 'texto', 'texto-suave']) {
      expect(contraste(token(t), BLANCO), t).toBeGreaterThanOrEqual(4.5);
    }
  });
});
