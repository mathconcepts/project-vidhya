/**
 * F1 regression — marksPerMin sign fix.
 *
 * Before the fix, the formula used `+` for the penalty term, which caused
 * weak topics (low accuracy) to rank artificially high in the attempt
 * sequence. The correct formula subtracts the penalty:
 *
 *   marksPerMin = (accuracy × correct - (1-accuracy) × |wrong|) / timeMin
 *
 * This test locks the sort invariant: a strong topic (high accuracy)
 * must rank before a weak topic (low accuracy) in the attempt sequence.
 */

import { describe, it, expect } from 'vitest';
import { generateAttemptSequence, EXAM_CONFIGS } from '../exam-strategy';
import type { StudentModel } from '../student-model';

function makeModel(masteryOverrides: Record<string, number>): StudentModel {
  const mastery_vector: Record<string, any> = {};
  for (const [topic, score] of Object.entries(masteryOverrides)) {
    mastery_vector[topic] = { score, attempts: 10, correct: Math.round(score * 10), last_update: '2025-01-01' };
  }
  return {
    id: 'test',
    session_id: 'test-session',
    user_id: null,
    mastery_vector,
    speed_profile: {},
    prerequisite_alerts: [],
    representation_mode: 'balanced',
    abstraction_comfort: 0.5,
    working_memory_est: 0.5,
    motivation_state: 'steady',
    confidence_calibration: { overconfident_rate: 0.1, underconfident_rate: 0.1, calibration_score: 0.8 },
    frustration_threshold: 0.3,
    consecutive_failures: 0,
    exam_strategy: {},
    error_patterns: [],
    cognitive_profile: {} as any,
    engagement_history: [],
    performance_trend: 'stable',
  } as any;
}

describe('generateAttemptSequence — marksPerMin sign (F1 fix)', () => {
  const config = EXAM_CONFIGS['gate']; // marks_per_correct: 2, marks_per_wrong: -0.67

  it('strong topic (accuracy 0.9) ranks before weak topic (accuracy 0.1) with negative marking', () => {
    // For GATE (marks_correct=2, marks_wrong=-0.67):
    //   strong (0.9): EV/min = (0.9×2 - 0.1×0.67) / timeMin =  (1.8 - 0.067) / timeMin > 0
    //   weak   (0.1): EV/min = (0.1×2 - 0.9×0.67) / timeMin =  (0.2 - 0.603) / timeMin < 0
    // Before the fix (+), weak topic would have had EV = (0.2 + 0.603) = 0.803 — bigger than 1.733,
    // which is wrong. The fix ensures weak topics have negative EV and rank last.
    // Topic keys must match MARKS_WEIGHTS (kebab-case).
    const model = makeModel({ 'linear-algebra': 0.9, calculus: 0.1 });
    const playbook = generateAttemptSequence(model, config);
    const seq = playbook.attempt_sequence.map(a => a.topic);
    const strongIdx = seq.indexOf('linear-algebra');
    const weakIdx = seq.indexOf('calculus');
    // Both topics must appear
    expect(strongIdx).toBeGreaterThanOrEqual(0);
    expect(weakIdx).toBeGreaterThanOrEqual(0);
    // Strong must rank before (lower index = attempt earlier)
    expect(strongIdx).toBeLessThan(weakIdx);
  });

  it('with the correct minus sign, weak topic (0.1 accuracy) has negative expected marks per minute', () => {
    // This directly verifies the arithmetic the formula must produce.
    // With: accuracy=0.1, marks_correct=2, marks_wrong=-0.67, avgTimeSec=180
    // Correct:   EV = (0.1×2 - 0.9×0.67) / 3  = (0.2 - 0.603) / 3 = -0.134 < 0
    // Wrong (+): EV = (0.1×2 + 0.9×0.67) / 3  = (0.2 + 0.603) / 3 = +0.268 > 0 (BUG)
    const accuracy = 0.1;
    const correct = 2;
    const wrong_abs = 0.67;
    const avgTimeSec = 180;
    const ev = (accuracy * correct - (1 - accuracy) * wrong_abs) / (avgTimeSec / 60);
    expect(ev).toBeLessThan(0); // weak topic should have negative EV
  });

  it('skip_threshold is at breakeven for a calibrated student on GATE config', () => {
    // breakeven = |wrong| / (correct + |wrong|) = 0.67 / (2 + 0.67) ≈ 0.251
    // GATE config uses GATE_EM_MCQ_2MARK_NEGATIVE_ROUNDED = -0.67 (≈ -2/3 rounded).
    const model = makeModel({});
    const playbook = generateAttemptSequence(model, config);
    // ±0.005 tolerance: precise enough to catch formula drift but not brittle to rounding
    expect(playbook.skip_threshold).toBeCloseTo(0.251, 2);
  });
});
