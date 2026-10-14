# Mi Primera Enciclopedia — Fase 1: plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir y publicar un sitio estático en español que recrea la experiencia de Mi Primera Encarta 2009 con contenido libre: artículos de Vikidia, multimedia de Wikimedia Commons, atlas de Natural Earth y cuestionarios con imágenes.

**Architecture:** Un importador en TypeScript (`scripts/import/`) descarga y limpia ~150 artículos de Vikidia y su multimedia de Commons, y los guarda en el repositorio. Astro 7 genera páginas estáticas a partir de ese contenido. Una ventana nostálgica persiste entre páginas gracias a `ClientRouter` + `transition:persist`. Solo el buscador, los resultados, el atlas y el cuestionario son islas de Preact.

**Tech Stack:** Astro 7, Preact 10, TypeScript, MiniSearch 7, d3-geo 3 + d3-geo-projection 4 (solo en build), linkedom, yaml, Vitest 5, Playwright + axe, Vercel.

**Spec:** `docs/superpowers/specs/2026-10-14-mi-primera-enciclopedia-fase1-design.md`

## Global Constraints

- Ningún archivo, imagen, sonido, texto ni código del DVD de Encarta entra al repositorio. El ISO vive fuera de esta carpeta y nunca se agrega.
- El nombre del sitio se define solo en `src/config.ts` (provisional: "Mi Primera Enciclopedia"). La palabra "Encarta" aparece únicamente en el aviso: "Homenaje a Mi Primera Encarta (2009). Proyecto no afiliado a Microsoft."
- Licencias de multimedia permitidas: dominio público, CC0, CC BY y CC BY-SA. Cualquier otra, o una desconocida, descarta el archivo.
- Textos derivados (artículos limpios y cuestionarios): CC BY-SA 3.0. Código: MIT.
- Node ≥ 22.12.0. Astro 7.x. Preact 10.x (`@astrojs/preact` 6 no admite Preact 11). Zod se importa de `astro/zod`.
- Astro 7 usa `compressHTML: 'jsx'` y un compilador estricto: en las plantillas `.astro`, el texto y las etiquetas en línea van en la misma línea (o se separan con `{' '}`), y no se anidan elementos de bloque dentro de `<p>`.
- Todo el texto visible está en español.
- Importador: 1 s de pausa entre peticiones a las APIs; 3 reintentos con esperas de 2, 4 y 8 s; rechaza artículos inexistentes, de la categoría `Vikidia:Esbozos` o con menos de 150 palabras; sale con código distinto de cero si se aceptan menos de 100.
- Cuestionarios: exactamente 10 preguntas de 3 opciones; 10 puntos por acierto; estrellas: 0–4 aciertos → 1, 5–7 → 2, 8–10 → 3; se guardan las 5 mejores puntuaciones por cuestionario en `localStorage` bajo `mpe:puntajes:<slug>`; nombre de hasta 12 caracteres.
- Tamaños de pantalla: escritorio ≥ 1180 px y tablet 768–1179 px con ventana completa; celular < 768 px simplificado.
- Accesibilidad: todo operable con teclado, `alt` en todas las imágenes, contraste AA, sonido silenciable, `prefers-reduced-motion` desactiva animaciones.
- Cada commit termina con la línea `Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>`.
- Todas las rutas de este plan son relativas a la raíz del repositorio: `/Users/joelrojas/Downloads/Programs/mi-primera-enciclopedia`.

## Review Focus

1. **HTML de Vikidia con atributos peligrosos** (`onclick`, `style`, `href="javascript:…"`): la salida no conserva ningún atributo salvo `href="/articulo/<slug>"` en enlaces internos. Prueba en la Tarea 4.
2. **Dos títulos de la curación que generan el mismo slug** (por ejemplo "Perú" y "Peru"): `leerCuracion` falla con un mensaje claro antes de descargar nada. Prueba en la Tarea 5.
3. **Responder dos veces la misma pregunta** (doble clic): el acierto cuenta una sola vez. Prueba en la Tarea 15.
4. **Nombre del jugador vacío, solo espacios, de más de 12 caracteres o con `<script>`**: se guarda recortado, el vacío se vuelve "Anónimo" y siempre se muestra como texto. Prueba en la Tarea 15.
5. **Consulta de búsqueda vacía, solo signos o de 500 caracteres**: no hay errores; devuelve lista vacía o resultados normales. Prueba en la Tarea 13.

---

## Mapa de archivos

| Archivo | Responsabilidad | Tarea |
|---|---|---|
| `package.json`, `astro.config.mjs`, `tsconfig.json`, `vitest.config.ts`, `.gitignore`, `LICENSE`, `README.md` | Proyecto base | 1 |
| `src/config.ts` | Nombre del sitio, categorías, textos globales | 1 |
| `src/lib/tipos.ts` | Tipos compartidos (Articulo, Medio, Bloque, Cuestionario…) | 1 |
| `src/lib/normalizar.ts` | `normalizar`, `slugificar` | 1 |
| `scripts/import/http.ts` | Cliente HTTP con caché, pausa y reintentos | 2 |
| `src/lib/texto.ts` | `decodificarEntidades`, `textoPlano`, `recortar` | 3 |
| `scripts/import/licencias.ts` | `licenciaPermitida` | 3 |
| `scripts/import/metadatos.ts` | Metadatos de archivos (Vikidia/Commons), elección de descarga, nombre local | 3 |
| `scripts/import/limpiar.ts` | HTML de Vikidia → bloques limpios | 4 |
| `scripts/import/vikidia.ts` | Descarga de artículos (`action=parse`) | 5 |
| `scripts/import/curacion.ts`, `scripts/import/curacion.yaml` | Lectura y validación de la lista curada | 5, 7 |
| `scripts/import/candidatos.ts` | Ayuda para elegir artículos por categoría de Vikidia | 5 |
| `scripts/import/ensamblar.ts` | Rechazos, construcción de `Articulo`, relacionados, medios | 6 |
| `scripts/import/informe.ts` | Informe en Markdown | 6 |
| `scripts/import/importar.ts` | CLI `npm run import` | 6 |
| `src/content/articulos/*.json`, `src/assets/medios/*`, `public/medios/*` | Contenido importado | 7 |
| `scripts/atlas/generar.ts`, `scripts/atlas/datos/ne_110m_admin_0_countries.geojson` | Datos del atlas | 8 |
| `src/data/atlas/paises.json`, `src/data/atlas/vistas.json` | Mapa generado | 8 |
| `src/content.config.ts` | Colecciones de contenido con Zod | 9 |
| `scripts/validar.ts` | Validaciones previas al build | 9 |
| `scripts/iconos/descargar.ts`, `public/iconos/*.svg` | Íconos OpenMoji | 10 |
| `src/styles/tokens.css`, `src/styles/global.css` | Estilo nostálgico | 10 |
| `src/layouts/Base.astro`, `src/components/Ventana.astro`, `src/components/BarraHerramientas.astro`, `src/components/Icono.astro` | Ventana persistente | 10 |
| `src/pages/index.astro`, `src/pages/acerca.astro`, `src/pages/404.astro` | Inicio, Acerca de, 404 | 10 |
| `playwright.config.ts`, `tests/e2e/*.spec.ts` | Pruebas de extremo a extremo | 10–17 |
| `src/lib/sonido.ts`, `src/lib/sonido-sitio.ts`, `src/lib/guia.ts`, `src/components/Guia.astro` | Sonidos y personaje guía | 11 |
| `src/lib/medios.ts`, `src/lib/articulos.ts`, componentes de artículo, `src/pages/categoria/[slug].astro`, `src/pages/articulo/[slug].astro` | Categorías y artículos | 12 |
| `src/lib/busqueda.ts`, `src/pages/indice-busqueda.json.ts`, `src/components/Buscador.tsx`, `src/components/ResultadosBusqueda.tsx`, `src/pages/buscar.astro` | Búsqueda | 13 |
| `src/lib/vista.ts`, `src/components/Atlas.tsx`, `src/pages/atlas.astro`, `src/pages/pais/[adm0].astro` | Atlas | 14 |
| `src/lib/preguntas.ts`, `src/lib/puntajes.ts` | Motor de preguntas y puntuaciones | 15 |
| `scripts/cuestionarios/ayuda.ts`, `src/content/cuestionarios/*.json` | Cuestionarios | 16 |
| `src/components/Cuestionario.tsx`, `src/pages/juegos/index.astro`, `src/pages/juegos/cuestionario/[slug].astro` | Pantallas de juegos | 17 |
| Despliegue | Vercel | 18 |

---
### Task 1: Proyecto base y normalización de texto

**Files:**
- Create: `package.json`, `astro.config.mjs`, `tsconfig.json`, `vitest.config.ts`, `.gitignore`, `LICENSE`, `README.md`
- Create: `src/config.ts`, `src/lib/tipos.ts`, `src/lib/normalizar.ts`
- Create: `src/pages/index.astro` (temporal; la Tarea 10 lo reemplaza)
- Test: `tests/unit/normalizar.test.ts`

**Interfaces:**
- Consumes: nada.
- Produces:
  - `SITIO: { nombre: string; lema: string; homenaje: string; personaje: string }`
  - `CATEGORIAS: readonly { slug: CategoriaSlug; nombre: string; icono: string }[]`, `type CategoriaSlug`, `SLUGS_CATEGORIAS: [CategoriaSlug, ...CategoriaSlug[]]`, `categoriaPorSlug(slug: string)`
  - Tipos en `src/lib/tipos.ts`: `Licencia`, `TipoMedio`, `Medio`, `Bloque`, `Articulo`, `Pregunta`, `Cuestionario`, `PaisAtlas`, `VistaAtlas`, `Caja`, `Pantalla`
  - `normalizar(texto: string): string`, `slugificar(texto: string): string`

- [ ] **Step 1: Inicializar el proyecto e instalar dependencias**

```bash
cd /Users/joelrojas/Downloads/Programs/mi-primera-enciclopedia
npm init -y
npm pkg set type=module engines.node=">=22.12.0" license=MIT
npm install astro@7 @astrojs/preact@6 preact@10 minisearch@7 @fontsource/baloo-2@5
npm install -D vitest@5 tsx@4 yaml@2 linkedom@0.18 d3-geo@3 d3-geo-projection@4 @playwright/test@1 @axe-core/playwright@4
npm pkg set scripts.dev="astro dev" scripts.build="astro build" scripts.preview="astro preview" scripts.test="vitest run" scripts.test:e2e="playwright test"
```

Expected: `npm ls preact` muestra una versión 10.x.

- [ ] **Step 2: Crear la configuración**

`astro.config.mjs`:

```js
import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';

export default defineConfig({
  integrations: [preact()],
});
```

`tsconfig.json`:

```json
{
  "extends": "astro/tsconfigs/strict",
  "include": [".astro/types.d.ts", "**/*"],
  "exclude": ["dist"],
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "preact"
  }
}
```

`vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/unit/**/*.test.ts'],
    environment: 'node',
  },
});
```

`.gitignore`:

```
node_modules/
dist/
.astro/
.vercel/
scripts/import/.cache/
test-results/
playwright-report/
*.iso
*.ISO
.DS_Store
```

`LICENSE` (texto MIT estándar):

```
MIT License

Copyright (c) 2026 xtaxx12

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

`README.md`:

```markdown
# Mi Primera Enciclopedia

Enciclopedia infantil en español que recrea la experiencia de Mi Primera Encarta (2009)
con contenido libre. Homenaje a Mi Primera Encarta (2009). Proyecto no afiliado a Microsoft.

- Código: MIT (ver `LICENSE`).
- Artículos y cuestionarios: CC BY-SA 3.0, basados en Vikidia.
- Multimedia: cada archivo con su licencia de Wikimedia Commons.

## Comandos

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Valida el contenido y genera el sitio en `dist/` |
| `npm test` | Pruebas unitarias |
| `npm run test:e2e` | Pruebas de extremo a extremo |
```

- [ ] **Step 3: Crear `src/config.ts` y `src/lib/tipos.ts`**

`src/config.ts`:

```ts
export const SITIO = {
  nombre: 'Mi Primera Enciclopedia',
  lema: 'Explora, aprende y juega',
  homenaje: 'Homenaje a Mi Primera Encarta (2009). Proyecto no afiliado a Microsoft.',
  personaje: 'Lumi',
} as const;

export const CATEGORIAS = [
  { slug: 'animales', nombre: 'Animales', icono: '1F981' },
  { slug: 'planeta-tierra', nombre: 'Planeta Tierra', icono: '1F30B' },
  { slug: 'espacio', nombre: 'Espacio', icono: '1F680' },
  { slug: 'cuerpo-humano', nombre: 'Cuerpo humano', icono: '1FAC0' },
  { slug: 'historia', nombre: 'Historia', icono: '1F3DB' },
  { slug: 'arte-y-musica', nombre: 'Arte y música', icono: '1F3A8' },
  { slug: 'ciencia-y-tecnologia', nombre: 'Ciencia y tecnología', icono: '1F52C' },
  { slug: 'paises', nombre: 'Países', icono: '1F30E' },
] as const;

export type CategoriaSlug = (typeof CATEGORIAS)[number]['slug'];

export const SLUGS_CATEGORIAS = CATEGORIAS.map((c) => c.slug) as [CategoriaSlug, ...CategoriaSlug[]];

export function categoriaPorSlug(slug: string) {
  return CATEGORIAS.find((c) => c.slug === slug);
}
```

`src/lib/tipos.ts`:

```ts
import type { CategoriaSlug } from '../config';

export type Licencia = 'dominio-publico' | 'cc0' | 'cc-by' | 'cc-by-sa';
export type TipoMedio = 'imagen' | 'audio' | 'video';

export interface Medio {
  archivo: string; // nombre del archivo local (src/assets/medios o public/medios)
  tipo: TipoMedio;
  alt: string;
  autor: string;
  licencia: Licencia;
  licenciaUrl: string;
  fuenteUrl: string; // página del archivo en Commons
}

export type Bloque =
  | { tipo: 'html'; html: string }
  | { tipo: 'figura'; archivo: string; pie: string };

export interface Articulo {
  slug: string;
  titulo: string;
  categoria: CategoriaSlug;
  resumen: string;
  bloques: Bloque[];
  principal?: Medio;
  medios: Medio[];
  relacionados: string[];
  pais?: { adm0: string };
  fuente: { url: string; historialUrl: string; revid: number; fecha: string };
}

export interface Pregunta {
  id: string;
  texto: string;
  imagen: string; // archivo de un Medio de tipo imagen del artículo referido
  opciones: [string, string, string];
  correcta: 0 | 1 | 2;
  articulo: string; // slug
  explicacion: string;
}

export interface Cuestionario {
  slug: string;
  titulo: string;
  categoria: CategoriaSlug;
  preguntas: Pregunta[];
}

export interface PaisAtlas {
  adm0: string;
  nombre: string;
  continente: string;
  poblacion: number;
  d: string; // path SVG
}

export type VistaAtlas = 'mundo' | 'africa' | 'america' | 'asia' | 'europa' | 'oceania';

/** viewBox: [x, y, ancho, alto] */
export type Caja = [number, number, number, number];

export type Pantalla =
  | 'inicio' | 'categoria' | 'articulo' | 'buscar' | 'atlas' | 'pais'
  | 'juegos' | 'cuestionario' | 'acerca' | '404';
```

- [ ] **Step 4: Escribir la prueba que falla**

`tests/unit/normalizar.test.ts`:

```ts
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
```

- [ ] **Step 5: Correr la prueba y verificar que falla**

Run: `npx vitest run tests/unit/normalizar.test.ts`
Expected: FAIL, no se puede resolver `../../src/lib/normalizar`.

- [ ] **Step 6: Implementar `src/lib/normalizar.ts`**

```ts
/** Minúsculas y sin diacríticos: "Árbol" → "arbol", "NIÑO" → "nino". */
export function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/\p{M}+/gu, '').toLowerCase();
}

