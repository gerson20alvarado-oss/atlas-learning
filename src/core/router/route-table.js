/**
 * core/router/route-table.js
 *
 * Traduce un path de hash en una Navigation State (Sprint 1 Plan
 * §9.3). Ninguna entrada de esta tabla conoce datos de un libro
 * real — solo la forma de la jerarquía (Software Architecture §16.2;
 * C8: "N libros es la regla", nunca un singleton hardcodeado).
 *
 * Sprint 2 añadió "library" y "book/:bookId". Sprint 3 completa la
 * "Navigation" que el Roadmap asigna a Phase 3 (Reader): "unit/:id",
 * "lesson/:id" y el modo de sesión activa — exactamente los tres
 * niveles que el comentario de Sprint 2 dejó documentados como
 * pendientes. "review" (Review Mode) sigue sin ruta — depende de
 * Error Records, que no existen hasta el Exercise Engine (Sprint 5).
 *
 * Semántica de los campos poblados aquí: `libraryPosition` es un
 * marcador fijo `'library'` (hay una única Library — C8 la modela
 * como colección de Books, no de Libraries). `bookPosition`,
 * `unitPosition` y `lessonPosition` son los id reales de cada nivel
 * seleccionado. `mode` distingue "en la puerta de la lección"
 * (`null`) de "dentro de la sesión de estudio activa" (`'learn'`) —
 * el mismo campo que Software Architecture §4.2 reserva para
 * distinguir Learn Mode de Review Mode, poblado por primera vez
 * aquí.
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
  {
    // Library: la raíz de la jerarquía navegable de contenido.
    pattern: /^\/library\/?$/,
    toNavigationState: () => ({
      ...createEmptyNavigationState(),
      libraryPosition: 'library',
    }),
  },
  {
    // Book: un miembro concreto de la colección de Books. El id no
    // se valida aquí — el router solo modela la FORMA de la
    // jerarquía (Software Architecture §16.2); si el id no
    // corresponde a un Book publicado, quien resuelve la screen
    // (app/screen-router.js) lo trata como contenido no encontrado,
    // no como una ruta inválida.
    pattern: /^\/book\/([^/]+)\/?$/,
    toNavigationState: (match) => ({
      ...createEmptyNavigationState(),
      libraryPosition: 'library',
      bookPosition: match[1],
    }),
  },
  {
    // Unit: un miembro concreto dentro del Book seleccionado.
    pattern: /^\/book\/([^/]+)\/unit\/([^/]+)\/?$/,
    toNavigationState: (match) => ({
      ...createEmptyNavigationState(),
      libraryPosition: 'library',
      bookPosition: match[1],
      unitPosition: match[2],
    }),
  },
  {
    // Lesson entry: la puerta de compromiso antes de la sesión
    // (Wireframe Review §2.5) — mode sigue en null.
    pattern: /^\/book\/([^/]+)\/unit\/([^/]+)\/lesson\/([^/]+)\/?$/,
    toNavigationState: (match) => ({
      ...createEmptyNavigationState(),
      libraryPosition: 'library',
      bookPosition: match[1],
      unitPosition: match[2],
      lessonPosition: match[3],
    }),
  },
  {
    // Learning Session, Learn Mode: sesión de estudio activa.
    pattern: /^\/book\/([^/]+)\/unit\/([^/]+)\/lesson\/([^/]+)\/learn\/?$/,
    toNavigationState: (match) => ({
      ...createEmptyNavigationState(),
      libraryPosition: 'library',
      bookPosition: match[1],
      unitPosition: match[2],
      lessonPosition: match[3],
      mode: 'learn',
    }),
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
