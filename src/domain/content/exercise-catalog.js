/**
 * domain/content/exercise-catalog.js
 *
 * Claves de corrección (Exercise, Software Architecture §6.2) para
 * los `exerciseId` declarados en library-catalog.js. Vive junto al
 * contenido publicado, no en Persistence — es "lo que el libro es"
 * (la respuesta correcta), nunca "lo que el estudiante hizo" (eso es
 * Attempt, domain/learning-data/attempt-repository.js).
 *
 * Sprint 5 Plan — tres categorías de `exerciseId` que SÍ aparecen en
 * library-catalog.js pero DELIBERADAMENTE no tienen entrada aquí:
 *
 *   1. Actividades abiertas (producción libre / opinión personal,
 *      sin respuesta única): ex-hikorean-1-1-activity2-01c,
 *      ex-hikorean-1-1-activity2-01d, ex-hikorean-1-1-activity2-02,
 *      ex-hikorean-1-1-listen2-02, ex-hikorean-1-1-production-01.
 *   2. Dependientes de audio real que Atlas todavía no tiene (Sprint
 *      4): ex-hikorean-1-1-listen1-01, ex-hikorean-1-1-listen2-01.
 *   3. Tipo de ejercicio aún no soportado (matching, PRD §24 Should
 *      Have v1.x): ex-hikorean-1-1-vocab-01-matching.
 *
 * exercise-repository.getExerciseById(id) devuelve `null` para los
 * ocho anteriores — content-block-renderer.js ya sabe mostrar el
 * aviso neutral para un `practice` sin Exercise resuelto (mismo
 * camino que "media"/"practice" sin datos reales desde Sprint 3).
 * Ninguno de los ocho participa en el cómputo de Progress (domain/
 * content/progress.js) ni puede generar un Attempt. Este es un punto
 * de extensión documentado para una futura capacidad de Atlas (otro
 * tipo de experiencia de aprendizaje para reflexión/producción
 * libre), explícitamente no implementado en Sprint 5.
 *
 * Todo lo demás aquí es genérico por tipo — ningún campo nombra
 * "coreano" ni "gramática"; son la misma forma que tendría un
 * ejercicio de matemáticas o de historia.
 */

export const EXERCISE_CATALOG = Object.freeze({
  // ---- 문법 1 (p.17) — transformar a estilo indirecto -대(요) ----
  'ex-hikorean-1-1-gram1-01a': {
    id: 'ex-hikorean-1-1-gram1-01a',
    type: 'typing',
    acceptedAnswers: ['첸 씨가 오늘 날씨가 좋대요.', '첸 씨가 오늘 날씨가 좋대요'],
  },
  'ex-hikorean-1-1-gram1-01b': {
    id: 'ex-hikorean-1-1-gram1-01b',
    type: 'typing',
    acceptedAnswers: ['레나 씨가 비빔밥을 좋아한대요.', '레나 씨가 비빔밥을 좋아한대요'],
  },
  'ex-hikorean-1-1-gram1-01c': {
    id: 'ex-hikorean-1-1-gram1-01c',
    type: 'typing',
    acceptedAnswers: ['선생님이 시험은 다음 주래요.', '선생님이 시험은 다음 주래요'],
  },

  // ---- 활동 (1) (p.18) — citar en estilo indirecto ----
  'ex-hikorean-1-1-activity1-01a': {
    id: 'ex-hikorean-1-1-activity1-01a',
    type: 'typing',
    acceptedAnswers: ['한국에 사는 동안 여행을 많이 할 거래요.'],
  },
  'ex-hikorean-1-1-activity1-01b': {
    id: 'ex-hikorean-1-1-activity1-01b',
    type: 'typing',
    acceptedAnswers: ['이 문법을 모르는데 좀 가르쳐 달래요.'],
  },
  'ex-hikorean-1-1-activity1-01c': {
    id: 'ex-hikorean-1-1-activity1-01c',
    type: 'typing',
    acceptedAnswers: ['이따가 같이 도서관에 가재요.'],
  },
  'ex-hikorean-1-1-activity1-01d': {
    id: 'ex-hikorean-1-1-activity1-01d',
    type: 'typing',
    acceptedAnswers: ['집이 어디냐고 물어요.', '집이 어디래요?', '집이 어디래요'],
  },

  // ---- 활동 (2) (p.18) — anuncios en estilo indirecto ----
  'ex-hikorean-1-1-activity1-02a': {
    id: 'ex-hikorean-1-1-activity1-02a',
    type: 'typing',
    acceptedAnswers: ['강아지를 찾는대요.'],
  },
  'ex-hikorean-1-1-activity1-02b': {
    id: 'ex-hikorean-1-1-activity1-02b',
    type: 'typing',
    acceptedAnswers: ['독서 동아리 회원을 모집한대요.'],
  },
  'ex-hikorean-1-1-activity1-02c': {
    id: 'ex-hikorean-1-1-activity1-02c',
    type: 'typing',
    acceptedAnswers: ['입장 전에 마스크를 착용해 달래요.'],
  },
  'ex-hikorean-1-1-activity1-02d': {
    id: 'ex-hikorean-1-1-activity1-02d',
    type: 'typing',
    acceptedAnswers: ['추석 연휴 동안 쉰대요.'],
  },

  // ---- 문법 2 (p.19) — A/V-아/어도 ----
  'ex-hikorean-1-1-gram2-01a': {
    id: 'ex-hikorean-1-1-gram2-01a',
    type: 'typing',
    acceptedAnswers: ['시험이 어려워도 꼭 합격할 거예요.'],
  },
  'ex-hikorean-1-1-gram2-01b': {
    id: 'ex-hikorean-1-1-gram2-01b',
    type: 'typing',
    acceptedAnswers: ['커피를 마셔도 계속 졸려요.'],
  },
  'ex-hikorean-1-1-gram2-01c': {
    id: 'ex-hikorean-1-1-gram2-01c',
    type: 'typing',
    acceptedAnswers: ['외국인이어도 지하철을 쉽게 이용할 수 있어요.'],
  },

  // ---- 활동 (1) (p.20) — A/V-아/어도, primeros dos ítems (cerrados) ----
  'ex-hikorean-1-1-activity2-01a': {
    id: 'ex-hikorean-1-1-activity2-01a',
    type: 'typing',
    acceptedAnswers: ['책이 비싸도 사야 해요.'],
  },
  'ex-hikorean-1-1-activity2-01b': {
    id: 'ex-hikorean-1-1-activity2-01b',
    type: 'typing',
    acceptedAnswers: ['일이 바빠도 밥을 먹어야 해요.'],
  },

  // ---- 어휘와 표현 (p.22) — mapa de Seúl, términos individuales ----
  'ex-hikorean-1-1-vocab-01a': {
    id: 'ex-hikorean-1-1-vocab-01a',
    type: 'fillBlank',
    acceptedAnswers: ['한강'],
  },
  'ex-hikorean-1-1-vocab-01b': {
    id: 'ex-hikorean-1-1-vocab-01b',
    type: 'fillBlank',
    acceptedAnswers: ['강북'],
  },
  'ex-hikorean-1-1-vocab-01c': {
    id: 'ex-hikorean-1-1-vocab-01c',
    type: 'fillBlank',
    acceptedAnswers: ['대교'],
  },
  'ex-hikorean-1-1-vocab-01d': {
    id: 'ex-hikorean-1-1-vocab-01d',
    type: 'fillBlank',
    acceptedAnswers: ['강남'],
  },
});