/** Identificador para URLs: "Arte y música" → "arte-y-musica". */
export function slugificar(texto: string): string {
  return normalizar(texto)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
```

- [ ] **Step 7: Correr la prueba y verificar que pasa**

Run: `npx vitest run tests/unit/normalizar.test.ts`
Expected: PASS (4 pruebas).

- [ ] **Step 8: Página temporal y build de humo**

`src/pages/index.astro`:

```astro
---
import { SITIO } from '../config';
---
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <title>{SITIO.nombre}</title>
  </head>
  <body>
    <h1>{SITIO.nombre}</h1>
  </body>
</html>
```

Run: `npm run build`
Expected: termina sin errores y existe `dist/index.html`.

- [ ] **Step 9: Commit**

```bash
git add .
git commit -m "chore: proyecto base Astro 7 con normalización de texto" -m "Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: Cliente HTTP del importador

**Files:**
- Create: `scripts/import/http.ts`
- Test: `tests/unit/http.test.ts`

**Interfaces:**
- Consumes: nada.
- Produces:
  - `interface ClienteHttp { obtenerJson(url: string): Promise<unknown>; descargar(url: string, destino: string): Promise<void> }`
  - `crearCliente(op: OpcionesCliente): ClienteHttp` con `OpcionesCliente { userAgent; directorioCache; pausaMs?=1000; pausaDescargasMs?=250; esperasReintentoMs?=[2000,4000,8000]; fetchFn?; dormir? }`
  - `class ErrorHttp extends Error { estado: number; url: string; reintentable: boolean }`
  - `USER_AGENT: string`

- [ ] **Step 1: Escribir las pruebas que fallan**

`tests/unit/http.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { crearCliente } from '../../scripts/import/http';

let dir: string;
beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'mpe-http-'));
});

const ok = (cuerpo: unknown) => new Response(JSON.stringify(cuerpo), { status: 200 });

function cliente(fetchFn: typeof fetch, dormir = vi.fn(async () => {})) {
  return { dormir, c: crearCliente({ userAgent: 'prueba/1', directorioCache: dir, fetchFn, dormir }) };
}

describe('crearCliente', () => {
  it('envía el User-Agent', async () => {
    const fetchFn = vi.fn(async () => ok({ a: 1 }));
    const { c } = cliente(fetchFn as unknown as typeof fetch);
    await c.obtenerJson('https://x.test/a');
    const init = fetchFn.mock.calls[0][1] as RequestInit;
    expect((init.headers as Record<string, string>)['User-Agent']).toBe('prueba/1');
  });

  it('usa la caché para la misma URL', async () => {
    const fetchFn = vi.fn(async () => ok({ a: 1 }));
    const { c } = cliente(fetchFn as unknown as typeof fetch);
    expect(await c.obtenerJson('https://x.test/a')).toEqual({ a: 1 });
    expect(await c.obtenerJson('https://x.test/a')).toEqual({ a: 1 });
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  it('hace una pausa de 1000 ms antes de cada petición real menos la primera', async () => {
    const fetchFn = vi.fn(async () => ok({}));
    const { c, dormir } = cliente(fetchFn as unknown as typeof fetch);
    await c.obtenerJson('https://x.test/a');
    expect(dormir).not.toHaveBeenCalled();
    await c.obtenerJson('https://x.test/b');
    expect(dormir).toHaveBeenCalledWith(1000);
  });

  it('reintenta ante un 503 y luego responde', async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValueOnce(new Response('', { status: 503 }))
      .mockResolvedValueOnce(ok({ b: 2 }));
    const { c, dormir } = cliente(fetchFn as unknown as typeof fetch);
    expect(await c.obtenerJson('https://x.test/c')).toEqual({ b: 2 });
    expect(dormir).toHaveBeenCalledWith(2000);
  });

  it('se rinde después de 3 reintentos', async () => {
    const fetchFn = vi.fn(async () => new Response('', { status: 500 }));
    const { c, dormir } = cliente(fetchFn as unknown as typeof fetch);
    await expect(c.obtenerJson('https://x.test/d')).rejects.toThrow('HTTP 500');
    expect(fetchFn).toHaveBeenCalledTimes(4);
    expect(dormir).toHaveBeenCalledWith(8000);
  });

  it('reintenta ante un error de red', async () => {
    const fetchFn = vi.fn().mockRejectedValueOnce(new TypeError('fetch failed')).mockResolvedValueOnce(ok({ c: 3 }));
    const { c } = cliente(fetchFn as unknown as typeof fetch);
    expect(await c.obtenerJson('https://x.test/e')).toEqual({ c: 3 });
  });

  it('no reintenta un 404', async () => {
    const fetchFn = vi.fn(async () => new Response('', { status: 404 }));
    const { c } = cliente(fetchFn as unknown as typeof fetch);
    await expect(c.obtenerJson('https://x.test/f')).rejects.toThrow('HTTP 404');
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  it('descarga un archivo y no lo vuelve a pedir si ya existe', async () => {
    const fetchFn = vi.fn(async () => new Response(new Uint8Array([1, 2, 3]), { status: 200 }));
    const { c } = cliente(fetchFn as unknown as typeof fetch);
    const destino = join(dir, 'sub', 'x.bin');
    await c.descargar('https://x.test/x.bin', destino);
    expect([...(await readFile(destino))]).toEqual([1, 2, 3]);
    await c.descargar('https://x.test/x.bin', destino);
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  it('respeta un archivo existente aunque no lo haya descargado', async () => {
    const fetchFn = vi.fn(async () => ok({}));
    const { c } = cliente(fetchFn as unknown as typeof fetch);
    const destino = join(dir, 'y.bin');
    await writeFile(destino, 'ya estaba');
    await c.descargar('https://x.test/y.bin', destino);
    expect(fetchFn).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Correr las pruebas y verificar que fallan**

Run: `npx vitest run tests/unit/http.test.ts`
Expected: FAIL, no se puede resolver `../../scripts/import/http`.

- [ ] **Step 3: Implementar `scripts/import/http.ts`**

```ts
import { createHash } from 'node:crypto';
import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

export const USER_AGENT = 'MiPrimeraEnciclopedia/0.1 (proyecto educativo de portafolio)';

export interface OpcionesCliente {
  userAgent: string;
  directorioCache: string;
  pausaMs?: number;
  pausaDescargasMs?: number;
  esperasReintentoMs?: number[];
  fetchFn?: typeof fetch;
  dormir?: (ms: number) => Promise<void>;
}

export interface ClienteHttp {
  obtenerJson(url: string): Promise<unknown>;
  descargar(url: string, destino: string): Promise<void>;
}

export class ErrorHttp extends Error {
  constructor(
    public estado: number,
    public url: string,
    public reintentable: boolean,
  ) {
    super(`HTTP ${estado} en ${url}`);
  }
}

const esperar = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

async function existe(ruta: string): Promise<boolean> {
  try {
    await access(ruta);
    return true;
  } catch {
    return false;
  }
}

export function crearCliente(op: OpcionesCliente): ClienteHttp {
  const fetchFn = op.fetchFn ?? fetch;
  const dormir = op.dormir ?? esperar;
  const pausaApi = op.pausaMs ?? 1000;
  const pausaDescargas = op.pausaDescargasMs ?? 250;
  const esperas = op.esperasReintentoMs ?? [2000, 4000, 8000];
  let primera = true;

  async function pedir(url: string, pausa: number): Promise<Response> {
    for (let intento = 0; ; intento++) {
      if (!primera) await dormir(pausa);
      primera = false;
      try {
        const r = await fetchFn(url, { headers: { 'User-Agent': op.userAgent } });
        if (!r.ok) throw new ErrorHttp(r.status, url, r.status >= 500 || r.status === 429);
        return r;
      } catch (e) {
        const reintentable = e instanceof ErrorHttp ? e.reintentable : true;
        if (!reintentable || intento >= esperas.length) throw e;
        await dormir(esperas[intento]);
      }
    }
  }

  return {
    async obtenerJson(url) {
      const ruta = join(op.directorioCache, `${createHash('sha1').update(url).digest('hex')}.json`);
      if (await existe(ruta)) return JSON.parse(await readFile(ruta, 'utf8'));
      const texto = await (await pedir(url, pausaApi)).text();
      const datos = JSON.parse(texto);
      await mkdir(op.directorioCache, { recursive: true });
      await writeFile(ruta, texto);
      return datos;
    },
    async descargar(url, destino) {
      if (await existe(destino)) return;
      const r = await pedir(url, pausaDescargas);
      const datos = Buffer.from(await r.arrayBuffer());
      await mkdir(dirname(destino), { recursive: true });
      await writeFile(destino, datos);
    },
  };
}
```

- [ ] **Step 4: Correr las pruebas y verificar que pasan**

Run: `npx vitest run tests/unit/http.test.ts`
Expected: PASS (9 pruebas).

- [ ] **Step 5: Commit**

```bash
git add scripts/import/http.ts tests/unit/http.test.ts
git commit -m "feat(import): cliente HTTP con caché, pausa y reintentos" -m "Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---
### Task 3: Texto plano, licencias y metadatos de archivos

**Files:**
- Create: `src/lib/texto.ts`, `scripts/import/licencias.ts`, `scripts/import/metadatos.ts`
- Test: `tests/unit/texto.test.ts`, `tests/unit/licencias.test.ts`, `tests/unit/metadatos.test.ts`

**Interfaces:**
- Consumes: `ClienteHttp` (Tarea 2), `slugificar` (Tarea 1), tipos `Licencia`, `TipoMedio` (Tarea 1).
- Produces:
  - `decodificarEntidades(s: string): string`, `textoPlano(html: string): string`, `recortar(texto: string, max?: number): string`
  - `licenciaPermitida(codigo: string | undefined): Licencia | null`
  - `API_VIKIDIA`, `API_COMMONS`
  - `interface Derivado { tipo: string; clave: string | null; url: string }`
  - `interface MetadatosArchivo { clave; mime; urlOriginal; urlMiniatura: string | null; fuenteUrl; autor; licencia: Licencia | null; licenciaUrl; descripcion; derivados: Derivado[] }`
  - `interface Descarga { url: string; extension: string; aviso?: string }`
  - `claveArchivo(nombre: string): string` — "Archivo:Lion_x.jpg" → "Lion x.jpg"
  - `obtenerMetadatos(cliente, api, nombres: string[]): Promise<Map<string, MetadatosArchivo>>` (clave → metadatos)
  - `tipoDe(m: Pick<MetadatosArchivo, 'mime' | 'derivados'>): TipoMedio | null`
  - `elegirDescarga(m: MetadatosArchivo): Descarga | null`
  - `nombreLocal(clave: string, extension: string): string`

Datos verificados contra las APIs reales:
- Vikidia (`imageinfo`) devuelve metadatos completos para archivos de Commons y **ninguno** para archivos subidos solo a Vikidia (por ejemplo `Cabeza olmeca.jpg`); esos se descartan por licencia desconocida.
- Los archivos de Commons vistos desde Vikidia pueden venir con `missing: true` y aun así traer `imageinfo`; no se debe filtrar por `missing`.
- Se piden miniaturas de 500 px (`iiurlwidth=500`), un tamaño estándar de Commons de unos 60 KB; anchos intermedios como 640 u 800 devuelven el archivo de 960 px, mucho más pesado.
- `videoinfo` de Commons funciona también para imágenes y agrega `derivatives` (transcodificaciones) para audio y video.

- [ ] **Step 1: Escribir las pruebas que fallan**

`tests/unit/texto.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { decodificarEntidades, recortar, textoPlano } from '../../src/lib/texto';

describe('decodificarEntidades', () => {
  it('decodifica entidades con nombre y numéricas', () => {
    expect(decodificarEntidades('a &amp; b &lt;c&gt; &#233; &#xE9; &nbsp;x &bogus;')).toBe('a & b <c> é é  x &bogus;');
  });
  it('deja intactos los códigos fuera de rango', () => {
    expect(decodificarEntidades('&#99999999;')).toBe('&#99999999;');
  });
});

describe('textoPlano', () => {
  it('quita etiquetas y colapsa espacios', () => {
    expect(textoPlano('<p>Hola <b>mundo</b></p>\n<p>¡Sí!</p>')).toBe('Hola mundo ¡Sí!');
  });
  it('no agrega espacios por etiquetas en línea', () => {
    expect(textoPlano('El león (<i>Panthera leo</i>) ruge')).toBe('El león (Panthera leo) ruge');
    expect(textoPlano('<p>Uno</p><p>Dos</p>')).toBe('Uno Dos');
  });
});

describe('recortar', () => {
  it('no toca textos cortos', () => {
    expect(recortar('Hola mundo', 300)).toBe('Hola mundo');
  });
  it('corta en un espacio y agrega puntos suspensivos', () => {
    const largo = Array.from({ length: 100 }, () => 'palabra').join(' ');
    const r = recortar(largo, 300);
    expect(r.length).toBeLessThanOrEqual(300);
    expect(r.endsWith('palabra…')).toBe(true);
  });
});
```

`tests/unit/licencias.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { licenciaPermitida } from '../../scripts/import/licencias';

describe('licenciaPermitida', () => {
  it.each([
    ['cc-by-sa-3.0', 'cc-by-sa'],
    ['cc-by-sa-4.0', 'cc-by-sa'],
    ['cc-by-2.0', 'cc-by'],
    ['CC-BY-4.0', 'cc-by'],
    ['pd', 'dominio-publico'],
    ['cc0', 'cc0'],
  ])('acepta %s', (codigo, esperado) => {
    expect(licenciaPermitida(codigo)).toBe(esperado);
  });

  it.each(['gfdl', 'cc-by-nc-2.0', 'cc-by-nc-sa-3.0', 'cc-by-nd-4.0', 'fal', '', undefined])('rechaza %s', (codigo) => {
    expect(licenciaPermitida(codigo)).toBeNull();
  });
});
```

`tests/unit/metadatos.test.ts`:

```ts
import { describe, it, expect, vi } from 'vitest';
import {
  API_COMMONS,
  API_VIKIDIA,
  claveArchivo,
  elegirDescarga,
  nombreLocal,
  obtenerMetadatos,
  tipoDe,
  type MetadatosArchivo,
} from '../../scripts/import/metadatos';

const base: MetadatosArchivo = {
  clave: 'X.jpg',
  mime: 'image/jpeg',
  urlOriginal: 'https://upload.wikimedia.org/a/X.jpg',
  urlMiniatura: 'https://upload.wikimedia.org/thumb/a/X.jpg/960px-X.JPG?utm_source=commons',
  fuenteUrl: 'https://commons.wikimedia.org/wiki/File:X.jpg',
  autor: 'Ana',
  licencia: 'cc-by',
  licenciaUrl: '',
  descripcion: '',
  derivados: [],
};

describe('claveArchivo', () => {
  it('quita el prefijo, decodifica y cambia guiones bajos por espacios', () => {
    expect(claveArchivo('Archivo:Lion_waiting_in_Namibia.jpg')).toBe('Lion waiting in Namibia.jpg');
    expect(claveArchivo('File:Le%C3%B3n_rugiendo.jpg')).toBe('León rugiendo.jpg');
    expect(claveArchivo('lion.jpg')).toBe('Lion.jpg');
    expect(claveArchivo('100%_seguro.jpg')).toBe('100% seguro.jpg');
  });
});

describe('tipoDe', () => {
  it('clasifica por MIME', () => {
    expect(tipoDe({ mime: 'image/png', derivados: [] })).toBe('imagen');
    expect(tipoDe({ mime: 'audio/mpeg', derivados: [] })).toBe('audio');
    expect(tipoDe({ mime: 'video/webm', derivados: [] })).toBe('video');
    expect(tipoDe({ mime: 'application/ogg', derivados: [{ tipo: 'video/webm', clave: '480p.vp9.webm', url: 'u' }] })).toBe('video');
    expect(tipoDe({ mime: 'application/ogg', derivados: [] })).toBe('audio');
    expect(tipoDe({ mime: 'application/pdf', derivados: [] })).toBeNull();
  });
});

describe('elegirDescarga', () => {
  it('usa la miniatura de las imágenes', () => {
    expect(elegirDescarga(base)).toEqual({ url: base.urlMiniatura, extension: 'jpg' });
  });
  it('usa el original si no hay miniatura', () => {
    expect(elegirDescarga({ ...base, mime: 'image/png', urlMiniatura: null, urlOriginal: 'https://u/a/Y.png' })).toEqual({ url: 'https://u/a/Y.png', extension: 'png' });
  });
  it('descarta lo que no es imagen, audio ni video', () => {
    expect(elegirDescarga({ ...base, mime: 'application/pdf' })).toBeNull();
  });
  it('prefiere MP3 para el audio', () => {
    expect(elegirDescarga({ ...base, mime: 'audio/mpeg', urlMiniatura: null, urlOriginal: 'https://u/a.mp3' })).toEqual({ url: 'https://u/a.mp3', extension: 'mp3' });
    expect(
      elegirDescarga({ ...base, mime: 'application/ogg', urlMiniatura: null, derivados: [{ tipo: 'audio/mpeg', clave: 'mp3', url: 'https://u/a.ogg.mp3' }] }),
    ).toEqual({ url: 'https://u/a.ogg.mp3', extension: 'mp3' });
  });
  it('acepta Ogg con aviso si no hay MP3', () => {
    const r = elegirDescarga({ ...base, mime: 'audio/ogg', urlMiniatura: null, urlOriginal: 'https://u/a.ogg' });
    expect(r).toMatchObject({ url: 'https://u/a.ogg', extension: 'ogg' });
    expect(r?.aviso).toContain('Safari');
  });
  it('elige WebM de 480p con aviso si no hay MP4', () => {
    const derivados = [
      { tipo: 'video/webm; codecs="vp9, opus"', clave: '240p.vp9.webm', url: 'https://u/240.webm' },
      { tipo: 'video/webm; codecs="vp9, opus"', clave: '480p.vp9.webm', url: 'https://u/480.webm' },
    ];
    const r = elegirDescarga({ ...base, mime: 'video/webm', urlMiniatura: null, derivados });
    expect(r).toMatchObject({ url: 'https://u/480.webm', extension: 'webm' });
    expect(r?.aviso).toContain('WebM');
  });
  it('prefiere MP4 para el video', () => {
    const derivados = [{ tipo: 'video/mp4', clave: '480p.mp4', url: 'https://u/480.mp4' }];
    expect(elegirDescarga({ ...base, mime: 'video/webm', urlMiniatura: null, derivados })).toEqual({ url: 'https://u/480.mp4', extension: 'mp4' });
  });
});

describe('nombreLocal', () => {
  it('genera un nombre seguro y estable', () => {
    const a = nombreLocal('Lion waiting in Namibia.jpg', 'jpg');
    expect(a).toMatch(/^lion-waiting-in-namibia-[0-9a-f]{8}\.jpg$/);
    expect(nombreLocal('Lion waiting in Namibia.jpg', 'jpg')).toBe(a);
    expect(nombreLocal('¿?.png', 'png')).toMatch(/^archivo-[0-9a-f]{8}\.png$/);
  });
});

const respuestaVikidia = {
  query: {
    pages: [
      {
        title: 'Archivo:Lion waiting in Namibia.jpg',
        missing: true,
        known: true,
        imagerepository: 'commonswiki',
        imageinfo: [
          {
            mime: 'image/jpeg',
            url: 'https://upload.wikimedia.org/wikipedia/commons/7/73/Lion_waiting_in_Namibia.jpg',
            thumburl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/73/Lion_waiting_in_Namibia.jpg/960px-Lion_waiting_in_Namibia.jpg',
            descriptionurl: 'https://commons.wikimedia.org/wiki/File:Lion_waiting_in_Namibia.jpg',
            extmetadata: {
              Artist: { value: '<a href="https://www.flickr.com/photos/x">Kevin Pluck</a>' },
              License: { value: 'cc-by-2.0' },
              LicenseUrl: { value: 'https://creativecommons.org/licenses/by/2.0' },
              ImageDescription: { value: '<i>León</i> descansando' },
            },
          },
        ],
      },
      {
        title: 'Archivo:Cabeza olmeca.jpg',
        imagerepository: 'local',
        imageinfo: [
          {
            mime: 'image/jpeg',
            url: 'https://download.vikidia.org/es/images/4/4a/Cabeza_olmeca.jpg',
            descriptionurl: 'https://es.vikidia.org/wiki/Archivo:Cabeza_olmeca.jpg',
            extmetadata: {},
          },
        ],
      },
    ],
  },
};

describe('obtenerMetadatos', () => {
  it('interpreta archivos de Commons y locales desde Vikidia', async () => {
    const cliente = { obtenerJson: vi.fn(async () => respuestaVikidia), descargar: vi.fn() };
    const m = await obtenerMetadatos(cliente, API_VIKIDIA, ['Lion_waiting_in_Namibia.jpg', 'Archivo:Cabeza_olmeca.jpg']);
    const url = String(cliente.obtenerJson.mock.calls[0][0]);
    expect(url.startsWith(API_VIKIDIA)).toBe(true);
    expect(new URL(url).searchParams.get('titles')).toBe('Archivo:Lion waiting in Namibia.jpg|Archivo:Cabeza olmeca.jpg');
    expect(new URL(url).searchParams.get('prop')).toBe('imageinfo');
    expect(m.get('Lion waiting in Namibia.jpg')).toMatchObject({
      autor: 'Kevin Pluck',
      licencia: 'cc-by',
      descripcion: 'León descansando',
      fuenteUrl: 'https://commons.wikimedia.org/wiki/File:Lion_waiting_in_Namibia.jpg',
    });
    expect(m.get('Cabeza olmeca.jpg')).toMatchObject({ autor: '', licencia: null });
  });

  it('pide de a 50 títulos', async () => {
    const cliente = { obtenerJson: vi.fn(async () => ({ query: { pages: [] } })), descargar: vi.fn() };
    const nombres = Array.from({ length: 120 }, (_, i) => `Foto ${i}.jpg`);
    await obtenerMetadatos(cliente, API_VIKIDIA, nombres);
    expect(cliente.obtenerJson).toHaveBeenCalledTimes(3);
  });

  it('usa File: y videoinfo con Commons', async () => {
    const cliente = { obtenerJson: vi.fn(async () => ({ query: { pages: [] } })), descargar: vi.fn() };
    await obtenerMetadatos(cliente, API_COMMONS, ['Rugido.ogg']);
    const params = new URL(String(cliente.obtenerJson.mock.calls[0][0])).searchParams;
    expect(params.get('titles')).toBe('File:Rugido.ogg');
    expect(params.get('prop')).toBe('videoinfo');
    expect(params.get('viprop')).toBe('url|mime|extmetadata|derivatives');
  });
});
```

- [ ] **Step 2: Correr las pruebas y verificar que fallan**

Run: `npx vitest run tests/unit/texto.test.ts tests/unit/licencias.test.ts tests/unit/metadatos.test.ts`
Expected: FAIL, no se pueden resolver los módulos.

- [ ] **Step 3: Implementar `src/lib/texto.ts`**

```ts
const ENTIDADES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };

export function decodificarEntidades(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (original, e: string) => {
    if (e.startsWith('#')) {
      const n = e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isInteger(n) && n > 0 && n <= 0x10ffff ? String.fromCodePoint(n) : original;
    }
    return ENTIDADES[e.toLowerCase()] ?? original;
  });
}

const ETIQUETAS_DE_BLOQUE = /<\/?(p|div|h[1-6]|li|ul|ol|br|tr|td|th|table|figure|figcaption)\b[^>]*>/gi;

/** Las etiquetas de bloque separan palabras; las de línea (b, i, a…) no agregan espacios. */
export function textoPlano(html: string): string {
  return decodificarEntidades(html.replace(ETIQUETAS_DE_BLOQUE, ' ').replace(/<[^>]*>/g, ''))
    .replace(/\s+/g, ' ')
    .trim();
}

export function recortar(texto: string, max = 300): string {
  if (texto.length <= max) return texto;
  const corte = texto.slice(0, max - 1);
  const espacio = corte.lastIndexOf(' ');
  return `${(espacio > max * 0.6 ? corte.slice(0, espacio) : corte).trimEnd()}…`;
}
```

- [ ] **Step 4: Implementar `scripts/import/licencias.ts`**

```ts
import type { Licencia } from '../../src/lib/tipos';

/** Convierte el código `License` de extmetadata ("cc-by-sa-4.0", "pd", "cc0"…) en una licencia permitida. */
export function licenciaPermitida(codigo: string | undefined): Licencia | null {
  if (!codigo) return null;
  const c = codigo.trim().toLowerCase();
  if (c === 'pd' || c.startsWith('pd-') || c === 'public domain') return 'dominio-publico';
  if (c === 'cc0' || c.startsWith('cc0-') || c === 'cc-zero') return 'cc0';
  if (/^cc-by-sa-\d/.test(c)) return 'cc-by-sa';
  if (/^cc-by-\d/.test(c)) return 'cc-by';
  return null;
}
```

- [ ] **Step 5: Implementar `scripts/import/metadatos.ts`**

```ts
import { createHash } from 'node:crypto';
import type { ClienteHttp } from './http';
import type { Licencia, TipoMedio } from '../../src/lib/tipos';
import { licenciaPermitida } from './licencias';
import { textoPlano } from '../../src/lib/texto';
import { slugificar } from '../../src/lib/normalizar';

export const API_VIKIDIA = 'https://es.vikidia.org/w/api.php';
export const API_COMMONS = 'https://commons.wikimedia.org/w/api.php';

export interface Derivado {
  tipo: string;
  clave: string | null;
  url: string;
}

export interface MetadatosArchivo {
  clave: string;
  mime: string;
  urlOriginal: string;
  urlMiniatura: string | null;
  fuenteUrl: string;
  autor: string;
  licencia: Licencia | null;
  licenciaUrl: string;
  descripcion: string;
  derivados: Derivado[];
}

export interface Descarga {
  url: string;
  extension: string;
  aviso?: string;
}

interface InfoApi {
  mime?: string;
  url?: string;
  thumburl?: string;
  descriptionurl?: string;
  extmetadata?: Record<string, { value: string }>;
  derivatives?: { type?: string; transcodekey?: string; src: string }[];
}

interface PaginaApi {
  title: string;
  imageinfo?: InfoApi[];
  videoinfo?: InfoApi[];
}

/** "Archivo:Lion_waiting.jpg" → "Lion waiting.jpg" (como lo normaliza MediaWiki). */
export function claveArchivo(nombre: string): string {
  let n = nombre.replace(/^(archivo|file|imagen|image):/i, '');
  try {
    n = decodeURIComponent(n);
  } catch {
    // contiene un "%" literal: se deja tal cual
  }
  n = n.replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
  return n.charAt(0).toUpperCase() + n.slice(1);
}

export async function obtenerMetadatos(
  cliente: ClienteHttp,
  api: string,
  nombres: string[],
): Promise<Map<string, MetadatosArchivo>> {
  const claves = [...new Set(nombres.map(claveArchivo))];
  const resultado = new Map<string, MetadatosArchivo>();
  const esCommons = api === API_COMMONS;
  const prefijo = esCommons ? 'File:' : 'Archivo:';
  const prop = esCommons ? 'videoinfo' : 'imageinfo';
  const p = esCommons ? 'vi' : 'ii';

  for (let i = 0; i < claves.length; i += 50) {
    const lote = claves.slice(i, i + 50);
    const params = new URLSearchParams({
      action: 'query',
      format: 'json',
      formatversion: '2',
      titles: lote.map((c) => prefijo + c).join('|'),
      prop,
      [`${p}prop`]: esCommons ? 'url|mime|extmetadata|derivatives' : 'url|mime|extmetadata',
      [`${p}urlwidth`]: '500',
      [`${p}extmetadatafilter`]: 'Artist|LicenseShortName|License|LicenseUrl|ImageDescription',
    });
    const datos = (await cliente.obtenerJson(`${api}?${params}`)) as { query?: { pages?: PaginaApi[] } };
    for (const pagina of datos.query?.pages ?? []) {
      const info = pagina.imageinfo?.[0] ?? pagina.videoinfo?.[0];
      if (!info?.url) continue;
      const meta = info.extmetadata ?? {};
      const clave = claveArchivo(pagina.title);
      resultado.set(clave, {
        clave,
        mime: info.mime ?? '',
        urlOriginal: info.url,
        urlMiniatura: info.thumburl ?? null,
        fuenteUrl: info.descriptionurl ?? '',
        autor: textoPlano(meta.Artist?.value ?? ''),
        licencia: licenciaPermitida(meta.License?.value),
        licenciaUrl: meta.LicenseUrl?.value ?? '',
        descripcion: textoPlano(meta.ImageDescription?.value ?? '').slice(0, 160),
        derivados: (info.derivatives ?? []).map((d) => ({ tipo: d.type ?? '', clave: d.transcodekey ?? null, url: d.src })),
      });
    }
  }
  return resultado;
}

export function tipoDe(m: Pick<MetadatosArchivo, 'mime' | 'derivados'>): TipoMedio | null {
  if (m.mime.startsWith('image/')) return 'imagen';
  if (m.mime.startsWith('audio/')) return 'audio';
  if (m.mime.startsWith('video/')) return 'video';
  if (m.mime === 'application/ogg') return m.derivados.some((d) => d.tipo.startsWith('video/')) ? 'video' : 'audio';
  return null;
}

const EXTENSIONES_IMAGEN = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp']);

function extensionDe(url: string): string {
  const m = /\.([a-z0-9]+)$/i.exec(new URL(url).pathname);
  return m ? m[1].toLowerCase() : '';
}

export function elegirDescarga(m: MetadatosArchivo): Descarga | null {
  const tipo = tipoDe(m);
  if (tipo === 'imagen') {
    const url = m.urlMiniatura ?? m.urlOriginal;
    const extension = extensionDe(url);
    if (!EXTENSIONES_IMAGEN.has(extension)) return null;
    return { url, extension: extension === 'jpeg' ? 'jpg' : extension };
  }
  if (tipo === 'audio') {
    if (m.mime === 'audio/mpeg') return { url: m.urlOriginal, extension: 'mp3' };
    const mp3 = m.derivados.find((d) => d.tipo.startsWith('audio/mpeg'));
    if (mp3) return { url: mp3.url, extension: 'mp3' };
    const ogg = m.derivados.find((d) => d.tipo.startsWith('audio/ogg'))?.url ?? (/ogg/.test(m.mime) ? m.urlOriginal : null);
    return ogg ? { url: ogg, extension: 'ogg', aviso: 'solo hay audio Ogg; puede no sonar en Safari' } : null;
  }
  if (tipo === 'video') {
    const mp4 = m.derivados.find((d) => d.tipo.startsWith('video/mp4'));
    if (mp4) return { url: mp4.url, extension: 'mp4' };
    for (const clave of ['480p.vp9.webm', '360p.vp9.webm', '240p.vp9.webm']) {
      const d = m.derivados.find((x) => x.clave === clave);
      if (d) return { url: d.url, extension: 'webm', aviso: 'solo hay video WebM' };
    }
    if (m.mime === 'video/webm') return { url: m.urlOriginal, extension: 'webm', aviso: 'solo hay video WebM' };
  }
  return null;
}

export function nombreLocal(clave: string, extension: string): string {
  const base = clave.replace(/\.[^.]+$/, '');
  const hash = createHash('sha1').update(clave).digest('hex').slice(0, 8);
  return `${slugificar(base).slice(0, 60) || 'archivo'}-${hash}.${extension}`;
}
```

- [ ] **Step 6: Correr las pruebas y verificar que pasan**

Run: `npx vitest run tests/unit/texto.test.ts tests/unit/licencias.test.ts tests/unit/metadatos.test.ts`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/lib/texto.ts scripts/import/licencias.ts scripts/import/metadatos.ts tests/unit/texto.test.ts tests/unit/licencias.test.ts tests/unit/metadatos.test.ts
git commit -m "feat(import): licencias y metadatos de archivos de Vikidia y Commons" -m "Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---
### Task 4: Limpieza del HTML de Vikidia

**Files:**
- Create: `scripts/import/limpiar.ts`
- Create: `tests/fixtures/vikidia/leon.json`, `tests/fixtures/vikidia/sistema-solar.json` (respuestas reales, fijadas por revisión)
- Test: `tests/unit/limpiar.test.ts`

**Interfaces:**
- Consumes: `normalizar` (Tarea 1), `textoPlano`, `recortar` (Tarea 3), `claveArchivo` (Tarea 3).
- Produces:
  - `type BloqueCrudo = { tipo: 'html'; html: string } | { tipo: 'figura'; archivo: string; pie: string }` (en `figura`, `archivo` es la **clave remota** de `claveArchivo`)
  - `interface ResultadoLimpieza { bloques: BloqueCrudo[]; resumen: string; palabras: number; enlacesInternos: string[]; imagenes: string[] }`
  - `interface OpcionesLimpieza { slugPorTitulo: Map<string, string> }` (clave: `normalizar(título)`)
  - `limpiarHtml(html: string, op: OpcionesLimpieza): ResultadoLimpieza`

Estructura real del HTML de Vikidia (MediaWiki 1.43), verificada:
- Todo está dentro de `div.mw-parser-output`. Sus hijos directos son párrafos, `h2`/`h3`/`h4`, `figure`, `ul.gallery`, `div.toc`, fichas laterales hechas con `div` con estilos en línea, tablas y navboxes.
- Los títulos tienen la forma `<h2><span class="mw-headline" id="…">Texto</span><span class="mw-editsection">[editar]</span></h2>`.
- Las figuras son `<figure typeof="mw:File/Thumb"><a href="/wiki/Archivo:Nombre.jpg" class="mw-file-description"><img class="mw-file-element" width="300" …></a><figcaption>…</figcaption></figure>`.
- Las imágenes dentro de fichas laterales son `<span typeof="mw:File"><a href="/wiki/Archivo:…" class="mw-file-description"><img class="mw-file-element" width="250" …></a></span>`.
- Los íconos de plantillas miden menos de 100 px de ancho.
- Los enlaces rojos son `<a href="/w/index.php?title=…&action=edit&redlink=1" class="new">`.

- [ ] **Step 1: Guardar los fixtures reales**

```bash
mkdir -p tests/fixtures/vikidia
curl -sS -A "MiPrimeraEnciclopedia/0.1 (proyecto educativo de portafolio)" \
  "https://es.vikidia.org/w/api.php?action=parse&oldid=158442&prop=text%7Ccategories%7Crevid&format=json&formatversion=2" \
  -o tests/fixtures/vikidia/leon.json
curl -sS -A "MiPrimeraEnciclopedia/0.1 (proyecto educativo de portafolio)" \
  "https://es.vikidia.org/w/api.php?action=parse&oldid=179669&prop=text%7Ccategories%7Crevid&format=json&formatversion=2" \
  -o tests/fixtures/vikidia/sistema-solar.json
node -e "for (const f of ['leon','sistema-solar']) { const d = require('./tests/fixtures/vikidia/' + f + '.json'); console.log(f, d.parse.title, d.parse.revid, d.parse.text.length) }"
```

Expected: `leon Panthera leo 158442 …` y `sistema-solar Sistema solar 179669 …`, ambos con más de 10000 caracteres de texto.

- [ ] **Step 2: Escribir las pruebas que fallan**

`tests/unit/limpiar.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { limpiarHtml, type ResultadoLimpieza } from '../../scripts/import/limpiar';

const fixture = (nombre: string) =>
  JSON.parse(readFileSync(`tests/fixtures/vikidia/${nombre}.json`, 'utf8')).parse.text as string;

const sinEnlaces = { slugPorTitulo: new Map<string, string>() };
const html = (r: ResultadoLimpieza) =>
  r.bloques.flatMap((b) => (b.tipo === 'html' ? [b.html] : [])).join('\n');

describe('limpiarHtml con artículos reales', () => {
  const op = { slugPorTitulo: new Map([['panthera leo', 'leon'], ['sistema solar', 'sistema-solar'], ['sol', 'sol']]) };

  it('León: no deja restos de MediaWiki', () => {
    const r = limpiarHtml(fixture('leon'), op);
    expect(html(r)).not.toMatch(/mw-editsection|<img|style=|class=|<div|<table|<span/);
    expect(html(r)).not.toContain('<h2>Contenido</h2>');
    expect(r.palabras).toBeGreaterThan(150);
    expect(r.resumen.length).toBeGreaterThan(20);
    expect(r.resumen.length).toBeLessThanOrEqual(300);
  });

  it('León: lista primero la imagen de la ficha y descarta íconos', () => {
    const r = limpiarHtml(fixture('leon'), op);
    expect(r.imagenes[0]).toBe('Lion waiting in Namibia.jpg');
    expect(new Set(r.imagenes).size).toBe(r.imagenes.length);
  });

  it('Sistema solar: convierte la figura en un bloque', () => {
    const r = limpiarHtml(fixture('sistema-solar'), op);
    expect(r.bloques).toContainEqual({ tipo: 'figura', archivo: 'Uklad Sloneczny 2006-es.png', pie: 'Mapa del sistema solar' });
  });
});

describe('limpiarHtml con HTML de ejemplo', () => {
  it('quita atributos peligrosos y convierte enlaces internos', () => {
    const entrada =
      '<div class="mw-parser-output"><p onclick="robar()" style="color:red">Hola <a href="javascript:alert(1)">trampa</a> y ' +
      '<a href="/wiki/Le%C3%B3n" onmouseover="x()" title="León">el león</a><img src="x" onerror="y()"></p></div>';
    const r = limpiarHtml(entrada, { slugPorTitulo: new Map([['leon', 'leon']]) });
    expect(r.bloques).toEqual([{ tipo: 'html', html: '<p>Hola trampa y <a href="/articulo/leon">el león</a></p>' }]);
    expect(r.enlacesInternos).toEqual(['leon']);
  });

  it('descarta secciones de referencias y limpia los títulos', () => {
    const entrada =
      '<div class="mw-parser-output"><p>Intro del artículo.</p>' +
      '<h2><span class="mw-headline" id="Vida">Vida</span><span class="mw-editsection">[editar]</span></h2><p>Texto de vida.</p>' +
      '<h2><span class="mw-headline">Referencias</span></h2><p>Ref 1</p><ul><li>Ref 2</li></ul>' +
      '<h2><span class="mw-headline">Hábitat</span></h2><h3><span class="mw-headline">Selva &amp; sabana</span></h3><p>Texto.</p></div>';
    const r = limpiarHtml(entrada, sinEnlaces);
    expect(r.bloques).toEqual([
      {
        tipo: 'html',
        html: '<p>Intro del artículo.</p>\n<h2>Vida</h2>\n<p>Texto de vida.</p>\n<h2>Hábitat</h2>\n<h3>Selva &amp; sabana</h3>\n<p>Texto.</p>',
      },
    ]);
  });

  it('convierte figuras, desenvuelve enlaces rojos y descarta tablas y galerías', () => {
    const entrada =
      '<div class="mw-parser-output"><table><tr><td>Ficha</td></tr></table>' +
      '<figure typeof="mw:File/Thumb"><a href="/wiki/Archivo:Le%C3%B3n_rugiendo.jpg" class="mw-file-description">' +
      '<img src="//x/a.jpg" width="300" class="mw-file-element"></a><figcaption>Un <a href="/wiki/Le%C3%B3n">león</a> rugiendo</figcaption></figure>' +
      '<p>Vive en <a href="/w/index.php?title=Sabana&amp;action=edit&amp;redlink=1" class="new">la sabana</a>.</p>' +
      '<ul class="gallery"><li>foto</li></ul></div>';
    const r = limpiarHtml(entrada, sinEnlaces);
    expect(r.bloques).toEqual([
      { tipo: 'figura', archivo: 'León rugiendo.jpg', pie: 'Un león rugiendo' },
      { tipo: 'html', html: '<p>Vive en la sabana.</p>' },
    ]);
    expect(r.imagenes).toEqual(['León rugiendo.jpg']);
  });

  it('ignora imágenes de menos de 100 px', () => {
    const entrada =
      '<div class="mw-parser-output"><p><span typeof="mw:File"><a href="/wiki/Archivo:Icono.svg">' +
      '<img width="15" class="mw-file-element"></a></span>Texto</p></div>';
    expect(limpiarHtml(entrada, sinEnlaces).imagenes).toEqual([]);
  });

  it('cuenta palabras y recorta el resumen', () => {
    const largo = Array.from({ length: 80 }, (_, i) => `palabra${i}`).join(' ');
    const r = limpiarHtml(`<div class="mw-parser-output"><p>${largo}</p></div>`, sinEnlaces);
    expect(r.palabras).toBe(80);
    expect(r.resumen.endsWith('…')).toBe(true);
    expect(r.resumen.length).toBeLessThanOrEqual(300);
  });
});
```

- [ ] **Step 3: Correr las pruebas y verificar que fallan**

Run: `npx vitest run tests/unit/limpiar.test.ts`
Expected: FAIL, no se puede resolver `../../scripts/import/limpiar`.

- [ ] **Step 4: Implementar `scripts/import/limpiar.ts`**

```ts
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
```

- [ ] **Step 5: Correr las pruebas y verificar que pasan**

Run: `npx vitest run tests/unit/limpiar.test.ts`
Expected: PASS (8 pruebas).

Si la prueba de atributos peligrosos falla porque linkedom serializa `ó` como entidad, ajusta solo la expectativa del texto a lo que devuelve linkedom (no el código), y verifica que sigan ausentes `onclick`, `style` y `javascript:`.

- [ ] **Step 6: Commit**

```bash
git add scripts/import/limpiar.ts tests/unit/limpiar.test.ts tests/fixtures/vikidia
git commit -m "feat(import): limpieza del HTML de Vikidia en bloques" -m "Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---
### Task 5: Descarga de artículos, lista curada y ayuda para elegir candidatos

**Files:**
- Create: `scripts/import/vikidia.ts`, `scripts/import/curacion.ts`, `scripts/import/candidatos.ts`
- Modify: `package.json` (script `candidatos`)
- Test: `tests/unit/vikidia.test.ts`, `tests/unit/curacion.test.ts`, `tests/unit/candidatos.test.ts`

**Interfaces:**
- Consumes: `ClienteHttp` (Tarea 2), `API_VIKIDIA` (Tarea 3), `slugificar` (Tarea 1), `SLUGS_CATEGORIAS`, `CategoriaSlug` (Tarea 1).
- Produces:
  - `interface ArticuloCrudo { tituloResuelto: string; html: string; categorias: string[]; revid: number }`
  - `obtenerArticulo(cliente, titulo): Promise<ArticuloCrudo | null>` (null si no existe)
  - `esEsbozo(c: ArticuloCrudo): boolean`, `urlArticulo(titulo): string`, `urlHistorial(titulo): string`
  - `interface EntradaCuracion { titulo: string; slug: string; categoria: CategoriaSlug; extras: string[]; adm0?: string }`
  - `leerCuracion(texto: string): EntradaCuracion[]` (lanza `Error` con mensaje claro si algo está mal)
  - `interface Candidato { titulo: string; longitud: number; esbozo: boolean }`, `ordenarCandidatos`, `formatearCandidatos`, `listarCandidatos(cliente, categoria): Promise<{ paginas: Candidato[]; subcategorias: string[] }>`

- [ ] **Step 1: Escribir las pruebas que fallan**

`tests/unit/vikidia.test.ts`:

```ts
import { describe, it, expect, vi } from 'vitest';
import { esEsbozo, obtenerArticulo, urlArticulo, urlHistorial } from '../../scripts/import/vikidia';

const cliente = (respuesta: unknown) => ({ obtenerJson: vi.fn(async () => respuesta), descargar: vi.fn() });

describe('obtenerArticulo', () => {
  it('pide el artículo con redirecciones y lo interpreta', async () => {
    const c = cliente({
      parse: {
        title: 'Panthera leo',
        revid: 158442,
        text: '<div class="mw-parser-output"><p>Hola</p></div>',
        categories: [{ category: 'Felinos' }, { category: 'Vikidia:Artículos_sin_referencias' }],
      },
    });
    const r = await obtenerArticulo(c, 'León');
    const params = new URL(String(c.obtenerJson.mock.calls[0][0])).searchParams;
    expect(params.get('page')).toBe('León');
    expect(params.get('redirects')).toBe('1');
    expect(params.get('prop')).toBe('text|categories|revid');
    expect(r).toEqual({
      tituloResuelto: 'Panthera leo',
      html: '<div class="mw-parser-output"><p>Hola</p></div>',
      categorias: ['Felinos', 'Vikidia:Artículos sin referencias'],
      revid: 158442,
    });
  });

  it('devuelve null si el artículo no existe', async () => {
    expect(await obtenerArticulo(cliente({ error: { code: 'missingtitle' } }), 'Nada')).toBeNull();
  });

  it('lanza un error ante otros errores de la API', async () => {
    await expect(obtenerArticulo(cliente({ error: { code: 'ratelimited' } }), 'León')).rejects.toThrow('ratelimited');
  });
});

describe('utilidades', () => {
  it('detecta esbozos', () => {
    expect(esEsbozo({ tituloResuelto: 'X', html: '', revid: 1, categorias: ['Vikidia:Esbozos'] })).toBe(true);
    expect(esEsbozo({ tituloResuelto: 'X', html: '', revid: 1, categorias: ['Mamíferos'] })).toBe(false);
  });

  it('arma las URL de Vikidia', () => {
    expect(urlArticulo('Panthera leo')).toBe('https://es.vikidia.org/wiki/Panthera_leo');
    expect(urlArticulo('México')).toBe('https://es.vikidia.org/wiki/M%C3%A9xico');
    expect(urlHistorial('Panthera leo')).toBe('https://es.vikidia.org/w/index.php?title=Panthera_leo&action=history');
  });
});
```

`tests/unit/curacion.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { leerCuracion } from '../../scripts/import/curacion';

describe('leerCuracion', () => {
  it('lee categorías y países', () => {
    const yaml = `
categorias:
  - slug: animales
    articulos:
      - titulo: León
        extras:
          - File:Rugido.ogg
      - titulo: Tigre
paises:
  - titulo: México
    adm0: MEX
`;
    expect(leerCuracion(yaml)).toEqual([
      { titulo: 'León', slug: 'leon', categoria: 'animales', extras: ['File:Rugido.ogg'] },
      { titulo: 'Tigre', slug: 'tigre', categoria: 'animales', extras: [] },
      { titulo: 'México', slug: 'mexico', categoria: 'paises', extras: [], adm0: 'MEX' },
    ]);
  });

  it('rechaza categorías desconocidas', () => {
    expect(() => leerCuracion('categorias:\n  - slug: deportes\n    articulos: []\n')).toThrow('Categoría desconocida');
  });

  it('no permite poner países dentro de categorias', () => {
    expect(() => leerCuracion('categorias:\n  - slug: paises\n    articulos: []\n')).toThrow('Categoría desconocida');
  });

  it('exige un código adm0 de 3 letras mayúsculas', () => {
    expect(() => leerCuracion('paises:\n  - titulo: México\n')).toThrow('adm0');
    expect(() => leerCuracion('paises:\n  - titulo: México\n    adm0: mex\n')).toThrow('adm0');
  });

  it('detecta títulos que generan el mismo slug', () => {
    const yaml = 'categorias:\n  - slug: historia\n    articulos:\n      - titulo: Perú\n      - titulo: Peru\n';
    expect(() => leerCuracion(yaml)).toThrow('Slug repetido «peru»');
  });

  it('rechaza entradas sin título', () => {
    expect(() => leerCuracion('categorias:\n  - slug: espacio\n    articulos:\n      - extras: []\n')).toThrow('sin título');
  });
});
```

`tests/unit/candidatos.test.ts`:

```ts
import { describe, it, expect, vi } from 'vitest';
import { formatearCandidatos, listarCandidatos, ordenarCandidatos } from '../../scripts/import/candidatos';

describe('ordenarCandidatos', () => {
  it('pone primero los que no son esbozos y luego por longitud', () => {
    const r = ordenarCandidatos([
      { titulo: 'A', longitud: 9000, esbozo: true },
      { titulo: 'B', longitud: 3000, esbozo: false },
      { titulo: 'C', longitud: 8000, esbozo: false },
    ]);
    expect(r.map((c) => c.titulo)).toEqual(['C', 'B', 'A']);
  });
});

describe('formatearCandidatos', () => {
  it('muestra longitud, título y marca de esbozo', () => {
    expect(formatearCandidatos([{ titulo: 'León', longitud: 14576, esbozo: false }, { titulo: 'Jirafa', longitud: 900, esbozo: true }])).toBe(
      '  14576  León\n    900  Jirafa  [esbozo]',
    );
  });
});

describe('listarCandidatos', () => {
  it('separa páginas y subcategorías y marca los esbozos', async () => {
    const obtenerJson = vi
      .fn()
      .mockResolvedValueOnce({
        query: {
          categorymembers: [
            { ns: 0, title: 'León' },
            { ns: 0, title: 'Jirafa' },
            { ns: 14, title: 'Categoría:Felinos' },
          ],
        },
      })
      .mockResolvedValueOnce({
        query: {
          pages: [
            { title: 'León', length: 14576 },
            { title: 'Jirafa', length: 900, categories: [{ title: 'Categoría:Vikidia:Esbozos' }] },
          ],
        },
      });
    const r = await listarCandidatos({ obtenerJson, descargar: vi.fn() }, 'Mamíferos');
    expect(r.subcategorias).toEqual(['Felinos']);
    expect(r.paginas).toEqual([
      { titulo: 'León', longitud: 14576, esbozo: false },
      { titulo: 'Jirafa', longitud: 900, esbozo: true },
    ]);
    const params = new URL(String(obtenerJson.mock.calls[0][0])).searchParams;
    expect(params.get('cmtitle')).toBe('Categoría:Mamíferos');
  });
});
```

- [ ] **Step 2: Correr las pruebas y verificar que fallan**

Run: `npx vitest run tests/unit/vikidia.test.ts tests/unit/curacion.test.ts tests/unit/candidatos.test.ts`
Expected: FAIL, no se pueden resolver los módulos.

- [ ] **Step 3: Implementar `scripts/import/vikidia.ts`**

```ts
import type { ClienteHttp } from './http';
import { API_VIKIDIA } from './metadatos';

export interface ArticuloCrudo {
  tituloResuelto: string;
  html: string;
  categorias: string[];
  revid: number;
}

interface RespuestaParse {
  error?: { code: string };
  parse?: { title: string; text: string; revid: number; categories?: { category: string }[] };
}

export async function obtenerArticulo(cliente: ClienteHttp, titulo: string): Promise<ArticuloCrudo | null> {
  const params = new URLSearchParams({
    action: 'parse',
    page: titulo,
    prop: 'text|categories|revid',
    redirects: '1',
    format: 'json',
    formatversion: '2',
  });
  const datos = (await cliente.obtenerJson(`${API_VIKIDIA}?${params}`)) as RespuestaParse;
  if (datos.error) {
    if (datos.error.code === 'missingtitle') return null;
    throw new Error(`Vikidia respondió ${datos.error.code} para «${titulo}»`);
  }
  const p = datos.parse!;
  return {
    tituloResuelto: p.title,
    html: p.text,
    categorias: (p.categories ?? []).map((c) => c.category.replace(/_/g, ' ')),
    revid: p.revid,
  };
}

export function esEsbozo(c: ArticuloCrudo): boolean {
  return c.categorias.includes('Vikidia:Esbozos');
}

function rutaWiki(titulo: string): string {
  return encodeURIComponent(titulo.replace(/ /g, '_')).replace(/%2F/g, '/');
}

export function urlArticulo(titulo: string): string {
  return `https://es.vikidia.org/wiki/${rutaWiki(titulo)}`;
}

export function urlHistorial(titulo: string): string {
  return `https://es.vikidia.org/w/index.php?title=${rutaWiki(titulo)}&action=history`;
}
```

- [ ] **Step 4: Implementar `scripts/import/curacion.ts`**

```ts
import { parse } from 'yaml';
import { SLUGS_CATEGORIAS, type CategoriaSlug } from '../../src/config';
import { slugificar } from '../../src/lib/normalizar';

export interface EntradaCuracion {
  titulo: string;
  slug: string;
  categoria: CategoriaSlug;
  extras: string[];
  adm0?: string;
}

interface Documento {
  categorias?: { slug?: unknown; articulos?: unknown[] }[];
  paises?: unknown[];
}

function entrada(valor: unknown, categoria: CategoriaSlug): EntradaCuracion {
  const v = (valor ?? {}) as { titulo?: unknown; extras?: unknown };
  const titulo = typeof v.titulo === 'string' ? v.titulo.trim() : '';
  const slug = slugificar(titulo);
  if (!titulo || !slug) throw new Error(`Entrada sin título válido en la categoría «${categoria}»`);
  return { titulo, slug, categoria, extras: Array.isArray(v.extras) ? v.extras.map(String) : [] };
}

export function leerCuracion(texto: string): EntradaCuracion[] {
  const doc = (parse(texto) ?? {}) as Documento;
  const entradas: EntradaCuracion[] = [];

  for (const cat of doc.categorias ?? []) {
    const slug = String(cat.slug ?? '');
    if (slug === 'paises' || !(SLUGS_CATEGORIAS as string[]).includes(slug)) {
      throw new Error(`Categoría desconocida en curacion.yaml: «${slug}»`);
    }
    for (const a of cat.articulos ?? []) entradas.push(entrada(a, slug as CategoriaSlug));
  }

  for (const p of doc.paises ?? []) {
    const e = entrada(p, 'paises');
    const adm0 = String((p as { adm0?: unknown }).adm0 ?? '');
    if (!/^[A-Z]{3}$/.test(adm0)) throw new Error(`El país «${e.titulo}» necesita un código adm0 de 3 letras mayúsculas`);
    entradas.push({ ...e, adm0 });
  }

  const vistos = new Map<string, string>();
  for (const e of entradas) {
    const previo = vistos.get(e.slug);
    if (previo) throw new Error(`Slug repetido «${e.slug}»: «${previo}» y «${e.titulo}»`);
    vistos.set(e.slug, e.titulo);
  }
  return entradas;
}
```

- [ ] **Step 5: Implementar `scripts/import/candidatos.ts`**

```ts
import { pathToFileURL } from 'node:url';
import { crearCliente, USER_AGENT, type ClienteHttp } from './http';
import { API_VIKIDIA } from './metadatos';

export interface Candidato {
  titulo: string;
  longitud: number;
  esbozo: boolean;
}

export function ordenarCandidatos(candidatos: Candidato[]): Candidato[] {
  return [...candidatos].sort((a, b) => Number(a.esbozo) - Number(b.esbozo) || b.longitud - a.longitud);
}

export function formatearCandidatos(candidatos: Candidato[]): string {
  return candidatos.map((c) => `${String(c.longitud).padStart(7)}  ${c.titulo}${c.esbozo ? '  [esbozo]' : ''}`).join('\n');
}

export async function listarCandidatos(
  cliente: ClienteHttp,
  categoria: string,
): Promise<{ paginas: Candidato[]; subcategorias: string[] }> {
  const miembros = new URLSearchParams({
    action: 'query',
    list: 'categorymembers',
    cmtitle: `Categoría:${categoria}`,
    cmtype: 'page|subcat',
    cmlimit: '500',
    format: 'json',
    formatversion: '2',
  });
  const datos = (await cliente.obtenerJson(`${API_VIKIDIA}?${miembros}`)) as {
    query?: { categorymembers?: { ns: number; title: string }[] };
  };
  const lista = datos.query?.categorymembers ?? [];
  const subcategorias = lista.filter((m) => m.ns === 14).map((m) => m.title.replace(/^Categoría:/, ''));
  const titulos = lista.filter((m) => m.ns === 0).map((m) => m.title);

  const paginas: Candidato[] = [];
  for (let i = 0; i < titulos.length; i += 50) {
    const info = new URLSearchParams({
      action: 'query',
      titles: titulos.slice(i, i + 50).join('|'),
      prop: 'info|categories',
      clcategories: 'Categoría:Vikidia:Esbozos',
      cllimit: 'max',
      format: 'json',
      formatversion: '2',
    });
    const r = (await cliente.obtenerJson(`${API_VIKIDIA}?${info}`)) as {
      query?: { pages?: { title: string; length?: number; categories?: unknown[] }[] };
    };
    for (const p of r.query?.pages ?? []) {
      paginas.push({ titulo: p.title, longitud: p.length ?? 0, esbozo: (p.categories?.length ?? 0) > 0 });
    }
  }
  return { paginas, subcategorias };
}

async function main() {
  const categorias = process.argv.slice(2);
  if (categorias.length === 0) {
    console.error('Uso: npm run candidatos -- "Mamíferos" "Aves"');
    process.exit(1);
  }
  const cliente = crearCliente({ userAgent: USER_AGENT, directorioCache: 'scripts/import/.cache' });
  for (const categoria of categorias) {
    const { paginas, subcategorias } = await listarCandidatos(cliente, categoria);
    console.log(`\n=== ${categoria} (${paginas.length} páginas) ===`);
    if (subcategorias.length) console.log(`Subcategorías: ${subcategorias.join(', ')}`);
    console.log(formatearCandidatos(ordenarCandidatos(paginas)));
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
```

- [ ] **Step 6: Correr las pruebas y verificar que pasan**

Run: `npx vitest run tests/unit/vikidia.test.ts tests/unit/curacion.test.ts tests/unit/candidatos.test.ts`
Expected: PASS.

- [ ] **Step 7: Agregar el script y probarlo contra Vikidia**

```bash
npm pkg set scripts.candidatos="tsx scripts/import/candidatos.ts"
npm run candidatos -- "Planetas"
```

Expected: imprime `=== Planetas (…) ===` y una lista de páginas con su longitud (Vikidia tiene unas 9 en esa categoría).

- [ ] **Step 8: Commit**

```bash
git add scripts/import/vikidia.ts scripts/import/curacion.ts scripts/import/candidatos.ts tests/unit/vikidia.test.ts tests/unit/curacion.test.ts tests/unit/candidatos.test.ts package.json
git commit -m "feat(import): descarga de artículos, lista curada y candidatos" -m "Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---
### Task 6: Ensamblado de artículos, informe y CLI `npm run import`

**Files:**
- Create: `scripts/import/ensamblar.ts`, `scripts/import/informe.ts`, `scripts/import/importar.ts`
- Create: `tests/fixtures/curacion-mini.yaml`
- Modify: `package.json` (script `import`)
- Test: `tests/unit/ensamblar.test.ts`, `tests/unit/informe.test.ts`

**Interfaces:**
- Consumes: todo lo de las Tareas 2–5; tipos `Articulo`, `Bloque`, `Medio` (Tarea 1).
- Produces:
  - `PALABRAS_MINIMAS = 150`, `IMAGENES_POR_ARTICULO = 6`
  - `motivoRechazo(crudo: ArticuloCrudo | null, limpieza: ResultadoLimpieza | null): string | null`
  - `type ResultadoMedio = { medio: Medio; descarga: Descarga; aviso?: string } | { descartado: string }`
  - `prepararMedio(m: MetadatosArchivo, alt: string): ResultadoMedio`
  - `clavesDeImagenes(limpieza: ResultadoLimpieza): string[]`
  - `construirArticulo(a: { entrada; crudo; limpieza; medios: Map<string, Medio>; fecha: string }): Articulo`
  - `completarRelacionados(articulos: Articulo[], minimo?: number, maximo?: number): Articulo[]`
  - `interface EntradaInforme { titulo: string; estado: 'aceptado' | 'rechazado'; motivo?: string }`
  - `interface MedioDescartado { articulo: string; archivo: string; motivo: string }`
  - `generarInforme(entradas, descartados, avisos: string[], fecha: string): string`
  - CLI: `npm run import [-- --curacion <ruta>]` escribe `src/content/articulos/<slug>.json`, `src/assets/medios/*`, `public/medios/*` y `scripts/import/informe.md`.

- [ ] **Step 1: Escribir las pruebas que fallan**

`tests/unit/ensamblar.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import {
  clavesDeImagenes,
  completarRelacionados,
  construirArticulo,
  motivoRechazo,
  prepararMedio,
} from '../../scripts/import/ensamblar';
import type { ResultadoLimpieza } from '../../scripts/import/limpiar';
import type { MetadatosArchivo } from '../../scripts/import/metadatos';
import type { Articulo, Medio } from '../../src/lib/tipos';

const limpieza = (cambios: Partial<ResultadoLimpieza> = {}): ResultadoLimpieza => ({
  bloques: [{ tipo: 'html', html: '<p>El león.</p>' }],
  resumen: 'El león.',
  palabras: 200,
  enlacesInternos: [],
  imagenes: [],
  ...cambios,
});

const crudo = { tituloResuelto: 'Panthera leo', html: '', categorias: [], revid: 158442 };

const medio = (archivo: string, tipo: Medio['tipo'] = 'imagen'): Medio => ({
  archivo,
  tipo,
  alt: archivo,
  autor: 'Ana',
  licencia: 'cc-by',
  licenciaUrl: '',
  fuenteUrl: `https://commons.wikimedia.org/wiki/File:${archivo}`,
});

describe('motivoRechazo', () => {
  it('rechaza artículos inexistentes, esbozos y cortos', () => {
    expect(motivoRechazo(null, null)).toBe('no existe en Vikidia');
    expect(motivoRechazo({ ...crudo, categorias: ['Vikidia:Esbozos'] }, limpieza())).toBe('es un esbozo');
    expect(motivoRechazo(crudo, limpieza({ palabras: 149 }))).toBe('solo 149 palabras (mínimo 150)');
    expect(motivoRechazo(crudo, limpieza({ palabras: 150 }))).toBeNull();
  });
});

describe('prepararMedio', () => {
  const base: MetadatosArchivo = {
    clave: 'Leona.jpg',
    mime: 'image/jpeg',
    urlOriginal: 'https://u/Leona.jpg',
    urlMiniatura: 'https://u/thumb/960px-Leona.jpg',
    fuenteUrl: 'https://commons.wikimedia.org/wiki/File:Leona.jpg',
    autor: 'Ana',
    licencia: 'cc-by-sa',
    licenciaUrl: 'https://creativecommons.org/licenses/by-sa/4.0',
    descripcion: '',
    derivados: [],
  };

  it('prepara una imagen con licencia permitida', () => {
    const r = prepararMedio(base, 'Una leona');
    expect(r).toMatchObject({ medio: { tipo: 'imagen', alt: 'Una leona', autor: 'Ana', licencia: 'cc-by-sa' }, descarga: { extension: 'jpg' } });
    expect('medio' in r && r.medio.archivo).toMatch(/^leona-[0-9a-f]{8}\.jpg$/);
  });

  it('descarta archivos sin licencia, sin autor o de tipo no soportado', () => {
    expect(prepararMedio({ ...base, licencia: null }, 'x')).toEqual({ descartado: 'licencia no permitida o desconocida' });
    expect(prepararMedio({ ...base, autor: '' }, 'x')).toEqual({ descartado: 'sin autor' });
    expect(prepararMedio({ ...base, mime: 'application/pdf' }, 'x')).toEqual({ descartado: 'tipo no soportado (application/pdf)' });
  });
});

describe('clavesDeImagenes', () => {
  it('toma hasta 6 imágenes y agrega las de las figuras', () => {
    const imagenes = Array.from({ length: 10 }, (_, i) => `F${i}.jpg`);
    const r = clavesDeImagenes(limpieza({ imagenes, bloques: [{ tipo: 'figura', archivo: 'F9.jpg', pie: '' }] }));
    expect(r).toEqual([...imagenes.slice(0, 6), 'F9.jpg']);
  });
});

describe('construirArticulo', () => {
  const medios = new Map<string, Medio>([
    ['Lion waiting in Namibia.jpg', medio('lion.jpg')],
    ['Leona.jpg', medio('leona.jpg')],
    ['Rugido de león.ogg', medio('rugido.mp3', 'audio')],
  ]);
  const entrada = { titulo: 'León', slug: 'leon', categoria: 'animales' as const, extras: ['File:Rugido_de_león.ogg'] };
  const l = limpieza({
    bloques: [
      { tipo: 'html', html: '<p>El león.</p>' },
      { tipo: 'figura', archivo: 'Leona.jpg', pie: 'Una leona' },
      { tipo: 'figura', archivo: 'Sin licencia.jpg', pie: 'x' },
    ],
    enlacesInternos: ['tigre', 'leon'],
    imagenes: ['Lion waiting in Namibia.jpg', 'Leona.jpg', 'Sin licencia.jpg'],
  });

  it('arma el artículo con medios locales, figuras válidas y fuente', () => {
    const a = construirArticulo({ entrada, crudo, limpieza: l, medios, fecha: '2026-10-14' });
    expect(a.slug).toBe('leon');
    expect(a.titulo).toBe('León');
    expect(a.principal?.archivo).toBe('lion.jpg');
    expect(a.medios.map((m) => m.archivo)).toEqual(['lion.jpg', 'leona.jpg', 'rugido.mp3']);
    expect(a.bloques).toEqual([
      { tipo: 'html', html: '<p>El león.</p>' },
      { tipo: 'figura', archivo: 'leona.jpg', pie: 'Una leona' },
    ]);
    expect(a.relacionados).toEqual(['tigre']);
    expect(a.pais).toBeUndefined();
    expect(a.fuente).toEqual({
      url: 'https://es.vikidia.org/wiki/Panthera_leo',
      historialUrl: 'https://es.vikidia.org/w/index.php?title=Panthera_leo&action=history',
      revid: 158442,
      fecha: '2026-10-14',
    });
  });

  it('agrega el país si la entrada tiene adm0', () => {
    const a = construirArticulo({ entrada: { ...entrada, slug: 'mexico', titulo: 'México', categoria: 'paises', adm0: 'MEX' }, crudo, limpieza: l, medios, fecha: '2026-10-14' });
    expect(a.pais).toEqual({ adm0: 'MEX' });
  });
});

describe('completarRelacionados', () => {
  const art = (slug: string, titulo: string, categoria: Articulo['categoria'], relacionados: string[] = []): Articulo => ({
    slug,
    titulo,
    categoria,
    resumen: '',
    bloques: [],
    medios: [],
    relacionados,
    fuente: { url: 'https://x', historialUrl: 'https://x', revid: 1, fecha: '2026-10-14' },
  });

  it('quita los inexistentes y completa con la misma categoría en orden alfabético', () => {
    const r = completarRelacionados([
      art('leon', 'León', 'animales', ['no-existe', 'tigre']),
      art('tigre', 'Tigre', 'animales'),
      art('aguila', 'Águila', 'animales'),
      art('oso', 'Oso', 'animales'),
      art('sol', 'Sol', 'espacio'),
    ]);
    expect(r[0].relacionados).toEqual(['tigre', 'aguila', 'oso']);
    expect(r[4].relacionados).toEqual([]);
  });

  it('limita a 6 relacionados', () => {
    const muchos = Array.from({ length: 10 }, (_, i) => `a${i}`);
    const r = completarRelacionados([art('x', 'X', 'historia', muchos), ...muchos.map((s) => art(s, s, 'historia'))]);
    expect(r[0].relacionados).toHaveLength(6);
  });
});
```

`tests/unit/informe.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { generarInforme } from '../../scripts/import/informe';

describe('generarInforme', () => {
  it('resume y lista rechazos, descartes y avisos', () => {
    const md = generarInforme(
      [
        { titulo: 'León', estado: 'aceptado' },
        { titulo: 'Jirafa', estado: 'rechazado', motivo: 'es un esbozo' },
      ],
      [{ articulo: 'México', archivo: 'Cabeza olmeca.jpg', motivo: 'licencia no permitida o desconocida' }],
      ['Rugido.ogg: solo hay audio Ogg; puede no sonar en Safari'],
      '2026-10-14',
    );
    expect(md).toContain('- Artículos aceptados: 1');
    expect(md).toContain('- Artículos rechazados: 1');
    expect(md).toContain('| Jirafa | es un esbozo |');
    expect(md).toContain('| México | Cabeza olmeca.jpg | licencia no permitida o desconocida |');
    expect(md).toContain('- Rugido.ogg: solo hay audio Ogg; puede no sonar en Safari');
  });

  it('escapa barras verticales y muestra "Ninguno." en secciones vacías', () => {
    const md = generarInforme([{ titulo: 'A|B', estado: 'rechazado', motivo: 'x' }], [], [], '2026-10-14');
    expect(md).toContain('| A\\|B | x |');
    expect(md).toContain('Ninguno.');
  });
});
```

- [ ] **Step 2: Correr las pruebas y verificar que fallan**

Run: `npx vitest run tests/unit/ensamblar.test.ts tests/unit/informe.test.ts`
Expected: FAIL, no se pueden resolver los módulos.

- [ ] **Step 3: Implementar `scripts/import/ensamblar.ts`**

```ts
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
```

- [ ] **Step 4: Implementar `scripts/import/informe.ts`**

```ts
export interface EntradaInforme {
  titulo: string;
  estado: 'aceptado' | 'rechazado';
  motivo?: string;
}

export interface MedioDescartado {
  articulo: string;
  archivo: string;
  motivo: string;
}

const celda = (s: string) => s.replace(/\|/g, '\\|');

export function generarInforme(
  entradas: EntradaInforme[],
  descartados: MedioDescartado[],
  avisos: string[],
  fecha: string,
): string {
  const rechazados = entradas.filter((e) => e.estado === 'rechazado');
  const lineas = [
    '# Informe de importación',
    '',
    `Fecha: ${fecha}`,
    '',
    `- Artículos aceptados: ${entradas.length - rechazados.length}`,
    `- Artículos rechazados: ${rechazados.length}`,
    `- Archivos multimedia descartados: ${descartados.length}`,
    '',
    '## Artículos rechazados',
    '',
  ];
  if (rechazados.length) {
    lineas.push('| Artículo | Motivo |', '|---|---|', ...rechazados.map((e) => `| ${celda(e.titulo)} | ${celda(e.motivo ?? '')} |`));
  } else lineas.push('Ninguno.');
  lineas.push('', '## Multimedia descartada', '');
  if (descartados.length) {
    lineas.push(
      '| Artículo | Archivo | Motivo |',
      '|---|---|---|',
      ...descartados.map((d) => `| ${celda(d.articulo)} | ${celda(d.archivo)} | ${celda(d.motivo)} |`),
    );
  } else lineas.push('Ninguno.');
  lineas.push('', '## Avisos', '', ...(avisos.length ? avisos.map((a) => `- ${a}`) : ['Ninguno.']), '');
  return lineas.join('\n');
}
```

- [ ] **Step 5: Correr las pruebas y verificar que pasan**

Run: `npx vitest run tests/unit/ensamblar.test.ts tests/unit/informe.test.ts`
Expected: PASS.

- [ ] **Step 6: Implementar el CLI `scripts/import/importar.ts`**

```ts
import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { crearCliente, USER_AGENT } from './http';
import { leerCuracion, type EntradaCuracion } from './curacion';
import { obtenerArticulo, type ArticuloCrudo } from './vikidia';
import { limpiarHtml, type ResultadoLimpieza } from './limpiar';
import { API_COMMONS, API_VIKIDIA, claveArchivo, obtenerMetadatos } from './metadatos';
import { clavesDeImagenes, completarRelacionados, construirArticulo, motivoRechazo, prepararMedio } from './ensamblar';
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
      const r = prepararMedio(m, pies.get(clave) || m.descripcion || e.titulo);
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
```

- [ ] **Step 7: Prueba de humo contra Vikidia con una curación mínima**

`tests/fixtures/curacion-mini.yaml`:

```yaml
categorias:
  - slug: animales
    articulos:
      - titulo: León
  - slug: espacio
    articulos:
      - titulo: Sistema solar
      - titulo: Artículo que no existe en Vikidia
paises:
  - titulo: México
    adm0: MEX
```

```bash
npm pkg set scripts.import="tsx scripts/import/importar.ts"
npm run import -- --curacion tests/fixtures/curacion-mini.yaml; echo "código de salida: $?"
ls src/content/articulos src/assets/medios | head -20
cat scripts/import/informe.md
```

Expected:
- El código de salida es `1` (se aceptaron menos de 100) y el mensaje lo explica.
- Existen `src/content/articulos/leon.json`, `sistema-solar.json` y `mexico.json`, y hay imágenes en `src/assets/medios/`.
- El informe muestra "Artículo que no existe en Vikidia | no existe en Vikidia" y, en multimedia descartada, imágenes locales de Vikidia como `Cabeza olmeca.jpg` con "licencia no permitida o desconocida".
- `leon.json` tiene `"principal"` con un `autor` y una `licencia`, y `mexico.json` tiene `"pais": { "adm0": "MEX" }`.

- [ ] **Step 8: Borrar el contenido de la prueba de humo y hacer commit**

El contenido real se importa en la Tarea 7; el de la prueba no se versiona.

```bash
rm -rf src/content/articulos src/assets/medios public/medios scripts/import/informe.md
npx vitest run
git add scripts/import/ensamblar.ts scripts/import/informe.ts scripts/import/importar.ts tests/unit/ensamblar.test.ts tests/unit/informe.test.ts tests/fixtures/curacion-mini.yaml package.json
git commit -m "feat(import): ensamblado de artículos, informe y CLI de importación" -m "Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

Expected: `npx vitest run` pasa completo antes del commit.

---
### Task 7: Curación e importación del contenido real

**Files:**
- Create: `scripts/import/curacion.yaml`
- Create (generados): `src/content/articulos/*.json`, `src/assets/medios/*`, `public/medios/*`, `scripts/import/informe.md`

**Interfaces:**
- Consumes: CLI `npm run import` y `npm run candidatos` (Tareas 5 y 6).
- Produces: el contenido que usan todas las tareas siguientes. Requisitos que las pruebas posteriores dan por cumplidos:
  - al menos 100 artículos aceptados (el importador sale con código 0);
  - al menos 10 artículos en cada una de las 7 categorías temáticas;
  - `src/content/articulos/mexico.json` existe con `"pais": { "adm0": "MEX" }`;
  - `MNG` (Mongolia) **no** está en la curación, para que exista al menos un país sin artículo.

Esta tarea es de contenido, no de código: su "prueba" es el informe del importador más los conteos del Step 6.

Categorías de Vikidia verificadas (con cantidad de páginas): Animales 104, Mamíferos 63, Aves 29, Reptiles 28, Peces 18, Insectos 13, Astronomía 35, Planetas 9, Cuerpo humano 43, Anatomía 14, Historia 63, Música 64, Pintura 8, Arte 3 (+5 subcategorías), Tecnología 42, Geografía 117, Volcanes 9, Ríos 13. La categoría "Ciencia" **no existe** en Vikidia.

- [ ] **Step 1: Explorar candidatos por categoría**

```bash
npm run candidatos -- "Mamíferos" "Aves" "Reptiles" "Peces" "Insectos" > /tmp/candidatos-animales.txt
npm run candidatos -- "Geografía" "Volcanes" "Ríos" > /tmp/candidatos-tierra.txt
npm run candidatos -- "Astronomía" "Planetas" > /tmp/candidatos-espacio.txt
npm run candidatos -- "Cuerpo humano" "Anatomía" > /tmp/candidatos-cuerpo.txt
npm run candidatos -- "Historia" > /tmp/candidatos-historia.txt
npm run candidatos -- "Música" "Pintura" "Arte" > /tmp/candidatos-arte.txt
npm run candidatos -- "Tecnología" > /tmp/candidatos-tecnologia.txt
```

Revisa también las subcategorías que imprime cada lista (por ejemplo, las de "Historia" o "Arte") y pásalas a `npm run candidatos` si hacen falta más opciones.

Reglas para elegir:
- Unos 15 artículos por categoría temática (mínimo 12 en la lista, porque algunos se rechazarán).
- Nunca elegir los marcados `[esbozo]`.
- Preferir longitud ≥ 4000 (aproxima ≥ 150 palabras después de limpiar).
- Temas reconocibles para niños de 7 a 12 años, repartidos dentro de la categoría (no 15 felinos).
- Para "Ciencia y tecnología" combinar Tecnología con temas científicos que aparezcan en otras listas (por ejemplo, de Geografía o Astronomía no usados en sus categorías).

- [ ] **Step 2: Escribir `scripts/import/curacion.yaml`**

La sección `paises` es fija. Las secciones temáticas empiezan con estas semillas; reemplaza las que no aparezcan en los candidatos y completa hasta ~15 por categoría con lo encontrado en el Step 1.

```yaml
# Lista curada de artículos de Vikidia (es.vikidia.org).
# "titulo" es el título exacto en Vikidia (las redirecciones se siguen solas).
# "extras" es multimedia opcional de Wikimedia Commons ("File:Nombre.ext").
categorias:
  - slug: animales
    articulos:
      - titulo: León
      - titulo: Elefante
      - titulo: Ballena
      - titulo: Delfín
      - titulo: Tiburón
      - titulo: Águila
      - titulo: Pingüino
      - titulo: Tortuga
      - titulo: Cocodrilo
      - titulo: Serpiente
      - titulo: Abeja
      - titulo: Mariposa
      - titulo: Lobo
      - titulo: Oso
      - titulo: Jirafa
  - slug: planeta-tierra
    articulos:
      - titulo: Volcán
      - titulo: Terremoto
      - titulo: Océano
      - titulo: Montaña
      - titulo: Desierto
      - titulo: Selva
      - titulo: Río Amazonas
      - titulo: Clima
      - titulo: Agua
      - titulo: Continente
      - titulo: Isla
      - titulo: Lluvia
  - slug: espacio
    articulos:
      - titulo: Sistema solar
      - titulo: Sol
      - titulo: Luna
      - titulo: Tierra
      - titulo: Marte
      - titulo: Júpiter
      - titulo: Saturno
      - titulo: Estrella
      - titulo: Galaxia
      - titulo: Cometa
      - titulo: Astronauta
      - titulo: Vía Láctea
  - slug: cuerpo-humano
    articulos:
      - titulo: Corazón
      - titulo: Cerebro
      - titulo: Esqueleto
      - titulo: Pulmón
      - titulo: Sangre
      - titulo: Ojo
      - titulo: Diente
      - titulo: Músculo
      - titulo: Piel
      - titulo: Estómago
      - titulo: Hueso
      - titulo: Oído
  - slug: historia
    articulos:
      - titulo: Antiguo Egipto
      - titulo: Imperio romano
      - titulo: Antigua Grecia
      - titulo: Edad Media
      - titulo: Aztecas
      - titulo: Mayas
      - titulo: Incas
      - titulo: Cristóbal Colón
      - titulo: Prehistoria
      - titulo: Vikingos
      - titulo: Pirámide
      - titulo: Castillo
  - slug: arte-y-musica
    articulos:
      - titulo: Música
      - titulo: Piano
      - titulo: Guitarra
      - titulo: Violín
      - titulo: Wolfgang Amadeus Mozart
      - titulo: Ludwig van Beethoven
      - titulo: Pintura
      - titulo: Leonardo da Vinci
      - titulo: Pablo Picasso
      - titulo: Frida Kahlo
      - titulo: Escultura
      - titulo: Orquesta
  - slug: ciencia-y-tecnologia
    articulos:
      - titulo: Computadora
      - titulo: Internet
      - titulo: Teléfono
      - titulo: Avión
      - titulo: Automóvil
      - titulo: Robot
      - titulo: Electricidad
      - titulo: Imprenta
      - titulo: Rueda
      - titulo: Tren
      - titulo: Energía solar
      - titulo: Microscopio

paises:
  - { titulo: Argentina, adm0: ARG }
  - { titulo: Bolivia, adm0: BOL }
  - { titulo: Chile, adm0: CHL }
  - { titulo: Colombia, adm0: COL }
  - { titulo: Costa Rica, adm0: CRI }
  - { titulo: Cuba, adm0: CUB }
  - { titulo: Ecuador, adm0: ECU }
  - { titulo: El Salvador, adm0: SLV }
  - { titulo: Guatemala, adm0: GTM }
  - { titulo: Honduras, adm0: HND }
  - { titulo: México, adm0: MEX }
  - { titulo: Nicaragua, adm0: NIC }
  - { titulo: Panamá, adm0: PAN }
  - { titulo: Paraguay, adm0: PRY }
  - { titulo: Perú, adm0: PER }
  - { titulo: Puerto Rico, adm0: PRI }
  - { titulo: República Dominicana, adm0: DOM }
  - { titulo: Uruguay, adm0: URY }
  - { titulo: Venezuela, adm0: VEN }
  - { titulo: España, adm0: ESP }
  - { titulo: Guinea Ecuatorial, adm0: GNQ }
  - { titulo: Estados Unidos, adm0: USA }
  - { titulo: Canadá, adm0: CAN }
  - { titulo: Brasil, adm0: BRA }
  - { titulo: Reino Unido, adm0: GBR }
  - { titulo: Francia, adm0: FRA }
  - { titulo: Alemania, adm0: DEU }
  - { titulo: Italia, adm0: ITA }
  - { titulo: Portugal, adm0: PRT }
  - { titulo: Grecia, adm0: GRC }
  - { titulo: Rusia, adm0: RUS }
  - { titulo: China, adm0: CHN }
  - { titulo: Japón, adm0: JPN }
  - { titulo: India, adm0: IND }
  - { titulo: Egipto, adm0: EGY }
  - { titulo: Sudáfrica, adm0: ZAF }
  - { titulo: Kenia, adm0: KEN }
  - { titulo: Marruecos, adm0: MAR }
  - { titulo: Australia, adm0: AUS }
  - { titulo: Nueva Zelanda, adm0: NZL }
  - { titulo: Papúa Nueva Guinea, adm0: PNG }
```

Los 41 códigos `adm0` están verificados contra Natural Earth. Si un artículo temático duplica un país (por ejemplo "Antiguo Egipto" no choca con "Egipto", pero "Tierra" sí podría chocar con otra entrada llamada "Tierra"), `leerCuracion` lo avisará con "Slug repetido".

- [ ] **Step 3: PAUSA — revisión del autor**

Muestra al usuario la lista completa de `scripts/import/curacion.yaml` agrupada por categoría y espera su aprobación explícita antes de importar. La especificación exige que el autor revise la lista. Incorpora sus cambios antes de seguir.

- [ ] **Step 4: Importar**

```bash
npm run import; echo "código de salida: $?"
```

La primera corrida tarda varios minutos (1 s entre peticiones a las APIs). Las siguientes usan la caché de `scripts/import/.cache/`.

- [ ] **Step 5: Revisar el informe y repetir**

```bash
sed -n '1,60p' scripts/import/informe.md
```

Por cada artículo temático rechazado, reemplázalo en `curacion.yaml` por otro candidato de su categoría (Step 1) y vuelve a correr `npm run import`. Los países rechazados no se reemplazan: quedan como ficha breve en el atlas. Repite hasta cumplir el Step 6.

- [ ] **Step 6: Verificar los requisitos**

```bash
node -e "
const fs = require('fs');
const dir = 'src/content/articulos';
const conteo = {};
for (const f of fs.readdirSync(dir)) {
  const a = JSON.parse(fs.readFileSync(dir + '/' + f, 'utf8'));
  conteo[a.categoria] = (conteo[a.categoria] || 0) + 1;
}
console.log(conteo);
console.log('total:', Object.values(conteo).reduce((x, y) => x + y, 0));
const mexico = JSON.parse(fs.readFileSync(dir + '/mexico.json', 'utf8'));
console.log('mexico:', mexico.pais, 'principal:', Boolean(mexico.principal), 'relacionados:', mexico.relacionados.length);
"
du -sh src/assets/medios public/medios 2>/dev/null
```

Expected:
- `total` ≥ 100 y la última corrida de `npm run import` terminó con código de salida 0.
- Cada categoría temática (`animales`, `planeta-tierra`, `espacio`, `cuerpo-humano`, `historia`, `arte-y-musica`, `ciencia-y-tecnologia`) tiene al menos 10.
- `mexico: { adm0: 'MEX' } principal: true relacionados: N` con N ≥ 3 (las pruebas de la Tarea 12 usan esta página).
- `src/assets/medios` pesa menos de 100 MB.

- [ ] **Step 7: Commit del contenido**

```bash
git add scripts/import/curacion.yaml scripts/import/informe.md src/content/articulos src/assets/medios
git add public/medios 2>/dev/null || true
git commit -m "content: importa artículos curados de Vikidia con multimedia de Commons" -m "Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---
### Task 8: Datos del atlas desde Natural Earth

**Files:**
- Create: `scripts/atlas/datos/ne_110m_admin_0_countries.geojson` (descargado, dominio público)
- Create: `scripts/atlas/generar.ts`
- Create (generados): `src/data/atlas/paises.json`, `src/data/atlas/vistas.json`
- Modify: `package.json` (script `atlas`)
- Test: `tests/unit/atlas.test.ts`

**Interfaces:**
- Consumes: tipos `PaisAtlas`, `VistaAtlas`, `Caja` (Tarea 1).
- Produces:
  - `ANCHO = 960`, `ALTO = 500` (sistema de coordenadas del SVG)
  - `LIMITES_VISTAS: Record<Exclude<VistaAtlas, 'mundo'>, [oeste, sur, este, norte]>`
  - `generarAtlas(geo): { paises: PaisAtlas[]; vistas: Record<VistaAtlas, Caja> }`
  - `src/data/atlas/paises.json`: `PaisAtlas[]` ordenado por nombre en español (177 países)
  - `src/data/atlas/vistas.json`: `Record<VistaAtlas, Caja>`

Datos verificados: Natural Earth v5.1.2, 177 países, con `ADM0_A3`, `NAME_ES`, `CONTINENT` y `POP_EST`. Ningún polígono tiene la orientación invertida para d3. `ISO_A3` vale `-99` en Francia, Noruega y otros, por eso se usa `ADM0_A3`.

- [ ] **Step 1: Descargar los datos**

```bash
mkdir -p scripts/atlas/datos
curl -sS -o scripts/atlas/datos/ne_110m_admin_0_countries.geojson \
  "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/v5.1.2/geojson/ne_110m_admin_0_countries.geojson"
node -e "const g=require('./scripts/atlas/datos/ne_110m_admin_0_countries.geojson'); console.log(g.features.length)"
```

Expected: `177`.

- [ ] **Step 2: Escribir la prueba que falla**

`tests/unit/atlas.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { ALTO, ANCHO, generarAtlas } from '../../scripts/atlas/generar';

// Anillos en sentido horario (convención de d3-geo para polígonos "pequeños").
const cuadrado = (x: number, y: number) => ({
  type: 'Polygon' as const,
  coordinates: [[[x, y], [x, y + 10], [x + 10, y + 10], [x + 10, y], [x, y]]],
});

const pais = (ADM0_A3: string, NAME: string, NAME_ES: string | null, CONTINENT: string, POP_EST: number, geometry: unknown) => ({
  type: 'Feature' as const,
  properties: { ADM0_A3, NAME, NAME_ES, CONTINENT, POP_EST },
  geometry,
});

const geo = {
  type: 'FeatureCollection' as const,
  features: [
    pais('ZZB', 'Zeta', 'Zeta', 'Europe', 10.6, cuadrado(10, 40)),
    pais('AAA', 'Alpha', null, 'North America', 5, cuadrado(-100, 20)),
    pais('MMM', 'Mu', 'Ñandú', 'South America', 7, cuadrado(-60, -20)),
    pais('NUL', 'Nada', 'Nada', 'Asia', 1, null),
  ],
};

describe('generarAtlas', () => {
  const { paises, vistas } = generarAtlas(geo);

  it('ordena por nombre en español y usa NAME si falta NAME_ES', () => {
    expect(paises.map((p) => p.nombre)).toEqual(['Alpha', 'Ñandú', 'Zeta']);
  });

  it('traduce continentes, redondea población y genera paths', () => {
    expect(paises[0]).toMatchObject({ adm0: 'AAA', continente: 'América', poblacion: 5 });
    expect(paises[2]).toMatchObject({ adm0: 'ZZB', continente: 'Europa', poblacion: 11 });
    expect(paises.every((p) => p.d.startsWith('M'))).toBe(true);
  });

  it('omite países sin geometría', () => {
    expect(paises.find((p) => p.adm0 === 'NUL')).toBeUndefined();
  });

  it('calcula las seis vistas', () => {
    expect(Object.keys(vistas).sort()).toEqual(['africa', 'america', 'asia', 'europa', 'mundo', 'oceania']);
    expect(vistas.mundo).toEqual([0, 0, ANCHO, ALTO]);
    for (const caja of Object.values(vistas)) {
      expect(caja[2]).toBeGreaterThan(0);
      expect(caja[3]).toBeGreaterThan(0);
    }
  });
});
```

- [ ] **Step 3: Correr la prueba y verificar que falla**

Run: `npx vitest run tests/unit/atlas.test.ts`
Expected: FAIL, no se puede resolver `../../scripts/atlas/generar`.

- [ ] **Step 4: Implementar `scripts/atlas/generar.ts`**

```ts
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { geoPath } from 'd3-geo';
import { geoRobinson } from 'd3-geo-projection';
import type { Caja, PaisAtlas, VistaAtlas } from '../../src/lib/tipos';

export const ANCHO = 960;
export const ALTO = 500;

const CONTINENTES: Record<string, string> = {
  Africa: 'África',
  Asia: 'Asia',
  Europe: 'Europa',
  'North America': 'América',
  'South America': 'América',
  Oceania: 'Oceanía',
  Antarctica: 'Antártida',
  'Seven seas (open ocean)': 'Océanos',
};

/** [oeste, sur, este, norte] en grados. */
export const LIMITES_VISTAS: Record<Exclude<VistaAtlas, 'mundo'>, [number, number, number, number]> = {
  africa: [-20, -36, 55, 38],
  america: [-170, -56, -30, 75],
  asia: [25, -11, 150, 78],
  europa: [-25, 34, 45, 72],
  oceania: [110, -50, 180, 0],
};

interface Propiedades {
  ADM0_A3: string;
  NAME: string;
  NAME_ES?: string | null;
  CONTINENT: string;
  POP_EST: number;
}

interface Coleccion {
  type: 'FeatureCollection';
  features: { type: 'Feature'; properties: Propiedades; geometry: unknown }[];
}

export function generarAtlas(geo: Coleccion): { paises: PaisAtlas[]; vistas: Record<VistaAtlas, Caja> } {
  const proyeccion = geoRobinson().fitSize([ANCHO, ALTO], geo as never);
  const camino = geoPath(proyeccion).digits(1);

  const paises = geo.features
    .map((f) => ({
      adm0: f.properties.ADM0_A3,
      nombre: f.properties.NAME_ES || f.properties.NAME,
      continente: CONTINENTES[f.properties.CONTINENT] ?? f.properties.CONTINENT,
      poblacion: Math.round(Number(f.properties.POP_EST) || 0),
      d: (f.geometry ? camino(f as never) : null) ?? '',
    }))
    .filter((p) => p.d)
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));

  const vistas = { mundo: [0, 0, ANCHO, ALTO] } as Record<VistaAtlas, Caja>;
  for (const [vista, [oeste, sur, este, norte]] of Object.entries(LIMITES_VISTAS)) {
    const puntos: [number, number][] = [];
    for (let lon = oeste; lon <= este; lon += 5) puntos.push([lon, sur], [lon, norte]);
    for (let lat = sur; lat <= norte; lat += 5) puntos.push([oeste, lat], [este, lat]);
    puntos.push([este, sur], [este, norte]);
    const xy = puntos.map((p) => proyeccion(p)).filter((p): p is [number, number] => !!p);
    const xs = xy.map((p) => p[0]);
    const ys = xy.map((p) => p[1]);
    const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
    const margen = 0.05 * Math.max(x1 - x0, y1 - y0);
    vistas[vista as VistaAtlas] = [x0 - margen, y0 - margen, x1 - x0 + 2 * margen, y1 - y0 + 2 * margen].map(
      (v) => Math.round(v * 10) / 10,
    ) as Caja;
  }
  return { paises, vistas };
}

