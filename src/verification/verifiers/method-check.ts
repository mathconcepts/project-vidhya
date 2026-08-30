/**
 * src/verification/verifiers/method-check.ts
 *
 * Tier 4+ AnswerVerifier — checks whether the METHOD a worked solution used
 * is sound and matches the expected approach, as distinct from whether the
 * final numeric answer is correct.
 *
 * Why this exists: the built-in cascade (RAG → LLM dual-solve → SymPy →
 * Wolfram) all converge on the same question — "is this answer numerically
 * right?" — which a CAS is very good at and catches arithmetic/algebra
 * slips reliably. It cannot see method-selection or problem-modelling
 * errors: a solution that reaches the right number via an unsound or
 * mismatched method. That is specifically the failure mode language models
 * exhibit most often now, and it is invisible to symbolic equivalence
 * checking. This verifier is the second, independent layer for that gap —
 * advisory only, per the Tier 4+ contract (never overrides the cascade's
 * own verdict; see tiered-orchestrator.ts's runExtraVerifiers()).
 *
 * Two-tier check, always in this order:
 *   1. LLM judge (authoritative when available) — asks whether the worked
 *      solution's method is mathematically sound and matches the expected
 *      method, if one was supplied via context.expectedMethod.
 *   2. Heuristic fallback (LLM unavailable or malformed output) — a weak
 *      keyword-overlap signal between context.expectedMethod's tokens and
 *      context.solutionText. Deliberately capped at low confidence and
 *      labelled "heuristic-only" in `reason` — a keyword match is not proof
 *      a method is sound, and claiming otherwise is exactly the false-
 *      assurance failure mode this verifier exists to avoid repeating.
 *
 * With neither an expected method nor solution text to check, there is
 * nothing to verify — returns confidence 0 (inconclusive), never a guess.
 *
 * Operating mode: registered into the live orchestrator only behind
 * VIDHYA_METHOD_CHECK=on (src/server.ts) — off by default, matching the
 * pedagogy-verifier's shadow-mode-first rollout convention. Even when
 * registered, a Tier 4+ result is structurally advisory (folded into
 * `checks`, never able to change `status`/`tierUsed`/`confidence` on the
 * cascade's own verdict) — there is no separate "gating mode" to add here.
 */

import type { AnswerVerifier, AnswerVerifierContext, AnswerVerifierResult } from './types';

const TIMEOUT_MS = 20_000;
const HEURISTIC_MAX_CONFIDENCE = 0.35;

// Tokens too generic to carry method signal on their own — stripped before
// the heuristic overlap check. Matches the repo's own `hand_checkable_*`
// naming convention on the 505 committed practice items.
const STOPWORDS = new Set(['hand', 'checkable', 'method', 'formula', 'direct', 'approach', 'via', 'using']);

export interface MethodCheckResponse {
  method_sound: boolean;
  matches_expected: boolean | null;
  confidence: number;
  reason: string;
}

/** Split a verification_method-style string into meaningful tokens. Exported for tests. */
export function methodTokens(method: string): string[] {
  return method
    .toLowerCase()
    .split(/_vs_|_|\s+/)
    .map(t => t.trim())
    .filter(t => t.length > 2 && !STOPWORDS.has(t));
}

/**
 * Weak keyword-overlap signal between an expected-method string and a
 * solution's text. Pure function; exported for tests. Never claims high
 * confidence — see the module doc for why.
 */
export function heuristicMethodOverlap(
  expectedMethod: string,
  solutionText: string,
): { agrees: boolean; confidence: number; reason: string } {
  const tokens = methodTokens(expectedMethod);
  if (tokens.length === 0) {
    return { agrees: true, confidence: 0, reason: 'heuristic-only: expected method had no checkable tokens' };
  }
  const haystack = solutionText.toLowerCase();
  const hits = tokens.filter(t => haystack.includes(t));
  const overlap = hits.length / tokens.length;
  // Scale into [0, HEURISTIC_MAX_CONFIDENCE] — even a perfect keyword match
  // is not proof of a sound method, only a weak correlate.
  const confidence = Math.round(overlap * HEURISTIC_MAX_CONFIDENCE * 100) / 100;
  return {
    agrees: overlap >= 0.5,
    confidence,
    reason: `heuristic-only: ${hits.length}/${tokens.length} expected-method keyword(s) found in solution text (${hits.join(', ') || 'none'})`,
  };
}

