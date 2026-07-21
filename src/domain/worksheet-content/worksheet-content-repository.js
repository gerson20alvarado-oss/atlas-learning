/**
 * domain/worksheet-content/worksheet-content-repository.js
 *
 * Único punto de entrada del dominio para resolver el contenido de
 * una unidad de evaluaciones — mismo principio que
 * `getPageResources(bookId, pageNumber)` en Hi! Korean, aplicado aquí
 * de forma independiente. Hoy solo existe la Unidad 1 real; las
 * demás se agregan al mismo mapa, cada una en su propio módulo de
 * contenido, sin que este repositorio cambie de forma.
 *
 * Evoluciones independientes por unidad (esta sesión): `getWorksheetUnit`
 * sigue existiendo tal cual (metadata de la unidad — bookId, título,
 * video — que no pertenece a ninguna evaluación en particular).
 * `getAssessment` es la pieza nueva: resuelve UNA evaluación concreta
 * dentro de esa unidad (Worksheet, Progress Test, futuras), aplanada
 * a un único objeto con todo lo que assessment-screen.js necesita
 * (bookId/unitNumber/unitTitle/video heredados de la unidad +
 * assessmentId/title/maxAttempts/sections propios de la evaluación)
 * — la pantalla nunca tiene que combinar dos objetos por su cuenta.
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

/**
 * Resuelve una evaluación concreta de una unidad, aplanada para
 * assessment-screen.js. Devuelve `null` si la unidad no existe o si
 * la unidad existe pero no declara esa evaluación (ej. un libro sin
 * Progress Test todavía) — mismo criterio honesto que el resto de
 * Atlas: quien llama decide cómo mostrar "no disponible", nunca una
 * pantalla en blanco sin explicación.
 */
export function getAssessment(bookId, unitNumber, assessmentId) {
  const unit = getWorksheetUnit(bookId, unitNumber);
  const assessment = unit?.assessments?.[assessmentId];
  if (!assessment) return null;

  return {
    bookId: unit.bookId,
    unitId: unit.unitId,
    unitNumber: unit.unitNumber,
    unitTitle: unit.unitTitle,
    video: unit.video,
    assessmentId: assessment.assessmentId,
    assessmentTitle: assessment.title,
    maxAttempts: assessment.maxAttempts,
    // Política de revisión (esta sesión): 'practice' por defecto —
    // contenido existente que no la declare se comporta exactamente
    // como hasta ahora, sin ningún cambio de comportamiento.
    reviewPolicy: assessment.reviewPolicy ?? 'practice',
    sections: assessment.sections,
  };
}

/**
 * Resuelve la actividad Writing de una unidad, aplanada para
 * writing-screen.js — análoga a getAssessment(), pero
 * deliberadamente fuera de `assessments`: Writing nunca tiene
 * `maxAttempts` ni `assessmentId` porque no es una evaluación.
 * Devuelve `null` si la unidad no existe o no declara Writing —
 * mismo criterio honesto que el resto de Atlas.
 */
export function getWriting(bookId, unitNumber) {
  const unit = getWorksheetUnit(bookId, unitNumber);
  if (!unit?.writing) return null;

  return {
    bookId: unit.bookId,
    unitId: unit.unitId,
    unitNumber: unit.unitNumber,
    unitTitle: unit.unitTitle,
    title: unit.writing.title,
    instructions: unit.writing.instructions,
  };
}

/**
 * Lista, en orden de declaración, los `assessmentId` que una unidad
 * ofrece — lo que screen-router.js necesita para saber si existe
 * "la siguiente evaluación" (ej. ¿hay Progress Test después de la
 * Worksheet?) sin hardcodear ese conocimiento fuera del contenido.
 */
export function listAssessmentIds(bookId, unitNumber) {
  const unit = getWorksheetUnit(bookId, unitNumber);
  return unit?.assessments ? Object.keys(unit.assessments) : [];
}
