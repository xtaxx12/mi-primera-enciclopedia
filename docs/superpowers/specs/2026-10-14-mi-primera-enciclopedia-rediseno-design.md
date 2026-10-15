# Mi Primera Enciclopedia — Rediseño fiel al original: diseño

- **Fecha:** 2026-10-14
- **Estado:** pendiente de revisión
- **Reemplaza:** la sección 13 («Estilo visual y recursos»), la parte visual de la sección 9
  («Ventana persistente») y la sección 14 («Dispositivos») de
  `2026-10-14-mi-primera-enciclopedia-fase1-design.md`. El resto de esa especificación sigue vigente.
- **Rama:** `rediseno`, creada desde `main` (`65bda2e`).

## 1. Resumen

La fase 1 quedó funcionando, pero su aspecto ("ventana estilo Windows Vista" con mosaicos de
colores) se decidió sin haber mirado la interfaz infantil real, y no se parece a Mi Primera
Encarta. Este rediseño reproduce la composición, los colores, las proporciones y el
comportamiento del original, dibujados con CSS y SVG propios:

- barra superior verde lima con botones redondos con brillo y el campo «Buscar»;
- inicio sobre fondo blanco con grandes curvas naranjas y dos columnas de 5 placas amarillas;
- al elegir una placa, un panel azul central con subcategorías;
- páginas de categoría con menú azul de subcategorías y cuadrícula de miniaturas;
- artículos con títulos naranjas, texto negro grande y recuadros de imagen con borde naranja;
- vista «Contempla las imágenes» sobre curvas azules.

Se quita el personaje guía (Lumi) y la ventana estilo Vista. Se agregan subcategorías.

## 2. Contexto: cómo era el original

Fuente: análisis del ISO del usuario (solo como referencia, nada entra al repositorio).

| Archivo del DVD | Qué aportó |
|---|---|
| `ENCXSL.EIT` → `mainhome_kids.xsl` | Composición del inicio: escenario de 792 px = columna de 216 + centro de 360 + columna de 216; placas de 220×90; subcategorías con ícono de 44×42 y texto blanco en negrita de 15 px que se vuelve `#FFB400` al pasar el mouse; un sonido distinto por categoría al pasar el mouse y otro al hacer clic. |
| `ENCXSL.EIT` → `homescreens.xsl` | Pantalla de subcategoría: título naranja `#FF8400` de 40 px en una cabecera de 66 px; menú izquierdo de 240 px con la subcategoría elegida sobre una franja azul en forma de flecha y texto `#FF9600`; cuadrícula de celdas de 106×120 con miniatura de 64×64 de borde negro y título de 13 px; recuadro naranja con brillo bajo el mouse; barras de desplazamiento verdes (`#8EE01E`, `#15B400`, `#A7EC2B`). |
| `ENCXSL.EIT` → `kidsartdisp.xsl` | Artículo: fondo blanco con curva naranja arriba a la izquierda; título y secciones en naranja `#FF7800`; texto negro (introducción 16 pt, párrafos 14 pt); columna de texto de 526 px; recuadros de imagen de 170×206 con borde `#FF6600` y miniatura con borde `#FF9900` (bajo el mouse: borde `#52C3FC`, fondo `#DCF3FE`); títulos de recuadro `#0033CC`; artículos relacionados `#0033FF`; botón «Contempla las imágenes». |
| `ENCARTAR.DLL`, `ENCARTAU.DLL` | Piezas de la barra verde (botones redondos casa, atrás, adelante; «Buscar»; logo), botones «Lee el artículo» (naranja) y «Contempla las imágenes» (azul), fondo azul de la vista de imágenes. |
| `THUMBKDC.EIT` | 10 placas de categoría (normal y bajo el mouse), 59 íconos de subcategoría, 11 fondos de 1024×600 (inicio y uno por categoría). |

Los juegos del original eran Shockwave y Flash; su aspecto no se pudo ver sin ejecutarlos, así
que el cuestionario usa el mismo lenguaje visual del resto.

## 3. Objetivo y criterios de éxito

