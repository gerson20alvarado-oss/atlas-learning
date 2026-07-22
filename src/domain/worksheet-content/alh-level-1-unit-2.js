/**
 * domain/worksheet-content/alh-level-1-unit-2.js
 *
 * Unidad 2 — "People" (nombre oficial del libro; "The Odulai family"
 * era un nombre de trabajo usado antes de confirmarlo) (American
 * Language Hub Level 1, Video Hub Worksheets). Contenido real,
 * transcrito de
 * ALH_VideoHub_Level1_Worksheets-2.pdf y de Progress Test Unit 2 —
 * texto de enunciados y opciones verbatim, respuestas oficiales
 * confirmadas explícitamente por el usuario en esta sesión (no
 * inventadas, no derivadas por inferencia). Mismo criterio exacto
 * que alh-level-1-unit-1.js — ver ese archivo para el detalle
 * completo de cada decisión arquitectónica ya cerrada (Evaluaciones
 * Independientes, reviewPolicy, tipos de ejercicio).
 *
 * Writing: consigna proporcionada directamente por el usuario (no
 * proviene de ningún PDF — igual que la de la Unidad 1, que tampoco
 * viene del Worksheet impreso). Agregada en una sesión posterior a
 * la transcripción inicial del Worksheet/Progress Test.
 */

