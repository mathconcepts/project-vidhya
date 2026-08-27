/**
 * Wiring test for W1.6: the nightly learnings-ledger's promote step runs
 * the three anti-gaming guards (src/experiments/promote-guards.ts) over
 * repo-fetched cohort aggregates BEFORE flipping an experiment to `won`.
 *
 * Every collaborator (registry.ts, lift.ts's computeLift, the suggester,
 * the repo factory) is mocked so this stays a pure wiring test — the
 * guards' own arithmetic is covered exhaustively by
 * src/experiments/__tests__/promote-guards.test.ts; this file only checks
 * that a tripped guard actually redirects the ledger's decision.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ExperimentRow, GenerationRunConfig } from '../../experiments/types';

const mockListExperiments = vi.fn();
const mockUpdateExperimentStatus = vi.fn();
vi.mock('../../experiments/registry', () => ({
  listExperiments: (...args: unknown[]) => mockListExperiments(...args),
  updateExperimentStatus: (...args: unknown[]) => mockUpdateExperimentStatus(...args),
}));

// DB-less: computeLift's own module resolves to null with no pool — no
// need to touch the real lift math here, this test is about the ledger's
// promote-vs-hold DECISION, not the lift computation itself.
vi.mock('../../experiments/lift', () => ({
  computeLift: vi.fn(async () => null),
}));

// Isolate the guard-review path from the confirm/ride/recover-loss
// suggester rules (src/generation/suggester.ts) — those are covered by
// their own test file and would otherwise also fire for the same
// favorable lift fixture used below.
vi.mock('../../generation/suggester', () => ({
  suggestRuns: () => [],
}));

function makeFakeRepo(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    fetchAtomTargets: vi.fn(async () => ['atom_x']),
    applyPromotion: vi.fn(async () => {}),
    applyDemotion: vi.fn(async () => {}),
    loadRecentRunConfigs: vi.fn(async () => [{ experiment_id: 'exp_a', config: BASE_CONFIG }]),
    upsertSuggestion: vi.fn(async () => {}),
    markLedgerRunRunning: vi.fn(async () => {}),
    markLedgerRunComplete: vi.fn(async () => {}),
    fetchDelayedRetention: vi.fn(async () => null),
    fetchModeSplitAccuracy: vi.fn(async () => []),
    fetchSpeedAccuracy: vi.fn(async () => null),
    ...overrides,
  };
}

let fakeRepo = makeFakeRepo();
vi.mock('../../storage/repositories/learnings-ledger-repo', () => ({
  getLearningsLedgerRepo: () => fakeRepo,
}));

const { runLearningsLedger } = await import('../learnings-ledger');

const BASE_CONFIG: GenerationRunConfig = {
  target: { topic_id: 'linear-algebra' },
  pipeline: { llm_models: ['gemini-2.5-flash'], pyq_grounding: true, multi_llm_consensus: false },
  verification: { tier_ceiling: 'wolfram', gemini_dual_solve: true },
  quota: { count: 50, max_cost_usd: 5 },
};

function experiment(over: Partial<ExperimentRow> = {}): ExperimentRow {
  return {
    id: 'exp_a',
    name: 'PYQ-grounded LA wins',
    exam_pack_id: 'gate-ma',
    git_sha: 'abc',
    hypothesis: 'more PYQ grounding lifts mastery',
    variant_kind: 'atom',
    started_at: '2026-04-25T00:00:00Z',
    ended_at: null,
    status: 'active',
    lift_v1: 0.18,
    lift_n: 60,
    lift_p: 0.001,
    lift_updated_at: null,
    metadata: {},
    ...over,
  };
}

beforeEach(() => {
  mockListExperiments.mockReset();
  mockUpdateExperimentStatus.mockReset();
  fakeRepo = makeFakeRepo();
});

describe('runLearningsLedger — W1.6 anti-gaming guards', () => {
  it('a would-be win with NO guard data (DB-less honesty) promotes exactly as before this plan', async () => {
    const exp = experiment();
    mockListExperiments.mockResolvedValue([exp]);

    const result = await runLearningsLedger({ no_digest: true, no_pr: true });

    expect(result.promotions).toBe(1);
    expect(result.held_for_review).toBe(0);
    expect(mockUpdateExperimentStatus).toHaveBeenCalledWith('exp_a', 'won');
    expect(fakeRepo.applyPromotion).toHaveBeenCalledTimes(1);
    expect(fakeRepo.upsertSuggestion).not.toHaveBeenCalled();
  });

  it('a tripped guard (flat delayed retention) holds the promotion instead of auto-promoting', async () => {
    const exp = experiment();
    mockListExperiments.mockResolvedValue([exp]);
    fakeRepo = makeFakeRepo({
      fetchDelayedRetention: vi.fn(async () => ({ delta: 0.0, n: 40 })), // flat — guard 1 trips
    });

    const result = await runLearningsLedger({ no_digest: true, no_pr: true });

    expect(result.promotions).toBe(0);
    expect(result.held_for_review).toBe(1);
    expect(mockUpdateExperimentStatus).not.toHaveBeenCalled();
    expect(fakeRepo.applyPromotion).not.toHaveBeenCalled();
    // A review suggestion was written, naming the guard.
    expect(fakeRepo.upsertSuggestion).toHaveBeenCalledTimes(1);
    const suggestion = fakeRepo.upsertSuggestion.mock.calls[0][0];
    expect(suggestion.id).toBe('sugg_review_exp_a');
    expect(suggestion.source_experiment_id).toBe('exp_a');
    expect(suggestion.reason).toContain('immediate_lift_flat_retention');
  });

  it('a held experiment keeps status=active — the next run reconsiders it, never demoted by a guard', async () => {
    const exp = experiment();
    mockListExperiments.mockResolvedValue([exp]);
    fakeRepo = makeFakeRepo({
      fetchModeSplitAccuracy: vi.fn(async () => [
        { kind: 'mcq' as const, accuracyPre: 0.5, nPre: 30, accuracyPost: 0.6, nPost: 30 },
        { kind: 'nat' as const, accuracyPre: 0.5, nPre: 30, accuracyPost: 0.4, nPost: 30 },
      ]),
    });

    await runLearningsLedger({ no_digest: true, no_pr: true });

    expect(mockUpdateExperimentStatus).not.toHaveBeenCalled();
    expect(fakeRepo.applyDemotion).not.toHaveBeenCalled();
  });

  it('no baseConfig for the held experiment: still holds the promotion, but writes no unlaunchable suggestion', async () => {
    const exp = experiment();
    mockListExperiments.mockResolvedValue([exp]);
    fakeRepo = makeFakeRepo({
      loadRecentRunConfigs: vi.fn(async () => []), // no config on file for this experiment
      fetchDelayedRetention: vi.fn(async () => ({ delta: -0.02, n: 30 })),
    });

    const result = await runLearningsLedger({ no_digest: true, no_pr: true });

    expect(result.promotions).toBe(0);
    expect(result.held_for_review).toBe(1);
    expect(fakeRepo.upsertSuggestion).not.toHaveBeenCalled();
  });

  it('a lift below the promotion threshold never reaches the guards at all', async () => {
    const exp = experiment({ lift_v1: 0.01 }); // below win_lift_threshold
    mockListExperiments.mockResolvedValue([exp]);
    fakeRepo = makeFakeRepo({
      fetchDelayedRetention: vi.fn(async () => { throw new Error('should never be called'); }),
    });

    const result = await runLearningsLedger({ no_digest: true, no_pr: true });

    expect(result.promotions).toBe(0);
    expect(result.held_for_review).toBe(0);
  });

  it('a held decision surfaces through result.held_for_review regardless of the digest step', async () => {
    // no_digest:true here deliberately — the markdown CONTENT is already
    // covered by the pure buildDigest tests in
    // src/jobs/__tests__/learnings-ledger-digest.test.ts (including a
    // 'held' fixture); this file stays a pure wiring test and never writes
    // to docs/learnings/ on disk.
    const exp = experiment();
    mockListExperiments.mockResolvedValue([exp]);
    fakeRepo = makeFakeRepo({
      fetchDelayedRetention: vi.fn(async () => ({ delta: 0.0, n: 40 })),
    });

    const result = await runLearningsLedger({ no_digest: true, no_pr: true });

    expect(result.held_for_review).toBe(1);
    expect(result.digest_path).toBeNull();
  });
});