async function main() {
  const geo = JSON.parse(await readFile('scripts/atlas/datos/ne_110m_admin_0_countries.geojson', 'utf8')) as Coleccion;
  const { paises, vistas } = generarAtlas(geo);
  await mkdir('src/data/atlas', { recursive: true });
  await writeFile('src/data/atlas/paises.json', `${JSON.stringify(paises)}\n`);
  await writeFile('src/data/atlas/vistas.json', `${JSON.stringify(vistas, null, 2)}\n`);
  console.log(`Atlas: ${paises.length} países`);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
```

- [ ] **Step 5: Correr la prueba y verificar que pasa**

Run: `npx vitest run tests/unit/atlas.test.ts`
Expected: PASS (4 pruebas).

- [ ] **Step 6: Generar los datos reales**

```bash
npm pkg set scripts.atlas="tsx scripts/atlas/generar.ts"
npm run atlas
node -e "const p=require('./src/data/atlas/paises.json'); const m=p.find(x=>x.adm0==='MEX'); console.log(p.length, m.nombre, m.continente); console.log(require('./src/data/atlas/vistas.json').europa)"
```

Expected: `Atlas: 177 países`, luego `177 México América` y la caja de Europa (aproximadamente `[407.2, 24.2, 196.6, 126.8]`).

- [ ] **Step 7: Commit**

```bash
git add scripts/atlas tests/unit/atlas.test.ts src/data/atlas package.json
git commit -m "feat(atlas): genera el mapa del mundo desde Natural Earth" -m "Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---
### Task 9: Colecciones de contenido y validación previa al build

**Files:**
- Create: `src/content.config.ts`, `scripts/validar.ts`
- Modify: `package.json` (scripts `validar` y `build`)
- Test: `tests/unit/validar.test.ts`

**Interfaces:**
- Consumes: tipos (Tarea 1), contenido (Tarea 7), atlas (Tarea 8).
- Produces:
  - Colecciones de Astro `articulos` y `cuestionarios` (id = nombre del archivo sin `.json`), con los esquemas del modelo de datos de la especificación.
  - `interface DatosValidacion { articulos: { id: string; datos: Articulo }[]; cuestionarios: { id: string; datos: Cuestionario }[]; adm0Atlas: Set<string>; imagenes: Set<string>; publicos: Set<string> }`
  - `validarContenido(d: DatosValidacion): string[]` (lista de errores; vacía si todo está bien)
  - `npm run validar` (sale con 1 si hay errores) y `npm run build` = validar + `astro build`

Notas de Astro 7 verificadas en la guía de migración: la configuración va en `src/content.config.ts`; cada colección necesita un `loader` (`glob` de `astro/loaders`); `z` se importa de `astro/zod` (Zod 4, donde `z.url()` es de primer nivel).

- [ ] **Step 1: Escribir la prueba que falla**

`tests/unit/validar.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { validarContenido, type DatosValidacion } from '../../scripts/validar';
import type { Articulo, Cuestionario, Medio, Pregunta } from '../../src/lib/tipos';

const medio = (archivo: string, tipo: Medio['tipo'] = 'imagen'): Medio => ({
  archivo,
  tipo,
  alt: 'x',
  autor: 'Ana',
  licencia: 'cc-by-sa',
  licenciaUrl: 'https://creativecommons.org/licenses/by-sa/4.0',
  fuenteUrl: `https://commons.wikimedia.org/wiki/File:${archivo}`,
});

