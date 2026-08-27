/**
 * Conformance suite for the MarkingStrategy seam (plan D11).
 *
 * This is the `conformance_test_path` seam-registry.json points at for
 * `marking-strategy`. It runs the shared contract against the one strategy
 * this build ships, and pins the registry behaviour a second implementation
 * will depend on — most importantly that an unregistered id is refused BY
 * NAME rather than silently falling back to whatever the scorer does.
 */

import { describe, it, expect, afterEach } from 'vitest';
import {
  deterministicMarkingStrategy,
  listMarkingStrategyIds,
  registerMarkingStrategy,
  resolveMarkingStrategy,
  unknownMarkingStrategyMessage,
  __resetMarkingStrategyRegistryForTests,
  type MarkingStrategy,
} from '../marking-strategy';
import {
  runMarkingStrategyContract,
  type MarkingStrategyFixture,
} from '../marking-strategy-contract';
import { COMPILED_ASSESSMENT_CONTRACT } from '../../exams/marking-constants';

const MARKING = COMPILED_ASSESSMENT_CONTRACT.marking;

// ────────────────────────────────────────────────────────────────────
// The shared contract, run once per question kind the strategy claims.
// Params come from the compiled contract — the same values the seed row
// carries — so the contract is exercised on real contract data, not on a
// fixture invented for the test.
// ────────────────────────────────────────────────────────────────────

const mcqFixture: MarkingStrategyFixture = {
  item: { id: 'c-mcq', kind: 'mcq', marks: 1, answerIndex: 2, options: ['a', 'b', 'c', 'd'] },
  params: MARKING.mcq.params as unknown as Record<string, unknown>,
  correct: { kind: 'mcq', selectedIndex: 2 },
  wrong: { kind: 'mcq', selectedIndex: 0 },
  skipped: { kind: 'mcq', skipped: true },
  expectedWrongMarks: -(1 / 3),
  unsupportedKind: 'descriptive',
};

const msqFixture: MarkingStrategyFixture = {
  item: { id: 'c-msq', kind: 'msq', marks: 2, answerIndices: [0, 3], options: ['a', 'b', 'c', 'd'] },
  params: MARKING.msq.params as unknown as Record<string, unknown>,
  correct: { kind: 'msq', selectedIndices: [0, 3] },
  wrong: { kind: 'msq', selectedIndices: [0, 1] },
  skipped: { kind: 'msq', skipped: true },
  expectedWrongMarks: 0,
  unsupportedKind: 'descriptive',
};

const natFixture: MarkingStrategyFixture = {
  item: { id: 'c-nat', kind: 'nat', marks: 2, answerRange: [3.14, 3.15] },
  params: MARKING.nat.params as unknown as Record<string, unknown>,
  correct: { kind: 'nat', value: 3.145 },
  wrong: { kind: 'nat', value: 9 },
  skipped: { kind: 'nat', skipped: true },
  expectedWrongMarks: 0,
  unsupportedKind: 'descriptive',
};

describe('gate_2026 strategy — mcq', () => {
  runMarkingStrategyContract(deterministicMarkingStrategy, mcqFixture);
});

describe('gate_2026 strategy — msq', () => {
  runMarkingStrategyContract(deterministicMarkingStrategy, msqFixture);
});

describe('gate_2026 strategy — nat', () => {
  runMarkingStrategyContract(deterministicMarkingStrategy, natFixture);
});

// ────────────────────────────────────────────────────────────────────
// Registry
// ────────────────────────────────────────────────────────────────────

