# Mi Primera Enciclopedia — Fase 1: diseño

- **Fecha:** 2026-10-14
- **Estado:** pendiente de revisión
- **Alcance de este documento:** fase 1 (base). Las fases 2 y 3 tendrán su propia especificación.

## 1. Resumen

Sitio web estático en español que recrea la experiencia de **Mi Primera Encarta 2009**
(la enciclopedia infantil de Microsoft) como proyecto de portafolio publicado en internet.
Reproduce la sensación de "abrir el programa": una ventana nostálgica estilo Windows Vista,
categorías temáticas, artículos multimedia, búsqueda con autocompletado, un atlas
interactivo y cuestionarios con imágenes.

Todo el contenido proviene de fuentes libres (Vikidia, Wikimedia Commons, Natural Earth,
OpenMoji) o es original. **No se usa nada del producto de Microsoft.**

## 2. Contexto y propósito

- **Qué es:** una réplica de la *interfaz y la experiencia*, no del contenido.
- **Para quién:** visitantes del portafolio y cualquier persona que recuerde Mi Primera Encarta.
- **Por qué así:** el contenido, la marca "Encarta" y los recursos gráficos del original son
  propiedad de Microsoft. Publicarlos sería redistribución sin permiso. La experiencia
  (organización, flujo, tipo de juegos, estética de época) sí se puede recrear con
  material propio o libre.
- **Referencia conceptual:** el análisis estático del DVD con REA (ver sección 18) informa
  cómo funcionaba el original, pero ningún archivo del DVD entra al proyecto.

## 3. Objetivos y criterios de éxito

1. Quien conoció Mi Primera Encarta reconoce la experiencia al abrir el sitio.
2. Se puede navegar por categorías, leer artículos, buscar con autocompletado, jugar
   cuestionarios y hacer clic en países del atlas.
3. Cada texto, imagen, audio y video muestra su fuente, autor y licencia.
4. Funciona completo en escritorio y tablet, y de forma simplificada en celular.
5. El build falla si falta una atribución o hay un enlace interno roto.

## 4. Alcance

### Incluido en la fase 1

- Importador de contenido desde Vikidia y Wikimedia Commons.
- Ventana nostálgica persistente con barra de herramientas y personaje guía.
- Pantallas: Inicio, Categoría, Artículo, Búsqueda, Atlas, Ficha de país, Juegos,
  Cuestionario, Acerca de y página 404.
- Motor de preguntas compartido (lo reutilizarán las fases 2 y 3).
- 8 cuestionarios con imágenes, uno por categoría.
- Publicación en Vercel.

### Fuera de alcance

- **Fase 2:** juego "Adivinanzas de geografía" (nombre del jugador, niveles de dificultad,
  tabla de puntajes, sobre el mapa del atlas).
- **Fase 3:** juego "Laberinto de preguntas" (recorrido por un castillo o laberinto
  respondiendo preguntas).
- Ranking global de puntajes, cuentas de usuario o cualquier servidor.
- Otros idiomas.
- Cualquier contenido, gráfico, sonido, texto o código del DVD de Encarta.

## 5. Restricciones legales y de licencias

| Regla | Detalle |
|---|---|
| Nada del DVD | Ningún archivo, imagen, sonido, texto ni fragmento de código del producto original. |
| Sin la marca | El nombre del sitio no incluye "Encarta". Nombre provisional: **Mi Primera Enciclopedia**, definido en un único archivo de configuración. |
| Aviso de homenaje | "Acerca de" incluye: "Homenaje a Mi Primera Encarta (2009). Proyecto no afiliado a Microsoft." |
| Share-alike | Los artículos de Vikidia son CC BY-SA 3.0. Los textos derivados (artículos limpios y cuestionarios) se publican bajo la misma licencia. |
| Atribución | Cada artículo enlaza su fuente y el historial de Vikidia. Cada archivo multimedia muestra autor, licencia y enlace a Commons. |
| Solo licencias libres | Se aceptan: dominio público, CC0, CC BY y CC BY-SA. Cualquier otra licencia, o una licencia desconocida, descarta el archivo. |
| Código | Licencia MIT, salvo que el autor decida otra. |

## 6. Arquitectura

### Flujo

```
npm run import  →  Vikidia API + Commons  →  contenido guardado en el repo
                                                     │
                                  npm run build (validación + astro build)
                                                     │
                                       sitio estático  →  Vercel
```

