/**
 * domain/contracts/worksheet-exercise-lifecycle.js
 *
 * Contrato conceptual del Exercise Engine de American Language Hub
 * — independiente del Exercise Engine de Hi! Korean (que permanece
 * intacto, sin ningún cambio). No es una librería de la que los
 * componentes hereden — es la forma que todo componente de ejercicio
 * de ALH debe devolver, documentada aquí una sola vez para que nunca
 * diverja entre tipos.
 *
 * Cinco fases, no todas implementadas hoy:
 *
 *   1. Renderizado    — element, ya construido.
 *   2. Captura        — getResponse(): la respuesta actual del
 *                        estudiante, en una forma normalizada según
 *                        el tipo. Implementada en todo componente
 *                        interactivo desde esta primera etapa —
 *                        sin esto no hay nada que capturar después.
 *   3. Validación      — validate(): compara la respuesta capturada
 *                        contra la respuesta oficial y devuelve un
 *                        resultado. NO implementada todavía en
 *                        ningún componente — cuando exista
 *                        corrección automática, se añade aquí, sin
 *                        tocar cómo el componente renderiza ni
 *                        captura.
 *   4. Retroalimentación — showFeedback(result): pinta el resultado
 *                        de validate() sobre el propio componente.
 *                        Tampoco implementada todavía.
 *   5. Persistencia    — fuera de estos componentes por diseño,
 *                        igual que en Hi! Korean: un componente de
 *                        ejercicio nunca habla con un repositorio
 *                        directamente (regla de vecinos). Cuando
 *                        exista, quien orqueste la pantalla llama a
 *                        getResponse() y decide qué hacer con eso —
 *                        el componente no cambia.
 *
 * Todo componente de ejercicio de ALH expone, como mínimo:
 *   { element, update(nextProps), destroy(), getResponse(), isAnswered() }
 *
 * `validate` y `showFeedback` son opcionales en esta etapa —
 * cualquier componente que no los implemente todavía simplemente no
 * los incluye en el objeto que devuelve. El día que se implementen,
 * se agregan como una función más al mismo objeto — nunca exige
 * cambiar la forma de los que ya existen.
 *
 * `isAnswered()` no es lo mismo que "correcto" — solo indica que el
 * estudiante ya dio algo, útil para futuro seguimiento de progreso
 * sin depender de que exista corrección automática todavía.
 */

export const WORKSHEET_EXERCISE_LIFECYCLE_PHASES = Object.freeze([
  'render',
  'capture',
  'validate',
  'feedback',
  'persist',
]);

/**
 * Intentos máximos para ejercicios con calificación automática
 * (esta sesión) — un único lugar, reutilizado por cada componente
 * que implemente `validate()`, para que nunca queden dos números
 * distintos en dos archivos. Nunca se revela la respuesta correcta,
 * en ningún componente: `validate()` siempre devuelve
 * correcto/incorrecto, jamás el valor esperado.
 */
export const MAX_GRADING_ATTEMPTS = 2;
