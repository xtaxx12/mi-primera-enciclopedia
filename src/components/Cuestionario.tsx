import { useEffect, useRef, useState } from 'preact/hooks';
import { estrellas, iniciarJuego, preguntaActual, puntaje, responder, siguiente, type EstadoJuego } from '../lib/preguntas';
import { entraEnTop, guardarPuntaje, leerPuntajes, type RegistroPuntaje } from '../lib/puntajes';
import { sonido } from '../lib/sonido-sitio';
import type { Pregunta } from '../lib/tipos';

function Estrella() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false">
      <path d="M12 2l3 7h7l-5.5 4.5 2 7.5L12 17l-6.5 4 2-7.5L2 9h7z" />
    </svg>
  );
}

export interface PreguntaVista extends Pregunta {
  imagenSrc: string;
  imagenAlt: string;
  tituloArticulo: string;
  credito: { autor: string; licencia: string; licenciaUrl: string; fuenteUrl: string };
}

export interface CuestionarioVista {
  slug: string;
  titulo: string;
  preguntas: PreguntaVista[];
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
    setJuego(responder(juego, opcion));
  }

  function avanzar() {
    const nuevo = siguiente(juego);
    setJuego(nuevo);
    if (!nuevo.terminado) return;
    sonido.reproducir('fanfarria');
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
          <a class="boton azul boton-grande" href="/juegos">
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
}
