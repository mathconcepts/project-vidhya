/**
 * Tests for src/readiness/attempt-counterfactual.ts — plan W3.2 / E3.
 *
 * Covers every branch of the W-UI state matrix, the COUNTERFACTUAL_ITEM_CAP
 * literal, break-even arithmetic for 1-mark and 2-mark MCQs, the MSQ/NAT
 * no-negative-marking case, and the two evidence rules (skip lines require
 * MIN_TOPIC_ATTEMPTS_FOR_SKIP_EV and positive expected value, or they are
 * omitted rather than estimated).
 */

import { describe, it, expect } from 'vitest';
import {
  computeAttemptCounterfactual,
  counterfactualParamsFrom,
  breakEvenP,
  expectedMarksIfAttempted,
  marksWrongFor,
  formatMarks,
  marksPhrase,
  COUNTERFACTUAL_ITEM_CAP,
  SKIP_HEAVY_FRACTION,
  MIN_TOPIC_ATTEMPTS_FOR_SKIP_EV,
  type CounterfactualQuestion,
  type CounterfactualContractParams,
} from '../attempt-counterfactual';
import { COMPILED_ASSESSMENT_CONTRACT } from '../../exams/marking-constants';

const PARAMS: CounterfactualContractParams = counterfactualParamsFrom(null);

function q(over: Partial<CounterfactualQuestion> & { id: string }): CounterfactualQuestion {
  return {
    kind: 'mcq',
    marks: 2,
    earned: 2,
    skipped: false,
    topic: 'eigenvalues',
    conceptId: 'la-05',
    ...over,
  };
}

/** A wrong 2-mark MCQ: earned is the signed penalty, -2/3. */
function wrongMcq2(id: string, over: Partial<CounterfactualQuestion> = {}): CounterfactualQuestion {
  return q({ id, kind: 'mcq', marks: 2, earned: -(2 / 3), skipped: false, ...over });
}

describe('marking arithmetic', () => {
  it('reads the compiled contract for 1-mark and 2-mark MCQs', () => {
    expect(marksWrongFor('mcq', 1, PARAMS)).toBeCloseTo(-1 / 3, 10);
    expect(marksWrongFor('mcq', 2, PARAMS)).toBeCloseTo(-2 / 3, 10);
  });

  it('falls back to -(marks / divisor) for a mark value the table has no row for', () => {
    expect(marksWrongFor('mcq', 5, PARAMS)).toBeCloseTo(-5 / 3, 10);
  });

  it('MSQ and NAT carry no negative marking', () => {
    expect(marksWrongFor('msq', 2, PARAMS)).toBe(0);
    expect(marksWrongFor('nat', 2, PARAMS)).toBe(0);
  });

  it('break-even p is P/(R+P) — 0.25 for both 1-mark and 2-mark GATE MCQs', () => {
    expect(breakEvenP(1, marksWrongFor('mcq', 1, PARAMS))).toBeCloseTo(0.25, 10);
    expect(breakEvenP(2, marksWrongFor('mcq', 2, PARAMS))).toBeCloseTo(0.25, 10);
  });

  it('break-even p is 0 when there is no penalty — MSQ and NAT are always worth attempting', () => {
    expect(breakEvenP(2, 0)).toBe(0);
    expect(breakEvenP(1, 0)).toBe(0);
  });

  it('expected marks from attempting is p·R + (1-p)·(signed wrong)', () => {
    // 50% on a 2-mark MCQ: 0.5·2 + 0.5·(-2/3) = 0.6667
    expect(expectedMarksIfAttempted(0.5, 2, -(2 / 3))).toBeCloseTo(2 / 3, 10);
    // Exactly at break-even the two calls are worth the same.
    expect(expectedMarksIfAttempted(0.25, 2, -(2 / 3))).toBeCloseTo(0, 10);
    // Below break-even attempting loses marks.
    expect(expectedMarksIfAttempted(0.1, 2, -(2 / 3))).toBeLessThan(0);
  });
});

describe('counterfactualParamsFrom', () => {
  it('defaults to the compiled contract when there is no snapshot', () => {
    expect(PARAMS.mcq.marks_wrong_by_marks['1']).toBeCloseTo(
      COMPILED_ASSESSMENT_CONTRACT.marking.mcq.params.marks_wrong_by_marks['1'], 10);
  });

  it('prefers a pinned snapshot over the compiled default', () => {
    const params = counterfactualParamsFrom({
      mcq: { params: { marks_wrong_by_marks: { '2': -1 }, marks_wrong_fallback_divisor: 2 } },
      msq: { params: { marks_wrong: -0.5 } },
      nat: { params: { marks_wrong: 0 } },
    });
    expect(marksWrongFor('mcq', 2, params)).toBe(-1);
    expect(marksWrongFor('msq', 2, params)).toBe(-0.5);
  });

  it('ignores a malformed snapshot entry rather than adopting NaN', () => {
    const params = counterfactualParamsFrom({
      mcq: { params: { marks_wrong_by_marks: 'nope' as unknown as Record<string, unknown> } },
    });
    expect(marksWrongFor('mcq', 1, params)).toBeCloseTo(-1 / 3, 10);
  });
});

