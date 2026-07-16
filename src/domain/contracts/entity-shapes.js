/**
 * domain/contracts/entity-shapes.js
 *
 * Declara la FORMA de las entidades nombradas por Software
 * Architecture §4.2 — Library, Book, Unit, Lesson — sin datos ni
 * lógica de negocio todavía (Sprint 1 Plan §6). Ningún campo aquí
 * puede nombrar un concepto específico de materia como "Grammar" o
 * "Vocabulary" (C5), ni asumir un único libro (C8): todo es siempre
 * una colección, incluso cuando tiene 0 o 1 elemento.
 *
 * Sprint 2 (Library) es quien primero puebla estas formas con datos
 * reales, publicados por el Content Import Pipeline (Software
 * Architecture §7) — este archivo no debería necesitar cambiar
 * cuando eso ocurra.
 */

/**
 * @typedef {object} Library
 * @property {Book[]} books
 */

/**
 * @typedef {object} Book
 * @property {string} id
 * @property {string} title
 * @property {Unit[]} units
 */

/**
 * @typedef {object} Unit
 * @property {string} id
 * @property {string} title
 * @property {Lesson[]} lessons
 */

/**
 * @typedef {object} Lesson
 * @property {string} id
 * @property {string} title
 * @property {number} estimatedStudyMinutes
 *
 * Nota: las Dynamic Learning Sections (PRD §16) se añaden cuando un
 * sprint futuro renderiza contenido real — no se pre-declaran vacías
 * aquí, siguiendo "el silencio es una decisión de diseño válida".
 */

const REQUIRED_BOOK_KEYS = Object.freeze(['id', 'title', 'units']);
const REQUIRED_UNIT_KEYS = Object.freeze(['id', 'title', 'lessons']);
const REQUIRED_LESSON_KEYS = Object.freeze(['id', 'title', 'estimatedStudyMinutes']);

function hasShape(candidate, requiredKeys) {
  return (
    !!candidate &&
    typeof candidate === 'object' &&
    requiredKeys.every((key) => key in candidate)
  );
}

export function isValidBookShape(candidate) {
  return hasShape(candidate, REQUIRED_BOOK_KEYS) && Array.isArray(candidate.units);
}

export function isValidUnitShape(candidate) {
  return hasShape(candidate, REQUIRED_UNIT_KEYS) && Array.isArray(candidate.lessons);
}

export function isValidLessonShape(candidate) {
  return hasShape(candidate, REQUIRED_LESSON_KEYS);
}

/**
 * Una Library vacía es la instancia N=0 de la colección — no un
 * estado especial, no un error, no un caso a tratar distinto (C8).
 */
export function createEmptyLibrary() {
  return Object.freeze({ books: [] });
}
