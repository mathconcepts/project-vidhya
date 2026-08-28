/**
 * AnswerVerifier — extension contract for math answer verification.
 *
 * Distinct from {@link ContentVerifier} (src/content/verifiers/types.ts):
 *   - AnswerVerifier checks whether a math ANSWER is correct
 *   - ContentVerifier checks whether DELIVERED CONTENT meets quality bars
 *
 * Live implementations in this directory:
 *   - example.ts   AlwaysTrueVerifier — a reference fixture only, not a real check.
 *   - sympy.ts     The Tier 2.5 SymPy stage. It implements THIS interface and
 *                  passes runAnswerVerifierContract, but it is wired into
 *                  TieredVerificationOrchestrator via a dedicated constructor
 *                  slot (B1b), not via registerVerifier() — so it is not a
 *                  Tier 4+ example to copy. Authoring/CI only; never imported
 *                  from src/api/** (B1d).
 *   - wolfram.ts   Implements the SEPARATE internal `Verifier` interface
 *                  (src/verification/types.ts) for the built-in Tier 3 slot.
 *                  It does NOT implement AnswerVerifier and is not a template
 *                  for a new extension.
 *
 * There is no barrel/index.ts in this directory — nothing here is
 * auto-registered. A new Tier 4+ verifier is wired explicitly:
 *
 * Adding a new AnswerVerifier (Tier 4+):
 *   1. Create src/verification/verifiers/<name>.ts that exports a default instance
 *      implementing this interface (with a `tier` property for cascade ordering).
 *   2. Register it explicitly: orchestrator.registerVerifier(yourVerifier) at
 *      server bootstrap (or wherever the orchestrator instance is constructed).
 *   3. Write a test that runs `runAnswerVerifierContract(yourVerifier)` and passes.
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
