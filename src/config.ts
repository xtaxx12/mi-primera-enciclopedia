export const SITIO = {
  nombre: 'Mi Primera Enciclopedia',
  lema: 'Explora, aprende y juega',
  homenaje: 'Homenaje a Mi Primera Encarta (2009). Proyecto no afiliado a Microsoft.',
  personaje: 'Lumi',
} as const;

export const CATEGORIAS = [
  { slug: 'animales', nombre: 'Animales', icono: '1F981' },
  { slug: 'planeta-tierra', nombre: 'Planeta Tierra', icono: '1F30B' },
  { slug: 'espacio', nombre: 'Espacio', icono: '1F680' },
  { slug: 'cuerpo-humano', nombre: 'Cuerpo humano', icono: '1FAC0' },
  { slug: 'historia', nombre: 'Historia', icono: '1F3DB' },
  { slug: 'arte-y-musica', nombre: 'Arte y música', icono: '1F3A8' },
  { slug: 'ciencia-y-tecnologia', nombre: 'Ciencia y tecnología', icono: '1F52C' },
  { slug: 'paises', nombre: 'Países', icono: '1F30E' },
] as const;

export type CategoriaSlug = (typeof CATEGORIAS)[number]['slug'];

export const SLUGS_CATEGORIAS = CATEGORIAS.map((c) => c.slug) as [CategoriaSlug, ...CategoriaSlug[]];

export function categoriaPorSlug(slug: string) {
  return CATEGORIAS.find((c) => c.slug === slug);
}

/** Códigos de OpenMoji (CC BY-SA 4.0) usados en la interfaz. */
export const ICONOS = {
  inicio: '1F3E0',
  buscar: '1F50D',
  atlas: '1F5FA',
  juegos: '1F3B2',
  acerca: '2139',
  sonido: '1F50A',
  silencio: '1F507',
  atras: '2B05',
  adelante: '27A1',
  estrella: '2B50',
  trofeo: '1F3C6',
  libros: '1F4DA',
} as const;
