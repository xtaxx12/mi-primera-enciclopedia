import { describe, it, expect } from 'vitest';
import { fichaParaCuestionario } from '../../scripts/cuestionarios/ayuda';
import type { Articulo, Medio } from '../../src/lib/tipos';

const imagen = (archivo: string): Medio => ({
  archivo,
  tipo: 'imagen',
  alt: 'Un león',
  autor: 'Ana',
  licencia: 'cc-by',
  licenciaUrl: '',
  fuenteUrl: 'https://commons.wikimedia.org/wiki/File:X.jpg',
});

describe('fichaParaCuestionario', () => {
  it('muestra slug, título, imágenes disponibles y el texto plano', () => {
    const a: Articulo = {
      slug: 'leon',
      titulo: 'León',
      categoria: 'animales',
      resumen: 'El león es un felino.',
      bloques: [{ tipo: 'html', html: '<p>El <b>león</b> vive en la sabana.</p>' }],
      medios: [imagen('lion-1234abcd.jpg'), { ...imagen('rugido.mp3'), tipo: 'audio' }],
      relacionados: [],
      fuente: { url: 'https://x', historialUrl: 'https://x', revid: 1, fecha: '2026-10-14' },
    };
    const ficha = fichaParaCuestionario(a);
    expect(ficha).toContain('### León (articulo: "leon")');
    expect(ficha).toContain('imagenes: "lion-1234abcd.jpg"');
    expect(ficha).not.toContain('rugido.mp3');
    expect(ficha).toContain('El león vive en la sabana.');
  });
});
