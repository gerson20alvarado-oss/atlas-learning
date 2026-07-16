/**
 * presentation/components/progress-bar/progress-bar.js
 *
 * Whisper progress bar (Design System §14.1–14.2): 2px, fractional,
 * un único estilo visual en todo el sistema — la jerarquía se
 * expresa por dónde está la barra, nunca por cómo se ve (WR P5).
 * Sin números (§14.1 regla 3): solo Session Summary puede mostrar
 * cifras.
 *
 * Componente puro: recibe { completed, total, label } ya resueltos
 * por quien lo use — no conoce Attempts, Books ni ninguna capa de
 * dominio (regla de vecinos, Software Architecture §9.3).
 *
 * Accesible por diseño (Design System §23.3): expone
 * role="progressbar" con name/current/max aunque la superficie
 * visual no muestre números — "el whisper es contención visual, no
 * ocultar información".
 */

export function createProgressBar({ completed, total, label }) {
  const element = document.createElement('div');
  element.setAttribute('data-component', 'progress-bar');
  element.setAttribute('role', 'progressbar');
  element.setAttribute('aria-valuemin', '0');

  const track = document.createElement('div');
  track.setAttribute('data-part', 'track');

  const fill = document.createElement('div');
  fill.setAttribute('data-part', 'fill');

  track.appendChild(fill);
  element.appendChild(track);

  function applyValues(nextCompleted, nextTotal, nextLabel) {
    const safeTotal = Math.max(0, nextTotal ?? 0);
    const safeCompleted = Math.min(Math.max(0, nextCompleted ?? 0), safeTotal);
    const ratio = safeTotal > 0 ? safeCompleted / safeTotal : 0;

    fill.style.width = `${ratio * 100}%`;
    element.setAttribute('aria-valuemax', String(safeTotal));
    element.setAttribute('aria-valuenow', String(safeCompleted));
    if (nextLabel) {
      element.setAttribute('aria-label', nextLabel);
    }
  }

  applyValues(completed, total, label);

  function update(nextProps = {}) {
    applyValues(
      nextProps.completed ?? completed,
      nextProps.total ?? total,
      nextProps.label ?? label,
    );
  }

  function destroy() {
    element.remove();
  }

  return Object.freeze({ element, update, destroy });
}
