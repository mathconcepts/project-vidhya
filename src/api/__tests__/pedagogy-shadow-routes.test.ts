/**
 * The Tier 4 flip readout.
 *
 * The pure statistics are covered in pedagogy-shadow.test.ts. What is only
 * decidable here is what the OPERATOR is told — specifically the `note` field,
 * which exists because "no observations yet" and "every observation errored"
 * produce an identical table of zeros. An operator reading zeros without that
 * sentence would conclude the content scores badly, when the truth is that the
 * judge never answered.
 *
 * `would_block_now` matters for the same reason: null means "cannot say", and
 * collapsing it to 0 would read as "flipping the gate blocks nothing" — the
 * most dangerous possible misreading of an empty dataset.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { PedagogyShadowRow } from '../../content/verifiers/pedagogy-shadow';

const h = vi.hoisted(() => ({
  role: 'admin' as string | null,
  rows: [] as PedagogyShadowRow[],
}));

vi.mock('../auth-middleware', () => ({
  // Mirrors the real contract: returns null AND responds when unauthorised,
  // so the handler must stop rather than fall through to the payload.
  requireRole: vi.fn(async (_req: unknown, res: { writeHead: (n: number) => void; end: (s?: string) => void }) => {
    if (h.role !== 'admin') {
      res.writeHead(403);
      res.end(JSON.stringify({ error: 'forbidden' }));
      return null;
    }
    return { id: 'admin-1', role: 'admin' };
  }),
}));

vi.mock('../../storage/repositories/pedagogy-shadow-repo', () => ({
  getPedagogyShadowRepo: () => ({
    all: async () => h.rows,
    describe: () => 'fake:shadow',
  }),
}));

/** Minimal ServerResponse stand-in that records what the operator receives. */
function fakeRes() {
  const out = { status: 0, body: null as any };
  return {
    res: {
      writeHead(status: number) { out.status = status; },
      end(payload?: string) { out.body = payload ? JSON.parse(payload) : null; },
    } as never,
    out,
  };
}

async function call() {
  const { pedagogyShadowRoutes } = await import('../pedagogy-shadow-routes');
  const route = pedagogyShadowRoutes.find((r) => r.path === '/api/admin/pedagogy-shadow');
  expect(route, 'route not registered').toBeDefined();
  const { res, out } = fakeRes();
  await route!.handler({} as never, res);
  return out;
}

const scored = (score: number): PedagogyShadowRow =>
  ({ target_id: `t-${score}`, score, errored: false });
const errored = (): PedagogyShadowRow =>
  ({ target_id: 't-err', score: 0, errored: true, reason: 'judge timed out' });

let savedThreshold: string | undefined;
let savedGate: string | undefined;

beforeEach(() => {
  h.role = 'admin';
  h.rows = [];
  savedThreshold = process.env.VIDHYA_PEDAGOGY_THRESHOLD;
  savedGate = process.env.VIDHYA_PEDAGOGY_GATE;
  delete process.env.VIDHYA_PEDAGOGY_THRESHOLD;
  delete process.env.VIDHYA_PEDAGOGY_GATE;
});

afterEach(() => {
  if (savedThreshold === undefined) delete process.env.VIDHYA_PEDAGOGY_THRESHOLD;
  else process.env.VIDHYA_PEDAGOGY_THRESHOLD = savedThreshold;
  if (savedGate === undefined) delete process.env.VIDHYA_PEDAGOGY_GATE;
  else process.env.VIDHYA_PEDAGOGY_GATE = savedGate;
});

describe('the readout is admin-only', () => {
  it('refuses a non-admin and does not leak the distribution', async () => {
    h.role = 'student';
    h.rows = [scored(0.9)];
    const out = await call();

    expect(out.status).toBe(403);
    expect(out.body).not.toHaveProperty('distribution');
  });
});

describe('an empty dataset says so instead of reading as zero', () => {
  it('no observations: would_block_now is null, with the reason spelled out', async () => {
    const out = await call();

    // Null, never 0 — "blocks nothing" is the opposite of "cannot say".
    expect(out.body.would_block_now).toBeNull();
    expect(out.body.distribution.observed).toBe(0);
    expect(out.body.note).toMatch(/No shadow observations/);
  });

  it('every observation errored: says the judge is not answering', async () => {
    h.rows = [errored(), errored(), errored()];
    const out = await call();

    // This is the case that would otherwise look like uniformly terrible
    // content: three scores of zero, and no indication they are not real.
    expect(out.body.distribution.observed).toBe(3);
    expect(out.body.distribution.scored).toBe(0);
    expect(out.body.would_block_now).toBeNull();
    expect(out.body.note).toMatch(/judge is not answering/);
  });
});

describe('with real scores', () => {
  it('reports what flipping the gate today would refuse, as a share', async () => {
    // Four scored rows, two below the default 0.65. The field is a SHARE of
    // scored content, not a count — worth pinning, because a reader who takes
    // it for a count reads 0.5 as "half a document" instead of "half of them".
    h.rows = [scored(0.2), scored(0.5), scored(0.8), scored(0.9)];
    const out = await call();

    expect(out.body.would_block_now).toBe(0.5);
    expect(out.body.distribution.scored).toBe(4);
    expect(out.body.note).toBeUndefined();
  });

  it('honours a threshold override, so the operator can try one before flipping', async () => {
    process.env.VIDHYA_PEDAGOGY_THRESHOLD = '0.85';
    h.rows = [scored(0.2), scored(0.5), scored(0.8), scored(0.9)];
    const out = await call();

    expect(out.body.current_threshold).toBe(0.85);
    expect(out.body.would_block_now).toBe(0.75);
  });

  it('excludes errored rows from the block count', async () => {
    // An errored row carries score 0. Counting it as "would be blocked"
    // would inflate the cost of flipping the gate with content the judge
    // never actually assessed.
    h.rows = [scored(0.9), errored(), errored()];
    const out = await call();

    expect(out.body.would_block_now).toBe(0);
    expect(out.body.distribution.errored).toBe(2);
  });

  it('reports the gate state separately from the threshold', async () => {
    process.env.VIDHYA_PEDAGOGY_GATE = 'on';
    h.rows = [scored(0.9)];
    const out = await call();

    expect(out.body.gate_enabled).toBe(true);
    expect(out.body.source).toBe('fake:shadow');
  });

  it('a malformed threshold falls back to the default rather than NaN', async () => {
    process.env.VIDHYA_PEDAGOGY_THRESHOLD = 'not-a-number';
    h.rows = [scored(0.2), scored(0.9)];
    const out = await call();

    expect(Number.isNaN(out.body.current_threshold)).toBe(false);
    expect(out.body.current_threshold).toBe(0.65);
    expect(out.body.would_block_now).toBe(0.5);
  });
});
