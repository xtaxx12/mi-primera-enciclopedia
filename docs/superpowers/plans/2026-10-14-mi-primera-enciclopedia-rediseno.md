# Mi Primera Enciclopedia — Rediseño fiel al original: plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cambiar el aspecto del sitio para que se parezca a Mi Primera Encarta (barra verde, inicio con placas amarillas y panel azul, categorías con subcategorías, artículos con títulos naranjas y recuadros de imagen), sin tocar el contenido ni el importador.

**Architecture:** Primero se agregan los datos y la lógica pura (subcategorías, placas, voz, `?vista=` del atlas) con pruebas unitarias. Después se reemplaza la capa visual de afuera hacia adentro: paleta y piezas globales, barra y layout, y luego cada pantalla con sus pruebas de extremo a extremo. La lógica de búsqueda, atlas, cuestionario y sonido no cambia.

**Tech Stack:** Astro 7.3, Preact 10, TypeScript, CSS con unidades de contenedor (`cqw`), `speechSynthesis`, Vitest 5, Playwright + axe.

**Spec:** `docs/superpowers/specs/2026-10-14-mi-primera-enciclopedia-rediseno-design.md`

## Global Constraints

- Ningún archivo, imagen, sonido, logo ni texto del DVD de Encarta entra al repositorio. Las referencias del original viven solo en el scratchpad de la sesión.
- Logo propio: libro abierto dentro de un círculo naranja (`src/components/Logo.astro`). No se usan las hojas verdes ni la palabra «Encarta» como marca; se mantiene el aviso «Homenaje a Mi Primera Encarta (2009). Proyecto no afiliado a Microsoft.»
- Tipografía única: `Verdana, Tahoma, 'DejaVu Sans', sans-serif`. Se elimina Baloo 2.
- Colores exactos de la sección 7 de la spec; contrastes de la sección 9 (verificados en `tests/unit/contraste.test.ts`).
- Anchos: escritorio ≥ 1024 px; tablet 768–1023 px; celular < 768 px.
- Astro 7 usa `compressHTML: 'jsx'`: en las plantillas `.astro`, el texto y las etiquetas en línea van en la misma línea o se separan con `{' '}`.
- Las pruebas de extremo a extremo usan el build de producción en el puerto 4329 (`playwright.config.ts`). Nunca tocar el `npm run dev` del usuario en el puerto 4321.
- Entre tareas, las pruebas de extremo a extremo de pantallas que todavía no se rediseñaron pueden fallar (dependen de clases viejas como `.mosaico`). Cada tarea corre solo las suyas; la Tarea 13 corre todas y deben pasar.
- Todo el texto visible está en español. Los identificadores siguen el estilo del repositorio (español, camelCase).
- Cada commit termina con la línea `Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>`.
- Todas las rutas son relativas a `/Users/joelrojas/Downloads/Programs/mi-primera-enciclopedia`. Se trabaja en la rama `rediseno`; no se sube nada.

## Review Focus

1. **Artículo sin ninguna imagen** (Lobo, Océano Pacífico, Río Amazonas…): la celda usa el ícono de su subcategoría, el artículo no ofrece «Contempla las imágenes» y `/articulo/lobo/imagenes` da 404. Pruebas en las Tareas 8, 9 y 10.
2. **Cambiar el ancho de la ventana con el panel del inicio abierto** (de escritorio a celular): el panel se cierra y las placas vuelven a ser enlaces que llevan a su categoría. Prueba en la Tarea 7.
3. **Volver al inicio con Atrás después de abrir el panel** (navegación con `ClientRouter`): el inicio aparece cerrado y se puede abrir otra placa; nunca hay dos placas abiertas. Prueba en la Tarea 7.
4. **Abrir la galería con un ancla** (`/articulo/leon/imagenes#medio-2`) **o elegir otro medio dentro de ella**: se ve solo ese medio. Pruebas en la Tarea 10.
5. **Subcategoría inexistente en la dirección** (`/categoria/animales/no-existe`): página 404; y `/categoria/animales` marca su primera subcategoría como actual. Pruebas en la Tarea 8.

## Decisiones del plan frente a la spec

- `PLACAS_INICIO` (spec, sección 12) es la función `placasInicio()` en `src/lib/placas.ts`: depende de las subcategorías y `src/config.ts` no debe importar datos.
- `BotonBrillo.astro` (spec, sección 12) son las clases globales `.boton` y `.boton.azul`: no tienen lógica y así las usan también las islas de Preact.
- Las curvas tienen cuatro variantes (`inicio`, `esquina`, `franja`, `azul`) en lugar de tres; `naranja` se divide entre el escenario del inicio y la esquina de las demás páginas.
- Los botones naranjas llevan texto oscuro (`--texto`), no blanco como en las maquetas: el blanco sobre naranja no llega a 4,5:1.
- En celular, la barra conserva Sonido y Acerca de (la spec nombra solo Inicio, Atrás, lupa y logo) para que se pueda silenciar y llegar a las licencias.
- La miniatura de 64 px de los resultados de búsqueda es el ícono de la categoría: el índice de búsqueda no guarda imágenes.
- Los recuadros de imagen recargan la página (`data-astro-reload`): con la navegación de `ClientRouter`, `:target` no se actualiza.
- `/categoria/<cat>` muestra lo mismo que su primera subcategoría (dos direcciones con el mismo contenido).

---

## Mapa de archivos

| Archivo | Responsabilidad | Tarea |
|---|---|---|
| `src/data/subcategorias.ts` | Reparto de artículos en subcategorías | 1 |
| `src/lib/subcategorias.ts` | `subcategoriasDe`, `subcategoriaDe`, `validarReparto` | 1 |
| `scripts/validar.ts` | Llama a `validarReparto` | 1 |
| `src/lib/placas.ts` | Las 10 placas del inicio y los enlaces de su panel | 2 |
| `src/config.ts` | Íconos nuevos, `SITIO.logo`; sale `SITIO.personaje` | 2, 6 |
| `scripts/iconos/descargar.ts`, `public/iconos/*.svg` | Íconos de subcategorías y panel | 2 |
| `src/lib/sonido.ts` | `hablar(texto)` con `speechSynthesis` | 3 |
| `src/lib/vista.ts`, `src/components/Atlas.tsx` | `vistaDesdeUrl` y vista inicial | 4 |
| `src/styles/tokens.css`, `src/styles/global.css` | Paleta y piezas globales | 5 (y secciones en 11, 12) |
| `src/components/Logo.astro`, `src/components/Curvas.astro`, `public/favicon.svg` | Logo propio y fondos curvos | 5 |
| `src/components/Barra.astro`, `src/layouts/Base.astro`, `src/components/BotonSonido.astro`, `src/components/Buscador.tsx` | Barra verde y layout | 6 |
| Se borran: `Ventana.astro`, `Guia.astro`, `BarraHerramientas.astro`, `src/lib/guia.ts`, `tests/unit/guia.test.ts`, `tests/e2e/guia.spec.ts` | — | 6 |
| `src/components/Placas.astro`, `src/pages/index.astro` | Inicio | 7 |
| `src/components/MenuSubcategorias.astro`, `CeldaTema.astro`, `PaginaCategoria.astro`, `VistaCategoria.astro`, `src/pages/categoria/[slug].astro`, `src/pages/categoria/[slug]/[sub].astro`, `src/pages/juegos/index.astro` | Categorías y Juega y aprende | 8 |
| `src/components/RecuadroMedio.astro`, `SabiasQue.astro`, `Bloques.astro`, `src/pages/articulo/[slug].astro`, `src/lib/articulos.ts` | Artículo | 9 |
| `src/pages/articulo/[slug]/imagenes.astro` | Contempla las imágenes | 10 |
| `src/components/Cuestionario.tsx`, `src/pages/juegos/cuestionario/[slug].astro` | Cuestionario | 11 |
| `src/pages/atlas.astro`, `src/pages/pais/[adm0].astro`, `src/pages/buscar.astro`, `src/components/ResultadosBusqueda.tsx`, `src/pages/acerca.astro`, `src/pages/404.astro` | Resto de pantallas | 12 |
| `README.md` | Documentación | 13 |

---

### Task 1: Subcategorías y su validación

**Files:**
- Create: `src/data/subcategorias.ts`, `src/lib/subcategorias.ts`
- Modify: `scripts/validar.ts`
- Test: `tests/unit/subcategorias.test.ts`, `tests/unit/validar.test.ts`

**Interfaces:**
- Consumes: `CategoriaSlug` de `src/config.ts`; `Articulo` de `src/lib/tipos.ts`.
- Produces:
  - `interface Subcategoria { slug: string; nombre: string; icono: string; articulos: string[] }`
  - `SUBCATEGORIAS: Record<CategoriaSlug, Subcategoria[]>`
  - `subcategoriasDe(categoria: CategoriaSlug, reparto?): Subcategoria[]`
  - `subcategoriaDe(slug: string, reparto?): { categoria: CategoriaSlug; subcategoria: Subcategoria } | undefined`
  - `validarReparto(articulos: { slug: string; categoria: string }[], reparto?): string[]`
  - `DatosValidacion.reparto?: Record<string, Subcategoria[]>` en `scripts/validar.ts`

- [ ] **Step 1: Escribir la prueba que falla**

`tests/unit/subcategorias.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { subcategoriaDe, subcategoriasDe, validarReparto } from '../../src/lib/subcategorias';
import type { Subcategoria } from '../../src/data/subcategorias';

const reales = readdirSync('src/content/articulos')
  .filter((f) => f.endsWith('.json'))
  .map((f) => JSON.parse(readFileSync(`src/content/articulos/${f}`, 'utf8')) as { slug: string; categoria: string });

const sub = (slug: string, articulos: string[]): Subcategoria => ({ slug, nombre: slug, icono: '2B50', articulos });
const arts = [
  { slug: 'leon', categoria: 'animales' },
  { slug: 'sol', categoria: 'espacio' },
];

describe('reparto real', () => {
  it('cubre cada artículo de su categoría exactamente una vez', () => {
    expect(validarReparto(reales)).toEqual([]);
  });
});

describe('validarReparto', () => {
  it('acepta un reparto completo', () => {
    expect(validarReparto(arts, { animales: [sub('m', ['leon'])], espacio: [sub('s', ['sol'])] })).toEqual([]);
  });

  it('informa un artículo sin subcategoría', () => {
    expect(validarReparto(arts, { animales: [sub('m', ['leon'])] })).toEqual([
      'artículo «sol»: no está en ninguna subcategoría de «espacio»',
    ]);
  });

  it('informa un artículo repetido', () => {
    expect(validarReparto(arts, { animales: [sub('a', ['leon']), sub('b', ['leon'])], espacio: [sub('s', ['sol'])] })).toEqual([
      'subcategoría «animales/b»: el artículo «leon» ya está en «animales/a»',
    ]);
  });

  it('informa un artículo de otra categoría', () => {
    expect(validarReparto(arts, { animales: [sub('m', ['leon', 'sol'])] })).toEqual([
      'subcategoría «animales/m»: el artículo «sol» es de la categoría «espacio»',
    ]);
  });

  it('informa un artículo inexistente', () => {
    expect(validarReparto(arts, { animales: [sub('m', ['leon', 'tigre'])], espacio: [sub('s', ['sol'])] })).toEqual([
      'subcategoría «animales/m»: el artículo «tigre» no existe',
    ]);
  });

  it('informa una subcategoría vacía y un slug repetido', () => {
    const e = validarReparto(arts, { animales: [sub('m', ['leon']), sub('m', [])], espacio: [sub('s', ['sol'])] });
    expect(e).toContain('subcategoría «animales/m»: slug repetido');
    expect(e).toContain('subcategoría «animales/m»: está vacía');
  });
});

describe('consultas', () => {
  it('subcategoriasDe devuelve las de la categoría en orden', () => {
    expect(subcategoriasDe('animales').map((s) => s.slug)).toEqual([
      'mamiferos',
      'aves',
      'reptiles-y-dinosaurios',
      'animales-del-mar',
      'insectos',
    ]);
  });

  it('subcategoriaDe encuentra la subcategoría de un artículo', () => {
    expect(subcategoriaDe('guacamayo')).toMatchObject({ categoria: 'animales', subcategoria: { slug: 'aves' } });
  });

  it('subcategoriaDe devuelve undefined si el artículo no está', () => {
    expect(subcategoriaDe('tigre')).toBeUndefined();
  });
});
```

Agregar al final de `tests/unit/validar.test.ts` (y agregar `import type { Subcategoria } from '../../src/data/subcategorias';` debajo de los imports existentes):

```ts
describe('validarContenido con reparto', () => {
  it('incluye los errores del reparto de subcategorías', () => {
    const reparto: Record<string, Subcategoria[]> = {
      animales: [{ slug: 'felinos', nombre: 'Felinos', icono: '2B50', articulos: ['leon'] }],
      paises: [{ slug: 'america', nombre: 'América', icono: '1F30E', articulos: ['mexico'] }],
    };
    expect(validarContenido(datos({ reparto }))).toContain('artículo «tigre»: no está en ninguna subcategoría de «animales»');
  });
});
```

- [ ] **Step 2: Correr las pruebas y verificar que fallan**

Run: `npx vitest run tests/unit/subcategorias.test.ts tests/unit/validar.test.ts`
Expected: FAIL; no se puede resolver `../../src/lib/subcategorias` ni `../../src/data/subcategorias`.

- [ ] **Step 3: Crear `src/data/subcategorias.ts`**

```ts
import type { CategoriaSlug } from '../config';

export interface Subcategoria {
  slug: string;
  nombre: string;
  /** Código de OpenMoji. */
  icono: string;
  /** Slugs de los artículos, en el orden en que se muestran. */
  articulos: string[];
}

export const SUBCATEGORIAS: Record<CategoriaSlug, Subcategoria[]> = {
  animales: [
    { slug: 'mamiferos', nombre: 'Mamíferos', icono: '1F418', articulos: ['leon', 'elefante', 'ballena', 'delfin', 'gato', 'perro', 'lobo', 'ornitorrinco'] },
    { slug: 'aves', nombre: 'Aves', icono: '1F99C', articulos: ['guacamayo', 'pinguino'] },
    { slug: 'reptiles-y-dinosaurios', nombre: 'Reptiles y dinosaurios', icono: '1F995', articulos: ['cocodrilo', 'tortuga', 'dinosaurio'] },
    { slug: 'animales-del-mar', nombre: 'Animales del mar', icono: '1F988', articulos: ['tiburon', 'pulpo'] },
    { slug: 'insectos', nombre: 'Insectos', icono: '1F41D', articulos: ['abeja', 'mariposa'] },
  ],
  'planeta-tierra': [
    { slug: 'relieve', nombre: 'Relieve', icono: '26F0', articulos: ['volcan', 'terremoto', 'montana', 'isla', 'glaciar'] },
    { slug: 'el-agua', nombre: 'El agua', icono: '1F4A7', articulos: ['agua', 'ciclo-del-agua', 'oceano-pacifico', 'rio-amazonas', 'lago'] },
    { slug: 'clima-y-aire', nombre: 'Clima y aire', icono: '1F326', articulos: ['clima', 'atmosfera', 'huracan'] },
    { slug: 'paisajes', nombre: 'Paisajes', icono: '1F333', articulos: ['sabana', 'bosque', 'antartida'] },
  ],
  espacio: [
    { slug: 'sistema-solar', nombre: 'Sistema solar', icono: '1FA90', articulos: ['sistema-solar', 'sol', 'luna', 'tierra', 'mercurio', 'marte', 'pluton', 'planeta'] },
    { slug: 'el-universo', nombre: 'El universo', icono: '1F30C', articulos: ['estrella', 'galaxia', 'agujero-negro', 'cometa', 'asteroide'] },
    { slug: 'exploracion', nombre: 'Exploración', icono: '1F52D', articulos: ['telescopio', 'conquista-del-espacio'] },
  ],
  'cuerpo-humano': [
    { slug: 'organos', nombre: 'Órganos', icono: '1FAC1', articulos: ['corazon', 'cerebro', 'pulmon', 'estomago', 'rinon', 'sangre'] },
    { slug: 'los-sentidos', nombre: 'Los sentidos', icono: '1F441', articulos: ['ojo', 'oido', 'boca', 'piel', 'nervio'] },
    { slug: 'huesos-y-musculos', nombre: 'Huesos y músculos', icono: '1F9B4', articulos: ['esqueleto', 'hueso', 'musculo', 'diente'] },
  ],
  historia: [
    { slug: 'prehistoria', nombre: 'Prehistoria', icono: '1F525', articulos: ['prehistoria', 'stonehenge', 'escritura'] },
    { slug: 'antiguedad', nombre: 'Antigüedad', icono: '1F3FA', articulos: ['antiguo-egipto', 'piramide', 'antigua-grecia', 'imperio-romano'] },
    { slug: 'edad-media-y-renacimiento', nombre: 'Edad Media y Renacimiento', icono: '1F3F0', articulos: ['vikingos', 'edad-media', 'marco-polo', 'renacimiento', 'cristobal-colon'] },
    { slug: 'america-antigua', nombre: 'América antigua', icono: '1F33D', articulos: ['cultura-olmeca', 'mayas', 'aztecas', 'incas'] },
  ],
  'arte-y-musica': [
    { slug: 'pintura-y-escultura', nombre: 'Pintura y escultura', icono: '1F5BC', articulos: ['pintura', 'escultura', 'color', 'arte-prehistorico'] },
    { slug: 'grandes-artistas', nombre: 'Grandes artistas', icono: '1F9D1-200D-1F3A8', articulos: ['leonardo-da-vinci', 'diego-velazquez', 'francisco-de-goya', 'pablo-picasso', 'mondrian'] },
    { slug: 'musica-y-teatro', nombre: 'Música y teatro', icono: '1F3BC', articulos: ['orquesta', 'wolfgang-amadeus-mozart', 'ludwig-van-beethoven', 'frederic-chopin', 'rock', 'the-beatles', 'teatro'] },
  ],
  'ciencia-y-tecnologia': [
    { slug: 'inventos-y-maquinas', nombre: 'Inventos y máquinas', icono: '2699', articulos: ['rueda', 'imprenta', 'automovil', 'tren', 'computadora', 'internet', 'robot', 'microscopio'] },
    { slug: 'materia-y-energia', nombre: 'Materia y energía', icono: '26A1', articulos: ['electricidad', 'energia', 'luz', 'sonido', 'gravedad', 'atomo', 'isaac-newton'] },
    { slug: 'la-vida', nombre: 'La vida', icono: '1F9EC', articulos: ['celula', 'planta'] },
  ],
  paises: [
    { slug: 'america-del-norte-y-central', nombre: 'América del Norte y Central', icono: '1F30E', articulos: ['canada', 'estados-unidos', 'mexico', 'guatemala', 'honduras', 'el-salvador', 'nicaragua', 'costa-rica', 'panama', 'cuba', 'republica-dominicana', 'puerto-rico'] },
    { slug: 'america-del-sur', nombre: 'América del Sur', icono: '1F999', articulos: ['argentina', 'bolivia', 'brasil', 'chile', 'colombia', 'ecuador', 'paraguay', 'peru', 'uruguay', 'venezuela'] },
    { slug: 'europa', nombre: 'Europa', icono: '1F30D', articulos: ['alemania', 'espana', 'francia', 'grecia', 'italia', 'portugal', 'reino-unido'] },
    { slug: 'africa-asia-y-oceania', nombre: 'África, Asia y Oceanía', icono: '1F30F', articulos: ['argelia', 'egipto', 'india', 'turquia', 'australia'] },
  ],
};
```

