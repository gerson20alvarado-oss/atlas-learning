/**
 * domain/content/library-catalog.js
 *
 * Datos de un Book publicado, en la forma exacta que exige el
 * book-as-data contract (Software Architecture §5.2) y las shapes de
 * domain/contracts/entity-shapes.js.
 *
 * Nota de alcance (Sprint 2 Plan, vigente): el Content Import
 * Pipeline (Software Architecture §7) es explícitamente "outside the
 * runtime system" — no corre en el navegador. Su único contrato con
 * el runtime es su OUTPUT: un Book válido. Este archivo *es* ese
 * output, publicado como módulo ES estático junto al resto de la SPA
 * (Software Architecture §8.3).
 *
 * Sprint 3 puebla por primera vez las Dynamic Learning Sections y
 * Content Blocks de cada Lesson (antes deliberadamente ausentes).
 * Solo se usan los seis primitivos que presentation/components/
 * content-blocks/ ya sabe renderizar en Sprint 3: prose, term,
 * dialogue, aside, example, table. "media" y "practice" son
 * primitivos válidos según entity-shapes.js (el contrato de datos ya
 * los reconoce, C5) pero deliberadamente no aparecen en este
 * contenido de muestra todavía — no hay assets reales de audio/video
 * (media) ni Exercise Engine (practice, Roadmap Phase 5). Ver
 * content-block-renderer.js para el fallback si un book futuro sí
 * los declara.
 */

export const LIBRARY_CATALOG = Object.freeze({
  books: [
    {
      id: 'book-espanol-esencial',
      title: 'Español Esencial',
      units: [
        {
          id: 'unit-1',
          title: 'Unidad 1 — Saludos',
          lessons: [
            {
              id: 'lesson-1-1',
              title: 'Saludar y despedirse',
              estimatedStudyMinutes: 15,
              sections: [
                {
                  id: 'section-1-1-a',
                  label: 'Lectura',
                  blocks: [
                    {
                      id: 'block-1-1-a-1',
                      type: 'prose',
                      paragraphs: [
                        'En español, el saludo cambia según la hora del día. No es solo una fórmula — marca el tono de toda la conversación que sigue.',
                        'Entre personas que no se conocen, lo habitual es un registro algo más formal que el que se usa entre amigos o familiares.',
                      ],
                    },
                  ],
                },
                {
                  id: 'section-1-1-b',
                  label: 'Frases clave',
                  blocks: [
                    {
                      id: 'block-1-1-b-1',
                      type: 'term',
                      entries: [
                        {
                          term: 'Hola',
                          meaning: 'Saludo informal, válido a cualquier hora.',
                        },
                        {
                          term: 'Buenos días',
                          meaning: 'Saludo formal, se usa por la mañana.',
                        },
                        {
                          term: 'Buenas tardes',
                          meaning: 'Saludo formal, desde el mediodía hasta el anochecer.',
                        },
                        {
                          term: 'Hasta luego',
                          meaning: 'Despedida neutra, para cualquier momento del día.',
                        },
                      ],
                    },
                  ],
                },
              ],
            },
            {
              id: 'lesson-1-2',
              title: 'Presentarse',
              estimatedStudyMinutes: 20,
              sections: [
                {
                  id: 'section-1-2-a',
                  label: 'Diálogo',
                  blocks: [
                    {
                      id: 'block-1-2-a-1',
                      type: 'dialogue',
                      turns: [
                        { speaker: 'Ana', text: 'Buenos días. Me llamo Ana.' },
                        { speaker: 'Luis', text: 'Mucho gusto, Ana. Yo soy Luis.' },
                        { speaker: 'Ana', text: '¿De dónde eres, Luis?' },
                        { speaker: 'Luis', text: 'Soy de Montevideo. ¿Y tú?' },
                      ],
                    },
                  ],
                },
                {
                  id: 'section-1-2-b',
                  label: 'Nota cultural',
                  blocks: [
                    {
                      id: 'block-1-2-b-1',
                      type: 'aside',
                      label: 'Nota',
                      body: 'El uso de "tú" o "usted" varía mucho según el país. Ante la duda, empezar con "usted" nunca es un error.',
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          id: 'unit-2',
          title: 'Unidad 2 — Objetos cotidianos',
          lessons: [
            {
              id: 'lesson-2-1',
              title: 'En casa',
              estimatedStudyMinutes: 18,
              sections: [
                {
                  id: 'section-2-1-a',
                  label: 'Vocabulario',
                  blocks: [
                    {
                      id: 'block-2-1-a-1',
                      type: 'term',
                      entries: [
                        { term: 'la mesa', meaning: 'table' },
                        { term: 'la silla', meaning: 'chair' },
                        { term: 'la ventana', meaning: 'window' },
                        { term: 'la puerta', meaning: 'door' },
                      ],
                    },
                  ],
                },
                {
                  id: 'section-2-1-b',
                  label: 'Ejemplo',
                  blocks: [
                    {
                      id: 'block-2-1-b-1',
                      type: 'example',
                      label: 'Ejemplo',
                      body: 'La mesa está cerca de la ventana, y la silla está junto a la puerta.',
                    },
                  ],
                },
              ],
            },
            {
              id: 'lesson-2-2',
              title: 'En la escuela',
              estimatedStudyMinutes: 22,
              sections: [
                {
                  id: 'section-2-2-a',
                  label: 'Vocabulario',
                  blocks: [
                    {
                      id: 'block-2-2-a-1',
                      type: 'term',
                      entries: [
                        { term: 'el libro', meaning: 'book' },
                        { term: 'el cuaderno', meaning: 'notebook' },
                        { term: 'el lápiz', meaning: 'pencil' },
                      ],
                    },
                  ],
                },
                {
                  id: 'section-2-2-b',
                  label: 'Singular y plural',
                  blocks: [
                    {
                      id: 'block-2-2-b-1',
                      type: 'table',
                      headers: ['Singular', 'Plural'],
                      rows: [
                        ['el libro', 'los libros'],
                        ['el cuaderno', 'los cuadernos'],
                        ['el lápiz', 'los lápices'],
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          id: 'unit-3',
          title: 'Unidad 3 — Rutinas',
          lessons: [
            {
              id: 'lesson-3-1',
              title: 'Mi día',
              estimatedStudyMinutes: 20,
              sections: [
                {
                  id: 'section-3-1-a',
                  label: 'Lectura',
                  blocks: [
                    {
                      id: 'block-3-1-a-1',
                      type: 'prose',
                      paragraphs: [
                        'Describir una rutina diaria es una de las primeras cosas útiles que se aprenden en cualquier idioma nuevo — permite hablar de la vida cotidiana sin depender de vocabulario avanzado.',
                      ],
                    },
                  ],
                },
                {
                  id: 'section-3-1-b',
                  label: 'Diálogo',
                  blocks: [
                    {
                      id: 'block-3-1-b-1',
                      type: 'dialogue',
                      turns: [
                        { speaker: 'Marta', text: '¿A qué hora te despiertas?' },
                        { speaker: 'Pedro', text: 'Me despierto a las siete, y tú?' },
                        { speaker: 'Marta', text: 'Un poco más tarde, a las ocho.' },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
});
