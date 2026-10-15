import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import { codigosIconos, urlIcono } from '../../scripts/iconos/descargar';
import { CATEGORIAS, ICONOS } from '../../src/config';
import { SUBCATEGORIAS } from '../../src/data/subcategorias';
import { placasInicio } from '../../src/lib/placas';

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

  it('incluye los íconos de subcategorías y del panel del inicio', () => {
    const codigos = codigosIconos();
    for (const s of Object.values(SUBCATEGORIAS).flat()) expect(codigos).toContain(s.icono);
    for (const p of placasInicio()) {
      for (const c of [p.icono, ...p.enlaces.map((e) => e.icono)]) expect(codigos).toContain(c);
    }
  });

  it('cada ícono usado está descargado en public/iconos', () => {
    for (const c of codigosIconos()) expect(existsSync(`public/iconos/${c}.svg`), c).toBe(true);
  });
});