const articulo = (slug: string, cambios: Partial<Articulo> = {}): Articulo => ({
  slug,
  titulo: slug,
  categoria: 'animales',
  resumen: 'r',
  bloques: [{ tipo: 'html', html: '<p>Hola</p>' }],
  principal: medio(`${slug}.jpg`),
  medios: [medio(`${slug}.jpg`)],
  relacionados: [],
  fuente: { url: 'https://es.vikidia.org/wiki/X', historialUrl: 'https://es.vikidia.org/w/index.php?title=X&action=history', revid: 1, fecha: '2026-10-14' },
  ...cambios,
});

const pregunta = (n: number, cambios: Partial<Pregunta> = {}): Pregunta => ({
  id: `animales-${String(n).padStart(2, '0')}`,
  texto: '¿Pregunta?',
  imagen: 'leon.jpg',
  opciones: ['a', 'b', 'c'],
  correcta: 1,
  articulo: 'leon',
  explicacion: 'Dato.',
  ...cambios,
});

const cuestionario = (preguntas: Pregunta[] = Array.from({ length: 10 }, (_, i) => pregunta(i + 1))): Cuestionario => ({
  slug: 'animales',
  titulo: '¿Cuánto sabes de animales?',
  categoria: 'animales',
  preguntas,
});

const datos = (cambios: Partial<DatosValidacion> = {}): DatosValidacion => ({
  articulos: [
    { id: 'leon', datos: articulo('leon', { relacionados: ['tigre'], bloques: [{ tipo: 'html', html: '<p><a href="/articulo/tigre">tigre</a></p>' }] }) },
    { id: 'tigre', datos: articulo('tigre') },
    { id: 'mexico', datos: articulo('mexico', { categoria: 'paises', pais: { adm0: 'MEX' } }) },
  ],
  cuestionarios: [{ id: 'animales', datos: cuestionario() }],
  adm0Atlas: new Set(['MEX']),
  imagenes: new Set(['leon.jpg', 'tigre.jpg', 'mexico.jpg']),
  publicos: new Set(),
  ...cambios,
});

describe('validarContenido', () => {
  it('acepta contenido válido', () => {
    expect(validarContenido(datos())).toEqual([]);
  });

  it('exige al menos un artículo', () => {
    expect(validarContenido(datos({ articulos: [], cuestionarios: [] }))).toContain('no hay artículos en src/content/articulos');
  });

  it('detecta fuente incompleta y slug distinto del archivo', () => {
    const d = datos();
    d.articulos[1] = { id: 'tigre', datos: articulo('tigrito', { fuente: { url: '', historialUrl: '', revid: 0, fecha: '' } }) };
    const e = validarContenido(d).join('\n');
    expect(e).toContain('el slug «tigrito» no coincide');
    expect(e).toContain('fuente incompleta');
  });

  it('detecta medios sin autor, con licencia no permitida o sin archivo', () => {
    const d = datos();
    d.articulos[1] = { id: 'tigre', datos: articulo('tigre', { principal: undefined, medios: [{ ...medio('tigre.jpg'), autor: ' ', licencia: 'cc-by-nc' as never }, medio('falta.mp3', 'audio')] }) };
    const e = validarContenido(d).join('\n');
    expect(e).toContain('medio «tigre.jpg»: sin autor');
    expect(e).toContain('licencia no permitida «cc-by-nc»');
    expect(e).toContain('medio «falta.mp3»: el archivo no existe');
  });

  it('detecta figuras sin medio, enlaces rotos, relacionados inexistentes y países desconocidos', () => {
    const d = datos();
    d.articulos[0] = {
      id: 'leon',
      datos: articulo('leon', {
        relacionados: ['puma'],
        bloques: [
          { tipo: 'html', html: '<p><a href="/articulo/puma">puma</a></p>' },
          { tipo: 'figura', archivo: 'otra.jpg', pie: '' },
        ],
      }),
    };
    d.adm0Atlas = new Set();
    const e = validarContenido(d).join('\n');
    expect(e).toContain('la figura «otra.jpg» no está entre sus medios');
    expect(e).toContain('enlace interno roto a «puma»');
    expect(e).toContain('relacionado inexistente «puma»');
    expect(e).toContain('el país «MEX» no existe en Natural Earth');
  });

  it('valida los cuestionarios', () => {
    const malas = [
      pregunta(1, { opciones: ['a', 'b'] as never }),
      pregunta(2, { correcta: 3 as never }),
      pregunta(3, { articulo: 'puma' }),
      pregunta(4, { imagen: 'tigre.jpg' }),
      pregunta(4),
    ];
    const e = validarContenido(datos({ cuestionarios: [{ id: 'animales', datos: cuestionario(malas) }] })).join('\n');
    expect(e).toContain('tiene 5 preguntas (deben ser 10)');
    expect(e).toContain('debe tener exactamente 3 opciones');
    expect(e).toContain('debe ser 0, 1 o 2');
    expect(e).toContain('el artículo «puma» no existe');
    expect(e).toContain('la imagen «tigre.jpg» no es una imagen del artículo «leon»');
    expect(e).toContain('id repetido');
  });
});
```

- [ ] **Step 2: Correr la prueba y verificar que falla**

Run: `npx vitest run tests/unit/validar.test.ts`
Expected: FAIL, no se puede resolver `../../scripts/validar`.

- [ ] **Step 3: Implementar `scripts/validar.ts`**

```ts
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import type { Articulo, Cuestionario, Medio } from '../src/lib/tipos';

const LICENCIAS = new Set(['dominio-publico', 'cc0', 'cc-by', 'cc-by-sa']);

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
    }
    const medios = new Map([...(a.principal ? [a.principal] : []), ...a.medios].map((m) => [m.archivo, m]));
    for (const m of medios.values()) errores.push(...validarMedio(m, donde, d));
    const archivos = new Set(a.medios.map((m) => m.archivo));
    for (const b of a.bloques) {
      if (b.tipo === 'figura' && !archivos.has(b.archivo)) {
        errores.push(`${donde}: la figura «${b.archivo}» no está entre sus medios`);
      }
      if (b.tipo === 'html') {
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
```

- [ ] **Step 4: Correr la prueba y verificar que pasa**

Run: `npx vitest run tests/unit/validar.test.ts`
Expected: PASS (6 pruebas).

- [ ] **Step 5: Crear `src/content.config.ts`**

```ts
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { SLUGS_CATEGORIAS } from './config';

const idDesdeArchivo = ({ entry }: { entry: string }) => entry.replace(/\.json$/, '');

const licencia = z.enum(['dominio-publico', 'cc0', 'cc-by', 'cc-by-sa']);

const medio = z.object({
  archivo: z.string().min(1),
  tipo: z.enum(['imagen', 'audio', 'video']),
  alt: z.string(),
  autor: z.string().min(1),
  licencia,
  licenciaUrl: z.string(),
  fuenteUrl: z.url(),
});

const bloque = z.discriminatedUnion('tipo', [
  z.object({ tipo: z.literal('html'), html: z.string() }),
  z.object({ tipo: z.literal('figura'), archivo: z.string(), pie: z.string() }),
]);

const articulos = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/articulos', generateId: idDesdeArchivo }),
  schema: z.object({
    slug: z.string(),
    titulo: z.string(),
    categoria: z.enum(SLUGS_CATEGORIAS),
    resumen: z.string(),
    bloques: z.array(bloque),
    principal: medio.optional(),
    medios: z.array(medio),
    relacionados: z.array(z.string()),
    pais: z.object({ adm0: z.string().regex(/^[A-Z]{3}$/) }).optional(),
    fuente: z.object({ url: z.url(), historialUrl: z.url(), revid: z.number().int(), fecha: z.string() }),
  }),
});

const pregunta = z.object({
  id: z.string(),
  texto: z.string(),
  imagen: z.string(),
  opciones: z.tuple([z.string(), z.string(), z.string()]),
  correcta: z.union([z.literal(0), z.literal(1), z.literal(2)]),
  articulo: z.string(),
  explicacion: z.string(),
});

const cuestionarios = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/cuestionarios', generateId: idDesdeArchivo }),
  schema: z.object({
    slug: z.string(),
    titulo: z.string(),
    categoria: z.enum(SLUGS_CATEGORIAS),
    preguntas: z.array(pregunta).length(10),
  }),
});

export const collections = { articulos, cuestionarios };
```

- [ ] **Step 6: Conectar la validación al build y verificar**

```bash
mkdir -p src/content/cuestionarios && touch src/content/cuestionarios/.gitkeep
npm pkg set scripts.validar="tsx scripts/validar.ts" scripts.build="npm run validar && astro build"
npm run validar
npm run build
```

Expected: `✓ Contenido válido` y luego el build de Astro termina sin errores de esquema (puede avisar que la colección `cuestionarios` está vacía; eso es normal hasta la Tarea 16).

Si `npm run validar` muestra problemas en el contenido importado, corrige su origen (curación o importador) y vuelve a correr `npm run import`; no edites a mano los JSON generados.

- [ ] **Step 7: Commit**

```bash
git add src/content.config.ts scripts/validar.ts tests/unit/validar.test.ts src/content/cuestionarios/.gitkeep package.json
git commit -m "feat: colecciones de contenido y validación previa al build" -m "Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---
### Task 10: Ventana nostálgica, Inicio, Acerca de, 404 y pruebas de extremo a extremo

**Files:**
- Create: `scripts/iconos/descargar.ts`, `public/iconos/*.svg`, `public/favicon.svg`
- Create: `src/styles/tokens.css`, `src/styles/global.css`
- Create: `src/layouts/Base.astro`, `src/components/Ventana.astro`, `src/components/BarraHerramientas.astro`, `src/components/Icono.astro`
- Modify: `src/config.ts` (agrega `ICONOS`), `src/lib/texto.ts` (agrega `jsonParaScript`)
- Replace: `src/pages/index.astro`
- Create: `src/pages/acerca.astro`, `src/pages/404.astro`
- Create: `playwright.config.ts`, `tests/e2e/ayuda.ts`, `tests/e2e/inicio.spec.ts`
- Test: `tests/unit/iconos.test.ts`, `tests/unit/texto.test.ts` (caso nuevo)

**Interfaces:**
- Consumes: `SITIO`, `CATEGORIAS` (Tarea 1), colecciones (Tarea 9), tipo `Pantalla` (Tarea 1).
- Produces:
  - `ICONOS` en `src/config.ts`: `{ inicio, buscar, atlas, juegos, acerca, sonido, silencio, atras, adelante, estrella, trofeo, libros }` (códigos OpenMoji)
  - `jsonParaScript(valor: unknown): string` (JSON seguro dentro de `<script type="application/json">`)
  - `codigosIconos(): string[]`, `urlIcono(codigo: string): string`
  - Layout `Base.astro` con props `{ titulo: string; pantalla: Pantalla; descripcion?: string }`
  - `Icono.astro` con props `{ codigo: string; tam?: number; alt?: string }`
  - Elementos persistentes: `.barra-titulo` (`transition:persist="barra-titulo"`), `.herramientas` (`transition:persist="herramientas"`), que contiene `nav.barra-herramientas` con `aria-label="Barra de herramientas"`, `.ranura-buscador` (la Tarea 13 pone ahí el buscador) y `.ranura-sonido` (la Tarea 11 pone ahí el botón de sonido)
  - `main#contenido[data-pantalla]`
  - `tests/e2e/ayuda.ts`: `revisarAccesibilidad(page: Page): Promise<void>`

- [ ] **Step 1: Escribir las pruebas unitarias que fallan**

`tests/unit/iconos.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { codigosIconos, urlIcono } from '../../scripts/iconos/descargar';
import { CATEGORIAS, ICONOS } from '../../src/config';

describe('iconos', () => {
  it('incluye los íconos de categorías y de la interfaz sin repetir', () => {
    const codigos = codigosIconos();
    for (const c of CATEGORIAS) expect(codigos).toContain(c.icono);
    for (const c of Object.values(ICONOS)) expect(codigos).toContain(c);
    expect(new Set(codigos).size).toBe(codigos.length);
  });

  it('usa la versión fija de OpenMoji', () => {
    expect(urlIcono('1F981')).toBe('https://unpkg.com/openmoji@17.0.0/color/svg/1F981.svg');
  });
});
```

Agrega este caso al final de `tests/unit/texto.test.ts` (y suma `jsonParaScript` al `import` existente de `../../src/lib/texto`):

```ts
describe('jsonParaScript', () => {
  it('escapa "<" para que el JSON no pueda cerrar la etiqueta <script>', () => {
    const s = jsonParaScript([{ texto: '</script><script>alert(1)</script>' }]);
    expect(s).not.toContain('<');
    expect(JSON.parse(s)).toEqual([{ texto: '</script><script>alert(1)</script>' }]);
  });
});
```

- [ ] **Step 2: Correr las pruebas y verificar que fallan**

Run: `npx vitest run tests/unit/iconos.test.ts tests/unit/texto.test.ts`
Expected: FAIL (`descargar` no existe, `ICONOS` y `jsonParaScript` no están exportados).

- [ ] **Step 3: Implementar `ICONOS`, `jsonParaScript` y el descargador de íconos**

Agrega al final de `src/config.ts`:

```ts
/** Códigos de OpenMoji (CC BY-SA 4.0) usados en la interfaz. */
export const ICONOS = {
  inicio: '1F3E0',
  buscar: '1F50D',
  atlas: '1F5FA',
  juegos: '1F3B2',
  acerca: '2139',
  sonido: '1F50A',
  silencio: '1F507',
  atras: '2B05',
  adelante: '27A1',
  estrella: '2B50',
  trofeo: '1F3C6',
  libros: '1F4DA',
} as const;
```

Agrega al final de `src/lib/texto.ts`:

```ts
/** JSON que se puede incrustar en <script type="application/json"> sin cerrar la etiqueta. */
export function jsonParaScript(valor: unknown): string {
  return JSON.stringify(valor).replace(/</g, '\\u003c');
}
```

`scripts/iconos/descargar.ts`:

```ts
import { access, copyFile, mkdir, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { CATEGORIAS, ICONOS } from '../../src/config';

export const VERSION_OPENMOJI = '17.0.0';

export function codigosIconos(): string[] {
  return [...new Set([...CATEGORIAS.map((c) => c.icono), ...Object.values(ICONOS)])];
}

export function urlIcono(codigo: string): string {
  return `https://unpkg.com/openmoji@${VERSION_OPENMOJI}/color/svg/${codigo}.svg`;
}