1. Quien usó Mi Primera Encarta reconoce el inicio, la categoría y el artículo a primera vista.
2. Ningún archivo, imagen, sonido, logo ni texto del DVD entra al repositorio.
3. Todo lo que funcionaba en la fase 1 sigue funcionando (búsqueda, atlas, cuestionarios,
   atribuciones, validación del build).
4. axe no informa violaciones en ninguna pantalla, y los colores de texto cumplen los contrastes
   de la sección 9.
5. Escritorio y tablet muestran la composición completa; el celular, una versión simplificada.

## 4. Alcance

### Incluido

- Barra superior nueva, fondos con curvas, placas, panel azul, menú de subcategorías,
  cuadrícula de temas, recuadros de imagen y botones con brillo.
- Pantallas: inicio, categoría y subcategoría, artículo, «Contempla las imágenes», Juega y
  aprende, cuestionario, atlas, ficha de país, búsqueda, Acerca de y 404.
- Subcategorías (sección 6).
- Voz que dice el nombre de la categoría al pasar el mouse.
- El atlas acepta `?vista=` para abrir directamente un continente.

### Fuera de alcance

- Cambiar los artículos, las imágenes o el importador.
- Reproducir los juegos Shockwave del original.
- Las fases 2 y 3 (siguen con su propia especificación).
- Publicar o subir la rama.

## 5. Restricciones legales

- Se copian la composición, la paleta, las proporciones y el comportamiento. Se dibuja todo
  de nuevo con CSS y SVG propios.
- No se usan las imágenes del DVD, el logo de las hojas verdes ni la palabra «Encarta» como
  marca. El logo propio es un libro abierto dentro de un círculo naranja.
- Se mantiene el aviso «Homenaje a Mi Primera Encarta (2009). Proyecto no afiliado a Microsoft.»
- Las imágenes de referencia extraídas del ISO viven solo en el scratchpad de la sesión.
- **Riesgo conocido:** la composición es reconocible a propósito (es un homenaje). Si Microsoft
  objetara la apariencia, habría que cambiar paleta y composición; para un portafolio sin fines
  comerciales, con nombre y logo propios, se considera un riesgo bajo.

## 6. Subcategorías

### Modelo

Archivo nuevo `src/data/subcategorias.ts`:

```ts
export interface Subcategoria {
  slug: string;            // único dentro de su categoría
  nombre: string;
  icono: string;           // código OpenMoji
  articulos: string[];     // slugs, en el orden en que se muestran
}
export const SUBCATEGORIAS: Record<CategoriaSlug, Subcategoria[]>;
```

No se toca `curacion.yaml` ni el importador. La validación del build (`scripts/validar.ts`)
falla si:

- un artículo de una categoría no aparece en ninguna de sus subcategorías;
- un artículo aparece en dos subcategorías, o en una subcategoría de otra categoría;
- una subcategoría nombra un artículo que no existe;
- una subcategoría queda vacía o hay dos con el mismo slug en una categoría.

### Reparto

