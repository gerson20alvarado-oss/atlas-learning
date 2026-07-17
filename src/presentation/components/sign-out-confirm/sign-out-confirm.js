/**
 * presentation/components/sign-out-confirm/sign-out-confirm.js
 *
 * Confirmación de cierre de sesión (Sprint 7, Objetivo E — §3.6,
 * Wireframe Review §5: "su comportamiento (una pregunta, sin
 * fricción añadida) ya está especificado; su presentación exacta es
 * una decisión a nivel de Design System"). Se construye solo lo
 * mínimo necesario para esta confirmación puntual — no un sistema de
 * diálogos genérico ni reutilizable fuera de este propósito (alcance
 * explícitamente acotado por Producto).
 *
 * Mismo vocabulario visual ya usado por
 * presentation/screens/account-linking/linking-decision-screen.js
 * para una decisión de una sola pregunta: una frase factual +
 * par de acciones de peso desigual. Aquí la acción seria (cerrar
 * sesión) es la subordinada en texto plano, y la acción segura
 * (cancelar) es la primaria — mismo criterio que esa pantalla ya
 * aplicó entre "conservar y combinar" (primaria) y "descartar"
 * (texto).
 *
 * Componente puro: recibe onConfirm/onCancel ya resueltos — no
 * conoce Auth ni el App Shell.
 */

import { createPrimaryButton } from '../primary-button/primary-button.js';

export function createSignOutConfirm({ onConfirm, onCancel }) {
  const element = document.createElement('div');
  element.setAttribute('data-component', 'sign-out-confirm');
  element.setAttribute('role', 'alertdialog');
  element.setAttribute('aria-modal', 'true');
  element.setAttribute('aria-label', 'Confirmar cierre de sesión');

  const panel = document.createElement('div');
  panel.setAttribute('data-part', 'panel');

  const message = document.createElement('p');
  message.setAttribute('data-part', 'message');
  message.className = 'al-type-ui-body';
  message.textContent = '¿Quieres cerrar sesión?';

  const cancelAction = createPrimaryButton({
    label: 'Cancelar',
    onClick: () => onCancel?.(),
  });
  cancelAction.element.setAttribute('data-part', 'cancel');

  const confirmAction = document.createElement('button');
  confirmAction.type = 'button';
  confirmAction.setAttribute('data-part', 'confirm');
  confirmAction.className = 'al-type-ui-caption';
  confirmAction.textContent = 'Cerrar sesión';
  confirmAction.addEventListener('click', () => onConfirm?.());

  panel.appendChild(message);
  panel.appendChild(cancelAction.element);
  panel.appendChild(confirmAction);
  element.appendChild(panel);

  function handleScrimClick(event) {
    if (event.target === element) onCancel?.();
  }

  function handleKeydown(event) {
    if (event.key === 'Escape') onCancel?.();
  }

  element.addEventListener('click', handleScrimClick);
  document.addEventListener('keydown', handleKeydown);

  function update() {}

  function destroy() {
    document.removeEventListener('keydown', handleKeydown);
    cancelAction.destroy();
    element.remove();
  }

  return Object.freeze({ element, update, destroy });
}
