/**
 * domain/writing-response/writing-response-repository.js
 *
 * Único punto de entrada del dominio para Writing — análogo a
 * reader-position-repository.js. `getEntry` normaliza "nunca se
 * escribió nada todavía" a un texto vacío, para que la pantalla
 * nunca tenga que distinguir `null` de cadena vacía por su cuenta.
 */

export function createWritingResponseRepository(writingResponseService) {
  async function getEntry({ userId, bookId, unitNumber, accessToken }) {
    const entry = await writingResponseService.getEntry({ userId, bookId, unitNumber, accessToken });
    return entry?.responseText ?? '';
  }

  async function saveEntry({ userId, bookId, unitNumber, responseText, accessToken }) {
    return writingResponseService.saveEntry({ userId, bookId, unitNumber, responseText, accessToken });
  }

  return Object.freeze({ getEntry, saveEntry });
}
