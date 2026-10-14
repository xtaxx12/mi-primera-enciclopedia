import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { crearIndice, documentoDe } from '../lib/busqueda';
import type { Articulo } from '../lib/tipos';

export const GET: APIRoute = async () => {
  const articulos = (await getCollection('articulos')).map((e) => e.data as Articulo);
  return new Response(JSON.stringify(crearIndice(articulos.map(documentoDe))), {
    headers: { 'Content-Type': 'application/json' },
  });
};
