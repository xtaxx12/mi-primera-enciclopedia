import { describe, it, expect } from 'vitest';
import { licenciaPermitida } from '../../scripts/import/licencias';

describe('licenciaPermitida', () => {
  it.each([
    ['cc-by-sa-3.0', 'cc-by-sa'],
    ['cc-by-sa-4.0', 'cc-by-sa'],
    ['cc-by-2.0', 'cc-by'],
    ['CC-BY-4.0', 'cc-by'],
    ['pd', 'dominio-publico'],
    ['cc0', 'cc0'],
  ])('acepta %s', (codigo, esperado) => {
    expect(licenciaPermitida(codigo)).toBe(esperado);
  });

  it.each(['gfdl', 'cc-by-nc-2.0', 'cc-by-nc-sa-3.0', 'cc-by-nd-4.0', 'fal', '', undefined])('rechaza %s', (codigo) => {
    expect(licenciaPermitida(codigo)).toBeNull();
  });
});
