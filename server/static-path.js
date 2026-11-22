import path from 'node:path';

// Compare path components rather than assuming a Unix separator on Windows.
export function resolveStaticPath(root, pathname, pathApi = path) {
  const base = pathApi.resolve(root);
  const candidate = pathApi.resolve(base, '.' + (pathname === '/' ? '/index.html' : pathname));
  const relative = pathApi.relative(base, candidate);
  if (!relative || relative === '..' || relative.startsWith('..' + pathApi.sep) || pathApi.isAbsolute(relative)) return null;
  return candidate;
}
