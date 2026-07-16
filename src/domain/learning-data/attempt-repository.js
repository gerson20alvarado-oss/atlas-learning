/**
 * domain/learning-data/attempt-repository.js
 *
 * Único punto de entrada del dominio hacia Persistence para
 * Attempts — mismo patrón que session-repository.js. Append-only
 * (Software Architecture §11.4): ningún Attempt se edita ni se
 * borra, solo se añaden nuevos. Error Record (Sprint 5 Plan, decisión
 * #4) es una vista derivada de esta misma colección filtrada por
 * `isCorrect === false` — no existe un repositorio ni una colección
 * separada para Error Record; `getErrorRecordsForLesson` de aquí
 * abajo ES esa vista, calculada en el momento, nunca almacenada
 * aparte.
 *
 * Regla de vecinos: conoce el storage contract inyectado, nunca el
 * mecanismo real detrás de él. No conoce Session, Router ni
 * Presentation — desconoce por completo cómo o cuándo se dispara un
 * Attempt; solo sabe cómo guardarlo y consultarlo una vez que ya
 * existe (esa creación ocurre en app/screen-router.js, que es quien
 * conoce el evaluador, este repositorio, y la UI a la vez).
 */

import { isValidAttemptShape } from '../contracts/attempt-shape.js';

const ATTEMPTS_STORAGE_KEY = 'attempts';

function readAllAttempts(storage) {
  const raw = storage.read(ATTEMPTS_STORAGE_KEY);
  if (!Array.isArray(raw)) return [];
  return raw.filter(isValidAttemptShape);
}

export function createAttemptRepository(storage) {
  /**
   * Registra un nuevo Attempt. Recibe los datos ya evaluados
   * (exerciseId, lessonId, response, isCorrect) — este repositorio
   * no evalúa nada, solo estampa `id`/`timestamp` y persiste
   * (append, nunca sobrescribe intentos previos).
   */
  function recordAttempt({ exerciseId, lessonId, response, isCorrect }) {
    const attempt = {
      id: `attempt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      exerciseId,
      lessonId,
      response,
      isCorrect,
      timestamp: new Date().toISOString(),
    };

    if (!isValidAttemptShape(attempt)) return null;

    const all = readAllAttempts(storage);
    all.push(attempt);
    const wrote = storage.write(ATTEMPTS_STORAGE_KEY, all);
    return wrote ? attempt : null;
  }

  function getAttemptsForLesson(lessonId) {
    return readAllAttempts(storage).filter((attempt) => attempt.lessonId === lessonId);
  }

  function getAttemptsForExercise(lessonId, exerciseId) {
    return getAttemptsForLesson(lessonId).filter((attempt) => attempt.exerciseId === exerciseId);
  }

  /**
   * El intento más reciente para un ejercicio dado, o `null` si
   * nunca se respondió — es lo que permite restaurar el estado de un
   * bloque `practice` sin depender de ningún puntero en Session
   * (Sprint 5 Plan, decisión #5).
   */
  function getLatestAttempt(lessonId, exerciseId) {
    const attempts = getAttemptsForExercise(lessonId, exerciseId);
    if (attempts.length === 0) return null;
    return attempts[attempts.length - 1];
  }

  function hasCorrectAttempt(lessonId, exerciseId) {
    return getAttemptsForExercise(lessonId, exerciseId).some((attempt) => attempt.isCorrect);
  }

  /**
   * Vista derivada — Error Record (Sprint 5 Plan, decisión #4): todo
   * Attempt incorrecto de una Lesson. No es una entidad persistida;
   * se recalcula cada vez a partir de Attempts, la única fuente de
   * verdad. Sin consumidor todavía (Review Mode queda fuera de
   * Sprint 5 a pedido explícito) — se expone ya para que ese futuro
   * sprint no necesite ningún cambio de esquema, solo empezar a
   * llamarla.
   */
  function getErrorRecordsForLesson(lessonId) {
    return getAttemptsForLesson(lessonId).filter((attempt) => !attempt.isCorrect);
  }

  return Object.freeze({
    recordAttempt,
    getAttemptsForLesson,
    getAttemptsForExercise,
    getLatestAttempt,
    hasCorrectAttempt,
    getErrorRecordsForLesson,
  });
}
