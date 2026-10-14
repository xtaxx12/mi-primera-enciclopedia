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
