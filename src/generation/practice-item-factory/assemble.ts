/**
 * src/generation/practice-item-factory/assemble.ts — response + spec →
 * AuthoredItem, via the existing deriveMarking() refusal discipline.
 */

import crypto from 'crypto';
import { deriveMarking } from '../../gbrain/marking-derivation';
import type { AuthoredItem } from '../../scoring/learning-object-catalog-file';
import type {
  PracticeItemFormat,
  PracticeItemGenerationResponse,
  PracticeItemSpec,
  PracticeItemVerificationPath,
} from './types';

/** deriveMarking's format vocabulary differs from ours only for 'nat'. */
const TO_DERIVE_MARKING_FORMAT: Record<PracticeItemFormat, 'mcq' | 'msq' | 'numerical'> = {
  mcq: 'mcq',
  msq: 'msq',
  nat: 'numerical',
};

/**
 * Which verification path an item of this format takes, per ENG-D4 item 8:
 * Wolfram remains the arbiter for numeric (nat) items; every non-numeric
 * (mcq/msq) item goes through dual-model consensus instead — the atom
 * pipeline's compareMathAtoms fails open and is not reusable as a gate.
 */
export function verificationPathForFormat(format: PracticeItemFormat): PracticeItemVerificationPath {
  return format === 'nat' ? 'wolfram_verified' : 'dual_model_consensus';
}

/**
 * Deterministic id: `pi-<concept>-<hash8>`. The hash covers the concept,
 * format, and question text, so re-running the SAME generation produces
 * the SAME id — writer.ts's merge-by-id is then a genuine idempotent
 * upsert rather than an ever-growing duplicate list.
 */
export function practiceItemId(spec: PracticeItemSpec, response: PracticeItemGenerationResponse): string {
  const basis = `${spec.concept_id}:${spec.format}:${response.question_text}`;
  const hash = crypto.createHash('sha256').update(basis).digest('hex').slice(0, 8);
  return `pi-${spec.concept_id}-${hash}`;
}

export interface AssembleResult {
  ok: boolean;
  item?: AuthoredItem;
  /** Present iff ok === false — always deriveMarking's own refusal reason. */
  reason?: string;
}

/**
 * Assemble one AuthoredItem from a validated generation response, or
 * refuse (null → refused, never a guessed/half-marked row) when
 * deriveMarking can't back a deterministic key for the material.
 */
export function assemblePracticeItem(
  spec: PracticeItemSpec,
  response: PracticeItemGenerationResponse,
  verificationMethod: PracticeItemVerificationPath,
  rng?: () => number,
): AssembleResult {
  const marking = deriveMarking({
    format: TO_DERIVE_MARKING_FORMAT[spec.format],
    correctAnswer: response.correct_answer ?? '',
    correctAnswers: response.correct_answers,
    distractors: response.distractors,
    difficulty: spec.difficulty,
    rng,
  });
  if (!marking) {
    return {
      ok: false,
      reason: `deriveMarking refused: unmarkable "${spec.format}" material for concept "${spec.concept_id}"`,
    };
  }

  const item: AuthoredItem = {
    id: practiceItemId(spec, response),
    concept_id: spec.concept_id,
    topic: spec.topic,
    // Authored difficulty is the SPEC's requested value, not the model's
    // self-report (see types.ts) — deterministic, operator-controlled.
    difficulty: spec.difficulty,
    question_type: marking.question_type,
    marks: marking.marks,
    question_text: response.question_text,
    options: marking.options,
    answer_index: marking.answer_index,
    answer_indices: marking.answer_indices,
    answer_range: marking.answer_range,
    correct_answer:
      spec.format === 'msq' ? (response.correct_answers ?? []).join('; ') : response.correct_answer,
    solution_steps: response.solution_steps,
    verification_method: verificationMethod,
  };
  return { ok: true, item };
}
