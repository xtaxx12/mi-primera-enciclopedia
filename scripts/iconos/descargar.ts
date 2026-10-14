import { access, copyFile, mkdir, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { CATEGORIAS, ICONOS } from '../../src/config';

export const VERSION_OPENMOJI = '17.0.0';

export function codigosIconos(): string[] {
  return [...new Set([...CATEGORIAS.map((c) => c.icono), ...Object.values(ICONOS)])];
}

export function urlIcono(codigo: string): string {
  return `https://unpkg.com/openmoji@${VERSION_OPENMOJI}/color/svg/${codigo}.svg`;
}

async function main() {
  await mkdir('public/iconos', { recursive: true });
  for (const codigo of codigosIconos()) {
    const destino = `public/iconos/${codigo}.svg`;
    try {
      await access(destino);
      continue;
    } catch {
      // no existe: se descarga
    }
    const r = await fetch(urlIcono(codigo));
    if (!r.ok) throw new Error(`No se pudo descargar ${codigo}: HTTP ${r.status}`);
    await writeFile(destino, await r.text());
    console.log(`✓ ${codigo}`);
  }
  await copyFile(`public/iconos/${ICONOS.libros}.svg`, 'public/favicon.svg');
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
