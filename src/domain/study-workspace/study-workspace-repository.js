/**
 * domain/study-workspace/study-workspace-repository.js
 *
 * Único punto de entrada del dominio para el Espacio de Estudio.
 * Normaliza `getEntry` a una forma siempre honesta y utilizable: sin
 * entrada guardada todavía, o fallo de red, ambos degradan a una
 * StudyWorkspaceEntry vacía — nunca `null`/`undefined` propagado a
 * quien consume (mismo criterio ya usado en LibraryAccess/Bookmark).
 *
 * No orquesta "quitar una imagen implica también regrabar la
 * entrada" — eso es una decisión de flujo de interfaz (Etapa 7/8,
 * cuando exista el sheet real), no de este repositorio. Aquí solo
 * viven las operaciones honestas, una a la vez.
 */

import { createEmptyStudyWorkspaceEntry } from '../contracts/study-workspace-entry-shape.js';

export function createStudyWorkspaceRepository(studyWorkspaceService) {
  async function getEntry({ userId, bookId, pageNumber, accessToken }) {
    const entry = await studyWorkspaceService.getEntry({ userId, bookId, pageNumber, accessToken });
    if (!entry) return createEmptyStudyWorkspaceEntry({ bookId, pageNumber, userId });
    return { bookId, pageNumber, userId, notes: entry.notes, imageRefs: entry.imageRefs };
  }

  async function saveEntry({ userId, bookId, pageNumber, notes, imageRefs, accessToken }) {
    return studyWorkspaceService.saveEntry({ userId, bookId, pageNumber, notes, imageRefs, accessToken });
  }

  async function uploadImage({ userId, bookId, pageNumber, file, accessToken }) {
    return studyWorkspaceService.uploadImage({ userId, bookId, pageNumber, file, accessToken });
  }

  async function getImageUrl({ path, accessToken }) {
    return studyWorkspaceService.getImageUrl({ path, accessToken });
  }

  async function deleteImage({ path, accessToken }) {
    return studyWorkspaceService.deleteImage({ path, accessToken });
  }

  return Object.freeze({ getEntry, saveEntry, uploadImage, getImageUrl, deleteImage });
}
