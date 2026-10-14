import { pathToFileURL } from 'node:url';
import { crearCliente, USER_AGENT, type ClienteHttp } from './http';
import { API_VIKIDIA } from './metadatos';

export interface Candidato {
  titulo: string;
  longitud: number;
  esbozo: boolean;
}

export function ordenarCandidatos(candidatos: Candidato[]): Candidato[] {
  return [...candidatos].sort((a, b) => Number(a.esbozo) - Number(b.esbozo) || b.longitud - a.longitud);
}

export function formatearCandidatos(candidatos: Candidato[]): string {
  return candidatos.map((c) => `${String(c.longitud).padStart(7)}  ${c.titulo}${c.esbozo ? '  [esbozo]' : ''}`).join('\n');
}

export async function listarCandidatos(
  cliente: ClienteHttp,
  categoria: string,
): Promise<{ paginas: Candidato[]; subcategorias: string[] }> {
  const miembros = new URLSearchParams({
    action: 'query',
    list: 'categorymembers',
    cmtitle: `Categoría:${categoria}`,
    cmtype: 'page|subcat',
    cmlimit: '500',
    format: 'json',
    formatversion: '2',
  });
  const datos = (await cliente.obtenerJson(`${API_VIKIDIA}?${miembros}`)) as {
    query?: { categorymembers?: { ns: number; title: string }[] };
  };
  const lista = datos.query?.categorymembers ?? [];
  const subcategorias = lista.filter((m) => m.ns === 14).map((m) => m.title.replace(/^Categoría:/, ''));
  const titulos = lista.filter((m) => m.ns === 0).map((m) => m.title);

  const paginas: Candidato[] = [];
  for (let i = 0; i < titulos.length; i += 50) {
    const info = new URLSearchParams({
      action: 'query',
      titles: titulos.slice(i, i + 50).join('|'),
      prop: 'info|categories',
      clcategories: 'Categoría:Vikidia:Esbozos',
      cllimit: 'max',
      format: 'json',
      formatversion: '2',
    });
    const r = (await cliente.obtenerJson(`${API_VIKIDIA}?${info}`)) as {
      query?: { pages?: { title: string; length?: number; categories?: unknown[] }[] };
    };
    for (const p of r.query?.pages ?? []) {
      paginas.push({ titulo: p.title, longitud: p.length ?? 0, esbozo: (p.categories?.length ?? 0) > 0 });
    }
  }
  return { paginas, subcategorias };
}

async function main() {
  const categorias = process.argv.slice(2);
  if (categorias.length === 0) {
    console.error('Uso: npm run candidatos -- "Mamíferos" "Aves"');
    process.exit(1);
  }
  const cliente = crearCliente({ userAgent: USER_AGENT, directorioCache: 'scripts/import/.cache' });
  for (const categoria of categorias) {
    const { paginas, subcategorias } = await listarCandidatos(cliente, categoria);
    console.log(`\n=== ${categoria} (${paginas.length} páginas) ===`);
    if (subcategorias.length) console.log(`Subcategorías: ${subcategorias.join(', ')}`);
    console.log(formatearCandidatos(ordenarCandidatos(paginas)));
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
