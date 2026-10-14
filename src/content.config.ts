import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { SLUGS_CATEGORIAS } from './config';

const idDesdeArchivo = ({ entry }: { entry: string }) => entry.replace(/\.json$/, '');

const licencia = z.enum(['dominio-publico', 'cc0', 'cc-by', 'cc-by-sa']);

const medio = z.object({
  archivo: z.string().min(1),
  tipo: z.enum(['imagen', 'audio', 'video']),
  alt: z.string(),
  autor: z.string().min(1),
  licencia,
  licenciaUrl: z.string(),
  fuenteUrl: z.url(),
});

const bloque = z.discriminatedUnion('tipo', [
  z.object({ tipo: z.literal('html'), html: z.string() }),
  z.object({ tipo: z.literal('figura'), archivo: z.string(), pie: z.string() }),
]);

const articulos = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/articulos', generateId: idDesdeArchivo }),
  schema: z.object({
    slug: z.string(),
    titulo: z.string(),
    categoria: z.enum(SLUGS_CATEGORIAS),
    resumen: z.string(),
    bloques: z.array(bloque),
    principal: medio.optional(),
    medios: z.array(medio),
    relacionados: z.array(z.string()),
    pais: z.object({ adm0: z.string().regex(/^[A-Z]{3}$/) }).optional(),
    fuente: z.object({ url: z.url(), historialUrl: z.url(), revid: z.number().int(), fecha: z.string() }),
  }),
});

const pregunta = z.object({
  id: z.string(),
  texto: z.string(),
  imagen: z.string(),
  opciones: z.tuple([z.string(), z.string(), z.string()]),
  correcta: z.union([z.literal(0), z.literal(1), z.literal(2)]),
  articulo: z.string(),
  explicacion: z.string(),
});

const cuestionarios = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/cuestionarios', generateId: idDesdeArchivo }),
  schema: z.object({
    slug: z.string(),
    titulo: z.string(),
    categoria: z.enum(SLUGS_CATEGORIAS),
    preguntas: z.array(pregunta).length(10),
  }),
});

export const collections = { articulos, cuestionarios };
