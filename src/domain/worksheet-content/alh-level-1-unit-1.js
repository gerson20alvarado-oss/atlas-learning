/**
 * domain/worksheet-content/alh-level-1-unit-1.js
 *
 * Unidad 1 — "My city" (American Language Hub Level 1, Video Hub
 * Worksheets). Contenido real, transcrito del PDF proporcionado por
 * el usuario — texto de enunciados y opciones verbatim, respuestas
 * oficiales confirmadas explícitamente por el usuario en esta sesión
 * (no inventadas, no derivadas por inferencia).
 *
 * Progress Test Unit 1 (esta sesión): sección añadida al final,
 * transcrita de Progress_Test_Unit_1.pdf (American Language Hub
 * Level 1 Tests, Macmillan Education, 2020), mismo criterio de
 * fidelidad. Introduce tres tipos de ejercicio nuevos —
 * `matching`, `choice`, `shortAnswer` — registrados en
 * worksheet-exercise-renderer.js y en GRADABLE_EXERCISE_TYPES (ver
 * domain/contracts/worksheet-exercise-lifecycle.js).
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

  // Control de Intentos por Unidad (esta sesión): cuántas pasadas
  // completas admite esta unidad — decisión de contenido, nunca de
  // base de datos (Arquitectura de Intentos por Unidad, §2). `null`
  // significaría ilimitado; un libro futuro con reglas distintas
  // solo necesita declarar su propio valor aquí, nunca una migración.
  maxAttempts: 2,

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
          // ImageSource (esta sesión): la foto impresa junto a este
          // ejercicio en el worksheet — bucket público `book-image`,
          // misma convención de ruta que `video.assetPath` (carpeta
          // = bookId). El archivo todavía no está subido a Storage;
          // mientras tanto, discussion-prompt.js muestra el mismo
          // aviso honesto que ya usa VideoPanel.
          image: {
            assetPath: 'book-american-language-hub-1/ALH_Level1_VideoHub_U1_comprehension.jpg',
            alt: 'A view of Reykjavík, Iceland, with colorful rooftops in the foreground and mountains in the background.',
          },
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
    {
      // Progress Test Unit 1 (esta sesión): transcrito de
      // Progress_Test_Unit_1.pdf (American Language Hub Level 1
      // Tests, Macmillan Education, 2020) — texto de enunciados y
      // opciones verbatim, respuestas oficiales confirmadas
      // explícitamente por el usuario en esta sesión, no inventadas
      // ni derivadas por inferencia. Se agrega como una sección más
      // de esta misma worksheet (no como una unidad/ruta aparte):
      // "Submit worksheet" sigue enviando la unidad completa de una
      // sola vez, incluida esta sección, sin ningún cambio al
      // Control de Intentos por Unidad ni a ningún otro mecanismo ya
      // existente.
      id: 'progress-test',
      title: 'PROGRESS TEST',
      exercises: [
        {
          id: 'pt-gram-a',
          type: 'matching',
          instruction:
            'GRAMMAR — A. Match the sentence halves to form full sentences.',
          items: [
            { id: 'pt-gram-a-1', statement: 'I think your seat', correctOptionId: 'f' },
            { id: 'pt-gram-a-2', statement: 'We live in China. We', correctOptionId: 'e' },
            { id: 'pt-gram-a-3', statement: 'She speaks Italian but she', correctOptionId: 'b' },
            { id: 'pt-gram-a-4', statement: 'Oh no! You', correctOptionId: 'c' },
            { id: 'pt-gram-a-5', statement: 'Right now, my parents', correctOptionId: 'd' },
          ],
          // La opción "a" (am from New Zealand) queda deliberadamente
          // sin usar — era el ejemplo (0), ya resuelto en el propio
          // enunciado del worksheet.
          options: [
            { id: 'a', text: 'am from New Zealand.' },
            { id: 'b', text: "isn't from Italy." },
            { id: 'c', text: "aren't in my class this year." },
            { id: 'd', text: 'are on vacation in Spain.' },
            { id: 'e', text: 'are Chinese.' },
            { id: 'f', text: 'is next to mine.' },
          ],
        },
        {
          id: 'pt-gram-b',
          type: 'shortAnswer',
          instruction:
            'GRAMMAR — B. Put the words into the correct order to form questions.',
          items: [
            {
              id: 'pt-gram-b-1',
              prompt: 'hot / Japan / is / it / right now / in / ?',
              acceptableAnswers: ['Is it hot in Japan right now?'],
            },
            {
              id: 'pt-gram-b-2',
              prompt: 'you / flight / same / as me / are / on the / ?',
              acceptableAnswers: ['Are you on the same flight as me?'],
            },
            {
              id: 'pt-gram-b-3',
              prompt: 'Canada / his / in / when / family / is / ?',
              acceptableAnswers: ['When is his family in Canada?'],
            },
            {
              id: 'pt-gram-b-4',
              prompt: 'from / airport / here / is / the / far / ?',
              acceptableAnswers: ['Is the airport far from here?'],
            },
            {
              id: 'pt-gram-b-5',
              prompt: 'food / kind of / they / what / do / like / ?',
              acceptableAnswers: ['What kind of food do they like?'],
            },
          ],
        },
        {
          id: 'pt-gram-c',
          type: 'choice',
          instruction:
            'GRAMMAR — C. Choose the correct word in italics in each sentence.',
          items: [
            {
              id: 'pt-gram-c-1',
              before: '',
              options: ['This', 'These'],
              after: ' is a picture of my family.',
              correct: 'This',
            },
            {
              id: 'pt-gram-c-2',
              before: 'There are some ',
              options: ['orange', 'oranges'],
              after: ' on the table.',
              correct: 'oranges',
            },
            {
              id: 'pt-gram-c-3',
              before: 'My teacher can send me ',
              options: ['a', 'an'],
              after: ' email tonight.',
              correct: 'an',
            },
            {
              id: 'pt-gram-c-4',
              before: '',
              options: ['Those', 'That'],
              after: " are the keys to John's car.",
              correct: 'Those',
            },
            {
              id: 'pt-gram-c-5',
              before: 'Many ',
              options: ['countries', 'country'],
              after: ' in the world speak English.',
              correct: 'countries',
            },
          ],
        },
        {
          id: 'pt-gram-d',
          type: 'shortAnswer',
          instruction:
            'GRAMMAR — D. For each sentence, find the error and correct it.',
          items: [
            {
              id: 'pt-gram-d-1',
              prompt: 'These is my laptop on the table.',
              acceptableAnswers: ['This is my laptop on the table.'],
            },
            {
              id: 'pt-gram-d-2',
              prompt: 'How old am your brother?',
              acceptableAnswers: ['How old is your brother?'],
            },
            {
              id: 'pt-gram-d-3',
              prompt: 'The capital city of Bulgaria are Sofia.',
              acceptableAnswers: ['The capital city of Bulgaria is Sofia.'],
            },
            {
              id: 'pt-gram-d-4',
              prompt: 'There is many children in the classroom.',
              acceptableAnswers: ['There are many children in the classroom.'],
            },
            {
              id: 'pt-gram-d-5',
              prompt: 'She has a apple for a snack.',
              acceptableAnswers: ['She has an apple for a snack.'],
            },
            {
              id: 'pt-gram-d-6',
              prompt: 'That two books over there are in Russian.',
              acceptableAnswers: ['Those two books over there are in Russian.'],
            },
            {
              id: 'pt-gram-d-7',
              prompt: 'We am both students at this college.',
              acceptableAnswers: ['We are both students at this college.'],
            },
            {
              id: 'pt-gram-d-8',
              prompt: 'There are some sandwich you can take.',
              acceptableAnswers: ['There are some sandwiches you can take.'],
            },
            {
              id: 'pt-gram-d-9',
              prompt: 'I want an wallet for my birthday.',
              acceptableAnswers: ['I want a wallet for my birthday.'],
            },
            {
              id: 'pt-gram-d-10',
              prompt: 'Is they new headphones?',
              acceptableAnswers: ['Are they new headphones?'],
            },
          ],
        },
        {
          id: 'pt-vocab-a',
          type: 'shortAnswer',
          instruction:
            'VOCABULARY — A. Complete the sentences with the correct word.',
          items: [
            {
              id: 'pt-vocab-a-1',
              prompt: 'A person from Sudan is ___.',
              acceptableAnswers: ['Sudanese'],
            },
            {
              id: 'pt-vocab-a-2',
              prompt: 'A person from the Netherlands is ___.',
              acceptableAnswers: ['Dutch'],
            },
            {
              id: 'pt-vocab-a-3',
              prompt: 'A person from Switzerland is ___.',
              acceptableAnswers: ['Swiss'],
            },
            {
              id: 'pt-vocab-a-4',
              prompt: 'A person from Colombia is ___.',
              acceptableAnswers: ['Colombian'],
            },
            {
              id: 'pt-vocab-a-5',
              prompt: 'A person from Poland is ___.',
              acceptableAnswers: ['Polish'],
            },
          ],
        },
        {
          id: 'pt-vocab-b',
          type: 'matching',
          instruction:
            'VOCABULARY — B. Match the numbers with the words below. There is an extra number you do not need.',
          items: [
            { id: 'pt-vocab-b-1', statement: 'five million', correctOptionId: 'n5000000' },
            { id: 'pt-vocab-b-2', statement: 'one hundred and eighty-seven', correctOptionId: 'n187' },
            { id: 'pt-vocab-b-3', statement: 'ten thousand', correctOptionId: 'n10000' },
            { id: 'pt-vocab-b-4', statement: 'one thousand five hundred', correctOptionId: 'n1500' },
            { id: 'pt-vocab-b-5', statement: 'twenty-four thousand', correctOptionId: 'n24000' },
          ],
          // "150,000" es el número extra que sobra a propósito
          // (enunciado original: "There is an extra number you do
          // not need") — "620" no se incluye aquí porque era el
          // ejemplo (0), ya resuelto.
          options: [
            { id: 'n187', text: '187' },
            { id: 'n1500', text: '1,500' },
            { id: 'n24000', text: '24,000' },
            { id: 'n10000', text: '10,000' },
            { id: 'n150000', text: '150,000' },
            { id: 'n5000000', text: '5,000,000' },
          ],
        },
        {
          id: 'pt-vocab-c',
          type: 'matching',
          instruction:
            'VOCABULARY — C. Match the definitions on the left to the words on the right.',
          items: [
            { id: 'pt-vocab-c-1', statement: 'You pay for things with this.', correctOptionId: 'd' },
            { id: 'pt-vocab-c-2', statement: 'You use this to see the time.', correctOptionId: 'e' },
            { id: 'pt-vocab-c-3', statement: 'You drink this.', correctOptionId: 'f' },
            { id: 'pt-vocab-c-4', statement: 'You wear these.', correctOptionId: 'b' },
            { id: 'pt-vocab-c-5', statement: 'You listen to music with these.', correctOptionId: 'c' },
          ],
          // "a" (a magazine) queda sin usar — era el ejemplo (0).
          options: [
            { id: 'a', text: 'a magazine' },
            { id: 'b', text: 'sunglasses' },
            { id: 'c', text: 'headphones' },
            { id: 'd', text: 'a credit card' },
            { id: 'e', text: 'a watch' },
            { id: 'f', text: 'a bottle of water' },
          ],
        },
        {
          id: 'pt-vocab-d',
          type: 'matching',
          instruction:
            'VOCABULARY — D. Match the sentence halves to form full sentences.',
          items: [
            { id: 'pt-vocab-d-1', statement: 'My friend is from', correctOptionId: 'f' },
            { id: 'pt-vocab-d-2', statement: 'I need an', correctOptionId: 'k' },
            { id: 'pt-vocab-d-3', statement: 'London is', correctOptionId: 'g' },
            { id: 'pt-vocab-d-4', statement: 'Our family loves food', correctOptionId: 'd' },
            { id: 'pt-vocab-d-5', statement: 'A year has three', correctOptionId: 'c' },
            { id: 'pt-vocab-d-6', statement: 'Do they have', correctOptionId: 'h' },
            { id: 'pt-vocab-d-7', statement: 'I speak Spanish but', correctOptionId: 'b' },
            { id: 'pt-vocab-d-8', statement: 'There are', correctOptionId: 'i' },
            { id: 'pt-vocab-d-9', statement: 'Do you have any', correctOptionId: 'e' },
            { id: 'pt-vocab-d-10', statement: 'Is your laptop on', correctOptionId: 'j' },
          ],
          // "a" (in my bag.) queda sin usar — era el ejemplo (0).
          options: [
            { id: 'a', text: 'in my bag.' },
            { id: 'b', text: "I'm not Mexican." },
            { id: 'c', text: 'hundred and sixty-five days.' },
            { id: 'd', text: 'from Japan.' },
            { id: 'e', text: 'Turkish friends?' },
            { id: 'f', text: 'Thailand.' },
            { id: 'g', text: '3,459 miles from New York.' },
            { id: 'h', text: 'a cell phone?' },
            { id: 'i', text: 'two million people in this city.' },
            { id: 'j', text: 'the table?' },
            { id: 'k', text: "umbrella. It's raining." },
          ],
        },
      ],
    },
  ],
});
