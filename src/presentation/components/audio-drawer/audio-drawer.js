/**
 * presentation/components/audio-drawer/audio-drawer.js
 *
 * Drawer inferior compacto — exclusivo del reproductor de audio
 * (corrección de UX de esta sesión, tras prueba manual). A
 * diferencia de `resource-panel-overlay.js` (modal centrado con
 * scrim), este drawer nunca cubre la página: se desliza desde abajo,
 * ocupa solo el alto de un reproductor real, y dependiendo de cuán
 * larga sea la página el libro sigue siendo mayormente visible por
 * encima. El estudiante puede seguir leyendo la página mientras el
 * audio sigue sonando — ese es el objetivo completo del cambio.
 *
 * Sin scrim, sin `role="dialog"` modal — es una región persistente
 * de la interfaz mientras está abierta, mismo criterio ya usado en
 * `side-panel.js`. Cierra con Escape o con su botón de cierre —
 * nunca al tocar fuera, porque "fuera" sigue siendo la página real
 * del libro, con la que se sigue interactuando.
 */

export function createAudioDrawer({ onClose }) {
  const element = document.createElement('div');
  element.setAttribute('data-component', 'audio-drawer');
  element.setAttribute('role', 'complementary');
  element.setAttribute('aria-label', 'Reproductor de audio');

  const closeButton = document.createElement('button');
  closeButton.type = 'button';
  closeButton.setAttribute('data-part', 'close');
  closeButton.setAttribute('aria-label', 'Cerrar reproductor');
  closeButton.textContent = '×';
  closeButton.addEventListener('click', () => onClose?.());

  const contentSlot = document.createElement('div');
  contentSlot.setAttribute('data-part', 'content');

  element.appendChild(contentSlot);
  element.appendChild(closeButton);

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
