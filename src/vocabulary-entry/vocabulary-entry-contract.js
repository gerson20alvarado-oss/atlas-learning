/**
 * vocabulary-entry/vocabulary-entry-contract.js
 *
 * Capacidad de infraestructura para My Vocabulary — mismo patrón
 * contrato + adapter que el resto del proyecto. `listEntries` nunca
 * lanza: ante cualquier fallo, el estudiante ve su cuaderno vacío
 * (degradación segura) en vez de una pantalla rota — nunca datos
 * fabricados. Las operaciones de escritura sí propagan su resultado
 * completo (incluido `reason: 'duplicate'`), porque la pantalla
 * necesita distinguir "falló por duplicado" de "falló por error de
 * red" para mostrar el mensaje correcto.
 */

export function createVocabularyEntryService(adapter, errorBoundary) {
  async function listEntries({ userId, bookId, unitNumber, accessToken }) {
    try {
      const rows = await adapter.listEntries({ userId, bookId, unitNumber, accessToken });
      return rows ?? [];
    } catch (err) {
      errorBoundary.reportRecoverable({ reason: 'vocabulary-list-failed', userId, bookId, unitNumber, err: String(err) });
      return [];
    }
  }

  async function addEntry({ userId, bookId, unitNumber, term, accessToken }) {
    try {
      return await adapter.addEntry({ userId, bookId, unitNumber, term, accessToken });
    } catch (err) {
      errorBoundary.reportRecoverable({ reason: 'vocabulary-add-failed', userId, bookId, unitNumber, err: String(err) });
      return { success: false, reason: 'network_error' };
    }
  }

  async function updateEntry({ entryId, term, accessToken }) {
    try {
      return await adapter.updateEntry({ entryId, term, accessToken });
    } catch (err) {
      errorBoundary.reportRecoverable({ reason: 'vocabulary-update-failed', entryId, err: String(err) });
      return { success: false, reason: 'network_error' };
    }
  }

  async function removeEntry({ entryId, accessToken }) {
    try {
      await adapter.removeEntry({ entryId, accessToken });
      return true;
    } catch (err) {
      errorBoundary.reportRecoverable({ reason: 'vocabulary-remove-failed', entryId, err: String(err) });
      return false;
    }
  }

  return Object.freeze({ listEntries, addEntry, updateEntry, removeEntry });
}
