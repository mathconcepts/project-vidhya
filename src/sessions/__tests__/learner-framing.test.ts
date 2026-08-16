/**
 * Locks the persona axis for generated explanations.
 *
 * The bug these guard: the previous thinking-gap service accepted a
 * `top_misconceptions` array, hashed it into the cache key, and never put it
 * in the prompt. The signal was collected and discarded, so every student got
 * identical text. The most important assertions here are therefore the ones
 * that check the prompt CONTENT, not just the derivation — a framing that
 * doesn't reach the model is the same bug wearing a new type.
 */
import { describe, it, expect } from 'vitest';
import {
  deriveFraming,
  framingSignature,
  framingInstructions,
  allFramingSignatures,
  bandFor,
  DEFAULT_FRAMING,
  BUILDING_AT,
  SOLID_AT,
  SHAKEN_AFTER_FAILURES,
} from '../learner-framing';
import { buildGapPrompt } from '../thinking-gap-service';

const CONCEPT = 'eigenvalues';

describe('bandFor', () => {
  it('splits at the declared thresholds', () => {
    expect(bandFor(0)).toBe('cold');
    expect(bandFor(BUILDING_AT - 0.001)).toBe('cold');
    expect(bandFor(BUILDING_AT)).toBe('building');
    expect(bandFor(SOLID_AT - 0.001)).toBe('building');
    expect(bandFor(SOLID_AT)).toBe('solid');
    expect(bandFor(1)).toBe('solid');
  });
});

describe('deriveFraming', () => {
  it('returns the generic default for an unknown student', () => {
    expect(deriveFraming(null, CONCEPT)).toEqual(DEFAULT_FRAMING);
    expect(deriveFraming(undefined, CONCEPT)).toEqual(DEFAULT_FRAMING);
  });

  it('reads mastery for the concept being answered, not some other concept', () => {
    const model = {
      mastery_vector: { 'determinants': { score: 0.9 }, [CONCEPT]: { score: 0.1 } },
    };
    expect(deriveFraming(model, CONCEPT).band).toBe('cold');
    expect(deriveFraming(model, 'determinants').band).toBe('solid');
  });

  it('treats a frustrated student as shaken regardless of mastery', () => {
    const f = deriveFraming(
      { mastery_vector: { [CONCEPT]: { score: 0.95 } }, motivation_state: 'frustrated' },
      CONCEPT,
    );
    expect(f.band).toBe('solid');
    expect(f.stance).toBe('shaken');
  });

  it('falls back to the failure streak when motivation is still cold-start', () => {
    const steady = deriveFraming({ consecutive_failures: SHAKEN_AFTER_FAILURES - 1 }, CONCEPT);
    expect(steady.stance).not.toBe('shaken');
    const shaken = deriveFraming({ consecutive_failures: SHAKEN_AFTER_FAILURES }, CONCEPT);
    expect(shaken.stance).toBe('shaken');
  });

  it('does not call a struggling high-mastery student assured', () => {
    // solid + zero failures is the only path to assured via mastery, so a
    // single failure must be enough to drop the confident register.
    const f = deriveFraming(
      { mastery_vector: { [CONCEPT]: { score: 0.9 } }, consecutive_failures: 1 },
      CONCEPT,
    );
    expect(f.stance).toBe('steady');
  });

  it('ignores an unrecognised representation mode rather than passing it through', () => {
    expect(deriveFraming({ representation_mode: 'interpretive-dance' }, CONCEPT).mode).toBe('balanced');
    expect(deriveFraming({ representation_mode: 'geometric' }, CONCEPT).mode).toBe('geometric');
  });

  it('survives a malformed mastery entry', () => {
    const f = deriveFraming({ mastery_vector: { [CONCEPT]: {} as any } }, CONCEPT);
    expect(f.band).toBe('cold');
  });
});

