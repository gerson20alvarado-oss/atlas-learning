/**
 * page-source/page-source-contract.js
 *
 * PageSource (Technical Specification v2.0, §2 y aclaración de esta
 * sesión): "el Reader necesita una fuente capaz de proporcionar la
 * representación visual de una página." Hoy, imágenes WEBP en
 * Supabase Storage; mañana, potencialmente otra implementación
 * (p. ej. pdf.js real, para un libro que sí se beneficie de texto
 * seleccionable) — el Reader nunca debe enterarse de cuál es.
 *
 * Interfaz deliberadamente asíncrona aunque la implementación de hoy
 * (bucket público, URL determinística) no necesite ninguna espera de
 * red real — es lo que permite que una futura implementación que sí
 * requiera trabajo asíncrono (p. ej. inicializar un documento PDF)
 * no obligue a cambiar el contrato ni a quien lo consume.
 *
 * Contrato: getPageImageUrl({ bookId, pageNumber }) → string | null.
 * `null` significa "esta página no tiene representación visual
 * disponible" — nunca un error que rompa el Reader; el mismo aviso
 * neutral que ya usa el resto de Atlas para contenido no resuelto.
 */

export function createPageSourceService(adapter, errorBoundary) {
  async function getPageImageUrl({ bookId, pageNumber }) {
    try {
      const url = await adapter.getPageImageUrl({ bookId, pageNumber });
      return url ?? null;
    } catch (err) {
      errorBoundary.reportRecoverable({ reason: 'page-source-resolve-failed', bookId, pageNumber, err: String(err) });
      return null;
    }
  }

  return Object.freeze({ getPageImageUrl });
}
