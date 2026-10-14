import { describe, it, expect } from 'vitest';
import { generarInforme } from '../../scripts/import/informe';

describe('generarInforme', () => {
  it('resume y lista rechazos, descartes y avisos', () => {
    const md = generarInforme(
      [
        { titulo: 'León', estado: 'aceptado' },
        { titulo: 'Jirafa', estado: 'rechazado', motivo: 'es un esbozo' },
      ],
      [{ articulo: 'México', archivo: 'Cabeza olmeca.jpg', motivo: 'licencia no permitida o desconocida' }],
      ['Rugido.ogg: solo hay audio Ogg; puede no sonar en Safari'],
      '2026-10-14',
    );
    expect(md).toContain('- Artículos aceptados: 1');
    expect(md).toContain('- Artículos rechazados: 1');
    expect(md).toContain('| Jirafa | es un esbozo |');
    expect(md).toContain('| México | Cabeza olmeca.jpg | licencia no permitida o desconocida |');
    expect(md).toContain('- Rugido.ogg: solo hay audio Ogg; puede no sonar en Safari');
  });

  it('escapa barras verticales y muestra "Ninguno." en secciones vacías', () => {
    const md = generarInforme([{ titulo: 'A|B', estado: 'rechazado', motivo: 'x' }], [], [], '2026-10-14');
    expect(md).toContain('| A\\|B | x |');
    expect(md).toContain('Ninguno.');
  });
});
