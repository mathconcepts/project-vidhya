/**
 * Tests for the Wave 8 marking additions:
 *   - markingPayloadFromRow() (learning-object-catalog-pg.ts) — the
 *     validation gate between migration-032 columns and payload
 *   - attachMarking() (api/readiness-routes.ts) — the API surface that
 *     turns a marked practice action into a { marking } block via
 *     deterministic-scorer's describeMarking()
 *
 * All pure / injected — no Postgres needed.
 */

import { describe, it, expect } from 'vitest';
import { markingPayloadFromRow } from '../learning-object-catalog-pg';
import { attachMarking } from '../../api/readiness-routes';
import { InMemoryCatalog } from '../learning-object-catalog';
import type { LearningObject, Action } from '../../core/interfaces';

const baseRow = {
  id: 'p1', concept_id: 'eigenvalues', topic: 'linear-algebra', difficulty: 0.5,
  question_text: 'q', correct_answer: 'a', solution_steps: [], distractors: [],
  verified: true, verification_method: 'cas', times_served: 0,
};

describe('markingPayloadFromRow — migration 032 validation gate', () => {
  it('returns {} for pre-032 rows (columns absent)', () => {
    expect(markingPayloadFromRow(baseRow)).toEqual({});
  });

  it('returns {} for unmarked rows (columns NULL)', () => {
    expect(markingPayloadFromRow({ ...baseRow, question_type: null, marks: null })).toEqual({});
  });

  it('returns {} for half-marked rows — never guess the other half', () => {
    expect(markingPayloadFromRow({ ...baseRow, question_type: 'mcq' })).toEqual({});
    expect(markingPayloadFromRow({ ...baseRow, marks: 2 })).toEqual({});
  });

  it('returns {} for invalid kind or non-positive marks', () => {
    expect(markingPayloadFromRow({ ...baseRow, question_type: 'essay', marks: 2 })).toEqual({});
    expect(markingPayloadFromRow({ ...baseRow, question_type: 'mcq', marks: 0 })).toEqual({});
  });

  it('threads mcq marking with a valid answer_index', () => {
    expect(markingPayloadFromRow({ ...baseRow, question_type: 'mcq', marks: 2, answer_index: 3 }))
      .toEqual({ questionType: 'mcq', marks: 2, answerIndex: 3 });
  });

  it('threads msq indices and nat range only when well-shaped', () => {
    expect(markingPayloadFromRow({ ...baseRow, question_type: 'msq', marks: 2, answer_indices: [0, 2] }))
      .toEqual({ questionType: 'msq', marks: 2, answerIndices: [0, 2] });
    expect(markingPayloadFromRow({ ...baseRow, question_type: 'msq', marks: 2, answer_indices: ['a'] }))
      .toEqual({ questionType: 'msq', marks: 2 });
    expect(markingPayloadFromRow({ ...baseRow, question_type: 'nat', marks: 1, answer_range: [1.4, 1.6] }))
      .toEqual({ questionType: 'nat', marks: 1, answerRange: [1.4, 1.6] });
    expect(markingPayloadFromRow({ ...baseRow, question_type: 'nat', marks: 1, answer_range: [1.4] }))
      .toEqual({ questionType: 'nat', marks: 1 });
  });
});

function obj(id: string, payload: Record<string, unknown>): LearningObject {
  return {
    id, nodeId: 'eigenvalues', type: 'practice', difficulty: 1500,
    estMinutes: 3, prereqs: [], verification: 'cas_passed',
    payload: { skillId: 'eigenvalues', ...payload },
  };
}

function practiceAction(objectId?: string): Action {
  return { kind: 'practice', objectId, nodeId: 'eigenvalues', estMinutes: 3, rationale: 'r', expectedGain: 1 };
}

describe('attachMarking — Wave 8 API surface', () => {
  it('attaches GATE marking for a marked 2-mark MCQ (wrong = −2/3)', async () => {
    const catalog = new InMemoryCatalog([obj('p1', { questionType: 'mcq', marks: 2 })]);
    const out = await attachMarking(practiceAction('p1'), catalog);
    expect(out.marking).toEqual({ marks_correct: 2, marks_wrong: -2 / 3 });
  });

  it('attaches marks_wrong 0 for msq and nat (no negative marking)', async () => {
    const catalog = new InMemoryCatalog([
      obj('m1', { questionType: 'msq', marks: 2 }),
      obj('n1', { questionType: 'nat', marks: 1 }),
    ]);
    expect((await attachMarking(practiceAction('m1'), catalog)).marking)
      .toEqual({ marks_correct: 2, marks_wrong: 0 });
    expect((await attachMarking(practiceAction('n1'), catalog)).marking)
      .toEqual({ marks_correct: 1, marks_wrong: 0 });
  });

  it('returns the action unchanged for unmarked rows', async () => {
    const catalog = new InMemoryCatalog([obj('p1', {})]);
    const action = practiceAction('p1');
    const out = await attachMarking(action, catalog);
    expect(out).toEqual(action);
    expect(out.marking).toBeUndefined();
  });

  it('returns the action unchanged for missing objects and non-practice actions', async () => {
    const catalog = new InMemoryCatalog([]);
    const missing = practiceAction('nope');
    expect(await attachMarking(missing, catalog)).toEqual(missing);

    const diagnose: Action = { kind: 'diagnose', estMinutes: 5, rationale: 'r', expectedGain: 0 };
    expect(await attachMarking(diagnose, catalog)).toEqual(diagnose);
  });

  it('returns the action unchanged when the catalog has no getById (contract: missing method = null result)', async () => {
    const catalog = { query: async () => [] };
    const action = practiceAction('p1');
    expect(await attachMarking(action, catalog)).toEqual(action);
  });
});
