/**
 * domain/content/page-resource-catalog.js
 *
 * PageResource reales de Chapter 01 — Lesson 1-1 (Technical
 * Specification v2.0, §1). Contenido estático — mismo estatus que
 * library-catalog.js/exercise-catalog.js — nunca estado de usuario.
 *
 * Cada entrada se construyó contra el Content Model real (los
 * `exerciseId`/`blockId` existen de verdad, verificados, no
 * inventados) y contra el mapeo editorial de Hi! Korean 3A ya
 * confirmado con evidencia de dos capítulos.
 *
 * Audio en Supabase Storage (esta sesión): `assetPath` de un recurso
 * `audio` es una ruta relativa dentro del bucket público
 * `book-audio` — `{bookId}/{archivo}.mp3` — mismo criterio de
 * convención ya usado por PageSource para `book-pages`. Se resuelve
 * en presentation/components/resource-panels/audio-panel.js, no
 * aquí — este archivo es contenido puro, nunca conoce Supabase.
 *
 * Resolución de una ambigüedad que la Technical Specification dejó
 * en singular ("el ejercicio real, si existe exerciseId"): una
 * página puede tener más de un ejercicio (p. ej. p.18, que junta dos
 * Sections del Content Model — Actividad 1 y 1b — en una sola página
 * física). `studyWorkspace.exerciseIds` es, por eso, siempre un
 * arreglo, nunca un valor único — el sheet, al abrirse, aloja todos
 * los ejercicios reales de esa página, no uno a la vez.
 *
 * `answerKey` se declara únicamente donde existe al menos un
 * ejercicio verificable en esa página — nunca en páginas cuyo
 * contenido es enteramente opinión personal (p.25, producción
 * abierta): ahí no hay ninguna respuesta oficial que revelar, ni en
 * el libro real. Las preguntas de comprensión auditiva (p.23/p.24)
 * SÍ reciben `answerKey` aunque Atlas no pueda verificarlas de forma
 * interactiva (Sprint 8, limitación de transcripción) — el libro
 * real sí tiene una respuesta impresa en su apéndice, independiente
 * de que el Exercise Engine pueda comprobarla.
 *
 * DEPENDENCIA SIN RESOLVER (registrada, no fabricada): las páginas
 * del apéndice (196–197, respuestas del Capítulo 1; 208–212,
 * transcripciones) todavía no fueron extraídas ni subidas a Storage.
 * `sourcePageRef` ya apunta a donde deberían vivir — el contenido
 * real llega en una etapa posterior, no en esta.
 */

const HI_KOREAN_3A = 'book-hi-korean-3a';

