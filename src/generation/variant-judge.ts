/**
 * The LLM judge that decides whether a stance variant still says what its base
 * says.
 *
 * `variant-agreement.ts` checks everything a machine can check exactly:
 * structure, fenced blocks, walkthrough answers, budgets, emoji, repetition.
 * What it deliberately does NOT check is the prose, because the prose is
 * SUPPOSED to differ — that is the entire point of a variant. This file answers
 * the one question left over: does the rewrite still assert the same thing.
 *
 * ── Omission is the expected failure, not contradiction ─────────────────
 *
 * A judge that only looks for contradictions will pass almost everything and
 * catch almost nothing. The shaken budget FORCES compression — the variant is
 * required to be shorter than its base — so the realistic failure is not "the
 * variant says A is singular when the base says invertible". It is that
 * "assuming A is invertible" is simply gone. That contradicts nothing. It is
 * also the difference between a correct statement and a false one, and a
 * student reading only the variant has no way to notice.
 *
 * So the rubric asks about DROPPED CONDITIONS first and contradictions second,
 * and the prompt says plainly that a shorter variant is expected and is not by
 * itself a finding.
 *
 * ── What must survive depends on the atom type ──────────────────────────
 *
 * A `hook` carries no theorem. Judging it for dropped hypotheses would pass
 * every hook ever written, which is how 194 hook variants would end up
 * nominally gated and actually ungated. What a hook can lose is the reason to
 * care — and it has already happened by hand: rewriting
 * `orthogonality/hook-shaken.md` for length dropped its motivation paragraph
 * with seven words of budget still unused. That is the hook's version of a
 * dropped hypothesis, so it is what the hook rubric asks about.
 *
 * ── The judge does not run on the generator's provider ──────────────────
 *
 * Asking a model whether its own output preserved the meaning is asking it to
 * find its own mistake, and correlated failure is the whole risk being
 * defended against: if the generator drops a condition because the condition
 * was easy to miss, the same model reviewing the same text is the least likely
 * reader to miss it a second time. `pickJudgeProvider` refuses to return the
 * generator's provider. If no second provider is configured the judge is
 * unavailable, and unavailable means refused — see the fail-closed rule in
 * variant-generator.ts.
 *
 * ── Unvalidated until the eval is run ───────────────────────────────────
 *
 * `eval-set.ts` holds labelled pairs, ten of them corrupted in ways a judge
 * must catch. `scoreJudge` runs them. That harness has NOT been run against a
 * live model, because no reachable LLM provider is configured in this
 * environment — the one key available is for a host the egress policy blocks.
 * Until `npm run variants:eval` has been run and its recall on the corrupted
 * pairs recorded, treat this judge as untested against real model behaviour.
 * The parser, the rubric, the routing and the scoring are tested; the model's
 * judgement is not.
 */

import type { GeneratorDeps, JudgeVerdict } from './variant-generator';
import { CADENCE_ATOM_TYPES } from '../content/stance-cadence';

/** Providers the judge will accept, cheapest-first. */
export const JUDGE_PROVIDER_PREFERENCE = [
  'google-gemini',
  'anthropic',
  'openai',
  'openrouter',
] as const;

/**
 * A judge on the generator's own provider is a model reviewing itself. Returns
 * null when no distinct provider is configured, which the caller must treat as
 * "no judge" — never as "approved".
 */
export function pickJudgeProvider(
  generatorProviderId: string,
  configuredProviderIds: readonly string[],
): string | null {
  for (const candidate of JUDGE_PROVIDER_PREFERENCE) {
    if (candidate === generatorProviderId) continue;
    if (configuredProviderIds.includes(candidate)) return candidate;
  }
  return null;
}

/**
 * What the judge is asked to look for, per atom type.
 *
 * Stated once, here, so the rubric and the eval set cannot drift — the eval
 * pairs are labelled against these criteria and a test asserts every cadence
 * atom type has one.
 */
export const SURVIVAL_CRITERIA: Record<string, string> = {
  hook: [
    'A hook makes a case for caring about the concept. It carries no theorem, so',
    'do not look for dropped hypotheses. Look for a dropped REASON: if the base',
    'gives a concrete stake — where this shows up, what breaks without it, what',
    'question it answers — and the variant has replaced it with a bare statement',
    'of what the topic is, the variant has lost the thing the atom was for.',
  ].join(' '),
  intuition: [
    'An intuition builds a mental picture. The failure to catch is a picture that',
    'has been simplified into something false: a claim stated without the',
    'condition that makes it true, a special case presented as the general one, or',
    'an analogy the base carefully bounded and the variant left unbounded.',
  ].join(' '),
  worked_example: [
    'A worked example asserts a chain of mathematical steps. Every condition the',
    'base states — invertibility, non-zero denominators, sign, domain, ordering —',
    'must still be stated or made unnecessary. A step may be split, merged, or',
    'moved into the walkthrough; it may not silently disappear, and no number or',
    'final answer may change.',
  ].join(' '),
};

