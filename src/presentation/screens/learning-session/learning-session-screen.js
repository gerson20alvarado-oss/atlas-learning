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
 * Alcance de Sprint 3: lineal, sellado (§18.2) — solo Lecture-type
 * content, sin Session Summary con resultados (no hay Attempts que
 * resumir). Al terminar la última sección, "Continue" se convierte en
 * "Finish" y sale — no hay pantalla de resultados todavía (eso sigue
 * sin cambiar en Sprint 4: no hay Attempts, Sprint 5).
 *
 * Sprint 4 (Progress, Roadmap Phase 4) añade lo que Sprint 3 dejó
 * explícitamente pendiente: la posición de sección y el scroll ya no
 * viven solo en memoria (Software Architecture §10.4, §14.3) —
 * `restoreSectionIndex`/`restoreScrollPosition` permiten reanudar
 * exactamente donde quedó el estudiante, y `onSectionChange` /
 * `onScrollChange` (inyectados desde app/screen-router.js, que ya
 * conoce el Session repository) persisten cada cambio granular, no
 * solo al salir. `onExit` ahora recibe `{ reason }` ('finished' |
 * 'exited') para que quien orquesta decida qué hacer con la Session
 * persistida en cada caso (ver screen-router.js: 'finished' limpia la
 * Session, 'exited' no toca nada más — ya quedó guardada
 * incrementalmente).
 *
 * currentExercise/currentAudio del esquema de Session (Sprint 4 Plan)
 * no se popula todavía desde aquí: no hay Exercises reales (Sprint 5)
 * ni Media de audio real en el contenido de este sprint — permanecen
 * en `null`, honestamente, hasta que exista algo real que registrar.
 */

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
  onExit,
}) {
  const element = document.createElement('div');
  element.setAttribute('data-component', 'learning-session-screen');

  const chrome = document.createElement('div');
  chrome.setAttribute('data-part', 'chrome');

  const exit = createSessionExit({ onSelect: () => onExit?.({ reason: 'exited' }) });

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

  // Restaura dentro de los límites válidos de la Lesson actual — una
  // Session persistida podría apuntar a un índice que ya no existe si
  // el contenido de la Lesson cambió entre sesiones (Content Import
  // Pipeline republicó la Lesson con menos secciones). Degradar a 0
  // es la misma postura que content-repository.js aplica a contenido
  // inválido: nunca romper, nunca fingir una posición que no existe.
  const lastValidIndex = lesson.sections.length - 1;
  let currentIndex = Math.min(Math.max(restoreSectionIndex, 0), lastValidIndex);
  let currentSectionWrapper = null;
  let scrollSaveTimer = null;

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

    if (restoredScroll !== null) {
      // Restaurar el scroll exacto requiere que el layout de la
      // sección ya esté pintado — se usa un rAF; es una restauración
      // "mejor esfuerzo", nunca bloqueante (Software Architecture C6:
      // nada debe interrumpir el aprendizaje esperando una
      // restauración perfecta).
      requestAnimationFrame(() => {
        window.scrollTo(0, restoredScroll);
      });
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

  function handleContinue() {
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
    // Cambiar de sección es un punto de guardado granular explícito
    // (Software Architecture §10.4) — el scroll de la nueva sección
    // empieza en 0, nunca hereda el de la sección anterior.
    onSectionChange?.(currentIndex);
    window.scrollTo(0, 0);
    renderSection(currentIndex, { animateIncoming: true });
  }

  // Primer render: restaura la sección exacta (si había una Session
  // válida para esta Lesson) y persiste inmediatamente la posición
  // resultante — así, aunque el estudiante haya llegado por Library/
  // Unit en vez de "Continue Learning", la Session queda apuntando a
  // esta Lesson desde el primer instante (postura "most-recent-write-
  // wins" ya aceptada para el puntero de Session, Software
  // Architecture §11.4).
  onSectionChange?.(currentIndex);
  renderSection(currentIndex, {
    restoredScroll: restoreScrollPosition > 0 ? restoreScrollPosition : null,
  });

  function update() {}

  function destroy() {
    window.removeEventListener('scroll', handleScroll);
    window.removeEventListener('beforeunload', flushScrollSave);
    window.clearTimeout(scrollSaveTimer);
    exit.destroy();
    sessionProgress.destroy();
    continueButton.destroy();
    currentSectionWrapper?.blockComponents.forEach((block) => block.destroy());
    element.remove();
  }

  return Object.freeze({ element, update, destroy });
}
