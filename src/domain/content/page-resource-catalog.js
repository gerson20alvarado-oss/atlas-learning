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
 * TRANSCRIPCIONES (esta sesión): contenido real, aportado por el
 * usuario desde 듣기 대본 (Listening Scripts).docx — extraído
 * programáticamente, no retipeado a mano, para no introducir errores
 * de transcripción. `transcriptLines` es un arreglo de
 * `{ speaker, text }`; `speaker: null` marca un pasaje narrado sin
 * turnos de diálogo. Las páginas todavía sin `transcriptLines`
 * siguen mostrando el estado honesto de siempre.
 *
 * DEPENDENCIA SIN RESOLVER (registrada, no fabricada): las páginas
 * del apéndice de respuestas oficiales (196–197, Capítulo 1) todavía
 * no fueron producidas. `sourcePageRef` ya apunta a donde deberían
 * vivir — el contenido real llega en una etapa posterior, no en
 * esta.
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
    sourcePageRef: 208, // contenido real, fuente: 듣기 대본 (Listening Scripts).docx, aportado por el usuario
    transcriptLines: [
      { speaker: "파비우", text: "챈 씨, 뭘 그렇게 열심히 보고 있어요?" },
      { speaker: "첸", text: "아, 챈 씨! 빈 씨가 올린 홍대 앞 소개 영상을 보고 있었어요. 정말 재미있었어요. 챈 씨도 홍대 앞에 자주 가는 편이에요?" },
      { speaker: "파비우", text: "쇼핑하러 몇 번 가 본 적이 있지만 저는 주로 집이랑 학교만 왔다갔다해서 좋은 곳은 많이 못 가 봤어요. 클럽도 아직 못 가 봐서 다음 주에 친구하고 가 볼 예정이에요." },
      { speaker: "첸", text: "그래요? 그럼 이번 주말에 저랑 같이 구경하러 갈래요?" },
      { speaker: "파비우", text: "좋아요! 빈 씨의 영상에서 어디를 추천했어요?" },
      { speaker: "첸", text: "홍대 앞에서 쇼핑하고, 경의선 숲길을 걸으면서 연남동을 구경하는 코스를 추천한대요. 멋진 길거리 공연도 즐길 수 있고 예쁜 가게들도 많대요." },
      { speaker: "파비우", text: "연남동은 저도 안 가 봤어요. 이번 기회에 좋은 곳을 많이 가 봐야겠네요." },
      { speaker: "첸", text: "좋아요. 저도 정말 기대되는데요!" },
    ],
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
    sourcePageRef: 208, // contenido real, fuente: 듣기 대본 (Listening Scripts).docx, aportado por el usuario
    transcriptLines: [
      { speaker: "파티마", text: "파비우 씨, 한국 생활은 어때요? 좀 적응됐어요?" },
      { speaker: "파비우", text: "글쎄요. 아직 정신이 없네요." },
      { speaker: "파티마", text: "파비우 씨는 한국이 처음이지요?" },
      { speaker: "파비우", text: "아니에요. 어렸을 때 가족들이랑 서울로 여행을 온 적이 있어요. 그때 경복궁이랑 남산타워에 가 봤어요." },
      { speaker: "파티마", text: "오랜만에 서울에 오니까 좋지요?" },
      { speaker: "파비우", text: "네, 교통도 편리하고 안전해서 좋아요. 얼마 전에 첸 씨랑 같이 홍대 앞을 구경했는데요, 밤이 되어도 사람들이 굉장히 많았어요." },
      { speaker: "파티마", text: "맞아요, 서울은 불이 꺼지지 않는 도시지요. 그래서 야경도 멋지고요. 파비우 씨는 잠실에 새로 생긴 전망대는 안 가 봤겠네요. 저도 아직 못 가 봤는데 남산에서 보는 야경도 멋지지만 잠실에서 보는 야경도 아주 멋지대요." },
      { speaker: "파비우", text: "그래요? 거기도 꼭 가 봐야겠네요. 파티마 씨는 서울이 마음에 들어요?" },
      { speaker: "파티마", text: "네, 제가 서울을 얼마나 좋아하는데요. 서울은 조선 시대부터 오랜 세월 동안 정치, 경제, 문화와 역사의 중심지였대요. 이렇게 과거와 현재를 함께 느낄 수 있다는 것이 제가 서울을 좋아하는 이유예요. 빌딩 사이로 보이는 고궁이나 한옥들이 얼마나 멋지다고요." },
      { speaker: "파비우", text: "우와, 파티마 씨는 서울에 대해서 많이 아네요!" },
      { speaker: "파티마", text: "하하, 아니에요. 제가 전통문화랑 역사에 관심이 조금 많거든요. 분명히 파비우 씨도 앞으로 점점 서울을 좋아하게 될 거예요." },
      { speaker: "파비우", text: "네 파티마 씨 이야기만 들어도 벌써 서울이 좋아진 것 같은데요!" },
    ],
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
    sourcePageRef: 208, // contenido real, fuente: 듣기 대본 (Listening Scripts).docx, aportado por el usuario
    transcriptLines: [
      { speaker: null, text: "토픽 시험을 보려고 하는데 어떻게 해야 할지 몰라서 걱정입니까? 너무 걱정하지 마세요. 토픽 시험은 토픽 홈페이지에 접수 방법이 잘 설명되어 있으니 그것을 보고 접수하면 됩니다. 그런데 시험장을 선택하는 일은 쉽지 않습니다. 토픽 시험장은 여러 곳에 있지만 대학 입학을 위해 시험을 보는 외국인 유학생들이 많아서 원하는 곳을 신청하기 어렵기 때문입니다. 따라서 시험을 보기로 결심했다면 일정을 확인하고 빨리 시험을 접수하는 것이 좋습니다. 토픽 시험을 준비하는 우리 학생들, 모두 힘내세요." },
    ],
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
    sourcePageRef: 208, // contenido real, fuente: 듣기 대본 (Listening Scripts).docx, aportado por el usuario
    transcriptLines: [
      { speaker: "첸", text: "카린 씨, 또 네일 아트 영상을 보는 거예요?" },
      { speaker: "카린", text: "네, 요즘 관심이 생겨서 자꾸 보게 돼요. 예쁜 모양을 만드는 게 재미있어요." },
      { speaker: "첸", text: "관심 분야가 생기면 그렇게 되지요. 저는 요즘 요리하는 사람이 멋있어 보여서 빵 만드는 영상만 봐요." },
      { speaker: "카린", text: "우리 모두 한국 생활에 잘 적응했나 봐요. 예전에는 한국어나 한국 생활에 대한 것만 봤는데요." },
      { speaker: "첸", text: "그러게요. 그러고 보면 유학을 오고 나서 할 수 있는 게 많아졌어요. 고향에 있을 때보다 직접 해야 하는 게 많아서 그런 것 같아요." },
      { speaker: "카린", text: "저도 그런 것 같아요. 한국에서 혼자 살면서 이것저것 해서 반쯤 전문가가 된 것도 같고요." },
      { speaker: "첸", text: "하하, 정말 그렇네요. 그래도 조금은 아쉬워요. 이렇게 관심이 생겼는데 지금은 한국어 공부부터 해야 하니까요." },
      { speaker: "카린", text: "맞아요, 저도 조금 아쉽다고 생각했어요. 만약 고향에 있었다면 제대로 배우러 다니거나 자격증 공부를 시작했을 것 같거든요." },
      { speaker: "첸", text: "한국에서도 해 볼 수 있지 않을까요?" },
      { speaker: "카린", text: "그런데 외국인이 딸 수 있는 자격증이 있겠어요?" },
      { speaker: "첸", text: "운전면허는 딸 수 있으니까 또 모르지요, 한번 찾아봅시다." },
      { speaker: null, text: "(각자 휴대폰을 보며)" },
      { speaker: "첸", text: "기능사 시험은 누구나 볼 수 있다고 하는 걸 보니까 기능사 자격증은 외국인도 딸 수 있나 봐요." },
      { speaker: "카린", text: "어디 좀 봐요. 어머, 정말이네요? 전 우리가 볼 수 있는 시험은 토픽 시험밖에 없다고 생각했는데 생각보다 많네요." },
      { speaker: "첸", text: "토픽 시험을 공부하는 대신에 자격증 시험을 공부하는 것도 좋을 것 같아요. 한국어도 공부하고 관심 분야의 자격증도 딸 수 있으니까요." },
      { speaker: "카린", text: "맞아요. 실기 시험은 어떻게 보는지 알아야 합격할 수 있으니까 학원 같은 데에서 배우면 한국 사람도 만날 수 있고요." },
      { speaker: "첸", text: "한국어 실력도 예전보다 좋아졌으니까 우리도 자격증 시험을 한번 준비해 볼까요?" },
    ],
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

  // ==================== CAPÍTULO 3 (base 74) ====================
  // Mismo patrón, verificado con evidencia real en páginas clave
  // (76, 81, 100) antes de escribir estas entradas. p.83/84
  // confirmadas además, de forma independiente, por el propio
  // documento de transcripciones del usuario (misma numeración).

  // p.81 — 대화 (Lección 3-1)
  {
    bookId: HI_KOREAN_3A,
    pageNumber: 81,
    type: 'audio',
    pageTemplate: '대화',
    trackLabel: 'Track 11',
    assetPath: 'book-hi-korean-3a/Hi Korean 3A_SB_11.mp3',
  },

  // p.83 — 듣고 말하기 1 (Lección 3-1)
  {
    bookId: HI_KOREAN_3A,
    pageNumber: 83,
    type: 'audio',
    pageTemplate: '듣고 말하기 1',
    trackLabel: 'Track 12',
    assetPath: 'book-hi-korean-3a/Hi Korean 3A_SB_12.mp3',
  },
  {
    bookId: HI_KOREAN_3A,
    pageNumber: 83,
    type: 'transcript',
    pageTemplate: '듣고 말하기 1',
    sourcePageRef: 208, // contenido real, fuente: 듣기 대본 (Listening Scripts).docx, aportado por el usuario
    transcriptLines: [
      { speaker: "직원", text: "네, 홍익 여행사입니다." },
      { speaker: "민아", text: "안녕하세요? 유럽 여행 포스터를 보고 연락 드렸는데요." },
      { speaker: "직원", text: "패키지여행을 말씀하시는 건가요?" },
      { speaker: "민아", text: "아니요, 제가 본 '대학생을 위한 유럽 배낭여행' 포스터에는 여행사에서 숙소와 비행기표, 기차표 예약만 대신해 준다고 써 있었는데 아닌가요?" },
      { speaker: "직원", text: "아, 맞습니다. 여행 일정과 인원을 저희에게 알려 주시면 예약 가능한 숙소 목록뿐만 아니라 비행기표와 기차표 목록도 메일로 보내 드립니다. 메일을 받으시면 목록에서 원하는 것을 골라 주시면 됩니다." },
      { speaker: "민아", text: "네, 알겠습니다. 그런데 저는 친구와 함께 가려고 하는데, 혹시 할인은 안 되나요?" },
      { speaker: "직원", text: "2명 이상 예약하시면 10%(퍼센트) 할인을 해 드리고 있습니다. 포스터 아래에 할인 쿠폰이 있었을 텐데 못 보셨습니까?" },
      { speaker: "민아", text: "아, 그래요? 한번 확인해 보고 다시 연락 드릴게요." },
      { speaker: "직원", text: "네, 감사합니다." },
    ],
  },

  // p.84 — 듣고 말하기 2 (Lección 3-1)
  {
    bookId: HI_KOREAN_3A,
    pageNumber: 84,
    type: 'audio',
    pageTemplate: '듣고 말하기 2',
    trackLabel: 'Track 13',
    assetPath: 'book-hi-korean-3a/Hi Korean 3A_SB_13.mp3',
  },
  {
    bookId: HI_KOREAN_3A,
    pageNumber: 84,
    type: 'transcript',
    pageTemplate: '듣고 말하기 2',
    sourcePageRef: 208,
    transcriptLines: [
      { speaker: "마크", text: "엠마, 너는 여행을 자주 해 봤지? 어디가 가장 좋았어?" },
      { speaker: "엠마", text: "나는 유학을 오기 전에 한국에 와 봤는데, 그때 한 서울 여행이 가장 인상적이었어." },
      { speaker: "마크", text: "왜 서울 여행이 가장 기억에 남아?" },
      { speaker: "엠마", text: "여행을 하면서 한국에 유학을 오기로 결심했거든. 종로에 있는 한옥 게스트 하우스에서 묵었는데 전통문화와 현대 문화를 함께 느낄 수 있어 신기했을 뿐만 아니라 함께 지낸 사람들이 친절해서 좋았어. 그래서 한국에서 살아 보려고 유학을 왔어." },
      { speaker: "마크", text: "그럼 혹시 나쁜 기억으로 남아 있는 여행은 없어?" },
      { speaker: "엠마", text: "고등학생 때 친한 친구와 한 미국 국내 여행이 가장 별로였어." },
      { speaker: "마크", text: "국내 여행이면 별로 힘들지 않았을 텐데 왜 별로였어?" },
      { speaker: "엠마", text: "여행을 가기 전에는 몰랐는데 친구가 사진 찍는 걸 너무 좋아하더라고. 음식을 먹을 때뿐만 아니라 관광지에서도 인증샷을 너무 많이 찍어서 한참 기다려야 했어. 나는 인증샷 찍는 걸 별로 안 좋아하거든." },
      { speaker: "마크", text: "여행은 취향이 비슷한 사람과 함께 가야 하는 것 같아." },
      { speaker: "엠마", text: "맞아. 나는 관광하는 걸 좋아하는데 쉬는 걸 좋아하는 친구와 여행을 가면 어쩔 수 없이 혼자 구경해야 할 때도 있어서 심심하더라고." },
      { speaker: "마크", text: "나도 여행을 가면 쉬는 것보다 구경하는 걸 좋아해. 일할 때 사진을 많이 찍으니까 평소에는 사진도 잘 안 찍고." },
      { speaker: "엠마", text: "그래? 그럼 다음 방학에 같이 경주로 여행을 가지 않을래?" },
      { speaker: "마크", text: "좋아. 근데 경주는 어떤 곳인데?" },
      { speaker: "엠마", text: "천 년 동안 '신라'의 수도였대. 그래서 여기저기에 유적지가 많대." },
      { speaker: "마크", text: "진짜? 그럼 나는 오늘 집에 가는 길에 서점에 들러서 경주의 역사에 대한 책을 찾아봐야겠어." },
      { speaker: "엠마", text: "그럼 내가 왕복 기차표와 숙소를 알아볼게. 서로 알아보고 같이 일정을 짜면 되겠다." },
    ],
  },

  // p.91 — 대화 (Lección 3-2)
  {
    bookId: HI_KOREAN_3A,
    pageNumber: 91,
    type: 'audio',
    pageTemplate: '대화',
    trackLabel: 'Track 14',
    assetPath: 'book-hi-korean-3a/Hi Korean 3A_SB_14.mp3',
  },

  // p.100 — 실전 말하기 (Lección 3-3, "한 단계 오르기")
  {
    bookId: HI_KOREAN_3A,
    pageNumber: 100,
    type: 'audio',
    pageTemplate: '실전 말하기',
    trackLabel: 'Track 15',
    assetPath: 'book-hi-korean-3a/Hi Korean 3A_SB_15.mp3',
  },

  // ==================== CAPÍTULO 4 (base 104) ====================
  // Mismo patrón, verificado con evidencia real en páginas clave
  // (106, 111, 130). p.113/114 confirmadas también por el documento
  // de transcripciones del usuario.

  // p.111 — 대화 (Lección 4-1)
  {
    bookId: HI_KOREAN_3A,
    pageNumber: 111,
    type: 'audio',
    pageTemplate: '대화',
    trackLabel: 'Track 16',
    assetPath: 'book-hi-korean-3a/Hi Korean 3A_SB_16.mp3',
  },

  // p.113 — 듣고 말하기 1 (Lección 4-1)
  {
    bookId: HI_KOREAN_3A,
    pageNumber: 113,
    type: 'audio',
    pageTemplate: '듣고 말하기 1',
    trackLabel: 'Track 17',
    assetPath: 'book-hi-korean-3a/Hi Korean 3A_SB_17.mp3',
  },
  {
    bookId: HI_KOREAN_3A,
    pageNumber: 113,
    type: 'transcript',
    pageTemplate: '듣고 말하기 1',
    sourcePageRef: 208, // reparto exacto entre 208-212 aún sin confirmar
    transcriptLines: [
      { speaker: "파티마", text: "첸 씨, 어제 잠을 못 잤나 봐요. 피곤해 보이네요." },
      { speaker: "첸", text: "어제 밤늦게까지 청소를 했거든." },
      { speaker: "파티마", text: "갑자기 청소는 왜요? 손님이 오세요?" },
      { speaker: "첸", text: "아니요, 손님은 벌써 왔다 갔어요. 어제 서준 씨 친구들이 우리 집에 모여서 파티를 했어요." },
      { speaker: "파티마", text: "그럼 서준 씨가 청소를 해야 하는 거 아니에요? 왜 첸 씨가 밤늦게까지 혼자서 했어요?" },
      { speaker: "첸", text: "서준 씨가 청소를 했는데 깨끗하게 하지 않아서 제가 다시 했어요. 서준 씨는 다 좋은데 좀 게으른 편이어서 평소에도 청소나 빨래를 잘 안 해요." },
      { speaker: "파티마", text: "그럼 같이 살기 불편하지 않아요? 서준 씨한테 이야기를 하지 그래요?" },
      { speaker: "첸", text: "저도 말을 하고 싶은데 서준 씨가 잘 삐지는 성격이라 표현하기가 조심스러워요. 제가 깨끗한 걸 좋아하니까 그냥 제가 하면 돼요." },
      { speaker: "파티마", text: "그래도 계속 같이 살려면 불편한 점은 서로 이야기하는 게 좋아요. 부탁하는 것처럼 말하면 서준 씨도 기분 나빠하지 않을 거예요." },
    ],
  },

  // p.114 — 듣고 말하기 2 (Lección 4-1) — pasaje narrado, sin turnos
  // de diálogo (mismo caso que p.53), no un error de mapeo.
  {
    bookId: HI_KOREAN_3A,
    pageNumber: 114,
    type: 'audio',
    pageTemplate: '듣고 말하기 2',
    trackLabel: 'Track 18',
    assetPath: 'book-hi-korean-3a/Hi Korean 3A_SB_18.mp3',
  },
  {
    bookId: HI_KOREAN_3A,
    pageNumber: 114,
    type: 'transcript',
    pageTemplate: '듣고 말하기 2',
    sourcePageRef: 208, // reparto exacto entre 208-212 aún sin confirmar
    transcriptLines: [
      { speaker: null, text: "여러분은 사람을 처음 만나면 그 사람에 대해 알기 위해 어떤 질문을 합니까? 보통 이름이나 국적, 하는 일 등을 물어보지만 그런 질문으로는 실제 그 사람이 어떤 성향의 사람인지 알 수 없을 것입니다. \"혈액형이 뭐예요?\", \"무슨 별자리예요?\", \"MBTI가 어떻게 되세요?\" 혹시 여러분은 이런 질문을 받아 보셨습니까? 예전에는 혈액형이나 별자리에 따라 사람의 성격이 다르다고 생각해서 물어보는 경우가 많았다면 요즘은 혈액형이나 별자리 대신에 MBTI를 많이 물어본다고 합니다. MBTI는 쉽게 말하면 사람의 성격을 알아보는 검사인데 사람의 성격을 16가지로 나눈 것을 말합니다. 그리고 이 결과는 어떤 사람의 평소 행동이나 특성을 이해하는 데 도움을 줄 수 있다고 합니다. 그래서 '나'를 더 잘 알고 싶어 하는 요즘 사람들이 이런 검사에 관심이 많은 것 같습니다. 하지만 정말 혈액형이나 별자리에 따라 성격이 다를 수 있을까요? 또 세상의 모든 사람들을 16가지로 나눌 수 있을까요? 물론 혈액형이나 별자리, MBTI로 외향적인지 내성적인지, 또는 이성적인지 감성적인지 정도는 알 수 있을 것입니다. 하지만 그런 몇 가지 질문만으로 사람을 미리 평가하는 것은 어리석은 일이라고 생각합니다. 어떤 사람을 알기 위해서는 그 사람에게 관심을 가지고 많은 시간 동안 그 사람의 주변 사람들, 일상생활에 대해 질문하면서 그 사람다운 것을 찾아내야 합니다. 왜냐하면 혈액형이나 별자리, MBTI 같은 검사 결과가 아니라 나다운 행동이, 그리고 그것이 너답다는 사람들의 평가가 내가 어떤 사람인지 말해 주고 설명해 줄 수 있기 때문입니다." },
    ],
  },

  // p.121 — 대화 (Lección 4-2)
  {
    bookId: HI_KOREAN_3A,
    pageNumber: 121,
    type: 'audio',
    pageTemplate: '대화',
    trackLabel: 'Track 19',
    assetPath: 'book-hi-korean-3a/Hi Korean 3A_SB_19.mp3',
  },

  // p.130 — 실전 말하기 (Lección 4-3, "한 단계 오르기")
  {
    bookId: HI_KOREAN_3A,
    pageNumber: 130,
    type: 'audio',
    pageTemplate: '실전 말하기',
    trackLabel: 'Track 20',
    assetPath: 'book-hi-korean-3a/Hi Korean 3A_SB_20.mp3',
  },
]);

export function getPageResources(bookId, pageNumber) {
  return PAGE_RESOURCE_CATALOG.filter((r) => r.bookId === bookId && r.pageNumber === pageNumber);
}
