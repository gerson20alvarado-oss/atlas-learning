/**
 * persistence/storage-envelope.js
 *
 * Envuelve cada valor persistido con metadata de versión (Sprint 1
 * Plan §12.3; Technical Specification §11: "Versioning, Migration,
 * Recovery"). Anticipa la necesidad de migración sin implementarla
 * todavía — cuando Sprint 4 introduzca el primer dato de dominio
 * real, ya existe un lugar donde versionar su forma sin retrofit
 * sobre datos ya guardados sin versión.
 */

export const CURRENT_SCHEMA_VERSION = 1;

export function wrapInEnvelope(payload, schemaVersion = CURRENT_SCHEMA_VERSION) {
  return {
    schemaVersion,
    writtenAt: new Date().toISOString(),
    payload,
  };
}

export function unwrapEnvelope(envelope) {
  if (!isEnvelopeShape(envelope)) return null;
  return envelope.payload;
}

export function isEnvelopeShape(candidate) {
  return (
    !!candidate &&
    typeof candidate === 'object' &&
    'schemaVersion' in candidate &&
    'writtenAt' in candidate &&
    'payload' in candidate
  );
}
