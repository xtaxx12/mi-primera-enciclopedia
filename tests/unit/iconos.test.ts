import { describe, it, expect } from 'vitest';
import { codigosIconos, urlIcono } from '../../scripts/iconos/descargar';
import { CATEGORIAS, ICONOS } from '../../src/config';

describe('iconos', () => {
  it('incluye los íconos de categorías y de la interfaz sin repetir', () => {
    const codigos = codigosIconos();
    for (const c of CATEGORIAS) expect(codigos).toContain(c.icono);
    for (const c of Object.values(ICONOS)) expect(codigos).toContain(c);
    expect(new Set(codigos).size).toBe(codigos.length);
  });

  it('usa la versión fija de OpenMoji', () => {
    expect(urlIcono('1F981')).toBe('https://unpkg.com/openmoji@17.0.0/color/svg/1F981.svg');
  });
});
