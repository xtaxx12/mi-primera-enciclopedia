import { parseHTML } from 'linkedom';
import { normalizar } from '../../src/lib/normalizar';
import { recortar, textoPlano } from '../../src/lib/texto';
import { claveArchivo } from './metadatos';

export type BloqueCrudo = { tipo: 'html'; html: string } | { tipo: 'figura'; archivo: string; pie: string };

export interface ResultadoLimpieza {
  bloques: BloqueCrudo[];
  resumen: string;
  palabras: number;
  enlacesInternos: string[];
  imagenes: string[];
}

export interface OpcionesLimpieza {
  slugPorTitulo: Map<string, string>;
}

const SECCIONES_DESCARTADAS = new Set([
  'galeria', 'referencias', 'notas', 'enlaces externos', 'vease tambien', 'bibliografia', 'fuentes',
]);
const ETIQUETAS_PERMITIDAS = new Set(['B', 'I', 'STRONG', 'EM', 'A', 'BR', 'SUB', 'SUP', 'LI', 'UL', 'OL']);
const QUITAR =
  'sup.reference, .mw-editsection, .reference, .noprint, .mw-cite-backlink, style, script, img, figure, span[typeof^="mw:File"], .gallery';
const ANCHO_MINIMO_IMAGEN = 100;

function escapar(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function archivoDeEnlace(href: string | null | undefined): string | null {
  const m = href ? /^\/wiki\/[^:/]+:(.+)$/.exec(href) : null;
  return m ? claveArchivo(m[1]) : null;
}

function tituloDeEnlace(href: string): string | null {
  const m = /^\/wiki\/([^#?]+)/.exec(href);
  if (!m) return null;
  try {
    return decodeURIComponent(m[1]).replace(/_/g, ' ');
  } catch {
    return null;
  }
}

function textoDeTitulo(el: Element): string {
  const copia = el.cloneNode(true) as Element;
  copia.querySelectorAll('.mw-editsection').forEach((x) => x.remove());
  return textoPlano(copia.innerHTML);
}

function desenvolver(el: Element): void {
  el.replaceWith(...Array.from(el.childNodes));
}

function limpiarElemento(el: Element, op: OpcionesLimpieza, enlaces: string[]): string {
  el.querySelectorAll(QUITAR).forEach((x) => x.remove());
  for (const hijo of Array.from(el.querySelectorAll('*'))) {
    const etiqueta = hijo.tagName;
    if (!ETIQUETAS_PERMITIDAS.has(etiqueta)) {
      desenvolver(hijo);
      continue;
    }
    const href = etiqueta === 'A' ? hijo.getAttribute('href') : null;
    for (const atributo of Array.from(hijo.attributes)) hijo.removeAttribute(atributo.name);
    if (etiqueta !== 'A') continue;
    const titulo = href ? tituloDeEnlace(href) : null;
    const slug = titulo ? op.slugPorTitulo.get(normalizar(titulo)) : undefined;
    if (slug) {
      hijo.setAttribute('href', `/articulo/${slug}`);
      if (!enlaces.includes(slug)) enlaces.push(slug);
    } else {
      desenvolver(hijo);
    }
  }
  return el.innerHTML.trim();
}

export function limpiarHtml(html: string, op: OpcionesLimpieza): ResultadoLimpieza {
  const { document } = parseHTML(`<!doctype html><html><body>${html}</body></html>`);
  const raiz = document.querySelector('.mw-parser-output') ?? document.body;

  const imagenes: string[] = [];
  for (const img of Array.from(raiz.querySelectorAll('img.mw-file-element'))) {
    if (Number(img.getAttribute('width') ?? 0) < ANCHO_MINIMO_IMAGEN) continue;
    const clave = archivoDeEnlace(img.closest('a')?.getAttribute('href'));
    if (clave && !imagenes.includes(clave)) imagenes.push(clave);
  }

  const bloques: BloqueCrudo[] = [];
  const enlacesInternos: string[] = [];
  const agregarHtml = (fragmento: string) => {
    const ultimo = bloques[bloques.length - 1];
    if (ultimo?.tipo === 'html') ultimo.html += `\n${fragmento}`;
    else bloques.push({ tipo: 'html', html: fragmento });
  };

  let descartando = false;
  for (const el of Array.from(raiz.children)) {
    const etiqueta = el.tagName;
    if (etiqueta === 'H2') {
      const titulo = textoDeTitulo(el);
      descartando = SECCIONES_DESCARTADAS.has(normalizar(titulo));
      if (!descartando && titulo) agregarHtml(`<h2>${escapar(titulo)}</h2>`);
      continue;
    }
    if (descartando) continue;
    if (etiqueta === 'H3' || etiqueta === 'H4') {
      const titulo = textoDeTitulo(el);
      if (titulo) agregarHtml(`<h3>${escapar(titulo)}</h3>`);
    } else if (etiqueta === 'FIGURE') {
      const clave = archivoDeEnlace(el.querySelector('a')?.getAttribute('href'));
      if (clave) bloques.push({ tipo: 'figura', archivo: clave, pie: textoPlano(el.querySelector('figcaption')?.innerHTML ?? '') });
    } else if (etiqueta === 'P' || ((etiqueta === 'UL' || etiqueta === 'OL') && !el.classList.contains('gallery'))) {
      const interior = limpiarElemento(el, op, enlacesInternos);
      const nombre = etiqueta.toLowerCase();
      if (textoPlano(interior)) agregarHtml(`<${nombre}>${interior}</${nombre}>`);
    }
  }

  const todoHtml = bloques.flatMap((b) => (b.tipo === 'html' ? [b.html] : [])).join('\n');
  const texto = textoPlano(todoHtml);
  const primerParrafo = /<p>([\s\S]*?)<\/p>/.exec(todoHtml)?.[1] ?? '';

  return {
    bloques,
    resumen: recortar(textoPlano(primerParrafo), 300),
    palabras: texto ? texto.split(' ').length : 0,
    enlacesInternos,
    imagenes,
  };
}
