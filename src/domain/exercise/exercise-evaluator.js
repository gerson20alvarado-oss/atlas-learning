/**
 * domain/exercise/exercise-evaluator.js
 *
 * El Exercise Engine propiamente dicho (Software Architecture §6.2):
 * Exercise + Response → juicio de corrección determinista, sin round-
 * trip de red (PRD §22 "never batched"). Este módulo es
 * deliberadamente la pieza más pequeña y más aislada de todo Sprint
 * 5 — a pedido explícito, NUNCA debe conocer Session, Router,
 * Persistence ni Presentation. Solo conoce Exercise (dato) y Response
 * (lo que sea que el estudiante haya enviado) y devuelve un
 * resultado — nada más.
 *
 * Quién crea el Attempt a partir de este resultado, quién lo
 * persiste, y cómo avanza la Session, es responsabilidad de la capa
 * Application (app/screen-router.js) — nunca de este archivo (Sprint
 * 5 Plan, "observación arquitectónica adicional").
 *
 * Normalización de respuestas (Sprint 5 Plan, decisión #6):
 * mínima y completamente determinista — recorta espacios al
 * inicio/final y colapsa espacios internos múltiples en uno solo.
 * Nunca ignora mayúsculas/minúsculas, nunca elimina acentos, nunca
 * aplica equivalencias lingüísticas. Si un contenido necesita
 * aceptar variantes, debe declararlas explícitamente en
 * `acceptedAnswers` — el motor nunca "adivina".
 */

export function normalizeResponse(text) {
  if (typeof text !== 'string') return '';
  return text.trim().replace(/\s+/g, ' ');
}

function evaluateMultipleChoice(exercise, response) {
  const isCorrect = response === exercise.correctOptionId;
  const correctOption = exercise.options.find((option) => option.id === exercise.correctOptionId);
  return Object.freeze({
    isCorrect,
    correctAnswerDisplay: correctOption ? correctOption.text : '',
  });
}

function evaluateTextResponse(exercise, response) {
  const normalizedResponse = normalizeResponse(response);
  const isCorrect = exercise.acceptedAnswers
    .map(normalizeResponse)
    .includes(normalizedResponse);
  return Object.freeze({
    isCorrect,
    correctAnswerDisplay: exercise.acceptedAnswers[0] ?? '',
  });
}

/**
 * Punto único de evaluación — despacha por `exercise.type`. Añadir un
 * tipo nuevo (matching, ordering, listening — PRD §24) significa
 * añadir una rama aquí, nunca tocar Session, Progress, Error Record
 * ni ningún otro módulo (Software Architecture §6.3, Design System
 * §17.6). Un `exercise.type` no reconocido devuelve un resultado
 * honesto en vez de lanzar — no debería alcanzarse nunca en la
 * práctica porque exercise-repository.js ya valida la forma antes de
 * publicar un Exercise, pero es defensa en profundidad.
 */
export function evaluateExercise(exercise, response) {
  switch (exercise.type) {
    case 'multipleChoice':
      return evaluateMultipleChoice(exercise, response);
    case 'fillBlank':
    case 'typing':
      return evaluateTextResponse(exercise, response);
    default:
      return Object.freeze({ isCorrect: false, correctAnswerDisplay: '' });
  }
}