- [ ] **Step 4: Crear `src/lib/subcategorias.ts`**

```ts
import type { CategoriaSlug } from '../config';
import { SUBCATEGORIAS, type Subcategoria } from '../data/subcategorias';

type Reparto = Partial<Record<string, Subcategoria[]>>;

export function subcategoriasDe(categoria: CategoriaSlug, reparto: Reparto = SUBCATEGORIAS): Subcategoria[] {
  return reparto[categoria] ?? [];
}

export function subcategoriaDe(
  slug: string,
  reparto: Reparto = SUBCATEGORIAS,
): { categoria: CategoriaSlug; subcategoria: Subcategoria } | undefined {
  for (const [categoria, subs] of Object.entries(reparto)) {
    const subcategoria = subs?.find((s) => s.articulos.includes(slug));
    if (subcategoria) return { categoria: categoria as CategoriaSlug, subcategoria };
  }
  return undefined;
}

/** Cada artículo debe estar en exactamente una subcategoría de su propia categoría. */
export function validarReparto(articulos: { slug: string; categoria: string }[], reparto: Reparto = SUBCATEGORIAS): string[] {
  const errores: string[] = [];
  const categoriaDe = new Map(articulos.map((a) => [a.slug, a.categoria]));
  const vistos = new Map<string, string>();
  for (const [categoria, subs] of Object.entries(reparto)) {
    const slugs = new Set<string>();
    for (const s of subs ?? []) {
      const donde = `subcategoría «${categoria}/${s.slug}»`;
      if (slugs.has(s.slug)) errores.push(`${donde}: slug repetido`);
      slugs.add(s.slug);
      if (!s.articulos.length) errores.push(`${donde}: está vacía`);
      for (const a of s.articulos) {
        const suya = categoriaDe.get(a);
        if (!suya) errores.push(`${donde}: el artículo «${a}» no existe`);
        else if (suya !== categoria) errores.push(`${donde}: el artículo «${a}» es de la categoría «${suya}»`);
        const previa = vistos.get(a);
        if (previa) errores.push(`${donde}: el artículo «${a}» ya está en «${previa}»`);
        else vistos.set(a, `${categoria}/${s.slug}`);
      }
    }
  }
  for (const a of articulos) {
    if (!vistos.has(a.slug)) errores.push(`artículo «${a.slug}»: no está en ninguna subcategoría de «${a.categoria}»`);
  }
  return errores;
}
```

- [ ] **Step 5: Conectar la validación del build**

En `scripts/validar.ts`:

1. Agregar los imports, debajo de `import { esHttps } from '../src/lib/urls';`:

```ts
import { SUBCATEGORIAS, type Subcategoria } from '../src/data/subcategorias';
import { validarReparto } from '../src/lib/subcategorias';
```

2. Agregar el campo a `DatosValidacion`, debajo de `publicos: Set<string>;`:

```ts
  /** Reparto de subcategorías; si falta, no se valida. */
  reparto?: Record<string, Subcategoria[]>;
```

3. En `validarContenido`, justo antes de `return errores;` (el último de la función):

```ts
  if (d.reparto) errores.push(...validarReparto(d.articulos.map((a) => a.datos), d.reparto));
```

4. En `main()`, agregar el campo al objeto que se pasa a `validarContenido`, debajo de `publicos: …`:

```ts
    reparto: SUBCATEGORIAS,
```

- [ ] **Step 6: Correr las pruebas y verificar que pasan**

Run: `npx vitest run tests/unit/subcategorias.test.ts tests/unit/validar.test.ts`
Expected: PASS. Si «reparto real» falla, el mensaje dice qué artículo falta o sobra: corregir `src/data/subcategorias.ts` (no la prueba).

Run: `npm run validar`
Expected: `✓ Contenido válido`.

- [ ] **Step 7: Commit**

```bash
git add src/data/subcategorias.ts src/lib/subcategorias.ts scripts/validar.ts tests/unit/subcategorias.test.ts tests/unit/validar.test.ts
git commit -m "feat: subcategorías de cada categoría y su validación en el build" -m "Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: Placas del inicio e íconos nuevos

**Files:**
- Create: `src/lib/placas.ts`
- Modify: `src/config.ts`, `scripts/iconos/descargar.ts`
- Create (descargados): `public/iconos/*.svg` nuevos
- Test: `tests/unit/placas.test.ts`, `tests/unit/iconos.test.ts`

**Interfaces:**
- Consumes: `SUBCATEGORIAS` (Tarea 1); `CATEGORIAS`, `ICONOS` de `src/config.ts`.
- Produces:
  - `interface EnlacePanel { nombre: string; icono: string; href: string }`
  - `interface PlacaInicio { id: string; nombre: string; icono: string; href: string; enlaces: EnlacePanel[] }`
  - `placasInicio(): PlacaInicio[]` — 10 placas: las 8 categorías en el orden de `CATEGORIAS`, luego `atlas` y `juegos`.
  - `VISTAS_PANEL_ATLAS: EnlacePanel[]`
  - `ICONOS.cuestionarios = '2753'`, `ICONOS.video = '1F3AC'`, `ICONOS.imagenes = '1F5BC'`.
  - `codigosIconos()` incluye subcategorías, placas y enlaces del panel; `descargar.ts` ya no copia el favicon.

- [ ] **Step 1: Escribir las pruebas que fallan**

`tests/unit/placas.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { placasInicio } from '../../src/lib/placas';

describe('placas del inicio', () => {
  it('hay 10 placas: las 8 categorías, Atlas y Juega y aprende', () => {
    expect(placasInicio().map((p) => p.id)).toEqual([
      'animales',
      'planeta-tierra',
      'espacio',
      'cuerpo-humano',
      'historia',
      'arte-y-musica',
      'ciencia-y-tecnologia',
      'paises',
      'atlas',
      'juegos',
    ]);
  });

  it('cada categoría enlaza a su página y a sus subcategorías', () => {
    const animales = placasInicio()[0];
    expect(animales).toMatchObject({ nombre: 'Animales', href: '/categoria/animales' });
    expect(animales.enlaces.map((e) => e.href)).toEqual([
      '/categoria/animales/mamiferos',
      '/categoria/animales/aves',
      '/categoria/animales/reptiles-y-dinosaurios',
      '/categoria/animales/animales-del-mar',
      '/categoria/animales/insectos',
    ]);
  });

  it('Atlas abre cada vista y Juega y aprende lleva a los cuestionarios', () => {
    const [atlas, juegos] = placasInicio().slice(8);
    expect(atlas).toMatchObject({ nombre: 'Atlas', href: '/atlas' });
    expect(atlas.enlaces.map((e) => e.href)).toEqual([
      '/atlas?vista=mundo',
      '/atlas?vista=africa',
      '/atlas?vista=america',
      '/atlas?vista=asia',
      '/atlas?vista=europa',
      '/atlas?vista=oceania',
    ]);
    expect(juegos).toMatchObject({ nombre: 'Juega y aprende', href: '/juegos' });
    expect(juegos.enlaces).toEqual([{ nombre: 'Cuestionarios', icono: '2753', href: '/juegos' }]);
  });
});
```

En `tests/unit/iconos.test.ts`, reemplazar los imports por:

```ts
import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import { codigosIconos, urlIcono } from '../../scripts/iconos/descargar';
import { CATEGORIAS, ICONOS } from '../../src/config';
import { SUBCATEGORIAS } from '../../src/data/subcategorias';
import { placasInicio } from '../../src/lib/placas';
```

y agregar dentro del `describe('iconos', …)`:

```ts
  it('incluye los íconos de subcategorías y del panel del inicio', () => {
    const codigos = codigosIconos();
    for (const s of Object.values(SUBCATEGORIAS).flat()) expect(codigos).toContain(s.icono);
    for (const p of placasInicio()) {
      for (const c of [p.icono, ...p.enlaces.map((e) => e.icono)]) expect(codigos).toContain(c);
    }
  });

  it('cada ícono usado está descargado en public/iconos', () => {
    for (const c of codigosIconos()) expect(existsSync(`public/iconos/${c}.svg`), c).toBe(true);
  });
```

- [ ] **Step 2: Correr las pruebas y verificar que fallan**

Run: `npx vitest run tests/unit/placas.test.ts tests/unit/iconos.test.ts`
Expected: FAIL; no se puede resolver `../../src/lib/placas`.

- [ ] **Step 3: Agregar los íconos a `src/config.ts`**

Dentro de `ICONOS`, debajo de `libros: '1F4DA',`:

```ts
  cuestionarios: '2753',
  video: '1F3AC',
  imagenes: '1F5BC',
```

- [ ] **Step 4: Crear `src/lib/placas.ts`**

```ts
import { CATEGORIAS, ICONOS } from '../config';
import { SUBCATEGORIAS } from '../data/subcategorias';

export interface EnlacePanel {
  nombre: string;
  icono: string;
  href: string;
}

export interface PlacaInicio {
  id: string;
  nombre: string;
  icono: string;
  /** Destino sin JavaScript y en celular. */
  href: string;
  /** Lo que muestra el panel azul al elegir la placa. */
  enlaces: EnlacePanel[];
}

export const VISTAS_PANEL_ATLAS: EnlacePanel[] = [
  { nombre: 'Mundo', icono: '1F5FA', href: '/atlas?vista=mundo' },
  { nombre: 'África', icono: '1F30D', href: '/atlas?vista=africa' },
  { nombre: 'América', icono: '1F30E', href: '/atlas?vista=america' },
  { nombre: 'Asia', icono: '1F30F', href: '/atlas?vista=asia' },
  { nombre: 'Europa', icono: '1F30D', href: '/atlas?vista=europa' },
  { nombre: 'Oceanía', icono: '1F30F', href: '/atlas?vista=oceania' },
];

