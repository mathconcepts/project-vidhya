import { describe, it, expect, beforeEach } from 'vitest';
import {
  buildSegmentProgress,
  buildResultCopy,
  isSelectionCorrect,
  classifyPersistFailure,
  savePendingWarmupResults,
  loadPendingWarmupResults,
  clearPendingWarmupResults,
  WARMUP_SKIP_LANDING_COPY,
  WARMUP_EARLY_READY_COPY,
  WARMUP_SAVE_ERROR_COPY,
  WARMUP_SIGNIN_REQUIRED_COPY,
  type SpineConcept,
} from './warmup-logic';

const SPINE: SpineConcept[] = [
  { id: 'matrix-operations', label: 'Matrix operations' },
  { id: 'determinants', label: 'Determinants' },
  { id: 'matrix-inverse', label: 'Matrix inverse' },
  { id: 'systems-of-equations', label: 'Systems of equations' },
  { id: 'eigenvalues', label: 'Eigenvalues' },
];

describe('buildSegmentProgress', () => {
  it('marks earlier concepts done, the current one now, the rest todo', () => {
    const { segments, label } = buildSegmentProgress(1, SPINE);
    expect(segments).toEqual(['done', 'now', 'todo', 'todo', 'todo']);
    expect(label).toBe('Concept 2 of 5 · Determinants');
  });

  it('the first concept has no done segments', () => {
    const { segments } = buildSegmentProgress(0, SPINE);
    expect(segments[0]).toBe('now');
    expect(segments.slice(1).every((s) => s === 'todo')).toBe(true);
  });
});

describe('isSelectionCorrect', () => {
  it('matches the answer index', () => {
    expect(isSelectionCorrect(2, 2)).toBe(true);
    expect(isSelectionCorrect(1, 2)).toBe(false);
  });

  it('"I haven\'t learned this yet" (-1 sentinel slot) is always an honest miss', () => {
    expect(isSelectionCorrect(-1, 0)).toBe(false);
    expect(isSelectionCorrect(-1, -1)).toBe(false);
  });

  it('an item with no real answer key never grades as correct', () => {
    expect(isSelectionCorrect(0, null)).toBe(false);
    expect(isSelectionCorrect(0, undefined)).toBe(false);
  });
});

describe('buildResultCopy', () => {
  it('leads with competence when concepts were placed, names the frontier', () => {
    const r = buildResultCopy(SPINE, ['matrix-operations', 'determinants'], 'matrix-inverse', true);
    expect(r.earlyReady).toBe(false);
    expect(r.headline).toBe("You're solid through Determinants.");
    expect(r.placementLine).toBe("We'll start you at Matrix inverse — the interesting part.");
    expect(r.rows.find((row) => row.id === 'matrix-operations')!.dot).toBe('placed');
    expect(r.rows.find((row) => row.id === 'determinants')!.dot).toBe('placed');
    expect(r.rows.find((row) => row.id === 'matrix-inverse')!.dot).toBe('frontier');
    expect(r.rows.find((row) => row.id === 'systems-of-equations')!.dot).toBe('later');
  });

  it('no score, no per-item review, no red anywhere — copy never mentions marks/points/wrong', () => {
    const r = buildResultCopy(SPINE, ['matrix-operations'], 'determinants', true);
    const all = (r.headline + r.placementLine).toLowerCase();
    expect(all).not.toMatch(/score|point|wrong|elo/);
  });

  it('falls back to "We\'ll start at the beginning" when nothing was placed but probes were answered', () => {
    const r = buildResultCopy(SPINE, [], 'matrix-operations', true);
    expect(r.earlyReady).toBe(false);
    expect(r.headline).toBe(WARMUP_SKIP_LANDING_COPY);
  });

  it('renders the honest early-ready state when no probe was ever answered (empty band on concept 1)', () => {
    const r = buildResultCopy(SPINE, [], null, false);
    expect(r.earlyReady).toBe(true);
    expect(r.headline).toBe(WARMUP_EARLY_READY_COPY);
  });

  it('handles full placement (frontier null) without claiming a starting concept that does not exist', () => {
    const r = buildResultCopy(SPINE, SPINE.map((c) => c.id), null, true);
    expect(r.placementLine).not.toContain('undefined');
    expect(r.placementLine.length).toBeGreaterThan(0);
  });
});

// ────────────────────────────────────────────────────────────────────
// Red-team fix 1: anonymous warmup persist dead-end
// ────────────────────────────────────────────────────────────────────

describe('classifyPersistFailure', () => {
  it('routes a 401 (anonymous caller) to the sign-in phase, never the generic retry', () => {
    expect(classifyPersistFailure(401)).toBe('sign-in');
  });

  it('routes every other failure to the existing (genuinely retriable) save-error path', () => {
    expect(classifyPersistFailure(500)).toBe('save-error');
    expect(classifyPersistFailure(502)).toBe('save-error');
    expect(classifyPersistFailure(400)).toBe('save-error');
    // A thrown network error (no HTTP status at all) is also transient —
    // it must not be mistaken for the un-retriable 401 case.
    expect(classifyPersistFailure(null)).toBe('save-error');
    expect(classifyPersistFailure(undefined)).toBe('save-error');
  });

  it('the two copy strings are distinct — the sign-in phase never reuses the un-retriable promise', () => {
    expect(WARMUP_SIGNIN_REQUIRED_COPY).not.toBe(WARMUP_SAVE_ERROR_COPY);
    expect(WARMUP_SIGNIN_REQUIRED_COPY.toLowerCase()).toContain('sign in');
    // The save-error copy is allowed to say "tap to retry" (it is
    // genuinely retriable); the sign-in copy must not promise that.
    expect(WARMUP_SIGNIN_REQUIRED_COPY.toLowerCase()).not.toContain('retry');
  });
});

describe('pending warmup results storage', () => {
  beforeEach(() => {
    clearPendingWarmupResults();
  });

  it('round-trips results saved before sign-in so they survive the 401', () => {
    const results = [
      { skill_id: 'determinants', converged: true, ability_estimate: 1120, probes_used: 3, predicted_success_at_close: 0.7 },
    ];
    savePendingWarmupResults(results);
    expect(loadPendingWarmupResults()).toEqual(results);
  });

  it('returns null when nothing is pending', () => {
    expect(loadPendingWarmupResults()).toBeNull();
  });

  it('clears cleanly after a successful persist', () => {
    savePendingWarmupResults([{ skill_id: 'x' }]);
    clearPendingWarmupResults();
    expect(loadPendingWarmupResults()).toBeNull();
  });
});
