/**
 * AnswerVerifier — extension contract for math answer verification.
 *
 * Distinct from {@link ContentVerifier} (src/content/verifiers/types.ts):
 *   - AnswerVerifier checks whether a math ANSWER is correct
 *   - ContentVerifier checks whether DELIVERED CONTENT meets quality bars
 *
 * Existing implementations: wolfram.ts, sympy.ts, llm-consensus.ts.
 *
 * Adding a new AnswerVerifier:
 *   1. Create src/verification/verifiers/<name>.ts that exports a default instance
 *      implementing this interface (with a `tier` property for cascade ordering).
 *   2. Auto-registered via src/verification/verifiers/index.ts barrel.
 *   3. The TieredVerificationOrchestrator will pick it up automatically.
 *   4. Write a test that runs `runAnswerVerifierContract(yourVerifier)` and passes.
 *
 * See EXTENDING.md and src/verification/verifiers/example.ts for a copy-paste starting point.
 */

export interface AnswerVerifierContext {
  /** Math topic/subject for the problem (helps verifiers calibrate). */
  topic?: string;
  /** Subject area (calculus, linear-algebra, etc.). */
  subject?: string;
  /** Trace id for end-to-end observability. */
  traceId?: string;
}

export interface AnswerVerifierResult {
  /** Did the verifier accept the answer as correct? */
  agrees: boolean;
  /** Confidence in [0, 1]; 1 is highest. */
  confidence: number;
  /** Optional canonical answer the verifier produced (for cross-check telemetry). */
  canonicalAnswer?: string;
  /** Optional reason on disagreement; surfaced in telemetry. */
  reason?: string;
}

export interface AnswerVerifier {
  /** Stable name used in telemetry signals and cascade trace. */
  readonly name: string;
  /**
   * Cascade tier (1 runs first, higher numbers run later).
   * Convention: 1=cheapest (RAG), 2=mid (LLM), 3=expensive (Wolfram), 4+=specialized.
   */
  readonly tier: number;
  /**
   * Verify whether `answer` is correct for `problem`. MUST honor the orchestrator's
   * timeout (return early with low confidence if uncertain). Never throw on timeout.
   */
  verify(
    problem: string,
    answer: string,
    context?: AnswerVerifierContext,
  ): Promise<AnswerVerifierResult>;
  /** Cheap liveness check; used at startup and to skip the verifier if down. */
  healthCheck(): Promise<boolean>;
}
