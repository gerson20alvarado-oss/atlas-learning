/**
 * persistence/storage-contract.js
 *
 * Único punto de entrada público de la capa Persistence (Software
 * Architecture §9.2 — regla de vecinos: nadie fuera de este módulo
 * debe hablar con el adapter directamente).
 *
 * Sprint 1 Plan §12.1: esta fase define el CONTRATO y el mecanismo
 * de versionado. El CONTENIDO que se persiste (Session, Progress
 * inputs, Error Records, Favorites — Software Architecture §10.2)
 * pertenece a dominio y llega en Sprint 4. Ningún dato de negocio
 * real se persiste todavía.
 *
 * read/write/remove son síncronos desde la perspectiva de quien los
 * llama (Software Architecture §10.3) — localStorage ya es síncrono,
 * así que esto se cumple sin ningún wrapper de promesas artificial.
 */

import {
  wrapInEnvelope,
  unwrapEnvelope,
  isEnvelopeShape,
  CURRENT_SCHEMA_VERSION,
} from './storage-envelope.js';

export function createStorageContract(adapter, errorBoundary) {
  function read(key) {
    let raw;
    try {
      raw = adapter.readRaw(key);
    } catch (err) {
      // Fallo de storage (Software Architecture §18.3): se degrada a
      // "sin dato" en vez de propagar la excepción — nunca debe
      // interrumpir a mitad de una interacción del usuario.
      errorBoundary.reportRecoverable({ reason: 'storage-read-failed', key, err: String(err) });
      return null;
    }

    if (raw === null) return null;

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (err) {
      errorBoundary.reportRecoverable({ reason: 'storage-corrupt-json', key, err: String(err) });
      return null;
    }

    if (!isEnvelopeShape(parsed)) {
      errorBoundary.reportRecoverable({ reason: 'storage-invalid-envelope', key });
      return null;
    }

    // Punto de extensión para migración de schemaVersion (Technical
    // Specification §11). Sin datos de dominio reales todavía que
    // migrar, así que no hay lógica de migración que escribir en
    // Sprint 1 — pero el lugar donde iría ya existe, aquí.
    return unwrapEnvelope(parsed);
  }

  function write(key, value) {
    const envelope = wrapInEnvelope(value, CURRENT_SCHEMA_VERSION);
    try {
      adapter.writeRaw(key, JSON.stringify(envelope));
      return true;
    } catch (err) {
      // Storage lleno, modo privado del navegador, cuota excedida...
      // Software Architecture §18.3: se comunica solo en el próximo
      // límite natural de sesión, nunca a mitad de una interacción.
      // En Sprint 1 no hay sesión que interrumpir; solo se registra.
      errorBoundary.reportMustSurface({ reason: 'storage-write-failed', key, err: String(err) });
      return false;
    }
  }

  function remove(key) {
    try {
      adapter.removeRaw(key);
      return true;
    } catch (err) {
      errorBoundary.reportRecoverable({ reason: 'storage-remove-failed', key, err: String(err) });
      return false;
    }
  }

  return Object.freeze({ read, write, remove });
}
