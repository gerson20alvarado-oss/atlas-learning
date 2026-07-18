/**
 * domain/page-source/page-source-repository.js
 *
 * Único punto de entrada del dominio para resolver la imagen de una
 * página — análogo a library-access-repository.js para LibraryAccess.
 * El Reader (presentación) consume este módulo, nunca
 * page-source-contract.js ni el adaptador directamente (regla de
 * vecinos, Software Architecture §9.2–9.3).
 */

export function createPageSourceRepository(pageSourceService) {
  async function getPageImageUrl(bookId, pageNumber) {
    if (!bookId || !Number.isInteger(pageNumber) || pageNumber < 1) {
      return null;
    }
    return pageSourceService.getPageImageUrl({ bookId, pageNumber });
  }

  return Object.freeze({ getPageImageUrl });
}