- El importador se corre manualmente cuando se quiere actualizar el contenido.
- El contenido importado se **guarda en el repositorio**: el build no depende de que
  Vikidia esté en línea y es reproducible.

### Tecnología

- **Astro 7 con TypeScript (Node ≥ 22.12):** generación estática y colecciones de contenido
  con esquemas Zod 4 (importados de `astro/zod`).
- **Navegación con `ClientRouter` de Astro:** la ventana se mantiene con `transition:persist`.
- **Preact 10** (la versión que admite `@astrojs/preact` 6): solo para las islas interactivas
  (buscador, resultados de búsqueda, cuestionario y atlas).
- **MiniSearch:** índice de búsqueda generado al construir el sitio.
- **d3-geo y d3-geo-projection:** solo en tiempo de build, para dibujar el mapa en SVG.
- **Vitest:** pruebas unitarias.
- **Playwright con axe:** pruebas de extremo a extremo y de accesibilidad.

### Estructura de carpetas

```
mi-primera-enciclopedia/
├── scripts/import/
│   ├── curacion.yaml        # lista curada (la edita el autor)
│   ├── vikidia.ts           # descarga artículos
│   ├── limpiar.ts           # limpia el HTML
│   ├── commons.ts           # multimedia y licencias
│   ├── informe.ts           # informe de aceptados y rechazados
│   └── .cache/              # respuestas crudas (ignorado por Git)
├── scripts/validar.ts       # validaciones de contenido previas al build
├── src/
│   ├── config.ts            # nombre del sitio y textos globales
│   ├── content/
│   │   ├── articulos/       # un JSON por artículo (generado)
│   │   └── cuestionarios/   # un JSON por cuestionario (escrito a mano)
│   ├── assets/medios/       # imágenes descargadas (Astro las optimiza)
│   │                        # (audio y video van en public/medios/)
│   ├── data/atlas/          # países de Natural Earth y paths SVG generados
│   ├── components/
│   │   ├── Ventana.astro
│   │   ├── BarraHerramientas.astro
│   │   ├── Guia.astro
│   │   ├── Buscador.tsx     # isla
│   │   ├── Cuestionario.tsx # isla
│   │   └── Atlas.tsx        # isla
│   ├── lib/
│   │   ├── normalizar.ts    # normalización de texto (búsqueda)
│   │   ├── preguntas.ts     # motor de preguntas
│   │   ├── puntajes.ts      # mejores puntuaciones (localStorage)
│   │   └── sonido.ts        # sonidos sintetizados (Web Audio)
│   ├── styles/tokens.css    # paleta, medidas, sombras
│   └── pages/               # rutas (ver sección 9)
└── tests/
    ├── unit/
    └── e2e/
```

## 7. Importador de contenido

### Composición del contenido

- **8 categorías:** Animales, Planeta Tierra, Espacio, Cuerpo humano, Historia,
  Arte y música, Ciencia y tecnología, y Países.
- **~110 artículos temáticos:** unos 15 por cada una de las 7 categorías temáticas.
- **~40 artículos de países:**
  - los 18 países hispanohablantes de América, Puerto Rico, España y Guinea Ecuatorial (21);
  - unos 19 más, con al menos 3 por continente.
- **Resto de países del mapa:** sin artículo; muestran una ficha breve (sección 11).

### Formato de `curacion.yaml`

```yaml
categorias:
  - slug: animales
    nombre: Animales
    articulos:
      - titulo: León            # título exacto en es.vikidia.org
        extras:                 # opcional: multimedia adicional de Commons
          - File:Lion_roaring.ogg
paises:
  - titulo: México
    adm0: MEX                   # código ADM0_A3 de Natural Earth
```

### Pasos

1. **Leer** `curacion.yaml`.
2. **Descargar** cada artículo con `action=parse` (`prop=text|images|categories|revid`,
   `redirects=1`) de `https://es.vikidia.org/w/api.php`.
   - Peticiones de a una, con 1 segundo de pausa entre ellas.
   - User-Agent que identifica el proyecto.
   - Las respuestas se guardan en `.cache/` y se reutilizan si existen.
3. **Rechazar** el artículo si:
   - no existe;
   - pertenece a la categoría `Vikidia:Esbozos`;
   - tiene menos de 150 palabras después de la limpieza.
