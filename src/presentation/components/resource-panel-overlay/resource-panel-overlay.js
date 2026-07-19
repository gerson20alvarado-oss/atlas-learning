/**
 * presentation/components/resource-panel-overlay/resource-panel-overlay.js
 *
 * Contenedor genérico de "panel superpuesto sobre la página"
 * (Sprint Proposal — Nuevo Reader, Etapa 8): scrim + título + botón
 * de cierre + una ranura de contenido. No sabe qué tipo de recurso
 * aloja — cada panel de recurso (audio, transcripción, Espacio de
 * Estudio) construye su propio contenido y lo monta aquí.
 *
 * Mismo patrón de interacción ya usado en sign-out-confirm.js (único
 * precedente de "ventana superpuesta" en todo el proyecto hasta
 * ahora): clic en el scrim o Escape cierra, mismos tokens de Design
 * System (`--al-surface-scrim`, `--al-dialog-max-width`,
 * `--al-shadow-dialog`). No es un sistema de diálogos genérico nuevo
 * — es la extensión mínima de un patrón ya existente a un segundo
 * caso de uso (paneles de recurso), no una abstracción inventada
 * para esta etapa.
 */

export function createResourcePanelOverlay({ title, onClose }) {
  const element = document.createElement('div');
  element.setAttribute('data-component', 'resource-panel-overlay');
  element.setAttribute('role', 'dialog');
  element.setAttribute('aria-modal', 'true');
  if (title) element.setAttribute('aria-label', title);

  const panel = document.createElement('div');
  panel.setAttribute('data-part', 'panel');

  const header = document.createElement('div');
  header.setAttribute('data-part', 'header');

  const titleElement = document.createElement('span');
  titleElement.setAttribute('data-part', 'title');
  titleElement.className = 'al-type-ui-label';
  titleElement.textContent = title ?? '';

  const closeButton = document.createElement('button');
  closeButton.type = 'button';
  closeButton.setAttribute('data-part', 'close');
  closeButton.setAttribute('aria-label', 'Cerrar');
  closeButton.textContent = '×';
  closeButton.addEventListener('click', () => onClose?.());

  header.appendChild(titleElement);
  header.appendChild(closeButton);

  const contentSlot = document.createElement('div');
  contentSlot.setAttribute('data-part', 'content');

  panel.appendChild(header);
  panel.appendChild(contentSlot);
  element.appendChild(panel);

  function handleScrimClick(event) {
    if (event.target === element) onClose?.();
  }

  function handleKeydown(event) {
    if (event.key === 'Escape') onClose?.();
  }

  element.addEventListener('click', handleScrimClick);
  document.addEventListener('keydown', handleKeydown);

  function setContent(childElement) {
    contentSlot.replaceChildren(childElement);
  }

  function destroy() {
    document.removeEventListener('keydown', handleKeydown);
    element.remove();
  }

  return Object.freeze({ element, setContent, destroy });
}