async function main() {
  await mkdir('public/iconos', { recursive: true });
  for (const codigo of codigosIconos()) {
    const destino = `public/iconos/${codigo}.svg`;
    try {
      await access(destino);
      continue;
    } catch {
      // no existe: se descarga
    }
    const r = await fetch(urlIcono(codigo));
    if (!r.ok) throw new Error(`No se pudo descargar ${codigo}: HTTP ${r.status}`);
    await writeFile(destino, await r.text());
    console.log(`✓ ${codigo}`);
  }
  await copyFile(`public/iconos/${ICONOS.libros}.svg`, 'public/favicon.svg');
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
```

- [ ] **Step 4: Correr las pruebas unitarias y descargar los íconos**

```bash
npx vitest run tests/unit/iconos.test.ts tests/unit/texto.test.ts
npm pkg set scripts.iconos="tsx scripts/iconos/descargar.ts"
npm run iconos
ls public/iconos | wc -l
```

Expected: PASS; luego 20 archivos SVG en `public/iconos/` y existe `public/favicon.svg`.

- [ ] **Step 5: Estilos base**

`src/styles/tokens.css`:

```css
:root {
  --fuente-texto: Tahoma, Verdana, 'DejaVu Sans', sans-serif;
  --fuente-titulos: 'Baloo 2', Tahoma, Verdana, sans-serif;

  --fondo-escritorio: #2f6fd0;
  --fondo-escritorio-2: #39c6f4;
  --ventana: #f4f8fd;
  --ventana-borde: #2b5aa8;
  --texto: #1d2733;
  --texto-suave: #45525f;
  --enlace: #0b57b5;
  --foco: #ffb000;

  --barra-titulo-1: #5aa3f0;
  --barra-titulo-2: #1f5fbf;
  --boton-1: #ffffff;
  --boton-2: #d8e6f7;
  --boton-borde: #7fa3cf;
  --activo-1: #ffe9a8;
  --activo-2: #ffc94d;

  --radio: 14px;
  --sombra: 0 10px 30px rgb(0 30 80 / 0.35);
  --brillo: linear-gradient(to bottom, rgb(255 255 255 / 0.55), rgb(255 255 255 / 0.05) 50%, transparent 50%);

  /* Un color por categoría; todos con contraste AA contra texto blanco. */
  --cat-animales: #1f7a3a;
  --cat-planeta-tierra: #8a4b12;
  --cat-espacio: #3437a8;
  --cat-cuerpo-humano: #b42a48;
  --cat-historia: #7a4f0e;
  --cat-arte-y-musica: #8a2f9c;
  --cat-ciencia-y-tecnologia: #0b6874;
  --cat-paises: #a85400;
}
```

`src/styles/global.css`:

```css
*,
*::before,
*::after {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-height: 100vh;
  font-family: var(--fuente-texto);
  color: var(--texto);
  line-height: 1.55;
  background: linear-gradient(160deg, var(--fondo-escritorio-2), var(--fondo-escritorio) 60%, #1b3f8f);
}

h1,
h2,
h3 {
  font-family: var(--fuente-titulos);
  line-height: 1.15;
  margin: 0 0 0.5em;
}

a {
  color: var(--enlace);
}

img {
  max-width: 100%;
  height: auto;
}

:focus-visible {
  outline: 3px solid var(--foco);
  outline-offset: 2px;
}

.saltar {
  position: absolute;
  left: -9999px;
  top: 0;
  z-index: 100;
  padding: 0.5rem 1rem;
  background: #fff;
}

.saltar:focus {
  left: 1rem;
  top: 1rem;
}

.boton {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.45rem 0.8rem;
  border-radius: 999px;
  border: 1px solid var(--boton-borde);
  color: var(--texto);
  text-decoration: none;
  font: inherit;
  font-weight: bold;
  cursor: pointer;
  background: var(--brillo), linear-gradient(to bottom, var(--boton-1), var(--boton-2));
  box-shadow: 0 1px 2px rgb(0 0 0 / 0.2), inset 0 1px 0 #fff;
  transition: transform 0.1s ease, filter 0.15s ease;
}

.boton:hover {
  filter: brightness(1.05) saturate(1.1);
}

.boton:active {
  transform: translateY(1px);
}

.boton[aria-current='page'],
.boton[aria-pressed='true'] {
  background: var(--brillo), linear-gradient(to bottom, var(--activo-1), var(--activo-2));
  border-color: #c9932a;
}

.boton-icono {
  padding: 0.4rem;
}

.boton-grande {
  padding: 0.7rem 1.2rem;
  font-size: 1.1rem;
}

.panel {
  background: #fff;
  border: 1px solid #c9d8ec;
  border-radius: var(--radio);
  padding: 1rem 1.25rem;
  box-shadow: 0 2px 6px rgb(0 40 100 / 0.08);
}

.visualmente-oculto {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }

  ::view-transition-group(*),
  ::view-transition-old(*),
  ::view-transition-new(*) {
    animation: none !important;
  }
}
```

- [ ] **Step 6: Componentes de la ventana**

`src/components/Icono.astro`:

```astro
---
interface Props {
  codigo: string;
  tam?: number;
  alt?: string;
}
const { codigo, tam = 24, alt = '' } = Astro.props;
---
<img src={`/iconos/${codigo}.svg`} width={tam} height={tam} alt={alt} class="icono" decoding="async" />
```

`src/components/BarraHerramientas.astro`:

```astro
---
import Icono from './Icono.astro';
import { ICONOS } from '../config';

const destinos = [
  { href: '/', etiqueta: 'Inicio', icono: ICONOS.inicio, soloMovil: false },
  { href: '/buscar', etiqueta: 'Buscar', icono: ICONOS.buscar, soloMovil: true },
  { href: '/atlas', etiqueta: 'Atlas', icono: ICONOS.atlas, soloMovil: false },
  { href: '/juegos', etiqueta: 'Juegos', icono: ICONOS.juegos, soloMovil: false },
  { href: '/acerca', etiqueta: 'Acerca de', icono: ICONOS.acerca, soloMovil: false },
];
---
<nav class="barra-herramientas" aria-label="Barra de herramientas">
  <button type="button" class="boton boton-icono" data-accion="atras" aria-label="Atrás">
    <Icono codigo={ICONOS.atras} />
  </button>
  <button type="button" class="boton boton-icono" data-accion="adelante" aria-label="Adelante">
    <Icono codigo={ICONOS.adelante} />
  </button>
  <ul class="destinos">
    {
      destinos.map((d) => (
        <li class:list={{ 'solo-movil': d.soloMovil }}>
          <a class="boton" href={d.href} data-destino={d.href}>
            <Icono codigo={d.icono} />
            <span class="etiqueta">{d.etiqueta}</span>
          </a>
        </li>
      ))
    }
  </ul>
  <div class="ranura-buscador"><slot name="buscador" /></div>
  <div class="ranura-sonido"><slot name="sonido" /></div>
</nav>

<script>
  function marcarActual() {
    const ruta = location.pathname;
    for (const a of document.querySelectorAll<HTMLAnchorElement>('.barra-herramientas [data-destino]')) {
      const destino = a.dataset.destino ?? '';
      const activo = destino === '/' ? ruta === '/' : ruta.startsWith(destino);
      if (activo) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    }
  }
  document.addEventListener('astro:page-load', marcarActual);
  document.addEventListener('click', (e) => {
    const boton = (e.target as Element).closest<HTMLButtonElement>('.barra-herramientas [data-accion]');
    if (!boton) return;
    if (boton.dataset.accion === 'atras') history.back();
    else history.forward();
  });
</script>

<style>
  .barra-herramientas {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    flex-wrap: wrap;
  }
  .destinos {
    display: flex;
    gap: 0.4rem;
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .ranura-buscador {
    margin-left: auto;
  }
  .solo-movil {
    display: none;
  }
  @media (max-width: 767px) {
    .barra-herramientas {
      flex-wrap: nowrap;
    }
    [data-accion],
    .ranura-buscador {
      display: none;
    }
    .destinos {
      width: 100%;
      justify-content: space-around;
    }
    .destinos .boton {
      flex-direction: column;
      gap: 0;
      padding: 0.3rem 0.4rem;
      font-size: 0.75rem;
      border-radius: 10px;
    }
    .solo-movil {
      display: list-item;
    }
  }
</style>
```

`src/components/Ventana.astro`:

```astro
---
import BarraHerramientas from './BarraHerramientas.astro';
import Icono from './Icono.astro';
import { ICONOS, SITIO } from '../config';
import type { Pantalla } from '../lib/tipos';

interface Props {
  pantalla: Pantalla;
}
const { pantalla } = Astro.props;
---
<div class="escritorio">
  <div class="ventana">
    <header class="barra-titulo" transition:persist="barra-titulo">
      <a href="/" class="marca">
        <Icono codigo={ICONOS.libros} tam={28} />
        <span>{SITIO.nombre}</span>
      </a>
    </header>
    <div class="herramientas" transition:persist="herramientas">
      <BarraHerramientas />
    </div>
    <main id="contenido" class="contenido" data-pantalla={pantalla}>
      <slot />
    </main>
  </div>
</div>

<style>
  .escritorio {
    padding: 24px;
    min-height: 100vh;
  }
  .ventana {
    max-width: 1180px;
    margin: 0 auto;
    min-height: calc(100vh - 48px);
    display: flex;
    flex-direction: column;
    background: var(--ventana);
    border: 2px solid var(--ventana-borde);
    border-radius: 18px;
    box-shadow: var(--sombra);
    overflow: hidden;
  }
  .barra-titulo {
    padding: 0.5rem 1rem;
    background: var(--brillo), linear-gradient(to bottom, var(--barra-titulo-1), var(--barra-titulo-2));
  }
  .marca {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    color: #fff;
    text-decoration: none;
    font-family: var(--fuente-titulos);
    font-size: 1.35rem;
    font-weight: 700;
    text-shadow: 0 1px 2px rgb(0 0 0 / 0.4);
  }
  .herramientas {
    padding: 0.4rem 0.75rem;
    background: linear-gradient(to bottom, #eef4fc, #d5e3f5);
    border-bottom: 1px solid #a9c1e0;
  }
  .contenido {
    flex: 1;
    position: relative;
    padding: 1.5rem;
  }
  @media (max-width: 767px) {
    .escritorio {
      padding: 0;
    }
    .ventana {
      min-height: 100vh;
      border: 0;
      border-radius: 0;
      box-shadow: none;
    }
    .barra-titulo {
      display: none;
    }
    .herramientas {
      position: fixed;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 50;
      border-top: 1px solid #a9c1e0;
      border-bottom: 0;
    }
    .contenido {
      padding: 1rem 1rem 6rem;
    }
  }
</style>
```

`src/layouts/Base.astro`:

```astro
---
import '@fontsource/baloo-2/700.css';
import '../styles/tokens.css';
import '../styles/global.css';
import { ClientRouter } from 'astro:transitions';
import Ventana from '../components/Ventana.astro';
import { SITIO } from '../config';
import type { Pantalla } from '../lib/tipos';

interface Props {
  titulo: string;
  pantalla: Pantalla;
  descripcion?: string;
}
const { titulo, pantalla, descripcion = SITIO.lema } = Astro.props;
---
<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{`${titulo} · ${SITIO.nombre}`}</title>
    <meta name="description" content={descripcion} />
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
    <ClientRouter />
  </head>
  <body>
    <a class="saltar" href="#contenido">Saltar al contenido</a>
    <Ventana pantalla={pantalla}>
      <slot />
    </Ventana>
  </body>
</html>
```

- [ ] **Step 7: Páginas de Inicio, Acerca de y 404**

`src/pages/index.astro` (reemplaza la página temporal):

```astro
---
import { getCollection } from 'astro:content';
import Base from '../layouts/Base.astro';
import Icono from '../components/Icono.astro';
import { CATEGORIAS, ICONOS, SITIO } from '../config';
import { jsonParaScript } from '../lib/texto';

const articulos = await getCollection('articulos');
const cuestionarios = await getCollection('cuestionarios');
const explicaciones = cuestionarios.flatMap((c) =>
  c.data.preguntas.map((p) => ({ texto: p.explicacion, href: `/articulo/${p.articulo}` })),
);
const datos = explicaciones.length
  ? explicaciones
  : articulos.map((a) => ({ texto: a.data.resumen, href: `/articulo/${a.data.slug}` }));
const cuenta = (slug: string) => articulos.filter((a) => a.data.categoria === slug).length;
---
<Base titulo="Inicio" pantalla="inicio">
  <section class="bienvenida">
    <h1>{SITIO.nombre}</h1>
    <p class="lema">{SITIO.lema}</p>
  </section>

  <ul class="mosaicos">
    {
      CATEGORIAS.map((c) => (
        <li>
          <a class="mosaico" href={`/categoria/${c.slug}`} style={`--color: var(--cat-${c.slug})`}>
            <Icono codigo={c.icono} tam={72} />
            <span class="nombre">{c.nombre}</span>
            <span class="cuenta">{`${cuenta(c.slug)} artículos`}</span>
          </a>
        </li>
      ))
    }
  </ul>

  <aside class="sabias-que panel" aria-live="polite">
    <h2>¿Sabías que…?</h2>
    <p id="dato-curioso">{datos[0]?.texto}</p>
    <a id="dato-enlace" href={datos[0]?.href}>Leer más</a>
  </aside>

  <div class="accesos">
    <a class="boton boton-grande" href="/atlas"><Icono codigo={ICONOS.atlas} tam={32} /> Explorar el atlas</a>
    <a class="boton boton-grande" href="/juegos"><Icono codigo={ICONOS.juegos} tam={32} /> Jugar</a>
  </div>

  <script type="application/json" id="datos-curiosos" set:html={jsonParaScript(datos)} />
</Base>

<script>
  document.addEventListener('astro:page-load', () => {
    const fuente = document.getElementById('datos-curiosos');
    if (!fuente) return;
    const datos = JSON.parse(fuente.textContent || '[]') as { texto: string; href: string }[];
    if (!datos.length) return;
    const dato = datos[Math.floor(Math.random() * datos.length)];
    document.getElementById('dato-curioso')!.textContent = dato.texto;
    document.getElementById('dato-enlace')!.setAttribute('href', dato.href);
  });
</script>

<style>
  .bienvenida {
    text-align: center;
    margin-bottom: 1.5rem;
  }
  .bienvenida h1 {
    font-size: 2.6rem;
    color: #1f5fbf;
  }
  .lema {
    margin: 0;
    font-size: 1.2rem;
    color: var(--texto-suave);
  }
  .mosaicos {
    list-style: none;
    margin: 0 0 1.5rem;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 1rem;
  }
  .mosaico {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.3rem;
    padding: 1.2rem 0.8rem;
    border-radius: 20px;
    color: #fff;
    text-decoration: none;
    background: var(--brillo), var(--color);
    box-shadow: 0 4px 10px rgb(0 0 0 / 0.2), inset 0 1px 0 rgb(255 255 255 / 0.6);
    transition: transform 0.15s ease;
  }
  .mosaico:hover {
    transform: translateY(-3px) scale(1.02);
  }
  .nombre {
    font-family: var(--fuente-titulos);
    font-size: 1.4rem;
    font-weight: 700;
    text-shadow: 0 1px 2px rgb(0 0 0 / 0.35);
  }
  .cuenta {
    font-size: 0.9rem;
  }
  .sabias-que {
    background: #fffbe6;
    border-color: #f0d77b;
  }
  .accesos {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 1rem;
    margin-top: 1.5rem;
  }
  @media (max-width: 1179px) {
    .mosaicos {
      grid-template-columns: repeat(2, 1fr);
    }
  }
</style>
```

`src/pages/acerca.astro`:

```astro
---
import Base from '../layouts/Base.astro';
import { SITIO } from '../config';
---
<Base titulo="Acerca de" pantalla="acerca">
  <h1>Acerca de {SITIO.nombre}</h1>
  <p class="panel aviso">{SITIO.homenaje}</p>

  <h2>Licencias y créditos</h2>
  <!-- Cada elemento en una sola línea: con compressHTML 'jsx' (Astro 7) un salto de línea junto a una etiqueta puede borrar el espacio. -->
  <ul class="creditos">
    <li><strong>Artículos:</strong> basados en <a href="https://es.vikidia.org">Vikidia</a>, la enciclopedia libre para niños, con licencia <a href="https://creativecommons.org/licenses/by-sa/3.0/deed.es">CC BY-SA 3.0</a>. Los textos fueron adaptados y cada artículo enlaza a su original y a su historial de autores.</li>
    <li><strong>Cuestionarios:</strong> escritos a partir de esos artículos, con la misma licencia CC BY-SA 3.0.</li>
    <li><strong>Imágenes, audio y video:</strong> de <a href="https://commons.wikimedia.org">Wikimedia Commons</a>. Cada archivo muestra su autor y su licencia al pie del artículo.</li>
    <li><strong>Íconos:</strong> <a href="https://openmoji.org">OpenMoji</a>, licencia <a href="https://creativecommons.org/licenses/by-sa/4.0/deed.es">CC BY-SA 4.0</a>.</li>
    <li><strong>Mapa:</strong> <a href="https://www.naturalearthdata.com">Natural Earth</a>, dominio público.</li>
    <li><strong>Tipografía de títulos:</strong> Baloo 2, licencia SIL Open Font License.</li>
    <li><strong>Personaje guía, diseño y código:</strong> originales de este proyecto; el código tiene licencia MIT.</li>
  </ul>
</Base>

<style>
  .aviso {
    font-weight: bold;
    background: #eef6ff;
  }
  .creditos li {
    margin-bottom: 0.6rem;
  }
</style>
```

`src/pages/404.astro`:

```astro
---
import Base from '../layouts/Base.astro';
---
<Base titulo="Página no encontrada" pantalla="404">
  <div class="perdida">
    <h1>¡Ups! Esta página se perdió</h1>
    <p>No encontramos lo que buscabas. Volvamos al comienzo.</p>
    <a class="boton boton-grande" href="/">Ir a Inicio</a>
  </div>
</Base>

<style>
  .perdida {
    text-align: center;
    padding: 3rem 1rem;
  }
</style>
```

- [ ] **Step 8: Configurar Playwright y escribir las pruebas de extremo a extremo**

```bash
npx playwright install chromium
```

`playwright.config.ts`:

```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  reporter: 'list',
  use: { baseURL: 'http://localhost:4321' },
  webServer: {
    command: 'npm run build && npm run preview -- --port 4321',
    url: 'http://localhost:4321',
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
  },
  projects: [
    { name: 'escritorio', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } } },
    { name: 'tablet', use: { ...devices['Desktop Chrome'], viewport: { width: 820, height: 1180 }, hasTouch: true } },
  ],
});
```

`tests/e2e/ayuda.ts`:

```ts
import AxeBuilder from '@axe-core/playwright';
import { expect, type Page } from '@playwright/test';

export async function revisarAccesibilidad(page: Page): Promise<void> {
  const resultado = await new AxeBuilder({ page }).analyze();
  const graves = resultado.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
  expect(graves.map((v) => `${v.id}: ${v.help} (${v.nodes.length})`)).toEqual([]);
}
```

`tests/e2e/inicio.spec.ts`:

```ts
import { test, expect } from '@playwright/test';
import { revisarAccesibilidad } from './ayuda';

test('Inicio muestra la ventana y las 8 categorías', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.barra-titulo')).toContainText('Mi Primera Enciclopedia');
  await expect(page.getByRole('navigation', { name: 'Barra de herramientas' })).toBeVisible();
  await expect(page.locator('.mosaico')).toHaveCount(8);
  await expect(page.locator('#dato-curioso')).not.toBeEmpty();
});

test('Acerca de muestra el aviso de homenaje y las licencias', async ({ page }) => {
  await page.goto('/acerca');
  await expect(page.getByText('Homenaje a Mi Primera Encarta (2009). Proyecto no afiliado a Microsoft.')).toBeVisible();
  await expect(page.getByRole('link', { name: 'CC BY-SA 3.0' })).toBeVisible();
});

test('una ruta inexistente muestra la página 404', async ({ page }) => {
  const respuesta = await page.goto('/no-existe');
  expect(respuesta?.status()).toBe(404);
  await expect(page.getByRole('heading', { name: '¡Ups! Esta página se perdió' })).toBeVisible();
});

test('Inicio no tiene problemas graves de accesibilidad', async ({ page }) => {
  await page.goto('/');
  await revisarAccesibilidad(page);
});

test.describe('en celular', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('oculta la barra de título y lleva la barra de herramientas abajo', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.barra-titulo')).toBeHidden();
    const caja = await page.locator('.barra-herramientas').boundingBox();
    expect(caja!.y + caja!.height).toBeGreaterThan(800);
    await expect(page.getByRole('link', { name: 'Buscar' })).toBeVisible();
  });
});
```

- [ ] **Step 9: Correr todas las pruebas**

Run: `npx vitest run && npm run test:e2e`
Expected: todas las pruebas unitarias pasan y las 5 pruebas de Playwright pasan en los proyectos `escritorio` y `tablet`.

Si axe reporta `color-contrast`, oscurece el color afectado en `src/styles/tokens.css` (no desactives la regla).

- [ ] **Step 10: Commit**

```bash
git add scripts/iconos public/iconos public/favicon.svg src/styles src/layouts src/components src/config.ts src/lib/texto.ts src/pages playwright.config.ts tests package.json
git commit -m "feat: ventana nostálgica, inicio, acerca de, 404 y pruebas e2e" -m "Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---
### Task 11: Personaje guía y sonidos

**Files:**
- Create: `src/lib/sonido.ts`, `src/lib/sonido-sitio.ts`, `src/lib/guia.ts`
- Create: `src/components/Guia.astro`, `src/components/BotonSonido.astro`
- Modify: `src/components/Ventana.astro`, `src/layouts/Base.astro`
- Test: `tests/unit/sonido.test.ts`, `tests/unit/guia.test.ts`, `tests/e2e/guia.spec.ts`

**Interfaces:**
- Consumes: `Ventana`, `Base`, `BarraHerramientas` con la ranura `sonido` (Tarea 10); tipo `Pantalla` (Tarea 1); `jsonParaScript` (Tarea 10).
- Produces:
  - `type Efecto = 'clic' | 'acierto' | 'error' | 'fanfarria'`, `CLAVE_PREFERENCIA = 'mpe:sonido'`
  - `crearSonido(op?: { crearContexto?: () => AudioContext | null; almacen?: () => Storage | null }): Sonido` con `Sonido { reproducir(e: Efecto): void; activado(): boolean; alternar(): boolean; desbloquear(): void }`
  - `sonido` (instancia única del sitio) en `src/lib/sonido-sitio.ts`
  - `type Pose = 'saluda' | 'piensa' | 'celebra' | 'sorprende'`, `MENSAJES: Record<Pantalla, string[]>`, `POSES: Record<Pantalla, Pose>`, `elegirMensaje(mensajes, aleatorio?)`, `mensajesPara(pantalla, extras?)`, `esPantalla(valor)`
  - Evento del navegador `mpe:guia` con `detail: { texto: string; pose: Pose }`, que cualquier isla puede despachar en `document` para que hable Lumi
  - `Base.astro` acepta la prop opcional `mensajesGuia?: string[]` (datos curiosos que Lumi puede decir en esa página)

- [ ] **Step 1: Escribir las pruebas unitarias que fallan**

`tests/unit/sonido.test.ts`:

```ts
import { describe, it, expect, vi } from 'vitest';
import { CLAVE_PREFERENCIA, crearSonido } from '../../src/lib/sonido';

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
```

`tests/unit/guia.test.ts`:

```ts
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
```

- [ ] **Step 2: Correr las pruebas y verificar que fallan**

Run: `npx vitest run tests/unit/sonido.test.ts tests/unit/guia.test.ts`
Expected: FAIL, no se pueden resolver los módulos.

- [ ] **Step 3: Implementar `src/lib/sonido.ts` y `src/lib/sonido-sitio.ts`**

`src/lib/sonido.ts`:

```ts
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

export interface OpcionesSonido {
  crearContexto?: () => AudioContext | null;
  almacen?: () => Storage | null;
}

export interface Sonido {
  reproducir(efecto: Efecto): void;
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
  let encendido = (() => {
    try {
      return almacen()?.getItem(CLAVE_PREFERENCIA) !== '0';
    } catch {
      return true;
    }
  })();

  return {
    desbloquear() {
      if (!contexto) contexto = crearContexto();
      if (contexto?.state === 'suspended') contexto.resume().catch(() => {});
    },
    activado: () => encendido,
    alternar() {
      encendido = !encendido;
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
  };
}
```

`src/lib/sonido-sitio.ts`:

```ts
import { crearSonido } from './sonido';

/** Instancia única compartida por todas las páginas e islas. */
export const sonido = crearSonido();
```

- [ ] **Step 4: Implementar `src/lib/guia.ts`**

```ts
import type { Pantalla } from './tipos';

export type Pose = 'saluda' | 'piensa' | 'celebra' | 'sorprende';

export const MENSAJES: Record<Pantalla, string[]> = {
  inicio: ['¡Hola! Soy Lumi. Elige una categoría para empezar a explorar.', 'Toca cualquier mosaico de colores para descubrir cosas nuevas.'],
  categoria: ['Elige un artículo. ¡Cada uno tiene fotos y datos curiosos!'],
  articulo: ['Cuando termines de leer, pon a prueba lo que sabes con un cuestionario.', 'Mira las fotos del panel de multimedia.'],
  buscar: ['Escribe lo que quieras encontrar. No importa si olvidas los acentos.'],
  atlas: ['Haz clic en un país para conocerlo. También puedes acercarte a un continente.'],
  pais: ['Todavía no tengo un artículo de este país, pero aquí tienes algunos datos.'],
  juegos: ['Elige un cuestionario. ¡A ver cuántas estrellas consigues!'],
  cuestionario: ['Lee bien cada pregunta y elige una respuesta.'],
  acerca: ['Este sitio es un homenaje hecho con contenido libre.'],
  '404': ['¡Uy! Me perdí. Volvamos al inicio.'],
};

export const POSES: Record<Pantalla, Pose> = {
  inicio: 'saluda',
  categoria: 'saluda',
  articulo: 'piensa',
  buscar: 'piensa',
  atlas: 'saluda',
  pais: 'piensa',
  juegos: 'celebra',
  cuestionario: 'piensa',
  acerca: 'saluda',
  '404': 'sorprende',
};

export function elegirMensaje(mensajes: string[], aleatorio: () => number = Math.random): string {
  if (!mensajes.length) return '';
  return mensajes[Math.min(mensajes.length - 1, Math.floor(aleatorio() * mensajes.length))];
}

export function mensajesPara(pantalla: Pantalla, extras: string[] = []): string[] {
  return [...MENSAJES[pantalla], ...extras.map((e) => `¿Sabías que…? ${e}`)];
}

export function esPantalla(valor: string | undefined): valor is Pantalla {
  return !!valor && Object.hasOwn(MENSAJES, valor);
}
```

- [ ] **Step 5: Correr las pruebas unitarias y verificar que pasan**

Run: `npx vitest run tests/unit/sonido.test.ts tests/unit/guia.test.ts`
Expected: PASS.

- [ ] **Step 6: Componente `Guia.astro` (Lumi, el búho)**

`src/components/Guia.astro`:

```astro
---
import { SITIO } from '../config';
---
<div class="guia" data-pose="saluda">
  <p id="globo-guia" class="globo" role="status" aria-live="polite"></p>
  <button type="button" class="personaje" aria-label={`${SITIO.personaje}, tu guía: mostrar u ocultar su mensaje`} aria-controls="globo-guia" aria-expanded="true">
    <svg viewBox="0 0 120 124" width="96" height="100" aria-hidden="true">
      <g class="estrellas">
        <path d="M14 18l3 6 6 1-5 4 1 6-5-3-5 3 1-6-5-4 6-1z" fill="#ffc94d" />
        <path d="M104 10l2 5 5 1-4 3 1 5-4-2-4 2 1-5-4-3 5-1z" fill="#ffc94d" />
      </g>
      <text class="interrogacion" x="100" y="30" font-size="26" font-weight="bold" fill="#1f5fbf">?</text>
      <g class="cuerpo">
        <path d="M30 42 L36 16 L48 36 Z" fill="#8a5a2b" />
        <path d="M90 42 L84 16 L72 36 Z" fill="#8a5a2b" />
        <ellipse cx="60" cy="72" rx="38" ry="42" fill="#8a5a2b" />
        <ellipse cx="60" cy="84" rx="24" ry="27" fill="#f3d9a4" />
        <g class="ala ala-izq"><ellipse cx="24" cy="82" rx="10" ry="22" fill="#6e4520" /></g>
        <g class="ala ala-der"><ellipse cx="96" cy="82" rx="10" ry="22" fill="#6e4520" /></g>
        <circle cx="45" cy="54" r="15" fill="#fff" />
        <circle cx="75" cy="54" r="15" fill="#fff" />
        <g class="pupilas">
          <circle cx="45" cy="56" r="7" fill="#1d2733" />
          <circle cx="75" cy="56" r="7" fill="#1d2733" />
        </g>
        <path class="pico" d="M54 66 L60 77 L66 66 Z" fill="#f0a020" />
        <path d="M42 112 l6 7 l6 -7 M66 112 l6 7 l6 -7" stroke="#f0a020" stroke-width="4" fill="none" stroke-linecap="round" />
      </g>
    </svg>
  </button>
</div>

<script>
  import { elegirMensaje, esPantalla, mensajesPara, POSES, type Pose } from '../lib/guia';

  function hablar(texto: string, pose: Pose) {
    const guia = document.querySelector<HTMLElement>('.guia');
    const globo = document.getElementById('globo-guia');
    if (!guia || !globo) return;
    guia.dataset.pose = pose;
    globo.textContent = texto;
  }

  document.addEventListener('astro:page-load', () => {
    // En celular el globo empieza cerrado hasta que el usuario toca a Lumi.
    const boton = document.querySelector<HTMLButtonElement>('.guia .personaje');
    if (boton && !boton.dataset.tocado && matchMedia('(max-width: 767px)').matches) {
      boton.setAttribute('aria-expanded', 'false');
    }
    const pantalla = document.querySelector<HTMLElement>('#contenido')?.dataset.pantalla;
    if (!esPantalla(pantalla)) return;
    const extras = JSON.parse(document.getElementById('guia-extras')?.textContent || '[]') as string[];
    hablar(elegirMensaje(mensajesPara(pantalla, extras)), POSES[pantalla]);
  });

  document.addEventListener('mpe:guia', (e) => {
    const { texto, pose } = (e as CustomEvent<{ texto: string; pose: Pose }>).detail;
    hablar(texto, pose);
  });

  document.addEventListener('click', (e) => {
    const boton = (e.target as Element).closest<HTMLButtonElement>('.guia .personaje');
    if (!boton) return;
    boton.dataset.tocado = '1';
    const abierto = boton.getAttribute('aria-expanded') === 'true';
    boton.setAttribute('aria-expanded', String(!abierto));
  });
</script>

<style>
  .guia {
    position: fixed;
    right: 24px;
    bottom: 24px;
    z-index: 40;
    display: flex;
    align-items: flex-end;
    gap: 0.5rem;
    pointer-events: none;
  }
  .globo,
  .personaje {
    pointer-events: auto;
  }
  .globo {
    max-width: 260px;
    margin: 0 0 3.5rem;
    padding: 0.7rem 0.9rem;
    background: #fff;
    border: 2px solid #1f5fbf;
    border-radius: 16px 16px 4px 16px;
    box-shadow: 0 4px 12px rgb(0 0 0 / 0.2);
    font-size: 0.95rem;
  }
  .globo:empty {
    display: none;
  }
  .personaje {
    border: 0;
    padding: 0;
    background: none;
    cursor: pointer;
  }
  .guia:has(.personaje[aria-expanded='false']) .globo {
    display: none;
  }
  .estrellas,
  .interrogacion {
    display: none;
  }
  .ala {
    transform-box: fill-box;
    transform-origin: top center;
    transition: transform 0.3s ease;
  }
  .pupilas {
    transition: transform 0.3s ease;
  }
  [data-pose='saluda'] .ala-der {
    animation: saludar 0.9s ease-in-out 2;
  }
  [data-pose='piensa'] .pupilas {
    transform: translate(3px, -4px);
  }
  [data-pose='piensa'] .interrogacion {
    display: inline;
  }
  [data-pose='celebra'] .ala-izq {
    transform: rotate(40deg);
  }
  [data-pose='celebra'] .ala-der {
    transform: rotate(-40deg);
  }
  [data-pose='celebra'] .estrellas {
    display: inline;
  }
  [data-pose='celebra'] .cuerpo {
    animation: saltar 0.5s ease-in-out 3;
  }
  [data-pose='sorprende'] .pupilas {
    transform: scale(0.6);
    transform-origin: 60px 56px;
  }
  @keyframes saludar {
    50% {
      transform: rotate(-60deg);
    }
  }
  @keyframes saltar {
    50% {
      transform: translateY(-8px);
    }
  }
  @media (max-width: 767px) {
    .guia {
      right: 8px;
      bottom: 76px;
    }
    .personaje svg {
      width: 56px;
      height: 58px;
    }
    .globo {
      max-width: 200px;
      margin-bottom: 2rem;
    }
  }
</style>
```

- [ ] **Step 7: Componente `BotonSonido.astro`**

```astro
---
import Icono from './Icono.astro';
import { ICONOS } from '../config';
---
<button type="button" class="boton boton-icono boton-sonido" aria-pressed="true" aria-label="Sonido">
  <span class="con-sonido"><Icono codigo={ICONOS.sonido} /></span>
  <span class="sin-sonido"><Icono codigo={ICONOS.silencio} /></span>
</button>

<script>
  import { sonido } from '../lib/sonido-sitio';

  function sincronizar() {
    document.querySelector('.boton-sonido')?.setAttribute('aria-pressed', String(sonido.activado()));
  }
  document.addEventListener('astro:page-load', sincronizar);
  document.addEventListener('click', (e) => {
    if (!(e.target as Element).closest('.boton-sonido')) return;
    sonido.alternar();
    sincronizar();
  });
</script>

<style>
  .boton-sonido[aria-pressed='true'] .sin-sonido,
  .boton-sonido[aria-pressed='false'] .con-sonido {
    display: none;
  }
</style>
```

- [ ] **Step 8: Conectar guía y sonidos a la ventana y al layout**

En `src/components/Ventana.astro`:
1. Agrega a los imports:

```astro
import BotonSonido from './BotonSonido.astro';
import Guia from './Guia.astro';
```

2. Reemplaza `<BarraHerramientas />` por:

```astro
<BarraHerramientas>
  <BotonSonido slot="sonido" />
</BarraHerramientas>
```

3. Justo después de `</main>`, agrega:

```astro
<div transition:persist="guia">
  <Guia />
</div>
```

En `src/layouts/Base.astro`:
1. Agrega a los imports `import { jsonParaScript } from '../lib/texto';`.
2. Cambia la interfaz y la desestructuración de props:

```ts
interface Props {
  titulo: string;
  pantalla: Pantalla;
  descripcion?: string;
  mensajesGuia?: string[];
}
const { titulo, pantalla, descripcion = SITIO.lema, mensajesGuia = [] } = Astro.props;
```

3. Dentro de `<body>`, después de `</Ventana>`, agrega:

```astro
<script type="application/json" id="guia-extras" set:html={jsonParaScript(mensajesGuia)} />
```

4. Al final de `<body>` (antes de `</body>`), agrega el script global de sonidos:

```astro
<script>
  import { sonido } from '../lib/sonido-sitio';

  document.addEventListener('pointerdown', () => sonido.desbloquear());
  document.addEventListener('keydown', () => sonido.desbloquear());
  document.addEventListener('click', (e) => {
    if ((e.target as Element).closest('a, button')) sonido.reproducir('clic');
  });
</script>
```

- [ ] **Step 9: Escribir la prueba de extremo a extremo**

`tests/e2e/guia.spec.ts`:

```ts
import { test, expect } from '@playwright/test';
import { MENSAJES } from '../../src/lib/guia';

test('Lumi habla según la pantalla y persiste al navegar', async ({ page }) => {
  await page.goto('/');
  const globo = page.locator('#globo-guia');
  await expect(globo).not.toBeEmpty();
  expect(MENSAJES.inicio).toContain(await globo.textContent());
  await page.evaluate(() => {
    (window as unknown as { guia: Element | null }).guia = document.querySelector('.guia');
  });
  await page.getByRole('navigation', { name: 'Barra de herramientas' }).getByRole('link', { name: 'Acerca de' }).click();
  await expect(page).toHaveURL(/\/acerca$/);
  await expect(globo).toHaveText(MENSAJES.acerca[0]);
  expect(await page.evaluate(() => (window as unknown as { guia: Element | null }).guia === document.querySelector('.guia'))).toBe(true);
});

test('el botón de sonido recuerda la preferencia', async ({ page }) => {
  await page.goto('/');
  const boton = page.getByRole('button', { name: 'Sonido' });
  await expect(boton).toHaveAttribute('aria-pressed', 'true');
  await boton.click();
  await expect(boton).toHaveAttribute('aria-pressed', 'false');
  await page.reload();
  await expect(page.getByRole('button', { name: 'Sonido' })).toHaveAttribute('aria-pressed', 'false');
});
```

- [ ] **Step 10: Correr todas las pruebas**

Run: `npx vitest run && npm run test:e2e`
Expected: todo pasa (incluidas las pruebas de la Tarea 10).

- [ ] **Step 11: Commit**

