/**
 * domain/learning-data/attempt-repository.js
 *
 * Único punto de entrada del dominio hacia Persistence para
 * Attempts — mismo patrón que session-repository.js. Append-only
 * (Software Architecture §11.4): ningún Attempt se edita ni se
 * borra salvo los dos campos de metadato de Sprint 6 (`userId`,
 * `syncedAt` — ver attempt-shape.js). Error Record (Sprint 5 Plan,
 * decisión #4) es una vista derivada de esta misma colección
 * filtrada por `isCorrect === false` — `getErrorRecordsForLesson` de
 * aquí abajo ES esa vista, calculada en el momento, nunca almacenada
 * aparte.
 *
 * Sprint 6 (Authentication) añade los métodos que el flujo de
 * vinculación de cuenta (app/account-linking/) necesita para
 * distinguir Attempts huérfanos/propios/ajenos y reconciliarlos con
 * un snapshot remoto. Ninguno de estos métodos implementa política
 * de sincronización continua — eso sigue siendo, deliberadamente,
 * responsabilidad de una futura capa Sync todavía no diseñada
 * (Sprint 6 Plan, Opción A: alcance mínimo y controlado).
 *
 * Regla de vecinos: conoce el storage contract inyectado, nunca el
 * mecanismo real detrás de él. No conoce Auth, Router ni
 * Presentation — desconoce por completo cuándo o por qué se crea un
 * Attempt o se ejecuta una vinculación; solo sabe cómo guardar y
 * consultar estos datos una vez que existen.
 */

import { isValidAttemptShape } from '../contracts/attempt-shape.js';

const ATTEMPTS_STORAGE_KEY = 'attempts';

function readAllAttempts(storage) {
  const raw = storage.read(ATTEMPTS_STORAGE_KEY);
  if (!Array.isArray(raw)) return [];
  return raw.filter(isValidAttemptShape);
}

function writeAllAttempts(storage, attempts) {
  return storage.write(ATTEMPTS_STORAGE_KEY, attempts);
}

export function createAttemptRepository(storage) {
  /**
   * Registra un nuevo Attempt. `userId` es `null` por defecto —
   * huérfano — hasta que exista una sesión de Auth real; quien
   * orquesta (app/screen-router.js) pasa el `userId` de la sesión
   * activa si existe. `syncedAt` siempre nace en `null`: un Attempt
   * recién creado, con o sin conexión, es indistinguible hasta que
   * algo confirme su subida (Sprint 6 Plan, punto 1).
   */
  function recordAttempt({ exerciseId, lessonId, response, isCorrect, userId = null }) {
    const attempt = {
      id: `attempt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      exerciseId,
      lessonId,
      response,
      isCorrect,
      timestamp: new Date().toISOString(),
      userId,
      syncedAt: null,
    };

    if (!isValidAttemptShape(attempt)) return null;

    const all = readAllAttempts(storage);
    all.push(attempt);
    const wrote = writeAllAttempts(storage, all);
    return wrote ? attempt : null;
  }

  function getAttemptsForLesson(lessonId) {
    return readAllAttempts(storage).filter((attempt) => attempt.lessonId === lessonId);
  }

  function getAttemptsForExercise(lessonId, exerciseId) {
    return getAttemptsForLesson(lessonId).filter((attempt) => attempt.exerciseId === exerciseId);
  }

  function getLatestAttempt(lessonId, exerciseId) {
    const attempts = getAttemptsForExercise(lessonId, exerciseId);
    if (attempts.length === 0) return null;
    return attempts[attempts.length - 1];
  }

  function hasCorrectAttempt(lessonId, exerciseId) {
    return getAttemptsForExercise(lessonId, exerciseId).some((attempt) => attempt.isCorrect);
  }

  function getErrorRecordsForLesson(lessonId) {
    return getAttemptsForLesson(lessonId).filter((attempt) => !attempt.isCorrect);
  }

  // ---- Sprint 6: propiedad (huérfano / propio / ajeno) ----

  function getOrphanAttempts() {
    return readAllAttempts(storage).filter((attempt) => attempt.userId === null);
  }

  function getOwnAttempts(userId) {
    return readAllAttempts(storage).filter((attempt) => attempt.userId === userId);
  }

  function getForeignAttempts(userId) {
    return readAllAttempts(storage).filter(
      (attempt) => attempt.userId !== null && attempt.userId !== userId,
    );
  }

  /** Caso 1 de la vinculación: reclama todos los huérfanos para `userId`, en un solo write. */
  function claimOrphanAttempts(userId) {
    const all = readAllAttempts(storage);
    const claimed = all.map((attempt) =>
      attempt.userId === null ? { ...attempt, userId } : attempt,
    );
    return writeAllAttempts(storage, claimed);
  }

  /** Descarta (Caso 4 / rama "descartar" del Caso 3) todos los Attempts huérfanos, sin preguntar de nuevo — la decisión ya se tomó. */
  function discardOrphanAttempts() {
    const all = readAllAttempts(storage);
    const kept = all.filter((attempt) => attempt.userId !== null);
    return writeAllAttempts(storage, kept);
  }

  /** Dispositivo compartido: descarta silenciosamente todo lo que pertenezca a otra cuenta — nunca se fusiona, nunca se muestra. */
  function discardForeignAttempts(userId) {
    const all = readAllAttempts(storage);
    const kept = all.filter((attempt) => attempt.userId === null || attempt.userId === userId);
    return writeAllAttempts(storage, kept);
  }

  /**
   * Incorpora Attempts que ya existían en el snapshot remoto de la
   * cuenta (Casos 2 y 3). Deduplicado por `id`: un Attempt remoto que
   * ya existe localmente (p. ej. porque ya se había subido en una
   * vinculación anterior) nunca se duplica. Los Attempts remotos
   * llegan ya `syncedAt` — por definición ya estaban en Supabase, no
   * hace falta volver a subirlos.
   */
  function mergeRemoteAttempts(userId, remoteAttempts) {
    const all = readAllAttempts(storage);
    const localIds = new Set(all.map((a) => a.id));
    const toAdd = remoteAttempts
      .filter((remote) => !localIds.has(remote.id))
      .map((remote) => ({ ...remote, userId, syncedAt: remote.syncedAt ?? new Date().toISOString() }))
      .filter(isValidAttemptShape);
    if (toAdd.length === 0) return true;
    return writeAllAttempts(storage, [...all, ...toAdd]);
  }

  /** Marca como sincronizados los Attempts dados, tras una escritura remota exitosa. */
  function markAttemptsSynced(ids, timestamp = new Date().toISOString()) {
    const idSet = new Set(ids);
    const all = readAllAttempts(storage);
    const updated = all.map((attempt) =>
      idSet.has(attempt.id) ? { ...attempt, syncedAt: timestamp } : attempt,
    );
    return writeAllAttempts(storage, updated);
  }

  return Object.freeze({
    recordAttempt,
    getAttemptsForLesson,
    getAttemptsForExercise,
    getLatestAttempt,
    hasCorrectAttempt,
    getErrorRecordsForLesson,
    getOrphanAttempts,
    getOwnAttempts,
    getForeignAttempts,
    claimOrphanAttempts,
    discardOrphanAttempts,
    discardForeignAttempts,
    mergeRemoteAttempts,
    markAttemptsSynced,
  });
}