| Categoría | Subcategoría (ícono) | Artículos |
|---|---|---|
| Animales | Mamíferos (`1F418`) | León, Elefante, Ballena, Delfín, Gato, Perro, Lobo, Ornitorrinco |
| | Aves (`1F99C`) | Guacamayo, Pingüino |
| | Reptiles y dinosaurios (`1F995`) | Cocodrilo, Tortuga, Dinosaurio |
| | Animales del mar (`1F988`) | Tiburón, Pulpo |
| | Insectos (`1F41D`) | Abeja, Mariposa |
| Planeta Tierra | Relieve (`26F0`) | Volcán, Terremoto, Montaña, Isla, Glaciar |
| | El agua (`1F4A7`) | Agua, Ciclo del agua, Océano Pacífico, Río Amazonas, Lago |
| | Clima y aire (`1F326`) | Clima, Atmósfera, Huracán |
| | Paisajes (`1F333`) | Sabana, Bosque, Antártida |
| Espacio | Sistema solar (`1FA90`) | Sistema solar, Sol, Luna, Tierra, Mercurio, Marte, Plutón, Planeta |
| | El universo (`1F30C`) | Estrella, Galaxia, Agujero negro, Cometa, Asteroide |
| | Exploración (`1F52D`) | Telescopio, Conquista del espacio |
| Cuerpo humano | Órganos (`1FAC1`) | Corazón, Cerebro, Pulmón, Estómago, Riñón, Sangre |
| | Los sentidos (`1F441`) | Ojo, Oído, Boca, Piel, Nervio |
| | Huesos y músculos (`1F9B4`) | Esqueleto, Hueso, Músculo, Diente |
| Historia | Prehistoria (`1F525`) | Prehistoria, Stonehenge, Escritura |
| | Antigüedad (`1F3FA`) | Antiguo Egipto, Pirámide, Antigua Grecia, Imperio romano |
| | Edad Media y Renacimiento (`1F3F0`) | Vikingos, Edad Media, Marco Polo, Renacimiento, Cristóbal Colón |
| | América antigua (`1F33D`) | Cultura olmeca, Mayas, Aztecas, Incas |
| Arte y música | Pintura y escultura (`1F5BC`) | Pintura, Escultura, Color, Arte prehistórico |
| | Grandes artistas (`1F9D1-200D-1F3A8`) | Leonardo da Vinci, Diego Velázquez, Francisco de Goya, Pablo Picasso, Mondrian |
| | Música y teatro (`1F3BC`) | Orquesta, Mozart, Beethoven, Chopin, Rock, The Beatles, Teatro |
| Ciencia y tecnología | Inventos y máquinas (`2699`) | Rueda, Imprenta, Automóvil, Tren, Computadora, Internet, Robot, Microscopio |
| | Materia y energía (`26A1`) | Electricidad, Energía, Luz, Sonido, Gravedad, Átomo, Isaac Newton |
| | La vida (`1F9EC`) | Célula, Planta |
| Países | América del Norte y Central (`1F30E`) | Canadá, Estados Unidos, México, Guatemala, Honduras, El Salvador, Nicaragua, Costa Rica, Panamá, Cuba, República Dominicana, Puerto Rico |
| | América del Sur (`1F999`) | Argentina, Bolivia, Brasil, Chile, Colombia, Ecuador, Paraguay, Perú, Uruguay, Venezuela |
| | Europa (`1F30D`) | Alemania, España, Francia, Grecia, Italia, Portugal, Reino Unido |
| | África, Asia y Oceanía (`1F30F`) | Argelia, Egipto, India, Turquía, Australia |

Las dos placas que no son categorías también abren el panel:

- **Atlas:** Mundo, África, América, Asia, Europa, Oceanía; cada una lleva a `/atlas?vista=<vista>`.
- **Juega y aprende:** «Cuestionarios» (`2753`), que lleva a `/juegos`.

## 7. Lenguaje visual

### Paleta (tokens en `src/styles/tokens.css`)

| Token | Valor | Uso |
|---|---|---|
| `--verde-claro` / `--verde` / `--verde-oscuro` | `#C9F56A` / `#9BE626` / `#7FD014` | Degradado de la barra superior |
| `--verde-borde` | `#5CAE0C` | Bordes de la barra, del campo de búsqueda y de los botones redondos |
| `--verde-texto` | `#1A5200` | Texto sobre verde («Buscar») |
| `--naranja-titulo` | `#E06A00` | Títulos y subtítulos (solo texto de 24 px o más) |
| `--naranja` / `--naranja-claro` | `#FF7800` / `#FFA31A` | Curvas, bordes de recuadros, botones naranjas |
| `--amarillo-1` … `--amarillo-4` | `#FFFBB0`, `#FFF35A`, `#FFE600`, `#FFD900` | Degradado de las placas |
| `--placa-borde` | `#86CF2C` | Borde de las placas |
| `--placa-texto-activo` | `#0B5FB8` | Texto de la placa bajo el mouse o con foco |
| `--azul-panel-1` / `--azul-panel-2` | `#1A74D6` / `#0A5FC8` | Panel central, menú de subcategorías, cuestionario |
| `--azul-elegido` | `#0A4FA8` | Franja-flecha de la subcategoría elegida |
| `--amarillo-elegido` | `#FFC233` | Texto de la subcategoría elegida |
| `--enlace` | `#0033FF` | Enlaces en el texto y artículos relacionados |
| `--recuadro-borde` / `--recuadro-borde-activo` / `--recuadro-fondo-activo` | `#FF6600` / `#52C3FC` / `#DCF3FE` | Recuadros de imagen |

