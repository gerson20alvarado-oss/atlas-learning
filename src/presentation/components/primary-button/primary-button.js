/**
 * presentation/components/primary-button/primary-button.js
 *
 * Button / primary (Design System §11.1): la única acción
 * visualmente dominante de una pantalla. 52px estándar, o 50px en el
 * Session Container ("continue"). Fill action-primary, radius-md,
 * sin ícono, sin sombra. Exactamente una instancia por pantalla.
 *
 * Refinamiento visual (esta sesión): `size: 'large'` — variante
 * opcional aditiva, mismo patrón exacto que `sessionVariant`. Con
 * `size: 'default'` (el valor por omisión, cuando nadie lo pasa) el
 * render es idéntico byte a byte al de antes de esta sesión — los 15
 * lugares que ya usan este componente (Worksheet, Progress Test,
 * Writing, Hi! Korean, Admin, Library, Sign Out...) no cambian en
 * absoluto. Solo entry-screen.js pasa `size: 'large'` para su botón
 * "Sign In" — mayor presencia (altura/tipografía/padding), mismos
 * colores, mismo comportamiento.
 */

export function createPrimaryButton({ label, onClick, sessionVariant = false, size = 'default', disabled = false }) {
  const element = document.createElement('button');
  element.setAttribute('data-component', 'primary-button');
  element.setAttribute('type', 'button');
  if (sessionVariant) {
    element.setAttribute('data-variant', 'session');
  }
  if (size === 'large') {
    element.setAttribute('data-size', 'large');
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
