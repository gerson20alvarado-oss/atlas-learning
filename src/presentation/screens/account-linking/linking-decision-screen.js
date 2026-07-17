/**
 * presentation/screens/account-linking/linking-decision-screen.js
 *
 * Única pantalla nueva que introduce el flujo de vinculación de
 * cuenta (Sprint 6 Plan, Caso 3: existen datos tanto locales como
 * remotos). Mismo vocabulario visual ya aprobado para el diálogo de
 * logout (Design System, Settings §2.10/§6.10) y para las dos
 * acciones de peso desigual de Session Summary (Wireframe Review
 * §2.7): una afirmación factual y calmada, dos acciones.
 *
 * Nunca se muestra si no hace falta — Casos 1, 2, y "nada que hacer"
 * se resuelven en silencio, sin interrumpir al estudiante (esta
 * pantalla es la única excepción reconocida, y por una razón
 * explícita: nunca destruir datos sin una acción deliberada).
 */

import { createPrimaryButton } from '../../components/primary-button/primary-button.js';
import { createStateView } from '../../components/state-views/state-views.js';

export function createLinkingDecisionScreen({ onMerge, onDiscard }) {
  const element = document.createElement('div');
  element.setAttribute('data-component', 'linking-decision-screen');

  const message = document.createElement('p');
  message.setAttribute('data-part', 'message');
  message.className = 'al-type-reading-body';
  message.textContent =
    'Este dispositivo tiene progreso guardado, y tu cuenta también. ¿Qué quieres hacer?';

  const primaryAction = createPrimaryButton({
    label: 'Conservar y combinar',
    onClick: () => handleDecision(onMerge),
  });
  primaryAction.element.setAttribute('data-part', 'merge');

  const secondaryAction = document.createElement('button');
  secondaryAction.type = 'button';
  secondaryAction.setAttribute('data-part', 'discard');
  secondaryAction.className = 'al-type-ui-caption';
  secondaryAction.textContent = 'Descartar progreso de este dispositivo';
  secondaryAction.addEventListener('click', () => handleDecision(onDiscard));

  // Objetivo B (Sprint 7, §22.5): mismo tratamiento que Login —
  // silencioso los primeros 400ms, whisper bar después. Ambas
  // acciones ya son asíncronas contra Supabase (screen-router.js,
  // accountLinkingFlow.resolvePendingDecision) y hasta ahora no
  // comunicaban ninguna espera.
  const loadingView = createStateView({ kind: 'loading' });
  loadingView.element.setAttribute('data-part', 'loading');
  loadingView.element.hidden = true;

  element.appendChild(message);
  element.appendChild(primaryAction.element);
  element.appendChild(secondaryAction);
  element.appendChild(loadingView.element);

  async function handleDecision(handler) {
    primaryAction.update({ disabled: true });
    secondaryAction.disabled = true;

    const revealLoading = setTimeout(() => {
      loadingView.element.hidden = false;
    }, 400);

    try {
      await handler?.();
    } finally {
      clearTimeout(revealLoading);
      loadingView.element.hidden = true;
      primaryAction.update({ disabled: false });
      secondaryAction.disabled = false;
    }
  }

  function update() {}

  function destroy() {
    primaryAction.destroy();
    element.remove();
  }

  return Object.freeze({ element, update, destroy });
}
