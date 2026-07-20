/**
 * domain/bookmark/bookmark-repository.js
 *
 * Único punto de entrada del dominio para Marcadores — análogo a
 * library-access-repository.js. Normaliza el resultado de la
 * infraestructura a una forma siempre honesta: `list` nunca devuelve
 * `null`/`undefined` (un fallo de red degrada a lista vacía, mismo
 * criterio ya usado en LibraryAccess — "sin marcadores" es más
 * seguro que fingir que existen).
 */

export function createBookmarkRepository(bookmarkService) {
  async function getBookmarkedPages({ userId, bookId, accessToken }) {
    const pageNumbers = await bookmarkService.list({ userId, bookId, accessToken });
    return Array.isArray(pageNumbers) ? pageNumbers : [];
  }

  async function addBookmark({ userId, bookId, pageNumber, accessToken }) {
    return bookmarkService.add({ userId, bookId, pageNumber, accessToken });
  }

  async function removeBookmark({ userId, bookId, pageNumber, accessToken }) {
    return bookmarkService.remove({ userId, bookId, pageNumber, accessToken });
  }

  function isBookmarked(bookmarkedPages, pageNumber) {
    return bookmarkedPages.includes(pageNumber);
  }

  /** Admin Console (Sprint 14) — marcadores de un estudiante entre todos sus libros. */
  async function listAllForUser({ userId, accessToken }) {
    const rows = await bookmarkService.listForUser({ userId, accessToken });
    return rows.map((row) => ({ bookId: row.book_id, pageNumber: row.page_number }));
  }

  return Object.freeze({
    getBookmarkedPages,
    addBookmark,
    removeBookmark,
    isBookmarked,
    listAllForUser,
  });
}
