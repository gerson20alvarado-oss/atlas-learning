/**
 * domain/content/progress.js
 *
 * Progress es siempre un valor derivado, nunca un contador propio
 * (Software Architecture §3, §15.2): se computa a partir del
 * historial de Attempts, jamás mantenido aparte.
 *
 * Sprint 2/3 todavía no tienen Attempts — Progress & Memory
 * Architecture (Attempt, Error Record) llega en Sprint 4 (Roadmap,
 * Phase 4). Estas funciones son el punto único donde ese cambio
 * ocurrirá: hoy computan honestamente 0 completadas (no existe
 * ningún Attempt que contar), nunca un valor inventado u oculto. La
 * whisper bar (Design System §14.2) sigue siendo correcta con estos
 * números — un libro recién publicado, sin sesiones de estudio
 * todavía, se ve exactamente como lo que es: 0 de N.
 *
 * Cuando Sprint 4 introduzca el historial de Attempts real, solo
 * estas funciones cambian de implementación — ningún componente de
 * presentación que las consume necesita cambiar (mismo contrato de
 * salida).
 */

export function computeUnitProgress(unit) {
  const total = unit.lessons.length;
  // Sin Attempts todavía (Sprint 4): ninguna lección puede estar
  // marcada como completada por el motor, sea cual sea su título.
  const completed = 0;
  return Object.freeze({ completed, total });
}

export function computeBookProgress(book) {
  const total = book.units.reduce((sum, unit) => sum + unit.lessons.length, 0);
  const completed = 0;
  return Object.freeze({ completed, total });
}

/**
 * Marcador binario por Lesson dentro de una Unit (Design System
 * §14.3): "next" en la primera lección incompleta, "completed" en
 * las completadas, ausencia de marcador en las no alcanzadas
 * todavía. Con 0 Attempts (Sprint 4 no existe aún), ninguna lección
 * está completa — así que, honestamente, la primera lección de CADA
 * unidad es "la primera incompleta" de esa unidad, y el resto no
 * tiene marcador. No es un caso especial: es la misma regla aplicada
 * al estado real (nada completado todavía).
 *
 * Alcance explícitamente por Unit (Wireframe Review §2.4 describe el
 * marcador "dentro de una unidad") — no hay una regla documentada de
 * "un único next en todo el libro" en ningún documento frozen.
 */
export function computeLessonMarkers(lessons) {
  return lessons.map((lesson, index) => ({
    lessonId: lesson.id,
    marker: index === 0 ? 'next' : 'none',
  }));
}

/**
 * Progreso fraccional dentro de una Learning Session activa (Design
 * System §14.4): completed = secciones ya recorridas, total =
 * secciones declaradas por la Lesson. A diferencia de Book/Unit
 * progress, esto NO depende de Attempts — es simplemente "dónde
 * estoy dentro de esta sesión ahora mismo", vive en memoria dentro
 * de la screen de Learning Session (Session & Navigation State,
 * Software Architecture §9.2) y se pierde al salir, porque la
 * persistencia de Session llega en Sprint 4.
 */
export function computeSessionProgress(currentSectionIndex, totalSections) {
  return Object.freeze({
    completed: Math.min(currentSectionIndex, totalSections),
    total: totalSections,
  });
}
