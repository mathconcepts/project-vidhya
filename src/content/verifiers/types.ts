/**
 * ContentVerifier — extension contract for content quality verification.
 *
 * Distinct from {@link AnswerVerifier} (src/verification/verifiers/types.ts):
 *   - AnswerVerifier checks whether a math ANSWER is correct (Wolfram, SymPy, LLM consensus)
 *   - ContentVerifier checks whether DELIVERED CONTENT meets quality bars (clarity,
 *     pedagogical alignment, source provenance) before it reaches the student
 *
 * Adding a new ContentVerifier:
 *   1. Create src/content/verifiers/<name>.ts that exports a default instance
 *      implementing this interface.
 *   2. The barrel export in src/content/verifiers/index.ts auto-discovers it.
 *   3. Write a test that runs `runContentVerifierContract(yourVerifier)` and passes.
 *
 * See EXTENDING.md and src/content/verifiers/example.ts for a copy-paste starting point.
 */

export interface ContentVerifierResult {
  /** True if the content passed this verifier's quality bar. */
  passed: boolean;
  /** Score in [0, 1]; 1 is the rubric ceiling. */
  score: number;
  /** Optional reason when passed=false; surfaced in telemetry only, never to the student. */
  reason?: string;
}

export interface ContentVerifier {
  /** Stable name used in telemetry signals and the cascade trace. */
  readonly name: string;
  /** Tier ordering (lower runs first). Convention: 1=cheap/fast, 9=expensive/slow. */
  readonly tier: number;
  /**
   * Verify a piece of content against this verifier's rubric.
   * Implementations MUST return within their declared timeout; on timeout return
   * { passed: false, score: 0, reason: 'timeout' } rather than throwing.
   */
  verify(content: string, context?: { concept_id?: string }): Promise<ContentVerifierResult>;
  /** Cheap liveness check; used at startup and for tier-miss diagnostics. */
  healthCheck(): Promise<boolean>;
}