### Tipografía

- `Verdana, Tahoma, "DejaVu Sans", sans-serif` en todo el sitio (el original usaba
  MS Reference Sans Serif y Verdana). Se elimina Baloo 2 y el paquete `@fontsource/baloo-2`.
- Tamaños: título de categoría 40 px; título de artículo 28 px; subtítulos 24 px;
  introducción 21 px; párrafos 18 px; placas 17 px en negrita; panel y menú 18 px en negrita;
  celdas de la cuadrícula 13 px.

### Piezas (componentes)

| Pieza | Descripción |
|---|---|
| **Botón redondo** | Círculo de 50 px con anillo verde con brillo y centro de color: azul para Inicio, naranja para Atrás y Adelante (este, de 40 px), claro para Sonido y Acerca de. |
| **Placa** | 214×82 px, degradado amarillo con reflejo superior, borde verde de 3 px, sombra; ícono de 60 px y nombre en negro; inclinada con `perspective` y `rotateY(-14deg)` (en las dos columnas el borde derecho queda más alto, como en el original). |
| **Pestaña-flecha** | La placa elegida se reemplaza por una pestaña azul con punta hacia el centro, ícono y texto blanco. |
| **Panel azul** | Rectángulo con esquinas redondeadas, degradado azul y un reflejo curvo; lista de subcategorías con cuadro de ícono de 44×42. |
| **Curvas** | SVG propio en tres variantes: `naranja` (inicio, categoría), `franja` (banda baja bajo el título del artículo, para no tapar el texto) y `azul` (vista de imágenes). |
| **Celda de tema** | 106×124 px, miniatura de 64×64 con borde negro y título debajo; bajo el mouse o con foco, fondo naranja con brillo. Sin foto, usa el ícono de su subcategoría. |
| **Recuadro de imagen** | 170×206 px, fondo blanco, borde naranja de 2 px y esquinas redondeadas; miniatura de 146 px con un pequeño ícono de tipo (imagen, mapa, audio, video); título azul de 12 px. |
| **Botón con brillo** | Rectángulo redondeado con degradado y reflejo; azul («Contempla las imágenes») o naranja («Lee el artículo», «¡Pon a prueba lo que sabes!», «Jugar otra vez»). |
| **Barras de desplazamiento** | `scrollbar-color` verde (`#8EE01E` sobre `#A7EC2B`) en los navegadores que lo admiten. |

## 8. Pantallas

### Barra superior (todas las páginas)

- Ocupa todo el ancho, 64 px de alto, degradado verde con reflejo, borde inferior verde oscuro.
- De izquierda a derecha: Inicio, Atrás, Adelante; «Buscar» con el campo blanco de borde verde
  y un botón verde con flecha; Sonido; Acerca de; logo propio («Mi Primera Enciclopedia»).
- Atlas y Juegos ya no van en la barra: están en las placas del inicio.
- Se conserva con `transition:persist` al navegar.

### Inicio (`/`)

- Escenario de 1024×600 sobre fondo blanco con curvas naranjas; grupo central de 792 px.
- Columna izquierda: Animales, Planeta Tierra, Espacio, Cuerpo humano, Historia.
  Columna derecha: Arte y música, Ciencia y tecnología, Países, Atlas, Juega y aprende.
- En el centro, el logo propio grande.
- Cada placa es un enlace a su página (`/categoria/<slug>`, `/atlas` o `/juegos`), así que
  funciona sin JavaScript. Con JavaScript, en escritorio y tablet:
  - pasar el mouse: el texto se pone azul y la voz dice el nombre;
  - clic: se oye el clic, la placa se vuelve pestaña-flecha, el logo se oculta y aparece el
    panel azul con las subcategorías (enlaces). Otro clic en otra placa cambia el panel;
  - teclado: Enter o Espacio abre el panel y lleva el foco a la primera subcategoría;
    Escape lo cierra y devuelve el foco a la placa.
