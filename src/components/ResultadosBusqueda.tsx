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
