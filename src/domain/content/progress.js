/**
 * domain/content/progress.js
 *
 * Progress es siempre un valor derivado, nunca un contador propio
 * (Software Architecture §3, §15.2): se computa a partir del
 * historial de Attempts, jamás mantenido aparte.
 *
 * Sprint 5 (Exercise Engine) introduce el historial de Attempts real
 * — Sprint 5 Plan, decisión #1: una Lesson se considera completada
 * ÚNICAMENTE cuando TODOS sus bloques `practice` con un Exercise
 * evaluable (getExerciseById lo resuelve) tienen al menos un Attempt
 * correcto. Llegar a "Finish" no basta — Atlas mide aprendizaje, no
 * navegación. Las "actividades abiertas" y los ejercicios de tipos
 * aún no soportados (matching, o los que dependen de audio real que
 * todavía no existe — ver exercise-catalog.js) no tienen Exercise
 * resuelto, así que quedan fuera del cómputo por completo: ni ayudan
 * ni bloquean la completitud de la Lesson.
 *
 * Caso límite (documentado, no decidido explícitamente por ningún
 * documento): una Lesson sin ningún ejercicio evaluable (0 bloques
 * `practice` con Exercise real — el caso del libro de muestra
 * "Español Esencial") nunca se marca como completada por esta vía.
 * Es la lectura más conservadora de la decisión #1 ("Atlas debe medir
 * aprendizaje") — evita el extremo contraintuitivo de marcar una
 * lección como "completa" antes incluso de abrirla, por vacuidad
 * lógica. Señalado en el resumen técnico del sprint para su revisión.
 */

import { getExerciseById } from '../exercise/exercise-repository.js';

/**
 * Los exerciseId de una Lesson que realmente participan en Progress
 * — solo los que resuelven a un Exercise real (Sprint 5 Plan,
 * decisión sobre actividades abiertas/tipos futuros).
 */
function getGradedExerciseIds(lesson) {
  const ids = [];
  for (const section of lesson.sections) {
    for (const block of section.blocks) {
      if (block.type === 'practice' && getExerciseById(block.exerciseId)) {
        ids.push(block.exerciseId);
      }
    }
  }
  return ids;
}

/**
 * `attemptRepository` se inyecta (nunca se importa un storage
 * concreto aquí) — mismo criterio de dependencia explícita que ya
 * usa session-repository.js.
 */
export function isLessonComplete(lesson, attemptRepository) {
  const gradedIds = getGradedExerciseIds(lesson);
  if (gradedIds.length === 0) return false; // ver caso límite documentado arriba
  return gradedIds.every((exerciseId) => attemptRepository.hasCorrectAttempt(lesson.id, exerciseId));
}

export function computeUnitProgress(unit, attemptRepository) {
  const total = unit.lessons.length;
  const completed = unit.lessons.filter((lesson) => isLessonComplete(lesson, attemptRepository)).length;
  return Object.freeze({ completed, total });
}

export function computeBookProgress(book, attemptRepository) {
  const allLessons = book.units.flatMap((unit) => unit.lessons);
  const total = allLessons.length;
  const completed = allLessons.filter((lesson) => isLessonComplete(lesson, attemptRepository)).length;
  return Object.freeze({ completed, total });
}

/**
 * Marcador binario por Lesson dentro de una Unit (Design System
 * §14.3): "completed" en las ya completadas (Attempts correctos en
 * todo lo evaluable), "next" en la primera incompleta, sin marcador
 * en el resto — igual que antes, ahora con completitud real en vez
 * de siempre 0.
 */
export function computeLessonMarkers(lessons, attemptRepository) {
  let nextAssigned = false;
  return lessons.map((lesson) => {
    const completed = isLessonComplete(lesson, attemptRepository);
    if (completed) return { lessonId: lesson.id, marker: 'completed' };
    if (!nextAssigned) {
      nextAssigned = true;
      return { lessonId: lesson.id, marker: 'next' };
    }
    return { lessonId: lesson.id, marker: 'none' };
  });
}

/**
 * Progreso fraccional dentro de una Learning Session activa (Design
 * System §14.4) — sin cambios en Sprint 5: sigue siendo "dónde estoy
 * dentro de esta sesión ahora mismo" (secciones recorridas), no
 * depende de Attempts.
 */
export function computeSessionProgress(currentSectionIndex, totalSections) {
  return Object.freeze({
    completed: Math.min(currentSectionIndex, totalSections),
    total: totalSections,
  });
}