- Sale el bloque «¿Sabías que…?» del inicio.

### Categoría (`/categoria/<cat>` y `/categoria/<cat>/<sub>`)

- `/categoria/<cat>` muestra su primera subcategoría; `/categoria/<cat>/<sub>`, la indicada.
- Cabecera de 66 px: ícono y título naranja de 40 px. Curvas naranjas detrás.
- Menú azul de 236 px a la izquierda con todas las subcategorías; la actual con la
  pestaña-flecha `--azul-elegido`, texto `--amarillo-elegido` y `aria-current="page"`.
- A la derecha, cuadrícula de celdas de tema de la subcategoría.

### Artículo (`/articulo/<slug>`)

- Cabecera: título naranja de 28 px y, a la derecha, el botón azul «Contempla las imágenes»
  (solo si el artículo tiene medios).
- Franja de curvas bajo el título.
- Columna de texto (hasta 560 px) a la izquierda; columna derecha con:
  1. recuadros de imagen (1 o 2 columnas de 170 px según el ancho);
  2. «¿Sabías que…?»: recuadro amarillo con una explicación de un cuestionario relacionada
     con el artículo (si hay);
  3. «Artículos relacionados» con enlaces azules;
  4. botón naranja «¡Pon a prueba lo que sabes!».
- Al pie, las atribuciones, como ahora.

### Contempla las imágenes (`/articulo/<slug>/imagenes`)

- Página estática nueva. Fondo con curvas azules; botón naranja «Lee el artículo» que vuelve.
- Visor grande (imagen, audio o video) con su pie, autor y licencia; a la derecha, una tira de
  recuadros de imagen.
- Sin JavaScript: cada recuadro enlaza a `#medio-<n>` y el visor muestra el `:target`
  (o el primero si no hay ninguno). Los recuadros de imagen del artículo enlazan a esta página
  con el ancla del medio.

### Juega y aprende (`/juegos`)

- Plantilla de categoría: título «Juega y aprende», menú con la subcategoría «Cuestionarios»,
  cuadrícula con los 8 cuestionarios (ícono de su categoría).

### Cuestionario (`/juegos/cuestionario/<slug>`)

- La pregunta va en el panel azul: foto a la izquierda (con su crédito) y texto blanco.
- Las 3 respuestas son placas amarillas sin inclinación.
- Al responder: la correcta se marca en verde con ✓ y la elegida equivocada en rojo con ✗
  (nunca solo por color), con el sonido de acierto o error; debajo aparece la explicación en
  un recuadro blanco con borde naranja.
- Arriba, 10 estrellas marcan el avance. Al final: puntaje, nombre para la tabla de puntajes
  (como ahora) y botón naranja «Jugar otra vez».

### Atlas (`/atlas`) y ficha de país (`/pais/<adm0>`)

- El mapa y su lógica no cambian. Mar celeste, título naranja, continentes como placas
  amarillas pequeñas sin inclinación, ficha del país en un recuadro blanco con borde naranja.
- Nuevo: `?vista=africa|america|asia|europa|oceania|mundo` elige la vista inicial; un valor
  desconocido se ignora.
- La ficha de país usa la plantilla de artículo.

### Búsqueda

- Sugerencias en una lista blanca con borde verde colgada del campo.
- `/buscar`: título naranja «Resultados para "<consulta>"»; lista con miniatura de 64 px,
  título en `--enlace` y resumen. Sin resultados: un recuadro con «No encontré nada. Revisa
  cómo se escribe o elige una categoría.» (antes lo decía Lumi).

### Acerca de y 404

- Plantilla de artículo. En «Acerca de» se borra la línea de Baloo 2 y la mención de Lumi.

## 9. Accesibilidad

