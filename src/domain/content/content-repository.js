/**
 * domain/content/content-repository.js
 *
 * Único punto de entrada público para leer contenido publicado
 * (Library/Book/Unit/Lesson), análogo a
 * persistence/storage-contract.js como único punto de entrada de su
 * capa. Nadie fuera de este módulo debería importar
 * library-catalog.js directamente.
 *
 * Puro y síncrono a propósito: la fuente de datos (library-catalog.js)
 * ya está en memoria como módulo ES (ver su propia nota de alcance),
 * así que no hay E/S real que esperar. No se envuelve en Promesas
 * "por si acaso" — igual que storage-contract.js documenta para
 * localStorage, un wrapper asíncrono artificial no tendría nada real
 * que modelar todavía (Wireframe Review: "el silencio es una
 * decisión de diseño válida").
 *
 * Regla de vecinos (Software Architecture §9.2): Domain & Content
 * "must never... know about the network, Supabase, or local storage
 * mechanics". Este módulo no conoce ninguno de los tres — solo lee
 * un módulo ES ya cargado y valida su forma. Tampoco conoce el event
 * bus ni el error boundary: si algo no es válido, devuelve `null` y
 * deja que quien orquesta (app/, que ya conoce varias capas por
 * diseño desde Sprint 1) decida cómo reportarlo.
 *
 * Sprint 3 añade getUnitById/getLessonById, y extiende la validación
 * de getBookById para recorrer Units y Lessons (antes solo validaba
 * la forma superficial del Book) — la misma etapa de Validación que
 * Software Architecture §7.3 describe para el Content Import
 * Pipeline, aplicada aquí como defensa en profundidad sobre contenido
 * ya estático y de confianza.
 */

import { LIBRARY_CATALOG } from './library-catalog.js';
import {
  isValidBookShape,
  isValidUnitShape,
  isValidLessonShape,
} from '../contracts/entity-shapes.js';

function isFullyValidBook(book) {
  return (
    isValidBookShape(book) &&
    book.units.every((unit) => isValidUnitShape(unit) && unit.lessons.every(isValidLessonShape))
  );
}

/**
 * Devuelve la Library completa (colección de Books). Nunca null:
 * una Library sin libros publicados sería `{ books: [] }`, la
 * instancia N=0 de la colección (C8) — no un caso especial.
 */
export function getLibrary() {
  return LIBRARY_CATALOG;
}

/**
 * Busca un Book publicado por id dentro de la Library.
 * Devuelve `null` si no existe o si su forma (incluida la de sus
 * Units y Lessons) no es válida — un Book que falla la validación no
 * es un Book que el motor intente renderizar (Software Architecture
 * §7.3, etapa de Validación).
 */
export function getBookById(bookId) {
  const found = LIBRARY_CATALOG.books.find((book) => book.id === bookId);
  if (!found) return null;
  return isFullyValidBook(found) ? found : null;
}

/**
 * Busca una Unit publicada dentro de un Book. Devuelve `null` si el
 * Book o la Unit no existen o no son válidos.
 */
export function getUnitById(bookId, unitId) {
  const book = getBookById(bookId);
  if (!book) return null;
  return book.units.find((unit) => unit.id === unitId) ?? null;
}

/**
 * Busca una Lesson publicada dentro de una Unit de un Book. Devuelve
 * `null` si cualquier nivel de la jerarquía no existe o no es
 * válido.
 */
export function getLessonById(bookId, unitId, lessonId) {
  const unit = getUnitById(bookId, unitId);
  if (!unit) return null;
  return unit.lessons.find((lesson) => lesson.id === lessonId) ?? null;
}
