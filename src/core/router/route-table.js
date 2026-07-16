/**
 * core/router/route-table.js
 *
 * Traduce un path de hash en una Navigation State (Sprint 1 Plan
 * §9.3). Ninguna entrada de esta tabla conoce datos de un libro
 * real — solo la forma de la jerarquía (Software Architecture §16.2;
 * C8: "N libros es la regla", nunca un singleton hardcodeado).
 *
 * Sprint 2+ añade aquí patrones como "library", "book/:id",
 * "unit/:id", "lesson/:id", "review" — sin tocar router.js, que es
 * el punto de extensión que este archivo existe para habilitar.
 */

import { createEmptyNavigationState } from './navigation-state.js';

const ROUTES = Object.freeze([
  {
    // Ruta raíz: sin libro, sin unidad, sin lección. Es el estado
    // "vacío" válido de la jerarquía en Sprint 1 — no un caso
    // especial que el router deba tratar de forma distinta. Reusa
    // la forma canónica en vez de repetirla — la forma vive en un
    // único lugar (navigation-state.js).
    pattern: /^\/?$/,
    toNavigationState: () => createEmptyNavigationState(),
  },
]);

/**
 * Devuelve la Navigation State de la primera ruta cuyo patrón
 * matchea, o null si ninguna matchea. Quien llama decide el
 * fallback — este módulo no conoce UX ni tiene opinión sobre qué
 * hacer ante una ruta desconocida.
 */
export function matchRoute(path) {
  for (const route of ROUTES) {
    const match = route.pattern.exec(path);
    if (match) {
      return route.toNavigationState(match);
    }
  }
  return null;
}
