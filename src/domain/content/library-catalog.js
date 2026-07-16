/**
 * domain/content/library-catalog.js
 *
 * Datos de un Book publicado, en la forma exacta que exige el
 * book-as-data contract (Software Architecture §5.2) y las shapes de
 * domain/contracts/entity-shapes.js.
 *
 * Nota de alcance (Sprint 2 Plan): el Content Import Pipeline
 * (Software Architecture §7) es explícitamente "outside the runtime
 * system" — no corre en el navegador, no existe todavía como
 * herramienta. Su único contrato con el runtime es su OUTPUT: un
 * Book válido. Este archivo *es* ese output, publicado como módulo
 * ES estático junto al resto de la SPA (Software Architecture §8.3:
 * "Published Book data... flows... → GitHub Pages → Client" — un
 * módulo JS servido como asset estático cumple exactamente ese
 * contrato, igual que bootstrap.js).
 *
 * Decisión de implementación (Sprint 2, análoga a la de hash-routing
 * en Sprint 1): se publica como módulo ES importado, no como JSON
 * vía fetch(). Evita introducir una responsabilidad de red no
 * asignada a ninguna capa en Software Architecture §9.2 (Domain
 * "must never... know about the network"), y sigue siendo servido
 * como archivo estático por GitHub Pages sin cambiar nada
 * estructural. Si un sprint futuro necesita un catálogo dinámico
 * (múltiples libros publicados de forma independiente al deploy),
 * este módulo es el punto de reemplazo — sin tocar quien lo consume
 * (content-repository.js ya expone la misma forma de salida).
 *
 * Nota de contenido: no existe todavía arte de portada real (eso es
 * trabajo del Content Import Pipeline, fuera de alcance de Sprint 2
 * y de este runtime). presentation/components/book-card/ renderiza
 * un placeholder neutral en su lugar — ver book-card.js.
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
            },
            {
              id: 'lesson-1-2',
              title: 'Presentarse',
              estimatedStudyMinutes: 20,
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
            },
            {
              id: 'lesson-2-2',
              title: 'En la escuela',
              estimatedStudyMinutes: 22,
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
            },
          ],
        },
      ],
    },
  ],
});
