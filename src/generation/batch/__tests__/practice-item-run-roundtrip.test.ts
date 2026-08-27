/**
 * Full round trip for a practice-item batch run: spec-to-atom.ts's
 * deterministic AtomSpec builder → the REAL batch orchestrator's
 * queued -> prepared -> submitted -> downloading -> processing -> complete
 * state machine (in-memory persistence, a fake/mocked provider adapter —
 * no network) → the REAL dispatchPracticeItemJob / evaluateAutomatedGates /
 * recordGates pipeline, with only the leaf provider calls
 * (wolframCheck) faked.
 *
 * Pins the two outcomes docs/ops/content-verification-runbook.md's §3.2
 * (now rewritten) promises once the run is seeded: the written item
 * carries generation_run_id provenance, and a gate-ledger row is recorded
 * for every one of the five named gates — with `mathematics` always
 * 'pending', never auto-decided (gate-ledger.ts's one non-negotiable rule).
 */
import { describe, it, expect, vi } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import type pg from 'pg';

import { createBatchOrchestrator } from '../orchestrator';
import { customIdFor } from '../jsonl-builder';
import type { BatchAdapter } from '../types';
import { createInMemoryPersistence, newRun } from './_in-memory-persistence';
import { handleJobProcessed, type JobProcessedDeps, type RunLookupResult, type RecordItemGatesInput } from '../poller';
import { dispatchPracticeItemJob } from '../../practice-item-factory/batch-dispatch';
import { practiceItemSpecsToAtomSpecs } from '../../practice-item-factory/spec-to-atom';
import { evaluateAutomatedGates, recordGates, CONTENT_GATES } from '../../gate-ledger';
import { resolveAssessmentContract } from '../../../exams/assessment-contract-loader';
import type { AuthoredItem } from '../../../scoring/learning-object-catalog-file';

const RUN_ID = 'run-practice-item-rt';

const spec = {
  concept_id: 'eigenvalues',
  format: 'nat' as const,
  difficulty: 0.4,
  topic: 'linear-algebra',
  require_failure_tags: true,
};

const atomSpecs = practiceItemSpecsToAtomSpecs([spec]);
const EXPECTED_CUSTOM_ID = customIdFor(RUN_ID, atomSpecs[0]);

const rawProviderResponse = {
  question_text: 'What is the sum of the eigenvalues of the 3x3 identity matrix?',
  correct_answer: '3',
  distractors: [],
  solution_steps: ['Sum of eigenvalues = trace(I_3) = 1 + 1 + 1 = 3.'],
  difficulty: 0.4,
};

function makeMockedProviderAdapter(): BatchAdapter {
  return {
    provider: 'gemini',
    async submitBatch({ display_name }) {
      return { batch_id: `batch-${display_name}`, submitted_at: new Date().toISOString() };
    },
    async pollBatch() {
      return { kind: 'complete', output_url: 'https://fake-provider/output.jsonl' };
    },
    async downloadResults() {
      return 'unused — parseResults below ignores its input and returns a fixed row';
    },
    async cancelBatch() {},
    parseResults() {
      return [{ custom_id: EXPECTED_CUSTOM_ID, status: 'succeeded', result: rawProviderResponse }];
    },
  };
}

/** Captures every INSERT recordGates issues, without touching a real DB. */
function makeFakePool() {
  const calls: Array<{ sql: string; params: unknown[] }> = [];
  const pool = {
    query: vi.fn(async (sql: string, params: unknown[]) => {
      calls.push({ sql, params });
      return { rows: [] };
    }),
  } as unknown as pg.Pool;
  return { pool, calls };
}

