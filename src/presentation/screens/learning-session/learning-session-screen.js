/**
 * presentation/screens/learning-session/learning-session-screen.js
 *
 * Session container (Design System §18): "one component, two
 * consumers" — Learn Mode y Review Mode comparten este mismo
 * componente, diferenciados solo por el label de fuente y el modo.
 * Sprint 3 solo construye el consumidor Learn Mode (Review Mode
 * depende de Error Records, que no existen hasta el Exercise Engine
 * — Roadmap Phase 5); no se añaden props especulativas para Review
 * todavía (YAGNI, Wireframe Review P10 — "silencio es una decisión
 * de diseño válida"). Cuando Review Mode llegue, es este mismo
 * archivo el que se extiende, no uno nuevo.
 *
 * Alcance de Sprint 3 (ver README y el reporte de riesgos del
 * Sprint): lineal, sellado (§18.2) — solo Lecture-type content
 * (prose/term/dialogue/aside/example/table), sin Practice (Exercise
 * Engine, Sprint 5) y sin Session Summary con resultados (no hay
 * Attempts que resumir). Al terminar la última sección, "Continue"
 * se convierte en "Finish" y sale — no hay pantalla de resultados
 * todavía.
 *
 * El índice de sección activo vive solo en memoria de este
 * componente (Session & Navigation State, Software Architecture
 * §9.2) — no se persiste (Persistence/Resume es Sprint 4). Salir
 * pierde la posición; ver session-exit.js.
 */

import { createSessionExit } from '../../components/session-exit/session-exit.js';
import { createProgressBar } from '../../components/progress-bar/progress-bar.js';
import { createPrimaryButton } from '../../components/primary-button/primary-button.js';
import { createContentBlock } from '../../components/content-blocks/content-block-renderer.js';
import { computeSessionProgress } from '../../../domain/content/progress.js';

const PAGE_TURN_MS = 360; // duration-gentle (Design System §21.2)

export function createLearningSessionScreen({ lesson, onExit }) {
  const element = document.createElement('div');
  element.setAttribute('data-component', 'learning-session-screen');

  const chrome = document.createElement('div');
  chrome.setAttribute('data-part', 'chrome');

  const exit = createSessionExit({ onSelect: () => onExit?.() });

  const sessionProgress = createProgressBar({
    completed: 0,
    total: lesson.sections.length,
    label: `Progreso de la sesión: ${lesson.title}`,
  });
  sessionProgress.element.setAttribute('data-part', 'session-progress');

  chrome.appendChild(exit.element);
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

  let currentIndex = 0;
  let currentSectionWrapper = null;

  function renderSection(index, { animateIncoming = false } = {}) {
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
      wrapper.appendChild(blockComponent.element);
      return blockComponent;
    });

    contentColumn.appendChild(wrapper);

    if (animateIncoming) {
      // Fuerza un reflow antes de quitar el estado "entering" para
      // que la transición CSS realmente se dispare (§21.3).
      requestAnimationFrame(() => {
        wrapper.removeAttribute('data-motion');
      });
    }

    currentSectionWrapper = { wrapper, blockComponents };

    const isLast = index === lesson.sections.length - 1;
    continueButton.update({ label: isLast ? 'Finish' : 'Continue' });
    sessionProgress.update(computeSessionProgress(index, lesson.sections.length));
  }

  function handleContinue() {
    const isLast = currentIndex === lesson.sections.length - 1;
    if (isLast) {
      onExit?.();
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
    renderSection(currentIndex, { animateIncoming: true });
  }

  renderSection(currentIndex);

  function update() {}

  function destroy() {
    exit.destroy();
    sessionProgress.destroy();
    continueButton.destroy();
    currentSectionWrapper?.blockComponents.forEach((block) => block.destroy());
    element.remove();
  }

  return Object.freeze({ element, update, destroy });
}
