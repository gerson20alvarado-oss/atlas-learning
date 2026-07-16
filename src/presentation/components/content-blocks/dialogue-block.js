/**
 * presentation/components/content-blocks/dialogue-block.js
 *
 * Dialogue (Design System §19.4): contenido por turnos. Etiqueta de
 * hablante arriba de cada turno; texto indentado space-4. Sin
 * burbujas de chat ni alternancia izquierda/derecha — "a script on a
 * page, not a messaging app".
 */

export function createDialogueBlock(block) {
  const element = document.createElement('div');
  element.setAttribute('data-component', 'dialogue-block');

  for (const turn of block.turns) {
    const turnElement = document.createElement('div');
    turnElement.setAttribute('data-part', 'turn');

    const speaker = document.createElement('p');
    speaker.className = 'al-type-ui-caption';
    speaker.setAttribute('data-part', 'speaker');
    speaker.textContent = turn.speaker;

    const text = document.createElement('p');
    text.className = 'al-type-reading-body';
    text.setAttribute('data-part', 'text');
    text.textContent = turn.text;

    turnElement.appendChild(speaker);
    turnElement.appendChild(text);
    element.appendChild(turnElement);
  }

  function update() {}

  function destroy() {
    element.remove();
  }

  return Object.freeze({ element, update, destroy });
}
