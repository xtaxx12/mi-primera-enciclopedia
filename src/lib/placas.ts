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