```bash
git add src/lib/sonido.ts src/lib/sonido-sitio.ts src/lib/guia.ts src/components src/layouts tests
git commit -m "feat: Lumi, el personaje guía, y sonidos sintetizados" -m "Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---
### Task 12: Páginas de categoría y de artículo

**Files:**
- Create: `src/lib/articulos.ts`, `src/lib/medios.ts`
- Create: `src/components/TarjetaArticulo.astro`, `src/components/Bloques.astro`, `src/components/PanelMultimedia.astro`, `src/components/Atribucion.astro`
- Create: `src/pages/categoria/[slug].astro`, `src/pages/articulo/[slug].astro`
- Modify: `src/layouts/Base.astro` (respaldo de imágenes)
- Test: `tests/unit/articulos.test.ts`, `tests/e2e/articulo.spec.ts`

**Interfaces:**
- Consumes: colecciones (Tarea 9), `Base`, `Icono` (Tarea 10), `mensajesGuia` (Tarea 11), `categoriaPorSlug` (Tarea 1).
- Produces:
  - `ordenarPorTitulo<T extends { titulo: string }>(lista: T[]): T[]`, `deCategoria(articulos: Articulo[], categoria: string): Articulo[]`, `textoLicencia(l: Licencia): string`
  - `imagenDe(archivo: string): ImageMetadata | undefined` (imágenes de `src/assets/medios/`), `urlPublica(archivo: string): string` (`/medios/<archivo>`)
  - Rutas `/categoria/[slug]` y `/articulo/[slug]`
  - Atributo `data-respaldo` en las imágenes: si una imagen no carga, se reemplaza por ese ícono
  - Clases usadas por las pruebas: `.tarjeta` (con `.titulo`), `.texto-articulo`, `.principal`, `.relacionados`, `.atribucion`, `.prueba` (botón del cuestionario)

- [ ] **Step 1: Escribir la prueba unitaria que falla**

`tests/unit/articulos.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { deCategoria, ordenarPorTitulo, textoLicencia } from '../../src/lib/articulos';
import type { Articulo } from '../../src/lib/tipos';

const art = (slug: string, titulo: string, categoria: Articulo['categoria']): Articulo => ({
  slug,
  titulo,
  categoria,
  resumen: '',
  bloques: [],
  medios: [],
  relacionados: [],
  fuente: { url: 'https://x', historialUrl: 'https://x', revid: 1, fecha: '2026-10-14' },
});

describe('articulos', () => {
  it('ordena por título en español', () => {
    expect(ordenarPorTitulo([{ titulo: 'Zorro' }, { titulo: 'oso' }, { titulo: 'Águila' }]).map((x) => x.titulo)).toEqual([
      'Águila',
      'oso',
      'Zorro',
    ]);
  });

  it('filtra por categoría y ordena', () => {
    const r = deCategoria([art('tigre', 'Tigre', 'animales'), art('sol', 'Sol', 'espacio'), art('aguila', 'Águila', 'animales')], 'animales');
    expect(r.map((a) => a.slug)).toEqual(['aguila', 'tigre']);
  });

  it('muestra el nombre de cada licencia', () => {
    expect(textoLicencia('dominio-publico')).toBe('Dominio público');
    expect(textoLicencia('cc0')).toBe('CC0');
    expect(textoLicencia('cc-by')).toBe('CC BY');
    expect(textoLicencia('cc-by-sa')).toBe('CC BY-SA');
  });
});
```

- [ ] **Step 2: Correr la prueba y verificar que falla**

Run: `npx vitest run tests/unit/articulos.test.ts`
Expected: FAIL, no se puede resolver `../../src/lib/articulos`.

- [ ] **Step 3: Implementar `src/lib/articulos.ts` y `src/lib/medios.ts`**

`src/lib/articulos.ts`:

```ts
import type { Articulo, Licencia } from './tipos';

export function ordenarPorTitulo<T extends { titulo: string }>(lista: T[]): T[] {
  return [...lista].sort((a, b) => a.titulo.localeCompare(b.titulo, 'es'));
}

export function deCategoria(articulos: Articulo[], categoria: string): Articulo[] {
  return ordenarPorTitulo(articulos.filter((a) => a.categoria === categoria));
}

const NOMBRES_LICENCIA: Record<Licencia, string> = {
  'dominio-publico': 'Dominio público',
  cc0: 'CC0',
  'cc-by': 'CC BY',
  'cc-by-sa': 'CC BY-SA',
};

export function textoLicencia(licencia: Licencia): string {
  return NOMBRES_LICENCIA[licencia];
}
```

`src/lib/medios.ts`:

```ts
import type { ImageMetadata } from 'astro';

const imagenes = import.meta.glob<{ default: ImageMetadata }>('/src/assets/medios/*.{jpg,png,gif,webp}', {
  eager: true,
});

/** Imagen importada (optimizable con <Image />) a partir del nombre del archivo local. */
export function imagenDe(archivo: string): ImageMetadata | undefined {
  return imagenes[`/src/assets/medios/${archivo}`]?.default;
}

/** URL de un audio o video servido desde public/medios/. */
export function urlPublica(archivo: string): string {
  return `/medios/${encodeURIComponent(archivo)}`;
}
```

- [ ] **Step 4: Correr la prueba y verificar que pasa**

Run: `npx vitest run tests/unit/articulos.test.ts`
Expected: PASS (3 pruebas).

- [ ] **Step 5: Componentes de artículo**

`src/components/TarjetaArticulo.astro`:

```astro
---
import { Image } from 'astro:assets';
import Icono from './Icono.astro';
import { categoriaPorSlug } from '../config';
import { imagenDe } from '../lib/medios';
import type { Articulo } from '../lib/tipos';

interface Props {
  articulo: Articulo;
}
const { articulo } = Astro.props;
const categoria = categoriaPorSlug(articulo.categoria)!;
const imagen = articulo.principal ? imagenDe(articulo.principal.archivo) : undefined;
---
<a class="tarjeta" href={`/articulo/${articulo.slug}`}>
  {
    imagen ? (
      <Image src={imagen} alt="" width={320} class="miniatura" data-respaldo={`/iconos/${categoria.icono}.svg`} />
    ) : (
      <span class="miniatura vacia">
        <Icono codigo={categoria.icono} tam={64} />
      </span>
    )
  }
  <span class="titulo">{articulo.titulo}</span>
  <span class="resumen">{articulo.resumen}</span>
</a>

<style>
  .tarjeta {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: #fff;
    border: 1px solid #c9d8ec;
    border-radius: var(--radio);
    overflow: hidden;
    color: var(--texto);
    text-decoration: none;
    box-shadow: 0 2px 6px rgb(0 40 100 / 0.1);
    transition: transform 0.15s ease;
  }
  .tarjeta:hover {
    transform: translateY(-3px);
  }
  .miniatura {
    width: 100%;
    aspect-ratio: 4 / 3;
    object-fit: cover;
    background: #e8f0fb;
  }
  .vacia {
    display: grid;
    place-items: center;
  }
  .titulo {
    padding: 0.6rem 0.8rem 0.2rem;
    font-family: var(--fuente-titulos);
    font-size: 1.2rem;
    font-weight: 700;
    color: #1f5fbf;
  }
  .resumen {
    padding: 0 0.8rem 0.8rem;
    font-size: 0.9rem;
    color: var(--texto-suave);
  }
</style>
```

`src/components/Bloques.astro`:

```astro
---
import { Image } from 'astro:assets';
import { imagenDe } from '../lib/medios';
import type { Bloque, Medio } from '../lib/tipos';

interface Props {
  bloques: Bloque[];
  medios: Medio[];
  respaldo: string;
}
const { bloques, medios, respaldo } = Astro.props;
const partes = bloques.map((b) =>
  b.tipo === 'html'
    ? { tipo: 'html' as const, html: b.html }
    : {
        tipo: 'figura' as const,
        imagen: imagenDe(b.archivo),
        pie: b.pie,
        alt: b.pie || medios.find((m) => m.archivo === b.archivo)?.alt || '',
      },
);
---
<div class="texto-articulo">
  {
    partes.map((p) =>
      p.tipo === 'html' ? (
        <Fragment set:html={p.html} />
      ) : p.imagen ? (
        <figure class="figura">
          <Image src={p.imagen} alt={p.alt} width={480} data-respaldo={respaldo} />
          {p.pie && <figcaption>{p.pie}</figcaption>}
        </figure>
      ) : null,
    )
  }
</div>

<style>
  .texto-articulo :global(p),
  .texto-articulo :global(li) {
    font-size: 1.05rem;
  }
  .texto-articulo :global(h2) {
    margin-top: 1.5rem;
    color: #1f5fbf;
  }
  .figura {
    margin: 1rem 0;
    padding: 0.5rem;
    background: #fff;
    border: 1px solid #c9d8ec;
    border-radius: var(--radio);
    max-width: 500px;
  }
  .figura figcaption {
    font-size: 0.9rem;
    color: var(--texto-suave);
  }
</style>
```

`src/components/PanelMultimedia.astro`:

```astro
---
import { Image } from 'astro:assets';
import { imagenDe, urlPublica } from '../lib/medios';
import type { Medio } from '../lib/tipos';

interface Props {
  medios: Medio[];
  respaldo: string;
}
const { medios, respaldo } = Astro.props;
const imagenes = medios.flatMap((m) => {
  const imagen = m.tipo === 'imagen' ? imagenDe(m.archivo) : undefined;
  return imagen ? [{ medio: m, imagen }] : [];
});
const sonidos = medios.filter((m) => m.tipo === 'audio');
const videos = medios.filter((m) => m.tipo === 'video');
const hayAlgo = imagenes.length > 1 || sonidos.length > 0 || videos.length > 0;
---
{
  hayAlgo && (
    <section class="multimedia panel" aria-labelledby="titulo-multimedia">
      <h2 id="titulo-multimedia">Multimedia</h2>
      {imagenes.length > 1 && (
        <ul class="galeria">
          {imagenes.map(({ medio, imagen }) => (
            <li>
              <Image src={imagen} alt={medio.alt} width={200} data-respaldo={respaldo} />
            </li>
          ))}
        </ul>
      )}
      {sonidos.map((m) => (
        <figure class="reproductor">
          <audio controls preload="none" src={urlPublica(m.archivo)} />
          <figcaption>{m.alt}</figcaption>
        </figure>
      ))}
      {videos.map((m) => (
        <figure class="reproductor">
          <video controls preload="metadata" src={urlPublica(m.archivo)} width="320" />
          <figcaption>{m.alt}</figcaption>
        </figure>
      ))}
    </section>
  )
}

<style>
  .galeria {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.5rem;
  }
  .galeria :global(img) {
    width: 100%;
    aspect-ratio: 1;
    object-fit: cover;
    border-radius: 8px;
  }
  .reproductor {
    margin: 0.8rem 0 0;
  }
  .reproductor audio,
  .reproductor video {
    width: 100%;
  }
  .reproductor figcaption {
    font-size: 0.85rem;
    color: var(--texto-suave);
  }
</style>
```

`src/components/Atribucion.astro`:

```astro
---
import { textoLicencia } from '../lib/articulos';
import type { Articulo, Medio } from '../lib/tipos';

interface Props {
  titulo: string;
  fuente: Articulo['fuente'];
  medios: Medio[];
}
const { titulo, fuente, medios } = Astro.props;
---
<footer class="atribucion">
  <p>Basado en «<a href={fuente.url}>{titulo}</a>» de Vikidia, <a href="https://creativecommons.org/licenses/by-sa/3.0/deed.es">CC BY-SA 3.0</a>, con modificaciones. <a href={fuente.historialUrl}>Ver los autores del texto</a>.</p>
  {
    medios.length > 0 && (
      <details>
        <summary>Créditos de imágenes y sonidos</summary>
        <ul>
          {medios.map((m) => (
            <li><a href={m.fuenteUrl}>{m.alt || m.archivo}</a>: {m.autor}, {textoLicencia(m.licencia)}{m.licenciaUrl ? <> (<a href={m.licenciaUrl}>licencia</a>)</> : null}</li>
          ))}
        </ul>
      </details>
    )
  }
</footer>

<style>
  .atribucion {
    margin-top: 2rem;
    padding-top: 1rem;
    border-top: 1px solid #c9d8ec;
    font-size: 0.85rem;
    color: var(--texto-suave);
  }
</style>
```

- [ ] **Step 6: Páginas de categoría y artículo**

`src/pages/categoria/[slug].astro`:

```astro
---
import { getCollection } from 'astro:content';
import Base from '../../layouts/Base.astro';
import Icono from '../../components/Icono.astro';
import TarjetaArticulo from '../../components/TarjetaArticulo.astro';
import { CATEGORIAS } from '../../config';
import { deCategoria } from '../../lib/articulos';
import type { Articulo } from '../../lib/tipos';

export async function getStaticPaths() {
  const articulos = (await getCollection('articulos')).map((e) => e.data as Articulo);
  return CATEGORIAS.map((categoria) => ({
    params: { slug: categoria.slug },
    props: { categoria, articulos: deCategoria(articulos, categoria.slug) },
  }));
}

const { categoria, articulos } = Astro.props;
---
<Base titulo={categoria.nombre} pantalla="categoria">
  <header class="encabezado" style={`--color: var(--cat-${categoria.slug})`}>
    <Icono codigo={categoria.icono} tam={56} />
    <h1>{categoria.nombre}</h1>
  </header>
  {
    articulos.length ? (
      <ul class="tarjetas">
        {articulos.map((a) => (
          <li>
            <TarjetaArticulo articulo={a} />
          </li>
        ))}
      </ul>
    ) : (
      <p>Todavía no hay artículos en esta categoría.</p>
    )
  }
</Base>

<style>
  .encabezado {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    margin-bottom: 1.2rem;
    padding: 0.6rem 1rem;
    border-radius: var(--radio);
    color: #fff;
    background: var(--brillo), var(--color);
  }
  .encabezado h1 {
    margin: 0;
  }
  .tarjetas {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 1rem;
  }
</style>
```

`src/pages/articulo/[slug].astro`:

```astro
---
import { getCollection } from 'astro:content';
import { Image } from 'astro:assets';
import Base from '../../layouts/Base.astro';
import Atribucion from '../../components/Atribucion.astro';
import Bloques from '../../components/Bloques.astro';
import PanelMultimedia from '../../components/PanelMultimedia.astro';
import { categoriaPorSlug } from '../../config';
import { imagenDe } from '../../lib/medios';
import type { Articulo, Cuestionario } from '../../lib/tipos';

export async function getStaticPaths() {
  const articulos = (await getCollection('articulos')).map((e) => e.data as Articulo);
  const cuestionarios = (await getCollection('cuestionarios')).map((e) => e.data as Cuestionario);
  const porSlug = new Map(articulos.map((a) => [a.slug, a]));
  return articulos.map((articulo) => ({
    params: { slug: articulo.slug },
    props: {
      articulo,
      relacionados: articulo.relacionados.flatMap((s) => {
        const r = porSlug.get(s);
        return r ? [{ slug: r.slug, titulo: r.titulo }] : [];
      }),
      cuestionario: cuestionarios.find((c) => c.categoria === articulo.categoria)?.slug,
      datos: cuestionarios.flatMap((c) => c.preguntas).filter((p) => p.articulo === articulo.slug).map((p) => p.explicacion),
    },
  }));
}

const { articulo, relacionados, cuestionario, datos } = Astro.props;
const categoria = categoriaPorSlug(articulo.categoria)!;
const respaldo = `/iconos/${categoria.icono}.svg`;
const principal = articulo.principal ? imagenDe(articulo.principal.archivo) : undefined;
---
<Base titulo={articulo.titulo} pantalla="articulo" descripcion={articulo.resumen} mensajesGuia={datos}>
  <article class="articulo">
    <p class="miga"><a href={`/categoria/${categoria.slug}`}>{categoria.nombre}</a></p>
    <h1>{articulo.titulo}</h1>
    <div class="cuerpo">
      <div class="lectura">
        {
          principal && articulo.principal && (
            <figure class="principal">
              <Image src={principal} alt={articulo.principal.alt} width={560} loading="eager" data-respaldo={respaldo} />
            </figure>
          )
        }
        <Bloques bloques={articulo.bloques} medios={articulo.medios} respaldo={respaldo} />
        {cuestionario && <a class="boton boton-grande prueba" href={`/juegos/cuestionario/${cuestionario}`}>¡Pon a prueba lo que sabes!</a>}
      </div>
      <aside class="lateral">
        <PanelMultimedia medios={articulo.medios} respaldo={respaldo} />
        {
          relacionados.length > 0 && (
            <section class="panel relacionados">
              <h2>Artículos relacionados</h2>
              <ul>
                {relacionados.map((r) => (
                  <li>
                    <a href={`/articulo/${r.slug}`}>{r.titulo}</a>
                  </li>
                ))}
              </ul>
            </section>
          )
        }
      </aside>
    </div>
    <Atribucion titulo={articulo.titulo} fuente={articulo.fuente} medios={articulo.medios} />
  </article>
</Base>

<style>
  .miga {
    margin: 0 0 0.3rem;
    font-weight: bold;
  }
  .articulo h1 {
    font-size: 2.4rem;
    color: #1f5fbf;
  }
  .cuerpo {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 300px;
    gap: 1.5rem;
    align-items: start;
  }
  .principal {
    margin: 0 0 1rem;
  }
  .principal :global(img) {
    border-radius: var(--radio);
    box-shadow: 0 3px 10px rgb(0 0 0 / 0.2);
  }
  .lateral {
    display: grid;
    gap: 1rem;
  }
  .prueba {
    margin-top: 1.5rem;
  }
  @media (max-width: 1179px) {
    .cuerpo {
      grid-template-columns: 1fr;
    }
  }
</style>
```

- [ ] **Step 7: Respaldo de imágenes en el layout**

En `src/layouts/Base.astro`, dentro del `<script>` global de sonidos (al final de `<body>`), agrega:

```ts
document.addEventListener(
  'error',
  (e) => {
    const img = e.target;
    if (!(img instanceof HTMLImageElement) || !img.dataset.respaldo || img.dataset.fallo) return;
    img.dataset.fallo = '1';
    img.src = img.dataset.respaldo;
  },
  true,
);
```

- [ ] **Step 8: Escribir las pruebas de extremo a extremo**

`tests/e2e/articulo.spec.ts`:

```ts
import { test, expect } from '@playwright/test';
import { revisarAccesibilidad } from './ayuda';

test('de Inicio a una categoría y a un artículo sin recargar la ventana', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    (window as unknown as { barra: Element | null }).barra = document.querySelector('.barra-herramientas');
  });
  await page.locator('.mosaico', { hasText: 'Animales' }).click();
  await expect(page).toHaveURL(/\/categoria\/animales$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Animales' })).toBeVisible();

  const primera = page.locator('.tarjeta').first();
  const titulo = (await primera.locator('.titulo').textContent())!.trim();
  await primera.click();
  await expect(page.getByRole('heading', { level: 1, name: titulo })).toBeVisible();
  await expect(page.locator('.atribucion')).toContainText('de Vikidia');
  await expect(page.locator('.atribucion')).toContainText('CC BY-SA 3.0');
  expect(
    await page.evaluate(() => (window as unknown as { barra: Element | null }).barra === document.querySelector('.barra-herramientas')),
  ).toBe(true);

  await page.getByRole('button', { name: 'Atrás' }).click();
  await expect(page).toHaveURL(/\/categoria\/animales$/);
});

test('el artículo de México muestra texto, imagen principal y relacionados', async ({ page }) => {
  await page.goto('/articulo/mexico');
  await expect(page.locator('.texto-articulo p').first()).not.toBeEmpty();
  await expect(page.locator('.principal img')).toBeVisible();
  await expect(page.locator('.relacionados li').first()).toBeVisible();
});

test('el artículo no tiene problemas graves de accesibilidad', async ({ page }) => {
  await page.goto('/articulo/mexico');
  await revisarAccesibilidad(page);
});
```

- [ ] **Step 9: Correr todas las pruebas**

Run: `npx vitest run && npm run test:e2e`
Expected: todo pasa.

- [ ] **Step 10: Commit**

```bash
git add src/lib/articulos.ts src/lib/medios.ts src/components src/pages src/layouts/Base.astro tests
git commit -m "feat: páginas de categoría y de artículo con multimedia y atribuciones" -m "Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---
### Task 13: Búsqueda con autocompletado

**Files:**
- Create: `src/lib/busqueda.ts`, `src/lib/indice-cliente.ts`
- Create: `src/pages/indice-busqueda.json.ts`, `src/pages/buscar.astro`
- Create: `src/components/Buscador.tsx`, `src/components/ResultadosBusqueda.tsx`
- Modify: `src/components/Ventana.astro` (buscador en la barra)
- Test: `tests/unit/busqueda.test.ts`, `tests/e2e/busqueda.spec.ts`

**Interfaces:**
- Consumes: `normalizar` (Tarea 1), `textoPlano` (Tarea 3), colecciones (Tarea 9), `Base`, `Ventana`, ranura `buscador` (Tarea 10), evento `mpe:guia` (Tarea 11).
- Produces:
  - `interface DocBusqueda { slug; titulo; resumen; texto; categoria }`, `interface ResultadoBusqueda { slug; titulo; resumen; categoria }`, `interface Fragmento { texto: string; marcado: boolean }`
  - `OPCIONES_BUSQUEDA`, `LONGITUD_MAXIMA_CONSULTA = 200`
  - `documentoDe(a: Articulo): DocBusqueda`, `crearIndice(docs): MiniSearch<DocBusqueda>`, `cargarIndice(json: string): MiniSearch<DocBusqueda>`
  - `sugerir(indice, consulta, max = 8): ResultadoBusqueda[]` (solo títulos, por prefijo)
  - `buscar(indice, consulta): ResultadoBusqueda[]` (prefijo + tolerancia 0,2; pesos título ×3, resumen ×2)
  - `resaltar(texto: string, consulta: string): Fragmento[]`
  - `obtenerIndice(): Promise<MiniSearch<DocBusqueda>>` (descarga `/indice-busqueda.json` una sola vez)
  - Ruta estática `/indice-busqueda.json` y página `/buscar?q=…`

- [ ] **Step 1: Escribir la prueba unitaria que falla**

`tests/unit/busqueda.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { buscar, cargarIndice, crearIndice, documentoDe, resaltar, sugerir, type DocBusqueda } from '../../src/lib/busqueda';
import type { Articulo } from '../../src/lib/tipos';

const docs: DocBusqueda[] = [
  { slug: 'arbol', titulo: 'Árbol', resumen: 'Planta grande con tronco.', texto: 'Tiene hojas y raíces.', categoria: 'planeta-tierra' },
  { slug: 'leon', titulo: 'León', resumen: 'Felino grande de África.', texto: 'El león es el rey de la sabana.', categoria: 'animales' },
  { slug: 'leopardo', titulo: 'Leopardo', resumen: 'Felino con manchas.', texto: 'El leopardo trepa árboles.', categoria: 'animales' },
  { slug: 'nino', titulo: 'Niño', resumen: 'Persona pequeña.', texto: 'Los niños juegan.', categoria: 'cuerpo-humano' },
];
const indice = crearIndice(docs);

describe('sugerir', () => {
  it('sugiere títulos por prefijo, sin importar acentos', () => {
    const titulos = sugerir(indice, 'leo').map((r) => r.titulo);
    expect(titulos).toContain('León');
    expect(titulos).toContain('Leopardo');
    expect(sugerir(indice, 'arb').map((r) => r.titulo)).toEqual(['Árbol']);
  });

  it('respeta el máximo de sugerencias', () => {
    expect(sugerir(indice, 'l', 1)).toHaveLength(1);
  });
});

describe('buscar', () => {
  it('encuentra sin acentos y prioriza el título', () => {
    expect(buscar(indice, 'arbol')[0].slug).toBe('arbol');
    expect(buscar(indice, 'NIÑO')[0].slug).toBe('nino');
  });

  it('tolera errores de escritura', () => {
    expect(buscar(indice, 'lein').map((r) => r.slug)).toContain('leon');
  });

  it('no falla con consultas vacías, de solo signos o muy largas', () => {
    expect(buscar(indice, '')).toEqual([]);
    expect(buscar(indice, '   ')).toEqual([]);
    expect(buscar(indice, '¿?!')).toEqual([]);
    expect(sugerir(indice, '  ')).toEqual([]);
    expect(() => buscar(indice, 'a'.repeat(500))).not.toThrow();
    expect(() => buscar(indice, 'león '.repeat(100))).not.toThrow();
  });

  it('funciona igual con el índice serializado', () => {
    const copia = cargarIndice(JSON.stringify(indice));
    expect(buscar(copia, 'arbol')[0].slug).toBe('arbol');
  });
});

describe('resaltar', () => {
  it('marca el término respetando el texto original', () => {
    expect(resaltar('El León come', 'leon')).toEqual([
      { texto: 'El ', marcado: false },
      { texto: 'León', marcado: true },
      { texto: ' come', marcado: false },
    ]);
    expect(resaltar('Árbol', 'ARBOL')).toEqual([{ texto: 'Árbol', marcado: true }]);
  });

  it('no marca nada si la consulta no tiene términos', () => {
    expect(resaltar('texto', '  ')).toEqual([{ texto: 'texto', marcado: false }]);
    expect(resaltar('', 'x')).toEqual([]);
  });
});

describe('documentoDe', () => {
  it('extrae el texto plano de los bloques HTML', () => {
    const a: Articulo = {
      slug: 'sol',
      titulo: 'Sol',
      categoria: 'espacio',
      resumen: 'La estrella.',
      bloques: [{ tipo: 'html', html: '<p>Es una <b>estrella</b>.</p>' }, { tipo: 'figura', archivo: 'x.jpg', pie: 'Foto' }],
      medios: [],
      relacionados: [],
      fuente: { url: 'https://x', historialUrl: 'https://x', revid: 1, fecha: '2026-10-14' },
    };
    expect(documentoDe(a)).toEqual({ slug: 'sol', titulo: 'Sol', resumen: 'La estrella.', texto: 'Es una estrella.', categoria: 'espacio' });
  });
});
```

- [ ] **Step 2: Correr la prueba y verificar que falla**

Run: `npx vitest run tests/unit/busqueda.test.ts`
Expected: FAIL, no se puede resolver `../../src/lib/busqueda`.

- [ ] **Step 3: Implementar `src/lib/busqueda.ts`**

```ts
import MiniSearch, { type SearchResult } from 'minisearch';
import { normalizar } from './normalizar';
import { textoPlano } from './texto';
import type { Articulo } from './tipos';

export interface DocBusqueda {
  slug: string;
  titulo: string;
  resumen: string;
  texto: string;
  categoria: string;
}

export interface ResultadoBusqueda {
  slug: string;
  titulo: string;
  resumen: string;
  categoria: string;
}

export interface Fragmento {
  texto: string;
  marcado: boolean;
}

export const LONGITUD_MAXIMA_CONSULTA = 200;

export const OPCIONES_BUSQUEDA = {
  idField: 'slug',
  fields: ['titulo', 'resumen', 'texto'],
  storeFields: ['slug', 'titulo', 'resumen', 'categoria'],
  processTerm: (termino: string) => normalizar(termino) || null,
};

export function documentoDe(a: Articulo): DocBusqueda {
  const html = a.bloques.flatMap((b) => (b.tipo === 'html' ? [b.html] : [])).join(' ');
  return { slug: a.slug, titulo: a.titulo, resumen: a.resumen, texto: textoPlano(html), categoria: a.categoria };
}

export function crearIndice(docs: DocBusqueda[]): MiniSearch<DocBusqueda> {
  const indice = new MiniSearch<DocBusqueda>(OPCIONES_BUSQUEDA);
  indice.addAll(docs);
  return indice;
}

export function cargarIndice(json: string): MiniSearch<DocBusqueda> {
  return MiniSearch.loadJSON<DocBusqueda>(json, OPCIONES_BUSQUEDA);
}

const tieneTexto = (consulta: string) => /[\p{L}\p{N}]/u.test(consulta);

const aResultado = (r: SearchResult): ResultadoBusqueda => ({
  slug: r.slug,
  titulo: r.titulo,
  resumen: r.resumen,
  categoria: r.categoria,
});

export function sugerir(indice: MiniSearch<DocBusqueda>, consulta: string, max = 8): ResultadoBusqueda[] {
  if (!tieneTexto(consulta)) return [];
  return indice
    .search(consulta.slice(0, LONGITUD_MAXIMA_CONSULTA), { fields: ['titulo'], prefix: true, combineWith: 'AND' })
    .slice(0, max)
    .map(aResultado);
}

export function buscar(indice: MiniSearch<DocBusqueda>, consulta: string): ResultadoBusqueda[] {
  if (!tieneTexto(consulta)) return [];
  return indice
    .search(consulta.slice(0, LONGITUD_MAXIMA_CONSULTA), {
      prefix: true,
      fuzzy: 0.2,
      boost: { titulo: 3, resumen: 2 },
      combineWith: 'AND',
    })
    .map(aResultado);
}

/** Divide `texto` en fragmentos marcando las apariciones de los términos de `consulta` (sin acentos ni mayúsculas). */
export function resaltar(texto: string, consulta: string): Fragmento[] {
  if (!texto) return [];
  const terminos = normalizar(consulta)
    .split(/[^\p{L}\p{N}]+/u)
    .filter((t) => t.length >= 2);
  if (!terminos.length) return [{ texto, marcado: false }];

  let normalizado = '';
  const origen: number[] = [];
  for (let i = 0; i < texto.length; ) {
    const caracter = String.fromCodePoint(texto.codePointAt(i)!);
    const n = normalizar(caracter);
    for (let k = 0; k < n.length; k++) {
      normalizado += n[k];
      origen.push(i);
    }
    i += caracter.length;
  }
  origen.push(texto.length);

  const marcas = new Array<boolean>(texto.length).fill(false);
  for (const t of terminos) {
    for (let pos = normalizado.indexOf(t); pos !== -1; pos = normalizado.indexOf(t, pos + t.length)) {
      for (let k = origen[pos]; k < origen[pos + t.length]; k++) marcas[k] = true;
    }
  }

  const fragmentos: Fragmento[] = [];
  for (let i = 0; i < texto.length; i++) {
    const ultimo = fragmentos[fragmentos.length - 1];
    if (ultimo && ultimo.marcado === marcas[i]) ultimo.texto += texto[i];
    else fragmentos.push({ texto: texto[i], marcado: marcas[i] });
  }
  return fragmentos;
}
```

- [ ] **Step 4: Correr la prueba y verificar que pasa**

Run: `npx vitest run tests/unit/busqueda.test.ts`
Expected: PASS.

- [ ] **Step 5: Índice estático y cargador del cliente**

`src/pages/indice-busqueda.json.ts`:

```ts
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { crearIndice, documentoDe } from '../lib/busqueda';
import type { Articulo } from '../lib/tipos';

export const GET: APIRoute = async () => {
  const articulos = (await getCollection('articulos')).map((e) => e.data as Articulo);
  return new Response(JSON.stringify(crearIndice(articulos.map(documentoDe))), {
    headers: { 'Content-Type': 'application/json' },
  });
};
```

`src/lib/indice-cliente.ts`:

```ts
import type MiniSearch from 'minisearch';
import { cargarIndice, type DocBusqueda } from './busqueda';

let promesa: Promise<MiniSearch<DocBusqueda>> | null = null;

/** Descarga el índice una sola vez y lo comparte entre islas; si falla, permite reintentar. */
export function obtenerIndice(): Promise<MiniSearch<DocBusqueda>> {
  if (!promesa) {
    promesa = fetch('/indice-busqueda.json')
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.text();
      })
      .then(cargarIndice);
    promesa.catch(() => {
      promesa = null;
    });
  }
  return promesa;
}
```

- [ ] **Step 6: Isla `Buscador.tsx`**

```tsx
import { useEffect, useId, useState } from 'preact/hooks';
import { navigate } from 'astro:transitions/client';
import { sugerir, type ResultadoBusqueda } from '../lib/busqueda';
import { obtenerIndice } from '../lib/indice-cliente';

interface Props {
  variante?: 'barra' | 'grande';
}

export default function Buscador({ variante = 'barra' }: Props) {
  const id = useId();
  const [consulta, setConsulta] = useState('');
  const [sugerencias, setSugerencias] = useState<ResultadoBusqueda[]>([]);
  const [activa, setActiva] = useState(-1);
  const [abierto, setAbierto] = useState(false);
  const [estado, setEstado] = useState<'inactivo' | 'cargando' | 'listo' | 'error'>('inactivo');

  useEffect(() => {
    if (variante === 'grande') setConsulta(new URLSearchParams(location.search).get('q') ?? '');
  }, []);

  useEffect(() => {
    if (estado !== 'listo') return;
    let vigente = true;
    obtenerIndice().then((indice) => {
      if (!vigente) return;
      setSugerencias(sugerir(indice, consulta));
      setActiva(-1);
    });
    return () => {
      vigente = false;
    };
  }, [consulta, estado]);

  async function prepararIndice() {
    if (estado === 'listo' || estado === 'cargando') return;
    setEstado('cargando');
    try {
      await obtenerIndice();
      setEstado('listo');
    } catch {
      setEstado('error');
    }
  }

  function ir(destino: string) {
    setAbierto(false);
    setActiva(-1);
    navigate(destino);
  }

  function alEnviar(e: Event) {
    e.preventDefault();
    const elegida = sugerencias[activa];
    if (elegida) ir(`/articulo/${elegida.slug}`);
    else if (consulta.trim()) ir(`/buscar?q=${encodeURIComponent(consulta.trim())}`);
  }

  function alTeclear(e: KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setAbierto(true);
      setActiva((a) => Math.min(a + 1, sugerencias.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiva((a) => Math.max(a - 1, -1));
    } else if (e.key === 'Escape') {
      setAbierto(false);
      setActiva(-1);
    }
  }

  const listaId = `${id}-lista`;
  const mostrarLista = abierto && consulta.trim() !== '' && sugerencias.length > 0;
  const deshabilitado = estado === 'error';

  return (
    <form class={`buscador buscador-${variante}`} role="search" onSubmit={alEnviar}>
      <label class="visualmente-oculto" for={`${id}-campo`}>
        Buscar en la enciclopedia
      </label>
      <input
        id={`${id}-campo`}
        type="search"
        role="combobox"
        aria-expanded={mostrarLista}
        aria-controls={listaId}
        aria-autocomplete="list"
        aria-activedescendant={activa >= 0 ? `${id}-op-${activa}` : undefined}
        placeholder="Buscar…"
        autocomplete="off"
        maxLength={200}
        value={consulta}
        disabled={deshabilitado}
        onFocus={() => {
          prepararIndice();
          setAbierto(true);
        }}
        onInput={(e) => {
          setConsulta((e.target as HTMLInputElement).value);
          setAbierto(true);
        }}
        onKeyDown={alTeclear}
        onBlur={() => setTimeout(() => setAbierto(false), 150)}
      />
      <button type="submit" class="boton boton-icono" aria-label="Buscar" disabled={deshabilitado}>
        <img src="/iconos/1F50D.svg" width={20} height={20} alt="" />
      </button>
      {deshabilitado && (
        <p class="aviso" role="status">
          La búsqueda no está disponible ahora
        </p>
      )}
      <ul id={listaId} role="listbox" aria-label="Sugerencias" class="sugerencias" hidden={!mostrarLista}>
        {sugerencias.map((s, i) => (
          <li
            id={`${id}-op-${i}`}
            role="option"
            aria-selected={i === activa}
            class={i === activa ? 'activa' : undefined}
            onMouseDown={(e) => {
              e.preventDefault();
              ir(`/articulo/${s.slug}`);
            }}
          >
            {s.titulo}
          </li>
        ))}
      </ul>
    </form>
  );
}
```

