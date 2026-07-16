/**
 * config/runtime-config.js
 *
 * Resuelve configuración derivada del entorno de ejecución real — en
 * particular, el base path bajo el que se sirve la app, que en
 * GitHub Pages puede ser un sub-path del dominio, no la raíz
 * (Software Architecture §21.2). Ningún otro módulo debe calcular
 * esto por su cuenta (Sprint 1 Plan §10).
 */

import { envPublic } from './env.public.js';

function resolveBasePath() {
  // document.baseURI ya resuelve un <base href> si existiera; si no,
  // cae a la URL del documento actual. Se toma solo el directorio,
  // nunca el nombre de archivo, y siempre termina en "/".
  const url = new URL(document.baseURI);
  const dir = url.pathname.endsWith('/')
    ? url.pathname
    : url.pathname.replace(/[^/]*$/, '');
  return dir;
}

/**
 * @param {{ env?: object }} [overrides] - inyección explícita para
 *   pruebas o para un entorno distinto al navegador real; nunca se
 *   usa en producción (composición real ocurre solo en app/bootstrap.js).
 */
export function createRuntimeConfig(overrides = {}) {
  const basePath = resolveBasePath();

  return Object.freeze({
    basePath,
    env: overrides.env ?? envPublic,

    /**
     * Resuelve un path de asset relativo contra el base path real,
     * para que ninguna referencia a assets/ quede hardcodeada a la
     * raíz del dominio (Sprint 1 Plan §13).
     */
    resolveAssetPath(relativePath) {
      const clean = String(relativePath).replace(/^\/+/, '');
      return basePath + clean;
    },
  });
}
