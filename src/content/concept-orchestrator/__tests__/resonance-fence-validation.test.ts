/**
 * resonance-fence-validation.test.ts — resonance plan §W4: generateOne's
 * post-generation interactive-spec fence policy.
 *
 * Mocks the LLM client the same way orchestrator-model-routing.test.ts
 * does (`vi.mock('../../../llm/index', ...)`), driving generateOne
 * (reached via generateConcept + dry_run:true) with scripted responses to
 * exercise each branch:
 *   - a well-formed fence passes through untouched, no regeneration
 *   - a malformed fence triggers exactly one regeneration attempt; if
 *     still invalid, the fence is stripped and the prose kept
 *   - on the 'personalized' generation_context, ANY valid simulation-kind
 *     fence is stripped unconditionally (defense-in-depth, P0 eng finding)
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

interface Call {
  model?: string;
  taskType?: string;
}

let calls: Call[] = [];
// Content-generation responses are served in order, one per call; the last
// entry repeats for any call beyond the scripted list.
let responses: string[] = [];

vi.mock('../../../llm/index', () => ({
  LLMClient: class {
    async generate(request: any) {
      calls.push({ model: request.model, taskType: request.taskType });
      if (request.taskType === 'eval') {
        // Malformed on purpose — llm-judge falls back to score:5 either
        // way (pass-through), which is all these tests need.
        return { content: 'not json' };
      }
      const contentCalls = calls.filter((c) => c.taskType === 'content-generation').length;
      const idx = Math.min(contentCalls, responses.length) - 1;
      return { content: responses[idx] ?? '' };
    }
  },
}));

vi.mock('../../../llm/registry', () => ({
  loadLlmConfig: () => ({
    providers: { anthropic: { models: { sonnet: { id: 'claude-sonnet-4-5' } } } },
  }),
}));

const VALID_SIMULATION_FENCE = [
  '```interactive-spec',
  JSON.stringify({
    v: 1,
    kind: 'simulation',
    title: 'Eigenvector direction',
    x_expr: 'cos(t)',
    y_expr: 'sin(t)',
    t_min: 0,
    t_max: 6.28,
    narration_steps: [
      { at_progress: 0, text: 'Start on the unit circle.' },
      { at_progress: 0.5, text: 'The direction sweeps around.' },
    ],
  }),
  '```',
].join('\n');

const INVALID_FENCE = ['```interactive-spec', '{ this is not valid json', '```'].join('\n');

function bodyWithFence(fence: string): string {
  return `Some prose about the concept.\n\n${fence}\n\nMore prose after.`;
}

const { generateConcept } = await import('../orchestrator');

beforeEach(() => {
  calls = [];
  responses = [];
});

describe('generateOne — interactive-spec fence policy (batch context)', () => {
  it('a well-formed simulation fence passes through untouched, no regeneration', async () => {
    responses = [bodyWithFence(VALID_SIMULATION_FENCE)];
    const draft = await generateConcept({
      concept_id: 'eigenvalues',
      topic_family: 'linear-algebra',
      atom_types: ['hook'],
      dry_run: true,
    });
    const all = [...draft.atoms, ...draft.rejected_atoms];
    expect(all[0].content).toContain('```interactive-spec');
    expect(all[0].content).toContain('narration_steps');
    // Only one content-generation call — no regeneration fired.
    expect(calls.filter((c) => c.taskType === 'content-generation').length).toBe(1);
  });

  it('an invalid fence regenerates once; still invalid on the retry → stripped, prose kept', async () => {
    responses = [bodyWithFence(INVALID_FENCE), bodyWithFence(INVALID_FENCE)];
    const draft = await generateConcept({
      concept_id: 'eigenvalues',
      topic_family: 'linear-algebra',
      atom_types: ['hook'],
      dry_run: true,
    });
    const all = [...draft.atoms, ...draft.rejected_atoms];
    expect(all[0].content).not.toContain('```interactive-spec');
    expect(all[0].content).toContain('Some prose about the concept.');
    expect(all[0].content).toContain('More prose after.');
    // Original attempt + exactly one regeneration attempt.
    expect(calls.filter((c) => c.taskType === 'content-generation').length).toBe(2);
  });

  it('an invalid fence regenerates once; VALID on the retry → the regenerated content ships with its fence intact', async () => {
    responses = [bodyWithFence(INVALID_FENCE), bodyWithFence(VALID_SIMULATION_FENCE)];
    const draft = await generateConcept({
      concept_id: 'eigenvalues',
      topic_family: 'linear-algebra',
      atom_types: ['hook'],
      dry_run: true,
    });
    const all = [...draft.atoms, ...draft.rejected_atoms];
    expect(all[0].content).toContain('```interactive-spec');
    expect(all[0].content).toContain('narration_steps');
    expect(calls.filter((c) => c.taskType === 'content-generation').length).toBe(2);
  });

  it('no fence in the body at all — policy is a pure no-op, no regeneration', async () => {
    responses = ['Plain prose hook with no interactive spec at all.'];
    const draft = await generateConcept({
      concept_id: 'eigenvalues',
      topic_family: 'linear-algebra',
      atom_types: ['hook'],
      dry_run: true,
    });
    const all = [...draft.atoms, ...draft.rejected_atoms];
    expect(all[0].content).toBe('Plain prose hook with no interactive spec at all.');
    expect(calls.filter((c) => c.taskType === 'content-generation').length).toBe(1);
  });
});

describe('generateOne — personalized-regen defense-in-depth (P0 eng finding)', () => {
  it('a VALID simulation-kind fence is stripped unconditionally on generation_context "personalized"', async () => {
    responses = [bodyWithFence(VALID_SIMULATION_FENCE)];
    const draft = await generateConcept({
      concept_id: 'eigenvalues',
      topic_family: 'linear-algebra',
      atom_types: ['hook'],
      dry_run: true,
      generation_context: 'personalized',
    });
    const all = [...draft.atoms, ...draft.rejected_atoms];
    expect(all[0].content).not.toContain('```interactive-spec');
    expect(all[0].content).toContain('Some prose about the concept.');
    expect(all[0].content).toContain('More prose after.');
    // The fence was well-formed — no regeneration needed to reach the strip.
    expect(calls.filter((c) => c.taskType === 'content-generation').length).toBe(1);
  });

  it('a non-simulation valid fence (manipulable) is left alone on "personalized" — only simulation kinds are stripped', async () => {
    const manipulableFence = [
      '```interactive-spec',
      JSON.stringify({
        v: 1,
        kind: 'manipulable',
        title: 'Scale factor',
        inputs: [{ id: 'a', label: 'a', min: 0, max: 5 }],
        outputs: [{ label: 'a squared', formula: 'a^2' }],
      }),
      '```',
    ].join('\n');
    responses = [bodyWithFence(manipulableFence)];
    const draft = await generateConcept({
      concept_id: 'eigenvalues',
      topic_family: 'linear-algebra',
      atom_types: ['hook'],
      dry_run: true,
      generation_context: 'personalized',
    });
    const all = [...draft.atoms, ...draft.rejected_atoms];
    expect(all[0].content).toContain('```interactive-spec');
  });

  it('batch context (default) does NOT strip a valid simulation fence', async () => {
    responses = [bodyWithFence(VALID_SIMULATION_FENCE)];
    const draft = await generateConcept({
      concept_id: 'eigenvalues',
      topic_family: 'linear-algebra',
      atom_types: ['hook'],
      dry_run: true,
    });
    const all = [...draft.atoms, ...draft.rejected_atoms];
    expect(all[0].content).toContain('```interactive-spec');
  });
});

describe('generateOne — interactive-spec validator unavailable (degrade path)', () => {
  // The other describe blocks in this file rely on the REAL renderer parser
  // being reachable (frontend/src is on disk in dev/test) to exercise valid
  // vs. invalid fence shapes. This block needs the opposite — the validator
  // genuinely unavailable — so it swaps in a fresh module instance via
  // vi.doMock + vi.resetModules (the pattern orchestrator-model-routing.test.ts
  // uses for its own single-test override) rather than a file-wide vi.mock,
  // which would break every other test's shape-validation assertions.
  afterEach(() => {
    vi.doUnmock('../../interactive-spec-loader');
    vi.resetModules();
  });

  it('loader resolves null → the fence ships UNCHANGED (never thrown, never stripped), with a warning', async () => {
    vi.doMock('../../interactive-spec-loader', () => ({
      loadInteractiveSpecParser: async () => null,
    }));
    vi.resetModules();
    const { generateConcept: freshGenerateConcept } = await import('../orchestrator');

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    calls = [];
    responses = [bodyWithFence(VALID_SIMULATION_FENCE)];

    const draft = await freshGenerateConcept({
      concept_id: 'eigenvalues',
      topic_family: 'linear-algebra',
      atom_types: ['hook'],
      dry_run: true,
    });
    const all = [...draft.atoms, ...draft.rejected_atoms];

    // Unchanged, byte-for-byte — the degrade path must not throw, strip, or
    // otherwise touch content just because it can't validate it.
    expect(all[0].content).toBe(bodyWithFence(VALID_SIMULATION_FENCE));
    // No regeneration — there was nothing to regenerate against; the policy
    // never even attempted validation.
    expect(calls.filter((c) => c.taskType === 'content-generation').length).toBe(1);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('validator is unavailable in this process'),
    );

    warnSpy.mockRestore();
  });
});

describe('generateOne — regeneration produced no content', () => {
  it('an invalid fence regenerates once; the retry comes back EMPTY → the fence is stripped from the ORIGINAL content, prose kept (never ships the empty regen)', async () => {
    responses = [bodyWithFence(INVALID_FENCE), ''];
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const draft = await generateConcept({
      concept_id: 'eigenvalues',
      topic_family: 'linear-algebra',
      atom_types: ['hook'],
      dry_run: true,
    });
    const all = [...draft.atoms, ...draft.rejected_atoms];

    expect(all[0].content).not.toBe('');
    expect(all[0].content).not.toContain('```interactive-spec');
    // The prose is the ORIGINAL body's prose, not something derived from the
    // (empty) regeneration attempt.
    expect(all[0].content).toContain('Some prose about the concept.');
    expect(all[0].content).toContain('More prose after.');
    // Original attempt + exactly one regeneration attempt — no further retry
    // just because the regen came back empty.
    expect(calls.filter((c) => c.taskType === 'content-generation').length).toBe(2);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('regeneration produced no content'),
    );

    warnSpy.mockRestore();
  });
});
