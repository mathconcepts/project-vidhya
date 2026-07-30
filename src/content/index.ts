/**
 * Content Delivery Module
 *
 * Public surface for the content module. Engineers extending the module should
 * import from here rather than reaching into individual files.
 *
 *   Extension points (see EXTENDING.md):
 *     - ContentVerifier   (src/content/verifiers/types.ts)
 *     - CadenceStrategy   (src/content/cadence.ts)
 *     - PedagogyReviewer  (src/content/pedagogy.ts)
 *     - IntentClassifier  (src/content/intent-classifier.ts)
 */

// Content module types — RouteRequest, RouteResult, ResolvedContent, etc.
export * from './content-types';

// Single source of truth for Intent across the content module.
// Anyone importing `Intent` should pull from here, not from router.ts.
export { type Intent } from './intent-classifier';

// Extension contracts.
export type { ContentVerifier, ContentVerifierResult } from './verifiers/types';
export type { CadenceStrategy, SessionMode } from './cadence';
export type { PedagogyReviewer, PedagogyResult, PedagogyRubric } from './pedagogy';

// Router public surface.
export { routeContent } from './router';
export type { Source } from './content-types';
