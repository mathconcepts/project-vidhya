/**
 * spec-to-atom.ts — the missing half of the wiring gap recorded in
 * docs/ops/content-verification-runbook.md §3.2: turns operator-declared
 * PracticeItemSpec[] into the AtomSpec[] the batch orchestrator's
 * prepare() needs. Pins the round-trip through batch-dispatch.ts's
 * practiceItemSpecFromAtomSpec (the poll-side reconstruction) and the D8
 * precision of the validation refusals.
 */
import { describe, it, expect } from 'vitest';
import {
  validatePracticeItemSpec,
  practiceItemSpecToAtomSpec,
  practiceItemSpecsToAtomSpecs,
  PracticeItemSpecValidationError,
} from '../spec-to-atom';
import { practiceItemSpecFromAtomSpec } from '../batch-dispatch';
import { customIdFor } from '../../batch/jsonl-builder';
import type { PracticeItemSpec } from '../types';

const baseSpec: PracticeItemSpec = {
  concept_id: 'eigenvalues',
  format: 'mcq',
  difficulty: 0.5,
  topic: 'linear-algebra',
  require_failure_tags: true,
};

describe('validatePracticeItemSpec', () => {
  it('accepts a well-formed spec and defaults require_failure_tags to false when absent', () => {
    const raw = { concept_id: 'determinants', format: 'nat', difficulty: 0.3, topic: 'linear-algebra' };
    expect(validatePracticeItemSpec(raw, 0)).toEqual({
      concept_id: 'determinants',
      format: 'nat',
      difficulty: 0.3,
      topic: 'linear-algebra',
      require_failure_tags: false,
    });
  });

  it('preserves require_failure_tags: true when present', () => {
    expect(validatePracticeItemSpec(baseSpec, 0).require_failure_tags).toBe(true);
  });

  it('refuses a non-object entry, naming the index', () => {
    expect(() => validatePracticeItemSpec('nope', 3)).toThrow(PracticeItemSpecValidationError);
    expect(() => validatePracticeItemSpec('nope', 3)).toThrow(/practice_item_specs\[3\]/);
  });

  it('refuses a missing concept_id, naming the field', () => {
    const raw = { format: 'mcq', difficulty: 0.5, topic: 'linear-algebra' };
    expect(() => validatePracticeItemSpec(raw, 2)).toThrow(/practice_item_specs\[2\]\.concept_id/);
  });

  it('refuses an invalid format, naming the field and the allowed values', () => {
    const raw = { concept_id: 'x', format: 'essay', difficulty: 0.5, topic: 'linear-algebra' };
    expect(() => validatePracticeItemSpec(raw, 0)).toThrow(/practice_item_specs\[0\]\.format/);
    expect(() => validatePracticeItemSpec(raw, 0)).toThrow(/mcq, msq, nat/);
  });

  it('refuses an out-of-range difficulty, naming the field', () => {
    const raw = { concept_id: 'x', format: 'mcq', difficulty: 1.5, topic: 'linear-algebra' };
    expect(() => validatePracticeItemSpec(raw, 0)).toThrow(/practice_item_specs\[0\]\.difficulty/);
  });

  it('refuses a missing topic, naming the field', () => {
    const raw = { concept_id: 'x', format: 'mcq', difficulty: 0.5 };
    expect(() => validatePracticeItemSpec(raw, 0)).toThrow(/practice_item_specs\[0\]\.topic/);
  });

  it('refuses a non-boolean require_failure_tags, naming the field', () => {
    const raw = { concept_id: 'x', format: 'mcq', difficulty: 0.5, topic: 'linear-algebra', require_failure_tags: 'yes' };
    expect(() => validatePracticeItemSpec(raw, 0)).toThrow(/practice_item_specs\[0\]\.require_failure_tags/);
  });
});

describe('practiceItemSpecToAtomSpec', () => {
  it('carries concept_id + the practice-item atom_type', () => {
    const atomSpec = practiceItemSpecToAtomSpec(baseSpec);
    expect(atomSpec.concept_id).toBe('eigenvalues');
    expect(atomSpec.atom_type).toBe('practice_item');
  });

  it('threads format/topic/difficulty_frac/require_failure_tags into prompt_vars', () => {
    const atomSpec = practiceItemSpecToAtomSpec(baseSpec);
    expect(atomSpec.prompt_vars).toMatchObject({
      format: 'mcq',
      topic: 'linear-algebra',
      difficulty_frac: 0.5,
      require_failure_tags: true,
    });
  });

  it('round-trips through practiceItemSpecFromAtomSpec unchanged', () => {
    for (const s of [
      baseSpec,
      { ...baseSpec, format: 'msq' as const, require_failure_tags: false },
      { ...baseSpec, format: 'nat' as const, difficulty: 0.9 },
    ]) {
      const atomSpec = practiceItemSpecToAtomSpec(s);
      expect(practiceItemSpecFromAtomSpec(atomSpec)).toEqual(s);
    }
  });

  it('carries a rendered_prompt (the real practice-item prompt, not the generic atom fallback)', () => {
    const atomSpec = practiceItemSpecToAtomSpec(baseSpec);
    expect(typeof atomSpec.prompt_vars.rendered_prompt).toBe('string');
    expect(atomSpec.prompt_vars.rendered_prompt as string).toContain('GATE-style practice problem');
  });

  it('is deterministic — the same spec always produces the same AtomSpec', () => {
    const a = practiceItemSpecToAtomSpec(baseSpec);
    const b = practiceItemSpecToAtomSpec({ ...baseSpec });
    expect(a).toEqual(b);
  });

  it('produces stable custom_ids via jsonl-builder.customIdFor (crash-resume contract)', () => {
    const atomSpec = practiceItemSpecToAtomSpec(baseSpec);
    const id1 = customIdFor('run-1', atomSpec);
    const id2 = customIdFor('run-1', practiceItemSpecToAtomSpec({ ...baseSpec }));
    expect(id1).toBe(id2);
    expect(id1).toMatch(/^job-[0-9a-f]{12}$/);
  });
});

describe('practiceItemSpecsToAtomSpecs', () => {
  it('converts every spec in order', () => {
    const specs = [baseSpec, { ...baseSpec, concept_id: 'determinants', format: 'nat' as const }];
    const atomSpecs = practiceItemSpecsToAtomSpecs(specs);
    expect(atomSpecs).toHaveLength(2);
    expect(atomSpecs[0].concept_id).toBe('eigenvalues');
    expect(atomSpecs[1].concept_id).toBe('determinants');
  });

  it('throws on the first malformed spec, naming its index — even when later specs are fine', () => {
    const specs = [baseSpec, { concept_id: 'x', format: 'nope', difficulty: 0.5, topic: 'linear-algebra' }];
    expect(() => practiceItemSpecsToAtomSpecs(specs)).toThrow(/practice_item_specs\[1\]\.format/);
  });

  it('produces distinct custom_ids for distinct specs, and duplicate ids for identical ones', () => {
    const specs = [baseSpec, { ...baseSpec }, { ...baseSpec, concept_id: 'determinants' }];
    const atomSpecs = practiceItemSpecsToAtomSpecs(specs);
    const ids = atomSpecs.map((a) => customIdFor('run-x', a));
    expect(ids[0]).toBe(ids[1]); // identical specs -> identical custom_id (jsonl-builder dedupes these)
    expect(ids[0]).not.toBe(ids[2]);
  });
});
