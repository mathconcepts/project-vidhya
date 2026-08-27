/**
 * src/generation/practice-item-factory/spec-to-atom.ts
 *
 * Closes the wiring gap recorded in docs/ops/content-verification-runbook.md
 * §3.2 (now rewritten to describe this path instead of a gap): turns
 * operator-declared PracticeItemSpec[] (config.target.practice_item_specs)
 * into the AtomSpec[] the batch orchestrator's prepare() step needs.
 * Deterministic — the same specs in the same order produce byte-identical
 * AtomSpecs, which is what makes jsonl-builder.ts's crash-resume story
 * (rebuild from batch_jobs, same customIdFor()) hold for practice-item runs
 * exactly as it already does for atom-mode ones.
 *
 * This is the mirror of batch-dispatch.ts's practiceItemSpecFromAtomSpec —
 * that function reconstructs a PracticeItemSpec FROM an AtomSpec's
 * concept_id + prompt_vars; practiceItemSpecToAtomSpec here builds the
 * AtomSpec the OTHER way, using the exact same prompt_vars keys (format,
 * topic, difficulty_frac, require_failure_tags) so a spec built here
 * round-trips through that function unchanged on the poll/process side.
 */

import { PRACTICE_ITEM_ATOM_TYPE } from '../batch/jsonl-builder';
import { buildPracticeItemPrompt } from './prompt';
import { DIFFICULTY_LABEL } from './prompt';
import type { AtomSpec } from '../batch/types';
import type { PracticeItemFormat, PracticeItemSpec } from './types';

export class PracticeItemSpecValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PracticeItemSpecValidationError';
  }
}

const VALID_FORMATS: ReadonlySet<string> = new Set<PracticeItemFormat>(['mcq', 'msq', 'nat']);

function describeType(v: unknown): string {
  if (v === undefined) return 'undefined';
  if (v === null) return 'null';
  if (typeof v === 'string') return `"${v}"`;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  return typeof v;
}

/**
 * Validates one raw spec object (as parsed from admin API JSON / the
 * RunLauncher form), naming the exact field + index it refuses on (D8
 * precision — "practice_item_specs[3].format: must be one of mcq, msq,
 * nat — got undefined", never a generic "malformed spec").
 */
export function validatePracticeItemSpec(raw: unknown, index: number): PracticeItemSpec {
  const at = `practice_item_specs[${index}]`;
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new PracticeItemSpecValidationError(`${at}: expected an object, got ${describeType(raw)}`);
  }
  const s = raw as Record<string, unknown>;

  if (typeof s.concept_id !== 'string' || s.concept_id.length === 0) {
    throw new PracticeItemSpecValidationError(
      `${at}.concept_id: required non-empty string, got ${describeType(s.concept_id)}`,
    );
  }
  if (typeof s.format !== 'string' || !VALID_FORMATS.has(s.format)) {
    throw new PracticeItemSpecValidationError(
      `${at}.format: must be one of mcq, msq, nat — got ${describeType(s.format)}`,
    );
  }
  if (typeof s.difficulty !== 'number' || !Number.isFinite(s.difficulty) || s.difficulty < 0 || s.difficulty > 1) {
    throw new PracticeItemSpecValidationError(
      `${at}.difficulty: required number in [0, 1], got ${describeType(s.difficulty)}`,
    );
  }
  if (typeof s.topic !== 'string' || s.topic.length === 0) {
    throw new PracticeItemSpecValidationError(
      `${at}.topic: required non-empty string, got ${describeType(s.topic)}`,
    );
  }
  if (s.require_failure_tags !== undefined && typeof s.require_failure_tags !== 'boolean') {
    throw new PracticeItemSpecValidationError(
      `${at}.require_failure_tags: must be boolean when present, got ${describeType(s.require_failure_tags)}`,
    );
  }

  return {
    concept_id: s.concept_id,
    format: s.format as PracticeItemFormat,
    difficulty: s.difficulty,
    topic: s.topic,
    require_failure_tags: s.require_failure_tags === true,
  };
}

const PROMPT_TEMPLATE_ID = 'practice-item-v1';

/**
 * One PracticeItemSpec -> one AtomSpec. `prompt_vars.rendered_prompt` is
 * set to the REAL practice-item prompt (prompt.ts's buildPracticeItemPrompt)
 * so jsonl-builder.ts's renderPrompt() uses it instead of falling back to
 * its own generic atom-prompt shape (see renderPrompt's doc comment — this
 * is precisely the escape hatch it describes).
 */
export function practiceItemSpecToAtomSpec(spec: PracticeItemSpec): AtomSpec {
  return {
    concept_id: spec.concept_id,
    atom_type: PRACTICE_ITEM_ATOM_TYPE,
    difficulty: DIFFICULTY_LABEL(spec.difficulty),
    prompt_template_id: PROMPT_TEMPLATE_ID,
    prompt_vars: {
      format: spec.format,
      topic: spec.topic,
      difficulty_frac: spec.difficulty,
      require_failure_tags: spec.require_failure_tags === true,
      rendered_prompt: buildPracticeItemPrompt(spec),
    },
  };
}

/**
 * Validates + converts a whole practice_item_specs[] array in one pass.
 * Throws PracticeItemSpecValidationError on the FIRST malformed spec — a
 * bad spec at index 12 should not hide behind 11 good ones that already
 * built fine (fail fast, name the field, per D8).
 */
export function practiceItemSpecsToAtomSpecs(raw: readonly unknown[]): AtomSpec[] {
  return raw.map((r, i) => practiceItemSpecToAtomSpec(validatePracticeItemSpec(r, i)));
}