export const PAGE_RESOURCE_CATALOG = Object.freeze([
  // p.16 — 도입 (apertura): sin recursos, confirmado (0 audio, 0 practice).

  // p.17 — 문법 1
  {
    bookId: HI_KOREAN_3A,
    pageNumber: 17,
    type: 'studyWorkspace',
    pageTemplate: '문법',
    exerciseIds: ['ex-hikorean-1-1-gram1-01a', 'ex-hikorean-1-1-gram1-01b', 'ex-hikorean-1-1-gram1-01c'],
  },
  {
    bookId: HI_KOREAN_3A,
    pageNumber: 17,
    type: 'answerKey',
    pageTemplate: '문법',
    sourcePageRef: 196, // 정답, Capítulo 1 — pendiente de producir
  },

  // p.18 — 활동 (1) + 활동 (2), misma página física, dos Sections del
  // Content Model fusionadas en un único recurso de página.
  {
    bookId: HI_KOREAN_3A,
    pageNumber: 18,
    type: 'studyWorkspace',
    pageTemplate: '활동',
    exerciseIds: [
      'ex-hikorean-1-1-activity1-01a',
      'ex-hikorean-1-1-activity1-01b',
      'ex-hikorean-1-1-activity1-01c',
      'ex-hikorean-1-1-activity1-01d',
      'ex-hikorean-1-1-activity1-02a',
      'ex-hikorean-1-1-activity1-02b',
      'ex-hikorean-1-1-activity1-02c',
      'ex-hikorean-1-1-activity1-02d',
    ],
  },
  {
    bookId: HI_KOREAN_3A,
    pageNumber: 18,
    type: 'answerKey',
    pageTemplate: '활동',
    sourcePageRef: 196,
  },

  // p.19 — 문법 2
  {
    bookId: HI_KOREAN_3A,
    pageNumber: 19,
    type: 'studyWorkspace',
    pageTemplate: '문법',
    exerciseIds: ['ex-hikorean-1-1-gram2-01a', 'ex-hikorean-1-1-gram2-01b', 'ex-hikorean-1-1-gram2-01c'],
  },
  {
    bookId: HI_KOREAN_3A,
    pageNumber: 19,
    type: 'answerKey',
    pageTemplate: '문법',
    sourcePageRef: 197,
  },

  // p.20 — 활동 (1) + 활동 (2). Cobertura parcial de answerKey a
  // propósito: 01a/01b son verificables; 01c/01d/02 son opinión
  // personal, sin respuesta oficial que mostrar — el panel de
  // respuestas simplemente no tendrá nada para esas tres, igual que
  // el Exercise Engine ya no tiene Exercise para ellas.
  {
    bookId: HI_KOREAN_3A,
    pageNumber: 20,
    type: 'studyWorkspace',
    pageTemplate: '활동',
    exerciseIds: [
      'ex-hikorean-1-1-activity2-01a',
      'ex-hikorean-1-1-activity2-01b',
      'ex-hikorean-1-1-activity2-01c',
      'ex-hikorean-1-1-activity2-01d',
      'ex-hikorean-1-1-activity2-02',
    ],
  },
  {
    bookId: HI_KOREAN_3A,
    pageNumber: 20,
    type: 'answerKey',
    pageTemplate: '활동',
    sourcePageRef: 197,
  },

  // p.21 — 대화 (Track 01). Sin ejercicios en esta página — solo audio.
  {
    bookId: HI_KOREAN_3A,
    pageNumber: 21,
    type: 'audio',
    pageTemplate: '대화',
    trackLabel: 'Track 01',
    assetPath: 'book-hi-korean-3a/Hi Korean 3A_SB_01.mp3',
  },

  // p.22 — 어휘와 표현
  {
    bookId: HI_KOREAN_3A,
    pageNumber: 22,
    type: 'studyWorkspace',
    pageTemplate: '어휘',
    exerciseIds: [
      'ex-hikorean-1-1-vocab-01a',
      'ex-hikorean-1-1-vocab-01b',
      'ex-hikorean-1-1-vocab-01c',
      'ex-hikorean-1-1-vocab-01d',
      'ex-hikorean-1-1-vocab-01-matching',
    ],
  },
  {
    bookId: HI_KOREAN_3A,
    pageNumber: 22,
    type: 'answerKey',
    pageTemplate: '어휘',
    sourcePageRef: 197,
  },

  // p.23 — 듣고 말하기 1 (Track 02). Con transcripción y respuesta
  // oficial, aunque el Exercise Engine no pueda verificar la
  // respuesta del estudiante todavía (Sprint 8).
  {
    bookId: HI_KOREAN_3A,
    pageNumber: 23,
    type: 'audio',
    pageTemplate: '듣고 말하기 1',
    trackLabel: 'Track 02',
    assetPath: 'book-hi-korean-3a/Hi Korean 3A_SB_02.mp3',
  },
  {
    bookId: HI_KOREAN_3A,
    pageNumber: 23,
    type: 'transcript',
    pageTemplate: '듣고 말하기 1',
    sourcePageRef: 208, // 듣기 대본 — reparto exacto entre 208-212 aún sin confirmar, ver mapeo §5
  },
  {
    bookId: HI_KOREAN_3A,
    pageNumber: 23,
    type: 'studyWorkspace',
    pageTemplate: '듣고 말하기 1',
    exerciseIds: ['ex-hikorean-1-1-listen1-01'],
  },
  {
    bookId: HI_KOREAN_3A,
    pageNumber: 23,
    type: 'answerKey',
    pageTemplate: '듣고 말하기 1',
    sourcePageRef: 197,
  },

  // p.24 — 듣고 말하기 2 (Track 03)
  {
    bookId: HI_KOREAN_3A,
    pageNumber: 24,
    type: 'audio',
    pageTemplate: '듣고 말하기 2',
    trackLabel: 'Track 03',
    assetPath: 'book-hi-korean-3a/Hi Korean 3A_SB_03.mp3',
  },
  {
    bookId: HI_KOREAN_3A,
    pageNumber: 24,
    type: 'transcript',
    pageTemplate: '듣고 말하기 2',
    sourcePageRef: 208,
  },
  {
    bookId: HI_KOREAN_3A,
    pageNumber: 24,
    type: 'studyWorkspace',
    pageTemplate: '듣고 말하기 2',
    // listen2-02 es de opinión personal (sin respuesta única) — se
    // incluye igual en el sheet, como ya ocurre hoy en la Vista de
    // Lectura: el prompt siempre es visible, tenga o no corrección.
    exerciseIds: ['ex-hikorean-1-1-listen2-01', 'ex-hikorean-1-1-listen2-02'],
  },
  {
    bookId: HI_KOREAN_3A,
    pageNumber: 24,
    type: 'answerKey',
    pageTemplate: '듣고 말하기 2',
    sourcePageRef: 197,
  },

  // p.25 — 말하기 확장: producción abierta, sin respuesta oficial
  // posible — no se declara answerKey para esta página, a propósito.
  {
    bookId: HI_KOREAN_3A,
    pageNumber: 25,
    type: 'studyWorkspace',
    pageTemplate: '말하기 확장',
    exerciseIds: ['ex-hikorean-1-1-production-01'],
  },

  // p.31 — 대화 (Lección 1-2). Mismo criterio que p.21: 대화 incluye
  // el texto completo en la página, sin transcripción adicional
  // (mapeo confirmado, "reglas de audio"). Pista candidata SB_04 —
  // hipótesis de trabajo por posición secuencial + duración
  // plausible (1:18), no verificada palabra por palabra (mismo
  // límite ya documentado para el resto del Audio Mapping).
  {
    bookId: HI_KOREAN_3A,
    pageNumber: 31,
    type: 'audio',
    pageTemplate: '대화',
    trackLabel: 'Track 04',
    assetPath: 'book-hi-korean-3a/Hi Korean 3A_SB_04.mp3',
  },

  // p.40 — 실전 말하기 (Lección 1-3). Mismo criterio: sin
  // transcripción, el texto ya está completo en la página. Pista
  // candidata SB_05 — misma hipótesis de trabajo que la anterior.
  {
    bookId: HI_KOREAN_3A,
    pageNumber: 40,
    type: 'audio',
    pageTemplate: '실전 말하기',
    trackLabel: 'Track 05',
    assetPath: 'book-hi-korean-3a/Hi Korean 3A_SB_05.mp3',
  },

  // ==================== CAPÍTULO 2 (base 44) ====================
  // Mismo patrón exacto que el Capítulo 1, confirmado con evidencia
  // real en las páginas clave (44, 45, 46, 51, 53, 54, 56, 61, 66,
  // 70) antes de escribir estas entradas.

  // p.51 — 대화 (Lección 2-1)
  {
    bookId: HI_KOREAN_3A,
    pageNumber: 51,
    type: 'audio',
    pageTemplate: '대화',
    trackLabel: 'Track 06',
    assetPath: 'book-hi-korean-3a/Hi Korean 3A_SB_06.mp3',
  },

  // p.53 — 듣고 말하기 1 (Lección 2-1) — con transcripción, igual que
  // en el Capítulo 1: contenido real pendiente de producir el
  // apéndice (208-212).
  {
    bookId: HI_KOREAN_3A,
    pageNumber: 53,
    type: 'audio',
    pageTemplate: '듣고 말하기 1',
    trackLabel: 'Track 07',
    assetPath: 'book-hi-korean-3a/Hi Korean 3A_SB_07.mp3',
  },
  {
    bookId: HI_KOREAN_3A,
    pageNumber: 53,
    type: 'transcript',
    pageTemplate: '듣고 말하기 1',
    sourcePageRef: 208,
  },

  // p.54 — 듣고 말하기 2 (Lección 2-1)
  {
    bookId: HI_KOREAN_3A,
    pageNumber: 54,
    type: 'audio',
    pageTemplate: '듣고 말하기 2',
    trackLabel: 'Track 08',
    assetPath: 'book-hi-korean-3a/Hi Korean 3A_SB_08.mp3',
  },
  {
    bookId: HI_KOREAN_3A,
    pageNumber: 54,
    type: 'transcript',
    pageTemplate: '듣고 말하기 2',
    sourcePageRef: 208,
  },

  // p.61 — 대화 (Lección 2-2)
  {
    bookId: HI_KOREAN_3A,
    pageNumber: 61,
    type: 'audio',
    pageTemplate: '대화',
    trackLabel: 'Track 09',
    assetPath: 'book-hi-korean-3a/Hi Korean 3A_SB_09.mp3',
  },

  // p.70 — 실전 말하기 (Lección 2-3, "한 단계 오르기")
  {
    bookId: HI_KOREAN_3A,
    pageNumber: 70,
    type: 'audio',
    pageTemplate: '실전 말하기',
    trackLabel: 'Track 10',
    assetPath: 'book-hi-korean-3a/Hi Korean 3A_SB_10.mp3',
  },
]);

export function getPageResources(bookId, pageNumber) {
  return PAGE_RESOURCE_CATALOG.filter((r) => r.bookId === bookId && r.pageNumber === pageNumber);
}