4. **Limpiar el HTML y convertirlo en bloques:**
   - Del contenido principal se conservan solo párrafos (`p`), títulos (`h2`, `h3`),
     listas (`ul`, `ol`) y figuras (`figure`). Se descartan tablas, fichas laterales
     (infobox), índice, cajas de navegación, galerías y avisos de mantenimiento.
   - Se eliminan las secciones Galería, Referencias, Notas, Enlaces externos, Véase también,
     Bibliografía y Fuentes.
   - Dentro de los bloques solo quedan las etiquetas `b`, `i`, `strong`, `em`, `a`, `br`,
     `sub`, `sup` y `li`, sin ningún atributo excepto `href` en los enlaces internos.
     Se quitan marcadores de referencias y enlaces de edición.
   - Los enlaces a otros artículos de la lista se convierten en enlaces internos;
     el resto de los enlaces queda como texto plano.
   - Cada figura se convierte en un bloque `figura` que apunta a su archivo local,
     con su pie de foto. Así las imágenes del texto se sirven desde el sitio,
     optimizadas, y nunca se enlazan a servidores externos.
   - El `resumen` es el primer párrafo, hasta 300 caracteres.
5. **Obtener la multimedia** de Commons con `prop=imageinfo&iiprop=url|extmetadata|mime`:
   - Se leen autor, licencia y URL de descripción.
   - Imágenes: miniatura de 500 px, un tamaño estándar de Commons de unos 60 KB, y hasta
     6 imágenes por artículo más las de sus figuras. Así el repositorio pesa decenas de MB
     y no cientos.
   - Audio: se prefiere MP3. Video: se prefiere WebM o MP4, según lo que ofrezca Commons.
   - Si no hay un formato reproducible en Safari, se registra en el informe.
   - Se descartan los archivos con licencia no permitida (sección 5) y los íconos
     decorativos de las plantillas, como `Question_book.png` o `Searchtool.svg`.
6. **Guardar** un JSON por artículo en `src/content/articulos/`, las imágenes en
   `src/assets/medios/` (Astro las optimiza) y el audio y video en `public/medios/`
   (se sirven tal cual).
7. **Generar el informe** en consola y en `scripts/import/informe.md`, con artículos
   aceptados, rechazados (con motivo) y archivos multimedia descartados (con motivo).

### Manejo de errores del importador

- **Errores de red y 5xx:** hasta 3 reintentos, con espera de 2, 4 y 8 segundos.
- **Un artículo falla:** se registra en el informe y el importador sigue con los demás.
- **Código de salida distinto de cero:** solo si se aceptan menos de 100 artículos.

## 8. Modelo de datos

```ts
type Licencia = 'dominio-publico' | 'cc0' | 'cc-by' | 'cc-by-sa';

interface Medio {
  archivo: string;        // ruta en src/assets/medios/
  tipo: 'imagen' | 'audio' | 'video';
  alt: string;
  autor: string;
  licencia: Licencia;
  licenciaUrl: string;
  fuenteUrl: string;      // página del archivo en Commons
}

type Bloque =
  | { tipo: 'html'; html: string }                     // p, h2, h3, ul, ol limpios
  | { tipo: 'figura'; archivo: string; pie: string };  // archivo de un Medio

interface Articulo {
  slug: string;           // p. ej. "leon"
  titulo: string;
  categoria: CategoriaSlug;
  resumen: string;
  bloques: Bloque[];      // texto limpio y figuras, en orden
  principal?: Medio;
  medios: Medio[];
  relacionados: string[]; // slugs internos
  pais?: { adm0: string };
  fuente: { url: string; historialUrl: string; revid: number; fecha: string };
}

interface Pregunta {
  id: string;
  texto: string;
  imagen: string;         // archivo de un Medio del artículo referido
  opciones: [string, string, string];
  correcta: 0 | 1 | 2;
  articulo: string;       // slug
  explicacion: string;    // también alimenta "¿Sabías que…?" y la guía
}

interface Cuestionario {
  slug: string;
  titulo: string;
  categoria: CategoriaSlug;
  preguntas: Pregunta[];  // exactamente 10
}
```

## 9. Pantallas y rutas

