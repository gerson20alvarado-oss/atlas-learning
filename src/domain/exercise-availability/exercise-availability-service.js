/**
 * domain/exercise-availability/exercise-availability-service.js
 *
 * Único servicio que decide si un ejercicio es editable, y por qué
 * no lo es cuando no lo es. Los componentes solo consumen
 * `{ editable, reason }` — nunca conocen las razones por su cuenta.
 *
 * Simplificado (esta sesión): Atlas eliminó por completo el concepto
 * de intentos por ejercicio — `EXERCISE_ATTEMPTS_EXHAUSTED` ya no
 * existe como razón posible. La única fuente de verdad de intentos
 * es `unit_attempt_limits`, consultada un nivel más arriba
 * (assessment-screen.js) — este servicio solo traduce ese hecho
 * (`unitCompleted`) a un veredicto de edición.
 *
 * Deliberadamente puro y síncrono, igual que antes: ninguna llamada a
 * Supabase ni a ningún repositorio. Mantener esta forma (`{ editable,
 * reason }`, con una razón nombrada, no una bandera genérica) es lo
 * que permite que una futura razón de bloqueo (licencia expirada,
 * examen cerrado) se agregue aquí como una condición más, sin tocar
 * ningún componente de ejercicio.
 */

export const EXERCISE_UNAVAILABLE_REASON = Object.freeze({
  UNIT_COMPLETED: 'UNIT_COMPLETED',
});

/**
 * @param {boolean} unitCompleted - la unidad ya registró un intento
 *   completado (Submit worksheet ya se presionó en esta pasada).
 * @returns {{ editable: boolean, reason: string | null }}
 */
export function getExerciseAvailability({ unitCompleted }) {
  if (unitCompleted) {
    return Object.freeze({ editable: false, reason: EXERCISE_UNAVAILABLE_REASON.UNIT_COMPLETED });
  }

  return Object.freeze({ editable: true, reason: null });
}
