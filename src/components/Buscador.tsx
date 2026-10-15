import { useEffect, useId, useRef, useState } from 'preact/hooks';
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
  const campo = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Si se escribió antes de que la isla cargara, se conserva lo escrito.
    const escrito = campo.current?.value ?? '';
    const inicial = escrito || (variante === 'grande' ? (new URLSearchParams(location.search).get('q') ?? '') : '');
    if (inicial) setConsulta(inicial);
    if (document.activeElement === campo.current) {
      prepararIndice();
      setAbierto(true);
    }
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
    <form class={`buscador buscador-${variante}`} role="search" action="/buscar" onSubmit={alEnviar}>
      <label class="visualmente-oculto" for={`${id}-campo`}>
        Buscar en la enciclopedia
      </label>
      <input
        ref={campo}
        id={`${id}-campo`}
        name="q"
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
      <button type="submit" class="ir" aria-label="Buscar" disabled={deshabilitado}>
        <img src="/iconos/27A1.svg" width={22} height={22} alt="" />
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
