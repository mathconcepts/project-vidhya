/**
 * The judge, and the harness that decides whether the judge may be trusted.
 *
 * What is testable here is everything except the model's actual judgement: the
 * rubric it is given, the parse of what comes back, the refusal to grade its
 * own generator's output, and the scoring that would catch a judge which
 * rubber-stamps. The model's judgement itself is only measurable against a live
 * provider, and none is reachable from this environment — so `scoreJudge` is
 * exercised against stubs whose behaviour is known, including the two stubs
 * that represent the ways a real judge fails.
 */
import { describe, it, expect, vi } from 'vitest';
import {
  buildJudgePrompt,
  parseJudgeResponse,
  pickJudgeProvider,
  makeJudge,
  SURVIVAL_CRITERIA,
  JUDGED_ATOM_TYPES,
} from '../variant-judge';
import {
  EVAL_PAIRS,
  scoreJudge,
  meetsPromotionBar,
  JUDGE_PROMOTION_BAR,
} from '../eval-set';

describe('the judge is not the generator', () => {
  it('refuses to grade output from its own provider', () => {
    expect(pickJudgeProvider('anthropic', ['anthropic'])).toBeNull();
  });

  it('picks a configured provider that is not the generator', () => {
    expect(pickJudgeProvider('anthropic', ['anthropic', 'google-gemini'])).toBe('google-gemini');
    expect(pickJudgeProvider('google-gemini', ['anthropic', 'google-gemini'])).toBe('anthropic');
  });

  it('returns null rather than falling back to the generator', () => {
    // Null means "no judge", and the generator turns no judge into a refusal.
    // Returning the generator's own provider here would look like a working
    // gate while being a model reviewing itself.
    expect(pickJudgeProvider('openai', ['openai'])).toBeNull();
    expect(pickJudgeProvider('openai', [])).toBeNull();
  });

  it('ignores providers that are not configured', () => {
    expect(pickJudgeProvider('anthropic', ['groq'])).toBeNull();
  });
});

describe('the rubric asks about omission, not only contradiction', () => {
  it('has a written criterion for every atom type the cadence generates', () => {
    for (const t of JUDGED_ATOM_TYPES) {
      expect(SURVIVAL_CRITERIA[t], `${t} needs its own criterion`).toBeTruthy();
    }
  });

  it('asks a hook about the lost reason, not about lost hypotheses', () => {
    // A hook carries no theorem. Judging it for dropped conditions passes every
    // hook ever written, which is how 194 hook variants end up nominally gated.
    expect(SURVIVAL_CRITERIA.hook).toMatch(/reason/i);
    expect(SURVIVAL_CRITERIA.hook).toMatch(/do not look for dropped hypotheses/i);
  });

  it('asks a worked example about conditions that disappeared', () => {
    expect(SURVIVAL_CRITERIA.worked_example).toMatch(/invertibility/i);
    expect(SURVIVAL_CRITERIA.worked_example).toMatch(/may not silently disappear/i);
  });

  it('tells the judge that brevity is expected and is not a finding', () => {
    // Without this the judge reports "omits substantial explanation" on every
    // shaken pair — true, the point, and useless.
    const p = buildJudgePrompt({ baseBody: 'a', variantBody: 'b', atomType: 'intuition' });
    expect(p).toMatch(/NOT findings/);
    expect(p).toMatch(/intended to be shorter/i);
  });

  it('carries the atom-type criterion and both bodies', () => {
    const p = buildJudgePrompt({
      baseBody: 'ORIGINAL TEXT HERE',
      variantBody: 'REWRITE TEXT HERE',
      atomType: 'hook',
    });
    expect(p).toContain(SURVIVAL_CRITERIA.hook);
    expect(p).toContain('ORIGINAL TEXT HERE');
    expect(p).toContain('REWRITE TEXT HERE');
  });

  it('falls back to a generic criterion for an unknown atom type', () => {
    const p = buildJudgePrompt({ baseBody: 'a', variantBody: 'b', atomType: 'micro_exercise' });
    expect(p).toMatch(/must not drop a condition/i);
  });
});

