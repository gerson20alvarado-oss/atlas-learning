/**
 * presentation/components/resource-panels/transcript-panel.js
 *
 * Contenido de solo lectura. `resource.transcriptLines` es un
 * arreglo de `{ speaker, text }` — `speaker` es `null` en un pasaje
 * narrado, sin turnos de diálogo. Cuando no existe todavía, se
 * muestra el mismo estado honesto de siempre — nunca se fabrica
 * contenido.
 *
 * Corrección de UX (esta sesión): ya no se auto-envuelve en
 * `resource-panel-overlay` (modal centrado, cubría el libro). Expone
 * su contenido en bruto para que quien lo monte
 * (page-reader-screen.js) decida el contenedor — hoy, `side-panel.js`
 * reutilizado tal cual (mismo componente que ya usa el Espacio de
 * Estudio, sin ningún cambio). El contenido en sí no cambió.
 */

export function createTranscriptPanel({ resource }) {
  const element = document.createElement('div');
  element.setAttribute('data-component', 'transcript-panel-content');

  const heading = document.createElement('h2');
  heading.setAttribute('data-part', 'title');
  heading.className = 'al-type-ui-label';
  heading.textContent = `Transcripción — ${resource.pageTemplate}`;
  element.appendChild(heading);

  if (resource.transcriptLines?.length) {
    const container = document.createElement('div');
    container.setAttribute('data-part', 'transcript-lines');

    resource.transcriptLines.forEach(({ speaker, text }) => {
      const line = document.createElement('p');
      line.setAttribute('data-part', speaker ? 'transcript-turn' : 'transcript-narration');
      if (speaker) {
        const speakerLabel = document.createElement('strong');
        speakerLabel.textContent = speaker;
        line.appendChild(speakerLabel);
        line.appendChild(document.createTextNode(' ' + text));
      } else {
        line.textContent = text;
      }
      container.appendChild(line);
    });

    element.appendChild(container);
  } else {
    const content = document.createElement('p');
    content.className = 'al-type-ui-caption';
    content.textContent = resource.sourcePageRef
      ? 'La transcripción todavía no está disponible — pendiente de producir el apéndice del libro.'
      : 'Este recurso no tiene transcripción asociada.';
    element.appendChild(content);
  }

  function destroy() {
    element.remove();
  }

  return Object.freeze({ element, destroy });
}
