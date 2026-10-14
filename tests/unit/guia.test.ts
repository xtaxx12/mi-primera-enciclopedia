import { describe, it, expect } from 'vitest';
import { elegirMensaje, esPantalla, MENSAJES, mensajesPara, POSES } from '../../src/lib/guia';

describe('guía', () => {
  it('tiene mensajes y pose para cada pantalla', () => {
    for (const pantalla of Object.keys(MENSAJES)) {
      expect(MENSAJES[pantalla as keyof typeof MENSAJES].length).toBeGreaterThan(0);
      expect(POSES[pantalla as keyof typeof POSES]).toBeDefined();
    }
  });

  it('agrega los datos curiosos como "¿Sabías que…?"', () => {
    expect(mensajesPara('juegos', ['Los leones duermen mucho.']).at(-1)).toBe('¿Sabías que…? Los leones duermen mucho.');
  });

  it('elige un mensaje dentro del rango', () => {
    expect(elegirMensaje(['a', 'b', 'c'], () => 0)).toBe('a');
    expect(elegirMensaje(['a', 'b', 'c'], () => 0.999)).toBe('c');
    expect(elegirMensaje(['a', 'b'], () => 1)).toBe('b');
    expect(elegirMensaje([], () => 0.5)).toBe('');
  });

  it('reconoce pantallas válidas', () => {
    expect(esPantalla('atlas')).toBe(true);
    expect(esPantalla('otra')).toBe(false);
    expect(esPantalla(undefined)).toBe(false);
  });
});