describe('MarkingStrategy registry', () => {
  afterEach(() => {
    __resetMarkingStrategyRegistryForTests();
  });

  it('ships the built-in strategy registered under its contract id', () => {
    expect(resolveMarkingStrategy('gate_2026')).toBe(deterministicMarkingStrategy);
    expect(listMarkingStrategyIds()).toContain('gate_2026');
  });

  it('returns undefined for an id nobody registered — never a default strategy', () => {
    expect(resolveMarkingStrategy('jee_adv_2027')).toBeUndefined();
  });

  it('refuses an unknown id by name, and names what would have worked (D8)', () => {
    expect(unknownMarkingStrategyMessage('jee_adv_2027')).toBe(
      "marking_strategy 'jee_adv_2027' is not registered; known: gate_2026",
    );
  });

  it('accepts a second strategy and lists both', () => {
    const stub: MarkingStrategy = {
      id: 'contract_test_stub',
      description: 'test double',
      supportedKinds: ['mcq'],
      async grade() {
        return {
          earned: 0, max: 0, perCriterion: {}, feedback: '', confidence: 1, casFinalAnswerCorrect: false,
        };
      },
    };
    registerMarkingStrategy(stub);
    expect(listMarkingStrategyIds()).toEqual(['contract_test_stub', 'gate_2026']);
    expect(unknownMarkingStrategyMessage('nope')).toBe(
      "marking_strategy 'nope' is not registered; known: contract_test_stub, gate_2026",
    );
  });

  it('refuses a duplicate id rather than letting import order decide', () => {
    const impostor: MarkingStrategy = {
      id: 'gate_2026',
      description: 'a different implementation claiming the same id',
      supportedKinds: ['mcq'],
      async grade() {
        return {
          earned: 99, max: 1, perCriterion: {}, feedback: '', confidence: 1, casFinalAnswerCorrect: true,
        };
      },
    };
    expect(() => registerMarkingStrategy(impostor)).toThrow(/already registered/);
  });

  it('re-registering the same object is a no-op, so double-import is safe', () => {
    expect(() => registerMarkingStrategy(deterministicMarkingStrategy)).not.toThrow();
  });
});

// ────────────────────────────────────────────────────────────────────
// Params drive the numbers — the whole point of the strategy/params split
// ────────────────────────────────────────────────────────────────────

describe('gate_2026 strategy — contract params drive the numbers', () => {
  const item = { id: 'p1', kind: 'mcq', marks: 1, answerIndex: 0, options: ['a', 'b'] };

  it('applies a per-mark-value negative straight out of the params', async () => {
    const r = await deterministicMarkingStrategy.grade(
      item,
      { kind: 'mcq', selectedIndex: 1 },
      { marks_wrong_by_marks: { '1': -0.25 }, marks_wrong_fallback_divisor: 3 },
    );
    expect(r.earned).toBeCloseTo(-0.25, 12);
  });

  it('falls back to the params divisor for a mark value the table has no row for', async () => {
    const r = await deterministicMarkingStrategy.grade(
      { ...item, marks: 4 },
      { kind: 'mcq', selectedIndex: 1 },
      { marks_wrong_by_marks: { '1': -0.25 }, marks_wrong_fallback_divisor: 4 },
    );
    expect(r.earned).toBeCloseTo(-1, 12);
  });

  it('grades on the compiled defaults when the contract supplies no params', async () => {
    const r = await deterministicMarkingStrategy.grade(item, { kind: 'mcq', selectedIndex: 1 });
    expect(r.earned).toBeCloseTo(-(1 / 3), 12);
  });
});

// ────────────────────────────────────────────────────────────────────
// Refusals — params describing rules this strategy cannot apply
// ────────────────────────────────────────────────────────────────────

describe('gate_2026 strategy — refuses params it cannot honour', () => {
  it('refuses MSQ negative marking rather than grading it as zero-penalty', async () => {
    await expect(
      deterministicMarkingStrategy.grade(
        msqFixture.item,
        msqFixture.wrong,
        { marks_wrong: -1, partial_credit: false },
      ),
    ).rejects.toThrow(/cannot apply MSQ negative marking \(params\.marks_wrong = -1, required: 0\)/);
  });

  it('refuses numeric negative marking rather than silently dropping it', async () => {
    await expect(
      deterministicMarkingStrategy.grade(
        natFixture.item,
        natFixture.wrong,
        { marks_wrong: -1, tolerance_epsilon: 1e-9 },
      ),
    ).rejects.toThrow(/cannot apply negative marking to a numeric answer/);
  });

  it('refuses a numeric tolerance it does not implement rather than using its own', async () => {
    await expect(
      deterministicMarkingStrategy.grade(
        natFixture.item,
        natFixture.correct,
        { marks_wrong: 0, tolerance_epsilon: 0.01 },
      ),
    ).rejects.toThrow(/fixed numeric tolerance/);
  });

  it('passes partial_credit through to the scorer, which refuses it', async () => {
    await expect(
      deterministicMarkingStrategy.grade(
        msqFixture.item,
        msqFixture.wrong,
        { marks_wrong: 0, partial_credit: true },
      ),
    ).rejects.toThrow(/partial_credit/);
  });
});
