/**
 * presentation/components/inline-action-button/inline-action-button.js
 *
 * Botón de acción inline/secundaria — para micro-acciones repetidas
 * junto a un control de formulario (ej. "Add" junto a un campo de
 * texto), nunca para el CTA dominante de una pantalla. Ese trabajo
 * sigue siendo exclusivo de `primary-button.js` (Submit, Continue,
 * Sign In) — este componente existe precisamente para que
 * `primary-button` no tenga que estirar su significado para cubrir
 * un caso que no es el suyo (decisión de arquitectura, sesión de
 * diseño de My Vocabulary).
 *
 * Deliberadamente genérico, no exclusivo de My Vocabulary: vive al
 * mismo nivel que `primary-button.js`/`back-nav.js`
 * (`presentation/components/`), con un contrato de props neutro
 * (`label`, `onClick`, `disabled`) — sin ningún concepto de
 * "palabra" ni "vocabulario" filtrado aquí. Cualquier pantalla
 * futura que necesite una acción inline equivalente puede
 * reutilizarlo tal cual.
 *
 * Construido con los mismos tokens de color/radio/tipografía que ya
 * usa el resto del Design System (`--al-action-primary`,
 * `--al-radius-md`, `--al-font-ui`) — nunca un color nuevo, nunca un
 * lenguaje visual paralelo.
 */

export function createInlineActionButton({ label, onClick, disabled = false }) {
  const element = document.createElement('button');
  element.setAttribute('data-component', 'inline-action-button');
  element.setAttribute('type', 'button');
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