export const ALH_LEVEL_1_UNIT_2 = Object.freeze({
  bookId: 'book-american-language-hub-1',
  unitId: 'unit-alh1-02',
  unitNumber: 2,
  unitTitle: 'People',

  video: {
    label: 'Watch the video',
    assetPath: 'book-american-language-hub-1/ALH_Level1_VideoHub_U2_subtitles.mp4',
  },

  writing: {
    title: 'Writing',
    instructions:
      'You wake up one morning and realize that you have magically become the opposite gender for one day. Describe what happens from the moment you wake up until you go to bed. What surprises you the most? What funny situations do you experience?',
  },

  assessments: {
    worksheet: Object.freeze({
      assessmentId: 'worksheet',
      title: 'Worksheet',
      maxAttempts: 2,
      reviewPolicy: 'practice',
      sections: [
        {
          id: 'comprehension',
          title: 'COMPREHENSION',
          exercises: [
            {
              id: 'comp-a',
              type: 'discussion',
              instruction: 'Work in pairs. Look at the picture from the video and discuss the questions.',
              image: {
                assetPath: 'book-american-language-hub-1/ALH_Level1_VideoHub_U2_comprehension.jpg',
                alt: 'A large family standing together in front of a round hut with a thatched roof.',
              },
              prompts: [
                'How many families are there in the picture?',
                'Where do you think they live?',
              ],
            },
            {
              id: 'comp-b',
              type: 'ruleReveal',
              instruction: 'Watch the video. Check your answers to Exercise A.',
              revealLabel: 'Show answer',
              revealText:
                'There is one family in the picture. They live in Katine, a village in Uganda, Africa.',
            },
            {
              id: 'comp-c',
              type: 'ordering',
              instruction: 'Watch the video again. Put the activities in the order they happen in the video.',
              // Orden tal como aparece impreso en el worksheet (a-f).
              items: [
                { id: 'c1', text: 'The children have lunch.' },
                { id: 'c2', text: 'The men work in the fields.' },
                { id: 'c3', text: 'The women go to collect water.' },
                { id: 'c4', text: 'The children go to school.' },
                { id: 'c5', text: 'The women return home with water.' },
                { id: 'c6', text: 'Frances cycles to other villages.' },
              ],
              // Orden correcto confirmado por el usuario: 1=c(mujeres
              // recolectan agua), 2=b(hombres en el campo),
              // 3=d(niños a la escuela), 4=a(niños almuerzan),
              // 5=f(Frances anda en bici), 6=e(mujeres regresan con agua).
              correctOrder: ['c3', 'c2', 'c4', 'c1', 'c6', 'c5'],
            },
            {
              id: 'comp-d',
              type: 'trueFalse',
              instruction: 'Watch the video again. Are these sentences true (T) or false (F)? Correct the false sentences.',
              items: [
                {
                  id: 'd1',
                  statement: 'Frances has eight children.',
                  correct: false,
                  correction: 'Frances has eighteen children.',
                },
                { id: 'd2', statement: 'The family gets up at 6:30 am.', correct: true },
                {
                  id: 'd3',
                  statement: 'Frances is a doctor.',
                  correct: false,
                  correction: 'Frances is a farmer.',
                },
                { id: 'd4', statement: 'Sarah is eighteen years old.', correct: true },
                {
                  id: 'd5',
                  statement: 'Sarah wants to become a doctor.',
                  correct: false,
                  correction: 'Sarah wants to become a nurse.',
                },
                {
                  id: 'd6',
                  statement: 'The children wear a red uniform to school.',
                  correct: false,
                  correction: 'The children wear a green uniform to school.',
                },
                { id: 'd7', statement: "Frances' bike is his favorite possession.", correct: true },
                { id: 'd8', statement: 'It starts to rain at the end of the video.', correct: true },
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
              type: 'matching',
              instruction:
                'Read the sentences from the video and the information in the box. Speakers often give a simple fact, then add extra information in the sentence that follows. Match facts (1–3) to the extra information (a–c).',
              items: [
                { id: 'ae-a-1', statement: 'The Odulai family live in Katine,', correctOptionId: 'c' },
                { id: 'ae-a-2', statement: "Their life isn't easy,", correctOptionId: 'a' },
                { id: 'ae-a-3', statement: 'Frances is a farmer', correctOptionId: 'b' },
              ],
              options: [
                { id: 'a', text: "but they're very happy." },
                { id: 'b', text: 'who works hard to feed his family.' },
                { id: 'c', text: 'which is in Uganda, Africa.' },
              ],
            },
            {
              id: 'ae-b',
              type: 'discussion',
              instruction: 'Work in pairs. Take turns saying a fact, then adding extra information.',
              example: "A: I love football. My favorite team is Real Madrid. B: I'm from the US. I live in New York.",
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
              instruction: 'Work in groups. Talk about the advantages and disadvantages of growing up in a large family.',
              prompts: [
                'Would you like to have a lot of brothers and sisters? Why/Why not?',
              ],
              example: "I'm an only child, but I think it would be nice to have older sisters because ...",
            },
          ],
        },
      ],
    }),

    'progress-test': Object.freeze({
      assessmentId: 'progress-test',
      title: 'Progress Test',
      maxAttempts: 2,
      reviewPolicy: 'exam',
      sections: [
        {
          id: 'progress-test',
          title: 'PROGRESS TEST',
          exercises: [
            {
              id: 'pt-gram-a',
              type: 'shortAnswer',
              instruction: 'GRAMMAR — A. For each sentence, find the error and correct it.',
              items: [
                { id: 'pt-gram-a-1', prompt: 'Are you friends German?', acceptableAnswers: ['Are your friends German?'] },
                {
                  id: 'pt-gram-a-2',
                  prompt: "Jack's and Paul's dad is a teacher.",
                  acceptableAnswers: ["Jack and Paul's dad is a teacher."],
                },
                { id: 'pt-gram-a-3', prompt: "We live here. It's ours house.", acceptableAnswers: ["We live here. It's our house."] },
                {
                  id: 'pt-gram-a-4',
                  prompt: "My parent's names are Sam and Susan.",
                  acceptableAnswers: ["My parents' names are Sam and Susan."],
                },
                {
                  id: 'pt-gram-a-5',
                  prompt: "She cousin's dog is really friendly.",
                  acceptableAnswers: ["Her cousin's dog is really friendly."],
                },
              ],
            },
            {
              id: 'pt-gram-b',
              type: 'choice',
              instruction: 'GRAMMAR — B. Choose the correct word in italics in each sentence.',
              items: [
                { id: 'pt-gram-b-1', before: 'I ', options: ['has', 'have'], after: ' two older sisters.', correct: 'have' },
                { id: 'pt-gram-b-2', before: '', options: ['Does', 'Do'], after: ' you have a new bag?', correct: 'Do' },
                { id: 'pt-gram-b-3', before: 'Sarah ', options: ['has', 'have'], after: ' three children.', correct: 'has' },
                { id: 'pt-gram-b-4', before: '', options: ['Do', 'Does'], after: ' they have a big family?', correct: 'Do' },
                { id: 'pt-gram-b-5', before: 'We ', options: ["don't", "doesn't"], after: ' have blue eyes.', correct: "don't" },
              ],
            },
            {
              id: 'pt-gram-c',
              type: 'shortAnswer',
              instruction: 'GRAMMAR — C. Put the words into the correct order to form sentences.',
              items: [
                {
                  id: 'pt-gram-c-1',
                  prompt: 'brother / hair / have / blond / does / your / ?',
                  acceptableAnswers: ['Does your brother have blond hair?'],
                },
                {
                  id: 'pt-gram-c-2',
                  prompt: 'unfriendly / very / Mr. Evans / is / .',
                  acceptableAnswers: ['Mr. Evans is very unfriendly.'],
                },
                {
                  id: 'pt-gram-c-3',
                  prompt: 'sister / your / is / serious / very / ?',
                  acceptableAnswers: ['Is your sister very serious?'],
                },
                {
                  id: 'pt-gram-c-4',
                  prompt: 'funny / I / cat / a / really / have / .',
                  acceptableAnswers: ['I have a really funny cat.'],
                },
                {
                  id: 'pt-gram-c-5',
                  prompt: 'in / apartment / messy / is / their / it / .',
                  acceptableAnswers: ['It is messy in their apartment.'],
                },
              ],
            },
            {
              id: 'pt-gram-d',
              type: 'shortAnswer',
              instruction: 'GRAMMAR — D. Rewrite the sentences in the positive or negative.',
              items: [
                { id: 'pt-gram-d-1', prompt: 'His parents are very friendly.', acceptableAnswers: ["His parents aren't very friendly."] },
                {
                  id: 'pt-gram-d-2',
                  prompt: 'Your brother has his car outside.',
                  acceptableAnswers: ["Your brother doesn't have his car outside."],
                },
                {
                  id: 'pt-gram-d-3',
                  prompt: "Their cousin's house is by the ocean.",
                  acceptableAnswers: ["Their cousin's house isn't by the ocean."],
                },
                { id: 'pt-gram-d-4', prompt: "I don't have my wallet with me.", acceptableAnswers: ['I have my wallet with me.'] },
                { id: 'pt-gram-d-5', prompt: 'Dan and Rachel have children.', acceptableAnswers: ["Dan and Rachel don't have children."] },
                {
                  id: 'pt-gram-d-6',
                  prompt: "Our grandparents don't have gray hair.",
                  acceptableAnswers: ['Our grandparents have gray hair.'],
                },
                {
                  id: 'pt-gram-d-7',
                  prompt: "Your sister's boyfriend is happy.",
                  acceptableAnswers: ["Your sister's boyfriend isn't happy."],
                },
                {
                  id: 'pt-gram-d-8',
                  prompt: 'My English teachers are usually funny.',
                  acceptableAnswers: ["My English teachers aren't usually funny."],
                },
                { id: 'pt-gram-d-9', prompt: "My mom doesn't have cousins.", acceptableAnswers: ['My mom has cousins.'] },
                { id: 'pt-gram-d-10', prompt: 'My teacher has red glasses.', acceptableAnswers: ["My teacher doesn't have red glasses."] },
              ],
            },
            {
              id: 'pt-vocab-a',
              type: 'matching',
              instruction: 'VOCABULARY — A. Match the definitions on the left to the words on the right.',
              items: [
                { id: 'pt-vocab-a-1', statement: "This is my father's brother.", correctOptionId: 'f' },
                { id: 'pt-vocab-a-2', statement: "These are my aunt's children.", correctOptionId: 'e' },
                { id: 'pt-vocab-a-3', statement: "This is my mother's daughter.", correctOptionId: 'c' },
                { id: 'pt-vocab-a-4', statement: 'These are my mother and father.', correctOptionId: 'b' },
                { id: 'pt-vocab-a-5', statement: "This is my mother's husband.", correctOptionId: 'd' },
              ],
              // "a" (grandmother) queda sin usar — era el ejemplo (0).
              options: [
                { id: 'a', text: 'grandmother' },
                { id: 'b', text: 'parents' },
                { id: 'c', text: 'sister' },
                { id: 'd', text: 'father' },
                { id: 'e', text: 'cousins' },
                { id: 'f', text: 'uncle' },
              ],
            },
            {
              id: 'pt-vocab-b',
              type: 'choice',
              instruction: 'VOCABULARY — B. Choose the correct word in italics in each sentence.',
              items: [
                {
                  id: 'pt-vocab-b-1',
                  before: 'The woman in the picture has ',
                  options: ['beards', 'glasses'],
                  after: ' and a hat.',
                  correct: 'glasses',
                },
                {
                  id: 'pt-vocab-b-2',
                  before: 'That boy has beautiful ',
                  options: ['blue', 'curly'],
                  after: ' eyes like his sister.',
                  correct: 'blue',
                },
                {
                  id: 'pt-vocab-b-3',
                  before: 'My grandfather has gray hair and is very ',
                  options: ['thin', 'straight'],
                  after: '.',
                  correct: 'thin',
                },
                {
                  id: 'pt-vocab-b-4',
                  before: 'That student has a beard and long ',
                  options: ['skin', 'hair'],
                  after: '.',
                  correct: 'hair',
                },
                {
                  id: 'pt-vocab-b-5',
                  before: "My brother is very tall but I'm ",
                  options: ['brown', 'short'],
                  after: '.',
                  correct: 'short',
                },
              ],
            },
            {
              id: 'pt-vocab-c',
              type: 'matching',
              instruction:
                'VOCABULARY — C. Complete the sentences using the words in the box. There is an extra word you do not need.',
              items: [
                { id: 'pt-vocab-c-1', statement: 'Tim is so ___. He makes all his friends laugh.', correctOptionId: 'funny' },
                {
                  id: 'pt-vocab-c-2',
                  statement: "Our teacher is very ___. He doesn't like to smile.",
                  correctOptionId: 'serious',
                },
                {
                  id: 'pt-vocab-c-3',
                  statement: "I don't like going into my sister's room. It's very ___.",
                  correctOptionId: 'messy',
                },
                {
                  id: 'pt-vocab-c-4',
                  statement: "Sally loves talking to people. She's ___ to everyone she meets.",
                  correctOptionId: 'friendly',
                },
                {
                  id: 'pt-vocab-c-5',
                  statement: "I don't think my cousin is ever sad. He's a really ___ person.",
                  correctOptionId: 'happy',
                },
              ],
              // "quiet" queda deliberadamente sin usar — es el
              // distractor real (el enunciado usa "noisy" como
              // ejemplo (0), ya resuelto, y no se incluye aquí).
              options: [
                { id: 'friendly', text: 'friendly' },
                { id: 'funny', text: 'funny' },
                { id: 'happy', text: 'happy' },
                { id: 'messy', text: 'messy' },
                { id: 'quiet', text: 'quiet' },
                { id: 'serious', text: 'serious' },
              ],
            },
            {
              id: 'pt-vocab-d',
              type: 'shortAnswer',
              instruction: 'VOCABULARY — D. Complete the sentences with the correct word.',
              items: [
                { id: 'pt-vocab-d-1', prompt: "My ___ lives near us. He's my dad's brother.", acceptableAnswers: ['uncle'] },
                {
                  id: 'pt-vocab-d-2',
                  prompt: 'My brother\'s room is messy but my room is very ___.',
                  acceptableAnswers: ['neat'],
                },
                { id: 'pt-vocab-d-3', prompt: 'I want to have ___ one day, a boy and a girl.', acceptableAnswers: ['children'] },
                {
                  id: 'pt-vocab-d-4',
                  prompt: 'Our teacher has light ___, so she never goes in the sun.',
                  acceptableAnswers: ['skin'],
                },
                {
                  id: 'pt-vocab-d-5',
                  prompt: "I don't know why Peter is ___. He shouts all the time.",
                  acceptableAnswers: ['noisy'],
                },
                { id: 'pt-vocab-d-6', prompt: "I want to be ___ but I'm only 1.5 meters.", acceptableAnswers: ['tall'] },
                { id: 'pt-vocab-d-7', prompt: "Why aren't you talking? You're so ___ today.", acceptableAnswers: ['quiet'] },
                { id: 'pt-vocab-d-8', prompt: "My aunt's son and ___ look like her.", acceptableAnswers: ['daughter'] },
                { id: 'pt-vocab-d-9', prompt: 'His hair is ___. It looks yellow in the sun.', acceptableAnswers: ['blond'] },
                {
                  id: 'pt-vocab-d-10',
                  prompt: 'She is ___ because her dog is sick right now.',
                  acceptableAnswers: ['sad'],
                },
              ],
            },
          ],
        },
      ],
    }),
  },
});