| Ruta | Pantalla | Contenido |
|---|---|---|
| `/` | Inicio | 8 mosaicos de categoría, un "¿Sabías que…?" al azar y accesos a Atlas y Juegos. |
| `/categoria/[slug]` | Categoría | Tarjetas con miniatura, título y resumen, en orden alfabético. |
| `/articulo/[slug]` | Artículo | Ver detalle abajo. |
| `/buscar?q=` | Resultados | Lista ordenada por relevancia, con el término resaltado. |
| `/atlas` | Atlas | Mapa interactivo (sección 11). |
| `/pais/[adm0]` | Ficha de país | Para países sin artículo: nombre, continente y población estimada. |
| `/juegos` | Juegos | Lista de cuestionarios disponibles. En la fase 1 no se anuncian juegos futuros. |
| `/juegos/cuestionario/[slug]` | Cuestionario | Sección 12. |
| `/acerca` | Acerca de | Homenaje, aviso de no afiliación, licencias y créditos. |
| `404` | Error | El personaje dice "¡Ups! Esta página se perdió" y hay un botón a Inicio. |

**Detalle de la pantalla de artículo:**
- Título, imagen principal y texto con sus imágenes.
- Panel de multimedia con galería, audio y video.
- "Artículos relacionados".
- Botón "¡Pon a prueba lo que sabes!", que lleva al cuestionario de su categoría.
- Pie de atribución.

**Ventana persistente:**
- **Barra de título:** logo y nombre del sitio.
- **Barra de herramientas:** Inicio, Atrás, Adelante, buscador, Atlas, Juegos, Acerca de
  y un botón para activar o silenciar el sonido.
- **Personaje guía:** en una esquina, con globos de diálogo según la pantalla. Los textos
  salen de `explicacion` y de mensajes fijos por pantalla.
- Atrás y Adelante usan el historial del navegador.

## 10. Búsqueda

- **Índice:** MiniSearch generado en el build y servido como JSON estático.
  - Campos y pesos: `titulo` ×3, `resumen` ×2, `texto` ×1 (el texto sale de los bloques
    HTML sin etiquetas).
- **Normalización (`normalizar.ts`):**
  - minúsculas;
  - descomposición NFD y eliminación de marcas diacríticas (`árbol` → `arbol`, `niño` → `nino`);
  - se usa igual al indexar y al buscar.
- **Autocompletado:**
  - Búsqueda por prefijo solo en títulos, con hasta 8 sugerencias.
  - Se navega con flechas, se elige con Enter y se cierra con Escape.
  - Rol ARIA `combobox`.
- **Resultados:** búsqueda completa con prefijo y tolerancia a errores de 0,2.
  - Sin resultados, el personaje sugiere revisar la ortografía y muestra las categorías.

## 11. Atlas

- **Datos:** Natural Earth *Admin 0 – Countries*, escala 1:110m (dominio público).
  - Nombres en español desde el campo `NAME_ES`.
  - Los países se identifican por `ADM0_A3`. No se usa `ISO_A3`, porque contiene `-99`
    para algunos países.
- **Dibujo:** paths SVG precalculados en el build con proyección Robinson. Al navegador
  no se envía ninguna librería de mapas.
- **Interacción:**
  - Al pasar el cursor, o con foco de teclado, el país se resalta y muestra su nombre.
  - Clic o tap: abre `/articulo/[slug]` si el país tiene artículo, o `/pais/[adm0]` si no.
  - Botones de acercamiento animado: Mundo, África, América, Asia, Europa y Oceanía.
- **En celular:** se puede arrastrar y hacer pellizco para acercar.
- **Accesibilidad:** cada país es un elemento enfocable con nombre accesible. Además hay
  una lista alternativa de países, agrupada por continente.

## 12. Motor de preguntas y cuestionarios

### Motor (`preguntas.ts`)

Es independiente de la interfaz, para que lo reutilicen las fases 2 y 3.

- Recibe un `Cuestionario`.
- Mezcla el orden de las preguntas y de las opciones en cada partida.
- Expone el estado: pregunta actual, respuesta elegida, aciertos y terminado.
- **Puntaje:** 10 puntos por acierto (máximo 100).
- **Estrellas:**
  - 0–4 aciertos: 1 estrella;
  - 5–7 aciertos: 2 estrellas;
  - 8–10 aciertos: 3 estrellas.

### Mejores puntuaciones (`puntajes.ts`)

