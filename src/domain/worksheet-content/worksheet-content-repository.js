/**
 * domain/worksheet-content/worksheet-content-repository.js
 *
 * Único punto de entrada del dominio para resolver la unidad de una
 * worksheet — mismo principio que `getPageResources(bookId,
 * pageNumber)` en Hi! Korean, aplicado aquí de forma independiente.
 * Hoy solo existe la Unidad 1 real; las demás se agregan al mismo
 * mapa, cada una en su propio módulo de contenido, sin que este
 * repositorio cambie de forma.
 */

import { ALH_LEVEL_1_UNIT_1 } from './alh-level-1-unit-1.js';

const UNITS_BY_BOOK = Object.freeze({
  'book-american-language-hub-1': Object.freeze({
    1: ALH_LEVEL_1_UNIT_1,
  }),
});

export function getWorksheetUnit(bookId, unitNumber) {
  return UNITS_BY_BOOK[bookId]?.[unitNumber] ?? null;
}
