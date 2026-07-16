/**
 * persistence/adapters/local-storage-adapter.js
 *
 * Mecanismo real de almacenamiento — hoy localStorage. Solo lee y
 * escribe strings; no conoce el envelope versionado ni ningún dato
 * de dominio (Sprint 1 Plan §12.2). Software Architecture §10.5:
 * "el mecanismo específico es una decisión de fase de
 * implementación" — esta es esa fase, y queda contenida aquí. Si el
 * futuro exige IndexedDB, el cambio se limita a este archivo.
 */

export function createLocalStorageAdapter() {
  function readRaw(key) {
    return window.localStorage.getItem(key);
  }

  function writeRaw(key, serialized) {
    window.localStorage.setItem(key, serialized);
  }

  function removeRaw(key) {
    window.localStorage.removeItem(key);
  }

  return Object.freeze({ readRaw, writeRaw, removeRaw });
}
