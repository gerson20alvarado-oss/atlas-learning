/**
 * presentation/components/page-navigator/page-navigator.js
 *
 * Popover pequeño para saltar directo a cualquier página — resuelve
 * el problema real de usabilidad de depender únicamente de
 * Anterior/Siguiente en un libro largo (273 páginas). No es un panel
 * lateral ni un modal con scrim: es un popover anclado al indicador
 * de página, se cierra con Escape, con el botón "Ir", o tocando
 * fuera — nunca compite visualmente con la página del libro.
 *
 * Componente puro: recibe `currentPage`, `firstPage`, `lastPage`,
 * `onNavigate(pageNumber)` — no conoce PageSource, Router ni
 * ReaderPosition. Toda la validación de rango ocurre aquí, antes de
 * invocar `onNavigate` — un número fuera de rango nunca llega a
 * disparar una navegación real.
 */

export function createPageNavigator({ currentPage, firstPage, lastPage, onNavigate, onClose }) {
  const element = document.createElement('div');
  element.setAttribute('data-component', 'page-navigator');
  element.setAttribute('role', 'dialog');
  element.setAttribute('aria-label', 'Ir a la página');

  const title = document.createElement('p');
  title.setAttribute('data-part', 'title');
  title.textContent = 'Ir a la página';

  const divider = document.createElement('hr');
  divider.setAttribute('data-part', 'divider');

  const row = document.createElement('div');
  row.setAttribute('data-part', 'input-row');

  const input = document.createElement('input');
  input.type = 'number';
  input.min = String(firstPage);
  input.max = String(lastPage);
  input.value = String(currentPage);
  input.setAttribute('data-part', 'input');
  input.setAttribute('aria-label', 'Número de página');

  const goButton = document.createElement('button');
  goButton.type = 'button';
  goButton.setAttribute('data-part', 'go');
  goButton.textContent = 'Ir';

  row.appendChild(input);
  row.appendChild(goButton);

  const errorMessage = document.createElement('p');
  errorMessage.setAttribute('data-part', 'error');
  errorMessage.hidden = true;

  element.appendChild(title);
  element.appendChild(divider);
  element.appendChild(row);
  element.appendChild(errorMessage);

  function showError(message) {
    errorMessage.textContent = message;
    errorMessage.hidden = false;
  }

  function clearError() {
    errorMessage.hidden = true;
  }

  function attemptNavigate() {
    const raw = input.value.trim();
    const pageNumber = Number(raw);

    if (raw === '' || !Number.isInteger(pageNumber)) {
      showError('Escribe un número de página válido.');
      return;
    }
    if (pageNumber < firstPage || pageNumber > lastPage) {
      showError(`La página debe estar entre ${firstPage} y ${lastPage}.`);
      return;
    }

    clearError();
    onNavigate(pageNumber);
  }

  goButton.addEventListener('click', attemptNavigate);
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      attemptNavigate();
    }
  });
  input.addEventListener('input', clearError);

  function handleKeydown(event) {
    if (event.key === 'Escape') onClose?.();
  }
  document.addEventListener('keydown', handleKeydown);

  function handleOutsideClick(event) {
    if (!element.contains(event.target)) onClose?.();
  }
  // Se registra en el siguiente tick — evita que el mismo clic que
  // abrió el popover (en el botón indicador) lo cierre de inmediato.
  window.setTimeout(() => document.addEventListener('click', handleOutsideClick), 0);

  input.focus();
  input.select();

  function destroy() {
    document.removeEventListener('keydown', handleKeydown);
    document.removeEventListener('click', handleOutsideClick);
    element.remove();
  }

  return Object.freeze({ element, destroy });
}