- Contrastes (verificados en `tests/unit/contraste.test.ts`):
  - `--naranja-titulo` sobre blanco ≥ 3:1, y solo se usa en texto de 24 px o más;
  - `--verde-texto` sobre los tres verdes de la barra ≥ 4,5:1;
  - blanco sobre `--azul-panel-1` y `--azul-panel-2` ≥ 4,5:1;
  - `--amarillo-elegido` sobre `--azul-elegido` ≥ 4,5:1;
  - `--placa-texto-activo` y negro sobre `--amarillo-3` ≥ 4,5:1;
  - `--enlace` sobre blanco ≥ 4,5:1.
- El amarillo `#FFB400` del original para la subcategoría bajo el mouse se mantiene solo como
  estado pasajero, acompañado de subrayado.
- Foco visible con contorno de 3 px en placas, celdas, botones redondos y recuadros.
- `prefers-reduced-motion`: sin transiciones de la pestaña-flecha ni del panel.
- Las curvas son decorativas (`aria-hidden`).

## 10. Sonido y voz

- Se mantiene el clic sintetizado y los sonidos de acierto, error y fanfarria.
- Nuevo `hablar(texto)` en `src/lib/sonido-sitio.ts`, con `speechSynthesis`:
  - voz en español (`es-*`) si el sistema tiene una; si no, no suena;
  - solo después de la primera interacción (clic o tecla), por la política de los navegadores;
  - respeta el botón de silencio y cancela la frase anterior al pasar a otra placa;
  - frases: «Animales», «Planeta Tierra», …, «Atlas», «Juega y aprende».

## 11. Tamaños de pantalla

| Ancho | Comportamiento |
|---|---|
| ≥ 1024 px | Barra a todo el ancho; contenido de 1024 px como máximo, centrado; las curvas se extienden a los costados. |
| 768–1023 px | El escenario del inicio se escala en proporción (unidades de contenedor). Las demás páginas se acomodan: el artículo pasa a una columna de recuadros. |
| < 768 px | Barra compacta: Inicio, Atrás, lupa que despliega el buscador y logo pequeño. Inicio: las 10 placas en una columna, sin inclinación ni panel; tocar una abre su página. Categoría: subcategorías en una fila deslizable de botones azules y cuadrícula de 3 columnas. Artículo: una columna, recuadros en una fila deslizable. Se elimina la barra inferior. |

## 12. Cambios en el código

| Archivo | Cambio |
|---|---|
| `src/data/subcategorias.ts`, `src/lib/subcategorias.ts` | Nuevos: datos de la sección 6 y funciones `subcategoriasDe(cat)`, `subcategoriaDe(slug)`, `validarReparto(articulos)`. |
| `scripts/validar.ts` | Llama a `validarReparto`. |
| `src/config.ts` | `PLACAS_INICIO` (orden y destino de las 10 placas), íconos nuevos; se quita `SITIO.personaje`. |
| `scripts/iconos/descargar.ts` | Incluye los íconos de subcategorías y placas. |
| `src/components/Barra.astro` | Nuevo; reemplaza `BarraHerramientas.astro` y la barra de título de `Ventana.astro`. |
| `src/components/Curvas.astro` | Nuevo: SVG de fondo con variantes `naranja`, `franja`, `azul`. |
| `src/components/Placas.astro` | Nuevo: escenario del inicio, placas, panel y su script. |
| `src/components/MenuSubcategorias.astro`, `CeldaTema.astro`, `RecuadroMedio.astro`, `SabiasQue.astro`, `BotonBrillo.astro` | Nuevos. |
| `src/pages/index.astro` | Reescrito con `Placas`. |
| `src/pages/categoria/[slug].astro`, `src/pages/categoria/[slug]/[sub].astro` | Plantilla de categoría. |
| `src/pages/articulo/[slug].astro`, `src/pages/articulo/[slug]/imagenes.astro` | Plantilla de artículo y vista de imágenes; `PanelMultimedia.astro` se reemplaza por los recuadros y el visor. |
| `src/pages/juegos/index.astro`, `src/pages/juegos/cuestionario/[slug].astro`, `src/components/Cuestionario.tsx` | Nuevo aspecto; se quitan los eventos `mpe:guia`. |
| `src/components/Atlas.tsx` | Lee `?vista=`; nuevo aspecto. |
| `src/components/ResultadosBusqueda.tsx`, `Buscador.tsx` | Nuevo aspecto; mensaje sin resultados en la página. |
| `src/layouts/Base.astro` | Sin `Ventana`, sin Baloo 2, sin `mensajesGuia`; usa `Barra`. |
| `src/styles/tokens.css`, `src/styles/global.css` | Reescritos con la paleta y las piezas de la sección 7. |
| Se borran | `Ventana.astro`, `Guia.astro`, `BarraHerramientas.astro`, `PanelMultimedia.astro`, `TarjetaArticulo.astro` (lo reemplaza `CeldaTema.astro`), `src/lib/guia.ts`, `tests/unit/guia.test.ts`, `tests/e2e/guia.spec.ts`, la dependencia `@fontsource/baloo-2`. |

