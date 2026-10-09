/**
 * The wire composing for real, with the experiment row mocked active.
 *
 * Separate file because `vi.mock` is module-scoped and the sibling
 * wire.test.ts deliberately exercises the un-enrolled (null) paths against
 * the real registry.
 *
 * What this pins is the pair of guarantees from types.ts, on the SERVING
 * path rather than in the pure core: G1 (zero signals still yields a
 * complete explanation) and G2 (more signal never produces fewer slots or
 * less enrichment).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

const experimentStatus = { value: 'active' as string | null };

vi.mock('../../../experiments/registry', () => ({
  getExperiment: async (id: string) =>
    experimentStatus.value === null ? null : { id, status: experimentStatus.value },
}));

const { composeFrameForLesson, explanationFrameExperimentId } = await import('../wire');
const { bucketFor } = await import('../../../personalization/ab');
const { REQUIRED_ROLES } = await import('../types');
const { getPrerequisites } = await import('../../../constants/concept-graph');

const EXP_ID = explanationFrameExperimentId('gate-ma');
// A real, fully-authored concept. `eigenvalues` carries all 11 atom types
// and a concept anchor, so the frame is buildable from disk.
const CONCEPT = 'eigenvalues';
const TREATMENT_SESSION = ['sess-a', 'sess-b', 'sess-d', 'sess-g', 'sess-h']
  .find(s => bucketFor(EXP_ID, s) === 'treatment')!;
const CONTROL_SESSION = ['sess-c', 'sess-f', 'sess-i', 'sess-j']
  .find(s => bucketFor(EXP_ID, s) === 'control')!;

beforeEach(() => { experimentStatus.value = 'active'; });

describe('composeFrameForLesson, enrolled and in treatment', () => {
  it('G1 — a zero-signal request still gets every required role', async () => {
    const out = await composeFrameForLesson({
      concept_id: CONCEPT,
      session_id: TREATMENT_SESSION,
      exam_pack_id: 'gate-ma',
    });
    expect(out).not.toBeNull();
    expect(out!.concept_id).toBe(CONCEPT);
    expect(out!.experiment_id).toBe(EXP_ID);
    const roles = out!.slots.map(s => s.role);
    for (const required of REQUIRED_ROLES) expect(roles).toContain(required);
    // Every slot carries real text, and nothing is a placeholder.
    for (const s of out!.slots) expect(s.text.trim().length).toBeGreaterThan(0);
    expect(out!.enrichment_level).toBe(0);
  });

  it('a control-bucket session gets null under the same active experiment', async () => {
    await expect(composeFrameForLesson({
      concept_id: CONCEPT,
      session_id: CONTROL_SESSION,
      exam_pack_id: 'gate-ma',
    })).resolves.toBeNull();
  });

  it('a paused experiment turns it off without a code change', async () => {
    experimentStatus.value = 'aborted';
    await expect(composeFrameForLesson({
      concept_id: CONCEPT,
      session_id: TREATMENT_SESSION,
      exam_pack_id: 'gate-ma',
    })).resolves.toBeNull();
  });

  it('a stance signal enriches, and marks which slots a resolver touched', async () => {
    const out = await composeFrameForLesson({
      concept_id: CONCEPT,
      session_id: TREATMENT_SESSION,
      exam_pack_id: 'gate-ma',
      stance: 'shaken',
    });
    expect(out).not.toBeNull();
    expect(out!.enrichment_level).toBeGreaterThan(0);
    const adaptive = out!.slots.filter(s => s.source === 'adaptive');
    expect(adaptive.length).toBe(out!.enrichment_level);
    for (const s of adaptive) expect(s.resolver_id).toBe('stance_body');
  });

  it('G2 — adding a weak prerequisite never costs a slot or enrichment', async () => {
    const floor = await composeFrameForLesson({
      concept_id: CONCEPT,
      session_id: TREATMENT_SESSION,
      exam_pack_id: 'gate-ma',
      stance: 'shaken',
    });
    const prereq = getPrerequisites(CONCEPT)[0];
    expect(prereq).toBeDefined();
    const enriched = await composeFrameForLesson({
      concept_id: CONCEPT,
      session_id: TREATMENT_SESSION,
      exam_pack_id: 'gate-ma',
      stance: 'shaken',
      mastery_by_concept: { [prereq.id]: 0.1 },
    });
    expect(enriched!.slots.length).toBeGreaterThanOrEqual(floor!.slots.length);
    expect(enriched!.enrichment_level).toBeGreaterThanOrEqual(floor!.enrichment_level);
    // And the extra slot is the prerequisite bridge, naming the real prereq.
    const bridge = enriched!.slots.find(s => s.role === 'prerequisite_bridge');
    expect(bridge).toBeDefined();
    expect(bridge!.source).toBe('adaptive');
  });

  it('is deterministic — the same request composes byte-identically', async () => {
    const input = {
      concept_id: CONCEPT,
      session_id: TREATMENT_SESSION,
      exam_pack_id: 'gate-ma',
      stance: 'assured',
    };
    const a = await composeFrameForLesson(input);
    const b = await composeFrameForLesson(input);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });
});
