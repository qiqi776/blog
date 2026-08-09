export const BASE_PATH = import.meta.env.BASE_URL || '/';

const normalizedBase = BASE_PATH === '/' ? '' : BASE_PATH.replace(/\/$/, '');

export const ROUTER_BASENAME = normalizedBase || '/';

export function withBasePath(path) {
  if (
    !path ||
    !path.startsWith('/') ||
    path.startsWith('//') ||
    path.startsWith(`${normalizedBase}/`) ||
    path === normalizedBase
  ) {
    return path;
  }

  return normalizedBase ? `${normalizedBase}${path}` : path;
}
