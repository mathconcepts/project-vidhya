/**
 * run-dispatcher.test.ts
 *
 * Before v4.26.0, admin-launched GenerationRuns (RunLauncher "Launch",
 * ledger "run now") only ever inserted a queued row — nothing consumed
 * it. dispatchRun() is the fix: these tests pin its two dispatch modes
 * (atom / unit), its quota enforcement, and its status-transition
 * contract, with every generator mocked so no DB or LLM calls happen.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { GenerationRunConfig, GenerationRunRow } from '../../experiments/types';

const mockGetRun = vi.fn();
const mockListRuns = vi.fn();
const mockMarkRunStarted = vi.fn();
const mockMarkRunComplete = vi.fn();
const mockMarkRunFailed = vi.fn();
const mockUpdateRunCost = vi.fn();
const mockIncrementRunArtifacts = vi.fn();

vi.mock('../run-orchestrator', () => ({
  getRun: (...args: any[]) => mockGetRun(...args),
  listRuns: (...args: any[]) => mockListRuns(...args),
  markRunStarted: (...args: any[]) => mockMarkRunStarted(...args),
  markRunComplete: (...args: any[]) => mockMarkRunComplete(...args),
  markRunFailed: (...args: any[]) => mockMarkRunFailed(...args),
  updateRunCost: (...args: any[]) => mockUpdateRunCost(...args),
  incrementRunArtifacts: (...args: any[]) => mockIncrementRunArtifacts(...args),
}));

const mockGenerateConcept = vi.fn();
vi.mock('../../content/concept-orchestrator', () => ({
  generateConcept: (...args: any[]) => mockGenerateConcept(...args),
}));

const mockGenerateUnitsForRun = vi.fn();
vi.mock('../curriculum-unit-orchestrator', () => ({
  generateUnitsForRun: (...args: any[]) => mockGenerateUnitsForRun(...args),
}));

const mockGetConceptsForTopic = vi.fn();
vi.mock('../../constants/concept-graph', () => ({
  CONCEPT_MAP: new Map([['derivatives-basic', { id: 'derivatives-basic', topic: 'calculus' }]]),
  getConceptsForTopic: (...args: any[]) => mockGetConceptsForTopic(...args),
}));

const { dispatchRun, resumeQueuedRuns } = await import('../run-dispatcher');

function baseConfig(overrides: Partial<GenerationRunConfig> = {}): GenerationRunConfig {
  return {
    target: {},
    pipeline: {},
    verification: { tier_ceiling: 'rag' },
    quota: { count: 10, max_cost_usd: 5 },
    ...overrides,
  } as GenerationRunConfig;
}

function baseRun(overrides: Partial<GenerationRunRow> = {}): GenerationRunRow {
  return {
    id: 'run_1',
    exam_pack_id: 'gate-ma',
    experiment_id: null,
    hypothesis: null,
    config: baseConfig(),
    git_sha: 'abc123',
    status: 'queued',
    cost_usd: 0,
    artifacts_count: 0,
    error: null,
    created_at: new Date().toISOString(),
    started_at: null,
    completed_at: null,
    ...overrides,
  };
}

function draft(atomCount: number, cost: number) {
  return {
    concept_id: 'x',
    topic_family: 'calculus',
    generated_at: new Date().toISOString(),
    total_cost_usd: cost,
    atoms: Array.from({ length: atomCount }, (_, i) => ({ atom_id: `x.atom-${i}` })),
    rejected_atoms: [],
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('dispatchRun · atom mode', () => {
  it('resolves concept_ids directly, threads model_id + generation_run_id, and marks complete', async () => {
    const run = baseRun({
      config: baseConfig({
        target: { concept_ids: ['derivatives-basic'] },
        pipeline: { llm_models: ['gpt-4o'] },
      }),
    });
    mockGetRun.mockResolvedValue(run);
    mockGenerateConcept.mockResolvedValue(draft(3, 0.05));

    await dispatchRun('run_1');

    expect(mockMarkRunStarted).toHaveBeenCalledWith('run_1');
    expect(mockGenerateConcept).toHaveBeenCalledWith(
      expect.objectContaining({
        concept_id: 'derivatives-basic',
        topic_family: 'calculus',
        dry_run: false,
        model_id: 'gpt-4o',
        generation_run_id: 'run_1',
      }),
    );
    expect(mockIncrementRunArtifacts).toHaveBeenCalledWith('run_1', 3);
    expect(mockUpdateRunCost).toHaveBeenCalledWith('run_1', 0.05);
    expect(mockMarkRunComplete).toHaveBeenCalledWith('run_1', 0.05);
    expect(mockMarkRunFailed).not.toHaveBeenCalled();
  });

  it('resolves topic_id via the concept graph when concept_ids is absent', async () => {
    const run = baseRun({ config: baseConfig({ target: { topic_id: 'calculus' } }) });
    mockGetRun.mockResolvedValue(run);
    mockGetConceptsForTopic.mockReturnValue([{ id: 'limits', topic: 'calculus' }]);
    mockGenerateConcept.mockResolvedValue(draft(1, 0.01));

    await dispatchRun('run_1');

    expect(mockGetConceptsForTopic).toHaveBeenCalledWith('calculus');
    expect(mockGenerateConcept).toHaveBeenCalledWith(expect.objectContaining({ concept_id: 'limits' }));
    expect(mockMarkRunComplete).toHaveBeenCalled();
  });

  it('stops issuing concepts once quota.count is reached', async () => {
    const run = baseRun({
      config: baseConfig({
        target: { concept_ids: ['a', 'b', 'c'] },
        quota: { count: 2, max_cost_usd: 100 },
      }),
    });
    mockGetRun.mockResolvedValue(run);
    mockGenerateConcept.mockResolvedValue(draft(2, 0.01));

    await dispatchRun('run_1');

    // First concept alone already produces 2 atoms == quota.count, so the
    // loop should stop before issuing a second generateConcept call.
    expect(mockGenerateConcept).toHaveBeenCalledTimes(1);
  });

  it('stops issuing concepts once quota.max_cost_usd is spent', async () => {
    const run = baseRun({
      config: baseConfig({
        target: { concept_ids: ['a', 'b', 'c'] },
        quota: { count: 100, max_cost_usd: 1 },
      }),
    });
    mockGetRun.mockResolvedValue(run);
    mockGenerateConcept.mockResolvedValue(draft(1, 1));

    await dispatchRun('run_1');

    expect(mockGenerateConcept).toHaveBeenCalledTimes(1);
  });

  it('marks the run failed when no concepts can be resolved', async () => {
    const run = baseRun({ config: baseConfig({ target: {} }) });
    mockGetRun.mockResolvedValue(run);

    await dispatchRun('run_1');

    expect(mockGenerateConcept).not.toHaveBeenCalled();
    expect(mockMarkRunFailed).toHaveBeenCalledWith('run_1', expect.stringContaining('no concepts resolved'));
    expect(mockMarkRunComplete).not.toHaveBeenCalled();
  });

  it('threads config.preview into generateConcept as dry_run', async () => {
    const run = baseRun({
      config: baseConfig({ target: { concept_ids: ['derivatives-basic'] }, preview: true }),
    });
    mockGetRun.mockResolvedValue(run);
    mockGenerateConcept.mockResolvedValue(draft(2, 0.02));

    await dispatchRun('run_1');

    expect(mockGenerateConcept).toHaveBeenCalledWith(expect.objectContaining({ dry_run: true }));
    // Preview runs still track cost/artifacts and complete normally —
    // only atom_versions persistence is skipped (inside generateConcept).
    expect(mockIncrementRunArtifacts).toHaveBeenCalledWith('run_1', 2);
    expect(mockMarkRunComplete).toHaveBeenCalledWith('run_1', 0.02);
  });

  it('marks the run failed when generateConcept throws', async () => {
    const run = baseRun({ config: baseConfig({ target: { concept_ids: ['a'] } }) });
    mockGetRun.mockResolvedValue(run);
    mockGenerateConcept.mockRejectedValue(new Error('provider outage'));

    await dispatchRun('run_1');

    expect(mockMarkRunFailed).toHaveBeenCalledWith('run_1', 'provider outage');
  });
});

describe('dispatchRun · unit mode', () => {
  it('dispatches via generateUnitsForRun and threads pipeline_config', async () => {
    const run = baseRun({
      config: baseConfig({
        target: {
          curriculum_unit_specs: [
            {
              exam_pack_id: 'gate-ma',
              concept_id: 'eigenvalues',
              name: 'Eigenvalues unit',
              learning_objectives: [],
              prepared_for_pyq_ids: [],
              atom_kinds: ['intuition'],
            },
          ],
        },
        pipeline: { llm_models: ['claude-sonnet-4-5'] },
      }),
    });
    mockGetRun.mockResolvedValue(run);
    mockGenerateUnitsForRun.mockResolvedValue([
      { unit_id: 'u1', status: 'ready', atoms_generated: 4, pedagogy_score: 8, cost_usd: 0.2, duration_ms: 10 },
    ]);

    await dispatchRun('run_1');

    expect(mockGenerateUnitsForRun).toHaveBeenCalledWith(
      run.config.target.curriculum_unit_specs,
      expect.objectContaining({
        generation_run_id: 'run_1',
        pipeline_config: run.config.pipeline,
        verification_config: run.config.verification,
      }),
    );
    expect(mockIncrementRunArtifacts).toHaveBeenCalledWith('run_1', 4);
    expect(mockMarkRunComplete).toHaveBeenCalledWith('run_1', 0.2);
    expect(mockGenerateConcept).not.toHaveBeenCalled();
  });
});

describe('dispatchRun · guard rails', () => {
  it('no-ops when the run does not exist', async () => {
    mockGetRun.mockResolvedValue(null);
    await dispatchRun('missing');
    expect(mockMarkRunStarted).not.toHaveBeenCalled();
  });

  it('no-ops when the run has already left queued (e.g. running elsewhere)', async () => {
    mockGetRun.mockResolvedValue(baseRun({ status: 'running' }));
    await dispatchRun('run_1');
    expect(mockMarkRunStarted).not.toHaveBeenCalled();
    expect(mockGenerateConcept).not.toHaveBeenCalled();
  });
});

describe('resumeQueuedRuns', () => {
  it('dispatches every queued run returned by listRuns', async () => {
    mockListRuns.mockResolvedValue([baseRun({ id: 'run_a' }), baseRun({ id: 'run_b' })]);
    mockGetRun.mockImplementation(async (id: string) => baseRun({ id, config: baseConfig({ target: { concept_ids: ['derivatives-basic'] } }) }));
    mockGenerateConcept.mockResolvedValue(draft(1, 0.01));

    const result = await resumeQueuedRuns();

    expect(mockListRuns).toHaveBeenCalledWith({ status: 'queued', limit: 50 });
    expect(result.resumed).toBe(2);
    // Give the fire-and-forget dispatchRun() calls a tick to land.
    await new Promise((r) => setTimeout(r, 0));
    expect(mockMarkRunStarted).toHaveBeenCalledWith('run_a');
    expect(mockMarkRunStarted).toHaveBeenCalledWith('run_b');
  });
});
