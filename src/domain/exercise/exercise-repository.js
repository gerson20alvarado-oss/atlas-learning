/**
 * domain/exercise/exercise-repository.js
 *
 * Único punto de lectura de un Exercise por id — análogo a
 * content-repository.js para Book/Unit/Lesson. Exercise es contenido
 * publicado (domain/content/exercise-catalog.js), no dato de
 * Persistence — este repositorio nunca toca storage.
 *
 * Degradación honesta: un `exerciseId` sin Exercise correspondiente
 * (las "actividades abiertas" y los tipos aún no soportados — ver
 * exercise-catalog.js) devuelve `null`, nunca lanza. Esto es lo que
 * permite que un bloque `practice` sin Exercise real siga mostrando
 * el mismo aviso neutral definido desde Sprint 3, sin ningún caso
 * especial adicional en el renderer.
 */

import { EXERCISE_CATALOG } from '../content/exercise-catalog.js';
import { isValidExerciseShape } from '../contracts/exercise-shape.js';

export function getExerciseById(exerciseId) {
  const exercise = EXERCISE_CATALOG[exerciseId];
  if (!exercise) return null;
  return isValidExerciseShape(exercise) ? exercise : null;
}