/** Las 10 placas del inicio: las 5 primeras van a la izquierda y las 5 últimas a la derecha. */
export function placasInicio(): PlacaInicio[] {
  const categorias: PlacaInicio[] = CATEGORIAS.map((c) => ({
    id: c.slug,
    nombre: c.nombre,
    icono: c.icono,
    href: `/categoria/${c.slug}`,
    enlaces: SUBCATEGORIAS[c.slug].map((s) => ({ nombre: s.nombre, icono: s.icono, href: `/categoria/${c.slug}/${s.slug}` })),
  }));
  return [
    ...categorias,
    { id: 'atlas', nombre: 'Atlas', icono: ICONOS.atlas, href: '/atlas', enlaces: VISTAS_PANEL_ATLAS },
    {
      id: 'juegos',
      nombre: 'Juega y aprende',
      icono: ICONOS.juegos,
      href: '/juegos',
      enlaces: [{ nombre: 'Cuestionarios', icono: ICONOS.cuestionarios, href: '/juegos' }],
    },
  ];
}
```

- [ ] **Step 5: Ampliar `scripts/iconos/descargar.ts`**

Reemplazar el archivo entero por:

```ts
import { access, mkdir, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { CATEGORIAS, ICONOS } from '../../src/config';
import { SUBCATEGORIAS } from '../../src/data/subcategorias';
import { placasInicio } from '../../src/lib/placas';

export const VERSION_OPENMOJI = '17.0.0';

export function codigosIconos(): string[] {
  return [
    ...new Set([
      ...CATEGORIAS.map((c) => c.icono),
      ...Object.values(ICONOS),
      ...Object.values(SUBCATEGORIAS)
        .flat()
        .map((s) => s.icono),
      ...placasInicio().flatMap((p) => [p.icono, ...p.enlaces.map((e) => e.icono)]),
    ]),
  ];
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
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
```

(El favicon deja de copiarse: desde la Tarea 5 es el logo propio.)

- [ ] **Step 6: Descargar los íconos nuevos**

Run: `npm run iconos`
Expected: una línea `✓ <código>` por cada ícono nuevo (unos 30) y ningún error.

- [ ] **Step 7: Correr las pruebas y verificar que pasan**

Run: `npx vitest run tests/unit/placas.test.ts tests/unit/iconos.test.ts`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/lib/placas.ts src/config.ts scripts/iconos/descargar.ts public/iconos tests/unit/placas.test.ts tests/unit/iconos.test.ts
git commit -m "feat: placas del inicio y los íconos de subcategorías" -m "Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: Voz que dice el nombre

**Files:**
- Modify: `src/lib/sonido.ts`
- Test: `tests/unit/sonido.test.ts`

**Interfaces:**
- Consumes: nada nuevo.
- Produces:
  - `interface VozSistema { lang: string; name: string }`
  - `interface Sintetizador { getVoices(): VozSistema[]; cancel(): void; speak(frase: unknown): void }`
  - `OpcionesSonido.sintetizador?: () => Sintetizador | null`, `OpcionesSonido.crearFrase?: (texto: string, voz: VozSistema) => unknown`
  - `Sonido.hablar(texto: string): void` — no habla antes de `desbloquear()`, con el sonido apagado ni sin una voz cuyo `lang` empiece con `es`; corta la frase anterior.

- [ ] **Step 1: Escribir la prueba que falla**

En `tests/unit/sonido.test.ts`, cambiar el segundo import por:

```ts
import { CLAVE_PREFERENCIA, crearSonido, type VozSistema } from '../../src/lib/sonido';
```

y agregar al final del archivo:

```ts
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
```

(`almacenFalso` ya existe al principio del archivo y devuelve un `Storage`; se pasa como función.)

- [ ] **Step 2: Correr la prueba y verificar que falla**

Run: `npx vitest run tests/unit/sonido.test.ts`
Expected: FAIL; `sonido.hablar is not a function`.

- [ ] **Step 3: Implementar `hablar` en `src/lib/sonido.ts`**

1. Reemplazar `export interface OpcionesSonido { … }` y `export interface Sonido { … }` por:

```ts
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
```

2. Debajo de `function contextoPorDefecto() { … }`, agregar:

```ts
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
```

3. En `crearSonido`, debajo de `let contexto: AudioContext | null = null;`:

```ts
  const sintetizador = () => {
    try {
      return (op.sintetizador ?? sintetizadorPorDefecto)();
    } catch {
      return null;
    }
  };
  let desbloqueado = false;
```

4. En el objeto que devuelve `crearSonido`:
   - al principio de `desbloquear()`, agregar `desbloqueado = true;`;
   - en `alternar()`, después de `encendido = !encendido;`, agregar `if (!encendido) sintetizador()?.cancel();`;
   - agregar el método, debajo de `reproducir(efecto) { … },`:

```ts
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
```

- [ ] **Step 4: Correr la prueba y verificar que pasa**

Run: `npx vitest run tests/unit/sonido.test.ts`
Expected: PASS (las pruebas viejas y las 5 nuevas).

- [ ] **Step 5: Commit**

```bash
git add src/lib/sonido.ts tests/unit/sonido.test.ts
git commit -m "feat: la voz del sistema puede decir el nombre de una categoría" -m "Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: El atlas abre en la vista pedida

**Files:**
- Modify: `src/lib/vista.ts`, `src/components/Atlas.tsx`
- Test: `tests/unit/vista.test.ts`, `tests/e2e/atlas.spec.ts`

**Interfaces:**
- Consumes: `VistaAtlas` de `src/lib/tipos.ts`.
- Produces: `vistaDesdeUrl(busqueda: string): VistaAtlas` — devuelve la vista de `?vista=` o `'mundo'` si falta o es desconocida.

- [ ] **Step 1: Escribir las pruebas que fallan**

En `tests/unit/vista.test.ts`, cambiar el import de `../../src/lib/vista` por:

```ts
import { aCoordenadasMapa, acercar, desplazar, interpolarCaja, limitarCaja, MUNDO, vistaDesdeUrl } from '../../src/lib/vista';
```

y agregar al final:

```ts
describe('vistaDesdeUrl', () => {
  it('lee la vista de la dirección', () => {
    expect(vistaDesdeUrl('?vista=africa')).toBe('africa');
    expect(vistaDesdeUrl('?q=1&vista=oceania')).toBe('oceania');
  });

  it('usa el mundo si falta o es desconocida', () => {
    expect(vistaDesdeUrl('')).toBe('mundo');
    expect(vistaDesdeUrl('?vista=marte')).toBe('mundo');
    expect(vistaDesdeUrl('?vista=')).toBe('mundo');
  });
});
```

En `tests/e2e/atlas.spec.ts`, agregar `import { readFileSync } from 'node:fs';` debajo de los imports y estas pruebas al final:

```ts
test('?vista=africa abre el atlas acercado a África', async ({ page }) => {
  const vistas = JSON.parse(readFileSync('src/data/atlas/vistas.json', 'utf8')) as Record<string, number[]>;
  await page.goto('/atlas?vista=africa');
  await expect(page.locator('astro-island:has(.atlas)')).not.toHaveAttribute('ssr');
  await expect(page.getByRole('group', { name: 'Mapa del mundo' })).toHaveAttribute('viewBox', vistas.africa.join(' '));
});

test('una vista desconocida muestra el mundo', async ({ page }) => {
  await page.goto('/atlas?vista=marte');
  await expect(page.locator('astro-island:has(.atlas)')).not.toHaveAttribute('ssr');
  await expect(page.getByRole('group', { name: 'Mapa del mundo' })).toHaveAttribute('viewBox', '0 0 960 500');
});
```

- [ ] **Step 2: Correr la prueba unitaria y verificar que falla**

Run: `npx vitest run tests/unit/vista.test.ts`
Expected: FAIL; `vistaDesdeUrl is not a function`.

- [ ] **Step 3: Implementar**

En `src/lib/vista.ts`, cambiar el import por `import type { Caja, VistaAtlas } from './tipos';` y agregar al final:

```ts
const VISTAS: readonly VistaAtlas[] = ['mundo', 'africa', 'america', 'asia', 'europa', 'oceania'];

/** Vista inicial del atlas a partir de `?vista=`; cualquier otro valor da el mundo. */
export function vistaDesdeUrl(busqueda: string): VistaAtlas {
  const vista = new URLSearchParams(busqueda).get('vista');
  return VISTAS.find((v) => v === vista) ?? 'mundo';
}
```

En `src/components/Atlas.tsx`:
- cambiar el import de `../lib/vista` por `import { aCoordenadasMapa, acercar, desplazar, interpolarCaja, vistaDesdeUrl } from '../lib/vista';`;
- reemplazar `useEffect(() => () => cancelAnimationFrame(animacion.current), []);` por:

```tsx
  useEffect(() => {
    // Se aplica después de hidratar para no desalinear el HTML del servidor (que siempre muestra el mundo).
    const inicial = vistaDesdeUrl(location.search);
    if (inicial !== 'mundo') setCaja(vistas[inicial]);
    return () => cancelAnimationFrame(animacion.current);
  }, []);
```

- [ ] **Step 4: Correr las pruebas y verificar que pasan**

Run: `npx vitest run tests/unit/vista.test.ts`
Expected: PASS.

Run: `npx playwright test tests/e2e/atlas.spec.ts`
Expected: PASS (las 5 pruebas viejas y las 2 nuevas, en los proyectos escritorio y tablet).

- [ ] **Step 5: Commit**

```bash
git add src/lib/vista.ts src/components/Atlas.tsx tests/unit/vista.test.ts tests/e2e/atlas.spec.ts
git commit -m "feat: el atlas abre en la vista que pide ?vista=" -m "Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: Paleta, piezas globales, logo y curvas

**Files:**
- Modify (reescritos): `src/styles/tokens.css`, `src/styles/global.css`, `public/favicon.svg`
- Create: `src/components/Logo.astro`, `src/components/Curvas.astro`
- Test: `tests/unit/contraste.test.ts` (reescrito)

**Interfaces:**
- Consumes: nada.
- Produces:
  - Tokens CSS de la sección 7 de la spec, más `--boton-naranja-1`, `--boton-naranja-2`, `--fuente`, `--reflejo`, `--sombra`, `--ancho-max`.
  - Clases globales: `.pagina`, `.hoja`, `.titulo-pagina`, `.titulo-articulo`, `.redondo` (+ `.centro`, `.casa`, `.flecha`, `.claro`, `.chico`), `.boton` (naranja) y `.boton.azul`, `.boton-grande`, `.placa`, `.placa-mini`, `.panel-azul`, `.enlaces-azules`, `.cuadro`, `.recuadro-naranja`, `.visualmente-oculto`, `.saltar`, estilos del buscador (`.buscador`, `.ir`, `.sugerencias`).
  - `<Logo tam?: number />` (SVG propio, decorativo).
  - `<Curvas variante: 'inicio' | 'esquina' | 'franja' | 'azul' />` (SVG decorativo, `position: absolute`, `z-index: 0`).
  - Regla: `[hidden] { display: none !important; }`.
- Nota: la spec nombra tres variantes de curvas (`naranja`, `franja`, `azul`); `naranja` se divide en `inicio` (escenario completo) y `esquina` (resto de las páginas).

- [ ] **Step 1: Reescribir la prueba de contraste (falla)**

`tests/unit/contraste.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

const tokens = readFileSync('src/styles/tokens.css', 'utf8');

function token(nombre: string): string {
  const m = new RegExp(`--${nombre}:\\s*([^;]+);`).exec(tokens);
  if (!m) throw new Error(`Falta el token --${nombre}`);
  return m[1].trim();
}

function rgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as [number, number, number];
}

function luminancia([r, g, b]: [number, number, number]): number {
  const canal = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * canal(r) + 0.7152 * canal(g) + 0.0722 * canal(b);
}

function contraste(a: string, b: string): number {
  const [l1, l2] = [luminancia(rgb(a)), luminancia(rgb(b))].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

const BLANCO = '#ffffff';

describe('contraste de la paleta', () => {
  it('los títulos naranjas se leen sobre blanco como texto grande (3:1)', () => {
    expect(contraste(token('naranja-titulo'), BLANCO)).toBeGreaterThanOrEqual(3);
  });

  it('el texto de la barra se lee sobre sus tres verdes (4.5:1)', () => {
    for (const v of ['verde-claro', 'verde', 'verde-oscuro']) {
      expect(contraste(token('verde-texto'), token(v)), v).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('el texto blanco se lee sobre los azules (4.5:1)', () => {
    for (const a of ['azul-panel-1', 'azul-panel-2', 'azul-elegido']) {
      expect(contraste(BLANCO, token(a)), a).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('la subcategoría elegida se lee (4.5:1)', () => {
    expect(contraste(token('amarillo-elegido'), token('azul-elegido'))).toBeGreaterThanOrEqual(4.5);
  });

  it('el texto de las placas se lee sobre todo su amarillo, normal y activo (4.5:1)', () => {
    for (const fondo of ['amarillo-1', 'amarillo-2', 'amarillo-3', 'amarillo-4']) {
      expect(contraste(token('placa-texto'), token(fondo)), fondo).toBeGreaterThanOrEqual(4.5);
      expect(contraste(token('placa-texto-activo'), token(fondo)), fondo).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('el texto de los botones naranjas se lee (4.5:1)', () => {
    for (const fondo of ['boton-naranja-1', 'boton-naranja-2']) {
      expect(contraste(token('texto'), token(fondo)), fondo).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('enlaces, títulos de recuadro y textos se leen sobre blanco (4.5:1)', () => {
    for (const t of ['enlace', 'recuadro-titulo', 'texto', 'texto-suave']) {
      expect(contraste(token(t), BLANCO), t).toBeGreaterThanOrEqual(4.5);
    }
  });
});
```

Run: `npx vitest run tests/unit/contraste.test.ts`
Expected: FAIL con «Falta el token --naranja-titulo».

- [ ] **Step 2: Reescribir `src/styles/tokens.css`**

```css
:root {
  --fuente: Verdana, Tahoma, 'DejaVu Sans', sans-serif;

  /* Barra superior */
  --verde-claro: #c9f56a;
  --verde: #9be626;
  --verde-oscuro: #7fd014;
  --verde-borde: #5cae0c;
  --verde-texto: #1a5200;

  /* Títulos y adornos */
  --naranja-titulo: #e06a00;
  --naranja: #ff7800;
  --naranja-claro: #ffa31a;
  --boton-naranja-1: #ffb347;
  --boton-naranja-2: #ff8a00;

  /* Placas */
  --amarillo-1: #fffbb0;
  --amarillo-2: #fff35a;
  --amarillo-3: #ffe600;
  --amarillo-4: #ffd900;
  --placa-borde: #86cf2c;
  --placa-texto: #111111;
  --placa-texto-activo: #0b5fb8;

  /* Paneles azules */
  --azul-panel-1: #1a74d6;
  --azul-panel-2: #0a5fc8;
  --azul-elegido: #0a4fa8;
  --amarillo-elegido: #ffc233;
  --amarillo-paso: #ffb400;

  /* Texto */
  --texto: #111111;
  --texto-suave: #4a4a4a;
  --enlace: #0033ff;
  --fondo: #ffffff;
  --foco: #111111;

  /* Recuadros de imagen */
  --recuadro-borde: #ff6600;
  --recuadro-borde-activo: #52c3fc;
  --recuadro-fondo-activo: #dcf3fe;
  --recuadro-titulo: #0033cc;
  --miniatura-borde: #ff9900;

  /* Barras de desplazamiento */
  --scroll-1: #8ee01e;
  --scroll-2: #a7ec2b;

  --reflejo: linear-gradient(to bottom, rgb(255 255 255 / 0.55), rgb(255 255 255 / 0.1) 48%, transparent 52%);
  --sombra: 0 3px 6px rgb(0 0 0 / 0.25);
  --ancho-max: 1024px;
}
```

- [ ] **Step 3: Correr la prueba de contraste y verificar que pasa**

Run: `npx vitest run tests/unit/contraste.test.ts`
Expected: PASS (7 pruebas).

- [ ] **Step 4: Reescribir `src/styles/global.css`**

```css
*,
*::before,
*::after {
  box-sizing: border-box;
}

[hidden] {
  display: none !important;
}

html {
  scrollbar-color: var(--scroll-1) var(--scroll-2);
}

body {
  margin: 0;
  min-height: 100vh;
  font-family: var(--fuente);
  color: var(--texto);
  background: var(--fondo);
  line-height: 1.5;
}

h1,
h2,
h3 {
  font-weight: normal;
  line-height: 1.2;
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
  outline: 3px dashed var(--foco);
  outline-offset: 3px;
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

.visualmente-oculto {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}

/* ---------- Páginas ---------- */

.pagina {
  position: relative;
  overflow: hidden;
  min-height: calc(100vh - 66px);
}

.hoja {
  position: relative;
  z-index: 1;
  max-width: var(--ancho-max);
  margin: 0 auto;
  padding: 0 16px 32px;
}

.titulo-pagina {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 66px;
  margin: 0;
  font-size: 2.5rem;
  color: var(--naranja-titulo);
  text-shadow: 0 1px 0 #fff;
}

.titulo-articulo {
  margin: 0;
  font-size: 1.75rem;
  color: var(--naranja-titulo);
}

/* ---------- Botón redondo (barra) ---------- */

.redondo {
  width: 50px;
  height: 50px;
  flex: none;
  display: grid;
  place-items: center;
  padding: 0;
  border: 0;
  border-radius: 50%;
  cursor: pointer;
  text-decoration: none;
  background: radial-gradient(circle at 50% 35%, #e9ffc4 0 20%, #8fdc2a 60%, #4fa80c 100%);
  box-shadow: inset 0 0 0 3px var(--verde-borde), 0 2px 3px rgb(0 0 0 / 0.25);
}

.redondo .centro {
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: radial-gradient(circle at 50% 30%, #ffffff, #d8f5b0);
  box-shadow: inset 0 -3px 6px rgb(0 0 0 / 0.2), inset 0 3px 4px rgb(255 255 255 / 0.6);
}

.redondo.casa .centro {
  background: radial-gradient(circle at 50% 30%, #8fd0ff, #1f7fe0);
}

.redondo.flecha .centro {
  background: radial-gradient(circle at 50% 30%, #ffd08a, #ff7a00);
}

.redondo.chico {
  width: 40px;
  height: 40px;
}

.redondo.chico .centro {
  width: 28px;
  height: 28px;
}

.redondo:hover {
  filter: brightness(1.08);
}

.redondo:active {
  transform: translateY(1px);
}

.redondo[aria-current='page'] {
  box-shadow: inset 0 0 0 3px var(--naranja), 0 2px 3px rgb(0 0 0 / 0.25);
}

@media (max-width: 767px) {
  .redondo {
    width: 44px;
    height: 44px;
  }
  .redondo .centro {
    width: 32px;
    height: 32px;
  }
  .redondo.chico {
    width: 38px;
    height: 38px;
  }
  .redondo.chico .centro {
    width: 26px;
    height: 26px;
  }
}

/* ---------- Botones con brillo ---------- */

.boton {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  min-height: 48px;
  padding: 0.35rem 1rem 0.35rem 0.5rem;
  border: 0;
  border-radius: 10px;
  font: bold 1rem/1.15 var(--fuente);
  color: var(--texto);
  text-align: left;
  text-decoration: none;
  cursor: pointer;
  background: var(--reflejo), linear-gradient(to bottom, var(--boton-naranja-1), var(--boton-naranja-2));
  box-shadow: inset 0 0 0 2px rgb(255 255 255 / 0.7), var(--sombra);
}

.boton.azul {
  color: #fff;
  background: linear-gradient(to bottom, var(--azul-panel-1), var(--azul-panel-2));
  box-shadow: inset 0 2px 0 rgb(255 255 255 / 0.35), inset 0 0 0 2px rgb(255 255 255 / 0.5), var(--sombra);
}

.boton:hover {
  filter: brightness(1.06);
}

.boton:active {
  transform: translateY(1px);
}

.boton-grande {
  min-height: 56px;
  font-size: 1.15rem;
}

/* Texto en dos renglones, como los botones del original. */
.boton > span {
  max-width: 8.5em;
}

/* ---------- Placa amarilla ---------- */

.placa {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-height: 44px;
  padding: 0.4rem 0.8rem;
  border: 3px solid var(--placa-borde);
  border-radius: 6px;
  font: bold 1.0625rem/1.15 var(--fuente);
  color: var(--placa-texto);
  text-align: left;
  text-decoration: none;
  cursor: pointer;
  background: linear-gradient(to bottom, var(--amarillo-1), var(--amarillo-2) 40%, var(--amarillo-3) 60%, var(--amarillo-4));
  box-shadow: var(--sombra), inset 0 2px 0 rgb(255 255 255 / 0.7);
}

.placa:hover,
.placa:focus-visible {
  color: var(--placa-texto-activo);
}

.placa-mini {
  min-height: 40px;
  padding: 0.2rem 0.75rem;
  border-width: 2px;
  font-size: 0.9375rem;
}

/* ---------- Panel azul y sus enlaces ---------- */

.panel-azul {
  --foco: #ffffff;
  position: relative;
  color: #fff;
  border-radius: 12px;
  background: linear-gradient(to bottom, var(--azul-panel-1), var(--azul-panel-2));
  box-shadow: var(--sombra);
}

.enlaces-azules {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 10px;
}

.enlaces-azules a {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 44px;
  font-size: 1.125rem;
  font-weight: bold;
  line-height: 1.2;
  color: #fff;
  text-decoration: none;
}

.enlaces-azules a:hover {
  color: var(--amarillo-paso);
  text-decoration: underline;
}

.cuadro {
  width: 44px;
  height: 42px;
  flex: none;
  display: grid;
  place-items: center;
  border: 1px solid #0b5fc4;
  border-radius: 3px;
  background: linear-gradient(#5fb4ff, #1f86ee);
}

/* ---------- Recuadro naranja ---------- */

.recuadro-naranja {
  background: #fff;
  border: 2px solid var(--recuadro-borde);
  border-radius: 12px;
  padding: 12px 16px;
}

/* ---------- Buscador ---------- */

.buscador {
  position: relative;
  display: flex;
  align-items: center;
  gap: 6px;
}

.buscador input {
  width: 300px;
  height: 34px;
  padding: 0 14px;
  border: 3px solid var(--verde-borde);
  border-radius: 17px;
  font: inherit;
  font-size: 1rem;
  background: #fff;
  box-shadow: inset 0 2px 3px rgb(0 0 0 / 0.15);
}

.buscador .ir {
  width: 34px;
  height: 34px;
  flex: none;
  display: grid;
  place-items: center;
  padding: 0;
  border: 2px solid #3f8f08;
  border-radius: 6px;
  cursor: pointer;
  background: linear-gradient(var(--verde-claro), var(--verde-borde));
}

.buscador-grande input {
  width: min(100%, 480px);
  height: 44px;
  font-size: 1.2rem;
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
  border: 3px solid var(--verde-borde);
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
  background: var(--amarillo-1);
}

.buscador .aviso {
  position: absolute;
  top: 100%;
  margin: 0.2rem 0 0;
  font-size: 0.85rem;
  color: #8a1c1c;
}

@media (max-width: 767px) {
  .buscador {
    flex: 1;
  }
  .buscador input {
    flex: 1;
    width: 100%;
  }
}

/* ---------- Movimiento reducido ---------- */

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

(Las secciones de cuestionario, atlas y resultados de búsqueda se vuelven a escribir en las Tareas 11 y 12; hasta entonces esas pantallas funcionan pero sin estilo propio.)

- [ ] **Step 5: Crear `src/components/Logo.astro`**

```astro
---
interface Props {
  tam?: number;
}
const { tam = 40 } = Astro.props;
---
<svg class="logo-marca" viewBox="0 0 40 40" width={tam} height={tam} aria-hidden="true" focusable="false">
  <circle cx="20" cy="20" r="19" fill="#ff8a00" />
  <path d="M8 13c5-2 9-1 12 2v15c-3-3-7-4-12-2z" fill="#ffffff" />
  <path d="M32 13c-5-2-9-1-12 2v15c3-3 7-4 12-2z" fill="#ffe36b" />
</svg>
```

- [ ] **Step 6: Reemplazar `public/favicon.svg`**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><circle cx="20" cy="20" r="19" fill="#ff8a00"/><path d="M8 13c5-2 9-1 12 2v15c-3-3-7-4-12-2z" fill="#ffffff"/><path d="M32 13c-5-2-9-1-12 2v15c3-3 7-4 12-2z" fill="#ffe36b"/></svg>
```

- [ ] **Step 7: Crear `src/components/Curvas.astro`**

```astro
---
interface Props {
  variante: 'inicio' | 'esquina' | 'franja' | 'azul';
}
const { variante } = Astro.props;
const id = `curvas-${variante}`;
const azul = variante === 'azul';
---
{
  variante === 'inicio' ? (
    <svg class="curvas curvas-inicio" viewBox="0 0 1024 600" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={`${id}-1`} x1="0" x2="1" y1="0" y2="0.3">
          <stop offset="0" stop-color="#ff7a00" />
          <stop offset="0.45" stop-color="#ffa31a" />
          <stop offset="0.78" stop-color="#ffd9a0" />
          <stop offset="1" stop-color="#ffffff" />
        </linearGradient>
        <linearGradient id={`${id}-2`} x1="0" x2="1">
          <stop offset="0" stop-color="#ffb000" />
          <stop offset="0.7" stop-color="#ffcf70" />
          <stop offset="1" stop-color="#ffffff" stop-opacity="0" />
        </linearGradient>
      </defs>
      <path d="M0 0H1024V120C840 230 620 300 400 380 250 432 120 462 0 470Z" fill={`url(#${id}-1)`} />
      <path d="M0 470C180 455 420 400 640 330 800 280 930 240 1024 230V300C900 330 760 400 600 470 420 540 220 560 0 560Z" fill={`url(#${id}-2)`} opacity="0.9" />
      <path d="M0 330C260 300 560 250 1024 150V175C560 280 260 335 0 365Z" fill="#ffffff" opacity="0.22" />
      <path d="M0 210C300 190 600 150 1024 60V75C600 170 300 210 0 230Z" fill="#ffffff" opacity="0.18" />
      <path d="M0 520C300 500 600 470 1024 330V600H0Z" fill="#ffffff" />
    </svg>
  ) : (
    <svg class={`curvas curvas-${variante}`} viewBox="0 0 800 533" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={`${id}-1`} x1="0" x2="1">
          <stop offset="0" stop-color={azul ? '#0a7cff' : '#ff8a00'} />
          <stop offset="0.55" stop-color={azul ? '#7cc4ff' : '#ffc066'} />
          <stop offset="1" stop-color="#ffffff" stop-opacity="0" />
        </linearGradient>
      </defs>
      <path d="M0 60C200 40 450 40 680 50 520 70 300 120 140 220 90 250 40 300 0 330Z" fill={`url(#${id}-1)`} />
      <path d="M0 180C150 140 350 110 600 100 380 140 200 220 60 330 30 360 10 400 0 430Z" fill={`url(#${id}-1)`} opacity="0.7" />
      <path d="M0 140C200 110 420 95 640 92V98C420 102 200 125 0 160Z" fill="#ffffff" opacity="0.35" />
    </svg>
  )
}

<style>
  .curvas {
    position: absolute;
    left: 0;
    top: 0;
    z-index: 0;
    pointer-events: none;
  }
  .curvas-inicio {
    width: 100%;
    height: 100%;
  }
  .curvas-esquina,
  .curvas-azul {
    width: min(800px, 100%);
    height: 533px;
  }
  /* En el artículo, la curva queda debajo del título para no tapar el texto. */
  .curvas-franja {
    top: 54px;
    width: 100%;
    height: 92px;
    opacity: 0.55;
  }
</style>
```

- [ ] **Step 8: Verificar el build**

Run: `npm test && npm run build`
Expected: todas las pruebas unitarias en verde (la vieja `guia.test.ts` sigue pasando hasta la Tarea 6) y el build termina sin errores. Las páginas se ven sin el estilo viejo; es esperado.

- [ ] **Step 9: Commit**

```bash
git add src/styles/tokens.css src/styles/global.css src/components/Logo.astro src/components/Curvas.astro public/favicon.svg tests/unit/contraste.test.ts
git commit -m "feat: paleta de Mi Primera Encarta, piezas globales, logo propio y curvas" -m "Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 6: Barra verde y layout (se van la ventana, Lumi y Baloo 2)

**Files:**
- Create: `src/components/Barra.astro`, `tests/e2e/barra.spec.ts`
- Modify: `src/layouts/Base.astro`, `src/components/BotonSonido.astro`, `src/components/Buscador.tsx`, `src/components/Cuestionario.tsx`, `src/components/ResultadosBusqueda.tsx`, `src/pages/articulo/[slug].astro`, `src/pages/juegos/index.astro`, `src/pages/acerca.astro`, `src/config.ts`, `package.json`, `package-lock.json`, `tests/e2e/busqueda.spec.ts`
- Delete: `src/components/Ventana.astro`, `src/components/Guia.astro`, `src/components/BarraHerramientas.astro`, `src/lib/guia.ts`, `tests/unit/guia.test.ts`, `tests/e2e/guia.spec.ts`

**Interfaces:**
- Consumes: clases globales y `Logo` (Tarea 5); `ICONOS`, `SITIO` de `src/config.ts`.
- Produces:
  - `<Barra />` dentro de `<header class="barra" transition:persist="barra">`, con `<nav aria-label="Barra de herramientas">`; botones «Atrás» y «Adelante» (`data-accion`), enlace «Inicio», botón «Mostrar el buscador» (`.lupa`, solo en celular), buscador (`.buscador-barra`), botón «Sonido», enlace «Acerca de» y logo.
  - `Base.astro` con `Props { titulo: string; pantalla: Pantalla; descripcion?: string }` (sin `mensajesGuia`); `<main id="contenido" class="contenido" data-pantalla=…>` a todo el ancho.
  - `SITIO.logo: readonly ['Mi Primera', 'Enciclopedia']`; sale `SITIO.personaje`.
  - El botón de enviar del buscador tiene clase `ir` y la flecha `27A1`.

- [ ] **Step 1: Escribir la prueba de extremo a extremo que falla**

`tests/e2e/barra.spec.ts`:

```ts
import { test, expect } from '@playwright/test';
import { revisarAccesibilidad } from './ayuda';

const barra = (page: import('@playwright/test').Page) => page.getByRole('navigation', { name: 'Barra de herramientas' });

test('la barra verde está en todas las páginas y persiste al navegar', async ({ page }) => {
  await page.goto('/acerca');
  await expect(page.locator('header.barra')).toBeVisible();
  await page.evaluate(() => {
    (window as unknown as { barra: Element | null }).barra = document.querySelector('header.barra');
  });
  await barra(page).getByRole('link', { name: 'Inicio' }).click();
  await expect(page).toHaveURL(/\/$/);
  expect(await page.evaluate(() => (window as unknown as { barra: Element | null }).barra === document.querySelector('header.barra'))).toBe(true);
});

test('Atrás vuelve a la página anterior', async ({ page }) => {
  await page.goto('/');
  await barra(page).getByRole('link', { name: 'Acerca de' }).click();
  await expect(page).toHaveURL(/\/acerca$/);
  await barra(page).getByRole('button', { name: 'Atrás' }).click();
  await expect(page).toHaveURL(/\/$/);
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

test('ya no hay ventana estilo Vista ni personaje guía', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.barra-titulo')).toHaveCount(0);
  await expect(page.locator('.guia')).toHaveCount(0);
});

test('la barra no tiene problemas graves de accesibilidad', async ({ page }) => {
  await page.goto('/acerca');
  await revisarAccesibilidad(page);
});

test.describe('en celular', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('la lupa despliega el buscador', async ({ page }) => {
    await page.goto('/');
    const campo = barra(page).getByRole('combobox');
    await expect(campo).toBeHidden();
    await barra(page).getByRole('button', { name: 'Mostrar el buscador' }).click();
    await expect(campo).toBeVisible();
    await expect(campo).toBeFocused();
  });

  test('sin JavaScript el buscador se ve siempre', async ({ browser }) => {
    const contexto = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
    const pagina = await contexto.newPage();
    await pagina.goto('/');
    await expect(barra(pagina).getByRole('combobox')).toBeVisible();
    await contexto.close();
  });
});
```

En `tests/e2e/busqueda.spec.ts`, borrar la línea `await expect(page.locator('#globo-guia')).toContainText('no encontré nada');`.

Run: `npx playwright test tests/e2e/barra.spec.ts`
Expected: FAIL (no existe `header.barra`).

- [ ] **Step 2: Actualizar `src/config.ts`**

Reemplazar el objeto `SITIO` por:

```ts
export const SITIO = {
  nombre: 'Mi Primera Enciclopedia',
  lema: 'Explora, aprende y juega',
  homenaje: 'Homenaje a Mi Primera Encarta (2009). Proyecto no afiliado a Microsoft.',
  /** El nombre en dos renglones, para el logo. */
  logo: ['Mi Primera', 'Enciclopedia'],
} as const;
```

- [ ] **Step 3: Crear `src/components/Barra.astro`**

```astro
---
import Buscador from './Buscador.tsx';
import BotonSonido from './BotonSonido.astro';
import Icono from './Icono.astro';
import Logo from './Logo.astro';
import { ICONOS, SITIO } from '../config';
---
<header class="barra" transition:persist="barra">
  <nav class="barra-interior" aria-label="Barra de herramientas">
    <a class="redondo casa" href="/" data-destino="/" aria-label="Inicio"><span class="centro"><Icono codigo={ICONOS.inicio} tam={26} /></span></a>
    <button type="button" class="redondo flecha" data-accion="atras" aria-label="Atrás"><span class="centro"><Icono codigo={ICONOS.atras} tam={24} /></span></button>
    <button type="button" class="redondo flecha chico solo-ancho" data-accion="adelante" aria-label="Adelante"><span class="centro"><Icono codigo={ICONOS.adelante} tam={18} /></span></button>
    <button type="button" class="redondo claro lupa" aria-label="Mostrar el buscador" aria-expanded="false" aria-controls="ranura-buscador"><span class="centro"><Icono codigo={ICONOS.buscar} tam={22} /></span></button>
    <div class="ranura-buscador" id="ranura-buscador">
      <span class="rotulo" aria-hidden="true">Buscar</span>
      <Buscador client:idle />
    </div>
    <BotonSonido />
    <a class="redondo claro chico" href="/acerca" data-destino="/acerca" aria-label="Acerca de"><span class="centro"><Icono codigo={ICONOS.acerca} tam={18} /></span></a>
    <a class="logo" href="/"><Logo tam={40} /><span class="nombre"><small>{SITIO.logo[0]}</small>{' '}<strong>{SITIO.logo[1]}</strong></span></a>
  </nav>
  <noscript><style is:inline>.barra .ranura-buscador { display: flex !important; } .barra .lupa { display: none !important; }</style></noscript>
</header>

<script>
  function marcarActual() {
    for (const a of document.querySelectorAll<HTMLAnchorElement>('.barra [data-destino]')) {
      if (a.dataset.destino === location.pathname) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    }
  }
  document.addEventListener('astro:page-load', marcarActual);
  document.addEventListener('click', (e) => {
    const objetivo = e.target as Element;
    const accion = objetivo.closest<HTMLButtonElement>('.barra [data-accion]');
    if (accion) {
      if (accion.dataset.accion === 'atras') history.back();
      else history.forward();
      return;
    }
    const lupa = objetivo.closest<HTMLButtonElement>('.barra .lupa');
    if (!lupa) return;
    const abrir = lupa.getAttribute('aria-expanded') !== 'true';
    lupa.setAttribute('aria-expanded', String(abrir));
    lupa.closest('.barra')?.classList.toggle('buscando', abrir);
    if (abrir) document.querySelector<HTMLInputElement>('.barra .ranura-buscador input')?.focus();
  });
</script>

<style>
  .barra {
    position: sticky;
    top: 0;
    z-index: 50;
    background:
      linear-gradient(to bottom, rgb(255 255 255 / 0.45), rgb(255 255 255 / 0) 50%),
      linear-gradient(to bottom, var(--verde-claro), var(--verde) 45%, var(--verde-oscuro));
    border-bottom: 2px solid var(--verde-borde);
  }
  .barra-interior {
    max-width: var(--ancho-max);
    min-height: 64px;
    margin: 0 auto;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 7px 14px;
  }
  .lupa {
    display: none;
  }
  .ranura-buscador {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-left: 14px;
  }
  .rotulo {
    font-size: 1.3125rem;
    color: var(--verde-texto);
    text-shadow: 0 1px 0 rgb(255 255 255 / 0.6);
  }
  .logo {
    margin-left: auto;
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--texto);
    text-decoration: none;
    line-height: 1;
  }
  .nombre small {
    display: block;
    font-size: 0.8125rem;
  }
  .nombre strong {
    display: block;
    font-size: 1.375rem;
    font-style: italic;
    font-weight: 900;
    letter-spacing: -0.5px;
  }
  @media (max-width: 767px) {
    .barra-interior {
      flex-wrap: wrap;
      gap: 6px;
      padding: 6px 8px;
    }
    .solo-ancho {
      display: none;
    }
    .lupa {
      display: grid;
    }
    .ranura-buscador {
      display: none;
      order: 10;
      flex-basis: 100%;
      margin: 0;
    }
    .barra.buscando .ranura-buscador {
      display: flex;
    }
    .rotulo {
      display: none;
    }
    .nombre small {
      font-size: 0.6875rem;
    }
    .nombre strong {
      font-size: 1rem;
    }
  }
  @media (max-width: 419px) {
    .nombre {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip: rect(0 0 0 0);
      white-space: nowrap;
    }
  }
</style>
```

- [ ] **Step 4: Adaptar `BotonSonido.astro` y `Buscador.tsx`**

`src/components/BotonSonido.astro`: reemplazar el `<button>` por:

```astro
<button type="button" class="redondo claro chico boton-sonido" aria-pressed="true" aria-label="Sonido">
  <span class="centro"><span class="con-sonido"><Icono codigo={ICONOS.sonido} tam={18} /></span><span class="sin-sonido"><Icono codigo={ICONOS.silencio} tam={18} /></span></span>
</button>
```

y agregar dentro de su `<style>`:

```css
  .con-sonido,
  .sin-sonido {
    display: grid;
  }
```

`src/components/Buscador.tsx`: reemplazar el botón de enviar por:

```tsx
      <button type="submit" class="ir" aria-label="Buscar" disabled={deshabilitado}>
        <img src="/iconos/27A1.svg" width={22} height={22} alt="" />
      </button>
```

- [ ] **Step 5: Reescribir `src/layouts/Base.astro`**

```astro
---
import '../styles/tokens.css';
import '../styles/global.css';
import { ClientRouter } from 'astro:transitions';
import Barra from '../components/Barra.astro';
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
    <Barra />
    <main id="contenido" class="contenido" data-pantalla={pantalla}>
      <slot />
    </main>
    <script>
      import { sonido } from '../lib/sonido-sitio';

      document.addEventListener('pointerdown', () => sonido.desbloquear());
      document.addEventListener('keydown', () => sonido.desbloquear());
      document.addEventListener('click', (e) => {
        if ((e.target as Element).closest('a, button')) sonido.reproducir('clic');
      });
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
    </script>
  </body>
</html>
```

- [ ] **Step 6: Quitar a Lumi de las islas y las páginas**

`src/components/Cuestionario.tsx`:
- borrar `import type { Pose } from '../lib/guia';`;
- borrar la función `hablar(texto: string, pose: Pose) { … }` completa;
- borrar las dos llamadas: `hablar(acierto ? '¡Muy bien!' : …);` en `elegir` y `hablar(\`¡Terminaste! …\`, 'celebra');` en `avanzar`.

`src/components/ResultadosBusqueda.tsx`: borrar el bloque `if (q.trim() && !encontrados.length) { document.dispatchEvent(…); }` completo (el aviso ya se muestra en la página).

`src/pages/articulo/[slug].astro`: cambiar `<Base titulo={articulo.titulo} pantalla="articulo" descripcion={articulo.resumen} mensajesGuia={datos}>` por `<Base titulo={articulo.titulo} pantalla="articulo" descripcion={articulo.resumen}>`.

`src/pages/juegos/index.astro`: borrar la línea `const datos = …;` y cambiar `<Base titulo="Juegos" pantalla="juegos" mensajesGuia={datos}>` por `<Base titulo="Juegos" pantalla="juegos">`.

`src/pages/acerca.astro`: reemplazar las dos últimas líneas de la lista `.creditos` (la de Baloo 2 y la del personaje guía) por esta única línea:

```astro
    <li><strong>Diseño y código:</strong> originales de este proyecto, dibujados con CSS y SVG propios a partir de la composición de Mi Primera Encarta; el código tiene licencia MIT.</li>
```

- [ ] **Step 7: Borrar lo que ya no se usa**

```bash
git rm src/components/Ventana.astro src/components/Guia.astro src/components/BarraHerramientas.astro src/lib/guia.ts tests/unit/guia.test.ts tests/e2e/guia.spec.ts
npm uninstall @fontsource/baloo-2
grep -rn "guia\|Guia\|Ventana\|BarraHerramientas\|baloo\|personaje\|mensajesGuia" src/components src/layouts src/lib src/pages src/config.ts tests scripts/*.ts scripts/iconos scripts/cuestionarios
```

Expected: el `grep` no imprime nada.

- [ ] **Step 8: Correr las pruebas y verificar que pasan**

Run: `npm test`
Expected: PASS (sin `guia.test.ts`).

Run: `npx playwright test tests/e2e/barra.spec.ts tests/e2e/busqueda.spec.ts`
Expected: PASS en escritorio y tablet.

- [ ] **Step 9: Commit**

```bash
git add -A src tests package.json package-lock.json
git commit -m "feat: barra verde con botones redondos; se van la ventana Vista, Lumi y Baloo 2" -m "Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 7: Inicio con placas y panel azul

**Files:**
- Create: `src/components/Placas.astro`
- Modify (reescrito): `src/pages/index.astro`
- Test (reescrito): `tests/e2e/inicio.spec.ts`

**Interfaces:**
- Consumes: `placasInicio()` y `PlacaInicio` (Tarea 2); `sonido.hablar` (Tarea 3); `Curvas`, `Logo`, clases `.placa`, `.panel-azul`, `.enlaces-azules`, `.cuadro` (Tarea 5).
- Produces: `<Placas placas={PlacaInicio[]} />`. Marcado: `.inicio > .escenario > .lienzo` con `.columna.izquierda`/`.columna.derecha` de `a.placa.placa-inicio[data-placa][data-voz]`, `h1.portada` y `#panel-placas` con un `ul.enlaces-azules.enlaces-panel[data-de]` por placa. En anchos ≥ 768 px, el script convierte cada placa en `role="button"` con `aria-expanded` y `aria-controls="panel-placas"`.

- [ ] **Step 1: Escribir las pruebas que fallan**

`tests/e2e/inicio.spec.ts`:

```ts
import { test, expect, type Page } from '@playwright/test';
import { revisarAccesibilidad } from './ayuda';

/** Espera a que el script del inicio convierta las placas en botones. */
async function abrirInicio(page: Page) {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Animales' })).toHaveAttribute('aria-expanded', 'false');
}

test('Inicio muestra las 10 placas en dos columnas', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.placa-inicio')).toHaveCount(10);
  await expect(page.locator('.columna.izquierda .placa-inicio')).toHaveText(['Animales', 'Planeta Tierra', 'Espacio', 'Cuerpo humano', 'Historia']);
  await expect(page.locator('.columna.derecha .placa-inicio')).toHaveText(['Arte y música', 'Ciencia y tecnología', 'Países', 'Atlas', 'Juega y aprende']);
  await expect(page.getByRole('heading', { level: 1, name: 'Mi Primera Enciclopedia' })).toBeVisible();
});

test('clic en una placa abre el panel con sus subcategorías', async ({ page }) => {
  await abrirInicio(page);
  const animales = page.getByRole('button', { name: 'Animales' });
  await animales.click();
  await expect(animales).toHaveAttribute('aria-expanded', 'true');
  const panel = page.locator('#panel-placas');
  await expect(panel).toBeVisible();
  await expect(panel.getByRole('link')).toHaveText(['Mamíferos', 'Aves', 'Reptiles y dinosaurios', 'Animales del mar', 'Insectos']);
  await panel.getByRole('link', { name: 'Aves' }).click();
  await expect(page).toHaveURL(/\/categoria\/animales\/aves$/);
});

test('otra placa cambia el panel y solo una queda abierta', async ({ page }) => {
  await abrirInicio(page);
  await page.getByRole('button', { name: 'Animales' }).click();
  await page.getByRole('button', { name: 'Atlas' }).click();
  await expect(page.locator('.placa-inicio[aria-expanded="true"]')).toHaveCount(1);
  await expect(page.locator('#panel-placas').getByRole('link').first()).toHaveText('Mundo');
});

test('con el teclado: Enter abre el panel y Escape lo cierra', async ({ page }) => {
  await abrirInicio(page);
  const espacio = page.getByRole('button', { name: 'Espacio' });
  await espacio.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#panel-placas').getByRole('link', { name: 'Sistema solar' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.locator('#panel-placas')).toBeHidden();
  await expect(espacio).toBeFocused();
});

test('al volver al inicio con Atrás se puede abrir otra placa', async ({ page }) => {
  await abrirInicio(page);
  await page.getByRole('button', { name: 'Animales' }).click();
  await page.locator('#panel-placas').getByRole('link', { name: 'Aves' }).click();
  await expect(page).toHaveURL(/\/categoria\/animales\/aves$/);
  await page.goBack();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator('#panel-placas')).toBeHidden();
  await page.getByRole('button', { name: 'Espacio' }).click();
  await expect(page.locator('.placa-inicio[aria-expanded="true"]')).toHaveCount(1);
  await expect(page.locator('#panel-placas').getByRole('link').first()).toHaveText('Sistema solar');
});

test('al pasar a celular con el panel abierto, la placa lleva a su categoría', async ({ page }) => {
  await abrirInicio(page);
  await page.getByRole('button', { name: 'Animales' }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator('#panel-placas')).toBeHidden();
  await page.getByRole('link', { name: 'Planeta Tierra' }).click();
  await expect(page).toHaveURL(/\/categoria\/planeta-tierra$/);
});

test('al pasar el mouse, la voz dice el nombre después del primer clic', async ({ page }) => {
  await page.addInitScript(() => {
    const dichas: string[] = [];
    (window as unknown as { dichas: string[] }).dichas = dichas;
    Object.defineProperty(window, 'speechSynthesis', {
      configurable: true,
      value: {
        getVoices: () => [{ lang: 'es-ES', name: 'Prueba' }],
        cancel() {},
        speak(f: { text: string }) {
          dichas.push(f.text);
        },
      },
    });
  });
  await abrirInicio(page);
  await page.mouse.click(4, 400);
  await page.getByRole('button', { name: 'Espacio' }).hover();
  await expect.poll(() => page.evaluate(() => (window as unknown as { dichas: string[] }).dichas)).toContain('Espacio');
});

test('sin JavaScript la placa lleva a su categoría', async ({ browser }) => {
  const contexto = await browser.newContext({ javaScriptEnabled: false });
  const pagina = await contexto.newPage();
  await pagina.goto('/');
  await pagina.getByRole('link', { name: 'Animales' }).click();
  await expect(pagina).toHaveURL(/\/categoria\/animales$/);
  await contexto.close();
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

test('Inicio no tiene problemas graves de accesibilidad, cerrado y abierto', async ({ page }) => {
  await abrirInicio(page);
  await revisarAccesibilidad(page);
  await page.getByRole('button', { name: 'Historia' }).click();
  await revisarAccesibilidad(page);
});

test.describe('en celular', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('las placas van en una columna y llevan directo a la categoría', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#panel-placas')).toBeHidden();
    const animales = page.getByRole('link', { name: 'Animales' });
    await expect(animales).not.toHaveAttribute('role', 'button');
    await animales.click();
    await expect(page).toHaveURL(/\/categoria\/animales$/);
  });
});
```

Run: `npx playwright test tests/e2e/inicio.spec.ts`
Expected: FAIL (no hay `.placa-inicio`).

- [ ] **Step 2: Crear `src/components/Placas.astro`**

```astro
---
import Curvas from './Curvas.astro';
import Icono from './Icono.astro';
import Logo from './Logo.astro';
import { SITIO } from '../config';
import type { PlacaInicio } from '../lib/placas';

interface Props {
  placas: PlacaInicio[];
}
const { placas } = Astro.props;
const columnas = [
  { lado: 'izquierda', placas: placas.slice(0, 5) },
  { lado: 'derecha', placas: placas.slice(5) },
];
---
<section class="inicio">
  <Curvas variante="inicio" />
  <div class="escenario">
    <div class="lienzo" data-elegida="">
      {
        columnas.map((c) => (
          <ul class={`columna ${c.lado}`}>
            {c.placas.map((p) => (
              <li>
                <a class="placa placa-inicio" href={p.href} data-placa={p.id} data-voz={p.nombre}><Icono codigo={p.icono} tam={60} /><span>{p.nombre}</span></a>
              </li>
            ))}
          </ul>
        ))
      }
      <div class="centro">
        <h1 class="portada"><Logo tam={92} /><small>{SITIO.logo[0]}</small>{' '}<strong>{SITIO.logo[1]}</strong></h1>
        <div class="panel-azul panel-placas" id="panel-placas" hidden>
          {
            placas.map((p) => (
              <ul class="enlaces-azules enlaces-panel" data-de={p.id} aria-label={p.nombre} hidden>
                {p.enlaces.map((e) => (
                  <li>
                    <a href={e.href}><span class="cuadro"><Icono codigo={e.icono} tam={34} /></span><span>{e.nombre}</span></a>
                  </li>
                ))}
              </ul>
            ))
          }
        </div>
      </div>
    </div>
  </div>
</section>

<script>
  import { sonido } from '../lib/sonido-sitio';

  const ANCHO = '(min-width: 768px)';

  function partes() {
    const lienzo = document.querySelector<HTMLElement>('.inicio .lienzo');
    if (!lienzo) return null;
    return {
      lienzo,
      panel: lienzo.querySelector<HTMLElement>('#panel-placas')!,
      placas: [...lienzo.querySelectorAll<HTMLAnchorElement>('.placa-inicio')],
    };
  }

  function cerrar(devolverFoco = false) {
    const p = partes();
    if (!p) return;
    const elegida = p.lienzo.dataset.elegida;
    p.lienzo.dataset.elegida = '';
    p.lienzo.classList.remove('abierto');
    p.panel.hidden = true;
    for (const placa of p.placas) if (placa.hasAttribute('aria-expanded')) placa.setAttribute('aria-expanded', 'false');
    if (devolverFoco && elegida) p.placas.find((placa) => placa.dataset.placa === elegida)?.focus();
  }

  function abrir(id: string, enfocar: boolean) {
    const p = partes();
    if (!p) return;
    p.lienzo.dataset.elegida = id;
    p.lienzo.classList.add('abierto');
    p.panel.hidden = false;
    for (const lista of p.panel.querySelectorAll<HTMLElement>('.enlaces-panel')) lista.hidden = lista.dataset.de !== id;
    for (const placa of p.placas) placa.setAttribute('aria-expanded', String(placa.dataset.placa === id));
    if (enfocar) p.panel.querySelector<HTMLAnchorElement>(`.enlaces-panel[data-de="${id}"] a`)?.focus();
  }

  /** En escritorio y tablet las placas abren el panel; en celular son enlaces comunes. */
  function preparar() {
    const p = partes();
    if (!p) return;
    const ancho = matchMedia(ANCHO).matches;
    for (const placa of p.placas) {
      if (ancho) {
        placa.setAttribute('role', 'button');
        placa.setAttribute('aria-controls', 'panel-placas');
        placa.setAttribute('aria-expanded', 'false');
      } else {
        placa.removeAttribute('role');
        placa.removeAttribute('aria-controls');
        placa.removeAttribute('aria-expanded');
      }
    }
    cerrar();
  }

  document.addEventListener('astro:page-load', preparar);
  matchMedia(ANCHO).addEventListener('change', preparar);

  document.addEventListener('click', (e) => {
    const placa = (e.target as Element).closest('.placa-inicio[role="button"]') as HTMLAnchorElement | null;
    if (!placa) return;
    e.preventDefault();
    if (placa.getAttribute('aria-expanded') === 'true') cerrar();
    // detail === 0: el clic vino del teclado (Enter), así que el foco pasa al panel.
    else abrir(placa.dataset.placa!, e.detail === 0);
  });

  document.addEventListener('keydown', (e) => {
    const placa = (e.target as Element).closest?.('.placa-inicio[role="button"]') as HTMLAnchorElement | null | undefined;
    if (placa && e.key === ' ') {
      e.preventDefault();
      abrir(placa.dataset.placa!, true);
      return;
    }
    if (e.key === 'Escape' && partes()?.lienzo.dataset.elegida) cerrar(true);
  });

  let ultima: Element | null = null;
  document.addEventListener('pointerover', (e) => {
    const placa = (e.target as Element).closest?.('.placa-inicio') ?? null;
    if (placa === ultima) return;
    ultima = placa;
    if (placa instanceof HTMLElement) sonido.hablar(placa.dataset.voz ?? '');
  });
  document.addEventListener('focusin', (e) => {
    const placa = (e.target as Element).closest?.('.placa-inicio');
    if (placa instanceof HTMLElement) sonido.hablar(placa.dataset.voz ?? '');
  });
</script>

<style>
  .inicio {
    position: relative;
    overflow: hidden;
  }
  .escenario {
    position: relative;
    z-index: 1;
    max-width: var(--ancho-max);
    margin: 0 auto;
    container-type: inline-size;
  }
  /* --u es un píxel del escenario original de 1024×600: todo se escala con el ancho. */
  .lienzo {
    --u: calc(100cqw / 1024);
    position: relative;
    height: calc(600 * var(--u));
  }
  .columna {
    position: absolute;
    top: calc(12 * var(--u));
    width: calc(214 * var(--u));
    margin: 0;
    padding: 0;
    list-style: none;
    display: grid;
    gap: calc(8 * var(--u));
    perspective: calc(500 * var(--u));
  }
  .izquierda {
    left: calc(116 * var(--u));
  }
  .derecha {
    left: calc(694 * var(--u));
  }
  .lienzo .placa-inicio {
    height: calc(82 * var(--u));
    min-height: 0;
    padding: 0 calc(10 * var(--u));
    gap: calc(8 * var(--u));
    border-width: calc(3 * var(--u));
    font-size: calc(17 * var(--u));
    transform: rotateY(-14deg);
  }
  .izquierda .placa-inicio {
    transform-origin: right center;
  }
  .derecha .placa-inicio {
    transform-origin: left center;
    flex-direction: row-reverse;
    justify-content: space-between;
  }
  .lienzo .placa-inicio :global(img) {
    width: calc(60 * var(--u));
    height: calc(60 * var(--u));
    flex: none;
    filter: drop-shadow(0 2px 2px rgb(0 0 0 / 0.3));
  }
  .lienzo .placa-inicio[aria-expanded='true'],
  .lienzo .placa-inicio[aria-expanded='true']:hover {
    position: relative;
    z-index: 2;
    transform: none;
    color: #fff;
    border-color: var(--azul-elegido);
    background: linear-gradient(to bottom, var(--azul-panel-1), var(--azul-panel-2));
  }
  .lienzo .izquierda .placa-inicio[aria-expanded='true']::after,
  .lienzo .derecha .placa-inicio[aria-expanded='true']::before {
    content: '';
    position: absolute;
    top: 50%;
    translate: 0 -50%;
    border-block: calc(20 * var(--u)) solid transparent;
  }
  .lienzo .izquierda .placa-inicio[aria-expanded='true']::after {
    left: 100%;
    border-left: calc(18 * var(--u)) solid var(--azul-elegido);
  }
  .lienzo .derecha .placa-inicio[aria-expanded='true']::before {
    right: 100%;
    border-right: calc(18 * var(--u)) solid var(--azul-elegido);
  }
  .centro {
    position: absolute;
    left: calc(330 * var(--u));
    width: calc(364 * var(--u));
    top: 0;
    height: calc(470 * var(--u));
  }
  .portada {
    margin: calc(110 * var(--u)) 0 0;
    display: grid;
    justify-items: center;
    text-align: center;
    line-height: 1;
  }
  .portada :global(svg) {
    width: calc(92 * var(--u));
    height: calc(92 * var(--u));
  }
  .portada small {
    font-size: calc(30 * var(--u));
    font-weight: bold;
    color: #222;
  }
  .portada strong {
    font-size: calc(50 * var(--u));
    font-style: italic;
    font-weight: 900;
    letter-spacing: calc(-2 * var(--u));
  }
  .lienzo.abierto .portada {
    opacity: 0;
  }
  .panel-placas {
    position: absolute;
    inset: calc(4 * var(--u)) calc(12 * var(--u)) calc(14 * var(--u));
    padding: calc(64 * var(--u)) calc(22 * var(--u)) 0;
    border-radius: calc(10 * var(--u)) calc(10 * var(--u)) calc(16 * var(--u)) calc(16 * var(--u));
  }
  .panel-placas .enlaces-azules {
    gap: calc(12 * var(--u));
  }
  .panel-placas a {
    font-size: max(14px, calc(18 * var(--u)));
  }
  @media (max-width: 767px) {
    .lienzo {
      height: auto;
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 16px;
    }
    .centro {
      position: static;
      width: auto;
      height: auto;
      order: -1;
    }
    .portada {
      margin: 0 0 8px;
    }
    .portada :global(svg) {
      width: 56px;
      height: 56px;
    }
    .portada small {
      font-size: 1.1rem;
    }
    .portada strong {
      font-size: 1.9rem;
      letter-spacing: -1px;
    }
    .panel-placas {
      display: none !important;
    }
    .columna {
      position: static;
      width: auto;
      gap: 8px;
      perspective: none;
    }
    .lienzo .placa-inicio {
      height: 64px;
      padding: 0 12px;
      gap: 10px;
      border-width: 3px;
      font-size: 1.05rem;
      transform: none;
    }
    .derecha .placa-inicio {
      flex-direction: row;
      justify-content: flex-start;
    }
    .lienzo .placa-inicio :global(img) {
      width: 48px;
      height: 48px;
    }
  }
</style>
```

- [ ] **Step 3: Reescribir `src/pages/index.astro`**

```astro
---
import Base from '../layouts/Base.astro';
import Placas from '../components/Placas.astro';
import { placasInicio } from '../lib/placas';
---
<Base titulo="Inicio" pantalla="inicio">
  <Placas placas={placasInicio()} />
</Base>
```

- [ ] **Step 4: Correr las pruebas y verificar que pasan**

Run: `npx playwright test tests/e2e/inicio.spec.ts`
Expected: PASS en escritorio y tablet. Si `/acerca` o la 404 fallan solo por axe (contraste), se resuelve en la Tarea 12; no deberían fallar porque ya usan la paleta nueva.

- [ ] **Step 5: Commit**

```bash
git add src/components/Placas.astro src/pages/index.astro tests/e2e/inicio.spec.ts
git commit -m "feat: inicio con placas amarillas, panel azul de subcategorías y voz" -m "Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 8: Páginas de categoría y Juega y aprende

**Files:**
- Create: `src/components/MenuSubcategorias.astro`, `src/components/CeldaTema.astro`, `src/components/PaginaCategoria.astro`, `src/components/VistaCategoria.astro`, `src/pages/categoria/[slug]/[sub].astro`, `tests/e2e/categoria.spec.ts`
- Modify (reescritos): `src/pages/categoria/[slug].astro`, `src/pages/juegos/index.astro`; `src/lib/tipos.ts`; `tests/e2e/juegos.spec.ts`
- Delete: `src/components/TarjetaArticulo.astro`

**Interfaces:**
- Consumes: `subcategoriasDe`, `Subcategoria` (Tarea 1); `imagenDe` (`src/lib/medios.ts`); `Curvas`, clases globales (Tarea 5).
- Produces:
  - En `src/lib/tipos.ts`: `interface EnlaceMenu { nombre: string; icono: string; href: string; actual: boolean }` y `interface Celda { href: string; titulo: string; icono: string; imagen?: ImageMetadata }`.
  - `<MenuSubcategorias titulo enlaces />` → `nav.menu-sub.panel-azul[aria-label="Subcategorías de <titulo>"]`; el actual con `aria-current="page"`.
  - `<CeldaTema {...Celda} />` → `a.celda-tema` con `.miniatura` (foto) o `.miniatura.vacia` (ícono).
  - `<PaginaCategoria titulo icono enlaces celdas />` y `<VistaCategoria categoria actual articulos />`.
  - Rutas: `/categoria/<cat>` (primera subcategoría) y `/categoria/<cat>/<sub>`.

- [ ] **Step 1: Escribir las pruebas que fallan**

`tests/e2e/categoria.spec.ts`:

```ts
import { test, expect } from '@playwright/test';
import { revisarAccesibilidad } from './ayuda';

test('la categoría muestra su primera subcategoría y sus temas', async ({ page }) => {
  await page.goto('/categoria/animales');
  await expect(page.getByRole('heading', { level: 1, name: 'Animales' })).toBeVisible();
  const menu = page.getByRole('navigation', { name: 'Subcategorías de Animales' });
  await expect(menu.getByRole('link')).toHaveText(['Mamíferos', 'Aves', 'Reptiles y dinosaurios', 'Animales del mar', 'Insectos']);
  await expect(menu.getByRole('link', { name: 'Mamíferos' })).toHaveAttribute('aria-current', 'page');
  await expect(page.locator('.celda-tema')).toHaveText(['León', 'Elefante', 'Ballena', 'Delfín', 'Gato', 'Perro', 'Lobo', 'Ornitorrinco']);
});

test('otra subcategoría muestra sus propios temas', async ({ page }) => {
  await page.goto('/categoria/animales/aves');
  await expect(page.getByRole('navigation', { name: 'Subcategorías de Animales' }).getByRole('link', { name: 'Aves' })).toHaveAttribute('aria-current', 'page');
  await expect(page.locator('.celda-tema')).toHaveText(['Guacamayo', 'Pingüino']);
});

test('un artículo sin foto usa el ícono de su subcategoría', async ({ page }) => {
  await page.goto('/categoria/animales');
  await expect(page.locator('.celda-tema', { hasText: 'Lobo' }).locator('.vacia img')).toHaveAttribute('src', '/iconos/1F418.svg');
});

test('una subcategoría inexistente da 404', async ({ page }) => {
  const respuesta = await page.goto('/categoria/animales/no-existe');
  expect(respuesta?.status()).toBe(404);
});

test('de la cuadrícula al artículo y Atrás', async ({ page }) => {
  await page.goto('/categoria/animales');
  await page.locator('.celda-tema', { hasText: 'León' }).click();
  await expect(page).toHaveURL(/\/articulo\/leon$/);
  await page.getByRole('button', { name: 'Atrás' }).click();
  await expect(page).toHaveURL(/\/categoria\/animales$/);
});

test('la categoría no tiene problemas graves de accesibilidad', async ({ page }) => {
  await page.goto('/categoria/animales/aves');
  await revisarAccesibilidad(page);
});

test.describe('en celular', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('las subcategorías van en una fila', async ({ page }) => {
    await page.goto('/categoria/animales');
    const caja = await page.getByRole('navigation', { name: 'Subcategorías de Animales' }).boundingBox();
    expect(caja!.height).toBeLessThan(90);
  });
});
```

En `tests/e2e/juegos.spec.ts`, reemplazar todas las apariciones de `page.locator('.juego')` por `page.locator('.celda-tema')` y agregar al final:

```ts
test('Juega y aprende no tiene problemas graves de accesibilidad', async ({ page }) => {
  await page.goto('/juegos');
  await expect(page.getByRole('heading', { level: 1, name: 'Juega y aprende' })).toBeVisible();
  await revisarAccesibilidad(page);
});
```

Run: `npx playwright test tests/e2e/categoria.spec.ts`
Expected: FAIL (no hay menú de subcategorías).

- [ ] **Step 2: Agregar los tipos a `src/lib/tipos.ts`**

Al principio del archivo, debajo del import existente: `import type { ImageMetadata } from 'astro';`. Al final:

```ts
export interface EnlaceMenu {
  nombre: string;
  icono: string;
  href: string;
  actual: boolean;
}

export interface Celda {
  href: string;
  titulo: string;
  /** Ícono de respaldo (y el que se muestra si no hay imagen). */
  icono: string;
  imagen?: ImageMetadata;
}
```

- [ ] **Step 3: Crear `src/components/MenuSubcategorias.astro`**

```astro
---
import Icono from './Icono.astro';
import type { EnlaceMenu } from '../lib/tipos';

interface Props {
  titulo: string;
  enlaces: EnlaceMenu[];
}
const { titulo, enlaces } = Astro.props;
---
<nav class="menu-sub panel-azul" aria-label={`Subcategorías de ${titulo}`}>
  <ul class="enlaces-azules">
    {
      enlaces.map((e) => (
        <li>
          <a href={e.href} aria-current={e.actual ? 'page' : undefined}><span class="cuadro"><Icono codigo={e.icono} tam={34} /></span><span>{e.nombre}</span></a>
        </li>
      ))
    }
  </ul>
</nav>

<style>
  .menu-sub {
    padding: 12px 0;
  }
  .menu-sub a {
    position: relative;
    padding: 4px 12px;
  }
  .menu-sub a[aria-current='page'] {
    color: var(--amarillo-elegido);
    background: var(--azul-elegido);
  }
  .menu-sub a[aria-current='page']::after {
    content: '';
    position: absolute;
    left: 100%;
    top: 0;
    bottom: 0;
    width: 22px;
    background: var(--azul-elegido);
    clip-path: polygon(0 0, 100% 50%, 0 100%);
  }
  @media (max-width: 767px) {
    .menu-sub {
      padding: 8px;
      overflow-x: auto;
    }
    .menu-sub ul {
      display: flex;
      gap: 8px;
    }
    .menu-sub a {
      white-space: nowrap;
      border-radius: 8px;
    }
    .menu-sub a[aria-current='page']::after {
      display: none;
    }
  }
</style>
```

- [ ] **Step 4: Crear `src/components/CeldaTema.astro`**

```astro
---
import { Image } from 'astro:assets';
import Icono from './Icono.astro';
import type { Celda } from '../lib/tipos';

type Props = Celda;
const { href, titulo, icono, imagen } = Astro.props;
---
<a class="celda-tema" href={href}>
  {
    imagen ? (
      <Image src={imagen} alt="" width={128} class="miniatura" data-respaldo={`/iconos/${icono}.svg`} />
    ) : (
      <span class="miniatura vacia"><Icono codigo={icono} tam={48} /></span>
    )
  }
  <span class="titulo">{titulo}</span>
</a>

<style>
  .celda-tema {
    width: 106px;
    min-height: 124px;
    display: grid;
    justify-items: center;
    align-content: start;
    gap: 6px;
    padding: 8px 2px;
    border-radius: 8px;
    color: var(--texto);
    font-size: 0.8125rem;
    line-height: 1.2;
    text-align: center;
    text-decoration: none;
  }
  .celda-tema:hover,
  .celda-tema:focus-visible {
    background: linear-gradient(to bottom, #ffd27a 0%, #ffad1f 45%, #ff9500 55%, #ffb640 100%);
    box-shadow: inset 0 0 0 1px #e07800, var(--sombra);
  }
  .celda-tema :global(.miniatura) {
    width: 64px;
    height: 64px;
    object-fit: cover;
    border: 1px solid #000;
    background: #fff;
  }
  .vacia {
    display: grid;
    place-items: center;
    background: var(--recuadro-fondo-activo);
  }
  @media (max-width: 767px) {
    .celda-tema {
      width: auto;
    }
  }
</style>
```

- [ ] **Step 5: Crear `src/components/PaginaCategoria.astro` y `VistaCategoria.astro`**

`src/components/PaginaCategoria.astro`:

```astro
---
import CeldaTema from './CeldaTema.astro';
import Curvas from './Curvas.astro';
import Icono from './Icono.astro';
import MenuSubcategorias from './MenuSubcategorias.astro';
import type { Celda, EnlaceMenu } from '../lib/tipos';

interface Props {
  titulo: string;
  icono: string;
  enlaces: EnlaceMenu[];
  celdas: Celda[];
}
const { titulo, icono, enlaces, celdas } = Astro.props;
---
<div class="pagina">
  <Curvas variante="esquina" />
  <div class="hoja">
    <h1 class="titulo-pagina"><Icono codigo={icono} tam={48} />{titulo}</h1>
    <div class="categoria">
      <MenuSubcategorias titulo={titulo} enlaces={enlaces} />
      {
        celdas.length ? (
          <ul class="rejilla">
            {celdas.map((c) => (
              <li>
                <CeldaTema {...c} />
              </li>
            ))}
          </ul>
        ) : (
          <p>Todavía no hay temas aquí.</p>
        )
      }
    </div>
  </div>
</div>

<style>
  .categoria {
    display: grid;
    grid-template-columns: 236px 1fr;
    gap: 36px;
    align-items: start;
    margin-top: 12px;
  }
  .rejilla {
    list-style: none;
    margin: 0;
    padding: 4px 0 0;
    display: grid;
    grid-template-columns: repeat(auto-fill, 112px);
    gap: 10px 6px;
  }
  @media (max-width: 767px) {
    .categoria {
      grid-template-columns: 1fr;
      gap: 16px;
    }
    .rejilla {
      grid-template-columns: repeat(3, 1fr);
    }
  }
</style>
```

`src/components/VistaCategoria.astro`:

```astro
---
import PaginaCategoria from './PaginaCategoria.astro';
import { imagenDe } from '../lib/medios';
import { subcategoriasDe } from '../lib/subcategorias';
import type { CategoriaSlug } from '../config';
import type { Subcategoria } from '../data/subcategorias';
import type { Articulo, Celda, EnlaceMenu } from '../lib/tipos';

interface Props {
  categoria: { slug: CategoriaSlug; nombre: string; icono: string };
  actual: Subcategoria;
  articulos: Articulo[];
}
const { categoria, actual, articulos } = Astro.props;
const porSlug = new Map(articulos.map((a) => [a.slug, a]));
const enlaces: EnlaceMenu[] = subcategoriasDe(categoria.slug).map((s) => ({
  nombre: s.nombre,
  icono: s.icono,
  href: `/categoria/${categoria.slug}/${s.slug}`,
  actual: s.slug === actual.slug,
}));
const celdas: Celda[] = actual.articulos.flatMap((slug) => {
  const a = porSlug.get(slug);
  if (!a) return [];
  return [{ href: `/articulo/${a.slug}`, titulo: a.titulo, icono: actual.icono, imagen: a.principal ? imagenDe(a.principal.archivo) : undefined }];
});
---
<PaginaCategoria titulo={categoria.nombre} icono={categoria.icono} enlaces={enlaces} celdas={celdas} />
```

- [ ] **Step 6: Reescribir las páginas**

`src/pages/categoria/[slug].astro`:

```astro
---
import { getCollection } from 'astro:content';
import Base from '../../layouts/Base.astro';
import VistaCategoria from '../../components/VistaCategoria.astro';
import { CATEGORIAS } from '../../config';
import { subcategoriasDe } from '../../lib/subcategorias';
import type { Articulo } from '../../lib/tipos';

export async function getStaticPaths() {
  const articulos = (await getCollection('articulos')).map((e) => e.data as Articulo);
  return CATEGORIAS.map((categoria) => ({ params: { slug: categoria.slug }, props: { categoria, articulos } }));
}

const { categoria, articulos } = Astro.props;
const actual = subcategoriasDe(categoria.slug)[0];
---
<Base titulo={categoria.nombre} pantalla="categoria">
  <VistaCategoria categoria={categoria} actual={actual} articulos={articulos} />
</Base>
```

`src/pages/categoria/[slug]/[sub].astro`:

```astro
---
import { getCollection } from 'astro:content';
import Base from '../../../layouts/Base.astro';
import VistaCategoria from '../../../components/VistaCategoria.astro';
import { CATEGORIAS } from '../../../config';
import { subcategoriasDe } from '../../../lib/subcategorias';
import type { Articulo } from '../../../lib/tipos';

export async function getStaticPaths() {
  const articulos = (await getCollection('articulos')).map((e) => e.data as Articulo);
  return CATEGORIAS.flatMap((categoria) =>
    subcategoriasDe(categoria.slug).map((actual) => ({
      params: { slug: categoria.slug, sub: actual.slug },
      props: { categoria, actual, articulos },
    })),
  );
}

const { categoria, actual, articulos } = Astro.props;
---
<Base titulo={`${actual.nombre} · ${categoria.nombre}`} pantalla="categoria">
  <VistaCategoria categoria={categoria} actual={actual} articulos={articulos} />
</Base>
```

`src/pages/juegos/index.astro`:

```astro
---
import { getCollection } from 'astro:content';
import Base from '../../layouts/Base.astro';
import PaginaCategoria from '../../components/PaginaCategoria.astro';
import { CATEGORIAS, ICONOS, categoriaPorSlug } from '../../config';
import type { Celda, Cuestionario, EnlaceMenu } from '../../lib/tipos';

const orden = CATEGORIAS.map((c) => c.slug as string);
const cuestionarios = (await getCollection('cuestionarios'))
  .map((e) => e.data as Cuestionario)
  .sort((a, b) => orden.indexOf(a.categoria) - orden.indexOf(b.categoria));
const enlaces: EnlaceMenu[] = [{ nombre: 'Cuestionarios', icono: ICONOS.cuestionarios, href: '/juegos', actual: true }];
const celdas: Celda[] = cuestionarios.map((c) => ({
  href: `/juegos/cuestionario/${c.slug}`,
  titulo: c.titulo,
  icono: categoriaPorSlug(c.categoria)!.icono,
}));
---
<Base titulo="Juega y aprende" pantalla="juegos">
  <PaginaCategoria titulo="Juega y aprende" icono={ICONOS.juegos} enlaces={enlaces} celdas={celdas} />
</Base>
```

- [ ] **Step 7: Borrar la tarjeta vieja**

```bash
git rm src/components/TarjetaArticulo.astro
grep -rn "TarjetaArticulo" src
```

Expected: el `grep` no imprime nada.

- [ ] **Step 8: Correr las pruebas y verificar que pasan**

Run: `npm test && npx playwright test tests/e2e/categoria.spec.ts tests/e2e/juegos.spec.ts`
Expected: PASS. (`juegos.spec.ts` juega el cuestionario sin estilo nuevo todavía; basta con que pase.)

- [ ] **Step 9: Commit**

```bash
git add -A src tests
git commit -m "feat: categorías con menú azul de subcategorías y cuadrícula de temas" -m "Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 9: Artículo

**Files:**
- Create: `src/components/RecuadroMedio.astro`, `src/components/SabiasQue.astro`
- Modify: `src/lib/articulos.ts`, `src/components/Bloques.astro`, `src/pages/articulo/[slug].astro` (reescrito)
- Delete: `src/components/PanelMultimedia.astro`
- Test: `tests/unit/articulos.test.ts`, `tests/e2e/articulo.spec.ts` (reescrito)

**Interfaces:**
- Consumes: `subcategoriaDe` (Tarea 1); `ICONOS.imagenes`, `ICONOS.video`, `ICONOS.estrella`, `ICONOS.sonido`; `Curvas` (Tarea 5).
- Produces:
  - `mediosDe(a: Pick<Articulo, 'principal' | 'medios'>): Medio[]` — la principal primero, sin repetir archivos.
  - `<RecuadroMedio medio href respaldo />` → `a.recuadro[data-astro-reload]` (recarga completa para que `:target` funcione en la galería).
  - `<SabiasQue texto />` → `aside.sabias-que`.
  - El botón «Contempla las imágenes» enlaza a `/articulo/<slug>/imagenes`; cada recuadro, a `/articulo/<slug>/imagenes#medio-<n>` (n desde 1, en el orden de `mediosDe`).

- [ ] **Step 1: Escribir las pruebas que fallan**

En `tests/unit/articulos.test.ts`, cambiar el import de `../../src/lib/articulos` por `import { deCategoria, mediosDe, ordenarPorTitulo, textoLicencia } from '../../src/lib/articulos';`, agregar `Medio` al import de tipos (`import type { Articulo, Medio } from '../../src/lib/tipos';`) y agregar al final:

```ts
describe('mediosDe', () => {
  const m = (archivo: string): Medio => ({
    archivo,
    tipo: 'imagen',
    alt: archivo,
    autor: 'Ana',
    licencia: 'cc-by',
    licenciaUrl: '',
    fuenteUrl: `https://commons.wikimedia.org/wiki/File:${archivo}`,
  });

  it('pone la principal primero y no repite archivos', () => {
    expect(mediosDe({ principal: m('a.jpg'), medios: [m('b.jpg'), m('a.jpg'), m('c.jpg')] }).map((x) => x.archivo)).toEqual(['a.jpg', 'b.jpg', 'c.jpg']);
  });

  it('funciona sin principal y sin medios', () => {
    expect(mediosDe({ medios: [m('b.jpg')] }).map((x) => x.archivo)).toEqual(['b.jpg']);
    expect(mediosDe({ medios: [] })).toEqual([]);
  });
});
```

`tests/e2e/articulo.spec.ts`:

```ts
import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { revisarAccesibilidad } from './ayuda';

const explicacionesLeon = (
  JSON.parse(readFileSync('src/content/cuestionarios/animales.json', 'utf8')) as { preguntas: { articulo: string; explicacion: string }[] }
).preguntas
  .filter((p) => p.articulo === 'leon')
  .map((p) => p.explicacion);

test('de la categoría al artículo sin recargar la barra', async ({ page }) => {
  await page.goto('/categoria/animales');
  await page.evaluate(() => {
    (window as unknown as { barra: Element | null }).barra = document.querySelector('header.barra');
  });
  await page.locator('.celda-tema', { hasText: 'León' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'León' })).toBeVisible();
  expect(await page.evaluate(() => (window as unknown as { barra: Element | null }).barra === document.querySelector('header.barra'))).toBe(true);
});

test('el artículo muestra texto, recuadros, dato curioso, relacionados y prueba', async ({ page }) => {
  await page.goto('/articulo/leon');
  await expect(page.locator('.miga')).toContainText('Animales');
  await expect(page.locator('.miga')).toContainText('Mamíferos');
  await expect(page.locator('.texto-articulo p').first()).not.toBeEmpty();
  await expect(page.locator('.recuadro')).toHaveCount(2);
  await expect(page.getByRole('link', { name: /Contempla las imágenes/ })).toHaveAttribute('href', '/articulo/leon/imagenes');
  const dato = (await page.locator('.sabias-que p').textContent())!.trim();
  expect(explicacionesLeon).toContain(dato);
  await expect(page.locator('.relacionados a')).toHaveText(['India', 'México', 'Abeja']);
  await expect(page.getByRole('link', { name: /Pon a prueba lo que sabes/ })).toHaveAttribute('href', '/juegos/cuestionario/animales');
  await expect(page.locator('.atribucion')).toContainText('de Vikidia');
  await expect(page.locator('.atribucion')).toContainText('CC BY-SA 3.0');
});

test('un artículo sin imágenes no ofrece la vista de imágenes', async ({ page }) => {
  await page.goto('/articulo/lobo');
  await expect(page.getByRole('heading', { level: 1, name: 'Lobo' })).toBeVisible();
  await expect(page.getByRole('link', { name: /Contempla las imágenes/ })).toHaveCount(0);
  await expect(page.locator('.recuadro')).toHaveCount(0);
});

test('el artículo no tiene problemas graves de accesibilidad', async ({ page }) => {
  await page.goto('/articulo/mexico');
  await revisarAccesibilidad(page);
});

test.describe('en celular', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('las imágenes van debajo del texto', async ({ page }) => {
    await page.goto('/articulo/leon');
    const texto = await page.locator('.texto-articulo').boundingBox();
    const lateral = await page.locator('.lateral').boundingBox();
    expect(lateral!.y).toBeGreaterThan(texto!.y);
  });
});
```

Run: `npx vitest run tests/unit/articulos.test.ts`
Expected: FAIL; `mediosDe is not a function`.

- [ ] **Step 2: Implementar `mediosDe` en `src/lib/articulos.ts`**

Cambiar el import por `import type { Articulo, Licencia, Medio } from './tipos';` y agregar al final:

```ts
/** Medios del artículo para recuadros y galería: la imagen principal primero, sin repetir archivos. */
export function mediosDe(a: Pick<Articulo, 'principal' | 'medios'>): Medio[] {
  const vistos = new Set<string>();
  const lista: Medio[] = [];
  for (const m of [...(a.principal ? [a.principal] : []), ...a.medios]) {
    if (vistos.has(m.archivo)) continue;
    vistos.add(m.archivo);
    lista.push(m);
  }
  return lista;
}
```

Run: `npx vitest run tests/unit/articulos.test.ts`
Expected: PASS.

- [ ] **Step 3: Crear `src/components/RecuadroMedio.astro`**

```astro
---
import { Image } from 'astro:assets';
import Icono from './Icono.astro';
import { ICONOS } from '../config';
import { imagenDe } from '../lib/medios';
import { recortar } from '../lib/texto';
import type { Medio } from '../lib/tipos';

interface Props {
  medio: Medio;
  href: string;
  respaldo: string;
}
const { medio, href, respaldo } = Astro.props;
const imagen = medio.tipo === 'imagen' ? imagenDe(medio.archivo) : undefined;
const tipo = medio.tipo === 'audio' ? ICONOS.sonido : medio.tipo === 'video' ? ICONOS.video : ICONOS.buscar;
---
<a class="recuadro" href={href} data-astro-reload>
  <span class="foto">
    {
      imagen ? (
        <Image src={imagen} alt="" width={292} class="miniatura" data-respaldo={respaldo} />
      ) : (
        <span class="miniatura vacia"><Icono codigo={tipo} tam={64} /></span>
      )
    }
    <span class="tipo"><Icono codigo={tipo} tam={18} /></span>
  </span>
  <span class="titulo">{recortar(medio.alt || medio.archivo, 60)}</span>
</a>

<style>
  .recuadro {
    display: block;
    width: 170px;
    height: 206px;
    padding: 10px;
    border: 2px solid var(--recuadro-borde);
    border-radius: 12px;
    background: #fff;
    text-align: center;
    text-decoration: none;
  }
  .recuadro:hover,
  .recuadro:focus-visible {
    border-color: var(--recuadro-borde-activo);
    background: var(--recuadro-fondo-activo);
  }
  .foto {
    position: relative;
    display: block;
    width: 146px;
    height: 146px;
  }
  .recuadro :global(.miniatura) {
    display: block;
    width: 146px;
    height: 146px;
    object-fit: cover;
    border: 1px solid var(--miniatura-borde);
  }
  .recuadro:hover :global(.miniatura) {
    border-color: #66ccff;
  }
  .vacia {
    display: grid;
    place-items: center;
    background: var(--recuadro-fondo-activo);
  }
  .tipo {
    position: absolute;
    right: 4px;
    bottom: 4px;
    width: 26px;
    height: 26px;
    display: grid;
    place-items: center;
    border: 1px solid #fff;
    border-radius: 6px;
    background: linear-gradient(#ffb04a, #ff7a00);
  }
  .titulo {
    margin-top: 6px;
    font-size: 0.75rem;
    line-height: 1.2;
    color: var(--recuadro-titulo);
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }
</style>
```

- [ ] **Step 4: Crear `src/components/SabiasQue.astro`**

```astro
---
interface Props {
  texto: string;
}
const { texto } = Astro.props;
---
<aside class="sabias-que">
  <h2>¿Sabías que…?</h2>
  <p>{texto}</p>
</aside>

<style>
  .sabias-que {
    width: 100%;
    max-width: 348px;
    padding: 12px 16px;
    border: 2px solid #f0c419;
    border-radius: 12px;
    background: #fff6c2;
  }
  .sabias-que h2 {
    margin: 0 0 4px;
    font-size: 1.125rem;
    font-weight: bold;
  }
  .sabias-que p {
    margin: 0;
  }
</style>
```

- [ ] **Step 5: Actualizar los estilos de `src/components/Bloques.astro`**

Reemplazar su `<style>` por:

```astro
<style>
  .texto-articulo :global(p),
  .texto-articulo :global(li) {
    font-size: 1.125rem;
    line-height: 1.5;
  }
  .texto-articulo > :global(p:first-child) {
    font-size: 1.3125rem;
  }
  .texto-articulo :global(h2) {
    margin: 1.2em 0 0.3em;
    font-size: 1.5rem;
    color: var(--naranja-titulo);
  }
  .texto-articulo :global(h3) {
    margin: 1em 0 0.3em;
    font-size: 1.25rem;
    font-weight: bold;
  }
  .texto-articulo :global(a) {
    text-underline-offset: 2px;
  }
  .figura {
    margin: 1rem 0;
    padding: 8px;
    background: #fff;
    border: 2px solid var(--recuadro-borde);
    border-radius: 12px;
    max-width: 500px;
  }
  .figura figcaption {
    font-size: 0.9rem;
    color: var(--texto-suave);
  }
</style>
```

- [ ] **Step 6: Reescribir `src/pages/articulo/[slug].astro`**

```astro
---
import { getCollection } from 'astro:content';
import Base from '../../layouts/Base.astro';
import Atribucion from '../../components/Atribucion.astro';
import Bloques from '../../components/Bloques.astro';
import Curvas from '../../components/Curvas.astro';
import Icono from '../../components/Icono.astro';
import RecuadroMedio from '../../components/RecuadroMedio.astro';
import SabiasQue from '../../components/SabiasQue.astro';
import { ICONOS, categoriaPorSlug } from '../../config';
import { mediosDe } from '../../lib/articulos';
import { subcategoriaDe } from '../../lib/subcategorias';
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
      dato: cuestionarios.flatMap((c) => c.preguntas).find((p) => p.articulo === articulo.slug)?.explicacion,
    },
  }));
}

const { articulo, relacionados, cuestionario, dato } = Astro.props;
const categoria = categoriaPorSlug(articulo.categoria)!;
const ubicacion = subcategoriaDe(articulo.slug);
const respaldo = `/iconos/${ubicacion?.subcategoria.icono ?? categoria.icono}.svg`;
const medios = mediosDe(articulo);
---
<Base titulo={articulo.titulo} pantalla="articulo" descripcion={articulo.resumen}>
  <div class="pagina">
    <Curvas variante="franja" />
    <article class="hoja">
      <header class="cabecera">
        <div>
          <p class="miga"><a href={`/categoria/${categoria.slug}`}>{categoria.nombre}</a>{ubicacion && <>{' › '}<a href={`/categoria/${categoria.slug}/${ubicacion.subcategoria.slug}`}>{ubicacion.subcategoria.nombre}</a></>}</p>
          <h1 class="titulo-articulo">{articulo.titulo}</h1>
        </div>
        {medios.length > 0 && <a class="boton azul" href={`/articulo/${articulo.slug}/imagenes`}><Icono codigo={ICONOS.imagenes} tam={34} /><span>Contempla las imágenes</span></a>}
      </header>
      <div class="cuerpo">
        <Bloques bloques={articulo.bloques} medios={articulo.medios} respaldo={respaldo} />
        <aside class="lateral">
          {
            medios.length > 0 && (
              <ul class="recuadros">
                {medios.map((m, i) => (
                  <li>
                    <RecuadroMedio medio={m} href={`/articulo/${articulo.slug}/imagenes#medio-${i + 1}`} respaldo={respaldo} />
                  </li>
                ))}
              </ul>
            )
          }
          {dato && <SabiasQue texto={dato} />}
          {
            relacionados.length > 0 && (
              <section class="relacionados">
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
          {cuestionario && <a class="boton" href={`/juegos/cuestionario/${cuestionario}`}><Icono codigo={ICONOS.estrella} tam={30} /><span>¡Pon a prueba lo que sabes!</span></a>}
        </aside>
      </div>
      <Atribucion titulo={articulo.titulo} fuente={articulo.fuente} medios={articulo.medios} />
    </article>
  </div>
</Base>

<style>
  .cabecera {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    padding: 12px 0 8px;
  }
  .miga {
    margin: 0 0 4px;
    font-size: 0.875rem;
  }
  .cuerpo {
    display: grid;
    grid-template-columns: minmax(0, 560px) 1fr;
    gap: 24px;
    align-items: start;
  }
  .lateral {
    display: grid;
    gap: 16px;
    justify-items: start;
  }
  .recuadros {
    width: 100%;
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(auto-fill, 170px);
    gap: 8px;
  }
  .relacionados h2 {
    margin: 0 0 4px;
    font-size: 1.5rem;
    color: var(--naranja-titulo);
  }
  .relacionados ul {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .relacionados a {
    font-size: 1.125rem;
    line-height: 1.7;
  }
  @media (max-width: 767px) {
    .cabecera {
      flex-direction: column;
    }
    .cuerpo {
      grid-template-columns: 1fr;
    }
    .recuadros {
      grid-template-columns: none;
      grid-auto-flow: column;
      grid-auto-columns: 170px;
      overflow-x: auto;
      padding-bottom: 8px;
    }
  }
</style>
```

- [ ] **Step 7: Borrar el panel viejo**

```bash
git rm src/components/PanelMultimedia.astro
grep -rn "PanelMultimedia" src
```

Expected: el `grep` no imprime nada.

- [ ] **Step 8: Correr las pruebas y verificar que pasan**

Run: `npm test && npx playwright test tests/e2e/articulo.spec.ts`
Expected: PASS. (El enlace «Contempla las imágenes» todavía lleva a una página que no existe; la Tarea 10 la crea.)

- [ ] **Step 9: Commit**

```bash
git add -A src tests
git commit -m "feat: artículo con título naranja, recuadros de imagen y dato curioso" -m "Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 10: Contempla las imágenes

**Files:**
- Create: `src/pages/articulo/[slug]/imagenes.astro`, `tests/e2e/imagenes.spec.ts`

**Interfaces:**
- Consumes: `mediosDe` (Tarea 9); `RecuadroMedio` (Tarea 9); `Curvas` variante `azul` (Tarea 5); `imagenDe`, `urlPublica`; `textoLicencia`.
- Produces: `/articulo/<slug>/imagenes` solo para artículos con medios; cada medio en `figure.medio#medio-<n>` dentro de `.visor`; el visor muestra el `:target` o el primero.

- [ ] **Step 1: Escribir la prueba que falla**

`tests/e2e/imagenes.spec.ts`:

```ts
import { test, expect } from '@playwright/test';
import { revisarAccesibilidad } from './ayuda';

test('Contempla las imágenes abre la galería y Lee el artículo vuelve', async ({ page }) => {
  await page.goto('/articulo/leon');
  await page.getByRole('link', { name: /Contempla las imágenes/ }).click();
  await expect(page).toHaveURL(/\/articulo\/leon\/imagenes$/);
  await expect(page.locator('#medio-1')).toBeVisible();
  await expect(page.locator('#medio-2')).toBeHidden();
  await page.getByRole('link', { name: /Lee el artículo/ }).click();
  await expect(page).toHaveURL(/\/articulo\/leon$/);
});

test('elegir otro recuadro lo muestra grande', async ({ page }) => {
  await page.goto('/articulo/leon/imagenes');
  await page.locator('.tira .recuadro').nth(1).click();
  await expect(page).toHaveURL(/#medio-2$/);
  await expect(page.locator('#medio-2')).toBeVisible();
  await expect(page.locator('#medio-1')).toBeHidden();
});

test('al abrir con un ancla se ve ese medio', async ({ page }) => {
  await page.goto('/articulo/leon/imagenes#medio-2');
  await expect(page.locator('#medio-2')).toBeVisible();
  await expect(page.locator('#medio-1')).toBeHidden();
});

test('el recuadro del artículo abre su medio en la galería', async ({ page }) => {
  await page.goto('/articulo/leon');
  await page.locator('.recuadro').nth(1).click();
  await expect(page).toHaveURL(/\/articulo\/leon\/imagenes#medio-2$/);
  await expect(page.locator('#medio-2')).toBeVisible();
});

test('cada medio muestra su autor y licencia', async ({ page }) => {
  await page.goto('/articulo/leon/imagenes');
  const pie = page.locator('#medio-1 figcaption');
  await expect(pie).toContainText(/CC BY-SA|CC BY|CC0|Dominio público/);
  await expect(pie.getByRole('link')).toHaveAttribute('href', /^https:\/\/commons\.wikimedia\.org\//);
});

test('un artículo sin imágenes no tiene galería', async ({ page }) => {
  const respuesta = await page.goto('/articulo/lobo/imagenes');
  expect(respuesta?.status()).toBe(404);
});

test('la galería no tiene problemas graves de accesibilidad', async ({ page }) => {
  await page.goto('/articulo/leon/imagenes');
  await revisarAccesibilidad(page);
});
```

Run: `npx playwright test tests/e2e/imagenes.spec.ts`
Expected: FAIL (404 en `/articulo/leon/imagenes`).

- [ ] **Step 2: Crear `src/pages/articulo/[slug]/imagenes.astro`**

```astro
---
import { getCollection } from 'astro:content';
import { Image } from 'astro:assets';
import Base from '../../../layouts/Base.astro';
import Curvas from '../../../components/Curvas.astro';
import Icono from '../../../components/Icono.astro';
import RecuadroMedio from '../../../components/RecuadroMedio.astro';
import { ICONOS, categoriaPorSlug } from '../../../config';
import { mediosDe, textoLicencia } from '../../../lib/articulos';
import { imagenDe, urlPublica } from '../../../lib/medios';
import { subcategoriaDe } from '../../../lib/subcategorias';
import type { Articulo } from '../../../lib/tipos';

export async function getStaticPaths() {
  const articulos = (await getCollection('articulos')).map((e) => e.data as Articulo);
  return articulos.filter((a) => mediosDe(a).length > 0).map((articulo) => ({ params: { slug: articulo.slug }, props: { articulo } }));
}

const { articulo } = Astro.props;
const medios = mediosDe(articulo).map((m) => ({ medio: m, imagen: m.tipo === 'imagen' ? imagenDe(m.archivo) : undefined }));
const icono = subcategoriaDe(articulo.slug)?.subcategoria.icono ?? categoriaPorSlug(articulo.categoria)!.icono;
const respaldo = `/iconos/${icono}.svg`;
---
<Base titulo={`${articulo.titulo}: imágenes`} pantalla="articulo" descripcion={articulo.resumen}>
  <div class="pagina">
    <Curvas variante="azul" />
    <div class="hoja">
      <header class="cabecera">
        <h1 class="titulo-articulo">{articulo.titulo}</h1>
        <a class="boton" href={`/articulo/${articulo.slug}`}><Icono codigo={ICONOS.libros} tam={34} /><span>Lee el artículo</span></a>
      </header>
      <div class="galeria">
        <div class="visor">
          {
            medios.map(({ medio, imagen }, i) => (
              <figure class="medio" id={`medio-${i + 1}`}>
                {imagen ? (
                  <Image src={imagen} alt={medio.alt} width={900} data-respaldo={respaldo} />
                ) : medio.tipo === 'audio' ? (
                  <audio controls preload="none" src={urlPublica(medio.archivo)} />
                ) : (
                  <video controls preload="metadata" src={urlPublica(medio.archivo)} />
                )}
                <figcaption>{medio.alt}{' · '}<a href={medio.fuenteUrl}>{medio.autor}</a>{`, ${textoLicencia(medio.licencia)}`}</figcaption>
              </figure>
            ))
          }
        </div>
        <ul class="tira">
          {
            medios.map(({ medio }, i) => (
              <li>
                <RecuadroMedio medio={medio} href={`#medio-${i + 1}`} respaldo={respaldo} />
              </li>
            ))
          }
        </ul>
      </div>
    </div>
  </div>
</Base>

<style>
  .cabecera {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 12px 0 12px;
  }
  .galeria {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 190px;
    gap: 20px;
    align-items: start;
  }
  .visor {
    padding: 12px;
    border-radius: 12px;
    background: #fff;
    box-shadow: 0 3px 10px rgb(0 0 40 / 0.25);
    text-align: center;
  }
  .medio {
    margin: 0;
  }
  .visor :global(img) {
    width: auto;
    max-height: 60vh;
    margin: 0 auto;
  }
  .visor audio,
  .visor video {
    width: 100%;
  }
  .medio figcaption {
    margin-top: 8px;
    font-size: 0.875rem;
    color: #003366;
  }
  /* Sin JavaScript: se ve el medio del ancla, o el primero si no hay ancla. */
  .visor:has(.medio:target) .medio:not(:target),
  .visor:not(:has(.medio:target)) .medio:not(:first-child) {
    display: none;
  }
  .tira {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 10px;
  }
  @media (max-width: 767px) {
    .galeria {
      grid-template-columns: 1fr;
    }
    .tira {
      grid-auto-flow: column;
      grid-auto-columns: 170px;
      overflow-x: auto;
      padding-bottom: 8px;
    }
  }
</style>
```

- [ ] **Step 3: Correr las pruebas y verificar que pasan**

Run: `npx playwright test tests/e2e/imagenes.spec.ts tests/e2e/articulo.spec.ts`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/pages/articulo/[slug]/imagenes.astro tests/e2e/imagenes.spec.ts
git commit -m "feat: vista Contempla las imágenes sobre curvas azules" -m "Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 11: Cuestionario

**Files:**
- Modify: `src/components/Cuestionario.tsx`, `src/pages/juegos/cuestionario/[slug].astro`, `src/styles/global.css` (sección nueva al final)
- Test: `tests/e2e/juegos.spec.ts`

**Interfaces:**
- Consumes: clases `.panel-azul`, `.placa`, `.boton`, `.boton.azul`, `.recuadro-naranja` (Tarea 5); `Curvas` (Tarea 5).
- Produces: marcado del cuestionario con `ol.avance` (10 estrellas SVG decorativas), `p.progreso`, `div.panel-azul.pregunta` (foto con `.credito` y `h2`), `button.placa.opcion` con `span.marca` (✓ o ✗) y texto oculto «(correcta)»/«(incorrecta)», `div.explicacion.recuadro-naranja`.

- [ ] **Step 1: Escribir las pruebas que fallan**

En `tests/e2e/juegos.spec.ts`, dentro de la prueba `'se juega un cuestionario completo y el nombre se guarda como texto'`, justo después de `await expect(page.locator('.explicacion')).toBeVisible();`, agregar:

```ts
    await expect(page.locator('.opcion.correcta')).toContainText('✓');
    await expect(page.locator('.avance li')).toHaveCount(10);
```

y agregar al final del archivo:

```ts
test('la pregunta va en el panel azul y las respuestas son placas', async ({ page }) => {
  await page.goto('/juegos/cuestionario/animales');
  await expect(page.locator('.panel-azul.pregunta h2')).not.toBeEmpty();
  await expect(page.locator('.opcion.placa')).toHaveCount(3);
});
```

Run: `npx playwright test tests/e2e/juegos.spec.ts`
Expected: FAIL (no hay `.avance` ni `.panel-azul.pregunta`).

- [ ] **Step 2: Cambiar el marcado de `src/components/Cuestionario.tsx`**

1. Debajo de los imports, agregar:

```tsx
function Estrella() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false">
      <path d="M12 2l3 7h7l-5.5 4.5 2 7.5L12 17l-6.5 4 2-7.5L2 9h7z" />
    </svg>
  );
}
```

2. En la pantalla final (`if (juego.terminado) { … }`), cambiar los dos botones de `.acciones` por:

```tsx
        <div class="acciones">
          <button type="button" class="boton boton-grande" onClick={otraVez}>
            Jugar otra vez
          </button>
          <a class="boton azul boton-grande" href="/juegos">
            Volver a Juegos
          </a>
        </div>
```

y el botón «Guardar» del formulario por `<button type="submit" class="boton">Guardar</button>` (sin cambios de texto).

3. Reemplazar el `return (` final (la pregunta en curso) completo por:

```tsx
  return (
    <div class="cuestionario">
      <ol class="avance" aria-hidden="true">
        {juego.preguntas.map((_, i) => (
          <li class={i < juego.indice ? 'hecha' : i === juego.indice ? 'actual' : ''}>
            <Estrella />
          </li>
        ))}
      </ol>
      <p class="progreso">{`Pregunta ${juego.indice + 1} de ${juego.preguntas.length}`}</p>
      <div class="panel-azul pregunta">
        <figure class="foto">
          <img class="imagen-pregunta" src={actual.pregunta.imagenSrc} alt={actual.pregunta.imagenAlt} />
          <figcaption class="credito">
            Imagen: <a href={actual.pregunta.credito.fuenteUrl}>{actual.pregunta.credito.autor}</a>, {actual.pregunta.credito.licencia}
            {actual.pregunta.credito.licenciaUrl && (
              <>
                {' '}
                (<a href={actual.pregunta.credito.licenciaUrl}>licencia</a>)
              </>
            )}
          </figcaption>
        </figure>
        <h2 tabIndex={-1} ref={titulo}>
          {actual.pregunta.texto}
        </h2>
      </div>
      <div class="opciones" role="group" aria-label="Opciones">
        {actual.opciones.map((texto, i) => {
          const estado = !respondida ? '' : i === actual.correcta ? 'correcta' : i === juego.elegida ? 'incorrecta' : '';
          return (
            <button type="button" class={`placa opcion${estado ? ` ${estado}` : ''}`} disabled={respondida} onClick={() => elegir(i)}>
              <span class="marca" aria-hidden="true">
                {estado === 'correcta' ? '✓' : estado === 'incorrecta' ? '✗' : ''}
              </span>
              {texto}
              {estado && <span class="visualmente-oculto">{` (${estado})`}</span>}
            </button>
          );
        })}
      </div>
      {respondida && (
        <div class="explicacion recuadro-naranja" role="status">
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
```

- [ ] **Step 3: Envolver la página del cuestionario**

En `src/pages/juegos/cuestionario/[slug].astro`, agregar `import Curvas from '../../../components/Curvas.astro';` y reemplazar el contenido de `<Base …>` por:

```astro
  <div class="pagina">
    <Curvas variante="esquina" />
    <div class="hoja">
      <h1 class="titulo-pagina">{cuestionario.titulo}</h1>
      <CuestionarioIsla client:only="preact" cuestionario={vista}>
        <p slot="fallback">Cargando el cuestionario…</p>
      </CuestionarioIsla>
    </div>
  </div>
```

- [ ] **Step 4: Agregar la sección del cuestionario al final de `src/styles/global.css`**

```css
/* ---------- Cuestionario ---------- */

.cuestionario {
  max-width: 760px;
  margin: 0 auto;
  text-align: center;
}

.cuestionario .avance {
  list-style: none;
  margin: 0 0 4px;
  padding: 0;
  display: flex;
  justify-content: center;
  gap: 4px;
}

.cuestionario .avance svg {
  fill: #d6d6d6;
}

.cuestionario .avance .hecha svg {
  fill: var(--naranja);
}

.cuestionario .avance .actual svg {
  fill: var(--amarillo-elegido);
}

.cuestionario .progreso {
  margin: 0 0 8px;
  font-weight: bold;
  color: var(--texto-suave);
}

.cuestionario .pregunta {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 16px;
  align-items: center;
  padding: 16px;
  text-align: left;
}

.cuestionario .pregunta h2 {
  margin: 0;
  font-size: 1.375rem;
  font-weight: bold;
}

.cuestionario h2:focus {
  outline: none;
}

.cuestionario .foto {
  margin: 0;
}

.imagen-pregunta {
  width: 100%;
  max-height: 240px;
  object-fit: cover;
  border: 2px solid #fff;
  border-radius: 8px;
}

.cuestionario .credito {
  margin: 4px 0 0;
  font-size: 0.75rem;
}

.cuestionario .credito a {
  color: #fff;
}

.opciones {
  display: grid;
  gap: 10px;
  margin: 16px 0;
}

.opcion {
  width: 100%;
  min-height: 56px;
  justify-content: center;
  font-size: 1.125rem;
}

.opcion:disabled {
  cursor: default;
}

.opcion .marca {
  min-width: 1.2em;
  font-size: 1.4rem;
}

.opcion.correcta {
  border-color: #2e7d1a;
  background: linear-gradient(to bottom, #e3ffd6, #9fe57a);
}

.opcion.incorrecta {
  border-color: #b42a48;
  background: linear-gradient(to bottom, #ffe6e6, #ffaaaa);
}

.cuestionario .explicacion {
  text-align: left;
}

.cuestionario .estrellas {
  margin: 8px 0;
  font-size: 3rem;
  color: #b07800;
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
  height: 40px;
  padding: 0 14px;
  border: 3px solid var(--verde-borde);
  border-radius: 20px;
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
  border-bottom: 2px solid var(--amarillo-3);
}

.cuestionario .acciones {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.8rem;
  margin-top: 1rem;
}

@media (max-width: 767px) {
  .cuestionario .pregunta {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 5: Correr las pruebas y verificar que pasan**

Run: `npx playwright test tests/e2e/juegos.spec.ts`
Expected: PASS (incluida la prueba de accesibilidad y la del crédito con enlace a Commons).

- [ ] **Step 6: Commit**

```bash
git add src/components/Cuestionario.tsx src/pages/juegos/cuestionario/[slug].astro src/styles/global.css tests/e2e/juegos.spec.ts
git commit -m "feat: cuestionario con panel azul, respuestas en placas y estrellas de avance" -m "Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 12: Atlas, país, búsqueda, Acerca de y 404

**Files:**
- Modify: `src/pages/atlas.astro`, `src/components/Atlas.tsx`, `src/pages/pais/[adm0].astro`, `src/pages/buscar.astro`, `src/components/ResultadosBusqueda.tsx`, `src/pages/acerca.astro`, `src/pages/404.astro`, `src/styles/global.css` (secciones nuevas al final)
- Create: `tests/e2e/paginas.spec.ts`
- Test: `tests/e2e/busqueda.spec.ts`, `tests/e2e/atlas.spec.ts`

**Interfaces:**
- Consumes: `Curvas`, clases globales (Tarea 5).
- Produces:
  - `ResultadosBusqueda` recibe `categorias: { slug: string; nombre: string; icono: string }[]`; muestra `h2.titulo-resultados` («Resultados para «q»») y una miniatura de 64 px (`img.miniatura`, ícono de la categoría) por resultado.
  - Los botones de continente del atlas usan `placa placa-mini`.

- [ ] **Step 1: Escribir las pruebas que fallan**

`tests/e2e/paginas.spec.ts`:

```ts
import { test, expect } from '@playwright/test';
import { revisarAccesibilidad } from './ayuda';

test('Acerca de no tiene problemas graves de accesibilidad', async ({ page }) => {
  await page.goto('/acerca');
  await expect(page.getByRole('heading', { level: 1 })).toHaveClass(/titulo-articulo/);
  await revisarAccesibilidad(page);
});

test('la 404 no tiene problemas graves de accesibilidad', async ({ page }) => {
  await page.goto('/no-existe');
  await expect(page.getByRole('link', { name: 'Ir a Inicio' })).toHaveClass(/boton/);
  await revisarAccesibilidad(page);
});

test('la ficha de un país sin artículo no tiene problemas graves de accesibilidad', async ({ page }) => {
  await page.goto('/pais/RUS');
  await expect(page.getByRole('heading', { level: 1 })).toHaveClass(/titulo-articulo/);
  await expect(page.getByRole('link', { name: 'Volver al atlas' })).toBeVisible();
  await revisarAccesibilidad(page);
});
```

En `tests/e2e/busqueda.spec.ts`, en la prueba `'Enter sin elegir abre los resultados con el término resaltado'`, agregar al final:

```ts
  await expect(page.getByRole('heading', { name: 'Resultados para «mexico»' })).toBeVisible();
  await expect(page.locator('.resultados li .miniatura').first()).toBeVisible();
```

En `tests/e2e/atlas.spec.ts`, en la prueba `'los botones de continente acercan el mapa'`, agregar antes del clic:

```ts
  await expect(page.getByRole('button', { name: 'Europa' })).toHaveClass(/placa-mini/);
```

Run: `npx playwright test tests/e2e/paginas.spec.ts tests/e2e/busqueda.spec.ts tests/e2e/atlas.spec.ts`
Expected: FAIL (no existen esas clases ni el título de resultados).

- [ ] **Step 2: Atlas**

`src/components/Atlas.tsx`: cambiar `<button type="button" class="boton" onClick={() => irAVista(v)}>` por `<button type="button" class="placa placa-mini" onClick={() => irAVista(v)}>`.

`src/pages/atlas.astro`: agregar `import Curvas from '../components/Curvas.astro';` y reemplazar todo el contenido de `<Base …>` por:

```astro
  <div class="pagina">
    <Curvas variante="esquina" />
    <div class="hoja">
      <h1 class="titulo-pagina">Atlas del mundo</h1>
      <p>Los países en amarillo tienen artículo. Haz clic en cualquiera para conocerlo.</p>
      <Atlas client:load paises={paises} vistas={vistasAtlas as Record<VistaAtlas, Caja>} nombresVistas={nombresVistas} />
      <details class="lista-paises recuadro-naranja">
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
    </div>
  </div>
```

y en su `<style>` agregar:

```css
  .lista-paises h2 {
    margin-top: 0.8em;
    font-size: 1.25rem;
    font-weight: bold;
  }
```

Al final de `src/styles/global.css`:

```css
/* ---------- Atlas ---------- */

.atlas .vistas {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.atlas .lienzo {
  position: relative;
  overflow: hidden;
  border: 3px solid var(--recuadro-borde);
  border-radius: 12px;
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
  fill: #f3ecd2;
  stroke: #8c7b55;
  stroke-width: 0.6;
  vector-effect: non-scaling-stroke;
  cursor: pointer;
  transition: fill 0.15s ease;
}

.atlas .pais.con-articulo {
  fill: var(--amarillo-3);
}

.atlas .pais:hover,
.atlas .pais:focus-visible {
  fill: var(--naranja);
  outline: none;
}

.atlas .etiqueta-pais {
  position: absolute;
  transform: translate(-50%, -130%);
  padding: 4px 10px;
  border: 2px solid var(--recuadro-borde);
  border-radius: 10px;
  background: #fff;
  color: var(--texto);
  font-weight: bold;
  white-space: nowrap;
  pointer-events: none;
}

/* ---------- Resultados de búsqueda ---------- */

.titulo-resultados {
  margin: 0 0 4px;
  font-size: 1.5rem;
  color: var(--naranja-titulo);
}

.resultados {
  list-style: none;
  margin: 0;
  padding: 0;
}

.resultados li {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 2px solid var(--amarillo-1);
}

.resultados .miniatura {
  flex: none;
  padding: 6px;
  border: 1px solid #000;
  background: var(--recuadro-fondo-activo);
}

.resultados p {
  margin: 4px 0 0;
}

.titulo-resultado {
  font-size: 1.125rem;
  font-weight: bold;
}

.categoria-resultado {
  font-size: 0.8125rem;
  color: var(--texto-suave);
}

.resultados mark {
  background: #ffe28a;
  padding: 0 0.1em;
}
```

- [ ] **Step 3: Ficha de país**

`src/pages/pais/[adm0].astro`: agregar `import Curvas from '../../components/Curvas.astro';` y reemplazar el contenido de `<Base …>` por:

```astro
  <div class="pagina">
    <Curvas variante="franja" />
    <div class="hoja">
      <h1 class="titulo-articulo">{pais.nombre}</h1>
      <dl class="ficha recuadro-naranja">
        <dt>Continente</dt>
        <dd>{pais.continente}</dd>
        <dt>Población estimada</dt>
        <dd>{`${poblacion} habitantes`}</dd>
      </dl>
      <p class="fuente">Fuente: Natural Earth (dominio público).</p>
      <a class="boton azul" href="/atlas">Volver al atlas</a>
    </div>
  </div>
```

y en su `<style>`, cambiar la regla `.ficha` por:

```css
  .ficha {
    display: grid;
    grid-template-columns: max-content 1fr;
    gap: 0.4rem 1rem;
    max-width: 420px;
    margin: 16px 0;
  }
```

- [ ] **Step 4: Búsqueda**

`src/pages/buscar.astro`: reemplazar el archivo por:

```astro
---
import Base from '../layouts/Base.astro';
import Buscador from '../components/Buscador.tsx';
import Curvas from '../components/Curvas.astro';
import ResultadosBusqueda from '../components/ResultadosBusqueda.tsx';
import { CATEGORIAS } from '../config';

const categorias = CATEGORIAS.map((c) => ({ slug: c.slug, nombre: c.nombre, icono: c.icono }));
---
<Base titulo="Buscar" pantalla="buscar">
  <div class="pagina">
    <Curvas variante="esquina" />
    <div class="hoja">
      <h1 class="titulo-pagina">Buscar</h1>
      <div class="caja-busqueda">
        <Buscador client:load variante="grande" />
      </div>
      <ResultadosBusqueda client:load categorias={categorias} />
    </div>
  </div>
</Base>

<style>
  .caja-busqueda {
    margin-bottom: 1.5rem;
  }
</style>
```

`src/components/ResultadosBusqueda.tsx`:
- cambiar `categorias: { slug: string; nombre: string }[];` por `categorias: { slug: string; nombre: string; icono: string }[];`;
- debajo de `const nombre = …;`, agregar `const icono = (slug: string) => categorias.find((c) => c.slug === slug)?.icono ?? '1F4DA';`;
- en el bloque sin resultados, cambiar `<div class="sin-resultados" role="status">` por `<div class="sin-resultados recuadro-naranja" role="status">`;
- reemplazar el `return (` final (lista de resultados) por:

```tsx
  return (
    <div>
      <h2 class="titulo-resultados">{`Resultados para «${consulta}»`}</h2>
      <p role="status">{`${resultados.length} resultados`}</p>
      <ol class="resultados">
        {resultados.map((r) => (
          <li>
            <img class="miniatura" src={`/iconos/${icono(r.categoria)}.svg`} width={64} height={64} alt="" />
            <div>
              <a href={`/articulo/${r.slug}`} class="titulo-resultado">
                <Resaltado texto={r.titulo} consulta={consulta} />
              </a>{' '}
              <span class="categoria-resultado">{nombre(r.categoria)}</span>
              <p>
                <Resaltado texto={r.resumen} consulta={consulta} />
              </p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
```

- [ ] **Step 5: Acerca de y 404**

`src/pages/acerca.astro`: agregar `import Curvas from '../components/Curvas.astro';` y envolver el contenido:
- reemplazar `<h1>Acerca de {SITIO.nombre}</h1>` por `<h1 class="titulo-articulo">{`Acerca de ${SITIO.nombre}`}</h1>`;
- reemplazar `<p class="panel aviso">{SITIO.homenaje}</p>` por `<p class="aviso recuadro-naranja">{SITIO.homenaje}</p>`;
- reemplazar `<h2>Licencias y créditos</h2>` por `<h2 class="subtitulo">Licencias y créditos</h2>`;
- envolver todo lo que está dentro de `<Base …>` con `<div class="pagina"><Curvas variante="franja" /><div class="hoja">` … `</div></div>`;
- reemplazar su `<style>` por:

```astro
<style>
  .aviso {
    margin: 16px 0;
    font-weight: bold;
  }
  .subtitulo {
    font-size: 1.5rem;
    color: var(--naranja-titulo);
  }
  .creditos li {
    margin-bottom: 0.6rem;
  }
</style>
```

`src/pages/404.astro`: reemplazar el archivo por:

```astro
---
import Base from '../layouts/Base.astro';
import Curvas from '../components/Curvas.astro';
---
<Base titulo="Página no encontrada" pantalla="404">
  <div class="pagina">
    <Curvas variante="esquina" />
    <div class="hoja perdida">
      <h1 class="titulo-pagina">¡Ups! Esta página se perdió</h1>
      <p>No encontramos lo que buscabas. Volvamos al comienzo.</p>
      <a class="boton boton-grande" href="/">Ir a Inicio</a>
    </div>
  </div>
</Base>

<style>
  .perdida {
    padding-top: 2rem;
    text-align: center;
  }
  .perdida .titulo-pagina {
    justify-content: center;
  }
</style>
```

- [ ] **Step 6: Correr las pruebas y verificar que pasan**

Run: `npx playwright test tests/e2e/paginas.spec.ts tests/e2e/busqueda.spec.ts tests/e2e/atlas.spec.ts tests/e2e/inicio.spec.ts`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add -A src tests
git commit -m "feat: atlas, país, búsqueda, Acerca de y 404 con el estilo nuevo" -m "Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 13: Limpieza, README y verificación final

**Files:**
- Modify: `README.md`
- Verify: todo el repositorio

**Interfaces:**
- Consumes: todas las tareas anteriores.
- Produces: rama `rediseno` con todas las pruebas en verde.

- [ ] **Step 1: Buscar restos del diseño viejo**

```bash
grep -rnE -e '--cat-|fuente-titulos|--brillo|--radio|--ventana|mosaico|class="panel"|panel aviso|boton-icono|Lumi|globo-guia|barra-titulo' src/components src/layouts src/lib src/pages src/styles src/config.ts tests
```

Expected: no imprime nada. Si algo aparece, reemplazarlo por la pieza nueva equivalente (sección 7 de la spec) y volver a correr el `grep`.

- [ ] **Step 2: Actualizar `README.md`**

Debajo del primer párrafo (el que termina en «Proyecto no afiliado a Microsoft.»), agregar:

```markdown
El aspecto (barra verde, placas amarillas, panel azul, títulos naranjas) reproduce la
composición de Mi Primera Encarta dibujada de nuevo con CSS y SVG propios; no se usa
ningún archivo del producto original.
```

y al final de la sección «Actualizar el contenido», agregar el paso:

```markdown
4. Si agregaste o quitaste artículos, ubícalos en `src/data/subcategorias.ts`: el build
   falla si un artículo no está en exactamente una subcategoría de su categoría.
```

- [ ] **Step 3: Correr toda la verificación**

Run: `npm test`
Expected: todas las pruebas unitarias en verde.

Run: `npm run test:e2e`
Expected: todas las pruebas de extremo a extremo en verde, en escritorio y tablet.

- [ ] **Step 4: Revisión visual**

```bash
npm run build
mkdir -p test-results/capturas
node node_modules/astro/bin/astro.mjs preview --port 4330 --ignore-lock &
PREVIEW=$!
sleep 3
for ancho in 1280 900 390; do
  for ruta in "" "categoria/animales" "articulo/leon" "articulo/leon/imagenes" "juegos/cuestionario/animales"; do
    nombre=$(echo "${ruta:-inicio}" | tr '/' '-')
    npx playwright screenshot --viewport-size="${ancho},900" --full-page "http://localhost:4330/${ruta}" "test-results/capturas/${nombre}-${ancho}.png"
  done
done
kill $PREVIEW
```

Expected: 15 capturas en `test-results/capturas/` (carpeta ignorada por git). Abrirlas y compararlas con las maquetas aprobadas: placas inclinadas con el borde derecho más alto, panel azul, barra verde, títulos naranjas y curvas. En 390 px no debe haber desplazamiento horizontal de la página.

- [ ] **Step 5: Commit**

```bash
git add README.md
git commit -m "docs: README con el rediseño y las subcategorías" -m "Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```
