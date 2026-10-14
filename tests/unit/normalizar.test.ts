import { describe, it, expect } from 'vitest';
import { normalizar, slugificar } from '../../src/lib/normalizar';

describe('normalizar', () => {
  it('quita acentos y pasa a minúsculas', () => {
    expect(normalizar('Árbol')).toBe('arbol');
    expect(normalizar('NIÑO')).toBe('nino');
    expect(normalizar('Pingüino')).toBe('pinguino');
  });

  it('deja igual el texto sin acentos', () => {
    expect(normalizar('sol')).toBe('sol');
  });
});

describe('slugificar', () => {
  it('convierte títulos en slugs', () => {
    expect(slugificar('Arte y música')).toBe('arte-y-musica');
    expect(slugificar('León')).toBe('leon');
    expect(slugificar('  Estados Unidos ')).toBe('estados-unidos');
    expect(slugificar('Sistema solar (astronomía)')).toBe('sistema-solar-astronomia');
  });

  it('devuelve cadena vacía si no hay letras ni números', () => {
    expect(slugificar('¿?!')).toBe('');
  });
});
