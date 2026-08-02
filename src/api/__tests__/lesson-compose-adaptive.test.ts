/**
 * POST /api/lesson/compose — adaptive threading + user materials
 * (realignment items 6 + 7).
 *
 * Covers:
 *   - user_material_chunks flow end-to-end into user-material-attributed
 *     lesson components (deterministic local composition, no external API)
 *   - personalizer skip-hook rule fires on transmitted mastery_by_topic
 *   - PedagogyEngine error-streak modality switch fires through the
 *     compose path on transmitted recent_errors (consecutive same-concept)
 *   - EMPTY-SIGNAL REGRESSION: empty signals produce a byte-identical
 *     lesson to a signal-less request (generic-first ladder, spec-locked)
 *   - malformed payloads rejected (400) or sanitized (bad entries dropped)
 *   - consent boundary: router's allow_generation / allow_wolfram gates
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ServerResponse } from 'http';

// Mock pg before importing the route module (no live DB in tests)
const mockQuery = vi.fn();
vi.mock('pg', () => ({
  default: {
    Pool: vi.fn(() => ({ query: mockQuery })),
  },
}));

// Keep the heavy gbrain dep out
vi.mock('../../gbrain/student-model', () => ({
  getOrCreateStudentModel: vi.fn(async () => null),
}));
vi.mock('../../gbrain/integration', () => ({
  modelToLessonSnapshot: vi.fn(() => ({})),
  deriveConceptHints: vi.fn(() => ({})),
}));

const { lessonRoutes } = await import('../lesson-routes');

beforeEach(() => {
  mockQuery.mockReset();
  mockQuery.mockResolvedValue({ rows: [], rowCount: 0 });
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

function makeReq(overrides: any = {}) {
  return {
    pathname: '',
    query: new URLSearchParams(),
    params: {},
    body: null,
    headers: {},
    ...overrides,
  };
}

function makeRes(): { res: ServerResponse; payload: any; status: number } {
  const captured: any = { status: 200, payload: null, raw: null };
  const res: any = {
    setHeader: () => {},
    writeHead: (status: number) => { captured.status = status; },
    end: (data?: string) => {
      if (data) {
        captured.raw = data;
        try { captured.payload = JSON.parse(data); } catch { captured.payload = data; }
      }
    },
    write: () => {},
  };
  Object.defineProperty(res, 'statusCode', {
    get: () => captured.status,
    set: (v: number) => { captured.status = v; },
  });
  return {
    res,
    get payload() { return captured.payload; },
    get status() { return captured.status; },
    get raw() { return captured.raw; },
  } as any;
}

function composeHandler() {
  const route = lessonRoutes.find((r) => r.method === 'POST' && r.path === '/api/lesson/compose');
  if (!route) throw new Error('compose route not found');
  return route.handler;
}

// ─── Item 6 — user materials reach the composed lesson ─────────────────

describe('compose — user_material_chunks', () => {
  it('surfaces user-material chunks as user-material-attributed components', async () => {
    const wrap = makeRes();
    await composeHandler()(makeReq({
      body: {
        concept_id: 'derivatives-basic',
        user_material_chunks: [
          {
            material_id: 'mat-1',
            material_title: 'my-class-notes.pdf',
            chunk_text: 'Imagine the derivative as the slope of a hill you are cycling up — the geometric picture of instantaneous rate of change from my class notes.',
            similarity: 0.91,
          },
        ],
      },
    }) as any, wrap.res);

    expect(wrap.status).toBe(200);
    const components = (wrap.payload as any).components as any[];
    const userSourced = components.filter((c) => c.attribution?.kind === 'user-material');
    expect(userSourced.length).toBeGreaterThan(0);
    // The user chunk carries provenance — the material's title
    expect(userSourced[0].attribution.title).toBe('my-class-notes.pdf');
    // Deterministic local composition — the chunk text itself is served
    expect(JSON.stringify(userSourced)).toContain('slope of a hill');
  });

  it('drops chunks below the similarity threshold (0.55)', async () => {
    const wrap = makeRes();
    await composeHandler()(makeReq({
      body: {
        concept_id: 'derivatives-basic',
        user_material_chunks: [
          {
            material_id: 'mat-2',
            material_title: 'irrelevant.pdf',
            chunk_text: 'Imagine a completely unrelated topic here.',
            similarity: 0.2,
          },
        ],
      },
    }) as any, wrap.res);
    expect(wrap.status).toBe(200);
    const components = (wrap.payload as any).components as any[];
    expect(components.some((c) => c.attribution?.kind === 'user-material')).toBe(false);
  });
});

// ─── Item 7 — personalizer + pedagogy-engine rules fire on real signals ─

describe('compose — adaptive threading signals', () => {
  it('skip-hook rule fires on transmitted mastery_by_topic >= 0.75', async () => {
    const wrap = makeRes();
    await composeHandler()(makeReq({
      body: {
        concept_id: 'derivatives-basic',
        student: { mastery_by_topic: { calculus: 0.8 } },
      },
    }) as any, wrap.res);
    expect(wrap.status).toBe(200);
    const payload = wrap.payload as any;
    expect(payload.components.some((c: any) => c.kind === 'hook')).toBe(false);
    expect(payload.personalization_applied.join(',')).toContain('skip_hook_due_to_high_topic_mastery');
  });

  it('error_streak >= 3 on the same concept triggers the modality switch in the atoms path', async () => {
    const errs = [
      { concept_id: 'derivatives-basic', error_type: 'procedural', created_at: '2026-08-02T10:03:00Z' },
      { concept_id: 'derivatives-basic', error_type: 'conceptual', created_at: '2026-08-02T10:02:00Z' },
      { concept_id: 'derivatives-basic', error_type: 'procedural', created_at: '2026-08-02T10:01:00Z' },
    ];
    const wrap = makeRes();
    await composeHandler()(makeReq({
      body: {
        concept_id: 'derivatives-basic',
        student: {
          recent_errors: errs,
          mastery_by_concept: { 'derivatives-basic': 0.5 },
        },
      },
    }) as any, wrap.res);
    expect(wrap.status).toBe(200);
    const atoms = (wrap.payload as any).atoms as any[];
    expect(atoms.length).toBeGreaterThan(1);
    // Streak head: common_traps first, then the modality-switch atom
    // (visual_analogy is first in the fallback chain and exists for this concept)
    expect(atoms[0].atom_type).toBe('common_traps');
    expect(atoms[1].atom_type).toBe('visual_analogy');
  });

  it('a broken streak (different concept most recent) does NOT trigger the switch', async () => {
    const errs = [
      { concept_id: 'eigenvalues', error_type: 'procedural', created_at: '2026-08-02T10:03:00Z' },
      { concept_id: 'derivatives-basic', error_type: 'conceptual', created_at: '2026-08-02T10:02:00Z' },
      { concept_id: 'derivatives-basic', error_type: 'procedural', created_at: '2026-08-02T10:01:00Z' },
    ];
    const wrap = makeRes();
    await composeHandler()(makeReq({
      body: {
        concept_id: 'derivatives-basic',
        student: {
          recent_errors: errs,
          mastery_by_concept: { 'derivatives-basic': 0.5 },
        },
      },
    }) as any, wrap.res);
    expect(wrap.status).toBe(200);
    const atoms = (wrap.payload as any).atoms as any[];
    // building-tier ordering, no streak head injection
    expect(atoms[0].atom_type).not.toBe('common_traps');
  });
});

// ─── Empty-signal regression — generic-first ladder, byte-identical ────

describe('compose — empty signals are byte-identical to no signals', () => {
  it('produces the same serialized lesson for absent vs empty signal payloads', async () => {
    // Freeze the two nondeterminism sources: generated_at and the
    // related-problems interleave shuffle.
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-02T12:00:00Z'));
    vi.spyOn(Math, 'random').mockReturnValue(0.42);

    const wrapA = makeRes();
    await composeHandler()(makeReq({
      body: { concept_id: 'derivatives-basic' },
    }) as any, wrapA.res);

    const wrapB = makeRes();
    await composeHandler()(makeReq({
      body: {
        concept_id: 'derivatives-basic',
        student: { mastery_by_topic: {}, recent_errors: [], mastery_by_concept: {} },
        user_material_chunks: [],
        recent_errors: [],
        mastery_by_topic: {},
      },
    }) as any, wrapB.res);

    expect(wrapA.status).toBe(200);
    expect(wrapB.status).toBe(200);
    expect((wrapB as any).raw).toBe((wrapA as any).raw); // byte-identical JSON
  });
});

// ─── Malformed payloads — rejected or sanitized ────────────────────────

describe('compose — malformed signal payloads', () => {
  it('400 when recent_errors is not an array', async () => {
    const wrap = makeRes();
    await composeHandler()(makeReq({
      body: { concept_id: 'derivatives-basic', recent_errors: 'garbage' },
    }) as any, wrap.res);
    expect(wrap.status).toBe(400);
  });

  it('400 when mastery_by_topic is an array', async () => {
    const wrap = makeRes();
    await composeHandler()(makeReq({
      body: { concept_id: 'derivatives-basic', mastery_by_topic: [0.9] },
    }) as any, wrap.res);
    expect(wrap.status).toBe(400);
  });

  it('sanitizes malformed ENTRIES away (no personalization, no crash)', async () => {
    const wrap = makeRes();
    await composeHandler()(makeReq({
      body: {
        concept_id: 'derivatives-basic',
        student: {
          recent_errors: [{ concept_id: 42 }, { error_type: 'procedural' }, null],
          mastery_by_topic: { calculus: 'high', '': 0.9 },
        },
      },
    }) as any, wrap.res);
    expect(wrap.status).toBe(200);
    const payload = wrap.payload as any;
    // No rule fired from garbage
    expect(payload.personalization_applied).toEqual([]);
    expect(payload.components.some((c: any) => c.kind === 'hook')).toBe(true);
  });

  it('clamps out-of-range mastery values instead of trusting them', async () => {
    const wrap = makeRes();
    await composeHandler()(makeReq({
      body: {
        concept_id: 'derivatives-basic',
        // 999 clamps to 1.0 → skip-hook fires (a legal, bounded outcome)
        student: { mastery_by_topic: { calculus: 999 } },
      },
    }) as any, wrap.res);
    expect(wrap.status).toBe(200);
    const payload = wrap.payload as any;
    expect(payload.components.some((c: any) => c.kind === 'hook')).toBe(false);
  });
});

// ─── Consent boundary — router gates on external-API paths ─────────────

describe('consent boundary — router allow_generation / allow_wolfram gates', () => {
  it('declines wolfram-bound intents without allow_wolfram', async () => {
    const { routeContent } = await import('../../content/router');
    const result = await routeContent({
      user_id: 'consent-test-user',
      text: 'check my answer: is the derivative of x^2 equal to 2x?',
      allow_wolfram: false,
    } as any);
    expect(result.ok).toBe(false);
    expect(result.source).toBe('declined');
    expect(result.rejected_because.wolfram).toContain('allow_wolfram=false');
  });

  it('declines LLM generation without allow_generation', async () => {
    const { routeContent } = await import('../../content/router');
    const result = await routeContent({
      user_id: 'consent-test-user',
      text: 'explain the concept of a completely unknown thing zzqx',
      concept_id: 'nonexistent-concept-zzqx',
      allow_generation: false,
    } as any);
    expect(result.ok).toBe(false);
    expect(result.source).toBe('declined');
    expect(result.rejected_because.generated).toContain('allow_generation=false');
  });
});
