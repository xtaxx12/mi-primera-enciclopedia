import type { Licencia } from '../../src/lib/tipos';

/** Convierte el código `License` de extmetadata ("cc-by-sa-4.0", "pd", "cc0"…) en una licencia permitida. */
export function licenciaPermitida(codigo: string | undefined): Licencia | null {
  if (!codigo) return null;
  const c = codigo.trim().toLowerCase();
  if (c === 'pd' || c.startsWith('pd-') || c === 'public domain') return 'dominio-publico';
  if (c === 'cc0' || c.startsWith('cc0-') || c === 'cc-zero') return 'cc0';
  if (/^cc-by-sa-\d/.test(c)) return 'cc-by-sa';
  if (/^cc-by-\d/.test(c)) return 'cc-by';
  return null;
}
