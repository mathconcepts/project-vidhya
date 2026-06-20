/**
 * src/scoring/adapters/cas-checker.ts — concrete CASChecker backed by
 * the existing 3-tier verification cascade (src/verification).
 *
 * The blueprint §3.5 / D4 / D8 non-negotiable: the LLM never decides
 * whether a final numerical answer is right. Symbolic equality (1/√2
 * vs 0.707… vs √2/2) goes through SymPy → Wolfram. This adapter is
 * the thin bridge from the rubric grader's contract to that cascade.
 *
 * Decision rule:
 *   - cascade returns `status === 'verified'` AND `confidence >= 0.7` → CORRECT
 *   - everything else → INCORRECT
 *
 * 0.7 confidence is the same threshold used elsewhere in the codebase
 * for "trust the cascade" vs "kick it to manual review."
 */

import { TieredVerificationOrchestrator } from '../../verification/tiered-orchestrator';
import type { CASChecker } from '../rubric-grader';

/** Minimum confidence required to call a cascade verdict "trustworthy." */
export const CAS_TRUST_THRESHOLD = 0.7;

export interface CASCheckerOpts {
  /** Inject the orchestrator (DI for tests); otherwise constructed on demand. */
  orchestrator?: TieredVerificationOrchestrator;
  /** Topic hint passed through to the verifier cascade (helps SymPy calibrate). */
  topic?: string;
  subject?: string;
}

export class TieredCASChecker implements CASChecker {
  private orchestrator: TieredVerificationOrchestrator;

  constructor(private opts: CASCheckerOpts = {}) {
    this.orchestrator = opts.orchestrator ?? new TieredVerificationOrchestrator();
  }

  async isFinalAnswerCorrect(
    problemContext: string,
    expectedAnswer: string,
    studentFinalAnswer: string
  ): Promise<boolean> {
    if (!studentFinalAnswer || !expectedAnswer) return false;

    // We verify (problemContext, studentFinalAnswer). The cascade's tier-1
    // RAG lookup and tier-3 Wolfram both handle symbolic equality against
    // the expected answer when threaded through context. For tier-2
    // (SymPy / LLM-consensus dual-solve), the verifier checks against the
    // ground-truth expected answer baked into the problem.
    //
    // We synthesize a problem statement that carries the expected answer
    // as a target — the verifier's dual-solve compares the student answer
    // against the same canonicalised target.
    const problemWithTarget = problemContext
      ? `${problemContext}\n\nExpected final answer: ${expectedAnswer}`
      : `Verify whether the student answer equals ${expectedAnswer}.`;

    try {
      const result = await this.orchestrator.verify(problemWithTarget, studentFinalAnswer, {
        topic: this.opts.topic,
        subject: this.opts.subject,
      } as any);
      return result.status === 'verified' && (result.confidence ?? 0) >= CAS_TRUST_THRESHOLD;
    } catch {
      // Cascade failure means "we don't know" — treat as incorrect rather
      // than risk awarding marks for an answer we couldn't verify. The
      // student response still earns method marks from the rubric grader.
      return false;
    }
  }
}

export function makeCASChecker(opts: CASCheckerOpts = {}): CASChecker {
  return new TieredCASChecker(opts);
}
