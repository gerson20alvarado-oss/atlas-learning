/**
 * presentation/components/session-exit/session-exit.js
 *
 * Session exit (Design System §15.3): la palabra "exit", siempre
 * alcanzable, nunca prominente. Instancia de button/text (§11.2) con
 * su propio contrato textual fijo — a diferencia de back-nav, que
 * siempre antepone "‹ " al nombre del padre, "exit" es una palabra
 * literal e invariable, así que no comparte implementación con
 * back-nav aunque visualmente sean primos (mismo family button/text,
 * dos componentes aprobados distintos).
 *
 * Sprint 3: salir guarda el estado en memoria — no todavía en disco
 * (Persistence/Resume es Sprint 4, Roadmap Phase 4) — y navega a
 * Home. "Saves exact state silently" (§15.3) se cumplirá en Sprint 4
 * sin tener que tocar este componente: el guardado ocurre en quien
 * orquesta (app/), no aquí.
 */

export function createSessionExit({ onSelect }) {
  const element = document.createElement('button');
  element.setAttribute('data-component', 'session-exit');
  element.setAttribute('type', 'button');
  element.textContent = 'exit';

  element.addEventListener('click', () => onSelect?.());

  function update() {}

  function destroy() {
    element.remove();
  }

  return Object.freeze({ element, update, destroy });
}
