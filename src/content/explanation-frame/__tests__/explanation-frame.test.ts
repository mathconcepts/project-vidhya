/**
 * Explanation Frame — contract + composition tests.
 *
 * The two guarantees are tested against REAL corpus concepts, not synthetic
 * fixtures, because the property being claimed ("the floor alone is a
 * reasonable explanation") is a claim about the content that actually
 * ships. A synthetic frame would only prove the code composes strings.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  composeExplanation,
  composeFloor,
  renderText,
  checkFrame,
  checkResolver,
  runExplanationFrameContract,
  registerResolver,
  resetResolvers,
  registerBuiltInResolvers,
  prerequisiteBridgeResolver,
  boardBridgeResolver,
  makeStanceBodyResolver,
  buildFrameForConcept,
  NO_SIGNALS,
  REQUIRED_ROLES,
  type ExplanationFrame,
  type SlotResolver,
} from '../index';

function frameOf(overrides: Partial<ExplanationFrame> = {}): ExplanationFrame {
  return {
    version: 1,
    concept_id: 'test-concept',
    slots: [
      { id: 'anchor', role: 'anchor', static_text: 'Used to size a beam so it does not sag.' },
      { id: 'core_idea', role: 'core_idea', static_text: 'The core idea.' },
      { id: 'worked_example', role: 'worked_example', static_text: 'Worked example.' },
      { id: 'trap', role: 'trap', static_text: 'The trap.' },
      { id: 'check', role: 'check', static_text: 'Your turn.' },
    ],
    ...overrides,
  };
}

beforeEach(() => {
  resetResolvers();
  registerBuiltInResolvers();
});

describe('checkFrame', () => {
  it('accepts a frame covering every required role', () => {
    expect(checkFrame(frameOf())).toEqual([]);
  });

  it('rejects a missing required role', () => {
    const f = frameOf({ slots: frameOf().slots.filter(s => s.role !== 'trap') });
    const codes = checkFrame(f).map(p => p.code);
    expect(codes).toContain('missing_required_role');
  });

  it('rejects an empty required slot — the floor would not hold', () => {
    const slots = frameOf().slots.map(s => (s.role === 'check' ? { ...s, static_text: '   ' } : s));
    const codes = checkFrame(frameOf({ slots })).map(p => p.code);
    expect(codes).toContain('required_role_empty');
  });

  it('rejects duplicate slot ids and unknown roles', () => {
    const f = frameOf({
      slots: [
        ...frameOf().slots,
        { id: 'anchor', role: 'anchor', static_text: 'dupe' },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        { id: 'odd', role: 'not_a_role' as any, static_text: 'x' },
      ],
    });
    const codes = checkFrame(f).map(p => p.code);
    expect(codes).toContain('duplicate_slot_id');
    expect(codes).toContain('unknown_role');
  });
});

describe('checkResolver', () => {
  it('accepts the built-ins', () => {
    expect(checkResolver(prerequisiteBridgeResolver)).toEqual([]);
    expect(checkResolver(boardBridgeResolver)).toEqual([]);
  });

  it('rejects a resolver that fires with no signals', () => {
    const bad: SlotResolver = {
      id: 'always_on',
      roles: ['board_bridge'],
      reads: 'nothing, which is the problem',
      resolve: () => 'I fire for everyone',
    };
    expect(checkResolver(bad).map(p => p.code)).toContain('fires_without_signals');
    expect(() => registerResolver(bad)).toThrow(/fires_without_signals/);
  });

  it('rejects a resolver that throws instead of declining', () => {
    const bad: SlotResolver = {
      id: 'thrower',
      roles: ['board_bridge'],
      reads: 'track_id',
      resolve: () => { throw new Error('boom'); },
    };
    expect(checkResolver(bad).map(p => p.code)).toContain('throws_on_no_signals');
  });

  it('rejects a resolver that does not say what it reads', () => {
    const bad: SlotResolver = { id: 'mystery', roles: ['board_bridge'], reads: '', resolve: () => null };
    expect(checkResolver(bad).map(p => p.code)).toContain('missing_reads');
  });
});

describe('G1 — the floor', () => {
  it('zero signals still yields every required role, non-empty', () => {
    const out = composeFloor(frameOf());
    for (const role of REQUIRED_ROLES) {
      const slot = out.slots.find(s => s.role === role);
      expect(slot, `required role ${role} must be present at the floor`).toBeDefined();
      expect(slot!.text.trim().length).toBeGreaterThan(0);
    }
    expect(out.enrichment_level).toBe(0);
    expect(out.slots.every(s => s.source === 'static')).toBe(true);
  });

  it('an empty optional slot does not render at the floor', () => {
    const f = frameOf({
      slots: [...frameOf().slots, { id: 'board_bridge', role: 'board_bridge', static_text: '', adaptive: ['board_bridge'] }],
    });
    expect(composeFloor(f).slots.find(s => s.role === 'board_bridge')).toBeUndefined();
  });

  it('an unregistered resolver id is a no-op, never a throw', () => {
    const slots = frameOf().slots.map(s =>
      s.id === 'core_idea' ? { ...s, adaptive: ['resolver_that_does_not_exist'] } : s,
    );
    const out = composeExplanation(frameOf({ slots }), { stance: 'shaken' });
    expect(out.slots.find(s => s.role === 'core_idea')!.text).toBe('The core idea.');
  });
});

describe('G2 — enrichment is monotonic', () => {
  it('more signal never empties a required role', () => {
    const rich = { stance: 'shaken', shaky_prerequisites: ['x'], track_id: 'TN-HSE-12-MATH' };
    const out = composeExplanation(frameOf(), rich);
    for (const role of REQUIRED_ROLES) {
      expect(out.slots.find(s => s.role === role)!.text.trim().length).toBeGreaterThan(0);
    }
  });

  it("a resolver returning '' is a decline, not a delete", () => {
    const blanker: SlotResolver = {
      id: 'blanker',
      roles: ['core_idea'],
      reads: 'stance',
      resolve: ctx => (ctx.signals.stance ? '' : null),
    };
    const slots = frameOf().slots.map(s => (s.id === 'core_idea' ? { ...s, adaptive: ['blanker'] } : s));
    const out = composeExplanation(frameOf({ slots }), { stance: 'shaken' }, [blanker]);
    expect(out.slots.find(s => s.role === 'core_idea')!.text).toBe('The core idea.');
    expect(out.enrichment_level).toBe(0);
  });

  it('a resolver that throws costs the learner nothing', () => {
    const thrower: SlotResolver = {
      id: 'late_thrower',
      roles: ['core_idea'],
      reads: 'stance',
      resolve: ctx => { if (ctx.signals.stance) throw new Error('boom'); return null; },
    };
    const slots = frameOf().slots.map(s => (s.id === 'core_idea' ? { ...s, adaptive: ['late_thrower'] } : s));
    const out = composeExplanation(frameOf({ slots }), { stance: 'shaken' }, [thrower]);
    expect(out.slots.find(s => s.role === 'core_idea')!.text).toBe('The core idea.');
  });

  it('enrichment_level counts only slots a resolver actually filled', () => {
    const local = [makeStanceBodyResolver({ shaken: { core_idea: 'Slower core idea.' } })];
    const slots = frameOf().slots.map(s => (s.id === 'core_idea' ? { ...s, adaptive: ['stance_body'] } : s));
    const floor = composeExplanation(frameOf({ slots }), NO_SIGNALS, local);
    const enriched = composeExplanation(frameOf({ slots }), { stance: 'shaken' }, local);
    expect(floor.enrichment_level).toBe(0);
    expect(enriched.enrichment_level).toBe(1);
    expect(enriched.slots.find(s => s.role === 'core_idea')!.text).toBe('Slower core idea.');
    expect(enriched.slots.find(s => s.role === 'core_idea')!.resolver_id).toBe('stance_body');
  });

  it("'steady' is the base file, not a variant", () => {
    const local = [makeStanceBodyResolver({ steady: { core_idea: 'should never be served' } })];
    const slots = frameOf().slots.map(s => (s.id === 'core_idea' ? { ...s, adaptive: ['stance_body'] } : s));
    const out = composeExplanation(frameOf({ slots }), { stance: 'steady' }, local);
    expect(out.slots.find(s => s.role === 'core_idea')!.text).toBe('The core idea.');
  });
});

describe('built-in resolvers read real signals', () => {
  it('prerequisite_bridge fires only for a prerequisite of THIS concept', () => {
    // Real graph data: eigenvalues declares determinants and
    // systems-of-equations upstream. jee-optics is in the graph but is not
    // upstream of anything here.
    const hit = prerequisiteBridgeResolver.resolve({
      concept_id: 'eigenvalues', slot_id: 'prerequisite_bridge', role: 'prerequisite_bridge',
      signals: { shaky_prerequisites: ['determinants'] }, static_text: '',
    });
    const miss = prerequisiteBridgeResolver.resolve({
      concept_id: 'eigenvalues', slot_id: 'prerequisite_bridge', role: 'prerequisite_bridge',
      signals: { shaky_prerequisites: ['jee-optics'] }, static_text: '',
    });
    expect(hit).toBeTruthy();
    expect(miss).toBeNull();
  });

  it('prerequisite_bridge never labels the student', () => {
    const text = prerequisiteBridgeResolver.resolve({
      concept_id: 'eigenvalues', slot_id: 'p', role: 'prerequisite_bridge',
      signals: { shaky_prerequisites: ['determinants'] }, static_text: '',
    })!;
    expect(text.toLowerCase()).not.toMatch(/\b(weak|behind|poor|struggling|failed)\b/);
  });

  it('board_bridge declines without a track', () => {
    expect(boardBridgeResolver.resolve({
      concept_id: 'jee-calculus', slot_id: 'b', role: 'board_bridge', signals: {}, static_text: '',
    })).toBeNull();
  });
});

describe('buildFrameForConcept — against the real corpus', () => {
  it('builds a contract-passing frame whose floor is complete', async () => {
    const { frame, missing, resolvers } = await buildFrameForConcept('eigenvalues');
    expect(missing).toEqual([]);
    expect(frame).not.toBeNull();
    expect(() =>
      runExplanationFrameContract(
        frame!,
        (f, s) => composeExplanation(f, s, resolvers),
        { stance: 'shaken', shaky_prerequisites: ['determinants'], track_id: 'TN-HSE-12-MATH' },
      ),
    ).not.toThrow();

    const floor = composeExplanation(frame!, NO_SIGNALS, resolvers);
    expect(floor.enrichment_level).toBe(0);
    expect(renderText(floor).length).toBeGreaterThan(200);
  });

  it('a shaken learner gets authored variant bodies, and the floor still holds', async () => {
    const { frame, resolvers } = await buildFrameForConcept('eigenvalues');
    const floor = composeExplanation(frame!, NO_SIGNALS, resolvers);
    const shaken = composeExplanation(frame!, { stance: 'shaken' }, resolvers);
    expect(shaken.enrichment_level).toBeGreaterThan(0);
    for (const role of REQUIRED_ROLES) {
      expect(shaken.slots.find(s => s.role === role)!.text.trim().length).toBeGreaterThan(0);
    }
    expect(renderText(shaken)).not.toBe(renderText(floor));
  });

  it('reports what is missing instead of padding it', async () => {
    const { frame, missing } = await buildFrameForConcept('a-concept-that-does-not-exist');
    expect(frame).toBeNull();
    expect(missing.length).toBeGreaterThan(0);
  });
});
