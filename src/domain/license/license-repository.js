/**
 * domain/license/license-repository.js
 *
 * Único punto de entrada del dominio para licencias.
 *
 * `getOwnedBookIds` — el conjunto de ids de libros que el usuario
 * posee, sin resolver contra el catálogo. Es el reemplazo directo de
 * `getAuthorizedBookIds` (misma forma, misma responsabilidad en los
 * puntos de control de acceso de screen-router.js) — nunca se llama
 * "biblioteca", porque no lo es todavía, es solo el conjunto de ids.
 *
 * `getOwnedBooks` — no "obtiene una biblioteca" de ningún lado: la
 * construye, resolviendo el catálogo completo (`getLibrary()`,
 * contenido del frontend) contra `getOwnedBookIds()`. Un libro sin
 * licencia activa nunca aparece en el resultado — no como un
 * elemento oculto o bloqueado, sino porque nunca formó parte del
 * conjunto resuelto en primer lugar.
 *
 * `isBookOwned` — reemplazo directo de `isBookAuthorized`, mismo uso
 * en el gate de acceso por libro (Caso 4, ya existente).
 */

import { getLibrary } from '../content/content-repository.js';

export function createLicenseRepository(licenseService) {
  async function getOwnedBookIds({ userId, accessToken }) {
    return licenseService.getActiveBookIds({ userId, accessToken });
  }

  function isBookOwned(ownedBookIds, bookId) {
    return ownedBookIds.includes(bookId);
  }

  async function getOwnedBooks({ userId, accessToken }) {
    const ownedBookIds = await getOwnedBookIds({ userId, accessToken });
    const ownedSet = new Set(ownedBookIds);
    const { books } = getLibrary();
    return books.filter((book) => ownedSet.has(book.id));
  }

  async function activateLicense({ keyCode, accessToken }) {
    const result = await licenseService.activate({ keyCode, accessToken });
    return Object.freeze({
      success: Boolean(result.success),
      bookId: result.book_id ?? null,
      reason: result.reason ?? null,
    });
  }

  return Object.freeze({ getOwnedBookIds, isBookOwned, getOwnedBooks, activateLicense });
}