describe('formatting — student register', () => {
  it('renders the exam\'s own thirds as glyphs', () => {
    expect(formatMarks(2 / 3)).toBe('⅔');
    expect(formatMarks(1 / 3)).toBe('⅓');
    expect(formatMarks(0.5)).toBe('½');
  });

  it('renders whole marks plainly and states the unit in words', () => {
    expect(formatMarks(24)).toBe('24');
    expect(marksPhrase(1)).toBe('1 mark');
    expect(marksPhrase(-(2 / 3))).toBe('⅔ of a mark');
    expect(marksPhrase(2.5)).toBe('2.5 marks');
  });
});

describe('state matrix — unavailable', () => {
  it('a legacy row with no per-question decomposition renders headline-only', () => {
    const r = computeAttemptCounterfactual({ perQuestion: null, params: PARAMS });
    expect(r.available).toBe(false);
    expect(r.state).toBe('unavailable');
    expect(r.reason).toContain('graded before per-question analysis existed');
    expect(r.top_decisions).toEqual([]);
    expect(r.beats.competence).toBeNull();
    expect(r.beats.gap).toBeNull();
  });

  it('a decomposition with nothing gradable names the count', () => {
    const r = computeAttemptCounterfactual({ perQuestion: [], params: PARAMS });
    expect(r.available).toBe(false);
    expect(r.reason).toBe(
      '0 of 0 questions in this mock could be marked, so there are no attempt-or-skip decisions to review',
    );
  });

  it('drops entries whose marks or earned are not usable numbers', () => {
    const r = computeAttemptCounterfactual({
      perQuestion: [q({ id: 'a', marks: 0 }), q({ id: 'b', earned: Number.NaN })],
      params: PARAMS,
    });
    expect(r.available).toBe(false);
    expect(r.reason).toContain('0 of 2 questions');
  });
});

describe('state matrix — clean (the success state)', () => {
  it('a paper with no wrong attempts and no priced skips gets real success copy', () => {
    const r = computeAttemptCounterfactual({
      perQuestion: [q({ id: 'a' }), q({ id: 'b' }), q({ id: 'c' })],
      params: PARAMS,
    });
    expect(r.state).toBe('clean');
    expect(r.recoverable_marks).toBe(0);
    expect(r.marks_close_to).toBe(r.earned);
    expect(r.beats.competence).toContain('You extracted everything you knew');
    // Loss language appears only in beat 3, and beat 3 does not exist here.
    expect(r.beats.gap).toBeNull();
    expect(r.beats.action).toBeTruthy();
  });

  it('an attempted-and-wrong MSQ is not a decision — skipping would have scored the same 0', () => {
    const r = computeAttemptCounterfactual({
      perQuestion: [
        q({ id: 'a', kind: 'msq', marks: 2, earned: 0 }),
        q({ id: 'b', kind: 'nat', marks: 1, earned: 0 }),
        q({ id: 'c', kind: 'mcq', marks: 2, earned: 2 }),
      ],
      params: PARAMS,
    });
    expect(r.state).toBe('clean');
    expect(r.top_decisions).toEqual([]);
  });
});