/** Parse the LLM judge's JSON response. Returns null on malformed input — caller falls back. */
export function parseMethodCheckResponse(raw: string): MethodCheckResponse | null {
  if (typeof raw !== 'string' || raw.length === 0) return null;
  const stripped = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  let parsed: any;
  try {
    parsed = JSON.parse(stripped);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== 'object' || typeof parsed.method_sound !== 'boolean') return null;
  const confidence = typeof parsed.confidence === 'number' && Number.isFinite(parsed.confidence)
    ? Math.max(0, Math.min(1, parsed.confidence))
    : 0.5;
  const matches_expected = parsed.matches_expected === true ? true : parsed.matches_expected === false ? false : null;
  const reason = typeof parsed.reason === 'string' ? parsed.reason.slice(0, 500) : '';
  return { method_sound: parsed.method_sound, matches_expected, confidence, reason };
}

function buildPrompt(problem: string, answer: string, context: AnswerVerifierContext): string {
  const expectedLine = context.expectedMethod
    ? `Expected/reference method: ${context.expectedMethod}`
    : 'Expected/reference method: (none given — judge soundness only, matches_expected must be null)';
  return [
    'You are checking whether a worked math solution used a SOUND and APPROPRIATE method',
    'for the stated problem — NOT whether the final answer is numerically correct (a',
    'separate system already checks that independently). A solution that reaches the',
    'right answer via an unsound, mismatched, or unjustified method is the failure this',
    'check exists to catch — arithmetic-only checkers cannot see it.',
    '',
    `Problem: ${problem.slice(0, 4000)}`,
    `Stated answer: ${answer.slice(0, 500)}`,
    expectedLine,
    `Worked solution to evaluate: ${(context.solutionText ?? '(none given)').slice(0, 4000)}`,
    '',
    'Return ONLY a JSON object, no prose:',
    '{"method_sound": true/false, "matches_expected": true/false/null, "confidence": 0.0-1.0, "reason": "one sentence"}',
  ].join('\n');
}

async function callLlmJudge(prompt: string): Promise<string> {
  const { getLlmForRole } = await import('../../llm/runtime');
  const llm = (await getLlmForRole('json')) ?? (await getLlmForRole('chat'));
  if (!llm) {
    throw new Error('no LLM configured for json/chat role');
  }

  const result = await Promise.race<string | null>([
    llm.generate(
      {
        text: prompt,
        system: 'You are a strict maths reviewer checking solution METHOD soundness, not answer correctness. Output only valid JSON — no prose.',
      },
      { temperature: 0, maxTokens: 400 },
    ),
    new Promise<string>((_, reject) =>
      setTimeout(() => reject(new Error('method-check verifier timeout')), TIMEOUT_MS),
    ),
  ]);

  if (result == null) {
    throw new Error('LLM returned null (network or provider error)');
  }
  return result;
}

export const methodCheckVerifier: AnswerVerifier = {
  name: 'method-check',
  tier: 4,

  async verify(problem: string, answer: string, context?: AnswerVerifierContext): Promise<AnswerVerifierResult> {
    const expectedMethod = context?.expectedMethod;
    const solutionText = context?.solutionText;

    if (!expectedMethod && !solutionText) {
      return { agrees: true, confidence: 0, reason: 'nothing to check — no expected method or solution text given' };
    }

    try {
      const raw = await callLlmJudge(buildPrompt(problem, answer, context ?? {}));
      const parsed = parseMethodCheckResponse(raw);
      if (parsed) {
        const agrees = parsed.method_sound && parsed.matches_expected !== false;
        return {
          agrees,
          confidence: parsed.confidence,
          reason: parsed.reason || (agrees ? undefined : 'method-check disagreed'),
        };
      }
      // Malformed LLM output — fall through to the heuristic rather than
      // guess a verdict from garbage.
    } catch {
      // LLM unavailable or timed out — fall through to the heuristic.
    }

    if (expectedMethod && solutionText) {
      const heuristic = heuristicMethodOverlap(expectedMethod, solutionText);
      return heuristic;
    }

    return { agrees: true, confidence: 0, reason: 'LLM judge unavailable and insufficient data for the heuristic fallback' };
  },

  async healthCheck(): Promise<boolean> {
    try {
      await import('../../llm/runtime');
      return true;
    } catch {
      return false;
    }
  },
};

export default methodCheckVerifier;

// Exported for tests.
export const __testing = { buildPrompt, callLlmJudge };
