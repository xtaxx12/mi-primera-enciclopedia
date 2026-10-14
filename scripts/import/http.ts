import { createHash } from 'node:crypto';
import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

export const USER_AGENT = 'MiPrimeraEnciclopedia/0.1 (proyecto educativo de portafolio)';

export interface OpcionesCliente {
  userAgent: string;
  directorioCache: string;
  pausaMs?: number;
  pausaDescargasMs?: number;
  esperasReintentoMs?: number[];
  fetchFn?: typeof fetch;
  dormir?: (ms: number) => Promise<void>;
}

export interface ClienteHttp {
  obtenerJson(url: string): Promise<unknown>;
  descargar(url: string, destino: string): Promise<void>;
}

export class ErrorHttp extends Error {
  constructor(
    public estado: number,
    public url: string,
    public reintentable: boolean,
  ) {
    super(`HTTP ${estado} en ${url}`);
  }
}

const esperar = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

async function existe(ruta: string): Promise<boolean> {
  try {
    await access(ruta);
    return true;
  } catch {
    return false;
  }
}

export function crearCliente(op: OpcionesCliente): ClienteHttp {
  const fetchFn = op.fetchFn ?? fetch;
  const dormir = op.dormir ?? esperar;
  const pausaApi = op.pausaMs ?? 1000;
  const pausaDescargas = op.pausaDescargasMs ?? 250;
  const esperas = op.esperasReintentoMs ?? [2000, 4000, 8000];
  let primera = true;

  async function pedir(url: string, pausa: number): Promise<Response> {
    for (let intento = 0; ; intento++) {
      if (!primera) await dormir(pausa);
      primera = false;
      try {
        const r = await fetchFn(url, { headers: { 'User-Agent': op.userAgent } });
        if (!r.ok) throw new ErrorHttp(r.status, url, r.status >= 500 || r.status === 429);
        return r;
      } catch (e) {
        const reintentable = e instanceof ErrorHttp ? e.reintentable : true;
        if (!reintentable || intento >= esperas.length) throw e;
        await dormir(esperas[intento]);
      }
    }
  }

  return {
    async obtenerJson(url) {
      const ruta = join(op.directorioCache, `${createHash('sha1').update(url).digest('hex')}.json`);
      if (await existe(ruta)) return JSON.parse(await readFile(ruta, 'utf8'));
      const texto = await (await pedir(url, pausaApi)).text();
      const datos = JSON.parse(texto);
      await mkdir(op.directorioCache, { recursive: true });
      await writeFile(ruta, texto);
      return datos;
    },
    async descargar(url, destino) {
      if (await existe(destino)) return;
      const r = await pedir(url, pausaDescargas);
      const datos = Buffer.from(await r.arrayBuffer());
      await mkdir(dirname(destino), { recursive: true });
      await writeFile(destino, datos);
    },
  };
}