- Se guardan las 5 mejores por cuestionario en `localStorage`, bajo la clave
  `mpe:puntajes:<slug>`.
- Cada registro contiene `{ nombre, puntaje, fecha }`; el nombre tiene hasta 12 caracteres.
- Todas las lecturas y escrituras están en `try/catch`. Si el almacenamiento no está
  disponible, el juego funciona igual y simplemente no guarda.

### Pantalla de cuestionario

- Una pregunta a la vez, con su imagen y 3 opciones grandes.
- Al responder:
  - sonido de acierto o error;
  - se marca la opción correcta;
  - se muestra la `explicacion` y un enlace al artículo.
- Al final:
  - estrellas y puntaje;
  - se pide el nombre si el puntaje entra en el top 5;
  - se muestra la tabla de mejores puntuaciones;
  - botones "Jugar otra vez" y "Volver a Juegos".

### Contenido

- 8 cuestionarios (uno por categoría) de 10 preguntas cada uno.
- Los escribe el autor del proyecto a partir de los artículos importados.
- Cada pregunta usa una imagen de su artículo.

## 13. Estilo visual y recursos

- **Estética:** inspirada en Windows Vista:
  - degradados brillantes con reflejo superior;
  - bordes redondeados y sombras suaves;
  - colores saturados;
  - un color por categoría.
- **Tokens:** toda la paleta, las medidas y las sombras se definen como variables CSS
  en `src/styles/tokens.css`.
- **Tipografía:**
  - textos: `Tahoma, Verdana, "DejaVu Sans", sans-serif`, por nombre y sin incluir las fuentes;
  - títulos: Baloo 2 (licencia OFL), servida desde el propio sitio.
- **Recursos:**

| Recurso | Origen | Licencia |
|---|---|---|
| Botones, ventana, fondos | CSS y SVG propios | MIT (junto con el código) |
| Íconos de categorías y herramientas | OpenMoji | CC BY-SA 4.0 |
| Personaje guía | SVG original con 4 poses: saluda, piensa, celebra y se sorprende | Propia |
| Sonidos (clic, acierto, error, fanfarria) | Sintetizados con Web Audio en `sonido.ts` | Sin archivos |
| Fotos, audio y video de artículos | Wikimedia Commons, optimizados por Astro a WebP/AVIF | Según cada archivo |
| Mapa | Natural Earth 1:110m | Dominio público |

- **Activación del sonido:** el `AudioContext` se crea en la primera interacción del
  usuario, por las políticas de reproducción automática de los navegadores.

## 14. Dispositivos y accesibilidad

- **Escritorio (≥ 1180 px) y tablet (768–1179 px):** ventana completa.
- **Celular (< 768 px):**
  - sin marco de ventana;
  - la barra de herramientas se convierte en una barra inferior con los mismos destinos;
  - el personaje guía se reduce a un ícono que abre su globo.
- **Accesibilidad:**
  - todo se puede operar con teclado y el foco es visible;
  - todas las imágenes tienen `alt`;
  - el contraste es AA;
  - el sonido se puede silenciar y la preferencia se recuerda en el navegador;
  - con `prefers-reduced-motion` se desactivan las animaciones de transición y de acercamiento.

## 15. Manejo de errores

### En el navegador

| Situación | Comportamiento |
|---|---|
| Ruta inexistente | Página 404 con el estilo del sitio. |
| Imagen que no carga | Marcador con el ícono de la categoría. |
| El índice de búsqueda no carga | Buscador deshabilitado con el aviso "La búsqueda no está disponible ahora"; el resto del sitio funciona. |
| `localStorage` no disponible | Los puntajes no se guardan; no se muestra ningún error. |
| Web Audio no disponible | Silencio, sin errores. |

### Validaciones del build (`scripts/validar.ts`, se ejecuta antes de `astro build`)

El build falla si:
- un artículo no tiene `fuente` completa;
- un `Medio` no tiene autor, licencia permitida o `fuenteUrl`;
- una pregunta no tiene exactamente 3 opciones y un índice `correcta` válido;
- una pregunta apunta a un artículo o una imagen que no existen;
- un cuestionario no tiene exactamente 10 preguntas;
- un enlace interno apunta a un slug que no existe;
- un país de `curacion.yaml` no tiene `adm0` existente en Natural Earth.

