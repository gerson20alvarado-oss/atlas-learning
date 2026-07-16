/**
 * core/router/route-table.js
 *
 * Traduce un path de hash en una Navigation State (Sprint 1 Plan
 * §9.3). Ninguna entrada de esta tabla conoce datos de un libro
 * real — solo la forma de la jerarquía (Software Architecture §16.2;
 * C8: "N libros es la regla", nunca un singleton hardcodeado).
 *
 * Sprint 2 añade "library" y "book/:bookId" — el alcance exacto de
 * Phase 2 del Roadmap ("Library, Book cards, Book loading"). La fila
 * de Unit dentro de Book screen se muestra (con su whisper bar,
 * Design System §13.2) pero deliberadamente no navega todavía: no
 * hay screen de Unit que la reciba hasta Reader (Sprint 3, Roadmap
 * Phase 3), y crear una ruta "unit/:id" sin destino real produciría
 * una pantalla sin salida — lo que violaría "navigation never
 * surprises" (PDD §1.2) más de lo que lo preserva. "unit/:id",
 * "lesson/:id" y "review" llegan cuando sus sprints lo requieran —
 * sin tocar router.js, que es el punto de extensión que este
 * archivo existe para habilitar.
 *
 * Semántica de los campos poblados aquí (antes todos null desde
 * Sprint 1): `libraryPosition` es un marcador fijo `'library'` que
 * indica "el estudiante está navegando el árbol Library → Book" (hay
 * una única Library, nunca varias que seleccionar — C8 la modela
 * como colección de Books, no de Libraries). `bookPosition` es el id
 * real del Book seleccionado.
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
