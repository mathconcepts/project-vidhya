/**
 * The pedagogy shadow criterion.
 *
 * The gate this feeds has sat in shadow mode since it was written, with a
 * threshold of 0.65 that nobody measured. These tests pin the two ways
 * flipping it blind goes wrong, and the one way the numbers lie.
 */
import { describe, it, expect } from 'vitest';
import {
  summarize,
  flipVerdict,
  rowFromResult,
  MIN_SCORED_FOR_CRITERION,
  MAX_ERROR_RATE,
  type PedagogyShadowRow,
} from '../pedagogy-shadow';

const scored = (score: number, id = `u${score}`): PedagogyShadowRow => ({
  target_id: id,
  score,
  errored: false,
});
const errored = (id: string): PedagogyShadowRow => ({
  target_id: id,
  score: 0,
  errored: true,
  reason: 'pedagogy-verifier-error: no provider',
});

/** n scored rows spread evenly across [lo, hi]. */
function spread(n: number, lo = 0.4, hi = 0.95): PedagogyShadowRow[] {
  return Array.from({ length: n }, (_, i) => scored(lo + ((hi - lo) * i) / (n - 1), `u${i}`));
}

describe('an error is not a zero', () => {
  it('excludes errored rows from every statistic', () => {
    const d = summarize([scored(0.8, 'a'), scored(0.6, 'b'), errored('c'), errored('d')]);
    expect(d.observed).toBe(4);
    expect(d.scored).toBe(2);
    expect(d.errored).toBe(2);
    expect(d.min).toBe(0.6);
    // A naive summary would report min 0 and drag the median to 0.3.
    expect(d.p50).toBeCloseTo(0.7, 5);
  });

  it('reports null statistics rather than zeros when everything errored', () => {
    // The situation with no reachable provider: 82 rows, all score 0. Reading
    // that as a distribution would argue for a threshold of zero.
    const d = summarize(Array.from({ length: 82 }, (_, i) => errored(`u${i}`)));
    expect(d.scored).toBe(0);
    expect(d.p50).toBeNull();
    expect(d.min).toBeNull();
    expect(d.error_rate).toBe(1);
  });

  it('refuses to flip when the judge is mostly not answering', () => {
    const rows = [...spread(40), ...Array.from({ length: 40 }, (_, i) => errored(`e${i}`))];
    const v = flipVerdict(rows);
    expect(v.ready).toBe(false);
    expect(v.blockers.join(' ')).toMatch(/error rate/);
  });

  it('classifies both verifier failure modes as errored, not as a score', () => {
    expect(rowFromResult('u1', { score: 0, reason: 'pedagogy-verifier-error: 429' }).errored).toBe(true);
    expect(
      rowFromResult('u1', { score: 0, reason: 'pedagogy-verifier-malformed-llm-output' }).errored,
    ).toBe(true);
  });

  it('does not mistake a genuine low score for an error', () => {
    const r = rowFromResult('u1', { score: 0.12, reason: 'score 0.120 below threshold 0.65: thin' });
    expect(r.errored).toBe(false);
    expect(r.score).toBe(0.12);
  });

  it('treats a genuine zero as scored, not errored', () => {
    // Content really can score zero. Only the two verifier-error reasons mean
    // "no answer".
    expect(rowFromResult('u1', { score: 0 }).errored).toBe(false);
  });
});

describe('a small sample is not a distribution', () => {
  it('refuses to flip on too few observations', () => {
    const v = flipVerdict(spread(5));
    expect(v.ready).toBe(false);
    expect(v.blockers.join(' ')).toMatch(/need 30/);
  });

  it('states the minimum rather than hiding it', () => {
    expect(MIN_SCORED_FOR_CRITERION).toBeGreaterThanOrEqual(30);
    expect(MAX_ERROR_RATE).toBeLessThanOrEqual(0.1);
  });

  it('flips once there is enough clean signal', () => {
    const v = flipVerdict(spread(40));
    expect(v.ready).toBe(true);
    expect(v.suggested_threshold).not.toBeNull();
  });
});

describe('the threshold is derived, not assumed', () => {
  it('suggests a threshold from the observed spread', () => {
    const v = flipVerdict(spread(40, 0.5, 0.9), { maxBlockRate: 0.2 });
    // Blocking the weakest 20% of a 0.5..0.9 spread lands near 0.58.
    expect(v.suggested_threshold!).toBeGreaterThan(0.5);
    expect(v.suggested_threshold!).toBeLessThan(0.7);
  });

  it('blocks roughly the share it was asked to block', () => {
    const rows = spread(40, 0.5, 0.9);
    const v = flipVerdict(rows, { maxBlockRate: 0.2 });
    const blocked = summarize(rows).would_block_at(v.suggested_threshold!);
    expect(blocked).toBeGreaterThan(0.1);
    expect(blocked).toBeLessThan(0.3);
  });

  it('moves with the data instead of returning a constant', () => {
    // The failure this guards: returning 0.65 whatever the content looks like.
    const low = flipVerdict(spread(40, 0.1, 0.4)).suggested_threshold!;
    const high = flipVerdict(spread(40, 0.7, 0.99)).suggested_threshold!;
    expect(high).toBeGreaterThan(low);
  });

  it('would NOT endorse the hardcoded 0.65 on weak content', () => {
    // If every unit scores 0.1-0.4, gating at 0.65 blocks everything. The
    // criterion says so rather than reporting ready.
    const rows = spread(40, 0.1, 0.4);
    expect(summarize(rows).would_block_at(0.65)).toBe(1);
    expect(flipVerdict(rows).suggested_threshold!).toBeLessThan(0.65);
  });
});

describe('would_block_at', () => {
  it('is zero when nothing falls below the threshold', () => {
    expect(summarize(spread(10, 0.8, 0.9)).would_block_at(0.5)).toBe(0);
  });

  it('is zero on an empty set rather than dividing by zero', () => {
    expect(summarize([]).would_block_at(0.5)).toBe(0);
    expect(summarize([]).observed).toBe(0);
  });
});
