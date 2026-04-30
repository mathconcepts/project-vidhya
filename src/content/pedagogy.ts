/**
 * PedagogyReviewer — async quality gate for generated content.
 *
 * Architecture (per ER-D3 in PLAN-content-module-dx.md):
 *   Tier 2/3 generated content is delivered to the student immediately.
 *   PedagogyReviewer runs ASYNC, writing pedagogy_score back to the RAG cache.
 *   On the next cache hit for the same content, the score is read; bad content
 *   is demoted from cache and regenerated.
 *
 * This is a 0-cost-on-delivery design. No student waits on pedagogy review.
 *
 * Adding a new PedagogyReviewer:
 *   1. Create src/content/pedagogy-<name>.ts that exports a default instance.
 *   2. Wire it into src/content/pedagogy-runner.ts (the async runner).
 *   3. Write a test that runs `runPedagogyReviewerContract(yourReviewer)` and passes.
 */

/**
 * Rubric the reviewer scores against. Each field is 0-1; final score is a weighted average.
 */
export interface PedagogyRubric {
  /** Mathematical accuracy — does the content reach a correct answer? */
  accuracy: number;
  /** Clarity — is the explanation easy to follow for the target student? */
  clarity: number;
  /** Difficulty appropriateness — matches the student's mastery level? */
  difficultyAppropriateness: number;
  /** GATE syllabus alignment — covers in-syllabus material, no out-of-scope tangents? */
  syllabusAlignment: number;
}

export interface PedagogyResult {
  /** Aggregate score in [0, 1]. Below `failThreshold` flags content for cache demotion. */
  score: number;
  /** Per-criterion breakdown. */
  rubric: PedagogyRubric;
  /** Free-text rationale; surfaced in admin tooling, never to the student. */
  rationale?: string;
  /** True if the reviewer recommends keeping this content; false demotes it. */
  recommendKeep: boolean;
}

export interface PedagogyReviewerContext {
  concept_id?: string;
  /** The generated content's source tier (helps reviewer calibrate). */
  source?: string;
  /** Trace id linking the review back to the original delivery. */
  traceId?: string;
}

export interface PedagogyReviewer {
  /** Stable name used in telemetry signals. */
  readonly name: string;
  /** Score below which content gets demoted from cache. Default 0.6. */
  readonly failThreshold: number;
  /**
   * Review content async. MUST return null on timeout (caller swallows null and logs).
   * MUST never throw — we never want a review failure to affect content delivery.
   */
  review(content: string, context?: PedagogyReviewerContext): Promise<PedagogyResult | null>;
  healthCheck(): Promise<boolean>;
}
