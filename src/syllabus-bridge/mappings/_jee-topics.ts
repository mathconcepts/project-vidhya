/**
 * Set of topic_ids the JEE Main adapter exposes. Used by bridge mappings
 * to catch typos at module-load time. Source of truth is
 * src/exams/adapters/jee-main-mathematics.ts.
 */
export const JEE_MAIN_TOPIC_IDS = new Set<string>([
  'calculus',
  'algebra',
  'coordinate-geometry',
  'vectors-3d',
  'trigonometry',
  'probability-stats',
  'sets-relations',
  'matrices-determinants',
]);
