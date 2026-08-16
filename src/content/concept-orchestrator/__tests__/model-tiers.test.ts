/**
 * Which model generates which atom.
 *
 * The saving this enables is real but small; the risk it introduces is that a
 * reasoning atom quietly ends up on the cheap model and ships a wrong answer
 * to a student. So most of these tests are about the classification refusing
 * to drift in that direction.
 */
import { describe, it, expect } from 'vitest';
import {
  TIER_BY_ATOM_TYPE,
  DEFAULT_TIER_MODELS,
  tierFor,
  resolveModelForAtom,
  sanitiseTierModels,
  consensusAtomsAreThinking,
} from '../model-tiers';
import { requiresConsensus } from '../multi-llm-consensus';
import type { AtomType } from '../../content-types';

const ALL_ATOM_TYPES: AtomType[] = [
  'hook',
  'intuition',
  'formal_definition',
  'visual_analogy',
  'worked_example',
  'micro_exercise',
  'common_traps',
  'retrieval_prompt',
  'interleaved_drill',
  'mnemonic',
  'exam_pattern',
];

describe('tier classification', () => {
  it('classifies every atom type', () => {
    // The Record type makes this a compile error too, but a runtime check
    // catches a type widened by a later edit.
    for (const t of ALL_ATOM_TYPES) {
      expect(TIER_BY_ATOM_TYPE[t], `${t} is unclassified`).toBeDefined();
    }
  });

  it('never puts a consensus atom on the formatting tier', () => {
    // requiresConsensus() is the codebase's existing statement about where
    // correctness is load-bearing enough to pay for a second model. If a
    // future edit adds a consensus atom without adding it here, this fails
    // rather than silently routing it to the cheap model.
    expect(consensusAtomsAreThinking(ALL_ATOM_TYPES)).toBe(true);
    for (const t of ALL_ATOM_TYPES) {
      if (requiresConsensus(t)) expect(tierFor(t)).toBe('thinking');
    }
  });

  it('puts the atoms that carry a markable answer on the thinking tier', () => {
    // micro_exercise ships an expected answer a student is marked against,
    // so a wrong one is a wrong mark.
    for (const t of ['formal_definition', 'worked_example', 'micro_exercise', 'interleaved_drill'] as AtomType[]) {
      expect(tierFor(t), `${t} should be thinking`).toBe('thinking');
    }
  });

  it('puts explanation atoms on the thinking tier', () => {
    // A subtly wrong analogy teaches a misconception that is harder to remove
    // than absence would have been.
    expect(tierFor('intuition')).toBe('thinking');
    expect(tierFor('visual_analogy')).toBe('thinking');
  });

  it('puts shape-driven atoms on the formatting tier', () => {
    for (const t of ['hook', 'mnemonic', 'retrieval_prompt', 'common_traps', 'exam_pattern'] as AtomType[]) {
      expect(tierFor(t), `${t} should be formatting`).toBe('formatting');
    }
  });

  it('defaults an unknown atom type to thinking, not to cheap', () => {
    // Being wrong in the expensive direction is recoverable; being wrong in
    // the cheap direction ships bad maths.
    expect(tierFor('something-new' as AtomType)).toBe('thinking');
  });
});

describe('resolveModelForAtom', () => {
  it('uses the configured defaults when a run says nothing', () => {
    expect(resolveModelForAtom('worked_example')).toBe(DEFAULT_TIER_MODELS.thinking);
    expect(resolveModelForAtom('hook')).toBe(DEFAULT_TIER_MODELS.formatting);
  });

  it('defaults thinking to a model that is actually configured', () => {
    // No Opus id exists in config/providers.yaml; naming one throws
    // ModelRetiredError at generation time rather than falling back.
    expect(DEFAULT_TIER_MODELS.thinking).toBe('claude-sonnet-4-5');
    expect(DEFAULT_TIER_MODELS.formatting).toBe('claude-haiku-4-5');
  });

  it('honours an operator per-tier selection', () => {
    const tierModels = { thinking: 'gemini-2.5-pro', formatting: 'gpt-4o-mini' };
    expect(resolveModelForAtom('formal_definition', { tierModels })).toBe('gemini-2.5-pro');
    expect(resolveModelForAtom('mnemonic', { tierModels })).toBe('gpt-4o-mini');
  });

  it('falls back per-tier, not all-or-nothing', () => {
    // An operator who set only one tier gets the default for the other.
    const tierModels = { thinking: 'gemini-2.5-pro' };
    expect(resolveModelForAtom('worked_example', { tierModels })).toBe('gemini-2.5-pro');
    expect(resolveModelForAtom('hook', { tierModels })).toBe(DEFAULT_TIER_MODELS.formatting);
  });

  it('lets an explicit single model win over both tiers', () => {
    // The pre-tier behaviour. A run that pins a model is making a deliberate
    // statement about the whole batch.
    const opts = { tierModels: { thinking: 'a', formatting: 'b' }, explicitModelId: 'pinned' };
    expect(resolveModelForAtom('worked_example', opts)).toBe('pinned');
    expect(resolveModelForAtom('hook', opts)).toBe('pinned');
  });
});

describe('sanitiseTierModels', () => {
  it('accepts a well-formed selection', () => {
    const r = sanitiseTierModels({ thinking: 'gemini-2.5-pro', formatting: 'gpt-4o-mini' });
    expect(r.models).toEqual({ thinking: 'gemini-2.5-pro', formatting: 'gpt-4o-mini' });
    expect(r.warnings).toEqual([]);
  });

  it('drops an unknown tier and says so', () => {
    // A run that believes it selected a model but did not is worse than one
    // told its input was ignored.
    const r = sanitiseTierModels({ thinking: 'x', wishful: 'y' });
    expect(r.models).toEqual({ thinking: 'x' });
    expect(r.warnings.join(' ')).toContain('wishful');
  });

  it('drops an empty or non-string model id and says so', () => {
    const r = sanitiseTierModels({ thinking: '   ', formatting: 42 });
    expect(r.models).toEqual({});
    expect(r.warnings).toHaveLength(2);
  });

  it('tolerates rubbish input rather than throwing', () => {
    for (const junk of [null, undefined, 'string', 7, []]) {
      expect(() => sanitiseTierModels(junk)).not.toThrow();
    }
  });

  it('trims whitespace off a model id', () => {
    expect(sanitiseTierModels({ thinking: '  gemini-2.5-pro ' }).models.thinking).toBe('gemini-2.5-pro');
  });
});