describe('parsing the verdict', () => {
  it('reads a bare agreement', () => {
    expect(parseJudgeResponse('{"agrees": true}')).toEqual({ agrees: true, reason: undefined });
  });

  it('reads a disagreement with its reason', () => {
    expect(parseJudgeResponse('{"agrees": false, "reason": "drops invertibility"}')).toEqual({
      agrees: false,
      reason: 'drops invertibility',
    });
  });

  it('tolerates a code fence', () => {
    expect(parseJudgeResponse('```json\n{"agrees": true}\n```').agrees).toBe(true);
  });

  it('tolerates prose around the object', () => {
    expect(parseJudgeResponse('Here is my verdict:\n{"agrees": false, "reason": "x"}\nHope that helps.').agrees).toBe(false);
  });

  it('drops an empty reason rather than recording a blank one', () => {
    expect(parseJudgeResponse('{"agrees": false, "reason": "   "}').reason).toBeUndefined();
  });

  // The throws below all become refusals in generateVariant. That is the point:
  // an unreadable answer is not an approval.
  it('THROWS on an empty response', () => {
    expect(() => parseJudgeResponse('')).toThrow(/empty/i);
    expect(() => parseJudgeResponse(null)).toThrow(/empty/i);
  });

  it('THROWS on prose with no JSON', () => {
    expect(() => parseJudgeResponse('Looks fine to me.')).toThrow(/no JSON object/i);
  });

  it('THROWS on malformed JSON', () => {
    expect(() => parseJudgeResponse('{"agrees": tru}')).toThrow(/not valid JSON/i);
  });

  it('THROWS on an unterminated object', () => {
    expect(() => parseJudgeResponse('{"agrees": tru')).toThrow(/no JSON object/i);
  });

  it('THROWS when agrees is missing', () => {
    expect(() => parseJudgeResponse('{"reason": "seems ok"}')).toThrow(/no boolean "agrees"/i);
  });

  it('THROWS when agrees is a string, rather than coercing it', () => {
    // "false" is truthy. Coercing here would turn a rejection into an approval.
    expect(() => parseJudgeResponse('{"agrees": "false"}')).toThrow(/no boolean "agrees"/i);
    expect(() => parseJudgeResponse('{"agrees": "true"}')).toThrow(/no boolean "agrees"/i);
  });

  it('reads a lone verdict wrapped in an array', () => {
    // Brace-slicing finds the object inside. Unambiguous — there is exactly one
    // verdict — so reading it is safer than refusing a working judge over
    // punctuation.
    expect(parseJudgeResponse('[{"agrees": true}]').agrees).toBe(true);
  });

  it('THROWS on two verdicts rather than picking one', () => {
    // Slicing first-brace to last-brace across two objects yields invalid JSON,
    // which is the outcome we want: an ambiguous answer is not an approval.
    expect(() => parseJudgeResponse('[{"agrees": true},{"agrees": false}]')).toThrow(
      /not valid JSON/i,
    );
  });

  it('THROWS when prose surrounds braces that are not a verdict', () => {
    expect(() => parseJudgeResponse('I would say {mostly fine} overall.')).toThrow(
      /not valid JSON/i,
    );
    // And braces that DO parse but carry no verdict.
    expect(() => parseJudgeResponse('verdict: {"ok": "yes"}')).toThrow(/no boolean "agrees"/i);
  });

  it('does not echo an unbounded response into the error', () => {
    const huge = `garbage ${'x'.repeat(5000)}`;
    expect(() => parseJudgeResponse(huge)).toThrow(/…/);
    try {
      parseJudgeResponse(huge);
    } catch (e) {
      expect((e as Error).message.length).toBeLessThan(300);
    }
  });
});

describe('makeJudge', () => {
  it('passes the built prompt to the model and parses what comes back', async () => {
    const model = { generate: vi.fn().mockResolvedValue('{"agrees": true}') };
    const judge = makeJudge(model);
    const v = await judge({ baseBody: 'A', variantBody: 'B', atomType: 'hook' });
    expect(v.agrees).toBe(true);
    expect(model.generate.mock.calls[0][0]).toContain(SURVIVAL_CRITERIA.hook);
  });

  it('lets a model failure propagate, so the generator refuses', async () => {
    const model = { generate: vi.fn().mockRejectedValue(new Error('429 rate limited')) };
    await expect(
      makeJudge(model)({ baseBody: 'A', variantBody: 'B', atomType: 'hook' }),
    ).rejects.toThrow(/429/);
  });

  it('treats a null response as a failure, not as approval', async () => {
    const model = { generate: vi.fn().mockResolvedValue(null) };
    await expect(
      makeJudge(model)({ baseBody: 'A', variantBody: 'B', atomType: 'hook' }),
    ).rejects.toThrow(/empty/i);
  });
});

