# Mi Primera Enciclopedia

Enciclopedia infantil en español que recrea la experiencia de Mi Primera Encarta (2009)
con contenido libre. Homenaje a Mi Primera Encarta (2009). Proyecto no afiliado a Microsoft.

El aspecto (barra verde, placas amarillas, panel azul, títulos naranjas) reproduce la
composición de Mi Primera Encarta dibujada de nuevo con CSS y SVG propios; no se usa
ningún archivo del producto original.

- Código: MIT (ver `LICENSE`).
- Artículos y cuestionarios: CC BY-SA 3.0, basados en Vikidia.
- Multimedia: cada archivo con su licencia de Wikimedia Commons.

## Comandos

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Valida el contenido y genera el sitio en `dist/` |
| `npm test` | Pruebas unitarias |
| `npm run test:e2e` | Pruebas de extremo a extremo (Playwright, sobre el build de producción en el puerto 4329) |
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
4. Si agregaste o quitaste artículos, ubícalos en `src/data/subcategorias.ts`: el build
   falla si un artículo no está en exactamente una subcategoría de su categoría.
