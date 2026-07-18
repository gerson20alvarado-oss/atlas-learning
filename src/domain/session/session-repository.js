/**
 * domain/session/session-repository.js
 *
 * Único punto de entrada del dominio para leer y escribir la posición
 * de lectura activa (Software Architecture §4.2, §10, §14) — análogo
 * a content-repository.js para contenido publicado. Nadie fuera de
 * este módulo debería llamar a storage-contract.js para este dato.
 *
 * Evolución a ReaderPosition (Etapa 4, Technical Specification —
 * Reader como Lector de PDF v2.1, §5.1): este archivo no tuvo que
 * cambiar ninguna línea de lógica — ya era completamente agnóstico a
 * los nombres de campo, delegando la forma exacta por completo a
 * session-shape.js (`createEmptySession`/`isValidSessionShape`). El
 * mismo mecanismo de "PATCH + validación estricta" que ya existía es,
 * sin ningún cambio, el mecanismo completo de "sin migración,
 * reinicialización por invalidez de forma" ya aprobado: una Session
 * persistida con la forma anterior simplemente deja de pasar
 * `isValidSessionShape` y `getSession()` degrada a `null`, igual que
 * ya hacía con cualquier otra forma inválida.
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
 */

import { createEmptySession, isValidSessionShape } from '../contracts/session-shape.js';

const SESSION_STORAGE_KEY = 'session';

export function createSessionRepository(storage) {
  /**
   * Devuelve la ReaderPosition persistida, o `null` si nunca hubo una
   * (estudiante nuevo), si la sesión de lectura anterior terminó (ver
   * clearSession), o si lo persistido tiene una forma que ya no es
   * válida (p. ej. una Session con la forma anterior, previa a esta
   * etapa) — en cualquiera de esos tres casos, degrada a `null`, igual
   * que content-repository.js degrada un Book con forma inválida a
   * `null` en vez de propagarlo.
   */
  function getSession() {
    const raw = storage.read(SESSION_STORAGE_KEY);
    if (raw === null) return null;
    return isValidSessionShape(raw) ? raw : null;
  }

  /**
   * Actualiza la ReaderPosition con los campos dados, conservando el
   * resto (mismo patrón que un PATCH, nunca un PUT completo) — así
   * que quien llama nunca necesita repetir campos que no le
   * conciernen (p. ej. actualizar `pageNumber` no obliga a repetir
   * `bookId`). `updatedAt` se recalcula siempre, nunca se acepta del
   * llamador.
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
   * Limpia la ReaderPosition persistida por completo. El estado
   * honesto de "no hay nada que continuar" (mismo mensaje vacío que
   * ya existía en Home) es preferible a dejar apuntando a una
   * posición que ya no aplica.
   */
  function clearSession() {
    return storage.remove(SESSION_STORAGE_KEY);
  }

  return Object.freeze({ getSession, saveSession, clearSession });
}
