import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { crearCliente } from '../../scripts/import/http';

let dir: string;
beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'mpe-http-'));
});

const ok = (cuerpo: unknown) => new Response(JSON.stringify(cuerpo), { status: 200 });

function cliente(fetchFn: typeof fetch, dormir = vi.fn(async () => {})) {
  return { dormir, c: crearCliente({ userAgent: 'prueba/1', directorioCache: dir, fetchFn, dormir }) };
}

describe('crearCliente', () => {
  it('envía el User-Agent', async () => {
    const fetchFn = vi.fn(async () => ok({ a: 1 }));
    const { c } = cliente(fetchFn as unknown as typeof fetch);
    await c.obtenerJson('https://x.test/a');
    const init = fetchFn.mock.calls[0][1] as RequestInit;
    expect((init.headers as Record<string, string>)['User-Agent']).toBe('prueba/1');
  });

  it('usa la caché para la misma URL', async () => {
    const fetchFn = vi.fn(async () => ok({ a: 1 }));
    const { c } = cliente(fetchFn as unknown as typeof fetch);
    expect(await c.obtenerJson('https://x.test/a')).toEqual({ a: 1 });
    expect(await c.obtenerJson('https://x.test/a')).toEqual({ a: 1 });
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  it('hace una pausa de 1000 ms antes de cada petición real menos la primera', async () => {
    const fetchFn = vi.fn(async () => ok({}));
    const { c, dormir } = cliente(fetchFn as unknown as typeof fetch);
    await c.obtenerJson('https://x.test/a');
    expect(dormir).not.toHaveBeenCalled();
    await c.obtenerJson('https://x.test/b');
    expect(dormir).toHaveBeenCalledWith(1000);
  });

  it('reintenta ante un 503 y luego responde', async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValueOnce(new Response('', { status: 503 }))
      .mockResolvedValueOnce(ok({ b: 2 }));
    const { c, dormir } = cliente(fetchFn as unknown as typeof fetch);
    expect(await c.obtenerJson('https://x.test/c')).toEqual({ b: 2 });
    expect(dormir).toHaveBeenCalledWith(2000);
  });

  it('se rinde después de 3 reintentos', async () => {
    const fetchFn = vi.fn(async () => new Response('', { status: 500 }));
    const { c, dormir } = cliente(fetchFn as unknown as typeof fetch);
    await expect(c.obtenerJson('https://x.test/d')).rejects.toThrow('HTTP 500');
    expect(fetchFn).toHaveBeenCalledTimes(4);
    expect(dormir).toHaveBeenCalledWith(8000);
  });

  it('reintenta ante un error de red', async () => {
    const fetchFn = vi.fn().mockRejectedValueOnce(new TypeError('fetch failed')).mockResolvedValueOnce(ok({ c: 3 }));
    const { c } = cliente(fetchFn as unknown as typeof fetch);
    expect(await c.obtenerJson('https://x.test/e')).toEqual({ c: 3 });
  });

  it('no reintenta un 404', async () => {
    const fetchFn = vi.fn(async () => new Response('', { status: 404 }));
    const { c } = cliente(fetchFn as unknown as typeof fetch);
    await expect(c.obtenerJson('https://x.test/f')).rejects.toThrow('HTTP 404');
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  it('descarga un archivo y no lo vuelve a pedir si ya existe', async () => {
    const fetchFn = vi.fn(async () => new Response(new Uint8Array([1, 2, 3]), { status: 200 }));
    const { c } = cliente(fetchFn as unknown as typeof fetch);
    const destino = join(dir, 'sub', 'x.bin');
    await c.descargar('https://x.test/x.bin', destino);
    expect([...(await readFile(destino))]).toEqual([1, 2, 3]);
    await c.descargar('https://x.test/x.bin', destino);
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  it('respeta un archivo existente aunque no lo haya descargado', async () => {
    const fetchFn = vi.fn(async () => ok({}));
    const { c } = cliente(fetchFn as unknown as typeof fetch);
    const destino = join(dir, 'y.bin');
    await writeFile(destino, 'ya estaba');
    await c.descargar('https://x.test/y.bin', destino);
    expect(fetchFn).not.toHaveBeenCalled();
  });
});
