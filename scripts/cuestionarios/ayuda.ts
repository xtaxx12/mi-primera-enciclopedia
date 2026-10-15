import { readdir, readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { recortar, textoPlano } from '../../src/lib/texto';
import type { Articulo } from '../../src/lib/tipos';

export function fichaParaCuestionario(a: Articulo): string {
  const imagenes = a.medios.filter((m) => m.tipo === 'imagen').map((m) => `"${m.archivo}"`);
  const texto = textoPlano(a.bloques.flatMap((b) => (b.tipo === 'html' ? [b.html] : [])).join(' '));
  return [
    `### ${a.titulo} (articulo: "${a.slug}")`,
    `imagenes: ${imagenes.join(', ') || '(ninguna: no usar este artículo)'}`,
    recortar(texto, 1500),
    '',
  ].join('\n');
}

async function main() {
  const categoria = process.argv[2];
  if (!categoria) {
    console.error('Uso: npm run ayuda-cuestionario -- animales');
    process.exit(1);
  }
  const dir = 'src/content/articulos';
  const articulos: Articulo[] = [];
  for (const f of (await readdir(dir)).filter((x) => x.endsWith('.json'))) {
    const a = JSON.parse(await readFile(`${dir}/${f}`, 'utf8')) as Articulo;
    if (a.categoria === categoria) articulos.push(a);
  }
  articulos.sort((x, y) => x.titulo.localeCompare(y.titulo, 'es'));
  console.log(articulos.map(fichaParaCuestionario).join('\n'));
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
