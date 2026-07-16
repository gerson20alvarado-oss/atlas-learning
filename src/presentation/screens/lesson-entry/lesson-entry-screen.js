/**
 * presentation/screens/lesson-entry/lesson-entry-screen.js
 *
 * Lesson entry (Wireframe Review §2.5; Design System §13.4): no es
 * una card — título, tiempo estimado como texto plano orientativo
 * (nunca contador ni cuenta regresiva, DR7), una acción primaria.
 *
 * Sprint 3: el botón siempre dice "Begin" — la distinción
 * "Begin"/"Continue" que el Design System permite depende de saber
 * si la lección ya se empezó antes, y eso requiere Progress/Session
 * persistida (Sprint 4). Decir "Begin" siempre es la lectura honesta
 * del estado actual, no una limitación oculta.
 */

import { createBackNav } from '../../components/back-nav/back-nav.js';
import { createPrimaryButton } from '../../components/primary-button/primary-button.js';

export function createLessonEntryScreen({ lesson, onBack, onBegin }) {
  const element = document.createElement('div');
  element.setAttribute('data-component', 'lesson-entry-screen');

  const backNav = createBackNav({ parentLabel: 'unit', onSelect: onBack });

  const heading = document.createElement('h1');
  heading.setAttribute('data-part', 'title');
  heading.textContent = lesson.title;

  const timeEstimate = document.createElement('p');
  timeEstimate.setAttribute('data-part', 'time-estimate');
  timeEstimate.textContent = `Tiempo de estudio estimado — ${lesson.estimatedStudyMinutes} minutos`;

  const beginButton = createPrimaryButton({ label: 'Begin', onClick: onBegin });

  element.appendChild(backNav.element);
  element.appendChild(heading);
  element.appendChild(timeEstimate);
  element.appendChild(beginButton.element);

  function update() {}

  function destroy() {
    backNav.destroy();
    beginButton.destroy();
    element.remove();
  }

  return Object.freeze({ element, update, destroy });
}