Estilos del buscador: agrega al final de `src/styles/global.css` (las islas de Preact no tienen estilos con alcance propio):

```css
.buscador {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

.buscador input {
  width: 220px;
  padding: 0.4rem 0.8rem;
  border: 1px solid var(--boton-borde);
  border-radius: 999px;
  font: inherit;
  background: #fff;
}

.buscador-grande input {
  width: min(100%, 480px);
  font-size: 1.2rem;
  padding: 0.6rem 1rem;
}

.sugerencias {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  z-index: 60;
  margin: 0;
  padding: 0.3rem;
  list-style: none;
  background: #fff;
  border: 1px solid var(--boton-borde);
  border-radius: 12px;
  box-shadow: 0 6px 18px rgb(0 0 0 / 0.2);
}

.sugerencias li {
  padding: 0.4rem 0.6rem;
  border-radius: 8px;
  cursor: pointer;
}

.sugerencias li:hover,
.sugerencias li.activa {
  background: var(--activo-1);
}

.buscador .aviso {
  position: absolute;
  top: 100%;
  margin: 0.2rem 0 0;
  font-size: 0.85rem;
  color: #8a1c1c;
}

.resultados mark {
  background: #ffe28a;
  padding: 0 0.1em;
}
```

- [ ] **Step 7: Isla `ResultadosBusqueda.tsx` y página `/buscar`**

`src/components/ResultadosBusqueda.tsx`:

```tsx
import { useEffect, useState } from 'preact/hooks';
import { buscar, resaltar, type ResultadoBusqueda } from '../lib/busqueda';
import { obtenerIndice } from '../lib/indice-cliente';

interface Props {
  categorias: { slug: string; nombre: string }[];
}

function Resaltado({ texto, consulta }: { texto: string; consulta: string }) {
  return <>{resaltar(texto, consulta).map((f) => (f.marcado ? <mark>{f.texto}</mark> : f.texto))}</>;
}

export default function ResultadosBusqueda({ categorias }: Props) {
  const [consulta, setConsulta] = useState<string | null>(null);
  const [resultados, setResultados] = useState<ResultadoBusqueda[]>([]);
  const [estado, setEstado] = useState<'cargando' | 'listo' | 'error'>('cargando');

  useEffect(() => {
    const q = new URLSearchParams(location.search).get('q') ?? '';
    setConsulta(q);
    obtenerIndice()
      .then((indice) => {
        const encontrados = buscar(indice, q);
        setResultados(encontrados);
        setEstado('listo');
        if (q.trim() && !encontrados.length) {
          document.dispatchEvent(
            new CustomEvent('mpe:guia', {
              detail: { texto: 'Mmm, no encontré nada. Revisa cómo se escribe o elige una categoría.', pose: 'sorprende' },
            }),
          );
        }
      })
      .catch(() => setEstado('error'));
  }, []);

  const nombre = (slug: string) => categorias.find((c) => c.slug === slug)?.nombre ?? '';

  if (estado === 'error') return <p role="status">La búsqueda no está disponible ahora</p>;
  if (estado === 'cargando' || consulta === null) return <p role="status">Buscando…</p>;
  if (!consulta.trim()) return <p>Escribe algo en el buscador para empezar.</p>;
  if (!resultados.length) {
    return (
      <div class="sin-resultados" role="status">
        <p>No encontré nada para «{consulta}». Revisa la ortografía o explora una categoría:</p>
        <ul class="categorias-sugeridas">
          {categorias.map((c) => (
            <li>
              <a href={`/categoria/${c.slug}`}>{c.nombre}</a>
            </li>
          ))}
        </ul>
      </div>
    );
  }
  return (
    <div>
      <p role="status">
        {resultados.length} resultados para «{consulta}»
      </p>
      <ol class="resultados">
        {resultados.map((r) => (
          <li>
            <a href={`/articulo/${r.slug}`} class="titulo-resultado">
              <Resaltado texto={r.titulo} consulta={consulta} />
            </a>{' '}
            <span class="categoria-resultado">{nombre(r.categoria)}</span>
            <p>
              <Resaltado texto={r.resumen} consulta={consulta} />
            </p>
          </li>
        ))}
      </ol>
    </div>
  );
}
```

`src/pages/buscar.astro`:

```astro
---
import Base from '../layouts/Base.astro';
import Buscador from '../components/Buscador.tsx';
import ResultadosBusqueda from '../components/ResultadosBusqueda.tsx';
import { CATEGORIAS } from '../config';

const categorias = CATEGORIAS.map((c) => ({ slug: c.slug, nombre: c.nombre }));
---
<Base titulo="Buscar" pantalla="buscar">
  <h1>Buscar</h1>
  <div class="caja-busqueda">
    <Buscador client:load variante="grande" />
  </div>
  <ResultadosBusqueda client:load categorias={categorias} />
</Base>

<style>
  .caja-busqueda {
    margin-bottom: 1.5rem;
  }
</style>
```

- [ ] **Step 8: Poner el buscador en la barra de herramientas**

En `src/components/Ventana.astro`:
1. Agrega a los imports: `import Buscador from './Buscador.tsx';`
2. Dentro de `<BarraHerramientas>`, junto a `<BotonSonido slot="sonido" />`, agrega:

```astro
<Buscador slot="buscador" client:idle />
```

- [ ] **Step 9: Escribir las pruebas de extremo a extremo**

`tests/e2e/busqueda.spec.ts`:

```ts
import { test, expect } from '@playwright/test';
import { revisarAccesibilidad } from './ayuda';

const campoDeLaBarra = (page: import('@playwright/test').Page) =>
  page.getByRole('navigation', { name: 'Barra de herramientas' }).getByRole('combobox');

test('el autocompletado lleva al artículo elegido', async ({ page }) => {
  await page.goto('/');
  const campo = campoDeLaBarra(page);
  await campo.click();
  await campo.fill('mexi');
  await expect(page.getByRole('option', { name: 'México' })).toBeVisible();
  await campo.press('ArrowDown');
  await expect(page.getByRole('option', { name: 'México' })).toHaveAttribute('aria-selected', 'true');
  await campo.press('Enter');
  await expect(page).toHaveURL(/\/articulo\/mexico$/);
});

test('Enter sin elegir abre los resultados con el término resaltado', async ({ page }) => {
  await page.goto('/');
  const campo = campoDeLaBarra(page);
  await campo.click();
  await campo.fill('mexico');
  await campo.press('Enter');
  await expect(page).toHaveURL(/\/buscar\?q=mexico$/);
  await expect(page.locator('.resultados li').first()).toBeVisible();
  await expect(page.locator('.resultados mark').first()).toHaveText('México');
});

test('sin resultados muestra el aviso y las categorías', async ({ page }) => {
  await page.goto('/buscar?q=zzzzqqq');
  await expect(page.getByText('No encontré nada para «zzzzqqq»')).toBeVisible();
  await expect(page.locator('.categorias-sugeridas a')).toHaveCount(8);
  await expect(page.locator('#globo-guia')).toContainText('no encontré nada');
});

test('la búsqueda no tiene problemas graves de accesibilidad', async ({ page }) => {
  await page.goto('/buscar?q=mexico');
  await expect(page.locator('.resultados li').first()).toBeVisible();
  await revisarAccesibilidad(page);
});
```

- [ ] **Step 10: Correr todas las pruebas**

Run: `npx vitest run && npm run test:e2e`
Expected: todo pasa. `dist/indice-busqueda.json` existe después del build.

- [ ] **Step 11: Commit**

```bash
git add src/lib/busqueda.ts src/lib/indice-cliente.ts src/pages/indice-busqueda.json.ts src/pages/buscar.astro src/components src/styles/global.css tests
git commit -m "feat: búsqueda con autocompletado y resultados resaltados" -m "Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---
### Task 14: Atlas interactivo y fichas de países

**Files:**
- Create: `src/lib/vista.ts`, `src/components/Atlas.tsx`
- Create: `src/pages/atlas.astro`, `src/pages/pais/[adm0].astro`
- Modify: `src/styles/global.css` (estilos del atlas)
- Test: `tests/unit/vista.test.ts`, `tests/e2e/atlas.spec.ts`

**Interfaces:**
- Consumes: `src/data/atlas/paises.json`, `vistas.json` (Tarea 8), tipos `Caja`, `VistaAtlas`, `PaisAtlas` (Tarea 1), colecciones (Tarea 9), `Base` (Tarea 10).
- Produces:
  - `MUNDO: Caja = [0, 0, 960, 500]`, `ANCHO_MINIMO = 60`
  - `suavizar(t)`, `interpolarCaja(a, b, t): Caja`, `limitarCaja(c, limites?): Caja`, `acercar(c, factor, cx, cy): Caja`, `desplazar(c, dx, dy): Caja`, `aCoordenadasMapa(c, px, py, anchoPx, altoPx): [number, number]`
  - `interface PaisMapa { adm0: string; nombre: string; d: string; href: string; tieneArticulo: boolean }`
  - Isla `Atlas` con props `{ paises: PaisMapa[]; vistas: Record<VistaAtlas, Caja>; nombresVistas: Record<VistaAtlas, string> }`
  - Cada país es `path[data-adm0][data-tiene-articulo]` con `role="link"` y `aria-label` = nombre; el SVG tiene `role="group"` y `aria-label="Mapa del mundo"`
  - Rutas `/atlas` y `/pais/[adm0]` (solo países sin artículo)

- [ ] **Step 1: Escribir la prueba unitaria que falla**

`tests/unit/vista.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { aCoordenadasMapa, acercar, desplazar, interpolarCaja, limitarCaja, MUNDO } from '../../src/lib/vista';
import type { Caja } from '../../src/lib/tipos';

describe('vista del atlas', () => {
  it('interpola entre dos cajas', () => {
    const a: Caja = [0, 0, 960, 500];
    const b: Caja = [400, 20, 200, 120];
    expect(interpolarCaja(a, b, 0)).toEqual(a);
    expect(interpolarCaja(a, b, 1)).toEqual(b);
    expect(interpolarCaja(a, b, 0.5)).toEqual([200, 10, 580, 310]);
  });

  it('acerca manteniendo fijo el punto elegido', () => {
    expect(acercar(MUNDO, 2, 480, 250)).toEqual([240, 125, 480, 250]);
  });

  it('no acerca más allá del ancho mínimo ni aleja más allá del mundo', () => {
    expect(acercar(MUNDO, 100, 480, 250)[2]).toBe(60);
    expect(acercar(MUNDO, 0.5, 480, 250)).toEqual(MUNDO);
  });

  it('desplaza sin salirse del mapa', () => {
    expect(desplazar([0, 0, 480, 250], 100, 0)).toEqual([0, 0, 480, 250]);
    expect(desplazar([240, 125, 480, 250], 100, 50)).toEqual([140, 75, 480, 250]);
    expect(limitarCaja([900, 400, 480, 250])).toEqual([480, 250, 480, 250]);
  });

  it('convierte píxeles de pantalla en coordenadas del mapa', () => {
    expect(aCoordenadasMapa(MUNDO, 480, 250, 960, 500)).toEqual([480, 250]);
    expect(aCoordenadasMapa(MUNDO, 960, 500, 1920, 1000)).toEqual([480, 250]);
    expect(aCoordenadasMapa([240, 125, 480, 250], 0, 0, 960, 500)).toEqual([240, 125]);
  });
});
```

- [ ] **Step 2: Correr la prueba y verificar que falla**

Run: `npx vitest run tests/unit/vista.test.ts`
Expected: FAIL, no se puede resolver `../../src/lib/vista`.

- [ ] **Step 3: Implementar `src/lib/vista.ts`**

```ts
import type { Caja } from './tipos';

export const MUNDO: Caja = [0, 0, 960, 500];
export const ANCHO_MINIMO = 60;

export function suavizar(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
}

export function interpolarCaja(a: Caja, b: Caja, t: number): Caja {
  const s = suavizar(Math.min(1, Math.max(0, t)));
  return a.map((v, i) => v + (b[i] - v) * s) as Caja;
}

/** Mantiene la caja dentro de los límites, con un ancho mínimo y la misma proporción. */
export function limitarCaja(c: Caja, limites: Caja = MUNDO): Caja {
  let [x, y, w, h] = c;
  const crecer = Math.max(ANCHO_MINIMO / w, 1);
  w *= crecer;
  h *= crecer;
  const reducir = Math.min(limites[2] / w, limites[3] / h, 1);
  w *= reducir;
  h *= reducir;
  x = Math.min(Math.max(x, limites[0]), limites[0] + limites[2] - w);
  y = Math.min(Math.max(y, limites[1]), limites[1] + limites[3] - h);
  return [x, y, w, h];
}

/** factor > 1 acerca y < 1 aleja; (cx, cy) es el punto del mapa que queda fijo. */
export function acercar(c: Caja, factor: number, cx: number, cy: number): Caja {
  const [x, y, w, h] = c;
  return limitarCaja([cx - (cx - x) / factor, cy - (cy - y) / factor, w / factor, h / factor]);
}

/** Desplaza la vista como si se arrastrara el mapa dx, dy unidades del mapa. */
export function desplazar(c: Caja, dx: number, dy: number): Caja {
  return limitarCaja([c[0] - dx, c[1] - dy, c[2], c[3]]);
}

/** Convierte un punto en píxeles dentro del SVG (preserveAspectRatio "xMidYMid meet") en coordenadas del mapa. */
export function aCoordenadasMapa(c: Caja, px: number, py: number, anchoPx: number, altoPx: number): [number, number] {
  const escala = Math.min(anchoPx / c[2], altoPx / c[3]);
  const ox = (anchoPx - c[2] * escala) / 2;
  const oy = (altoPx - c[3] * escala) / 2;
  return [c[0] + (px - ox) / escala, c[1] + (py - oy) / escala];
}
```

- [ ] **Step 4: Correr la prueba y verificar que pasa**

Run: `npx vitest run tests/unit/vista.test.ts`
Expected: PASS (5 pruebas).

- [ ] **Step 5: Isla `src/components/Atlas.tsx`**

```tsx
import { useEffect, useRef, useState } from 'preact/hooks';
import { navigate } from 'astro:transitions/client';
import { aCoordenadasMapa, acercar, desplazar, interpolarCaja } from '../lib/vista';
import type { Caja, VistaAtlas } from '../lib/tipos';

export interface PaisMapa {
  adm0: string;
  nombre: string;
  d: string;
  href: string;
  tieneArticulo: boolean;
}

interface Props {
  paises: PaisMapa[];
  vistas: Record<VistaAtlas, Caja>;
  nombresVistas: Record<VistaAtlas, string>;
}

interface Etiqueta {
  nombre: string;
  x: number;
  y: number;
}

export default function Atlas({ paises, vistas, nombresVistas }: Props) {
  const [caja, setCaja] = useState<Caja>(vistas.mundo);
  const [etiqueta, setEtiqueta] = useState<Etiqueta | null>(null);
  const lienzo = useRef<HTMLDivElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const cajaActual = useRef(caja);
  cajaActual.current = caja;
  const animacion = useRef(0);
  const punteros = useRef(new Map<number, { x: number; y: number }>());
  const inicio = useRef({ x: 0, y: 0 });
  const arrastrado = useRef(false);

  useEffect(() => () => cancelAnimationFrame(animacion.current), []);

  function irAVista(vista: VistaAtlas) {
    cancelAnimationFrame(animacion.current);
    const desde = cajaActual.current;
    const hasta = vistas[vista];
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setCaja(hasta);
      return;
    }
    const t0 = performance.now();
    const paso = (ahora: number) => {
      const t = Math.min(1, (ahora - t0) / 400);
      setCaja(interpolarCaja(desde, hasta, t));
      if (t < 1) animacion.current = requestAnimationFrame(paso);
    };
    animacion.current = requestAnimationFrame(paso);
  }

  function escalaPantalla(): number {
    const r = svg.current!.getBoundingClientRect();
    return Math.min(r.width / cajaActual.current[2], r.height / cajaActual.current[3]);
  }

  function alPresionar(e: PointerEvent) {
    punteros.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (punteros.current.size === 1) {
      inicio.current = { x: e.clientX, y: e.clientY };
      arrastrado.current = false;
    }
  }

  function alMover(e: PointerEvent) {
    const previo = punteros.current.get(e.pointerId);
    if (!previo) return;
    const actual = { x: e.clientX, y: e.clientY };
    if (punteros.current.size === 1) {
      const distancia = Math.hypot(actual.x - inicio.current.x, actual.y - inicio.current.y);
      if (arrastrado.current || distancia >= 6) {
        arrastrado.current = true;
        const escala = escalaPantalla();
        setCaja((c) => desplazar(c, (actual.x - previo.x) / escala, (actual.y - previo.y) / escala));
      }
    } else if (punteros.current.size === 2) {
      const [a, b] = [...punteros.current.values()];
      const [na, nb] = [...punteros.current.entries()].map(([id, p]) => (id === e.pointerId ? actual : p));
      const antes = Math.hypot(a.x - b.x, a.y - b.y);
      const despues = Math.hypot(na.x - nb.x, na.y - nb.y);
      if (antes > 0) {
        arrastrado.current = true;
        const r = svg.current!.getBoundingClientRect();
        const [cx, cy] = aCoordenadasMapa(cajaActual.current, (na.x + nb.x) / 2 - r.left, (na.y + nb.y) / 2 - r.top, r.width, r.height);
        setCaja((c) => acercar(c, despues / antes, cx, cy));
      }
    }
    punteros.current.set(e.pointerId, actual);
  }

  function alSoltar(e: PointerEvent) {
    punteros.current.delete(e.pointerId);
  }

  function mostrar(nombre: string, x: number, y: number) {
    const r = lienzo.current!.getBoundingClientRect();
    setEtiqueta({ nombre, x: x - r.left, y: y - r.top });
  }

  function abrir(pais: PaisMapa) {
    if (arrastrado.current) return;
    navigate(pais.href);
  }

  return (
    <div class="atlas">
      <div class="vistas" role="group" aria-label="Acercar a un continente">
        {(Object.keys(nombresVistas) as VistaAtlas[]).map((v) => (
          <button type="button" class="boton" onClick={() => irAVista(v)}>
            {nombresVistas[v]}
          </button>
        ))}
      </div>
      <div class="lienzo" ref={lienzo}>
        <svg
          ref={svg}
          viewBox={caja.join(' ')}
          preserveAspectRatio="xMidYMid meet"
          role="group"
          aria-label="Mapa del mundo"
          onPointerDown={alPresionar}
          onPointerMove={alMover}
          onPointerUp={alSoltar}
          onPointerCancel={alSoltar}
          onPointerLeave={alSoltar}
        >
          <rect class="mar" x={0} y={0} width={960} height={500} />
          {paises.map((p) => (
            <path
              key={p.adm0}
              d={p.d}
              class={p.tieneArticulo ? 'pais con-articulo' : 'pais'}
              data-adm0={p.adm0}
              data-tiene-articulo={String(p.tieneArticulo)}
              role="link"
              aria-label={p.nombre}
              tabIndex={0}
              onClick={() => abrir(p)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  navigate(p.href);
                }
              }}
              onPointerEnter={(e) => mostrar(p.nombre, e.clientX, e.clientY)}
              onPointerLeave={() => setEtiqueta(null)}
              onFocus={(e) => {
                const r = (e.currentTarget as SVGGraphicsElement).getBoundingClientRect();
                mostrar(p.nombre, r.left + r.width / 2, r.top + r.height / 2);
              }}
              onBlur={() => setEtiqueta(null)}
            />
          ))}
        </svg>
        {etiqueta && (
          <div class="etiqueta-pais" role="tooltip" style={{ left: `${etiqueta.x}px`, top: `${etiqueta.y}px` }}>
            {etiqueta.nombre}
          </div>
        )}
      </div>
    </div>
  );
}
```

Agrega al final de `src/styles/global.css`:

```css
.atlas .vistas {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-bottom: 0.8rem;
}

.atlas .lienzo {
  position: relative;
  border: 2px solid #7fa3cf;
  border-radius: var(--radio);
  overflow: hidden;
  background: #9fd3f5;
}

.atlas svg {
  display: block;
  width: 100%;
  height: auto;
  aspect-ratio: 960 / 500;
  touch-action: none;
}

.atlas .mar {
  fill: #9fd3f5;
}

.atlas .pais {
  fill: #e9e2c8;
  stroke: #8c7b55;
  stroke-width: 0.6;
  vector-effect: non-scaling-stroke;
  cursor: pointer;
  transition: fill 0.15s ease;
}

.atlas .pais.con-articulo {
  fill: #ffd27a;
}

.atlas .pais:hover,
.atlas .pais:focus-visible {
  fill: #ff8a3d;
  outline: none;
}

.atlas .etiqueta-pais {
  position: absolute;
  transform: translate(-50%, -130%);
  padding: 0.2rem 0.6rem;
  background: #1d2733;
  color: #fff;
  border-radius: 8px;
  font-weight: bold;
  pointer-events: none;
  white-space: nowrap;
}
```

- [ ] **Step 6: Páginas `/atlas` y `/pais/[adm0]`**

`src/pages/atlas.astro`:

```astro
---
import { getCollection } from 'astro:content';
import Base from '../layouts/Base.astro';
import Atlas, { type PaisMapa } from '../components/Atlas.tsx';
import paisesAtlas from '../data/atlas/paises.json';
import vistasAtlas from '../data/atlas/vistas.json';
import type { Articulo, Caja, PaisAtlas, VistaAtlas } from '../lib/tipos';

const articulos = (await getCollection('articulos')).map((e) => e.data as Articulo);
const slugPorPais = new Map(articulos.flatMap((a) => (a.pais ? [[a.pais.adm0, a.slug] as const] : [])));
const todos = paisesAtlas as PaisAtlas[];
const href = (adm0: string) => (slugPorPais.has(adm0) ? `/articulo/${slugPorPais.get(adm0)}` : `/pais/${adm0}`);
const paises: PaisMapa[] = todos.map((p) => ({ adm0: p.adm0, nombre: p.nombre, d: p.d, href: href(p.adm0), tieneArticulo: slugPorPais.has(p.adm0) }));
const nombresVistas: Record<VistaAtlas, string> = {
  mundo: 'Mundo',
  africa: 'África',
  america: 'América',
  asia: 'Asia',
  europa: 'Europa',
  oceania: 'Oceanía',
};
const continentes = [...new Set(todos.map((p) => p.continente))].sort((a, b) => a.localeCompare(b, 'es'));
---
<Base titulo="Atlas" pantalla="atlas">
  <h1>Atlas del mundo</h1>
  <p>Los países en amarillo tienen artículo. Haz clic en cualquiera para conocerlo.</p>
  <Atlas client:load paises={paises} vistas={vistasAtlas as Record<VistaAtlas, Caja>} nombresVistas={nombresVistas} />
  <details class="lista-paises panel">
    <summary>Lista de países</summary>
    {
      continentes.map((c) => (
        <section>
          <h2>{c}</h2>
          <ul>
            {todos
              .filter((p) => p.continente === c)
              .map((p) => (
                <li>
                  <a href={href(p.adm0)}>{p.nombre}</a>
                </li>
              ))}
          </ul>
        </section>
      ))
    }
  </details>
</Base>

<style>
  .lista-paises {
    margin-top: 1.5rem;
  }
  .lista-paises ul {
    columns: 3 12rem;
  }
</style>
```

`src/pages/pais/[adm0].astro`:

```astro
---
import { getCollection } from 'astro:content';
import Base from '../../layouts/Base.astro';
import paisesAtlas from '../../data/atlas/paises.json';
import type { Articulo, PaisAtlas } from '../../lib/tipos';

export async function getStaticPaths() {
  const articulos = (await getCollection('articulos')).map((e) => e.data as Articulo);
  const conArticulo = new Set(articulos.flatMap((a) => (a.pais ? [a.pais.adm0] : [])));
  return (paisesAtlas as PaisAtlas[])
    .filter((p) => !conArticulo.has(p.adm0))
    .map((pais) => ({ params: { adm0: pais.adm0 }, props: { pais } }));
}

const { pais } = Astro.props;
const poblacion = new Intl.NumberFormat('es').format(pais.poblacion);
---
<Base titulo={pais.nombre} pantalla="pais">
  <h1>{pais.nombre}</h1>
  <dl class="ficha panel">
    <dt>Continente</dt>
    <dd>{pais.continente}</dd>
    <dt>Población estimada</dt>
    <dd>{`${poblacion} habitantes`}</dd>
  </dl>
  <p class="fuente">Fuente: Natural Earth (dominio público).</p>
  <a class="boton" href="/atlas">Volver al atlas</a>
</Base>

<style>
  .ficha {
    display: grid;
    grid-template-columns: max-content 1fr;
    gap: 0.4rem 1rem;
    max-width: 420px;
  }
  .ficha dt {
    font-weight: bold;
  }
  .ficha dd {
    margin: 0;
  }
  .fuente {
    font-size: 0.85rem;
    color: var(--texto-suave);
  }
</style>
```

- [ ] **Step 7: Escribir las pruebas de extremo a extremo**

`tests/e2e/atlas.spec.ts`:

```ts
import { test, expect } from '@playwright/test';
import { revisarAccesibilidad } from './ayuda';

// Se usa dispatchEvent('click') porque el centro geométrico de un país puede caer en el mar.
test('México abre su artículo y Atrás vuelve al atlas', async ({ page }) => {
  await page.goto('/atlas');
  await page.locator('[data-adm0="MEX"]').dispatchEvent('click');
  await expect(page).toHaveURL(/\/articulo\/mexico$/);
  await page.goBack();
  await expect(page).toHaveURL(/\/atlas$/);
  await expect(page.locator('[data-adm0="MEX"]')).toBeVisible();
});

test('un país sin artículo abre su ficha', async ({ page }) => {
  await page.goto('/atlas');
  const pais = page.locator('[data-tiene-articulo="false"]').first();
  const nombre = (await pais.getAttribute('aria-label'))!;
  await pais.dispatchEvent('click');
  await expect(page).toHaveURL(/\/pais\/[A-Z]{3}$/);
  await expect(page.getByRole('heading', { level: 1, name: nombre })).toBeVisible();
  await expect(page.getByText('Continente')).toBeVisible();
});

test('se abre un país con el teclado', async ({ page }) => {
  await page.goto('/atlas');
  await page.locator('[data-adm0="MEX"]').focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/articulo\/mexico$/);
});

test('los botones de continente acercan el mapa', async ({ page }) => {
  await page.goto('/atlas');
  const mapa = page.getByRole('group', { name: 'Mapa del mundo' });
  await expect(mapa).toHaveAttribute('viewBox', '0 0 960 500');
  await page.getByRole('button', { name: 'Europa' }).click();
  await expect(mapa).not.toHaveAttribute('viewBox', '0 0 960 500');
});

test('el atlas no tiene problemas graves de accesibilidad', async ({ page }) => {
  await page.goto('/atlas');
  await revisarAccesibilidad(page);
});
```

- [ ] **Step 8: Correr todas las pruebas**

Run: `npx vitest run && npm run test:e2e`
Expected: todo pasa. `dist/pais/MNG/index.html` existe (Mongolia no está en la curación).

- [ ] **Step 9: Commit**

```bash
git add src/lib/vista.ts src/components/Atlas.tsx src/pages/atlas.astro src/pages/pais src/styles/global.css tests
git commit -m "feat: atlas interactivo con fichas de países" -m "Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---
### Task 15: Motor de preguntas y mejores puntuaciones

**Files:**
- Create: `src/lib/preguntas.ts`, `src/lib/puntajes.ts`
- Test: `tests/unit/preguntas.test.ts`, `tests/unit/puntajes.test.ts`

**Interfaces:**
- Consumes: tipos `Cuestionario`, `Pregunta` (Tarea 1).
- Produces (independiente de la interfaz; lo reutilizarán las fases 2 y 3):
  - `interface PreguntaEnJuego<P extends Pregunta = Pregunta> { pregunta: P; opciones: string[]; correcta: number }`
  - `interface EstadoJuego<P extends Pregunta = Pregunta> { preguntas: PreguntaEnJuego<P>[]; indice: number; elegida: number | null; aciertos: number; terminado: boolean }`
  - `mezclar<T>(lista, aleatorio?): T[]`, `iniciarJuego<P>(c: { preguntas: P[] }, aleatorio?): EstadoJuego<P>`, `preguntaActual(e)`, `responder(e, opcion)`, `siguiente(e)`
  - `PUNTOS_POR_ACIERTO = 10`, `puntaje(aciertos): number`, `estrellas(aciertos): 1 | 2 | 3`
  - `interface RegistroPuntaje { nombre: string; puntaje: number; fecha: string }`
  - `MAXIMO_REGISTROS = 5`, `LONGITUD_NOMBRE = 12`, `clavePuntajes(slug) = 'mpe:puntajes:<slug>'`
  - `limpiarNombre(nombre): string`, `leerPuntajes(slug, almacen?)`, `entraEnTop(slug, puntaje, almacen?)`, `guardarPuntaje(slug, registro, almacen?)`

- [ ] **Step 1: Escribir las pruebas que fallan**

`tests/unit/preguntas.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { estrellas, iniciarJuego, mezclar, preguntaActual, puntaje, responder, siguiente } from '../../src/lib/preguntas';
import type { Pregunta } from '../../src/lib/tipos';

/** Generador pseudoaleatorio determinista para las pruebas. */
const semilla = (s: number) => () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;

const preguntas: Pregunta[] = Array.from({ length: 10 }, (_, i) => ({
  id: `p${i}`,
  texto: `¿Pregunta ${i}?`,
  imagen: 'x.jpg',
  opciones: [`A${i}`, `B${i}`, `C${i}`],
  correcta: (i % 3) as 0 | 1 | 2,
  articulo: 'leon',
  explicacion: 'Dato.',
}));

describe('mezclar', () => {
  it('conserva todos los elementos', () => {
    expect(mezclar([1, 2, 3, 4, 5], semilla(1)).sort()).toEqual([1, 2, 3, 4, 5]);
  });
});

describe('iniciarJuego', () => {
  it('mezcla preguntas y opciones sin perder la respuesta correcta', () => {
    const juego = iniciarJuego({ preguntas }, semilla(42));
    expect(new Set(juego.preguntas.map((p) => p.pregunta.id)).size).toBe(10);
    for (const p of juego.preguntas) {
      expect(p.opciones[p.correcta]).toBe(p.pregunta.opciones[p.pregunta.correcta]);
      expect([...p.opciones].sort()).toEqual([...p.pregunta.opciones].sort());
    }
    expect(juego).toMatchObject({ indice: 0, elegida: null, aciertos: 0, terminado: false });
  });
});

describe('responder y siguiente', () => {
  it('cuenta los aciertos y termina después de la última pregunta', () => {
    let juego = iniciarJuego({ preguntas }, semilla(7));
    for (let i = 0; i < 10; i++) {
      const actual = preguntaActual(juego)!;
      juego = responder(juego, i < 6 ? actual.correcta : (actual.correcta + 1) % 3);
      juego = siguiente(juego);
    }
    expect(juego.terminado).toBe(true);
    expect(juego.aciertos).toBe(6);
    expect(preguntaActual(juego)).toBeUndefined();
  });

  it('responder dos veces la misma pregunta cuenta una sola vez', () => {
    let juego = iniciarJuego({ preguntas }, semilla(3));
    const correcta = preguntaActual(juego)!.correcta;
    juego = responder(juego, correcta);
    const otraVez = responder(juego, correcta);
    expect(otraVez).toBe(juego);
    expect(otraVez.aciertos).toBe(1);
  });

  it('ignora opciones fuera de rango y avanzar sin responder', () => {
    const juego = iniciarJuego({ preguntas }, semilla(5));
    expect(responder(juego, 3)).toBe(juego);
    expect(responder(juego, -1)).toBe(juego);
    expect(siguiente(juego)).toBe(juego);
  });
});

describe('puntaje y estrellas', () => {
  it('da 10 puntos por acierto', () => {
    expect(puntaje(7)).toBe(70);
    expect(puntaje(0)).toBe(0);
  });

  it('respeta los límites de estrellas', () => {
    expect([0, 4, 5, 7, 8, 10].map(estrellas)).toEqual([1, 1, 2, 2, 3, 3]);
  });
});
```

