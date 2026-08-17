/**
 * Recovery from a struggling motivation state.
 *
 * The bug this pins: recovery fired only for `frustrated`, while three states
 * count as struggling everywhere else (`deriveFraming` treats `anxious`,
 * `flagging` and `frustrated` alike). So a student marked `anxious` stayed
 * anxious permanently and kept receiving the gentlest register no matter how
 * well they did — and both demo personas are `anxious`.
 *
 * The product's stated promise is that every rep adds to the next. A model
 * that cannot notice improvement contradicts it.
 */
import { describe, it, expect } from 'vitest';
import { updateMastery, RECOVERY_STREAK } from '../student-model';
import { STRUGGLING_STATES } from '../../teaching/motivation-source';

type M = Parameters<typeof updateMastery>[0];

const model = (over: Partial<M> = {}): M =>
  ({
    id: 'm',
    session_id: 's',
    user_id: null,
    mastery_vector: {},
    speed_profile: {},
    prerequisite_alerts: [],
    representation_mode: 'balanced',
    abstraction_comfort: 0.5,
    working_memory_est: 0.5,
    motivation_state: 'steady',
    confidence_calibration: {
      overconfident_rate: 0,
      underconfident_rate: 0,
      calibration_score: 0.5,
    },
    frustration_threshold: 3,
    consecutive_failures: 0,
    correct_streak: 0,
    exam_strategy: {},
    updated_at: new Date().toISOString(),
    ...over,
  }) as M;

const right = (m: M) => updateMastery(m, 'eigenvalues', true, 0.5);
const wrong = (m: M) => updateMastery(m, 'eigenvalues', false, 0.5);

describe('recovery from every struggling state', () => {
  for (const state of STRUGGLING_STATES) {
    it(`lifts "${state}" to steady after ${RECOVERY_STREAK} correct in a row`, () => {
      let m = model({ motivation_state: state });
      for (let i = 0; i < RECOVERY_STREAK; i++) m = right(m);
      expect(m.motivation_state).toBe('steady');
    });

    it(`does NOT lift "${state}" on a single correct answer`, () => {
      // One right answer is as likely a lucky guess as a turn, and flipping
      // the lesson's register every correct answer reads as instability.
      const m = right(model({ motivation_state: state }));
      expect(m.motivation_state).toBe(state);
    });
  }

  it('resets the streak on a wrong answer, so recovery needs a real run', () => {
    let m = model({ motivation_state: 'anxious' });
    m = right(m);
    m = wrong(m);
    m = right(m);
    expect(m.motivation_state).toBe('anxious');
    m = right(m);
    expect(m.motivation_state).toBe('steady');
  });

  it('leaves a thriving student alone', () => {
    let m = model({ motivation_state: 'driven' });
    for (let i = 0; i < 5; i++) m = right(m);
    expect(m.motivation_state).toBe('driven');
  });
});

describe('the frustration path still works', () => {
  it('still drops to frustrated at the threshold', () => {
    let m = model({ frustration_threshold: 3 });
    for (let i = 0; i < 3; i++) m = wrong(m);
    expect(m.motivation_state).toBe('frustrated');
    expect(m.consecutive_failures).toBe(3);
  });

  it('clears the failure count on a correct answer', () => {
    let m = model();
    m = wrong(m);
    m = wrong(m);
    m = right(m);
    expect(m.consecutive_failures).toBe(0);
  });

  it('does not count failures and successes at the same time', () => {
    let m = model();
    m = right(m);
    expect(m.correct_streak).toBe(1);
    m = wrong(m);
    expect(m.correct_streak).toBe(0);
    expect(m.consecutive_failures).toBe(1);
  });
});
