/**
 * src/generation/practice-item-factory/prompt.ts — deterministic prompt
 * builder for a PracticeItemSpec. Pure string construction, no network —
 * the returned prompt is what a caller hands to an LLM client elsewhere.
 */

import { CONCEPT_MAP } from '../../constants/concept-graph';
import type { PracticeItemSpec } from './types';

const DIFFICULTY_LABEL = (d: number): string => {
  if (d < 0.34) return 'easy';
  if (d < 0.67) return 'medium';
  return 'hard';
};

const FORMAT_INSTRUCTIONS: Record<PracticeItemSpec['format'], string> = {
  mcq: [
    'Format: MCQ (single correct answer).',
    'Return "correct_answer" (the correct option\'s text) and "distractors"',
    '(at least 2 plausible-but-wrong options, each distinct from the correct',
    'answer and from each other).',
  ].join(' '),
  msq: [
    'Format: MSQ (multiple correct answers, "select all that apply").',
    'Return "correct_answers" (at least 2 distinct correct option texts) and',
    '"distractors" (at least 1 option that is wrong and clearly not one of',
    'the correct answers).',
  ].join(' '),
  nat: [
    'Format: NAT (numerical answer type).',
    'Return "correct_answer" as a plain number (or a simple a/b fraction) —',
    'no units, no LaTeX, no symbolic expressions. "distractors" may be an',
    'empty array; NAT items are graded by numeric tolerance, not by option.',
  ].join(' '),
};

/**
 * Build the JSON-only-response prompt for one spec. Deterministic: the
 * same spec always produces the same prompt string (the caller is free
 * to add its own non-deterministic wrapper, e.g. a request id, but this
 * function never does).
 */
export function buildPracticeItemPrompt(spec: PracticeItemSpec): string {
  const concept = CONCEPT_MAP.get(spec.concept_id);
  const conceptLabel = concept?.label ?? spec.concept_id;
  const conceptDescription = concept?.description ?? '';
  const difficultyLabel = DIFFICULTY_LABEL(spec.difficulty);

  const lines: string[] = [
    `Generate one GATE-style practice problem for the concept "${conceptLabel}"`,
    `(topic: ${spec.topic}; concept id: ${spec.concept_id}).`,
  ];
  if (conceptDescription) lines.push(`Concept context: ${conceptDescription}`);
  lines.push(
    `Target difficulty: ${difficultyLabel} (${spec.difficulty.toFixed(2)} on a 0..1 scale).`,
    FORMAT_INSTRUCTIONS[spec.format],
    '',
    'Respond with ONLY a single JSON object (no markdown fences, no prose',
    'before or after) matching exactly this shape:',
    '{',
    '  "question_text": string,',
    spec.format === 'msq' ? '  "correct_answers": string[],' : '  "correct_answer": string,',
    '  "distractors": string[],',
    '  "solution_steps": string[],  // at least 1 step, each a short sentence',
    '  "difficulty": number  // your own 0..1 estimate of how hard this item is',
    '}',
    '',
    'Every field is required. Do not include any field not listed above.',
    'Do not include an answer key inside question_text or solution_steps —',
    'solution_steps may show working, but the graded answer is only what',
    `you put in ${spec.format === 'msq' ? '"correct_answers"' : '"correct_answer"'}.`,
  );
  return lines.join('\n');
}