`tests/unit/puntajes.test.ts`:

```ts
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
```

- [ ] **Step 2: Correr las pruebas y verificar que fallan**

Run: `npx vitest run tests/unit/preguntas.test.ts tests/unit/puntajes.test.ts`
Expected: FAIL, no se pueden resolver los módulos.

- [ ] **Step 3: Implementar `src/lib/preguntas.ts`**

```ts
import type { Pregunta } from './tipos';

export interface PreguntaEnJuego<P extends Pregunta = Pregunta> {
  pregunta: P;
  opciones: string[];
  correcta: number;
}

export interface EstadoJuego<P extends Pregunta = Pregunta> {
  preguntas: PreguntaEnJuego<P>[];
  indice: number;
  elegida: number | null;
  aciertos: number;
  terminado: boolean;
}

export const PUNTOS_POR_ACIERTO = 10;

export function mezclar<T>(lista: readonly T[], aleatorio: () => number = Math.random): T[] {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(aleatorio() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

export function iniciarJuego<P extends Pregunta>(c: { preguntas: P[] }, aleatorio: () => number = Math.random): EstadoJuego<P> {
  const preguntas = mezclar(c.preguntas, aleatorio).map((pregunta) => {
    const orden = mezclar([0, 1, 2], aleatorio);
    return { pregunta, opciones: orden.map((i) => pregunta.opciones[i]), correcta: orden.indexOf(pregunta.correcta) };
  });
  return { preguntas, indice: 0, elegida: null, aciertos: 0, terminado: false };
}

export function preguntaActual<P extends Pregunta>(e: EstadoJuego<P>): PreguntaEnJuego<P> | undefined {
  return e.terminado ? undefined : e.preguntas[e.indice];
}

/** Registra una respuesta; si la pregunta ya fue respondida o la opción no existe, devuelve el mismo estado. */
export function responder<P extends Pregunta>(e: EstadoJuego<P>, opcion: number): EstadoJuego<P> {
  const actual = preguntaActual(e);
  if (!actual || e.elegida !== null || opcion < 0 || opcion >= actual.opciones.length) return e;
  return { ...e, elegida: opcion, aciertos: e.aciertos + (opcion === actual.correcta ? 1 : 0) };
}

/** Pasa a la siguiente pregunta; solo después de responder. */
export function siguiente<P extends Pregunta>(e: EstadoJuego<P>): EstadoJuego<P> {
  if (e.terminado || e.elegida === null) return e;
  const indice = e.indice + 1;
  return indice >= e.preguntas.length ? { ...e, elegida: null, terminado: true } : { ...e, indice, elegida: null };
}

export function puntaje(aciertos: number): number {
  return aciertos * PUNTOS_POR_ACIERTO;
}

export function estrellas(aciertos: number): 1 | 2 | 3 {
  if (aciertos >= 8) return 3;
  if (aciertos >= 5) return 2;
  return 1;
}
```

- [ ] **Step 4: Implementar `src/lib/puntajes.ts`**

```ts
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
```

- [ ] **Step 5: Correr las pruebas y verificar que pasan**

Run: `npx vitest run tests/unit/preguntas.test.ts tests/unit/puntajes.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/preguntas.ts src/lib/puntajes.ts tests/unit/preguntas.test.ts tests/unit/puntajes.test.ts
git commit -m "feat: motor de preguntas y mejores puntuaciones" -m "Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---
### Task 16: Redactar los 8 cuestionarios

**Files:**
- Create: `scripts/cuestionarios/ayuda.ts`
- Create: `src/content/cuestionarios/animales.json`, `planeta-tierra.json`, `espacio.json`, `cuerpo-humano.json`, `historia.json`, `arte-y-musica.json`, `ciencia-y-tecnologia.json`, `paises.json`
- Delete: `src/content/cuestionarios/.gitkeep`
- Modify: `package.json` (script `ayuda-cuestionario`)
- Test: `tests/unit/ayuda-cuestionario.test.ts`

**Interfaces:**
- Consumes: contenido importado (Tarea 7), `validarContenido` y `npm run validar` (Tarea 9), tipos (Tarea 1), `textoPlano`, `recortar` (Tarea 3).
- Produces:
  - `fichaParaCuestionario(a: Articulo): string` (texto de ayuda para redactar preguntas de un artículo)
  - `npm run ayuda-cuestionario -- <categoria>`
  - 8 cuestionarios válidos de 10 preguntas cada uno; sus `explicacion` alimentan "¿Sabías que…?" en Inicio, en los artículos y en la guía.

Esta tarea es mayormente de contenido. Su prueba de aceptación es `npm run validar` sin errores más la revisión de las reglas de redacción del Step 4.

- [ ] **Step 1: Escribir la prueba que falla**

`tests/unit/ayuda-cuestionario.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { fichaParaCuestionario } from '../../scripts/cuestionarios/ayuda';
import type { Articulo, Medio } from '../../src/lib/tipos';

const imagen = (archivo: string): Medio => ({
  archivo,
  tipo: 'imagen',
  alt: 'Un león',
  autor: 'Ana',
  licencia: 'cc-by',
  licenciaUrl: '',
  fuenteUrl: 'https://commons.wikimedia.org/wiki/File:X.jpg',
});

describe('fichaParaCuestionario', () => {
  it('muestra slug, título, imágenes disponibles y el texto plano', () => {
    const a: Articulo = {
      slug: 'leon',
      titulo: 'León',
      categoria: 'animales',
      resumen: 'El león es un felino.',
      bloques: [{ tipo: 'html', html: '<p>El <b>león</b> vive en la sabana.</p>' }],
      medios: [imagen('lion-1234abcd.jpg'), { ...imagen('rugido.mp3'), tipo: 'audio' }],
      relacionados: [],
      fuente: { url: 'https://x', historialUrl: 'https://x', revid: 1, fecha: '2026-10-14' },
    };
    const ficha = fichaParaCuestionario(a);
    expect(ficha).toContain('### León (articulo: "leon")');
    expect(ficha).toContain('imagenes: "lion-1234abcd.jpg"');
    expect(ficha).not.toContain('rugido.mp3');
    expect(ficha).toContain('El león vive en la sabana.');
  });
});
```

- [ ] **Step 2: Correr la prueba y verificar que falla**

Run: `npx vitest run tests/unit/ayuda-cuestionario.test.ts`
Expected: FAIL, no se puede resolver el módulo.

- [ ] **Step 3: Implementar `scripts/cuestionarios/ayuda.ts`**

```ts
import { readdir, readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { recortar, textoPlano } from '../../src/lib/texto';
import type { Articulo } from '../../src/lib/tipos';

export function fichaParaCuestionario(a: Articulo): string {
  const imagenes = a.medios.filter((m) => m.tipo === 'imagen').map((m) => `"${m.archivo}"`);
  const texto = textoPlano(a.bloques.flatMap((b) => (b.tipo === 'html' ? [b.html] : [])).join(' '));
  return [
    `### ${a.titulo} (articulo: "${a.slug}")`,
    `imagenes: ${imagenes.join(', ') || '(ninguna: no usar este artículo)'}`,
    recortar(texto, 1500),
    '',
  ].join('\n');
}

async function main() {
  const categoria = process.argv[2];
  if (!categoria) {
    console.error('Uso: npm run ayuda-cuestionario -- animales');
    process.exit(1);
  }
  const dir = 'src/content/articulos';
  const articulos: Articulo[] = [];
  for (const f of (await readdir(dir)).filter((x) => x.endsWith('.json'))) {
    const a = JSON.parse(await readFile(`${dir}/${f}`, 'utf8')) as Articulo;
    if (a.categoria === categoria) articulos.push(a);
  }
  articulos.sort((x, y) => x.titulo.localeCompare(y.titulo, 'es'));
  console.log(articulos.map(fichaParaCuestionario).join('\n'));
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
```

Run: `npx vitest run tests/unit/ayuda-cuestionario.test.ts`
Expected: PASS.

```bash
npm pkg set scripts.ayuda-cuestionario="tsx scripts/cuestionarios/ayuda.ts"
npm run ayuda-cuestionario -- animales | head -30
```

Expected: fichas con título, slug, nombres exactos de imágenes y el texto de cada artículo de Animales.

- [ ] **Step 4: Redactar un cuestionario por categoría**

Para cada categoría (`animales`, `planeta-tierra`, `espacio`, `cuerpo-humano`, `historia`, `arte-y-musica`, `ciencia-y-tecnologia`, `paises`):

1. Corre `npm run ayuda-cuestionario -- <categoria>` y lee las fichas.
2. Crea `src/content/cuestionarios/<categoria>.json` con este formato:

```json
{
  "slug": "animales",
  "titulo": "¿Cuánto sabes de animales?",
  "categoria": "animales",
  "preguntas": [
    {
      "id": "animales-01",
      "texto": "¿En qué tipo de lugar vive el león?",
      "imagen": "<copiar exactamente uno de los nombres de 'imagenes' de la ficha de León>",
      "opciones": ["En la sabana", "En el polo norte", "En el fondo del mar"],
      "correcta": 0,
      "articulo": "leon",
      "explicacion": "El león vive sobre todo en la sabana africana."
    }
  ]
}
```

Reglas de redacción (todas obligatorias):
- **`slug` y `categoria`:** iguales al nombre de la categoría. `titulo`: "¿Cuánto sabes de …?" (para `paises`: "¿Cuánto sabes de los países?").
- **Cantidad:** exactamente 10 preguntas, de al menos 6 artículos distintos de la categoría.
- **`id`:** `<categoria>-01` a `<categoria>-10`, sin repetir.
- **Fuente del dato:** cada respuesta correcta debe estar en el texto del artículo (en la ficha). No uses datos que no aparezcan ahí.
- **`texto`:** hasta 120 caracteres, termina en "?", vocabulario para niños de 7 a 12 años.
- **`opciones`:** 3, de largo parecido, distractores creíbles pero claramente falsos según el artículo; nunca "todas las anteriores" ni "ninguna".
- **`correcta`:** repartida: en cada cuestionario, cada índice (0, 1 y 2) aparece al menos 3 veces.
- **`imagen`:** uno de los nombres listados en `imagenes` de la ficha de ese artículo, copiado exacto.
- **`explicacion`:** una oración de hasta 160 caracteres, con palabras propias (no copiada del artículo), que cuente el dato como "¿Sabías que…?" sin incluir esas palabras.

- [ ] **Step 5: Validar y revisar el reparto de respuestas**

```bash
rm src/content/cuestionarios/.gitkeep
npm run validar
node -e "
const fs = require('fs');
for (const f of fs.readdirSync('src/content/cuestionarios')) {
  const c = JSON.parse(fs.readFileSync('src/content/cuestionarios/' + f, 'utf8'));
  const reparto = [0, 0, 0];
  c.preguntas.forEach((p) => reparto[p.correcta]++);
  const largos = c.preguntas.filter((p) => p.texto.length > 120 || !p.texto.endsWith('?') || p.explicacion.length > 160).map((p) => p.id);
  const articulos = new Set(c.preguntas.map((p) => p.articulo)).size;
  console.log(f, 'reparto', reparto, 'artículos', articulos, 'fuera de regla', largos);
}"
```

Expected:
- `✓ Contenido válido`.
- Los 8 archivos aparecen, cada uno con `reparto` donde los tres números son ≥ 3, `artículos` ≥ 6 y `fuera de regla []`.

- [ ] **Step 6: Commit**

```bash
git add scripts/cuestionarios tests/unit/ayuda-cuestionario.test.ts src/content/cuestionarios package.json
git rm --cached src/content/cuestionarios/.gitkeep 2>/dev/null || true
git commit -m "content: ocho cuestionarios con imágenes basados en los artículos" -m "Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---
### Task 17: Pantallas de juegos

**Files:**
- Create: `src/components/Cuestionario.tsx`
- Create: `src/pages/juegos/index.astro`, `src/pages/juegos/cuestionario/[slug].astro`
- Modify: `src/styles/global.css` (estilos del cuestionario)
- Test: `tests/e2e/juegos.spec.ts`

**Interfaces:**
- Consumes: `iniciarJuego`, `responder`, `siguiente`, `preguntaActual`, `puntaje`, `estrellas` (Tarea 15); `entraEnTop`, `guardarPuntaje`, `leerPuntajes`, `RegistroPuntaje` (Tarea 15); `sonido` (Tarea 11); evento `mpe:guia` (Tarea 11); `imagenDe` (Tarea 12); cuestionarios (Tarea 16).
- Produces:
  - `interface PreguntaVista extends Pregunta { imagenSrc: string; imagenAlt: string; tituloArticulo: string }`
  - `interface CuestionarioVista { slug: string; titulo: string; preguntas: PreguntaVista[] }`
  - Isla `Cuestionario` (solo cliente: el orden aleatorio no puede coincidir entre servidor y navegador)
  - Rutas `/juegos` y `/juegos/cuestionario/[slug]`
  - Clases usadas por las pruebas: `.juego`, `.opcion`, `.explicacion`, `.estrellas`, `.tabla-puntajes`

- [ ] **Step 1: Escribir la prueba de extremo a extremo que falla**

`tests/e2e/juegos.spec.ts`:

```ts
import { test, expect } from '@playwright/test';
import { revisarAccesibilidad } from './ayuda';

test('se juega un cuestionario completo y el nombre se guarda como texto', async ({ page }) => {
  await page.goto('/juegos');
  await expect(page.locator('.juego')).toHaveCount(8);
  await page.locator('.juego').first().click();
  await expect(page).toHaveURL(/\/juegos\/cuestionario\/[a-z-]+$/);

  for (let i = 1; i <= 10; i++) {
    await expect(page.getByText(`Pregunta ${i} de 10`)).toBeVisible();
    await page.locator('.opcion').first().click();
    await expect(page.locator('.explicacion')).toBeVisible();
    await expect(page.locator('.opcion').first()).toBeDisabled();
    await page.getByRole('button', { name: i === 10 ? 'Ver resultado' : 'Siguiente' }).click();
  }

  await expect(page.getByRole('heading', { name: '¡Terminaste!' })).toBeVisible();
  await expect(page.locator('.estrellas')).toContainText('de 3 estrellas');
  await page.getByLabel('¡Entraste en la tabla! Escribe tu nombre:').fill('<b>Ana</b>');
  await page.getByRole('button', { name: 'Guardar' }).click();
  await expect(page.locator('.tabla-puntajes')).toContainText('<b>Ana</b>');
  await expect(page.locator('.tabla-puntajes b')).toHaveCount(0);
});

test('Jugar otra vez reinicia el cuestionario', async ({ page }) => {
  await page.goto('/juegos');
  await page.locator('.juego').first().click();
  for (let i = 1; i <= 10; i++) {
    await page.locator('.opcion').first().click();
    await page.getByRole('button', { name: i === 10 ? 'Ver resultado' : 'Siguiente' }).click();
  }
  await page.getByRole('button', { name: 'Jugar otra vez' }).click();
  await expect(page.getByText('Pregunta 1 de 10')).toBeVisible();
});

test('el cuestionario no tiene problemas graves de accesibilidad', async ({ page }) => {
  await page.goto('/juegos');
  await page.locator('.juego').first().click();
  await expect(page.locator('.opcion').first()).toBeVisible();
  await revisarAccesibilidad(page);
});
```

- [ ] **Step 2: Correr la prueba y verificar que falla**

Run: `npm run test:e2e -- tests/e2e/juegos.spec.ts`
Expected: FAIL, `/juegos` responde 404.

- [ ] **Step 3: Isla `src/components/Cuestionario.tsx`**

```tsx
import { useEffect, useRef, useState } from 'preact/hooks';
import { estrellas, iniciarJuego, preguntaActual, puntaje, responder, siguiente, type EstadoJuego } from '../lib/preguntas';
import { entraEnTop, guardarPuntaje, leerPuntajes, type RegistroPuntaje } from '../lib/puntajes';
import { sonido } from '../lib/sonido-sitio';
import type { Pose } from '../lib/guia';
import type { Pregunta } from '../lib/tipos';

export interface PreguntaVista extends Pregunta {
  imagenSrc: string;
  imagenAlt: string;
  tituloArticulo: string;
}

export interface CuestionarioVista {
  slug: string;
  titulo: string;
  preguntas: PreguntaVista[];
}

function hablar(texto: string, pose: Pose) {
  document.dispatchEvent(new CustomEvent('mpe:guia', { detail: { texto, pose } }));
}

export default function Cuestionario({ cuestionario }: { cuestionario: CuestionarioVista }) {
  const [juego, setJuego] = useState<EstadoJuego<PreguntaVista>>(() => iniciarJuego(cuestionario));
  const [pideNombre, setPideNombre] = useState(false);
  const [nombre, setNombre] = useState('');
  const [tabla, setTabla] = useState<RegistroPuntaje[] | null>(null);
  const titulo = useRef<HTMLHeadingElement>(null);
  const botonSiguiente = useRef<HTMLButtonElement>(null);
  const actual = preguntaActual(juego);

  useEffect(() => {
    titulo.current?.focus();
  }, [juego.indice, juego.terminado]);

  useEffect(() => {
    if (juego.elegida !== null) botonSiguiente.current?.focus();
  }, [juego.elegida]);

  function elegir(opcion: number) {
    if (!actual || juego.elegida !== null) return;
    const acierto = opcion === actual.correcta;
    sonido.reproducir(acierto ? 'acierto' : 'error');
    hablar(acierto ? '¡Muy bien!' : '¡Casi! Mira cuál era la respuesta.', acierto ? 'celebra' : 'sorprende');
    setJuego(responder(juego, opcion));
  }

  function avanzar() {
    const nuevo = siguiente(juego);
    setJuego(nuevo);
    if (!nuevo.terminado) return;
    sonido.reproducir('fanfarria');
    hablar(`¡Terminaste! Conseguiste ${estrellas(nuevo.aciertos)} de 3 estrellas.`, 'celebra');
    if (entraEnTop(cuestionario.slug, puntaje(nuevo.aciertos))) setPideNombre(true);
    else setTabla(leerPuntajes(cuestionario.slug));
  }

  function guardar(e: Event) {
    e.preventDefault();
    setTabla(guardarPuntaje(cuestionario.slug, { nombre, puntaje: puntaje(juego.aciertos), fecha: new Date().toISOString() }));
    setPideNombre(false);
  }

  function otraVez() {
    setJuego(iniciarJuego(cuestionario));
    setPideNombre(false);
    setNombre('');
    setTabla(null);
  }

  if (juego.terminado) {
    const n = estrellas(juego.aciertos);
    return (
      <div class="cuestionario final">
        <h2 tabIndex={-1} ref={titulo}>
          ¡Terminaste!
        </h2>
        <p class="estrellas">
          <span aria-hidden="true">{'★'.repeat(n) + '☆'.repeat(3 - n)}</span>
          <span class="visualmente-oculto">{`${n} de 3 estrellas`}</span>
        </p>
        <p>{`${juego.aciertos} de ${juego.preguntas.length} respuestas correctas · ${puntaje(juego.aciertos)} puntos`}</p>
        {pideNombre && (
          <form class="form-nombre" onSubmit={guardar}>
            <label for="nombre-jugador">¡Entraste en la tabla! Escribe tu nombre:</label>
            <input
              id="nombre-jugador"
              maxLength={12}
              autocomplete="nickname"
              value={nombre}
              onInput={(e) => setNombre((e.target as HTMLInputElement).value)}
            />
            <button type="submit" class="boton">
              Guardar
            </button>
          </form>
        )}
        {tabla && (
          <table class="tabla-puntajes">
            <caption>Mejores puntuaciones</caption>
            <thead>
              <tr>
                <th scope="col">#</th>
                <th scope="col">Nombre</th>
                <th scope="col">Puntos</th>
              </tr>
            </thead>
            <tbody>
              {tabla.map((r, i) => (
                <tr>
                  <td>{i + 1}</td>
                  <td>{r.nombre}</td>
                  <td>{r.puntaje}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div class="acciones">
          <button type="button" class="boton boton-grande" onClick={otraVez}>
            Jugar otra vez
          </button>
          <a class="boton boton-grande" href="/juegos">
            Volver a Juegos
          </a>
        </div>
      </div>
    );
  }

  if (!actual) return null;
  const respondida = juego.elegida !== null;
  const ultima = juego.indice + 1 === juego.preguntas.length;

  return (
    <div class="cuestionario">
      <p class="progreso">{`Pregunta ${juego.indice + 1} de ${juego.preguntas.length}`}</p>
      <h2 tabIndex={-1} ref={titulo}>
        {actual.pregunta.texto}
      </h2>
      <img class="imagen-pregunta" src={actual.pregunta.imagenSrc} alt={actual.pregunta.imagenAlt} />
      <div class="opciones" role="group" aria-label="Opciones">
        {actual.opciones.map((texto, i) => {
          const estado = !respondida ? '' : i === actual.correcta ? ' correcta' : i === juego.elegida ? ' incorrecta' : '';
          return (
            <button type="button" class={`opcion${estado}`} disabled={respondida} onClick={() => elegir(i)}>
              {texto}
            </button>
          );
        })}
      </div>
      {respondida && (
        <div class="explicacion" role="status">
          <p>
            <strong>
              {juego.elegida === actual.correcta ? '¡Correcto!' : `La respuesta correcta era: ${actual.opciones[actual.correcta]}`}
            </strong>
          </p>
          <p>
            {actual.pregunta.explicacion}{' '}
            <a href={`/articulo/${actual.pregunta.articulo}`}>{`Leer sobre ${actual.pregunta.tituloArticulo}`}</a>
          </p>
          <button type="button" class="boton boton-grande" ref={botonSiguiente} onClick={avanzar}>
            {ultima ? 'Ver resultado' : 'Siguiente'}
          </button>
        </div>
      )}
    </div>
  );
}
```

Agrega al final de `src/styles/global.css`:

```css
.cuestionario {
  max-width: 640px;
  margin: 0 auto;
  text-align: center;
}

.cuestionario .progreso {
  font-weight: bold;
  color: var(--texto-suave);
}

.cuestionario h2:focus {
  outline: none;
}

.imagen-pregunta {
  max-height: 280px;
  border-radius: var(--radio);
  box-shadow: 0 3px 10px rgb(0 0 0 / 0.2);
}

.opciones {
  display: grid;
  gap: 0.6rem;
  margin: 1rem 0;
}

.opcion {
  padding: 0.9rem 1rem;
  border: 2px solid var(--boton-borde);
  border-radius: 16px;
  font: inherit;
  font-size: 1.1rem;
  font-weight: bold;
  color: var(--texto);
  cursor: pointer;
  background: var(--brillo), linear-gradient(to bottom, #fff, #e3eefb);
}

.opcion:disabled {
  cursor: default;
}

.opcion.correcta {
  background: #c9f2c7;
  border-color: #1f7a3a;
}

.opcion.incorrecta {
  background: #ffd6d6;
  border-color: #b42a48;
}

.explicacion {
  padding: 1rem;
  background: #fffbe6;
  border: 1px solid #f0d77b;
  border-radius: var(--radio);
}

.estrellas {
  font-size: 3rem;
  color: #e8a400;
  margin: 0.5rem 0;
}

.form-nombre {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
  margin: 1rem 0;
}

.form-nombre input {
  padding: 0.4rem 0.8rem;
  border: 1px solid var(--boton-borde);
  border-radius: 999px;
  font: inherit;
}

.tabla-puntajes {
  margin: 1rem auto;
  border-collapse: collapse;
  min-width: 260px;
}

.tabla-puntajes th,
.tabla-puntajes td {
  padding: 0.3rem 0.8rem;
  border-bottom: 1px solid #c9d8ec;
}

.cuestionario .acciones {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.8rem;
  margin-top: 1rem;
}
```

- [ ] **Step 4: Páginas de juegos**

`src/pages/juegos/index.astro`:

```astro
---
import { getCollection } from 'astro:content';
import Base from '../../layouts/Base.astro';
import Icono from '../../components/Icono.astro';
import { CATEGORIAS, categoriaPorSlug } from '../../config';
import type { Cuestionario } from '../../lib/tipos';

const orden = CATEGORIAS.map((c) => c.slug as string);
const cuestionarios = (await getCollection('cuestionarios'))
  .map((e) => e.data as Cuestionario)
  .sort((a, b) => orden.indexOf(a.categoria) - orden.indexOf(b.categoria));
const datos = cuestionarios.flatMap((c) => c.preguntas.map((p) => p.explicacion));
---
<Base titulo="Juegos" pantalla="juegos" mensajesGuia={datos}>
  <h1>Juegos</h1>
  {
    cuestionarios.length ? (
      <ul class="juegos">
        {cuestionarios.map((c) => (
          <li>
            <a class="juego" href={`/juegos/cuestionario/${c.slug}`} style={`--color: var(--cat-${c.categoria})`}>
              <Icono codigo={categoriaPorSlug(c.categoria)!.icono} tam={56} />
              <span class="nombre">{c.titulo}</span>
              <span class="detalle">10 preguntas con imágenes</span>
            </a>
          </li>
        ))}
      </ul>
    ) : (
      <p>Pronto habrá juegos aquí.</p>
    )
  }
</Base>

<style>
  .juegos {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 1rem;
  }
  .juego {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.3rem;
    padding: 1.2rem;
    border-radius: 20px;
    color: #fff;
    text-align: center;
    text-decoration: none;
    background: var(--brillo), var(--color);
    box-shadow: 0 4px 10px rgb(0 0 0 / 0.2);
  }
  .nombre {
    font-family: var(--fuente-titulos);
    font-size: 1.3rem;
    font-weight: 700;
  }
</style>
```

`src/pages/juegos/cuestionario/[slug].astro`:

```astro
---
import { getCollection } from 'astro:content';
import { getImage } from 'astro:assets';
import Base from '../../../layouts/Base.astro';
import CuestionarioIsla, { type CuestionarioVista } from '../../../components/Cuestionario.tsx';
import { imagenDe } from '../../../lib/medios';
import type { Articulo, Cuestionario } from '../../../lib/tipos';

export async function getStaticPaths() {
  const cuestionarios = (await getCollection('cuestionarios')).map((e) => e.data as Cuestionario);
  return cuestionarios.map((cuestionario) => ({ params: { slug: cuestionario.slug }, props: { cuestionario } }));
}

const { cuestionario } = Astro.props;
const articulos = new Map((await getCollection('articulos')).map((e) => [e.data.slug, e.data as Articulo]));
const vista: CuestionarioVista = {
  slug: cuestionario.slug,
  titulo: cuestionario.titulo,
  preguntas: await Promise.all(
    cuestionario.preguntas.map(async (p) => {
      const articulo = articulos.get(p.articulo)!;
      const medio = articulo.medios.find((m) => m.archivo === p.imagen)!;
      const imagen = await getImage({ src: imagenDe(p.imagen)!, width: 480 });
      return { ...p, imagenSrc: imagen.src, imagenAlt: medio.alt, tituloArticulo: articulo.titulo };
    }),
  ),
};
---
<Base titulo={cuestionario.titulo} pantalla="cuestionario">
  <h1>{cuestionario.titulo}</h1>
  <CuestionarioIsla client:only="preact" cuestionario={vista}>
    <p slot="fallback">Cargando el cuestionario…</p>
  </CuestionarioIsla>
</Base>
```

La validación de la Tarea 9 garantiza que `p.articulo` existe y que `p.imagen` es una imagen de ese artículo, por eso los `!` son seguros.

- [ ] **Step 5: Correr todas las pruebas**

Run: `npx vitest run && npm run test:e2e`
Expected: todo pasa, incluidas las 3 pruebas nuevas de juegos.

- [ ] **Step 6: Commit**

```bash
git add src/components/Cuestionario.tsx src/pages/juegos src/styles/global.css tests/e2e/juegos.spec.ts
git commit -m "feat: pantallas de juegos con cuestionarios y mejores puntuaciones" -m "Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---
### Task 18: Verificación final y publicación en Vercel

**Files:**
- Modify: `README.md` (comandos de contenido y URL publicada)
- Create (si se elige la CLI): `.vercel/` (ignorado por Git)

**Interfaces:**
- Consumes: todo el proyecto.
- Produces: el sitio publicado en una URL de Vercel.

- [ ] **Step 1: Verificación completa**

```bash
npx vitest run
npm run test:e2e
npm run build
du -sh dist
ls dist | head -30
```

Expected:
- Todas las pruebas unitarias y de extremo a extremo pasan.
- El build termina con `✓ Contenido válido` y sin errores.
- `dist` contiene `index.html`, `404.html`, `indice-busqueda.json`, `atlas/`, `buscar/`, `juegos/`, `categoria/`, `articulo/` y `pais/`.

- [ ] **Step 2: Completar el README**

Reemplaza la tabla de comandos de `README.md` por:

```markdown
## Comandos

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Valida el contenido y genera el sitio en `dist/` |
| `npm test` | Pruebas unitarias |
| `npm run test:e2e` | Pruebas de extremo a extremo (Playwright) |
| `npm run candidatos -- "Mamíferos"` | Lista artículos de una categoría de Vikidia para elegir |
| `npm run import` | Descarga y limpia los artículos de `scripts/import/curacion.yaml` |
| `npm run atlas` | Regenera el mapa desde Natural Earth |
| `npm run iconos` | Descarga los íconos de OpenMoji |
| `npm run ayuda-cuestionario -- animales` | Muestra datos para redactar un cuestionario |
| `npm run validar` | Revisa atribuciones, enlaces y cuestionarios |

## Actualizar el contenido

1. Edita `scripts/import/curacion.yaml`.
2. Corre `npm run import` y revisa `scripts/import/informe.md`.
3. Corre `npm run validar` y haz commit del contenido.
```

- [ ] **Step 3: PAUSA — elegir cómo publicar**

Pregunta al usuario cuál de estas opciones prefiere y espera su respuesta:

1. **GitHub + Vercel (recomendado):** subir el repositorio a GitHub e importarlo desde vercel.com. Cada push publica una nueva versión. Requiere que el usuario cree el repositorio (o autorice el conector de GitHub) y lo importe en Vercel.
2. **CLI de Vercel:** el usuario corre `npx vercel@latest login` en su terminal (es interactivo) y luego se publica con `npx vercel@latest deploy --prod`.

En ambos casos Vercel detecta Astro solo; confirma en la configuración del proyecto que la versión de Node sea 22.x o superior.

- [ ] **Step 4: Publicar según la opción elegida**

Opción 1, cuando el usuario haya creado el repositorio vacío en GitHub y te pase su URL:

```bash
git remote add origin <URL del repositorio que dio el usuario>
git push -u origin main
```

Luego el usuario importa el repositorio en vercel.com → Add New → Project.

Opción 2, cuando el usuario haya iniciado sesión con la CLI:

```bash
npx vercel@latest deploy --prod
```

Expected: Vercel devuelve la URL de producción (por ejemplo `https://mi-primera-enciclopedia.vercel.app`).

- [ ] **Step 5: Prueba de humo en producción**

```bash
URL=<URL de producción>
for ruta in / /atlas /juegos /buscar /articulo/mexico /indice-busqueda.json /no-existe; do
  printf "%-24s %s\n" "$ruta" "$(curl -s -o /dev/null -w '%{http_code}' "$URL$ruta")"
done
```

Expected: `200` en todas las rutas salvo `/no-existe`, que devuelve `404`.

- [ ] **Step 6: Commit**

Agrega la URL publicada al principio de `README.md` (línea `Sitio: <URL>`) y haz commit:

```bash
git add README.md
git commit -m "docs: comandos de contenido y URL publicada" -m "Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
git push 2>/dev/null || true
```
