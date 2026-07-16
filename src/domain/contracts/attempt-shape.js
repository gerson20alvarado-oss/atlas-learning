/**
 * domain/contracts/attempt-shape.js
 *
 * Forma de la entidad Attempt (Software Architecture §4.2, §15.2):
 * "lo que el estudiante hizo", nunca "lo que el libro es" — vive en
 * Persistence (domain/learning-data/attempt-repository.js), nunca en
 * domain/content junto al contenido publicado.
 *
 * Append-only por diseño (Software Architecture §11.4: los datos de
 * aprendizaje se fusionan por adición, nunca se sobrescriben) —
 * ningún Attempt se edita después de creado, salvo los dos campos de
 * metadato añadidos en Sprint 6 (`userId`, `syncedAt`), que no
 * describen el intento en sí sino su propiedad y su estado de
 * sincronización — ver más abajo. Error Record (Sprint 5 Plan,
 * decisión aprobada) es una vista derivada de esta colección filtrada
 * por `isCorrect === false`, nunca una segunda entidad persistida —
 * evita una segunda fuente de verdad que pueda desincronizarse (mismo
 * principio que ya rige Progress, §15.2).
 *
 * Sprint 6 (Authentication) añade dos campos, ambos aditivos y
 * ambos siguiendo el mismo principio ya aprobado ("estado derivado,
 * nunca estructura paralela"):
 *   - `userId` (`null` por defecto): metadato de propiedad — huérfano
 *     (creado antes de cualquier login, el caso real que generaron
 *     los Sprints 1-5), propio, o ajeno (otra cuenta, dispositivo
 *     compartido — nunca se fusiona). Ver app/account-linking/.
 *   - `syncedAt` (`null` por defecto): "pendiente de sincronizar" NO
 *     es una cola ni una tabla aparte — es literalmente
 *     `attempts.filter(a => a.syncedAt === null)`. Se completa
 *     cuando la vinculación de cuenta (o, más adelante, Sync) confirma
 *     la subida — un Attempt recién creado offline y uno recién
 *     creado online son indistinguibles hasta que ese campo cambia;
 *     no hay una ruta de código separada para "el caso sin conexión".
 */

const REQUIRED_ATTEMPT_KEYS = Object.freeze([
  'id',
  'exerciseId',
  'lessonId',
  'response',
  'isCorrect',
  'timestamp',
  'userId',
  'syncedAt',
]);

export function isValidAttemptShape(candidate) {
  return (
    Boolean(candidate) &&
    typeof candidate === 'object' &&
    REQUIRED_ATTEMPT_KEYS.every((key) => key in candidate)
  );
}

export { REQUIRED_ATTEMPT_KEYS };