describe('state matrix — decisions', () => {
  const perQuestion = [
    wrongMcq2('w1'),
    wrongMcq2('w2'),
    q({ id: 'ok1' }),
    q({ id: 'ok2' }),
  ];

  it('prices each wrong attempted MCQ at the negative marks it actually lost', () => {
    const r = computeAttemptCounterfactual({ perQuestion, params: PARAMS });
    expect(r.state).toBe('decisions');
    expect(r.top_decisions).toHaveLength(2);
    expect(r.top_decisions[0].decision).toBe('attempted_wrong');
    expect(r.top_decisions[0].cost_marks).toBeCloseTo(0.67, 2);
    // 0.67 + 0.67: the total is the sum of the DISPLAYED row costs, so the
    // rows a student can see always add up to the total beside them.
    expect(r.recoverable_marks).toBeCloseTo(1.34, 2);
  });

  it('beat 2 and beat 3 are the same number reframed — marks_close_to = earned + recoverable', () => {
    const r = computeAttemptCounterfactual({ perQuestion, params: PARAMS });
    expect(r.marks_close_to).toBeCloseTo(r.earned + r.recoverable_marks, 6);
    expect(r.beats.competence).toContain('already good for');
    expect(r.beats.gap).toContain('attempt-or-skip calls');
  });

  it('states the negative mark with its sign in words, never a bare glyph', () => {
    const r = computeAttemptCounterfactual({ perQuestion, params: PARAMS });
    expect(r.top_decisions[0].detail).toContain('minus ⅔ of a mark');
    expect(r.top_decisions[0].detail).toContain('blank would have cost you nothing');
  });

  it('carries the break-even sentence for every (kind, marks) pair the paper contained', () => {
    const r = computeAttemptCounterfactual({
      perQuestion: [wrongMcq2('w1'), q({ id: 'n', kind: 'nat', marks: 1, earned: 1 })],
      params: PARAMS,
    });
    const mcq = r.break_even.find((b) => b.question_kind === 'mcq')!;
    const nat = r.break_even.find((b) => b.question_kind === 'nat')!;
    expect(mcq.break_even_p).toBeCloseTo(0.25, 3);
    expect(mcq.sentence).toContain('25 in 100');
    expect(nat.break_even_p).toBe(0);
    expect(nat.sentence).toContain('always worth answering');
  });
});

describe('COUNTERFACTUAL_ITEM_CAP', () => {
  it('is 3', () => {
    expect(COUNTERFACTUAL_ITEM_CAP).toBe(3);
  });

  it('shows at most the cap and rolls the rest into one remainder line', () => {
    const perQuestion = [
      wrongMcq2('w1'), wrongMcq2('w2'), wrongMcq2('w3'), wrongMcq2('w4'), wrongMcq2('w5'),
      q({ id: 'ok1' }), q({ id: 'ok2' }), q({ id: 'ok3' }), q({ id: 'ok4' }), q({ id: 'ok5' }),
    ];
    const r = computeAttemptCounterfactual({ perQuestion, params: PARAMS });
    expect(r.top_decisions).toHaveLength(COUNTERFACTUAL_ITEM_CAP);
    expect(r.remainder_count).toBe(2);
    expect(r.remainder_marks).toBeCloseTo(1.34, 2);
    // Nothing is dropped: cap is a display rule, not an accounting one.
    const shown = r.top_decisions.reduce((s, d) => s + d.cost_marks, 0);
    expect(shown + r.remainder_marks).toBeCloseTo(r.recoverable_marks, 2);
  });

  it('orders costliest first and breaks ties deterministically by id', () => {
    const perQuestion = [
      wrongMcq2('zzz'),
      wrongMcq2('aaa'),
      q({ id: 'big', kind: 'mcq', marks: 5, earned: -(5 / 3) }),
      q({ id: 'ok' }),
    ];
    const r = computeAttemptCounterfactual({ perQuestion, params: PARAMS });
    expect(r.top_decisions.map((d) => d.object_id)).toEqual(['big', 'aaa', 'zzz']);
  });
});

describe('state matrix — attempt_more (mostly-skipped paper)', () => {
  const mostlySkipped: CounterfactualQuestion[] = [
    q({ id: 'a' }),
    q({ id: 'b' }),
    q({ id: 's1', skipped: true, earned: 0 }),
    q({ id: 's2', skipped: true, earned: 0 }),
    q({ id: 's3', skipped: true, earned: 0 }),
  ];

  it('inverts to attempt-more instead of congratulating a student who did not play', () => {
    const r = computeAttemptCounterfactual({ perQuestion: mostlySkipped, params: PARAMS });
    expect(r.state).toBe('attempt_more');
    // No topic evidence, so no skip is priced — and yet the screen must NOT
    // read as the clean/"you extracted everything you knew" success state.
    expect(r.recoverable_marks).toBe(0);
    expect(r.beats.competence).not.toContain('extracted everything');
    expect(r.beats.gap).toContain('blank is a guaranteed zero');
  });

  it('the skip-heavy threshold is a strict majority of gradable questions', () => {
    expect(SKIP_HEAVY_FRACTION).toBe(0.5);
    // Exactly half skipped is NOT skip-heavy.
    const half = computeAttemptCounterfactual({
      perQuestion: [q({ id: 'a' }), q({ id: 's', skipped: true, earned: 0 })],
      params: PARAMS,
    });
    expect(half.state).toBe('clean');
  });

  it('names the marks when evidence lets it price the skips', () => {
    const r = computeAttemptCounterfactual({
      perQuestion: mostlySkipped,
      params: PARAMS,
      topicEvidence: { eigenvalues: { attempted: 20, correct: 12 } },
    });
    expect(r.state).toBe('attempt_more');
    expect(r.recoverable_marks).toBeGreaterThan(0);
    expect(r.beats.gap).toContain('questions you passed over');
  });
});