## 13. Pruebas

### Unitarias (Vitest)

- `subcategorias.test.ts`: el reparto real cubre cada artículo de su categoría exactamente una
  vez; `validarReparto` informa artículo faltante, repetido, en otra categoría, inexistente y
  subcategoría vacía o con slug repetido.
- `contraste.test.ts`: los pares de la sección 9.
- `iconos.test.ts`: incluye los íconos de subcategorías y placas sin repetir.
- Atlas: `vistaDesdeUrl('?vista=africa')` devuelve `africa`; un valor desconocido, `mundo`.
- Voz: `hablar` no llama a `speechSynthesis` si está silenciado, antes de la primera
  interacción o sin voz en español (con un `speechSynthesis` falso).

### Extremo a extremo (Playwright, build de producción en el puerto 4329)

- Inicio: hay 10 placas; clic en «Animales» muestra el panel con 5 subcategorías y la pestaña;
  clic en «Aves» lleva a `/categoria/animales/aves` con Guacamayo y Pingüino.
- Teclado: Tab hasta una placa, Enter abre el panel con el foco en la primera subcategoría,
  Escape lo cierra.
- Sin JavaScript: la placa «Animales» lleva a `/categoria/animales`.
- Celular (390 px): la placa lleva directo a la categoría; no hay panel.
- Artículo: «Contempla las imágenes» abre `/articulo/leon/imagenes`; «Lee el artículo» vuelve.
- Atlas: `/atlas?vista=africa` abre con la vista de África.
- Búsqueda sin resultados muestra el mensaje en la página.
- axe sin violaciones en inicio, categoría, artículo, imágenes, juegos, cuestionario, atlas,
  búsqueda, Acerca de y 404.
- Se actualizan las pruebas existentes que dependían de la ventana, de Lumi o de los mosaicos.

### Revisión visual

- Capturas de inicio, categoría, artículo e imágenes a 1280, 900 y 390 px de ancho, comparadas
  a ojo con las maquetas aprobadas (no se automatiza la comparación de píxeles).

## 14. Riesgos y decisiones

- **Fidelidad frente a contraste:** el naranja de los títulos y algunos azules se oscurecen un
  poco respecto del original para cumplir los contrastes de la sección 9.
- **Curva del artículo:** en el original pasa por detrás del texto; aquí es una franja bajo el
  título para que los subtítulos naranjas se lean.
- **Voz:** depende de las voces instaladas en cada equipo; en algunos no sonará.
- **Íconos:** OpenMoji en lugar de las fotos de las placas del original; el aspecto es más de
  dibujo que fotográfico.
- **Atlas y juegos en el inicio:** dejan de estar en la barra superior; se llega a ellos por
  sus placas.

## 15. Supuestos

- El reparto de la sección 6 lo revisa el usuario en esta especificación; se puede cambiar
  editando `src/data/subcategorias.ts`.
- Las maquetas aprobadas en la sesión de diseño (inicio, categoría, artículo e imágenes) son
  la referencia visual; viven en el scratchpad de la sesión y no en el repositorio.
