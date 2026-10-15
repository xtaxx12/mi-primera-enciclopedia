import { describe, it, expect, vi } from 'vitest';
import { CLAVE_PREFERENCIA, crearSonido, type VozSistema } from '../../src/lib/sonido';

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

function contextoFalso() {
  const osciladores: { frecuencias: number[]; start: ReturnType<typeof vi.fn> }[] = [];
  const ctx = {
    currentTime: 0,
    destination: {},
    osciladores,
    createOscillator() {
      const o = {
        type: '',
        frecuencias: [] as number[],
        frequency: { setValueAtTime: (v: number) => o.frecuencias.push(v) },
        connect: () => {},
        start: vi.fn(),
        stop: vi.fn(),
      };
      osciladores.push(o);
      return o;
    },
    createGain() {
      return { gain: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} }, connect: () => {} };
    },
  };
  return ctx;
}

describe('crearSonido', () => {
  it('no suena antes de desbloquear', () => {
    const ctx = contextoFalso();
    const s = crearSonido({ crearContexto: () => ctx as unknown as AudioContext, almacen: almacenFalso });
    s.reproducir('clic');
    expect(ctx.osciladores).toHaveLength(0);
  });

  it('reproduce las notas del efecto después de desbloquear', () => {
    const ctx = contextoFalso();
    const s = crearSonido({ crearContexto: () => ctx as unknown as AudioContext, almacen: almacenFalso });
    s.desbloquear();
    s.reproducir('acierto');
    expect(ctx.osciladores.map((o) => o.frecuencias[0])).toEqual([660, 990]);
    expect(ctx.osciladores.every((o) => o.start.mock.calls.length === 1)).toBe(true);
  });

  it('recuerda que el sonido se apagó', () => {
    const almacen = almacenFalso();
    const ctx = contextoFalso();
    const s = crearSonido({ crearContexto: () => ctx as unknown as AudioContext, almacen: () => almacen });
    expect(s.activado()).toBe(true);
    expect(s.alternar()).toBe(false);
    expect(almacen.getItem(CLAVE_PREFERENCIA)).toBe('0');
    s.desbloquear();
    s.reproducir('clic');
    expect(ctx.osciladores).toHaveLength(0);
    expect(crearSonido({ almacen: () => almacen }).activado()).toBe(false);
  });

  it('funciona sin Web Audio ni almacenamiento', () => {
    const roto = () => {
      throw new Error('bloqueado');
    };
    const s = crearSonido({ crearContexto: () => null, almacen: roto as never });
    s.desbloquear();
    expect(() => s.reproducir('fanfarria')).not.toThrow();
    expect(s.activado()).toBe(true);
    expect(() => s.alternar()).not.toThrow();
  });

  it('no falla si el contexto de audio lanza errores', () => {
    const s = crearSonido({
      crearContexto: () => ({ currentTime: 0, createOscillator: () => { throw new Error('x'); } }) as unknown as AudioContext,
      almacen: almacenFalso,
    });
    s.desbloquear();
    expect(() => s.reproducir('error')).not.toThrow();
  });
});

function sintetizadorFalso(voces: VozSistema[]) {
  return {
    voces,
    dichas: [] as unknown[],
    cancelado: 0,
    getVoices() {
      return this.voces;
    },
    cancel() {
      this.cancelado++;
    },
    speak(frase: unknown) {
      this.dichas.push(frase);
    },
  };
}

const frase = (texto: string, voz: VozSistema) => ({ texto, lang: voz.lang });

describe('voz', () => {
  const ES = { lang: 'es-MX', name: 'Paulina' };
  const EN = { lang: 'en-US', name: 'Samantha' };

  it('no habla antes de la primera interacción', () => {
    const s = sintetizadorFalso([ES]);
    const sonido = crearSonido({ crearContexto: () => null, almacen: almacenFalso, sintetizador: () => s, crearFrase: frase });
    sonido.hablar('Animales');
    expect(s.dichas).toEqual([]);
  });

  it('habla con una voz en español y corta la frase anterior', () => {
    const s = sintetizadorFalso([EN, ES]);
    const sonido = crearSonido({ crearContexto: () => null, almacen: almacenFalso, sintetizador: () => s, crearFrase: frase });
    sonido.desbloquear();
    sonido.hablar('Animales');
    expect(s.dichas).toEqual([{ texto: 'Animales', lang: 'es-MX' }]);
    expect(s.cancelado).toBe(1);
  });

  it('no habla con el sonido apagado', () => {
    const s = sintetizadorFalso([ES]);
    const sonido = crearSonido({ crearContexto: () => null, almacen: almacenFalso, sintetizador: () => s, crearFrase: frase });
    sonido.desbloquear();
    sonido.alternar();
    sonido.hablar('Animales');
    expect(s.dichas).toEqual([]);
  });

  it('no habla si no hay voz en español', () => {
    const s = sintetizadorFalso([EN]);
    const sonido = crearSonido({ crearContexto: () => null, almacen: almacenFalso, sintetizador: () => s, crearFrase: frase });
    sonido.desbloquear();
    sonido.hablar('Animales');
    expect(s.dichas).toEqual([]);
  });

  it('no falla si el navegador no tiene síntesis de voz', () => {
    const sonido = crearSonido({ crearContexto: () => null, almacen: almacenFalso, sintetizador: () => null });
    sonido.desbloquear();
    expect(() => sonido.hablar('Animales')).not.toThrow();
  });
});
