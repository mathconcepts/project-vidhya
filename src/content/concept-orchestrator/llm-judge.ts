/**
 * llm-judge.ts — LLM-as-judge eval gate (E1).
 *
 * Scores every generated atom 1-10 on three axes:
 *   - clarity (does a first-year student understand it?)
 *   - math_correctness (is the math right? Wolfram-cross-checked when possible)
 *   - exam_alignment (does it match how the topic is tested?)
 *
 * The `score` returned is the minimum of the three (any-fail = fail).
 * Atoms scoring < 7 auto-rejected with a human-readable reason. Admin
 * sees the rejection in the queue and can override.
 *
 * Defensive contract: if the judge LLM call fails, returns score=5 so
 * the atom proceeds to admin review (no silent dropping).
 */

import type { GeneratedAtom } from './types';

export interface JudgeScore {
  /** Min of the three axes — the gating value. */
  score: number;
  clarity: number;
  math_correctness: number;
  exam_alignment: number;
  /** Plain-English summary of strengths + weaknesses. */
  reason: string;
  /** Set when LLM call failed; consumer falls back to admin manual review. */
  judge_unavailable?: boolean;
}

const JUDGE_THRESHOLD = Number(process.env.VIDHYA_LLM_JUDGE_THRESHOLD || '7');

const JUDGE_PROMPT_TEMPLATE = `You are evaluating a single generated educational atom for an exam-prep app.

Atom type: {atom_type}
Concept: {concept_id}
Body:
"""
{content}
"""

Score this atom on three axes from 1 (terrible) to 10 (perfect):
1. clarity — would a first-year student understand it on first read?
2. math_correctness — is every formula, derivation, and answer correct? When unsure, score lower.
3. exam_alignment — does the phrasing and difficulty match how this topic is tested on competitive exams?

Return ONLY a JSON object on a single line, no preamble:
{"clarity": N, "math_correctness": N, "exam_alignment": N, "reason": "one-paragraph summary of strengths AND specific weaknesses"}`;

/**
 * Score an atom. Returns the minimum of the three axes — any axis < 7
 * auto-rejects the atom. judge_unavailable=true means the LLM call
 * failed; consumer treats the score as "needs manual review".
 */
export async function scoreAtom(atom: GeneratedAtom): Promise<JudgeScore> {
  const prompt = JUDGE_PROMPT_TEMPLATE
    .replace('{atom_type}', atom.atom_type)
    .replace('{concept_id}', atom.concept_id)
    .replace('{content}', atom.content.slice(0, 6000));

  try {
    const { LLMClient } = await import('../../llm/index');
    const config = process.env.LLM_CONFIG_PATH
      ? require(process.env.LLM_CONFIG_PATH)
      : { providers: {}, defaultProvider: '' };
    const client = new (LLMClient as any)(config);
    const response = await client.generate({
      messages: [{ role: 'user', content: prompt }],
      taskType: 'eval',
      maxRetries: 1,
    });
    const text = (response.content ?? response.text ?? '').trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('no JSON in judge response');
    const parsed = JSON.parse(jsonMatch[0]);

    const clarity = clamp(parsed.clarity);
    const math_correctness = clamp(parsed.math_correctness);
    const exam_alignment = clamp(parsed.exam_alignment);
    const score = Math.min(clarity, math_correctness, exam_alignment);

    return {
      score,
      clarity,
      math_correctness,
      exam_alignment,
      reason: typeof parsed.reason === 'string' ? parsed.reason : '',
    };
  } catch (err) {
    console.warn(`[llm-judge] scoring failed for ${atom.atom_id}: ${(err as Error).message}`);
    return {
      score: 5,
      clarity: 5,
      math_correctness: 5,
      exam_alignment: 5,
      reason: 'LLM-judge unavailable — admin must manually score',
      judge_unavailable: true,
    };
  }
}

export function passesGate(s: JudgeScore): boolean {
  if (s.judge_unavailable) return true; // admin sees it, decides
  return s.score >= JUDGE_THRESHOLD;
}

function clamp(n: any): number {
  const v = Number(n);
  if (!Number.isFinite(v)) return 5;
  return Math.max(1, Math.min(10, v));
}
