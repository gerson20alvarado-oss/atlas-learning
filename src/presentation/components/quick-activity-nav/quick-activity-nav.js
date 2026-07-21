/**
 * presentation/components/quick-activity-nav/quick-activity-nav.js
 *
 * Navegación rápida entre las actividades de unidades cercanas
 * (esta sesión) — completamente desacoplada de Worksheet, Progress
 * Test y Writing: no los importa, no conoce su lógica interna, ni
 * ellos lo conocen a él. Recibe `units` ya resuelto por quien
 * compone (`app/mount-quick-activity-nav.js`) — este componente solo
 * sabe pintar una lista de `{ unitNumber, unitTitle, isCurrent,
 * activities: [{ id, label, url, isActive }] }` y reportar una
 * elección; nunca decide qué unidades o actividades existen.
 *
 * Reutiliza dos piezas ya aprobadas del Design System, sin inventar
 * nada nuevo: `resource-panel-overlay.js` para el panel (scrim +
 * Escape + cierre, mismo patrón que Audio/Transcripción/Espacio de
 * Estudio) y el motivo visual del "badge circular de número de
 * unidad" que ya usan assessment-screen.css/writing-screen.css —
 * como disparador (FAB), en vez de un ícono nuevo fuera del set
 * cerrado de doce ya aprobado (Design System §10.2).
 *
 * Genérico a propósito (segundo requisito de esta sesión): `units`/
 * `activities` no tienen ningún campo llamado "worksheet" ni
 * "writing" en su forma — son `id`/`label`/`url` neutros. El mismo
 * componente sirve para cualquier tipo de actividad futura sin
 * cambiar una sola línea aquí.
 */

import { createResourcePanelOverlay } from '../resource-panel-overlay/resource-panel-overlay.js';

export function createQuickActivityNav({ units = [], currentUnitNumber, onSelect }) {
  const element = document.createElement('button');
  element.type = 'button';
  element.setAttribute('data-component', 'quick-activity-nav');
  element.setAttribute('aria-label', 'Jump to another activity');
  element.hidden = true;

  const badge = document.createElement('span');
  badge.setAttribute('data-part', 'trigger-badge');
  element.appendChild(badge);

  let overlay = null;

  function closePanel() {
    overlay?.destroy();
    overlay = null;
  }

  function buildPanelContent() {
    const list = document.createElement('div');
    list.setAttribute('data-part', 'unit-list');

    units.forEach((unit) => {
      const group = document.createElement('div');
      group.setAttribute('data-part', 'unit-group');
      if (unit.isCurrent) group.setAttribute('data-current', 'true');

      const groupTitle = document.createElement('p');
      groupTitle.setAttribute('data-part', 'unit-group-title');
      groupTitle.textContent = `Unit ${unit.unitNumber} — ${unit.unitTitle}`;
      group.appendChild(groupTitle);

      const activityList = document.createElement('div');
      activityList.setAttribute('data-part', 'activity-list');

      unit.activities.forEach((activity) => {
        const item = document.createElement('button');
        item.type = 'button';
        item.setAttribute('data-part', 'activity-item');
        if (activity.isActive) item.setAttribute('data-active', 'true');
        item.textContent = activity.label;
        item.addEventListener('click', () => {
          closePanel();
          onSelect?.(activity.url);
        });
        activityList.appendChild(item);
      });

      group.appendChild(activityList);
      list.appendChild(group);
    });

    return list;
  }

  function openPanel() {
    if (overlay) return; // ya abierto — evita duplicar el overlay
    overlay = createResourcePanelOverlay({ title: 'Jump to', onClose: closePanel });
    overlay.setContent(buildPanelContent());
    document.body.appendChild(overlay.element);
  }

  element.addEventListener('click', () => {
    if (overlay) closePanel();
    else openPanel();
  });

  function update(nextProps = {}) {
    if ('units' in nextProps) units = nextProps.units;
    if ('currentUnitNumber' in nextProps) currentUnitNumber = nextProps.currentUnitNumber;

    // Visible únicamente cuando hay algo real que mostrar — nunca un
    // disparador flotante sin destino (mismo criterio honesto que el
    // resto de Atlas).
    const hasContent = units.length > 0;
    element.hidden = !hasContent;
    if (hasContent) badge.textContent = String(currentUnitNumber ?? '');

    // Si el panel ya estaba abierto y la ruta cambió (ej. el
    // estudiante seleccionó una actividad), se cierra — nunca queda
    // un panel abierto mostrando datos de la pantalla anterior.
    closePanel();
  }

  function destroy() {
    closePanel();
    element.remove();
  }

  return Object.freeze({ element, update, destroy });
}
