export type Efecto = 'clic' | 'acierto' | 'error' | 'fanfarria';

interface Nota {
  frecuencia: number;
  inicio: number;
  duracion: number;
  tipo: OscillatorType;
}

export const EFECTOS: Record<Efecto, Nota[]> = {
  clic: [{ frecuencia: 880, inicio: 0, duracion: 0.05, tipo: 'square' }],
  acierto: [
    { frecuencia: 660, inicio: 0, duracion: 0.12, tipo: 'sine' },
    { frecuencia: 990, inicio: 0.12, duracion: 0.18, tipo: 'sine' },
  ],
  error: [{ frecuencia: 220, inicio: 0, duracion: 0.25, tipo: 'sawtooth' }],
  fanfarria: [523, 659, 784, 1047].map((frecuencia, i) => ({ frecuencia, inicio: i * 0.14, duracion: 0.2, tipo: 'triangle' as const })),
};

export const CLAVE_PREFERENCIA = 'mpe:sonido';

export interface VozSistema {
  lang: string;
  name: string;
}

export interface Sintetizador {
  getVoices(): VozSistema[];
  cancel(): void;
  speak(frase: unknown): void;
}

export interface OpcionesSonido {
  crearContexto?: () => AudioContext | null;
  almacen?: () => Storage | null;
  sintetizador?: () => Sintetizador | null;
  crearFrase?: (texto: string, voz: VozSistema) => unknown;
}

export interface Sonido {
  reproducir(efecto: Efecto): void;
  hablar(texto: string): void;
  activado(): boolean;
  alternar(): boolean;
  desbloquear(): void;
}

function almacenPorDefecto(): Storage | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

function contextoPorDefecto(): AudioContext | null {
  const g = globalThis as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext };
  const Constructor = g.AudioContext ?? g.webkitAudioContext;
  try {
    return Constructor ? new Constructor() : null;
  } catch {
    return null;
  }
}

function sintetizadorPorDefecto(): Sintetizador | null {
  try {
    return (globalThis as unknown as { speechSynthesis?: Sintetizador }).speechSynthesis ?? null;
  } catch {
    return null;
  }
}

function frasePorDefecto(texto: string, voz: VozSistema): unknown {
  const Frase = (globalThis as unknown as { SpeechSynthesisUtterance?: typeof SpeechSynthesisUtterance }).SpeechSynthesisUtterance;
  if (!Frase) return null;
  const frase = new Frase(texto);
  frase.lang = voz.lang;
  try {
    frase.voice = voz as SpeechSynthesisVoice;
  } catch {
    // una voz que no es del navegador (pruebas): basta con el idioma
  }
  return frase;
}

export function crearSonido(op: OpcionesSonido = {}): Sonido {
  const almacen = () => {
    try {
      return (op.almacen ?? almacenPorDefecto)();
    } catch {
      return null;
    }
  };
  const crearContexto = op.crearContexto ?? contextoPorDefecto;
  let contexto: AudioContext | null = null;
  const sintetizador = () => {
    try {
      return (op.sintetizador ?? sintetizadorPorDefecto)();
    } catch {
      return null;
    }
  };
  let desbloqueado = false;
  let encendido = (() => {
    try {
      return almacen()?.getItem(CLAVE_PREFERENCIA) !== '0';
    } catch {
      return true;
    }
  })();

  return {
    desbloquear() {
      desbloqueado = true;
      if (!contexto) contexto = crearContexto();
      if (contexto?.state === 'suspended') contexto.resume().catch(() => {});
    },
    activado: () => encendido,
    alternar() {
      encendido = !encendido;
      if (!encendido) sintetizador()?.cancel();
      try {
        almacen()?.setItem(CLAVE_PREFERENCIA, encendido ? '1' : '0');
      } catch {
        // sin almacenamiento: la preferencia dura solo esta visita
      }
      return encendido;
    },
    reproducir(efecto) {
      if (!encendido || !contexto) return;
      try {
        const t0 = contexto.currentTime;
        for (const n of EFECTOS[efecto]) {
          const oscilador = contexto.createOscillator();
          const ganancia = contexto.createGain();
          oscilador.type = n.tipo;
          oscilador.frequency.setValueAtTime(n.frecuencia, t0 + n.inicio);
          ganancia.gain.setValueAtTime(0.15, t0 + n.inicio);
          ganancia.gain.exponentialRampToValueAtTime(0.001, t0 + n.inicio + n.duracion);
          oscilador.connect(ganancia);
          ganancia.connect(contexto.destination);
          oscilador.start(t0 + n.inicio);
          oscilador.stop(t0 + n.inicio + n.duracion);
        }
      } catch {
        // el navegador no pudo reproducir: silencio
      }
    },
    hablar(texto) {
      if (!encendido || !desbloqueado || !texto) return;
      try {
        const s = sintetizador();
        const voz = s?.getVoices().find((v) => v.lang.toLowerCase().startsWith('es'));
        if (!s || !voz) return;
        const frase = (op.crearFrase ?? frasePorDefecto)(texto, voz);
        if (!frase) return;
        s.cancel();
        s.speak(frase);
      } catch {
        // sin voz disponible: silencio
      }
    },
  };
}
