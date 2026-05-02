/**
 * Unit tests for the PedagogyVerifier rubric math + JSON parsing.
 *
 * Doesn't call the LLM — those are integration paths covered by
 * docker-compose smoke. These tests pin the rubric weighting and JSON
 * tolerance so a future refactor doesn't silently shift score
 * calibration.
 */

import { describe, it, expect } from 'vitest';
import { __testing, weightedTotal, parseRubricResponse } from '../pedagogy-verifier';

const { RUBRIC_WEIGHTS } = __testing;

describe('PedagogyVerifier · weightedTotal', () => {
  it('sums to 1 when every criterion is 1', () => {
    const total = weightedTotal({
      concept_fidelity: 1,
      pedagogical_sequence: 1,
      learning_objective_coverage: 1,
      interactive_correctness: 1,
      distractor_quality: 1,
    });
    expect(total).toBeCloseTo(1, 6);
  });

  it('sums to 0 when every criterion is 0', () => {
    expect(
      weightedTotal({
        concept_fidelity: 0,
        pedagogical_sequence: 0,
        learning_objective_coverage: 0,
        interactive_correctness: 0,
        distractor_quality: 0,
      }),
    ).toBe(0);
  });

  it('clamps inputs into [0, 1]', () => {
    const total = weightedTotal({
      concept_fidelity: 5, // clamps to 1
      pedagogical_sequence: -2, // clamps to 0
      learning_objective_coverage: 0.5,
      interactive_correctness: 0.5,
      distractor_quality: 0.5,
    });
    // Expected: 0.30 * 1 + 0 + (0.20 + 0.15 + 0.15) * 0.5 = 0.30 + 0.25 = 0.55
    expect(total).toBeCloseTo(0.55, 5);
  });

  it('weights sum to 1 (rubric integrity)', () => {
    const sum = (Object.values(RUBRIC_WEIGHTS) as number[]).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1, 6);
  });
});

describe('PedagogyVerifier · parseRubricResponse', () => {
  it('parses a clean JSON object', () => {
    const raw = JSON.stringify({
      scores: {
        concept_fidelity: 0.8,
        pedagogical_sequence: 0.7,
        learning_objective_coverage: 0.9,
        interactive_correctness: 1.0,
        distractor_quality: 0.6,
      },
      notes: ['distractors a bit weak'],
    });
    const r = parseRubricResponse(raw);
    expect(r).not.toBeNull();
    expect(r!.scores.concept_fidelity).toBeCloseTo(0.8, 5);
    expect(r!.notes).toContain('distractors a bit weak');
    expect(r!.weighted_total).toBeGreaterThan(0);
    expect(r!.weighted_total).toBeLessThanOrEqual(1);
  });

  it('strips markdown code fences (```json ... ```)', () => {
    const raw = '```json\n' + JSON.stringify({ scores: { concept_fidelity: 0.5, pedagogical_sequence: 0.5, learning_objective_coverage: 0.5, interactive_correctness: 0.5, distractor_quality: 0.5 } }) + '\n```';
    const r = parseRubricResponse(raw);
    expect(r).not.toBeNull();
    expect(r!.weighted_total).toBeCloseTo(0.5, 5);
  });

  it('returns null on malformed JSON', () => {
    expect(parseRubricResponse('not json at all')).toBeNull();
    expect(parseRubricResponse('{"scores": {malformed')).toBeNull();
    expect(parseRubricResponse('')).toBeNull();
  });

  it('returns null when scores object is missing', () => {
    expect(parseRubricResponse(JSON.stringify({ notes: ['nope'] }))).toBeNull();
  });

  it('clamps in-range numeric scores via parse path', () => {
    const raw = JSON.stringify({
      scores: {
        concept_fidelity: 99,
        pedagogical_sequence: -5,
        learning_objective_coverage: 0.5,
        interactive_correctness: 0.5,
        distractor_quality: 0.5,
      },
    });
    const r = parseRubricResponse(raw);
    expect(r!.scores.concept_fidelity).toBe(1);
    expect(r!.scores.pedagogical_sequence).toBe(0);
  });

  it('truncates excessive notes', () => {
    const lots = Array.from({ length: 50 }, (_, i) => `note-${i}`);
    const raw = JSON.stringify({
      scores: {
        concept_fidelity: 0.5, pedagogical_sequence: 0.5,
        learning_objective_coverage: 0.5, interactive_correctness: 0.5,
        distractor_quality: 0.5,
      },
      notes: lots,
    });
    const r = parseRubricResponse(raw);
    expect(r!.notes.length).toBeLessThanOrEqual(8);
  });
});
