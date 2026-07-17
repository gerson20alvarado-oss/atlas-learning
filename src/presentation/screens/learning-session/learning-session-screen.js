/**
 * presentation/screens/learning-session/learning-session-screen.js
 *
 * Session container (Design System §18): "one component, two
 * consumers" — Learn Mode y Review Mode comparten este mismo
 * componente. Sprint 5 solo construye el consumidor Learn Mode
 * (Review Mode queda fuera de este sprint a pedido explícito).
 *
 * Sprint 5 (Exercise Engine) añade la anatomía compartida de todo
 * ejercicio (§17.1): el botón "Continue" de la Session pasa a hacer
 * doble función de "Check/Continue" cuando la sección activa tiene
 * bloques `practice` sin responder — "One tap selects; the session's
 * continue/check action confirms" (§17.3), "submit via the continue/
 * check action" (§17.5). El flujo, por click:
 *   1. Si existe un bloque `practice` de la sección activa que
 *      todavía no fue verificado (`isAnswered() === false`): el botón
 *      dice "Check"; deshabilitado mientras no haya una respuesta
 *      pendiente (`getPendingResponse() === null`); al hacer click
 *      verifica ESE bloque (`checkNow()`, que dispara `block.onCheck`
 *      — inyectado desde app/screen-router.js, nunca calculado aquí)
 *      y muestra su Feedback (§17.2), sin avanzar de sección todavía.
 *   2. Si todos los `practice` de la sección ya están verificados (o
 *      no hay ninguno): el botón vuelve a ser "Continue"/"Finish" y
 *      avanza exactamente como en Sprint 3/4.
 *
 * Este componente NUNCA evalúa una respuesta ni conoce el Exercise
 * Engine (evaluator) directamente — solo orquesta CUÁNDO se invoca
 * `checkNow()` de cada bloque, que a su vez llama al callback ya
 * inyectado. Sigue siendo Presentation puro: `onCheck` por bloque,
 * `onSectionChange`, `onScrollChange` y `onExit` llegan todos como
 * props, compuestos por app/screen-router.js.
 *
 * Restauración de ejercicios (Sprint 5 Plan, decisión #5): no existe
 * ningún puntero de "ejercicio actual" en Session. Cada bloque
 * `practice` recibe su propio `priorAttempt` ya resuelto (o `null`)
 * desde app/screen-router.js, consultando Attempts — este componente
 * no sabe de dónde salió ese dato, solo lo pasa a través de
 * content-block-renderer.js.
 *
 * Objetivo E (Sprint 7, validación manual — decisión de Producto):
 * el chrome ahora expone dos acciones independientes, nunca una
 * sustituyendo a la otra — `onBack` (jerárquico, un nivel arriba:
 * Lesson entry, mismo componente back-nav que el resto del sistema)
 * y `onExit` (abandonar la sesión activa y volver a Home, session-
 * exit). Esto amplía lo que el Wireframe Review §2.6 especificaba
 * originalmente para este contenedor (solo "quiet exit"); la
 * ampliación es una decisión de Producto explícita, no una
 * corrección de una omisión del diseño original.
 */

import { createBackNav } from '../../components/back-nav/back-nav.js';
import { createSessionExit } from '../../components/session-exit/session-exit.js';
import { createProgressBar } from '../../components/progress-bar/progress-bar.js';
import { createPrimaryButton } from '../../components/primary-button/primary-button.js';
import { createContentBlock } from '../../components/content-blocks/content-block-renderer.js';
import { computeSessionProgress } from '../../../domain/content/progress.js';

const PAGE_TURN_MS = 360; // duration-gentle (Design System §21.2)
const SCROLL_SAVE_DEBOUNCE_MS = 400;

