import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { crearCliente, USER_AGENT } from './http';
import { leerCuracion, type EntradaCuracion } from './curacion';
import { obtenerArticulo, type ArticuloCrudo } from './vikidia';
import { limpiarHtml, type ResultadoLimpieza } from './limpiar';
import { API_COMMONS, API_VIKIDIA, claveArchivo, obtenerMetadatos } from './metadatos';
import {
  clavesDeImagenes,
  completarRelacionados,
  construirArticulo,
  motivoRechazo,
  prepararMedio,
  textoAlternativo,
} from './ensamblar';
import { generarInforme, type EntradaInforme, type MedioDescartado } from './informe';
import { normalizar } from '../../src/lib/normalizar';
import type { Medio } from '../../src/lib/tipos';

const DIR_ARTICULOS = 'src/content/articulos';
const DIR_IMAGENES = 'src/assets/medios';
const DIR_PUBLICOS = 'public/medios';
const MINIMO_ACEPTADOS = 100;

async function main() {
  const i = process.argv.indexOf('--curacion');
  const rutaCuracion = i > 0 ? process.argv[i + 1] : 'scripts/import/curacion.yaml';
  const entradas = leerCuracion(await readFile(rutaCuracion, 'utf8'));
  const cliente = crearCliente({ userAgent: USER_AGENT, directorioCache: 'scripts/import/.cache' });
  const fecha = new Date().toISOString().slice(0, 10);
  const informe: EntradaInforme[] = [];
  const descartados: MedioDescartado[] = [];
  const avisos: string[] = [];

  // 1. Descargar los artículos
  const crudos = new Map<string, ArticuloCrudo>();
  const conError = new Set<string>();
  for (const e of entradas) {
    console.log(`↓ ${e.titulo}`);
    try {
      const crudo = await obtenerArticulo(cliente, e.titulo);
      if (crudo) crudos.set(e.slug, crudo);
    } catch (err) {
      conError.add(e.slug);
      informe.push({ titulo: e.titulo, estado: 'rechazado', motivo: `error: ${(err as Error).message}` });
    }
  }

  // 2. Rechazar inexistentes, esbozos y artículos cortos
  const aceptadas: EntradaCuracion[] = [];
  for (const e of entradas) {
    if (conError.has(e.slug)) continue;
    const crudo = crudos.get(e.slug) ?? null;
    const previa = crudo ? limpiarHtml(crudo.html, { slugPorTitulo: new Map() }) : null;
    const motivo = motivoRechazo(crudo, previa);
    if (motivo) informe.push({ titulo: e.titulo, estado: 'rechazado', motivo });
    else aceptadas.push(e);
  }

  // 3. Limpiar con enlaces internos solo entre artículos aceptados
  const slugPorTitulo = new Map<string, string>();
  for (const e of aceptadas) {
    slugPorTitulo.set(normalizar(e.titulo), e.slug);
    slugPorTitulo.set(normalizar(crudos.get(e.slug)!.tituloResuelto), e.slug);
  }
  const limpiezas = new Map<string, ResultadoLimpieza>(
    aceptadas.map((e) => [e.slug, limpiarHtml(crudos.get(e.slug)!.html, { slugPorTitulo })]),
  );

  // 4. Metadatos: imágenes de artículos vía Vikidia, extras vía Commons
  const clavesVikidia = [...new Set(aceptadas.flatMap((e) => clavesDeImagenes(limpiezas.get(e.slug)!)))];
  const clavesCommons = [...new Set(aceptadas.flatMap((e) => e.extras.map(claveArchivo)))];
  console.log(`Metadatos: ${clavesVikidia.length} imágenes de artículos y ${clavesCommons.length} extras`);
  const metadatos = new Map([
    ...(await obtenerMetadatos(cliente, API_VIKIDIA, clavesVikidia)),
    ...(await obtenerMetadatos(cliente, API_COMMONS, clavesCommons)),
  ]);

  // 5. Preparar y descargar la multimedia
  const medios = new Map<string, Medio>();
  const procesadas = new Set<string>();
  for (const e of aceptadas) {
    const limpieza = limpiezas.get(e.slug)!;
    const pies = new Map(limpieza.bloques.flatMap((b) => (b.tipo === 'figura' && b.pie ? [[b.archivo, b.pie] as const] : [])));
    for (const clave of [...clavesDeImagenes(limpieza), ...e.extras.map(claveArchivo)]) {
      if (procesadas.has(clave)) continue;
      procesadas.add(clave);
      const m = metadatos.get(clave);
      if (!m) {
        descartados.push({ articulo: e.titulo, archivo: clave, motivo: 'sin metadatos' });
        continue;
      }
      const r = prepararMedio(m, textoAlternativo(pies.get(clave), e.titulo));
      if ('descartado' in r) {
        descartados.push({ articulo: e.titulo, archivo: clave, motivo: r.descartado });
        continue;
      }
      const destino = join(r.medio.tipo === 'imagen' ? DIR_IMAGENES : DIR_PUBLICOS, r.medio.archivo);
      try {
        console.log(`  ↓ ${clave}`);
        await cliente.descargar(r.descarga.url, destino);
        medios.set(clave, r.medio);
        if (r.aviso) avisos.push(`${clave}: ${r.aviso}`);
      } catch (err) {
        descartados.push({ articulo: e.titulo, archivo: clave, motivo: `descarga fallida: ${(err as Error).message}` });
      }
    }
  }

  // 6. Escribir los artículos
  const articulos = completarRelacionados(
    aceptadas.map((e) =>
      construirArticulo({ entrada: e, crudo: crudos.get(e.slug)!, limpieza: limpiezas.get(e.slug)!, medios, fecha }),
    ),
  );
  await rm(DIR_ARTICULOS, { recursive: true, force: true });
  await mkdir(DIR_ARTICULOS, { recursive: true });
  for (const a of articulos) {
    await writeFile(join(DIR_ARTICULOS, `${a.slug}.json`), `${JSON.stringify(a, null, 2)}\n`);
    informe.push({ titulo: a.titulo, estado: 'aceptado' });
  }

  // 7. Borrar multimedia que ya no usa ningún artículo
  const usados = new Set(articulos.flatMap((a) => a.medios.map((m) => m.archivo)));
  for (const dir of [DIR_IMAGENES, DIR_PUBLICOS]) {
    for (const archivo of await readdir(dir).catch(() => [] as string[])) {
      if (!usados.has(archivo)) await rm(join(dir, archivo));
    }
  }

  // 8. Informe
  await writeFile('scripts/import/informe.md', generarInforme(informe, descartados, avisos, fecha));
  console.log(
    `\nAceptados: ${articulos.length} · Rechazados: ${informe.length - articulos.length} · Multimedia descartada: ${descartados.length}`,
  );
  console.log('Detalle en scripts/import/informe.md');
  if (articulos.length < MINIMO_ACEPTADOS) {
    console.error(`Se aceptaron ${articulos.length} artículos; el mínimo es ${MINIMO_ACEPTADOS}.`);
    process.exitCode = 1;
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
