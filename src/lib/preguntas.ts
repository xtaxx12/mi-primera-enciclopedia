import type { Pregunta } from './tipos';

export interface PreguntaEnJuego<P extends Pregunta = Pregunta> {
  pregunta: P;
  opciones: string[];
  correcta: number;
}

export interface EstadoJuego<P extends Pregunta = Pregunta> {
  preguntas: PreguntaEnJuego<P>[];
  indice: number;
  elegida: number | null;
  aciertos: number;
  terminado: boolean;
}

export const PUNTOS_POR_ACIERTO = 10;

export function mezclar<T>(lista: readonly T[], aleatorio: () => number = Math.random): T[] {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(aleatorio() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

export function iniciarJuego<P extends Pregunta>(c: { preguntas: P[] }, aleatorio: () => number = Math.random): EstadoJuego<P> {
  const preguntas = mezclar(c.preguntas, aleatorio).map((pregunta) => {
    const orden = mezclar([0, 1, 2], aleatorio);
    return { pregunta, opciones: orden.map((i) => pregunta.opciones[i]), correcta: orden.indexOf(pregunta.correcta) };
  });
  return { preguntas, indice: 0, elegida: null, aciertos: 0, terminado: false };
}

export function preguntaActual<P extends Pregunta>(e: EstadoJuego<P>): PreguntaEnJuego<P> | undefined {
  return e.terminado ? undefined : e.preguntas[e.indice];
}

/** Registra una respuesta; si la pregunta ya fue respondida o la opción no existe, devuelve el mismo estado. */
export function responder<P extends Pregunta>(e: EstadoJuego<P>, opcion: number): EstadoJuego<P> {
  const actual = preguntaActual(e);
  if (!actual || e.elegida !== null || opcion < 0 || opcion >= actual.opciones.length) return e;
  return { ...e, elegida: opcion, aciertos: e.aciertos + (opcion === actual.correcta ? 1 : 0) };
}

/** Pasa a la siguiente pregunta; solo después de responder. */
export function siguiente<P extends Pregunta>(e: EstadoJuego<P>): EstadoJuego<P> {
  if (e.terminado || e.elegida === null) return e;
  const indice = e.indice + 1;
  return indice >= e.preguntas.length ? { ...e, elegida: null, terminado: true } : { ...e, indice, elegida: null };
}

export function puntaje(aciertos: number): number {
  return aciertos * PUNTOS_POR_ACIERTO;
}

export function estrellas(aciertos: number): 1 | 2 | 3 {
  if (aciertos >= 8) return 3;
  if (aciertos >= 5) return 2;
  return 1;
}
