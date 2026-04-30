/**
 * AlwaysTrueVerifier — a live example of the AnswerVerifier contract.
 *
 * Engineers adding a new verifier should COPY THIS FILE, rename it, and
 * fill in the verify() body. The contract test in __tests__/example.test.ts
 * runs `runAnswerVerifierContract(alwaysTrueVerifier)` and proves the file
 * conforms to the interface — if you break the contract while editing,
 * this test fails first.
 *
 * This is a Tier 9 verifier (last in the cascade) so it never affects real
 * verification results in production. Its only job is to be a live reference.
 */

import type { AnswerVerifier, AnswerVerifierContext, AnswerVerifierResult } from './types';

export const alwaysTrueVerifier: AnswerVerifier = {
  name: 'always-true-example',
  tier: 9,

  async verify(
    _problem: string,
    _answer: string,
    _context?: AnswerVerifierContext,
  ): Promise<AnswerVerifierResult> {
    // Real verifiers do work here. This one always agrees with low confidence
    // so it never overrides Tier 1-3 results in production.
    return {
      agrees: true,
      confidence: 0.1,
      reason: 'AlwaysTrueVerifier is an example; never use for real verification',
    };
  },

  async healthCheck(): Promise<boolean> {
    return true;
  },
};

export default alwaysTrueVerifier;
