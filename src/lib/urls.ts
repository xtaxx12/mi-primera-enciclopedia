/** Solo se enlazan URL https: un `javascript:` o `data:` en datos externos sería ejecutable al hacer clic. */
export function esHttps(url: string | undefined): boolean {
  try {
    return new URL(url ?? '').protocol === 'https:';
  } catch {
    return false;
  }
}

/** Devuelve la URL en https (las http se actualizan) o '' si usa otro protocolo. */
export function aHttps(url: string | undefined): string {
  try {
    const u = new URL(url ?? '');
    if (u.protocol === 'http:') u.protocol = 'https:';
    return u.protocol === 'https:' ? u.href : '';
  } catch {
    return '';
  }
}
