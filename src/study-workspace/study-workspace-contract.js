/**
 * study-workspace/study-workspace-contract.js
 *
 * Capacidad de infraestructura para el Espacio de Estudio — combina
 * dos infraestructuras reales (Database para notas, Storage privado
 * para imágenes), ya resuelto en la Technical Specification v2.1.
 * Cinco operaciones, ninguna más de las que el modelo ya definió:
 * leer/guardar la entrada (notas + referencias), y subir/leer/borrar
 * una imagen individual.
 *
 * `getImageUrl` siempre resuelve una URL firmada y temporal — nunca
 * una URL pública permanente (bucket privado, decisión ya aprobada).
 */

export function createStudyWorkspaceService(adapter, errorBoundary) {
  async function getEntry({ userId, bookId, pageNumber, accessToken }) {
    try {
      const entry = await adapter.getEntry({ userId, bookId, pageNumber, accessToken });
      return entry ?? null;
    } catch (err) {
      errorBoundary.reportRecoverable({ reason: 'study-workspace-read-failed', userId, bookId, pageNumber, err: String(err) });
      return undefined;
    }
  }

  async function saveEntry({ userId, bookId, pageNumber, notes, imageRefs, accessToken }) {
    try {
      await adapter.saveEntry({ userId, bookId, pageNumber, notes, imageRefs, accessToken });
      return true;
    } catch (err) {
      errorBoundary.reportRecoverable({ reason: 'study-workspace-save-failed', userId, bookId, pageNumber, err: String(err) });
      return false;
    }
  }

  async function uploadImage({ userId, bookId, pageNumber, file, accessToken }) {
    try {
      return await adapter.uploadImage({ userId, bookId, pageNumber, file, accessToken });
    } catch (err) {
      errorBoundary.reportRecoverable({ reason: 'study-workspace-upload-failed', userId, bookId, pageNumber, err: String(err) });
      return null;
    }
  }

  async function getImageUrl({ path, accessToken }) {
    try {
      return await adapter.getImageUrl({ path, accessToken });
    } catch (err) {
      errorBoundary.reportRecoverable({ reason: 'study-workspace-image-url-failed', path, err: String(err) });
      return null;
    }
  }

  async function deleteImage({ path, accessToken }) {
    try {
      await adapter.deleteImage({ path, accessToken });
      return true;
    } catch (err) {
      errorBoundary.reportRecoverable({ reason: 'study-workspace-delete-image-failed', path, err: String(err) });
      return false;
    }
  }

  return Object.freeze({ getEntry, saveEntry, uploadImage, getImageUrl, deleteImage });
}
