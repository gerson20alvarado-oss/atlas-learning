/**
 * domain/content/content-repository.js
 *
 * Único punto de entrada público para leer contenido publicado
 * (Library/Book), análogo a persistence/storage-contract.js como
 * único punto de entrada de su capa. Nadie fuera de este módulo
 * debería importar library-catalog.js directamente.
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
 */

import { LIBRARY_CATALOG } from './library-catalog.js';
import { isValidBookShape } from '../contracts/entity-shapes.js';

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
 * Devuelve `null` si no existe o si su forma no es válida — un Book
 * que falla la validación no es un Book que el motor intente
 * renderizar (Software Architecture §7.3, etapa de Validación).
 */
export function getBookById(bookId) {
  const found = LIBRARY_CATALOG.books.find((book) => book.id === bookId);
  if (!found) return null;
  return isValidBookShape(found) ? found : null;
}
