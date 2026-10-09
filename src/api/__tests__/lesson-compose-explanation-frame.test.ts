/**
 * POST /api/lesson/compose — the Explanation Frame field.
 *
 * Two things worth pinning, and the first matters more than the second:
 *
 *   1. UN-ENROLLED IS THE DEFAULT. With no `experiments` row the field is
 *      present and null and every other field is untouched, so landing the
 *      wire changed nothing for any student anywhere. The route test is the
 *      only place that can show "untouched" rather than assert it.
 *   2. Enrolled + treatment composes a real frame carrying the stance the
 *      atom stack was served in — the register cannot diverge between the
 *      two, which is the reason `servedStance` is threaded rather than
 *      recomputed inside the wire.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ServerResponse } from 'http';

const mockQuery = vi.fn();
vi.mock('pg', () => ({ default: { Pool: vi.fn(() => ({ query: mockQuery })) } }));
vi.mock('../../gbrain/student-model', () => ({
  getOrCreateStudentModel: vi.fn(async () => null),
}));
vi.mock('../../gbrain/integration', () => ({
  modelToLessonSnapshot: vi.fn(() => ({})),
  deriveConceptHints: vi.fn(() => ({})),
}));

// The experiment row, swapped per test. `null` is the real-world default.
const experimentRow = { value: null as { id: string; status: string } | null };
vi.mock('../../experiments/registry', () => ({
  getExperiment: async () => experimentRow.value,
}));

const { lessonRoutes } = await import('../lesson-routes');
const { explanationFrameExperimentId } = await import('../../content/explanation-frame/wire');
const { bucketFor } = await import('../../personalization/ab');

const EXP_ID = explanationFrameExperimentId('gate-ma');
// Resolved from the real hash, and each test that composes uses its OWN
// session: `stanceForConcept` PINS the stance per (session, concept) for the
// length of the concept, so a second compose on the same pair would replay
// the first call's stance no matter what snapshot it sent. That pin is
// correct behaviour (a recovery mid-read must not rewrite every body under
// the student) and it is exactly what a shared fixture session would hide.
const TREATMENT_SESSIONS = Array.from({ length: 40 }, (_, i) => `frame-sess-${i}`)
  .filter((s) => bucketFor(EXP_ID, s) === 'treatment');
const TREATMENT_SESSION = TREATMENT_SESSIONS[0];

beforeEach(() => {
  mockQuery.mockReset();
  mockQuery.mockResolvedValue({ rows: [], rowCount: 0 });
  experimentRow.value = null;
});
afterEach(() => { vi.restoreAllMocks(); });

function makeReq(overrides: any = {}) {
  return { pathname: '', query: new URLSearchParams(), params: {}, body: null, headers: {}, ...overrides };
}

function makeRes(): any {
  const captured: any = { status: 200, payload: null };
  const res: any = {
    setHeader: () => {},
    writeHead: (status: number) => { captured.status = status; },
    end: (data?: string) => {
      if (data) { try { captured.payload = JSON.parse(data); } catch { captured.payload = data; } }
    },
    write: () => {},
  };
  Object.defineProperty(res, 'statusCode', {
    get: () => captured.status,
    set: (v: number) => { captured.status = v; },
  });
  return { res, get payload() { return captured.payload; }, get status() { return captured.status; } };
}

function composeHandler() {
  const route = lessonRoutes.find((r) => r.method === 'POST' && r.path === '/api/lesson/compose');
  if (!route) throw new Error('compose route not found');
  return route.handler;
}

const CONCEPT = 'eigenvalues';

async function compose(body: any) {
  const wrap = makeRes();
  await composeHandler()(makeReq({ body }), wrap.res);
  return wrap;
}

describe('compose — explanation_frame, un-enrolled', () => {
  it('is present and null with no experiments row', async () => {
    const wrap = await compose({ concept_id: CONCEPT, session_id: TREATMENT_SESSION });
    expect(wrap.status).toBe(200);
    expect(wrap.payload).toHaveProperty('explanation_frame');
    expect(wrap.payload.explanation_frame).toBeNull();
  });

  it('is null for an anonymous request', async () => {
    const wrap = await compose({ concept_id: CONCEPT });
    expect(wrap.payload.explanation_frame).toBeNull();
  });

  it('leaves the rest of the response byte-identical to a pre-wire lesson', async () => {
    const wrap = await compose({ concept_id: CONCEPT, session_id: TREATMENT_SESSION });
    const { explanation_frame, ...rest } = wrap.payload;
    expect(explanation_frame).toBeNull();
    // The lesson still carries everything it carried before: atoms, the
    // legacy component list, and the concept it was asked for.
    expect(rest.concept_id).toBe(CONCEPT);
    expect(Array.isArray(rest.atoms)).toBe(true);
    expect(Array.isArray(rest.components)).toBe(true);
    expect(rest.atoms.length).toBeGreaterThan(0);
  });
});

describe('compose — explanation_frame, enrolled and in treatment', () => {
  beforeEach(() => { experimentRow.value = { id: EXP_ID, status: 'active' }; });

  it('composes a real frame with every required role filled', async () => {
    const wrap = await compose({ concept_id: CONCEPT, session_id: TREATMENT_SESSION });
    const frame = wrap.payload.explanation_frame;
    expect(frame).not.toBeNull();
    expect(frame.concept_id).toBe(CONCEPT);
    expect(frame.experiment_id).toBe(EXP_ID);
    const roles = frame.slots.map((s: any) => s.role);
    for (const r of ['anchor', 'core_idea', 'worked_example', 'trap', 'check']) {
      expect(roles).toContain(r);
    }
    expect(typeof frame.enrichment_level).toBe('number');
  });

  it('composes in the SAME stance the atoms were served in', async () => {
    // A frustrated student with a low mastery band derives `shaken`, and the
    // stance resolver then replaces slot bodies with the authored shaken
    // variants — enrichment > 0 is the observable proof the frame saw the
    // served stance rather than a null one.
    const session = TREATMENT_SESSIONS[1];
    const wrap = await compose({
      concept_id: CONCEPT,
      session_id: session,
      student: { session_id: session, motivation_state: 'frustrated' },
    });
    const frame = wrap.payload.explanation_frame;
    expect(frame).not.toBeNull();
    expect(frame.enrichment_level).toBeGreaterThan(0);
    expect(frame.slots.some((s: any) => s.source === 'adaptive' && s.resolver_id === 'stance_body')).toBe(true);
  });

  it('still returns the lesson when the concept cannot be framed', async () => {
    // A section id resolves to a leaf concept, but an unknown concept id has
    // no atoms on disk: the frame is null and the lesson is unaffected.
    const wrap = await compose({ concept_id: 'no-such-concept-anywhere', session_id: TREATMENT_SESSION });
    expect(wrap.status).toBe(200);
    expect(wrap.payload.explanation_frame).toBeNull();
  });
});
