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
