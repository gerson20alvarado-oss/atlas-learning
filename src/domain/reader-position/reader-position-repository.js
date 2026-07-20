/**
 * domain/reader-position/reader-position-repository.js
 *
 * Único punto de entrada del dominio para ReaderPosition. A
 * diferencia de LibraryAccess/Bookmark, un fallo de red aquí NO
 * degrada a un valor "seguro" silencioso (como lista vacía) —
 * degrada a `null`/`false`, honesto: "no se pudo confirmar la
 * posición", nunca "la posición es la página 1". Quien consuma este
 * repositorio decide qué hacer con esa honestidad (p. ej., el Reader
 * simplemente no actualiza su URL/estado hasta que una escritura se
 * confirme).
 */

export function createReaderPositionRepository(readerPositionService) {
  async function getPosition({ userId, bookId, accessToken }) {
    const position = await readerPositionService.getPosition({ userId, bookId, accessToken });
    // undefined (fallo de red) y null (confirmado: nunca hubo
    // posición) se distinguen a propósito — ambos se comunican como
    // "no hay nada que restaurar" a quien consume, pero solo el
    // segundo es un hecho confirmado. Ver docstring del contrato.
    return position ?? null;
  }

  async function savePosition({ userId, bookId, pageNumber, accessToken }) {
    return readerPositionService.savePosition({ userId, bookId, pageNumber, accessToken });
  }

  async function getMostRecentPosition({ userId, accessToken }) {
    const position = await readerPositionService.getMostRecentPosition({ userId, accessToken });
    return position ?? null;
  }

  /** Admin Console (Sprint 14) — normaliza a camelCase, mismo criterio que el resto del dominio. */
  async function listForUser({ userId, accessToken }) {
    const rows = await readerPositionService.listForUser({ userId, accessToken });
    return rows.map((row) => ({
      bookId: row.book_id,
      pageNumber: row.page_number,
      updatedAt: row.updated_at,
    }));
  }

  async function resetPosition({ userId, bookId, accessToken }) {
    return readerPositionService.resetPosition({ userId, bookId, accessToken });
  }

  return Object.freeze({ getPosition, savePosition, getMostRecentPosition, listForUser, resetPosition });
}