export interface JudgeInput {
  baseBody: string;
  variantBody: string;
  atomType: string;
}

/**
 * The instruction sent to the judge.
 *
 * Deliberately tells the model that brevity is expected. Without that line a
 * judge reliably reports "the variant omits substantial explanation" on every
 * shaken pair, which is true, is the point, and makes the judge useless.
 */
export function buildJudgePrompt(input: JudgeInput): string {
  const criteria =
    SURVIVAL_CRITERIA[input.atomType] ??
    'The variant must not assert anything the base contradicts, and must not drop a condition the base establishes.';

  return [
    'You are checking whether a rewritten lesson body still says what the original says.',
    '',
    'The rewrite is INTENDED to be shorter, plainer and differently worded. Length',
    'reduction, removed repetition, reordered sentences and changed phrasing are',
    'NOT findings. Report only a loss of meaning.',
    '',
    `This is a ${input.atomType} atom. ${criteria}`,
    '',
    'Answer with a single JSON object and nothing else:',
    '{"agrees": true}  — the rewrite preserves the meaning',
    '{"agrees": false, "reason": "<one sentence naming exactly what was lost or changed>"}',
    '',
    '--- ORIGINAL ---',
    input.baseBody,
    '',
    '--- REWRITE ---',
    input.variantBody,
  ].join('\n');
}

/**
 * Strict parse of the judge's reply.
 *
 * THROWS rather than returning a default. A judge whose answer cannot be read
 * has not approved anything, and `generateVariant` turns a throw into a refusal
 * — so an unreadable reply keeps the variant out of the content tree. Returning
 * `{agrees: false}` here would look equivalent but is not: it would record a
 * substantive disagreement in the draft's reason, hiding a parser or provider
 * problem behind what reads like a content problem.
 */
export function parseJudgeResponse(raw: string | null | undefined): JudgeVerdict {
  if (!raw || !raw.trim()) throw new Error('judge returned an empty response');

  // Models wrap JSON in prose or a code fence often enough that refusing on it
  // would fail closed on working judges. The object itself is still parsed
  // strictly — no regex extraction of individual fields.
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = (fenced ? fenced[1] : raw).trim();
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start === -1 || end === -1 || end < start) {
    throw new Error(`judge response contained no JSON object: ${truncate(raw)}`);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(candidate.slice(start, end + 1));
  } catch {
    throw new Error(`judge response was not valid JSON: ${truncate(raw)}`);
  }

  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error(`judge response was not an object: ${truncate(raw)}`);
  }
  const agrees = (parsed as Record<string, unknown>).agrees;
  if (typeof agrees !== 'boolean') {
    throw new Error(`judge response had no boolean "agrees": ${truncate(raw)}`);
  }
  const reason = (parsed as Record<string, unknown>).reason;
  return {
    agrees,
    reason: typeof reason === 'string' && reason.trim() ? reason.trim() : undefined,
  };
}

function truncate(s: string, n = 200): string {
  const flat = s.replace(/\s+/g, ' ').trim();
  return flat.length > n ? `${flat.slice(0, n)}…` : flat;
}

/** Anything that can answer a prompt. Keeps this file free of provider imports. */
export interface JudgeModel {
  generate(prompt: string): Promise<string | null>;
}

/**
 * Wrap a model as the `judge` dependency `generateVariant` expects.
 *
 * Every failure path throws, because `generateVariant` treats a throwing judge
 * as a refusal. That is the intended behaviour: a judge that cannot answer is
 * not a judge that approved.
 */
export function makeJudge(model: JudgeModel): GeneratorDeps['judge'] {
  return async (input: JudgeInput): Promise<JudgeVerdict> => {
    const raw = await model.generate(buildJudgePrompt(input));
    return parseJudgeResponse(raw);
  };
}

/**
 * Atom types the judge has a written criterion for. Anything outside this set
 * falls back to the generic criterion, which is weaker — a test asserts the set
 * covers everything the cadence generates.
 */
export const JUDGED_ATOM_TYPES: readonly string[] = CADENCE_ATOM_TYPES;
