/**
 * presentation/components/primary-button/primary-button.js
 *
 * Button / primary (Design System §11.1): la única acción
 * visualmente dominante de una pantalla. 52px estándar, o 50px en el
 * Session Container ("continue"). Fill action-primary, radius-md,
 * sin ícono, sin sombra. Exactamente una instancia por pantalla.
 */

export function createPrimaryButton({ label, onClick, sessionVariant = false, disabled = false }) {
  const element = document.createElement('button');
  element.setAttribute('data-component', 'primary-button');
  element.setAttribute('type', 'button');
  if (sessionVariant) {
    element.setAttribute('data-variant', 'session');
  }
  element.textContent = label;
  element.disabled = disabled;

  element.addEventListener('click', () => {
    if (!element.disabled) onClick?.();
  });

  function update(nextProps = {}) {
    if (nextProps.label) {
      element.textContent = nextProps.label;
    }
    if ('disabled' in nextProps) {
      element.disabled = nextProps.disabled;
    }
  }

  function destroy() {
    element.remove();
  }

  return Object.freeze({ element, update, destroy });
}