describe('framingSignature', () => {
  it('is stable, readable, and enumerable', () => {
    expect(framingSignature({ band: 'building', stance: 'shaken', mode: 'geometric' }))
      .toBe('building/shaken/geometric');
    const all = allFramingSignatures();
    expect(all).toHaveLength(27);
    expect(new Set(all).size).toBe(27);
    expect(all).toContain(framingSignature(DEFAULT_FRAMING));
  });

  it('keeps the cache cohort-shaped — the space cannot grow per student', () => {
    // If this number ever climbs, the cache hit rate collapses and the runtime
    // LLM budget goes with it. Changing it should be a deliberate decision.
    expect(allFramingSignatures().length).toBeLessThanOrEqual(27);
  });
});

describe('framingInstructions', () => {
  it('gives materially different guidance to a shaken and an assured student', () => {
    const shaken = framingInstructions({ band: 'cold', stance: 'shaken', mode: 'balanced' });
    const assured = framingInstructions({ band: 'solid', stance: 'assured', mode: 'balanced' });
    expect(shaken).not.toBe(assured);
    expect(shaken.toLowerCase()).toContain('one concrete');
    expect(assured.toLowerCase()).toContain('terse');
  });

  it('tells the model not to comment on how a shaken student is feeling', () => {
    // Naming the anxiety back at an anxious student is the failure mode this
    // register is most likely to fall into.
    const shaken = framingInstructions({ band: 'cold', stance: 'shaken', mode: 'balanced' });
    expect(shaken.toLowerCase()).toContain('no pep talk');
  });

  it('adds nothing for a balanced representation mode', () => {
    const balanced = framingInstructions({ band: 'building', stance: 'steady', mode: 'balanced' });
    const geometric = framingInstructions({ band: 'building', stance: 'steady', mode: 'geometric' });
    expect(geometric.length).toBeGreaterThan(balanced.length);
    expect(geometric).toContain(balanced);
  });
});

describe('buildGapPrompt', () => {
  const BASE = {
    concept_id: CONCEPT,
    question: 'Find the eigenvalues of [[2,0],[0,3]].',
    expected_answer: '2, 3',
    user_answer: '-2, -3',
  };

  it('puts the framing instructions into the prompt', () => {
    // The whole point. A framing that never reaches the model is the original
    // bug with extra steps.
    const framing = { band: 'solid', stance: 'assured', mode: 'algebraic' } as const;
    const prompt = buildGapPrompt({ ...BASE, framing });
    expect(prompt).toContain(framingInstructions(framing));
  });

  it('produces different prompts for different learners on the same error', () => {
    const shaken = buildGapPrompt({
      ...BASE,
      framing: { band: 'cold', stance: 'shaken', mode: 'geometric' },
    });
    const assured = buildGapPrompt({
      ...BASE,
      framing: { band: 'solid', stance: 'assured', mode: 'algebraic' },
    });
    expect(shaken).not.toBe(assured);
  });

  it('includes the misconceptions it is given — the field the old version dropped', () => {
    const prompt = buildGapPrompt({
      ...BASE,
      top_misconceptions: ['sign flip when factoring', 'confuses trace with determinant'],
    });
    expect(prompt).toContain('sign flip when factoring');
    expect(prompt).toContain('confuses trace with determinant');
  });

  it('omits the misconception section entirely when there are none', () => {
    const prompt = buildGapPrompt(BASE);
    expect(prompt).not.toContain('Errors this student has been making lately');
  });

  it('caps the misconception list so the prompt cannot grow without bound', () => {
    const prompt = buildGapPrompt({
      ...BASE,
      top_misconceptions: ['a1', 'b2', 'c3', 'd4', 'e5'],
    });
    expect(prompt).toContain('a1');
    expect(prompt).not.toContain('d4');
    expect(prompt).not.toContain('e5');
  });

  it('still names the student\'s actual answer', () => {
    expect(buildGapPrompt(BASE)).toContain('-2, -3');
  });

  it('forbids opening with praise or reassurance', () => {
    expect(buildGapPrompt(BASE).toLowerCase()).toContain('do not open with praise');
  });

  it('falls back to the generic framing rather than throwing when none is given', () => {
    const prompt = buildGapPrompt(BASE);
    expect(prompt).toContain(framingInstructions(DEFAULT_FRAMING));
  });
});
