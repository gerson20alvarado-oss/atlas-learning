/**
 * domain/worksheet-content/alh-level-1-unit-1.js
 *
 * Unidad 1 — "My city" (American Language Hub Level 1, Video Hub
 * Worksheets). Contenido real, transcrito del PDF proporcionado por
 * el usuario — texto de enunciados y opciones verbatim, respuestas
 * oficiales confirmadas explícitamente por el usuario en esta sesión
 * (no inventadas, no derivadas por inferencia).
 *
 * Aislado por completo del Content Model de Hi! Korean — vive en su
 * propio módulo, con su propia forma de datos (`WorksheetExercise`),
 * nunca mezclado con `library-catalog.js`.
 *
 * Ejercicios sin respuesta única (discusión, producción oral) no
 * llevan campo de respuesta — solo el texto/indicación real, tal
 * como pidió el usuario ("cita el texto o la indicación").
 */

export const ALH_LEVEL_1_UNIT_1 = Object.freeze({
  bookId: 'book-american-language-hub-1',
  unitId: 'unit-alh1-01',
  unitNumber: 1,
  unitTitle: 'My city',

  // Video del Video Hub — recurso a nivel de unidad, no de un
  // ejercicio específico (varios ejercicios de Comprehension lo
  // referencian, ninguno lo "posee"). `assetPath` ya incluye el
  // bookId como carpeta, mismo criterio que PageSource/AudioSource
  // — resuelto por VideoSource, bucket privado `book-video`. El
  // archivo real todavía no está subido a Storage — VideoPanel ya
  // muestra el aviso honesto correspondiente mientras tanto.
  video: {
    label: 'Watch the video',
    assetPath: 'book-american-language-hub-1/ALH_Level1_VideoHub_U1_subtitles.mp4',
  },

  sections: [
    {
      id: 'comprehension',
      title: 'COMPREHENSION',
      exercises: [
        {
          id: 'comp-a',
          type: 'discussion',
          instruction: 'Work in pairs. Look at the picture from the video and discuss the questions.',
          prompts: [
            'What can you see in the picture?',
            'Where do you think it is? Why?',
          ],
        },
        {
          id: 'comp-b',
          type: 'ruleReveal',
          instruction: 'Watch the video. Check your answers to Exercise A.',
          revealLabel: 'Show answer',
          revealText: 'The city in the picture is Reykjavík in Iceland.',
        },
        {
          id: 'comp-c',
          type: 'ordering',
          instruction: "Watch the video again. Put the topics in the order they're discussed.",
          // Orden tal como aparece impreso en el worksheet — "introducción
          // a la ciudad" ya viene marcada con el 1 en el original.
          items: [
            { id: 'c1', text: 'the bandstand' },
            { id: 'c2', text: 'the Harpa building' },
            { id: 'c3', text: 'introduction to the city' },
            { id: 'c4', text: 'nature' },
            { id: 'c5', text: 'the jazz club' },
          ],
          // Orden correcto confirmado por el usuario: 1=introducción,
          // 2=the bandstand, 3=the jazz club, 4=nature, 5=Harpa building.
          correctOrder: ['c3', 'c1', 'c5', 'c4', 'c2'],
        },
        {
          id: 'comp-d',
          type: 'trueFalse',
          instruction: 'Watch the video again. Are these sentences true (T) or false (F)? Correct the false sentences.',
          items: [
            { id: 'd1', statement: 'The man in the video is a musician.', correct: true },
            { id: 'd2', statement: 'There is a lot of good music in Iceland', correct: true },
            {
              id: 'd3',
              statement: 'The bandstand building was built in 1962.',
              correct: false,
              correction: 'The bandstand building was built in 1922.',
            },
            { id: 'd4', statement: 'The music on the windows is about the river.', correct: true },
            { id: 'd5', statement: 'Reykjavík is close to the sea and the mountains.', correct: true },
            {
              id: 'd6',
              statement: 'The man plays music at the end of the video.',
              correct: false,
              correction: 'The man listens to music at the end of the video.',
            },
          ],
        },
      ],
    },
    {
      id: 'authentic-english',
      title: 'AUTHENTIC ENGLISH',
      exercises: [
        {
          id: 'ae-a',
          type: 'discussion',
          instruction: 'Work in pairs. Read the sentence from the video. Why do you think the speaker says um?',
          quote:
            "You walk two minutes and you're at the seaside, or you drive for fifteen minutes and you're by a big mountain. Um there is a real closeness to nature.",
        },
        {
          id: 'ae-b',
          type: 'ruleReveal',
          instruction: 'Read the information in the box and check your answers to Exercise A.',
          revealLabel: 'Show rule',
          revealTitle: 'uh and um',
          revealText: "We use uh or um when we don't know what to say or need time to think about what to say.",
        },
        {
          id: 'ae-c',
          type: 'discussion',
          instruction:
            'Work in groups. Ask and answer the questions, but do not tell the truth. Use uh and um to give yourself time to think.',
          prompts: [
            "What's your name?",
            'Where are you from?',
            "What's your favorite food?",
            "What's in your bag?",
            'How old are you?',
            "What's your favorite film?",
          ],
          example: "A: My name's, uh, Ricardo!\nB: Ha ha! No it's not. Your name's Ryo!",
        },
      ],
    },
    {
      id: 'speaking',
      title: 'SPEAKING',
      exercises: [
        {
          id: 'speaking-1',
          type: 'discussion',
          instruction: 'Work in pairs. Discuss the questions.',
          prompts: [
            "What do you like about Reykjavík? What don't you like about it? Why?",
            'Would you like to visit Reykjavík? Why/Why not?',
          ],
        },
      ],
    },
  ],
});