Además, los esquemas Zod de las colecciones de contenido validan los tipos.

## 16. Pruebas

### Unitarias (Vitest)

- `limpiar.ts`, con HTML real de Vikidia guardado como fixture (por ejemplo, "Jirafa",
  que incluye avisos de mantenimiento):
  - quita los avisos;
  - conserva el texto;
  - convierte los enlaces internos.
- Filtro de licencias: acepta las licencias permitidas y rechaza el resto y las desconocidas.
- `normalizar.ts`: `Árbol` → `arbol`, `NIÑO` → `nino`.
- Búsqueda: `arbol` encuentra el artículo "Árbol"; el prefijo `leo` sugiere "León".
- `preguntas.ts`:
  - puntaje y estrellas en los límites 4/5 y 7/8;
  - la mezcla de opciones conserva la respuesta correcta.
- `puntajes.ts`: guarda solo el top 5 y tolera un `localStorage` que lanza errores.
- `validar.ts`: falla con contenido inválido de ejemplo.

### Extremo a extremo (Playwright, viewports de escritorio 1280×800 y tablet 820×1180)

- Inicio → categoría → artículo; la ventana sigue presente después de navegar.
- Escribir en el buscador muestra sugerencias y Enter abre los resultados.
- Completar un cuestionario muestra estrellas y la tabla de puntuaciones.
- Clic en México en el atlas abre su artículo; clic en un país sin artículo abre su ficha.
- Revisión de accesibilidad con axe en Inicio, Artículo, Atlas y Cuestionario, sin
  violaciones serias ni críticas.

## 17. Publicación

- **Repositorio:** Git en `~/Downloads/Programs/mi-primera-enciclopedia/`. El ISO del DVD
  vive en otra carpeta y nunca se agrega al repositorio.
- **Hosting:** Vercel, como sitio estático (`astro build`, salida `dist/`).
  - Opción 1: conectar un repositorio de GitHub.
  - Opción 2: desplegar con la CLI de Vercel.
  - GitHub todavía no está autorizado en la sesión de trabajo; se decide al llegar a ese paso.
- **Comandos:**
  - `npm run import`: importador;
  - `npm run build`: validación y build;
  - `npm test`: pruebas unitarias;
  - `npm run test:e2e`: Playwright.

## 18. Referencia: hallazgos del análisis del original

Del análisis estático del DVD con REA (solo como referencia conceptual):

- **Motor compartido:** Mi Primera Encarta usa los mismos binarios que la Encarta de adultos.
  Lo que cambia es la configuración (SKU `K09EDXRC`) y los paquetes de contenido `*KDC*`.
- **Búsqueda original:** `Microsoft.Encarta.Search`, en .NET 2.0. Tenía:
  - autocompletado por prefijo ("word wheel");
  - normalización de caracteres (`CharMap`, `StringNormalizer`);
  - ranking configurable (`Rank`, `RankSettings`);
  - eliminación de duplicados.

  Este diseño imita ese comportamiento con MiniSearch.
- **Juegos encontrados:** "Adivinanzas de geografía" (en la DLL de interfaz compartida, con
  nombre del jugador, dificultad y mejores puntuaciones), cuestionarios con imágenes
  (`SWQUIZ.EIT`, carpeta infantil) y pistas de un juego de preguntas con escaleras.
- **Tipografías:** el original usaba Tahoma y Verdana (`ENCSPLSH.INI`).

## 19. Supuestos y decisiones pendientes

- **Nombre:** "Mi Primera Enciclopedia" es provisional y se cambia en `src/config.ts`.
- **Licencia del código:** MIT, salvo que el autor elija otra.
- **Lista exacta de artículos:** se arma en `curacion.yaml` durante la implementación y
  la revisa el autor antes de importar.
- **Despliegue en Vercel:** el método (GitHub o CLI) se decide en ese paso.

## 20. Fases siguientes (resumen)

- **Fase 2 — Adivinanzas de geografía:**
  - reutiliza el motor de preguntas y el mapa del atlas;
  - suma nombre del jugador, 3 niveles de dificultad y una tabla de puntajes propia.
- **Fase 3 — Laberinto de preguntas:**
  - recorrido por un escenario (castillo o laberinto) en el que se avanza respondiendo preguntas;
  - necesita arte, diseño de niveles y su propia especificación.
