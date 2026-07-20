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

  /**
   * Admin Console (Sprint 14) — todas las licencias con el nombre de
   * su dueño ya resuelto (embed de PostgREST), normalizadas a la
   * misma forma plana que el resto del dominio usa, en vez de la
   * forma anidada `profiles: { first_name, last_name }` que devuelve
   * PostgREST.
   */
  async function listAllLicenses({ accessToken }) {
    const rows = await licenseService.listAll({ accessToken });
    return rows.map((row) => ({
      id: row.id,
      bookId: row.book_id,
      keyCode: row.key_code,
      status: row.status,
      userId: row.user_id,
      firstName: row.profiles?.first_name ?? null,
      lastName: row.profiles?.last_name ?? null,
      activatedAt: row.activated_at,
      expiresAt: row.expires_at,
      batchNote: row.batch_note,
    }));
  }

  async function setLicenseStatus({ licenseId, status, accessToken }) {
    return licenseService.setStatus({ licenseId, status, accessToken });
  }

  async function countLicensesByStatus({ status, accessToken }) {
    return licenseService.countByStatus({ status, accessToken });
  }

  return Object.freeze({
    getOwnedBookIds,
    isBookOwned,
    getOwnedBooks,
    activateLicense,
    listAllLicenses,
    setLicenseStatus,
    countLicensesByStatus,
  });
}