describe('practice-item batch run — full round trip (mocked provider)', () => {
  it('seeds via spec-to-atom, drives the real state machine to complete, and writes gate-ledger rows + a generation_run_id-stamped item', async () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'practice-item-rt-'));
    try {
      const persistence = createInMemoryPersistence({
        runs: [newRun(RUN_ID, { batch_state: 'queued', budget_remaining_usd: 100 })],
      });

      const writtenBanks: Array<{ bankPath: string; items: AuthoredItem[] }> = [];
      const { pool: fakePool, calls: gateInserts } = makeFakePool();

      const deps: JobProcessedDeps = {
        getRun: async (): Promise<RunLookupResult> => ({
          exam_pack_id: 'gate-ma',
          config: { target: { practice_item_specs: [spec] } },
        }),
        dispatchPracticeItemJob, // REAL — parse -> assemble -> verify
        writePracticeItemBank: (bankPath, items) => {
          writtenBanks.push({ bankPath, items: [...items] });
        },
        getPracticeItemDispatchDeps: async () => ({
          // The only faked leg: the Wolfram provider call itself.
          wolframCheck: async () => ({ status: 'verified' as const, wolfram_answer: '3' }),
        }),
        recordItemGates: async (input: RecordItemGatesInput) => {
          // REAL gate evaluation + REAL recordGates SQL construction,
          // against a fake pg.Pool that just records what would have been
          // written — this is the "gate-ledger integration" half of the
          // round trip, exercised without a live database.
          const contract = await resolveAssessmentContract();
          const verdicts = evaluateAutomatedGates({
            item: input.item,
            verification: input.verification,
            requireFailureTags: input.requireFailureTags,
            contractVersion: contract.version,
          });
          await recordGates(
            { generation_run_id: input.generation_run_id, item_id: input.item.id, verdicts },
            fakePool,
          );
        },
      };

      const orch = createBatchOrchestrator({
        persistence,
        adapter: makeMockedProviderAdapter(),
        jsonlDir: tmp,
        onJobProcessed: (run_id, job) => handleJobProcessed(run_id, job, deps),
      });

      // queued -> prepared: seeds atom_specs as batch_jobs, writes JSONL,
      // passes the budget check (budget_remaining_usd: 100 comfortably
      // covers one nat item's estimate).
      let result = await orch.step(RUN_ID, atomSpecs);
      expect(result).toMatchObject({ kind: 'transitioned', from: 'queued', to: 'prepared' });
      expect(fs.existsSync(path.join(tmp, `${RUN_ID}.jsonl`))).toBe(true);

      const jobsAfterPrepare = await persistence.listJobs(RUN_ID);
      expect(jobsAfterPrepare).toHaveLength(1);
      expect(jobsAfterPrepare[0].custom_id).toBe(EXPECTED_CUSTOM_ID);

      // prepared -> submitted
      result = await orch.step(RUN_ID);
      expect(result).toMatchObject({ kind: 'transitioned', from: 'prepared', to: 'submitted' });

      // submitted -> downloading (provider reports complete)
      result = await orch.step(RUN_ID);
      expect(result).toMatchObject({ kind: 'transitioned', from: 'submitted', to: 'downloading' });

      // downloading -> processing (downloads + parses the mocked result row)
      result = await orch.step(RUN_ID);
      expect(result).toMatchObject({ kind: 'transitioned', from: 'downloading', to: 'processing' });

      // processing -> complete (runs onJobProcessed -> handleJobProcessed ->
      // the real dispatch/gate pipeline for the one job)
      result = await orch.step(RUN_ID);
      expect(result).toMatchObject({ kind: 'transitioned', from: 'processing', to: 'complete' });

      // ── The item landed with generation_run_id provenance ──────────────
      expect(writtenBanks).toHaveLength(1);
      expect(writtenBanks[0].bankPath).toContain('gate-ma-linear-algebra.json');
      const [item] = writtenBanks[0].items;
      expect(item.generation_run_id).toBe(RUN_ID);
      expect(item.concept_id).toBe('eigenvalues');
      expect(item.question_type).toBe('nat');
      expect(item.correct_answer).toBe('3');

      // ── Gate-ledger rows were written for all five gates ────────────────
      expect(gateInserts).toHaveLength(CONTENT_GATES.length);
      const gateNames = gateInserts.map((c) => c.params[3]);
      expect(new Set(gateNames)).toEqual(new Set(CONTENT_GATES));
      for (const call of gateInserts) {
        expect(call.params[1]).toBe(RUN_ID); // generation_run_id
        expect(call.params[2]).toBe(item.id); // item_id
      }

      // The one non-negotiable rule: mathematics is NEVER auto-decided.
      const mathRow = gateInserts.find((c) => c.params[3] === 'mathematics')!;
      expect(mathRow.params[4]).toBe('pending');
      expect(String(mathRow.params[5])).toMatch(/awaiting operator approval/);

      // misconception_coverage is not applicable to a nat item — passed,
      // not waived/pending, regardless of require_failure_tags.
      const miscRow = gateInserts.find((c) => c.params[3] === 'misconception_coverage')!;
      expect(miscRow.params[4]).toBe('passed');

      // The run's status column stays untouched by this test (no
      // run-orchestrator wiring here) — batch_state alone reached
      // 'complete', which is what status-reconciliation (poller.ts's
      // pollAllInFlightBatches) keys off in the real server process.
      const finalRun = await persistence.getRun(RUN_ID);
      expect(finalRun!.batch_state).toBe('complete');
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });
});
