/**
 * domain/page-layout/page-marker-resolver.js
 *
 * Combina los `PageResource` reales de una página con la
 * `AnchorPlacementStrategy` vigente, en un único resultado:
 * `{ resource, position }[]`. Nunca se almacena — se recalcula en
 * cada render, mismo criterio que ya regía `PageAnchor` en el
 * diseño anterior (Technical Specification v2.1, §6.1 heredado).
 */

import { getPageResources } from '../content/page-resource-catalog.js';

export function resolvePageMarkers(bookId, pageNumber, strategy) {
  return getPageResources(bookId, pageNumber)
    .map((resource) => strategy.place(resource))
    .filter(Boolean);
}
