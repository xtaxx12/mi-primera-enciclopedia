import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import type { Articulo, Cuestionario, Medio } from '../src/lib/tipos';
import { esHttps } from '../src/lib/urls';

const LICENCIAS = new Set(['dominio-publico', 'cc0', 'cc-by', 'cc-by-sa']);
const ETIQUETAS_HTML = new Set(['p', 'h2', 'h3', 'ul', 'ol', 'li', 'b', 'i', 'strong', 'em', 'a', 'br', 'sub', 'sup']);

/** Etiquetas que no están en la lista permitida o que traen atributos (salvo href a un artículo). */
function htmlNoPermitido(html: string): string[] {
  const malas: string[] = [];
  for (const [etiqueta, cierre, nombre, atributos] of html.matchAll(/<(\/?)([a-zA-Z][a-zA-Z0-9]*)([^>]*)>/g)) {
    const n = nombre.toLowerCase();
    const atributosOk = atributos === '' || (n === 'a' && !cierre && /^ href="\/articulo\/[a-z0-9-]+"$/.test(atributos));
    if (!ETIQUETAS_HTML.has(n) || !atributosOk) malas.push(etiqueta);
  }
  return malas;
}

export interface DatosValidacion {
  articulos: { id: string; datos: Articulo }[];
  cuestionarios: { id: string; datos: Cuestionario }[];
  adm0Atlas: Set<string>;
  imagenes: Set<string>;
  publicos: Set<string>;
}

function validarMedio(m: Medio, donde: string, d: DatosValidacion): string[] {
  const errores: string[] = [];
  const nombre = `${donde}, medio «${m.archivo}»`;
  if (!m.autor?.trim()) errores.push(`${nombre}: sin autor`);
  if (!LICENCIAS.has(m.licencia)) errores.push(`${nombre}: licencia no permitida «${m.licencia}»`);
  if (!m.fuenteUrl) errores.push(`${nombre}: sin fuenteUrl`);
  else if (!esHttps(m.fuenteUrl)) errores.push(`${nombre}: fuenteUrl no es https`);
  if (m.licenciaUrl && !esHttps(m.licenciaUrl)) errores.push(`${nombre}: licenciaUrl no es https`);
  const existe = m.tipo === 'imagen' ? d.imagenes.has(m.archivo) : d.publicos.has(m.archivo);
  if (!existe) errores.push(`${nombre}: el archivo no existe`);
  return errores;
}

export function validarContenido(d: DatosValidacion): string[] {
  const errores: string[] = [];
  if (d.articulos.length === 0) errores.push('no hay artículos en src/content/articulos');
  const porSlug = new Map(d.articulos.map((a) => [a.datos.slug, a.datos]));

  for (const { id, datos: a } of d.articulos) {
    const donde = `artículo «${id}»`;
    if (a.slug !== id) errores.push(`${donde}: el slug «${a.slug}» no coincide con el nombre del archivo`);
    if (!a.fuente?.url || !a.fuente?.historialUrl || !a.fuente?.revid || !a.fuente?.fecha) {
      errores.push(`${donde}: fuente incompleta`);
    } else if (!esHttps(a.fuente.url) || !esHttps(a.fuente.historialUrl)) {
      errores.push(`${donde}: la fuente no es https`);
    }
    const medios = new Map([...(a.principal ? [a.principal] : []), ...a.medios].map((m) => [m.archivo, m]));
    for (const m of medios.values()) errores.push(...validarMedio(m, donde, d));
    const archivos = new Set(a.medios.map((m) => m.archivo));
    for (const b of a.bloques) {
      if (b.tipo === 'figura' && !archivos.has(b.archivo)) {
        errores.push(`${donde}: la figura «${b.archivo}» no está entre sus medios`);
      }
      if (b.tipo === 'html') {
        for (const mala of htmlNoPermitido(b.html)) errores.push(`${donde}: HTML no permitido «${mala}»`);
        for (const [, slug] of b.html.matchAll(/href="\/articulo\/([^"]+)"/g)) {
          if (!porSlug.has(slug)) errores.push(`${donde}: enlace interno roto a «${slug}»`);
        }
      }
    }
    for (const r of a.relacionados) if (!porSlug.has(r)) errores.push(`${donde}: relacionado inexistente «${r}»`);
    if (a.pais && !d.adm0Atlas.has(a.pais.adm0)) {
      errores.push(`${donde}: el país «${a.pais.adm0}» no existe en Natural Earth`);
    }
  }

  for (const { id, datos: c } of d.cuestionarios) {
    const donde = `cuestionario «${id}»`;
    if (c.slug !== id) errores.push(`${donde}: el slug «${c.slug}» no coincide con el nombre del archivo`);
    if (c.preguntas.length !== 10) errores.push(`${donde}: tiene ${c.preguntas.length} preguntas (deben ser 10)`);
    const ids = new Set<string>();
    for (const p of c.preguntas) {
      const dp = `${donde}, pregunta «${p.id}»`;
      if (ids.has(p.id)) errores.push(`${dp}: id repetido`);
      ids.add(p.id);
      if (!Array.isArray(p.opciones) || p.opciones.length !== 3) errores.push(`${dp}: debe tener exactamente 3 opciones`);
      if (![0, 1, 2].includes(p.correcta)) errores.push(`${dp}: el índice de la respuesta correcta debe ser 0, 1 o 2`);
      const art = porSlug.get(p.articulo);
      if (!art) errores.push(`${dp}: el artículo «${p.articulo}» no existe`);
      else if (!art.medios.some((m) => m.tipo === 'imagen' && m.archivo === p.imagen)) {
        errores.push(`${dp}: la imagen «${p.imagen}» no es una imagen del artículo «${p.articulo}»`);
      }
    }
  }
  return errores;
}

async function leerJson<T>(dir: string): Promise<{ id: string; datos: T }[]> {
  const archivos = (await readdir(dir).catch(() => [] as string[])).filter((f) => f.endsWith('.json'));
  return Promise.all(
    archivos.map(async (f) => ({ id: f.replace(/\.json$/, ''), datos: JSON.parse(await readFile(join(dir, f), 'utf8')) as T })),
  );
}

async function main() {
  const atlas = JSON.parse(await readFile('src/data/atlas/paises.json', 'utf8')) as { adm0: string }[];
  const errores = validarContenido({
    articulos: await leerJson<Articulo>('src/content/articulos'),
    cuestionarios: await leerJson<Cuestionario>('src/content/cuestionarios'),
    adm0Atlas: new Set(atlas.map((p) => p.adm0)),
    imagenes: new Set(await readdir('src/assets/medios').catch(() => [] as string[])),
    publicos: new Set(await readdir('public/medios').catch(() => [] as string[])),
  });
  if (errores.length) {
    console.error(`✗ ${errores.length} problemas de contenido:`);
    for (const e of errores) console.error(`  - ${e}`);
    process.exit(1);
  }
  console.log('✓ Contenido válido');
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
