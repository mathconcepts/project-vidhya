/**
 * resonance-prompt.test.ts — resonance plan §W4: buildPrompt() fixture tests.
 *
 * Pins the two hard contracts eng review flagged (Appendix C, plan §W4):
 *   - the batch-only gate — 'personalized' generation_context must carry
 *     NO beat/trap/ghost instructions, ever (the P0 fix)
 *   - the literal prompt-cap string edit — "Keep total length under 400
 *     words." must be replaced with the carve-out sentence, not merely
 *     documented on the CI side (orchestrator.ts:443's own drift-class note)
 */
import { describe, it, expect } from 'vitest';
import { __testing } from '../orchestrator';

const { buildPrompt } = __testing;

function baseArgs(overrides: Partial<Parameters<typeof buildPrompt>[0]> = {}) {
  return {
    concept_id: 'eigenvalues',
    topic_family: 'linear-algebra',
    atom_type: 'hook' as const,
    template_scaffold: 'generic',
    template_guidance: '',
    pyq_context: '',
    ...overrides,
  };
}

describe('buildPrompt — resonance beat block (batch generation)', () => {
  it('a hook atom in (default) batch context gets the beat-scripting instruction and an interactive-spec schema example', () => {
    const prompt = buildPrompt(baseArgs({ atom_type: 'hook' }));
    expect(prompt).toContain('interactive-spec');
    expect(prompt).toContain('narration_steps');
    expect(prompt).toContain('trap');
    expect(prompt).toContain('ghost');
  });

  it('an intuition atom in batch context also gets the beat-scripting instruction', () => {
    const prompt = buildPrompt(baseArgs({ atom_type: 'intuition' }));
    expect(prompt).toContain('narration_steps');
    expect(prompt).toContain('trap');
  });

  it('includes the founder per-topic strategy block for a concept that resolves one (eigenvalues ← LA-06+LA-07)', () => {
    const prompt = buildPrompt(baseArgs({ atom_type: 'hook', concept_id: 'eigenvalues' }));
    expect(prompt).toContain('Per-topic attention strategy');
    expect(prompt).toContain('LA-06');
    expect(prompt).toContain('LA-07');
  });

  it('omits the per-topic strategy block (but keeps the beat instruction) for a concept with no atomic_id mapping', () => {
    const prompt = buildPrompt(baseArgs({ atom_type: 'hook', concept_id: 'svd', topic_family: 'linear-algebra' }));
    expect(prompt).not.toContain('Per-topic attention strategy');
    // The beat mechanism is independent of whether a per-topic strategy exists.
    expect(prompt).toContain('narration_steps');
  });

  it('a non-beat atom type (e.g. common_traps) never gets the resonance block, even in batch context', () => {
    const prompt = buildPrompt(baseArgs({ atom_type: 'common_traps' as any }));
    expect(prompt).not.toContain('narration_steps');
    expect(prompt).not.toContain('Fuse this into one experience');
    expect(prompt).toContain('keep the body focused on a single learning beat');
  });

  it('worked_example keeps its own unrelated closing instruction untouched', () => {
    const prompt = buildPrompt(baseArgs({ atom_type: 'worked_example' as any }));
    expect(prompt).toContain(':::verify');
    expect(prompt).not.toContain('narration_steps');
  });
});

describe('buildPrompt — personalized-regen exclusion (P0 fix)', () => {
  it('a hook atom under generation_context "personalized" carries NO beat/trap/ghost instructions', () => {
    const prompt = buildPrompt(baseArgs({ atom_type: 'hook', generation_context: 'personalized' }));
    expect(prompt).not.toContain('narration_steps');
    expect(prompt).not.toContain('Fuse this into one experience');
    expect(prompt).not.toContain('trap');
    expect(prompt).not.toContain('ghost');
    expect(prompt).not.toContain('Per-topic attention strategy');
    // Falls back to the same generic closing line every non-beat atom gets.
    expect(prompt).toContain('keep the body focused on a single learning beat');
  });

  it('an intuition atom under "personalized" is equally excluded', () => {
    const prompt = buildPrompt(baseArgs({ atom_type: 'intuition', generation_context: 'personalized' }));
    expect(prompt).not.toContain('narration_steps');
    expect(prompt).not.toContain('trap');
  });

  it('explicit generation_context: "batch" behaves identically to the (undefined) default', () => {
    const withDefault = buildPrompt(baseArgs({ atom_type: 'hook' }));
    const withExplicitBatch = buildPrompt(baseArgs({ atom_type: 'hook', generation_context: 'batch' }));
    expect(withExplicitBatch).toBe(withDefault);
  });
});

describe('buildPrompt — the literal prompt-cap carve-out (eng review: two truths about one cap)', () => {
  it('a hook atom prompt contains the carve-out sentence, not the old bare word cap', () => {
    const prompt = buildPrompt(baseArgs({ atom_type: 'hook' }));
    expect(prompt).toContain('Prose is capped at 400 words');
    expect(prompt).toContain('does NOT count toward that cap');
    expect(prompt).not.toContain('Keep total length under 400 words.');
  });

  it('the carve-out sentence appears for every atom type, not just resonance-eligible ones', () => {
    const prompt = buildPrompt(baseArgs({ atom_type: 'common_traps' as any }));
    expect(prompt).toContain('Prose is capped at 400 words');
    expect(prompt).not.toContain('Keep total length under 400 words.');
  });
});

describe('buildPrompt — tone/register directive (/investigate, 2026-09-02)', () => {
  it('every prompt opens with the ELI5/anxious-student/Indian-English register block', () => {
    const prompt = buildPrompt(baseArgs({ atom_type: 'hook' }));
    expect(prompt.startsWith('Register: write for a student who gets anxious')).toBe(true);
    expect(prompt).toContain('ELI5');
    expect(prompt).toContain('gloss it in plain words');
    expect(prompt).toContain('Indian English');
  });

  it('the register block applies to every atom type, not just hook/intuition', () => {
    for (const atom_type of ['formal_definition', 'common_traps', 'worked_example', 'exam_pattern'] as const) {
      const prompt = buildPrompt(baseArgs({ atom_type: atom_type as any }));
      expect(prompt).toContain('Indian English');
    }
  });

  it('the register block precedes every other block (student context, pain-point, resonance)', () => {
    const prompt = buildPrompt(baseArgs({ atom_type: 'hook' }));
    const registerIdx = prompt.indexOf('Register: write for a student');
    const generateIdx = prompt.indexOf('Generate the "hook" atom');
    expect(registerIdx).toBe(0);
    expect(registerIdx).toBeLessThan(generateIdx);
  });
});
