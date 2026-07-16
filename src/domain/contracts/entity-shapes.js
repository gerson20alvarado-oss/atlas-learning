/**
 * domain/contracts/entity-shapes.js
 *
 * Declara la FORMA de las entidades nombradas por Software
 * Architecture §4.2 — Library, Book, Unit, Lesson, Dynamic Learning
 * Section, Content Block — sin lógica de negocio de dominio más allá
 * de la validación de forma (Sprint 1 Plan §6). Ningún campo aquí
 * puede nombrar un concepto específico de materia como "Grammar" o
 * "Vocabulary" (C5), ni asumir un único libro (C8): todo es siempre
 * una colección, incluso cuando tiene 0 o 1 elemento.
 *
 * Sprint 3 añade Section y Content Block — antes deliberadamente
 * ausentes ("no se pre-declaran vacías", Sprint 2). Los ocho
 * primitivos de Content Block son el vocabulario COMPLETO y cerrado
 * de la plataforma (Software Architecture §4.2, §5.3; Design System
 * §19.1) — ningún noveno primitivo puede añadirse por libro (C5).
 * Que el motor de renderizado (Sprint 3) todavía no implemente los
 * ocho (ver presentation/components/content-blocks/) no es una
 * violación de este contrato: la forma reconoce los ocho tipos desde
 * ahora, y solo la capa de presentación decide cuáles renderiza cada
 * sprint — el contrato de datos no cambiará cuando se complete.
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
 * @property {DynamicLearningSection[]} sections
 */

/**
 * @typedef {object} DynamicLearningSection
 * @property {string} id
 * @property {string} label - Etiqueta que el libro declara (p. ej.
 *   "Reading", "Vocabulary") — dato, nunca un tipo (§4.3, C5).
 * @property {ContentBlock[]} blocks
 */

/**
 * @typedef {object} ContentBlock
 * @property {string} id
 * @property {'prose'|'term'|'dialogue'|'media'|'aside'|'example'|'table'|'practice'} type
 *
 * Campos adicionales requeridos según `type` — ver
 * CONTENT_BLOCK_REQUIRED_FIELDS_BY_TYPE.
 */

const REQUIRED_BOOK_KEYS = Object.freeze(['id', 'title', 'units']);
const REQUIRED_UNIT_KEYS = Object.freeze(['id', 'title', 'lessons']);
const REQUIRED_LESSON_KEYS = Object.freeze([
  'id',
  'title',
  'estimatedStudyMinutes',
  'sections',
]);
const REQUIRED_SECTION_KEYS = Object.freeze(['id', 'label', 'blocks']);
const REQUIRED_CONTENT_BLOCK_KEYS = Object.freeze(['id', 'type']);

// Los ocho primitivos completos (Software Architecture §4.2; Design
// System §19) y sus campos propios. Un `type` fuera de esta lista no
// es un Content Block válido — es exactamente lo que C5 prohíbe.
const CONTENT_BLOCK_REQUIRED_FIELDS_BY_TYPE = Object.freeze({
  prose: ['paragraphs'],
  term: ['entries'],
  dialogue: ['turns'],
  media: ['mediaType'],
  aside: ['body'],
  example: ['body'],
  table: ['headers', 'rows'],
  practice: ['exerciseId'],
});

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
  return (
    hasShape(candidate, REQUIRED_LESSON_KEYS) &&
    Array.isArray(candidate.sections) &&
    candidate.sections.every(isValidSectionShape) &&
    isValidPedagogicalSequence(candidate.sections)
  );
}

export function isValidSectionShape(candidate) {
  return (
    hasShape(candidate, REQUIRED_SECTION_KEYS) &&
    Array.isArray(candidate.blocks) &&
    candidate.blocks.every(isValidContentBlockShape)
  );
}

export function isValidContentBlockShape(candidate) {
  if (!hasShape(candidate, REQUIRED_CONTENT_BLOCK_KEYS)) return false;
  const typeFields = CONTENT_BLOCK_REQUIRED_FIELDS_BY_TYPE[candidate.type];
  if (!typeFields) return false; // type desconocido: noveno primitivo, rechazado (C5)
  return typeFields.every((key) => key in candidate);
}

/**
 * Invariante de secuenciación pedagógica (Software Architecture
 * §5.2, §5.4; Design System §19.9): "contenido antes que práctica"
 * dentro de cada Dynamic Learning Section — la única regla que el
 * motor impone sobre el orden de un libro (PRD §16).
 *
 * CORRECCIÓN (Sprint 4 Plan): la implementación original de Sprint 3
 * evaluaba esto como una única secuencia aplanada de TODA la Lesson
 * (todas las Sections concatenadas), lo que en la práctica prohibía
 * más de un ciclo contenido→práctica por Lesson — imposible de
 * satisfacer para libros reales que intercalan explicación y
 * práctica en cada punto gramatical (el patrón pedagógico más común
 * en libros de idiomas, incluido Hi! Korean 3A). Esa implementación
 * era más estricta de lo que el texto congelado exige: Design System
 * §19.9 ata explícitamente la regla a "a section's feedback/continue"
 * (una Section, no la Lesson completa), y el propio Session Container
 * (§18.1) ya renderiza una Section a la vez, cada una con su propio
 * ciclo. Se corrige aquí para validar la invariante de forma
 * independiente POR Section — cada Section puede tener su propio
 * ciclo contenido → ejemplo → práctica, pero nunca contenido nuevo
 * después de que esa misma Section haya empezado su práctica.
 *
 * Con cero Content Blocks de tipo "practice" (el caso de Sprint 3: el
 * Exercise Engine todavía no existe, Roadmap Phase 5), la regla se
 * cumple de forma vacua en cualquiera de las dos interpretaciones —
 * por eso el cambio no afecta ningún contenido ya validado antes de
 * Sprint 4.
 */
export function isValidPedagogicalSequence(sections) {
  return sections.every((section) => {
    let sawPractice = false;
    for (const block of section.blocks) {
      if (block.type === 'practice') {
        sawPractice = true;
      } else if (sawPractice) {
        return false; // contenido nuevo después de práctica, dentro de la misma Section: inválido
      }
    }
    return true;
  });
}

/**
 * Una Library vacía es la instancia N=0 de la colección — no un
 * estado especial, no un error, no un caso a tratar distinto (C8).
 */
export function createEmptyLibrary() {
  return Object.freeze({ books: [] });
}
