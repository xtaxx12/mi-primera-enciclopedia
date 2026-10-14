import type { Pantalla } from './tipos';

export type Pose = 'saluda' | 'piensa' | 'celebra' | 'sorprende';

export const MENSAJES: Record<Pantalla, string[]> = {
  inicio: ['¡Hola! Soy Lumi. Elige una categoría para empezar a explorar.', 'Toca cualquier mosaico de colores para descubrir cosas nuevas.'],
  categoria: ['Elige un artículo. ¡Cada uno tiene fotos y datos curiosos!'],
  articulo: ['Cuando termines de leer, pon a prueba lo que sabes con un cuestionario.', 'Mira las fotos del panel de multimedia.'],
  buscar: ['Escribe lo que quieras encontrar. No importa si olvidas los acentos.'],
  atlas: ['Haz clic en un país para conocerlo. También puedes acercarte a un continente.'],
  pais: ['Todavía no tengo un artículo de este país, pero aquí tienes algunos datos.'],
  juegos: ['Elige un cuestionario. ¡A ver cuántas estrellas consigues!'],
  cuestionario: ['Lee bien cada pregunta y elige una respuesta.'],
  acerca: ['Este sitio es un homenaje hecho con contenido libre.'],
  '404': ['¡Uy! Me perdí. Volvamos al inicio.'],
};

export const POSES: Record<Pantalla, Pose> = {
  inicio: 'saluda',
  categoria: 'saluda',
  articulo: 'piensa',
  buscar: 'piensa',
  atlas: 'saluda',
  pais: 'piensa',
  juegos: 'celebra',
  cuestionario: 'piensa',
  acerca: 'saluda',
  '404': 'sorprende',
};

export function elegirMensaje(mensajes: string[], aleatorio: () => number = Math.random): string {
  if (!mensajes.length) return '';
  return mensajes[Math.min(mensajes.length - 1, Math.floor(aleatorio() * mensajes.length))];
}

export function mensajesPara(pantalla: Pantalla, extras: string[] = []): string[] {
  return [...MENSAJES[pantalla], ...extras.map((e) => `¿Sabías que…? ${e}`)];
}

export function esPantalla(valor: string | undefined): valor is Pantalla {
  return !!valor && Object.hasOwn(MENSAJES, valor);
}
