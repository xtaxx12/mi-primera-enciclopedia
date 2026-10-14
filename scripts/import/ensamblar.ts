import type { Articulo, Bloque, Medio } from '../../src/lib/tipos';
import type { EntradaCuracion } from './curacion';
import type { ResultadoLimpieza } from './limpiar';
import { claveArchivo, elegirDescarga, nombreLocal, tipoDe, type Descarga, type MetadatosArchivo } from './metadatos';
import { esEsbozo, urlArticulo, urlHistorial, type ArticuloCrudo } from './vikidia';

export const PALABRAS_MINIMAS = 150;
export const IMAGENES_POR_ARTICULO = 6;

export function motivoRechazo(crudo: ArticuloCrudo | null, limpieza: ResultadoLimpieza | null): string | null {
  if (!crudo) return 'no existe en Vikidia';
  if (esEsbozo(crudo)) return 'es un esbozo';
  const palabras = limpieza?.palabras ?? 0;
  if (palabras < PALABRAS_MINIMAS) return `solo ${palabras} palabras (mínimo ${PALABRAS_MINIMAS})`;
  return null;
}

export type ResultadoMedio = { medio: Medio; descarga: Descarga; aviso?: string } | { descartado: string };

export function prepararMedio(m: MetadatosArchivo, alt: string): ResultadoMedio {
  if (!m.licencia) return { descartado: 'licencia no permitida o desconocida' };
  if (!m.autor) return { descartado: 'sin autor' };
  const tipo = tipoDe(m);
  if (!tipo) return { descartado: `tipo no soportado (${m.mime})` };
  const descarga = elegirDescarga(m);
  if (!descarga) return { descartado: 'sin formato descargable' };
  return {
    medio: {
      archivo: nombreLocal(m.clave, descarga.extension),
      tipo,
      alt,
      autor: m.autor,
      licencia: m.licencia,
      licenciaUrl: m.licenciaUrl,
      fuenteUrl: m.fuenteUrl,
    },
    descarga,
    aviso: descarga.aviso,
  };
}

/** Las descripciones de Commons suelen estar en inglés o vacías: se usa el pie en español o el título. */
export function textoAlternativo(pie: string | undefined, titulo: string): string {
  return pie?.trim() || titulo;
}

export function clavesDeImagenes(limpieza: ResultadoLimpieza): string[] {
  const figuras = limpieza.bloques.flatMap((b) => (b.tipo === 'figura' ? [b.archivo] : []));
  return [...new Set([...limpieza.imagenes.slice(0, IMAGENES_POR_ARTICULO), ...figuras])];
}

export function construirArticulo(a: {
  entrada: EntradaCuracion;
  crudo: ArticuloCrudo;
  limpieza: ResultadoLimpieza;
  medios: Map<string, Medio>;
  fecha: string;
}): Articulo {
  const { entrada, crudo, limpieza, medios } = a;
  const claves = [...clavesDeImagenes(limpieza), ...entrada.extras.map(claveArchivo)];
  const lista: Medio[] = [];
  for (const clave of claves) {
    const m = medios.get(clave);
    if (m && !lista.some((x) => x.archivo === m.archivo)) lista.push(m);
  }
  const bloques: Bloque[] = limpieza.bloques.flatMap((b): Bloque[] => {
    if (b.tipo === 'html') return [b];
    const m = medios.get(b.archivo);
    return m?.tipo === 'imagen' ? [{ tipo: 'figura', archivo: m.archivo, pie: b.pie }] : [];
  });
  return {
    slug: entrada.slug,
    titulo: entrada.titulo,
    categoria: entrada.categoria,
    resumen: limpieza.resumen,
    bloques,
    principal: lista.find((m) => m.tipo === 'imagen'),
    medios: lista,
    relacionados: limpieza.enlacesInternos.filter((s) => s !== entrada.slug),
    ...(entrada.adm0 ? { pais: { adm0: entrada.adm0 } } : {}),
    fuente: {
      url: urlArticulo(crudo.tituloResuelto),
      historialUrl: urlHistorial(crudo.tituloResuelto),
      revid: crudo.revid,
      fecha: a.fecha,
    },
  };
}

export function completarRelacionados(articulos: Articulo[], minimo = 3, maximo = 6): Articulo[] {
  const existentes = new Set(articulos.map((x) => x.slug));
  return articulos.map((art) => {
    const lista = [...new Set(art.relacionados)].filter((s) => s !== art.slug && existentes.has(s));
    if (lista.length < minimo) {
      const candidatos = articulos
        .filter((o) => o.categoria === art.categoria && o.slug !== art.slug && !lista.includes(o.slug))
        .sort((x, y) => x.titulo.localeCompare(y.titulo, 'es'));
      for (const o of candidatos) {
        if (lista.length >= minimo) break;
        lista.push(o.slug);
      }
    }
    return { ...art, relacionados: lista.slice(0, maximo) };
  });
}
