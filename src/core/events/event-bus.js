/**
 * core/events/event-bus.js
 *
 * Bus de eventos pub/sub genérico. No conoce nada de dominio — solo
 * transporta payloads (Sprint 1 Plan §6, regla de vecinos de
 * Software Architecture §9.3).
 *
 * No bloqueante por construcción (Software Architecture C6, §9.3):
 * publish() nunca espera a que los handlers terminen, y un handler
 * que lanza una excepción no puede tumbar a los demás handlers ni al
 * publisher. Esto es lo que permite que Sync/Auth (sprints futuros)
 * se conecten sin volver bloqueante nada de Foundation.
 */

export function createEventBus() {
  const handlersByEvent = new Map();

  function subscribe(eventName, handler) {
    if (!handlersByEvent.has(eventName)) {
      handlersByEvent.set(eventName, new Set());
    }
    handlersByEvent.get(eventName).add(handler);

    return function unsubscribe() {
      handlersByEvent.get(eventName)?.delete(handler);
    };
  }

  function publish(eventName, payload) {
    const handlers = handlersByEvent.get(eventName);
    if (!handlers || handlers.size === 0) return;

    // Cada handler corre en su propia microtask: un publisher nunca
    // queda bloqueado por un consumidor lento, y un handler que
    // falla no afecta a los demás.
    for (const handler of handlers) {
      queueMicrotask(() => {
        try {
          handler(payload);
        } catch (err) {
          // Un handler roto no debe tumbar al bus. Software
          // Architecture §18.2 clasifica esto como fallo
          // silencioso/recuperable a nivel de mecanismo; una
          // estrategia de logging real queda fuera de Sprint 1.
          console.error(`[event-bus] handler error for "${eventName}"`, err);
        }
      });
    }
  }

  function unsubscribeAll(eventName) {
    handlersByEvent.delete(eventName);
  }

  return Object.freeze({ subscribe, publish, unsubscribeAll });
}
