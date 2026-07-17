/**
 * presentation/screens/unit/unit-screen.js
 *
 * Unit screen (Wireframe Review §2.4): lista de lecciones dentro de
 * una unidad, progreso a nivel unidad, marcador de texto plano
 * "next" en la primera lección incompleta (Design System §14.3).
 * Filas de lección con estado binario, no fraccional.
 *
 * Componente puro: recibe `unit` (con progreso y marcadores ya
 * computados) y los callbacks `onBack` / `onSelectLesson`.
 */

import { createBackNav } from '../../components/back-nav/back-nav.js';
import { createProgressBar } from '../../components/progress-bar/progress-bar.js';
import { createListRow } from '../../components/list-row/list-row.js';

export function createUnitScreen({ unit, onBack, onSelectLesson }) {
  const element = document.createElement('div');
  element.setAttribute('data-component', 'unit-screen');

  const backNav = createBackNav({ parentLabel: 'book', onSelect: onBack });

  const heading = document.createElement('h1');
  heading.setAttribute('data-part', 'title');
  heading.className = 'al-type-title';
  heading.textContent = unit.title;

  const unitProgressBar = createProgressBar({
    completed: unit.progress.completed,
    total: unit.progress.total,
    label: `Progreso de ${unit.title}`,
  });
  unitProgressBar.element.setAttribute('data-part', 'unit-progress');

  const lessonList = document.createElement('div');
  lessonList.setAttribute('data-part', 'lesson-list');
  lessonList.setAttribute('role', 'list');

  const lessonRows = unit.lessons.map((lesson) => {
    const row = createListRow({
      title: lesson.title,
      marker: lesson.marker,
      onSelect: () => onSelectLesson?.(lesson.id),
    });
    row.element.setAttribute('role', 'listitem');
    lessonList.appendChild(row.element);
    return row;
  });

  element.appendChild(backNav.element);
  element.appendChild(heading);
  element.appendChild(unitProgressBar.element);
  element.appendChild(lessonList);

  function update() {
    // Igual que Book screen: un cambio de unidad navega a una
    // instancia nueva (content-region.render), no re-renderiza en
    // caliente.
  }

  function destroy() {
    backNav.destroy();
    unitProgressBar.destroy();
    lessonRows.forEach((row) => row.destroy());
    element.remove();
  }

  return Object.freeze({ element, update, destroy });
}
