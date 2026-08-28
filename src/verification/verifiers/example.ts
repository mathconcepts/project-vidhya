/**
 * AlwaysTrueVerifier — the minimal, LIVE reference implementation of
 * AnswerVerifier (B1a). Copy this file's shape when adding a new Tier 4+
 * verifier via `orchestrator.registerVerifier()` — see EXTENDING.md's
 * "Adding a new AnswerVerifier" walkthrough.
 *
 * This is a demonstration fixture, not a real check: it always agrees,
 * at full confidence, regardless of input. It exists so
 * `runAnswerVerifierContract` (contract.ts) has a known-good implementation
 * to run against in this package's own tests, and so the tutorial's
 * "see example.ts" pointer resolves to a real file instead of prose.
 */

import type { AnswerVerifier, AnswerVerifierContext, AnswerVerifierResult } from './types';

export const AlwaysTrueVerifier: AnswerVerifier = {
  name: 'always-true',
  tier: 4,

  async verify(
    _problem: string,
    _answer: string,
    _context?: AnswerVerifierContext,
  ): Promise<AnswerVerifierResult> {
    return { agrees: true, confidence: 1 };
  },

  async healthCheck(): Promise<boolean> {
    return true;
  },
};

export default AlwaysTrueVerifier;
