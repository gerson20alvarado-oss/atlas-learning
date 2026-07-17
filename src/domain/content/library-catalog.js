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
 * Sprint 3 pobló por primera vez las Dynamic Learning Sections y
 * Content Blocks de cada Lesson, con un libro de muestra ("Español
 * Esencial") usando solo los seis primitivos que ya tenían renderer:
 * prose, term, dialogue, aside, example, table.
 *
 * Sprint 4 (Progress, Roadmap Phase 4) añade el primer libro REAL:
 * "Hi! Korean 3A" (Chapter 01 — 서울, Lesson 1-1 completa, páginas
 * 16–25 del libro impreso — alcance explícitamente acordado, el resto
 * del libro no se adapta todavía). Esto es contenido, nunca
 * arquitectura (Sprint 4 Plan, punto 12): ningún primitivo nuevo se
 * introdujo para representarlo.
 *
 * Decisiones de fidelidad de contenido tomadas para este libro
 * (aprobadas explícitamente antes de implementar, ver resumen técnico
 * del Sprint 4):
 *   - Bloques `practice` SÍ se incluyen ya (con `exerciseId` estable
 *     y un campo `prompt` informativo, no requerido por el contrato),
 *     aunque el Exercise Engine no exista hasta Sprint 5 — se
 *     renderizan con el mismo aviso neutral que content-block-
 *     renderer.js ya define para "practice".
 *   - Un único bloque `media` de tipo `image` es real: el mapa de
 *     distritos de Seúl (p.22), extraído directamente del PDF del
 *     libro (asset legítimo, no fabricado) — ver
 *     assets/images/content/hi-korean-3a/.
 *   - NINGÚN bloque `media` de tipo audio se incluye: el libro
 *     referencia pistas de audio reales (Track 01/02/03) pero Atlas
 *     no tiene esos archivos. Las referencias al audio se documentan
 *     como bloques `aside`, nunca como un reproductor sin contenido
 *     real (Sprint 4 Plan, punto 3: "no fabriques audio").
 *   - `estimatedStudyMinutes` de esta Lesson es una estimación
 *     autoral (el libro no declara un tiempo de estudio) — 40
 *     minutos, dado el volumen de contenido (2 puntos de gramática +
 *     vocabulario + diálogo + 2 actividades de escucha).
 * Sprint 5 (Exercise Engine) reestructuró los bloques `practice` de
 * esta Lesson: cada pregunta numerada que antes vivía agrupada en un
 * solo bloque ahora es un bloque `practice` independiente, con su
 * propio `exerciseId` (Sprint 5 Plan, decisión "B1" — mejora la
 * fidelidad al libro, cada ejercicio real del libro es un Exercise
 * real en Atlas). La clave de corrección de cada uno vive en
 * `exercise-catalog.js`, nunca aquí — este archivo sigue siendo solo
 * la forma en que el contenido se presenta, nunca cómo se evalúa.
 *
 * Tres categorías de `practice` quedan deliberadamente SIN Exercise
 * (exercise-repository.getExerciseById devuelve `null` para ellos a
 * propósito, documentado en cada bloque con un comentario):
 *   - **Actividades abiertas**: producción libre, opinión personal,
 *     sin una respuesta única y correcta (p. ej. "mi lista de deseos
 *     en Seúl"). Nunca se fuerza una clave de corrección falsa.
 *   - **Dependientes de audio real**: preguntas de comprensión
 *     auditiva cuya respuesta correcta depende de un audio que Atlas
 *     todavía no tiene (Sprint 4, Track 01/02/03) — distinto de
 *     "actividad abierta": SÍ tienen respuesta correcta en el libro,
 *     pero Atlas no puede verificarla sin el asset real.
 *   - **Tipos de ejercicio aún no soportados**: el ejercicio de
 *     matching término-definición (p.22) — "matching" es PRD §24
 *     "Should Have v1.x", no uno de los tres tipos de Sprint 5.
 * Ninguna de las tres participa en el cómputo de Progress (domain/
 * content/progress.js) ni genera Attempts — son puntos de extensión
 * documentados para una capacidad futura de Atlas, no implementados
 * todavía (Sprint 5 Plan, decisión explícita).
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
    {
      id: 'book-hi-korean-3a',
      title: 'Hi! Korean 3A',
      // R1 (Sprint 7, Objetivo E — decisión de Producto): portada
      // editorial real, sin recortar ni reinterpretar (assets/images/
      // covers/hi-korean-3a.jpg, extraída directamente del PDF del
      // libro, mismo criterio de legitimidad ya usado para el mapa de
      // p.22 — ver nota de fidelidad de contenido más arriba en este
      // archivo). Resuelta a URL real por quien compone la screen
      // (app/screen-router.js vía runtimeConfig.resolveAssetPath),
      // nunca aquí — este archivo es contenido, no runtime.
      coverAssetPath: 'assets/images/covers/hi-korean-3a.jpg',
      units: [
        {
          id: 'unit-hikorean-ch1-seoul',
          title: 'Chapter 01 — 서울',
          lessons: [
            {
              id: 'lesson-hikorean-1-1',
              title: '1-1 서울에는 구경할 곳이 정말 많대요',
              estimatedStudyMinutes: 40,
              sections: [
                {
                  id: 'section-hikorean-1-1-intro',
                  label: '도입',
                  blocks: [
                    {
                      id: 'block-hikorean-1-1-intro-1',
                      type: 'prose',
                      paragraphs: [
                        '여러분이 알고 있는 서울의 명소는 어디입니까?',
                        '서울에서 가장 좋아하는 장소는 어디입니까? 그 이유는 무엇입니까?',
                      ],
                    },
                  ],
                },
                {
                  id: 'section-hikorean-1-1-gram1',
                  label: '문법 1 — A-대(요) V-ㄴ/는대(요)',
                  blocks: [
                    {
                      id: 'block-hikorean-1-1-gram1-prose',
                      type: 'prose',
                      paragraphs: [
                        "'A-다고 해요'와 'V-ㄴ/는다고 해요'의 줄임말이다. 들어서 알게 되었거나 이미 알고 있는 이야기를 다른 사람에게 전달할 때 쓰는 구어체 표현이다.",
                      ],
                    },
                    {
                      id: 'block-hikorean-1-1-gram1-example',
                      type: 'example',
                      label: 'Example',
                      body: '엠마 씨는 친구들과 한국어로만 이야기한대요. 마크 씨는 취미가 쇼핑이래요. 룸메이트가 주말에 같이 마트에 가재요.',
                    },
                    {
                      id: 'block-hikorean-1-1-gram1-practice-a',
                      type: 'practice',
                      exerciseId: 'ex-hikorean-1-1-gram1-01a',
                      prompt: '문장을 만들어 보세요. 첸: "오늘 날씨가 좋아요."',
                    },
                    {
                      id: 'block-hikorean-1-1-gram1-practice-b',
                      type: 'practice',
                      exerciseId: 'ex-hikorean-1-1-gram1-01b',
                      prompt: '문장을 만들어 보세요. 레나: "저는 비빔밥을 좋아해요."',
                    },
                    {
                      id: 'block-hikorean-1-1-gram1-practice-c',
                      type: 'practice',
                      exerciseId: 'ex-hikorean-1-1-gram1-01c',
                      prompt: '문장을 만들어 보세요. 선생님: "시험은 다음 주입니다."',
                    },
                  ],
                },
                {
                  id: 'section-hikorean-1-1-activity1',
                  label: '활동 (1)',
                  blocks: [
                    {
                      id: 'block-hikorean-1-1-activity1-dialogue',
                      type: 'dialogue',
                      turns: [
                        { speaker: '보기', text: '주말에 친구랑 홍대 주변을 구경했어요.' },
                        { speaker: '보기', text: '엠마 씨가 뭐래요?' },
                        { speaker: '보기', text: '엠마 씨가 주말에 친구랑 홍대 주변을 구경했대요.' },
                      ],
                    },
                    {
                      id: 'block-hikorean-1-1-activity1-practice-a',
                      type: 'practice',
                      exerciseId: 'ex-hikorean-1-1-activity1-01a',
                      prompt: '보기와 같이 이야기해 보세요. "한국에 사는 동안 여행을 많이 할 거예요."',
                    },
                    {
                      id: 'block-hikorean-1-1-activity1-practice-b',
                      type: 'practice',
                      exerciseId: 'ex-hikorean-1-1-activity1-01b',
                      prompt: '보기와 같이 이야기해 보세요. "이 문법을 모르는데 좀 가르쳐 주세요."',
                    },
                    {
                      id: 'block-hikorean-1-1-activity1-practice-c',
                      type: 'practice',
                      exerciseId: 'ex-hikorean-1-1-activity1-01c',
                      prompt: '보기와 같이 이야기해 보세요. "이따가 같이 도서관에 갈래요?"',
                    },
                    {
                      id: 'block-hikorean-1-1-activity1-practice-d',
                      type: 'practice',
                      exerciseId: 'ex-hikorean-1-1-activity1-01d',
                      prompt: '보기와 같이 이야기해 보세요. "집이 어디예요?"',
                    },
                  ],
                },
                {
                  id: 'section-hikorean-1-1-activity1b',
                  label: '활동 (2)',
                  blocks: [
                    {
                      id: 'block-hikorean-1-1-activity1-dialogue2',
                      type: 'dialogue',
                      turns: [
                        { speaker: '보기', text: '저기에 뭐라고 쓰여 있어요?' },
                        {
                          speaker: '보기',
                          text: '지금 제주도에 눈이 너무 많이 와서 제주행 비행기가 모두 취소됐대요.',
                        },
                      ],
                    },
                    {
                      id: 'block-hikorean-1-1-activity1-practice2-a',
                      type: 'practice',
                      exerciseId: 'ex-hikorean-1-1-activity1-02a',
                      prompt: '안내문을 보고 보기와 같이 이야기해 보세요. "강아지를 찾습니다"',
                    },
                    {
                      id: 'block-hikorean-1-1-activity1-practice2-b',
                      type: 'practice',
                      exerciseId: 'ex-hikorean-1-1-activity1-02b',
                      prompt: '안내문을 보고 보기와 같이 이야기해 보세요. "독서 동아리 회원 모집"',
                    },
                    {
                      id: 'block-hikorean-1-1-activity1-practice2-c',
                      type: 'practice',
                      exerciseId: 'ex-hikorean-1-1-activity1-02c',
                      prompt: '안내문을 보고 보기와 같이 이야기해 보세요. "입장 전 마스크를 착용해 주세요"',
                    },
                    {
                      id: 'block-hikorean-1-1-activity1-practice2-d',
                      type: 'practice',
                      exerciseId: 'ex-hikorean-1-1-activity1-02d',
                      prompt: '안내문을 보고 보기와 같이 이야기해 보세요. "추석 연휴 휴무 안내 (9월 12일 목 ~ 15일 일)"',
                    },
                  ],
                },
                {
                  id: 'section-hikorean-1-1-gram2',
                  label: '문법 2 — A/V-아/어도',
                  blocks: [
                    {
                      id: 'block-hikorean-1-1-gram2-prose',
                      type: 'prose',
                      paragraphs: [
                        '앞의 상황이나 행동이 뒤의 사실에 영향을 주지 않을 때 사용한다. 선행절에는 어떤 상황이나 행동이 있지만, 후행절의 상황이나 행동은 그것과 관계없이 이루어질 때 쓴다.',
                      ],
                    },
                    {
                      id: 'block-hikorean-1-1-gram2-example',
                      type: 'example',
                      label: 'Example',
                      body: '너무 늦어서 택시를 타도 약속 시간까지 도착 못 해요. 아무리 피곤해도 숙제는 꼭 하고 자요. 단어를 아무리 외워도 시험 볼 때 생각이 안 나요.',
                    },
                    {
                      id: 'block-hikorean-1-1-gram2-practice-a',
                      type: 'practice',
                      exerciseId: 'ex-hikorean-1-1-gram2-01a',
                      prompt: '문장을 만들어 보세요. 시험이 어렵다 / 꼭 합격할 것이다',
                    },
                    {
                      id: 'block-hikorean-1-1-gram2-practice-b',
                      type: 'practice',
                      exerciseId: 'ex-hikorean-1-1-gram2-01b',
                      prompt: '문장을 만들어 보세요. 커피를 마시다 / 계속 졸리다',
                    },
                    {
                      id: 'block-hikorean-1-1-gram2-practice-c',
                      type: 'practice',
                      exerciseId: 'ex-hikorean-1-1-gram2-01c',
                      prompt: '문장을 만들어 보세요. 외국인이다 / 지하철을 쉽게 이용할 수 있다',
                    },
                  ],
                },
                {
                  id: 'section-hikorean-1-1-activity2',
                  label: '활동 (1)',
                  blocks: [
                    {
                      id: 'block-hikorean-1-1-activity2-dialogue',
                      type: 'dialogue',
                      turns: [
                        { speaker: '보기', text: '유학 생활이 힘들어서 고향에 돌아갈까 해요.' },
                        { speaker: '보기', text: '힘들어도 포기하면 안 돼요.' },
                      ],
                    },
                    {
                      id: 'block-hikorean-1-1-activity2-practice-a',
                      type: 'practice',
                      exerciseId: 'ex-hikorean-1-1-activity2-01a',
                      prompt: '보기와 같이 이야기해 보세요. 책이 비싸다, 친구에게 빌릴까 하다',
                    },
                    {
                      id: 'block-hikorean-1-1-activity2-practice-b',
                      type: 'practice',
                      exerciseId: 'ex-hikorean-1-1-activity2-01b',
                      prompt: '보기와 같이 이야기해 보세요. 일이 바쁘다, 점심을 못 먹었다',
                    },
                    {
                      // Actividad abierta (Sprint 5 Plan): "약을 먹다, (자유 응답)" — el
                      // propio libro deja el desenlace a elección del estudiante. Sin
                      // Exercise en exercise-catalog.js a propósito — ver docstring allí.
                      id: 'block-hikorean-1-1-activity2-practice-c',
                      type: 'practice',
                      exerciseId: 'ex-hikorean-1-1-activity2-01c',
                      prompt: '보기와 같이 이야기해 보세요. 감기에 걸리다, 병원에 다닌다고 들었다 → 약을 먹다, (자유 응답)',
                    },
                    {
                      // Actividad abierta — "(자유 응답), 꿈을 이룰 것이다": misma razón que arriba.
                      id: 'block-hikorean-1-1-activity2-practice-d',
                      type: 'practice',
                      exerciseId: 'ex-hikorean-1-1-activity2-01d',
                      prompt: '보기와 같이 이야기해 보세요. 가수가 되고 싶다, 노력한다고 들었다 → (자유 응답), 꿈을 이룰 것이다',
                    },
                  ],
                },
                {
                  id: 'section-hikorean-1-1-activity2b',
                  label: '활동 (2)',
                  blocks: [
                    {
                      id: 'block-hikorean-1-1-activity2-dialogue2',
                      type: 'dialogue',
                      turns: [{ speaker: '보기', text: '저는 아무리 연습해도 발음이 안 좋아요.' }],
                    },
                    {
                      // Actividad abierta completa (Sprint 5 Plan): producción personal
                      // libre sobre la propia vida del estudiante, sin clave de
                      // corrección posible. Sin Exercise a propósito.
                      id: 'block-hikorean-1-1-activity2-practice2',
                      type: 'practice',
                      exerciseId: 'ex-hikorean-1-1-activity2-02',
                      prompt:
                        '열심히 노력해도 잘 안 되는 일이 있습니까? 보기와 같이 이야기해 보세요. (1) 저는 아무리 운동해도... (2) 저는 아무리... (3) 저는...',
                    },
                  ],
                },
                {
                  id: 'section-hikorean-1-1-dialogue',
                  label: '대화',
                  blocks: [
                    {
                      id: 'block-hikorean-1-1-dialogue-main',
                      type: 'dialogue',
                      turns: [
                        { speaker: '서준', text: '첸 씨, 이번 학기에 새로 온 신입생이 있어요?' },
                        {
                          speaker: '첸',
                          text: '네, 이름이 파비우라고 해요. 브라질 사람이래요. 대학원에 가려고 한국에 왔대요.',
                        },
                        { speaker: '서준', text: '브라질 사람이요? 그럼 축구를 좋아한대요?' },
                        {
                          speaker: '첸',
                          text: '네, 축구를 너무 좋아해서 아무리 피곤해도 주말 아침에는 꼭 축구를 한대요. 그러면서 저한테도 같이 하재요.',
                        },
                        { speaker: '서준', text: '와, 역시 브라질 사람은 축구를 정말 좋아하네요!' },
                        { speaker: '첸', text: '네, 그래서 이번 주 토요일에 같이 축구하기로 했어요.' },
                        { speaker: '서준', text: '잘됐네요! 다음에는 저도 같이 해요.' },
                      ],
                    },
                    {
                      id: 'block-hikorean-1-1-dialogue-audio-note',
                      type: 'aside',
                      label: 'Nota',
                      body: 'Esta conversación incluye audio en el libro original (Track 01). El asset de audio real todavía no está integrado en Atlas — ver Sprint 4, decisión sobre Media.',
                    },
                  ],
                },
                {
                  id: 'section-hikorean-1-1-vocab',
                  label: '어휘와 표현',
                  blocks: [
                    {
                      id: 'block-hikorean-1-1-vocab-terms',
                      type: 'term',
                      entries: [
                        { term: '한강', meaning: '서울에 있는 큰 강' },
                        { term: '강북', meaning: '강의 북쪽 지역' },
                        { term: '대교', meaning: '강을 건널 수 있는 큰 다리' },
                        { term: '강남', meaning: '강의 남쪽 지역' },
                        { term: '수도', meaning: '한 나라의 중앙 정부가 있는 도시' },
                        { term: '대도시', meaning: '지역이 넓고 사람이 많은 도시' },
                        { term: '중심지', meaning: '어떤 일이나 활동의 중심이 되는 곳' },
                        { term: '도심', meaning: '도시의 중심' },
                        { term: '인구', meaning: '어떤 지역에 사는 사람의 수' },
                      ],
                    },
                    {
                      id: 'block-hikorean-1-1-vocab-map',
                      type: 'media',
                      mediaType: 'image',
                      assetPath: 'assets/images/content/hi-korean-3a/lesson-1-1-seoul-map.png',
                      alt: '서울시 자치구가 표시된 지도',
                      caption:
                        '서울의 행정구역 지도 — 어휘 활동(한강/강남/강북/대교 위치 확인)에 사용되는 원서 p.22의 지도. 도서 원본에서 추출한 실제 이미지 자산이다.',
                    },
                    {
                      id: 'block-hikorean-1-1-vocab-today',
                      type: 'aside',
                      label: '오늘의 표현',
                      body: '얼마나 A/V-(으)ㄴ/는데(요): 다른 사람에게 그 정도를 강조해서 알려 줄 때 사용한다. 예: 한강이 얼마나 아름다운데요. 제가 서울을 얼마나 좋아하는데요.',
                    },
                    {
                      id: 'block-hikorean-1-1-vocab-practice-a',
                      type: 'practice',
                      exerciseId: 'ex-hikorean-1-1-vocab-01a',
                      prompt: '빈칸에 알맞은 말을 쓰세요. ( ): 서울에 있는 큰 강',
                    },
                    {
                      id: 'block-hikorean-1-1-vocab-practice-b',
                      type: 'practice',
                      exerciseId: 'ex-hikorean-1-1-vocab-01b',
                      prompt: '빈칸에 알맞은 말을 쓰세요. ( ): 강의 북쪽 지역',
                    },
                    {
                      id: 'block-hikorean-1-1-vocab-practice-c',
                      type: 'practice',
                      exerciseId: 'ex-hikorean-1-1-vocab-01c',
                      prompt: '빈칸에 알맞은 말을 쓰세요. ( ): 강을 건널 수 있는 큰 다리',
                    },
                    {
                      id: 'block-hikorean-1-1-vocab-practice-d',
                      type: 'practice',
                      exerciseId: 'ex-hikorean-1-1-vocab-01d',
                      prompt: '빈칸에 알맞은 말을 쓰세요. ( ): 강의 남쪽 지역',
                    },
                    {
                      // Tipo de ejercicio futuro (Sprint 5 Plan): matching término-
                      // definición. "Matching" es PRD §24 "Should Have v1.x", no uno
                      // de los 3 tipos de Sprint 5 — sin Exercise a propósito.
                      id: 'block-hikorean-1-1-vocab-practice-matching',
                      type: 'practice',
                      exerciseId: 'ex-hikorean-1-1-vocab-01-matching',
                      prompt:
                        '다음 단어와 의미가 맞는 것을 연결하세요: 수도 / 대도시 / 중심지 / 도심 / 인구.',
                    },
                  ],
                },
                {
                  id: 'section-hikorean-1-1-listen1',
                  label: '듣고 말하기 1',
                  blocks: [
                    {
                      id: 'block-hikorean-1-1-listen1-prose',
                      type: 'prose',
                      paragraphs: ['여러분은 홍대 앞에 자주 갑니까? 홍대 앞에서 무엇을 하면 좋습니까?'],
                    },
                    {
                      id: 'block-hikorean-1-1-listen1-audio-note',
                      type: 'aside',
                      label: 'Nota',
                      body: 'Esta sección usa audio en el libro original (Track 02). El asset de audio real todavía no está integrado en Atlas.',
                    },
                    {
                      // Sin audio real (Sprint 4) no hay forma de derivar la respuesta
                      // correcta de (1)/(2), y (3) además es una pregunta personal
                      // abierta. Sin Exercise a propósito — ver exercise-catalog.js.
                      id: 'block-hikorean-1-1-listen1-practice',
                      type: 'practice',
                      exerciseId: 'ex-hikorean-1-1-listen1-01',
                      prompt:
                        '다음을 잘 듣고 대답해 보세요. (1) 두 사람은 주말에 무엇을 할 예정입니까? (2) 소개 영상에서 왜 연남동을 추천했습니까? (3) 여러분 나라에 홍대 앞과 비슷한 명소는 어디입니까? 소개해 보세요.',
                    },
                  ],
                },
                {
                  id: 'section-hikorean-1-1-listen2',
                  label: '듣고 말하기 2',
                  blocks: [
                    {
                      id: 'block-hikorean-1-1-listen2-audio-note',
                      type: 'aside',
                      label: 'Nota',
                      body: 'Esta sección usa audio en el libro original (Track 03). El asset de audio real todavía no está integrado en Atlas.',
                    },
                    {
                      // Misma razón que listen1: sin audio real, sin Exercise.
                      id: 'block-hikorean-1-1-listen2-practice',
                      type: 'practice',
                      exerciseId: 'ex-hikorean-1-1-listen2-01',
                      prompt:
                        '다음을 잘 듣고 대답해 보세요. (1) 파비우는 어렸을 때 서울에서 어디에 가 봤습니까? (2) 파비우는 서울의 어떤 점을 좋다고 생각합니까? (3) 서울의 특징은 무엇입니까? (4) 파티마가 서울을 좋아하는 이유는 무엇입니까?',
                    },
                    {
                      // Actividad abierta: preguntas de opinión personal.
                      id: 'block-hikorean-1-1-listen2-practice2',
                      type: 'practice',
                      exerciseId: 'ex-hikorean-1-1-listen2-02',
                      prompt:
                        '여러분의 생각을 이야기해 보세요. (1) 여러분은 서울에 처음 왔을 때 느낌이 어땠습니까? (2) 여러분 나라의 수도나 고향 도시와 서울을 비교했을 때 비슷하거나 다른 점을 이야기해 보세요.',
                    },
                  ],
                },
                {
                  id: 'section-hikorean-1-1-production',
                  label: '말하기 확장',
                  blocks: [
                    {
                      id: 'block-hikorean-1-1-production-prose',
                      type: 'prose',
                      paragraphs: [
                        "다음은 관광객들이 서울에서 하고 싶어하는 일들입니다. 여러분은 어떤 일을 하고 싶습니까? 여러분의 '서울 관광 버킷 리스트'를 만들어 보세요.",
                      ],
                    },
                    {
                      id: 'block-hikorean-1-1-production-example',
                      type: 'example',
                      label: '참고: 서울관광재단',
                      body: '광화문 광장부터 청계천까지 빌딩과 도심 산책하기. 예쁜 한복 빌려 입고 고궁에 가서 멋진 사진 찍기. 인사동에서 전통 기념품 사기. 홍대 걷고 싶은 거리에서 길거리 공연 즐기기.',
                    },
                    {
                      // Actividad abierta: lista de deseos personal, sin clave de
                      // corrección posible. Sin Exercise a propósito.
                      id: 'block-hikorean-1-1-production-practice',
                      type: 'practice',
                      exerciseId: 'ex-hikorean-1-1-production-01',
                      prompt: '나의 서울 관광 버킷 리스트를 4가지 써 보세요.',
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