export function createLearningSessionScreen({
  lesson,
  restoreSectionIndex = 0,
  restoreScrollPosition = 0,
  onSectionChange,
  onScrollChange,
  onBack,
  onExit,
}) {
  const element = document.createElement('div');
  element.setAttribute('data-component', 'learning-session-screen');

  const chrome = document.createElement('div');
  chrome.setAttribute('data-part', 'chrome');

  // Back (jerárquico, un nivel arriba: Lesson entry) y Exit (salir de
  // la sesión activa y volver a Home) son dos acciones con
  // responsabilidades distintas — ninguna sustituye a la otra
  // (decisión de Producto, Sprint 7, validación manual). Misma
  // familia visual (Design System §11.2: "‹ back" y session "exit"
  // son ambos "secondary actions" quietas), agrupadas para que la
  // barra de progreso siga teniendo su propio espacio a la derecha.
  const chromeActions = document.createElement('div');
  chromeActions.setAttribute('data-part', 'chrome-actions');

  const backNav = createBackNav({ parentLabel: 'lesson', onSelect: onBack });
  const exit = createSessionExit({ onSelect: () => onExit?.({ reason: 'exited' }) });
  chromeActions.appendChild(backNav.element);
  chromeActions.appendChild(exit.element);

  const sessionProgress = createProgressBar({
    completed: 0,
    total: lesson.sections.length,
    label: `Progreso de la sesión: ${lesson.title}`,
  });
  sessionProgress.element.setAttribute('data-part', 'session-progress');

  chrome.appendChild(chromeActions);
  chrome.appendChild(sessionProgress.element);

  const contentColumn = document.createElement('div');
  contentColumn.setAttribute('data-part', 'content-column');

  const continueButton = createPrimaryButton({
    label: 'Continue',
    sessionVariant: true,
    onClick: () => handleContinue(),
  });
  continueButton.element.setAttribute('data-part', 'continue');

  element.appendChild(chrome);
  element.appendChild(contentColumn);
  element.appendChild(continueButton.element);

  const lastValidIndex = lesson.sections.length - 1;
  let currentIndex = Math.min(Math.max(restoreSectionIndex, 0), lastValidIndex);
  let currentSectionWrapper = null; // { wrapper, blockComponents, practiceComponents }
  let scrollSaveTimer = null;

  function practiceComponentsOf(section, blockComponents) {
    return section.blocks
      .map((block, i) => (block.type === 'practice' ? blockComponents[i] : null))
      .filter(Boolean);
  }

  function renderSection(index, { animateIncoming = false, restoredScroll = null } = {}) {
    const section = lesson.sections[index];

    const wrapper = document.createElement('div');
    wrapper.setAttribute('data-part', 'section');
    if (animateIncoming) {
      wrapper.setAttribute('data-motion', 'entering');
    }

    const sectionLabel = document.createElement('p');
    sectionLabel.setAttribute('data-part', 'section-label');
    sectionLabel.className = 'al-type-ui-caption';
    sectionLabel.textContent = section.label;
    wrapper.appendChild(sectionLabel);

    const blockComponents = section.blocks.map((block) => {
      const blockComponent = createContentBlock(block);
      blockComponent.element.setAttribute('data-part', 'block');
      // Sprint 7 (Objetivo E, extensión): expone el tipo del bloque
      // solo para que el CSS pueda distinguir ritmo vertical entre
      // bloques relacionados vs. cambios de tema (ver CSS,
      // "dos niveles de espaciado") — no cambia el contrato de
      // ningún bloque ni la estructura de datos del contenido.
      blockComponent.element.setAttribute('data-block-type', block.type);
      wrapper.appendChild(blockComponent.element);
      return blockComponent;
    });

    contentColumn.appendChild(wrapper);

    if (animateIncoming) {
      requestAnimationFrame(() => {
        wrapper.removeAttribute('data-motion');
      });
    }

    currentSectionWrapper = {
      wrapper,
      blockComponents,
      practiceComponents: practiceComponentsOf(section, blockComponents),
    };

    sessionProgress.update(computeSessionProgress(index, lesson.sections.length));
    updateContinueButtonState();

    if (restoredScroll !== null) {
      requestAnimationFrame(() => {
        window.scrollTo(0, restoredScroll);
      });
    }
  }

  /**
   * Decide la etiqueta y el estado del botón compartido según los
   * `practice` de la sección activa (Design System §17.1, §17.3,
   * §17.5) — "Check" mientras quede alguno sin verificar, "Continue"/
   * "Finish" cuando todos ya muestran su Feedback (o no hay ninguno).
   */
  function updateContinueButtonState() {
    if (!currentSectionWrapper) return;
    const firstUnanswered = currentSectionWrapper.practiceComponents.find((c) => !c.isAnswered());
    const isLast = currentIndex === lesson.sections.length - 1;

    if (firstUnanswered) {
      const hasPendingResponse = firstUnanswered.getPendingResponse() !== null;
      continueButton.update({ label: 'Check', disabled: !hasPendingResponse });
    } else {
      continueButton.update({ label: isLast ? 'Finish' : 'Continue', disabled: false });
    }
  }

  function handleScroll() {
    window.clearTimeout(scrollSaveTimer);
    scrollSaveTimer = window.setTimeout(() => {
      onScrollChange?.(window.scrollY);
    }, SCROLL_SAVE_DEBOUNCE_MS);
  }

  function flushScrollSave() {
    window.clearTimeout(scrollSaveTimer);
    onScrollChange?.(window.scrollY);
  }

  window.addEventListener('scroll', handleScroll, { passive: true });
  window.addEventListener('beforeunload', flushScrollSave);

  // Delegación de eventos: cualquier tecleo o selección dentro de un
  // ejercicio puede habilitar el botón "Check" (una respuesta recién
  // se volvió disponible) — un único listener por sección en vez de
  // que cada tipo de ejercicio conozca al botón compartido.
  contentColumn.addEventListener('input', () => updateContinueButtonState());
  contentColumn.addEventListener('click', () => updateContinueButtonState());

  function handleContinue() {
    const firstUnanswered = currentSectionWrapper.practiceComponents.find((c) => !c.isAnswered());

    if (firstUnanswered) {
      if (firstUnanswered.getPendingResponse() === null) return; // defensivo: el botón ya debería estar disabled
      firstUnanswered.checkNow();
      updateContinueButtonState();
      return;
    }

    const isLast = currentIndex === lesson.sections.length - 1;
    if (isLast) {
      flushScrollSave();
      onExit?.({ reason: 'finished' });
      return;
    }
    advanceToSection(currentIndex + 1);
  }

  function advanceToSection(nextIndex) {
    const outgoing = currentSectionWrapper;
    if (outgoing) {
      outgoing.wrapper.setAttribute('data-motion', 'exiting');
      window.setTimeout(() => {
        outgoing.blockComponents.forEach((block) => block.destroy());
        outgoing.wrapper.remove();
      }, PAGE_TURN_MS);
    }
    currentIndex = nextIndex;
    onSectionChange?.(currentIndex);
    window.scrollTo(0, 0);
    renderSection(currentIndex, { animateIncoming: true });
  }

  onSectionChange?.(currentIndex);
  renderSection(currentIndex, {
    restoredScroll: restoreScrollPosition > 0 ? restoreScrollPosition : null,
  });

  function update() {}

  function destroy() {
    window.removeEventListener('scroll', handleScroll);
    window.removeEventListener('beforeunload', flushScrollSave);
    window.clearTimeout(scrollSaveTimer);
    backNav.destroy();
    exit.destroy();
    sessionProgress.destroy();
    continueButton.destroy();
    currentSectionWrapper?.blockComponents.forEach((block) => block.destroy());
    element.remove();
  }

  return Object.freeze({ element, update, destroy });
}
