import type MiniSearch from 'minisearch';
import { cargarIndice, type DocBusqueda } from './busqueda';

let promesa: Promise<MiniSearch<DocBusqueda>> | null = null;

/** Descarga el índice una sola vez y lo comparte entre islas; si falla, permite reintentar. */
export function obtenerIndice(): Promise<MiniSearch<DocBusqueda>> {
  if (!promesa) {
    promesa = fetch('/indice-busqueda.json')
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.text();
      })
      .then(cargarIndice);
    promesa.catch(() => {
      promesa = null;
    });
  }
  return promesa;
}
