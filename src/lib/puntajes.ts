export interface RegistroPuntaje {
  nombre: string;
  puntaje: number;
  fecha: string;
}

export const MAXIMO_REGISTROS = 5;
export const LONGITUD_NOMBRE = 12;

export const clavePuntajes = (slug: string) => `mpe:puntajes:${slug}`;

function almacenPorDefecto(): Storage | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

export function limpiarNombre(nombre: string): string {
  const limpio = nombre
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, LONGITUD_NOMBRE)
    .trim();
  return limpio || 'Anónimo';
}

function esRegistro(x: unknown): x is RegistroPuntaje {
  const r = x as RegistroPuntaje;
  return !!r && typeof r.nombre === 'string' && typeof r.puntaje === 'number' && Number.isFinite(r.puntaje) && typeof r.fecha === 'string';
}

function ordenar(lista: RegistroPuntaje[]): RegistroPuntaje[] {
  return [...lista].sort((a, b) => b.puntaje - a.puntaje || a.fecha.localeCompare(b.fecha));
}

export function leerPuntajes(slug: string, almacen: Storage | null = almacenPorDefecto()): RegistroPuntaje[] {
  try {
    const crudo = almacen?.getItem(clavePuntajes(slug));
    const datos: unknown = crudo ? JSON.parse(crudo) : [];
    return Array.isArray(datos) ? ordenar(datos.filter(esRegistro)).slice(0, MAXIMO_REGISTROS) : [];
  } catch {
    return [];
  }
}

export function entraEnTop(slug: string, puntos: number, almacen: Storage | null = almacenPorDefecto()): boolean {
  const actuales = leerPuntajes(slug, almacen);
  return actuales.length < MAXIMO_REGISTROS || puntos > actuales[actuales.length - 1].puntaje;
}

export function guardarPuntaje(
  slug: string,
  registro: RegistroPuntaje,
  almacen: Storage | null = almacenPorDefecto(),
): RegistroPuntaje[] {
  const nuevo = { ...registro, nombre: limpiarNombre(registro.nombre) };
  const lista = ordenar([...leerPuntajes(slug, almacen), nuevo]).slice(0, MAXIMO_REGISTROS);
  try {
    almacen?.setItem(clavePuntajes(slug), JSON.stringify(lista));
  } catch {
    // sin almacenamiento: la tabla vale solo para esta partida
  }
  return lista;
}
