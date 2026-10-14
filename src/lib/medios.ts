import type { ImageMetadata } from 'astro';

const imagenes = import.meta.glob<{ default: ImageMetadata }>('/src/assets/medios/*.{jpg,png,gif,webp}', {
  eager: true,
});

/** Imagen importada (optimizable con <Image />) a partir del nombre del archivo local. */
export function imagenDe(archivo: string): ImageMetadata | undefined {
  return imagenes[`/src/assets/medios/${archivo}`]?.default;
}

/** URL de un audio o video servido desde public/medios/. */
export function urlPublica(archivo: string): string {
  return `/medios/${encodeURIComponent(archivo)}`;
}