describe('the eval set', () => {
  it('has forty pairs, ten of them corrupted', () => {
    expect(EVAL_PAIRS).toHaveLength(40);
    expect(EVAL_PAIRS.filter((p) => !p.shouldAgree)).toHaveLength(10);
  });

  it('covers all three cadence atom types on both sides of the label', () => {
    for (const t of JUDGED_ATOM_TYPES) {
      expect(EVAL_PAIRS.some((p) => p.atomType === t && p.shouldAgree)).toBe(true);
      expect(EVAL_PAIRS.some((p) => p.atomType === t && !p.shouldAgree)).toBe(true);
    }
  });

  it('names the corruption on every corrupted pair', () => {
    for (const p of EVAL_PAIRS.filter((x) => !x.shouldAgree)) {
      expect(p.corruption, `${p.id} must say what was broken`).toBeTruthy();
    }
  });

  it('uses unique ids', () => {
    expect(new Set(EVAL_PAIRS.map((p) => p.id)).size).toBe(EVAL_PAIRS.length);
  });

  it('never leaves base and variant identical', () => {
    // An identical pair is not a test of anything — the judge would agree for
    // the wrong reason.
    for (const p of EVAL_PAIRS) {
      expect(p.base.trim(), p.id).not.toBe(p.variant.trim());
    }
  });

  it('builds corrupted pairs by breaking one thing, from a real base', () => {
    // Each corruption should share its base with a legitimate pair, so the only
    // difference under test is the corruption itself.
    const legitBases = new Set(EVAL_PAIRS.filter((p) => p.shouldAgree).map((p) => p.base));
    const grounded = EVAL_PAIRS.filter((p) => !p.shouldAgree && legitBases.has(p.base));
    expect(grounded.length).toBeGreaterThanOrEqual(8);
  });
});

describe('scoreJudge catches the judges that must not gate', () => {
  const agreeAlways = async () => ({ agrees: true });
  const rejectAlways = async () => ({ agrees: false });
  const throwAlways = async () => {
    throw new Error('unavailable');
  };

  it('gives a rubber-stamp judge zero recall and refuses to promote it', async () => {
    const r = await scoreJudge(agreeAlways);
    expect(r.recall).toBe(0);
    expect(r.precision).toBe(1);
    expect(meetsPromotionBar(r)).toBe(false);
    expect(r.failures).toHaveLength(10);
  });

  it('gives a reject-everything judge perfect recall and still refuses it', async () => {
    // This is why recall alone cannot be the bar. Perfect recall, and every one
    // of 566 variants lands in the draft folder for a human to read.
    const r = await scoreJudge(rejectAlways);
    expect(r.recall).toBe(1);
    expect(r.precision).toBe(0);
    expect(meetsPromotionBar(r)).toBe(false);
  });

  it('scores a judge that is merely broken as reject-everything, not as passing', async () => {
    const r = await scoreJudge(throwAlways);
    expect(r.recall).toBe(1);
    expect(r.precision).toBe(0);
    expect(meetsPromotionBar(r)).toBe(false);
    expect(r.failures.every((f) => f.got === 'threw')).toBe(true);
  });

  it('promotes a judge that gets every label right', async () => {
    const oracle = async (i: { baseBody: string; variantBody: string }) => ({
      agrees: EVAL_PAIRS.find((p) => p.base === i.baseBody && p.variant === i.variantBody)!.shouldAgree,
    });
    const r = await scoreJudge(oracle);
    expect(r).toMatchObject({ recall: 1, precision: 1, failures: [] });
    expect(meetsPromotionBar(r)).toBe(true);
  });

  it('refuses a judge that misses a single corruption', async () => {
    // Ten corruptions, one missed, is roughly fifty-six wrong statements across
    // 566 variants. The bar is absolute for exactly this reason.
    const missOne = async (i: { baseBody: string; variantBody: string }) => {
      const p = EVAL_PAIRS.find((x) => x.base === i.baseBody && x.variant === i.variantBody)!;
      return { agrees: p.id === 'bad-dropped-nonzero' ? true : p.shouldAgree };
    };
    const r = await scoreJudge(missOne);
    expect(r.recall).toBeCloseTo(0.9);
    expect(meetsPromotionBar(r)).toBe(false);
    expect(r.failures[0]).toMatchObject({ id: 'bad-dropped-nonzero', expected: false, got: true });
  });

  it('tolerates a few false rejections, which cost only a human read', async () => {
    const fussy = async (i: { baseBody: string; variantBody: string }) => {
      const p = EVAL_PAIRS.find((x) => x.base === i.baseBody && x.variant === i.variantBody)!;
      return { agrees: p.shouldAgree && !p.id.startsWith('ok-we-merged') };
    };
    const r = await scoreJudge(fussy);
    expect(r.recall).toBe(1);
    expect(r.precision).toBeGreaterThanOrEqual(JUDGE_PROMOTION_BAR.precision);
    expect(meetsPromotionBar(r)).toBe(true);
  });

  it('reports what it scored rather than an averaged accuracy', async () => {
    const r = await scoreJudge(agreeAlways);
    expect(r.total).toBe(40);
    // A single accuracy number would read 0.75 here, which looks acceptable and
    // means the gate is entirely off.
    expect(r).not.toHaveProperty('accuracy');
  });
});
