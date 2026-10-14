import { describe, it, expect } from 'vitest';
import { clavePuntajes, entraEnTop, guardarPuntaje, leerPuntajes, limpiarNombre } from '../../src/lib/puntajes';

function almacenFalso(): Storage {
  const m = new Map<string, string>();
  return {
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => void m.set(k, v),
    removeItem: (k: string) => void m.delete(k),
    clear: () => m.clear(),
    key: () => null,
    get length() {
      return m.size;
    },
  } as Storage;
}

const roto = {
  getItem: () => {
    throw new Error('bloqueado');
  },
  setItem: () => {
    throw new Error('lleno');
  },
} as unknown as Storage;

describe('limpiarNombre', () => {
  it('recorta, limita a 12 caracteres y usa "Anónimo" si queda vacío', () => {
    expect(limpiarNombre('  Ana  ')).toBe('Ana');
    expect(limpiarNombre('')).toBe('Anónimo');
    expect(limpiarNombre('    ')).toBe('Anónimo');
    expect(limpiarNombre('Maximiliano Alejandro')).toBe('Maximiliano');
    expect(limpiarNombre('<script>alert(1)</script>')).toBe('<script>aler');
  });
});

describe('puntajes', () => {
  it('guarda ordenado bajo la clave del cuestionario', () => {
    const almacen = almacenFalso();
    guardarPuntaje('animales', { nombre: 'Ana', puntaje: 70, fecha: '2026-10-14T10:00:00Z' }, almacen);
    guardarPuntaje('animales', { nombre: 'Beto', puntaje: 90, fecha: '2026-10-14T11:00:00Z' }, almacen);
    expect(leerPuntajes('animales', almacen).map((r) => r.nombre)).toEqual(['Beto', 'Ana']);
    expect(almacen.getItem(clavePuntajes('animales'))).toContain('Beto');
    expect(clavePuntajes('animales')).toBe('mpe:puntajes:animales');
  });

  it('conserva solo las 5 mejores', () => {
    const almacen = almacenFalso();
    for (const p of [10, 50, 30, 90, 70, 20, 60]) {
      guardarPuntaje('espacio', { nombre: `J${p}`, puntaje: p, fecha: `2026-10-14T00:00:${p}Z` }, almacen);
    }
    expect(leerPuntajes('espacio', almacen).map((r) => r.puntaje)).toEqual([90, 70, 60, 50, 30]);
  });

  it('decide si un puntaje entra en la tabla', () => {
    const almacen = almacenFalso();
    expect(entraEnTop('arte', 0, almacen)).toBe(true);
    for (const p of [100, 90, 80, 70, 60]) guardarPuntaje('arte', { nombre: 'X', puntaje: p, fecha: '2026-10-14' }, almacen);
    expect(entraEnTop('arte', 60, almacen)).toBe(false);
    expect(entraEnTop('arte', 70, almacen)).toBe(true);
  });

  it('ignora datos corruptos', () => {
    const almacen = almacenFalso();
    almacen.setItem(clavePuntajes('a'), '{no es json');
    expect(leerPuntajes('a', almacen)).toEqual([]);
    almacen.setItem(clavePuntajes('b'), '[{"x":1}, {"nombre":"Ana","puntaje":50,"fecha":"2026"}]');
    expect(leerPuntajes('b', almacen)).toEqual([{ nombre: 'Ana', puntaje: 50, fecha: '2026' }]);
  });

  it('funciona aunque el almacenamiento falle o no exista', () => {
    expect(leerPuntajes('x', roto)).toEqual([]);
    expect(() => guardarPuntaje('x', { nombre: 'Ana', puntaje: 10, fecha: '2026' }, roto)).not.toThrow();
    expect(guardarPuntaje('x', { nombre: 'Ana', puntaje: 10, fecha: '2026' }, null)).toEqual([{ nombre: 'Ana', puntaje: 10, fecha: '2026' }]);
  });
});
