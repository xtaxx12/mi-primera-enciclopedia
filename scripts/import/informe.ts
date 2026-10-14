export interface EntradaInforme {
  titulo: string;
  estado: 'aceptado' | 'rechazado';
  motivo?: string;
}

export interface MedioDescartado {
  articulo: string;
  archivo: string;
  motivo: string;
}

const celda = (s: string) => s.replace(/\|/g, '\\|');

export function generarInforme(
  entradas: EntradaInforme[],
  descartados: MedioDescartado[],
  avisos: string[],
  fecha: string,
): string {
  const rechazados = entradas.filter((e) => e.estado === 'rechazado');
  const lineas = [
    '# Informe de importación',
    '',
    `Fecha: ${fecha}`,
    '',
    `- Artículos aceptados: ${entradas.length - rechazados.length}`,
    `- Artículos rechazados: ${rechazados.length}`,
    `- Archivos multimedia descartados: ${descartados.length}`,
    '',
    '## Artículos rechazados',
    '',
  ];
  if (rechazados.length) {
    lineas.push('| Artículo | Motivo |', '|---|---|', ...rechazados.map((e) => `| ${celda(e.titulo)} | ${celda(e.motivo ?? '')} |`));
  } else lineas.push('Ninguno.');
  lineas.push('', '## Multimedia descartada', '');
  if (descartados.length) {
    lineas.push(
      '| Artículo | Archivo | Motivo |',
      '|---|---|---|',
      ...descartados.map((d) => `| ${celda(d.articulo)} | ${celda(d.archivo)} | ${celda(d.motivo)} |`),
    );
  } else lineas.push('Ninguno.');
  lineas.push('', '## Avisos', '', ...(avisos.length ? avisos.map((a) => `- ${a}`) : ['Ninguno.']), '');
  return lineas.join('\n');
}
