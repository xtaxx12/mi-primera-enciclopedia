import type { CategoriaSlug } from '../config';

export type Licencia = 'dominio-publico' | 'cc0' | 'cc-by' | 'cc-by-sa';
export type TipoMedio = 'imagen' | 'audio' | 'video';

export interface Medio {
  archivo: string; // nombre del archivo local (src/assets/medios o public/medios)
  tipo: TipoMedio;
  alt: string;
  autor: string;
  licencia: Licencia;
  licenciaUrl: string;
  fuenteUrl: string; // página del archivo en Commons
}

export type Bloque =
  | { tipo: 'html'; html: string }
  | { tipo: 'figura'; archivo: string; pie: string };

export interface Articulo {
  slug: string;
  titulo: string;
  categoria: CategoriaSlug;
  resumen: string;
  bloques: Bloque[];
  principal?: Medio;
  medios: Medio[];
  relacionados: string[];
  pais?: { adm0: string };
  fuente: { url: string; historialUrl: string; revid: number; fecha: string };
}

export interface Pregunta {
  id: string;
  texto: string;
  imagen: string; // archivo de un Medio de tipo imagen del artículo referido
  opciones: [string, string, string];
  correcta: 0 | 1 | 2;
  articulo: string; // slug
  explicacion: string;
}

export interface Cuestionario {
  slug: string;
  titulo: string;
  categoria: CategoriaSlug;
  preguntas: Pregunta[];
}

export interface PaisAtlas {
  adm0: string;
  nombre: string;
  continente: string;
  poblacion: number;
  d: string; // path SVG
}

export type VistaAtlas = 'mundo' | 'africa' | 'america' | 'asia' | 'europa' | 'oceania';

/** viewBox: [x, y, ancho, alto] */
export type Caja = [number, number, number, number];

export type Pantalla =
  | 'inicio' | 'categoria' | 'articulo' | 'buscar' | 'atlas' | 'pais'
  | 'juegos' | 'cuestionario' | 'acerca' | '404';
