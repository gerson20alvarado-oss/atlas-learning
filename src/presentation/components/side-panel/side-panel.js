/**
 * presentation/components/side-panel/side-panel.js
 *
 * Panel lateral acoplado al Reader — exclusivo del Espacio de
 * Estudio (corrección de UX de esta sesión, tras prueba manual). A
 * diferencia de `resource-panel-overlay.js` (modal centrado con
 * scrim, usado por Audio/Transcripción/Respuestas), este panel nunca
 * cubre la página — se acopla al costado, dejándola completamente
 * visible, porque el estudiante escribe notas mientras sigue leyendo,
 * no en una interrupción puntual.
 *
 * Sin scrim, sin `role="dialog"` — no es un diálogo modal, es una
 * región persistente de la interfaz mientras está abierta. Cierra
 * con Escape (mismo criterio de teclado que el resto) o con su botón
 * de cierre — nunca al tocar fuera, porque "fuera" sigue siendo la
 * página real del libro, con la que se sigue interactuando.
 */

export function createSidePanel({ title, onClose }) {
  const element = document.createElement('div');
  element.setAttribute('data-component', 'side-panel');
  element.setAttribute('role', 'complementary');
  if (title) element.setAttribute('aria-label', title);

  const header = document.createElement('div');
  header.setAttribute('data-part', 'header');

  const closeButton = document.createElement('button');
  closeButton.type = 'button';
  closeButton.setAttribute('data-part', 'close');
  closeButton.setAttribute('aria-label', 'Cerrar');
  closeButton.textContent = '×';
  closeButton.addEventListener('click', () => onClose?.());

  header.appendChild(closeButton);

  const contentSlot = document.createElement('div');
  contentSlot.setAttribute('data-part', 'content');

  element.appendChild(header);
  element.appendChild(contentSlot);

  function handleKeydown(event) {
    if (event.key === 'Escape') onClose?.();
  }
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