describe('skip pricing requires real evidence', () => {
  const oneSkip = [
    q({ id: 'a' }), q({ id: 'b' }), q({ id: 'c' }),
    q({ id: 's1', skipped: true, earned: 0 }),
  ];

  it('omits the skip line entirely when there is no evidence for the topic', () => {
    const r = computeAttemptCounterfactual({ perQuestion: oneSkip, params: PARAMS });
    expect(r.top_decisions).toEqual([]);
    expect(r.state).toBe('clean');
  });

  it('omits it below MIN_TOPIC_ATTEMPTS_FOR_SKIP_EV rather than estimating', () => {
    expect(MIN_TOPIC_ATTEMPTS_FOR_SKIP_EV).toBe(8);
    const r = computeAttemptCounterfactual({
      perQuestion: oneSkip,
      params: PARAMS,
      topicEvidence: { eigenvalues: { attempted: MIN_TOPIC_ATTEMPTS_FOR_SKIP_EV - 1, correct: 7 } },
    });
    expect(r.top_decisions).toEqual([]);
  });

  it('prices it at the expected marks foregone once the evidence is there', () => {
    const r = computeAttemptCounterfactual({
      perQuestion: oneSkip,
      params: PARAMS,
      topicEvidence: { eigenvalues: { attempted: 10, correct: 6 } },
    });
    expect(r.top_decisions).toHaveLength(1);
    const d = r.top_decisions[0];
    expect(d.decision).toBe('skipped_positive_ev');
    expect(d.accuracy).toBeCloseTo(0.6, 3);
    expect(d.topic_attempts).toBe(10);
    // 0.6·2 + 0.4·(-2/3) = 0.9333
    expect(d.cost_marks).toBeCloseTo(0.93, 2);
    expect(d.detail).toContain('60%');
  });

  it('does not flag a skip that was the right call — below break-even attempting loses marks', () => {
    const r = computeAttemptCounterfactual({
      perQuestion: oneSkip,
      params: PARAMS,
      topicEvidence: { eigenvalues: { attempted: 20, correct: 2 } },  // 10%, below the 25% break-even
    });
    expect(r.top_decisions).toEqual([]);
    expect(r.state).toBe('clean');
  });

  it('flags any skipped NAT with evidence — there is no penalty to weigh against', () => {
    const r = computeAttemptCounterfactual({
      perQuestion: [
        q({ id: 'a' }), q({ id: 'b' }), q({ id: 'c' }),
        q({ id: 'n', kind: 'nat', marks: 1, earned: 0, skipped: true }),
      ],
      params: PARAMS,
      topicEvidence: { eigenvalues: { attempted: 20, correct: 2 } },
    });
    expect(r.top_decisions).toHaveLength(1);
    expect(r.top_decisions[0].detail).toContain('no penalty for a wrong answer');
  });
});

describe('drill concept', () => {
  it('points at the costliest decision that carries a concept', () => {
    const r = computeAttemptCounterfactual({
      perQuestion: [
        wrongMcq2('small', { marks: 1, earned: -(1 / 3), conceptId: 'la-01' }),
        q({ id: 'big', kind: 'mcq', marks: 5, earned: -(5 / 3), conceptId: 'la-09' }),
      ],
      params: PARAMS,
    });
    expect(r.drill_concept_id).toBe('la-09');
  });

  it('falls back to any question with a concept when no decision carries one', () => {
    const r = computeAttemptCounterfactual({
      perQuestion: [q({ id: 'a', conceptId: 'la-03' })],
      params: PARAMS,
    });
    expect(r.drill_concept_id).toBe('la-03');
  });

  it('is null for a paper drawn entirely from unmapped questions', () => {
    const r = computeAttemptCounterfactual({
      perQuestion: [wrongMcq2('a', { conceptId: null })],
      params: PARAMS,
    });
    expect(r.drill_concept_id).toBeNull();
  });
});

describe('totals', () => {
  it('sums earned and max across every gradable question, negatives included', () => {
    const r = computeAttemptCounterfactual({
      perQuestion: [
        q({ id: 'a', marks: 2, earned: 2 }),
        wrongMcq2('b'),
        q({ id: 's', marks: 1, earned: 0, skipped: true }),
      ],
      params: PARAMS,
    });
    expect(r.earned).toBeCloseTo(1.33, 2);
    expect(r.max_available).toBe(5);
    expect(r.attempted).toBe(2);
    expect(r.skipped).toBe(1);
    expect(r.graded_questions).toBe(3);
    expect(r.beats.earned).toBe('You scored 1.33 of 5 marks.');
  });
});
