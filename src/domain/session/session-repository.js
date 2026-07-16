/**
 * domain/session/session-repository.js
 *
 * Único punto de entrada del dominio para leer y escribir la Session
 * activa (Software Architecture §4.2, §10, §14) — análogo a
 * content-repository.js para contenido publicado. Nadie fuera de este
 * módulo debería llamar a storage-contract.js para datos de Session.
 *
 * Regla de vecinos (Software Architecture §9.2–9.3): esta capa conoce
 * la capa Persistence que recibe inyectada (el "storage contract" de
 * persistence/storage-contract.js) pero no conoce el mecanismo real
 * detrás de él (localStorage, IndexedDB, lo que sea) — esa distinción
 * ya la resuelve storage-contract.js/local-storage-adapter.js. Este
 * módulo tampoco conoce el event bus ni el error boundary, siguiendo
 * el mismo criterio que content-repository.js: devuelve valores
 * honestos (null, o el resultado de la escritura) y deja que quien
 * orquesta (app/) decida cómo reportar cualquier caso anómalo.
 *
 * Sprint 4 (Progress, Roadmap Phase 4): primer módulo que persiste un
 * dato de dominio real, tal como storage-contract.js anticipaba desde
 * Sprint 1. Progress numérico real (derivado de Attempts) sigue sin
 * existir — eso es Sprint 5, Exercise Engine (Software Architecture
 * §15.2, §6.2) — este repositorio solo resuelve la posición de Session
 * (Restore Session, PRD §18), nunca completitud de Lesson/Unit/Book.
 */

import { createEmptySession, isValidSessionShape } from '../contracts/session-shape.js';

const SESSION_STORAGE_KEY = 'session';

export function createSessionRepository(storage) {
  /**
   * Devuelve la Session persistida, o `null` si nunca hubo una
   * (estudiante nuevo) o si la última Session terminó (ver
   * clearSession, invocado al llegar a "Finish" — Sprint 4 Plan).
   * Nunca devuelve una Session con forma inválida: en ese caso
   * degrada a `null`, igual que content-repository.js degrada un
   * Book con forma inválida a `null` en vez de propagarlo.
   */
  function getSession() {
    const raw = storage.read(SESSION_STORAGE_KEY);
    if (raw === null) return null;
    return isValidSessionShape(raw) ? raw : null;
  }

  /**
   * Actualiza la Session con los campos dados, conservando el resto
   * (mismo patrón que un PATCH, nunca un PUT completo) — así que
   * quien llama nunca necesita conocer campos que no le conciernen
   * (p. ej. actualizar `scrollPosition` no obliga a repetir
   * `bookId`/`unitId`/`lessonId`). `updatedAt` se recalcula siempre,
   * nunca se acepta del llamador.
   */
  function saveSession(partialUpdate) {
    const current = getSession() ?? createEmptySession();
    const next = {
      ...current,
      ...partialUpdate,
      updatedAt: new Date().toISOString(),
    };

    if (!isValidSessionShape(next)) {
      // Defensa en profundidad: un partialUpdate con una clave ajena
      // al contrato no debe persistirse silenciosamente con forma
      // incorrecta. No hay sesión activa que interrumpir aquí (esto
      // ocurre en la capa de dominio, no en un evento de UI) — se
      // rechaza la escritura y se devuelve `null` para que quien
      // orquesta decida cómo reportarlo (mismo criterio que
      // content-repository.js).
      return null;
    }

    const wrote = storage.write(SESSION_STORAGE_KEY, next);
    return wrote ? next : null;
  }

  /**
   * Limpia la Session persistida por completo. Se invoca cuando un
   * estudiante llega al final de una Lesson ("Finish") — sin
   * Attempts/Progress real todavía (Sprint 5), no hay una "siguiente
   * lección" que recomendar con certeza, así que el estado honesto es
   * "no hay nada que continuar" (mismo mensaje vacío que ya existía en
   * Home antes de Sprint 4), en vez de dejar apuntando a una Session
   * ya completamente leída.
   */
  function clearSession() {
    return storage.remove(SESSION_STORAGE_KEY);
  }

  return Object.freeze({ getSession, saveSession, clearSession });
}
