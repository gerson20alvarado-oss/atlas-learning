/**
 * domain/library-access/library-access-repository.js
 *
 * Único punto de entrada del dominio para resolver qué libros puede
 * ver una cuenta — análogo a session-repository.js para Session.
 * Nadie fuera de este módulo debería hablar directamente con
 * library-access-contract.js.
 *
 * Frontera arquitectónica cerrada antes de este sprint: LibraryAccess
 * es un dominio propio, hermano de Session — nunca vive dentro de
 * Auth (que solo resuelve identidad) ni conoce Library o el Content
 * Model (que reciben ya resuelto lo que les corresponde, sin saber
 * que esta capa existe — regla de vecinos, Software Architecture
 * §9.2–9.3).
 *
 * Este módulo normaliza el resultado de la capa de infraestructura a
 * una única forma honesta para quien lo consume: siempre una lista
 * (nunca `null`/`undefined`) — "no se pudo verificar" y "confirmado
 * sin libros" se resuelven aquí, una sola vez, al mismo resultado
 * seguro (Caso 5 / mitigación de riesgo ya acordada: degradar a "sin
 * libros" es más seguro que degradar a "todos los libros").
 */

export function createLibraryAccessRepository(libraryAccessService) {
  async function getAuthorizedBookIds({ userId, accessToken }) {
    const result = await libraryAccessService.readAuthorizedBookIds({ userId, accessToken });
    // undefined (fallo de red) o null (confirmado vacío): mismo
    // resultado seguro — nunca se interpreta un fallo de verificación
    // como "todos los libros".
    if (!Array.isArray(result)) return [];
    return result;
  }

  function isBookAuthorized(authorizedBookIds, bookId) {
    return authorizedBookIds.includes(bookId);
  }

  return Object.freeze({ getAuthorizedBookIds, isBookAuthorized });
}
