import { describe, it, expect } from 'vitest';
import { estrellas, iniciarJuego, mezclar, preguntaActual, puntaje, responder, siguiente } from '../../src/lib/preguntas';
import type { Pregunta } from '../../src/lib/tipos';

/** Generador pseudoaleatorio determinista para las pruebas. */
const semilla = (s: number) => () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;

const preguntas: Pregunta[] = Array.from({ length: 10 }, (_, i) => ({
  id: `p${i}`,
  texto: `¿Pregunta ${i}?`,
  imagen: 'x.jpg',
  opciones: [`A${i}`, `B${i}`, `C${i}`],
  correcta: (i % 3) as 0 | 1 | 2,
  articulo: 'leon',
  explicacion: 'Dato.',
}));

describe('mezclar', () => {
  it('conserva todos los elementos', () => {
    expect(mezclar([1, 2, 3, 4, 5], semilla(1)).sort()).toEqual([1, 2, 3, 4, 5]);
  });
});

describe('iniciarJuego', () => {
  it('mezcla preguntas y opciones sin perder la respuesta correcta', () => {
    const juego = iniciarJuego({ preguntas }, semilla(42));
    expect(new Set(juego.preguntas.map((p) => p.pregunta.id)).size).toBe(10);
    for (const p of juego.preguntas) {
      expect(p.opciones[p.correcta]).toBe(p.pregunta.opciones[p.pregunta.correcta]);
      expect([...p.opciones].sort()).toEqual([...p.pregunta.opciones].sort());
    }
    expect(juego).toMatchObject({ indice: 0, elegida: null, aciertos: 0, terminado: false });
  });
});

describe('responder y siguiente', () => {
  it('cuenta los aciertos y termina después de la última pregunta', () => {
    let juego = iniciarJuego({ preguntas }, semilla(7));
    for (let i = 0; i < 10; i++) {
      const actual = preguntaActual(juego)!;
      juego = responder(juego, i < 6 ? actual.correcta : (actual.correcta + 1) % 3);
      juego = siguiente(juego);
    }
    expect(juego.terminado).toBe(true);
    expect(juego.aciertos).toBe(6);
    expect(preguntaActual(juego)).toBeUndefined();
  });

  it('responder dos veces la misma pregunta cuenta una sola vez', () => {
    let juego = iniciarJuego({ preguntas }, semilla(3));
    const correcta = preguntaActual(juego)!.correcta;
    juego = responder(juego, correcta);
    const otraVez = responder(juego, correcta);
    expect(otraVez).toBe(juego);
    expect(otraVez.aciertos).toBe(1);
  });

  it('ignora opciones fuera de rango y avanzar sin responder', () => {
    const juego = iniciarJuego({ preguntas }, semilla(5));
    expect(responder(juego, 3)).toBe(juego);
    expect(responder(juego, -1)).toBe(juego);
    expect(siguiente(juego)).toBe(juego);
  });
});

describe('puntaje y estrellas', () => {
  it('da 10 puntos por acierto', () => {
    expect(puntaje(7)).toBe(70);
    expect(puntaje(0)).toBe(0);
  });

  it('respeta los límites de estrellas', () => {
    expect([0, 4, 5, 7, 8, 10].map(estrellas)).toEqual([1, 1, 2, 2, 3, 3]);
  });
});
