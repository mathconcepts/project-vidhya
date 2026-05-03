/**
 * In-memory implementation of BatchPersistence for tests. Mirrors the
 * idempotency + advisory-lock semantics of the eventual Postgres impl.
 */

import type { BatchPersistence, RunRow, JobRow } from '../persistence';
import type { AtomSpec } from '../types';
import { IN_FLIGHT_STATES } from '../types';

export function createInMemoryPersistence(seed?: { runs?: RunRow[]; jobs?: JobRow[] }): BatchPersistence {
  const runs = new Map<string, RunRow>();
  const jobs = new Map<string, Map<string, JobRow>>(); // run_id → custom_id → row
  const locks = new Set<string>();

  for (const r of seed?.runs ?? []) runs.set(r.id, { ...r });
  for (const j of seed?.jobs ?? []) {
    if (!jobs.has(j.run_id)) jobs.set(j.run_id, new Map());
    jobs.get(j.run_id)!.set(j.custom_id, { ...j });
  }

  return {
    async getRun(run_id) {
      const r = runs.get(run_id);
      return r ? { ...r } : null;
    },

    async updateRun(run_id, patch) {
      const r = runs.get(run_id);
      if (!r) throw new Error(`run not found: ${run_id}`);
      runs.set(run_id, { ...r, ...patch });
    },

    async insertJobs(run_id, newJobs) {
      if (!jobs.has(run_id)) jobs.set(run_id, new Map());
      const m = jobs.get(run_id)!;
      for (const j of newJobs) {
        if (m.has(j.custom_id)) continue; // ON CONFLICT DO NOTHING
        m.set(j.custom_id, {
          run_id,
          custom_id: j.custom_id,
          atom_spec: j.atom_spec,
          status: 'pending',
          result: null,
          error: null,
          submitted_at: null,
          processed_at: null,
        });
      }
    },

    async listJobs(run_id) {
      const m = jobs.get(run_id);
      return m ? [...m.values()].map((j) => ({ ...j })) : [];
    },

    async setJobResult(run_id, custom_id, patch) {
      const m = jobs.get(run_id);
      if (!m) throw new Error(`no jobs for run: ${run_id}`);
      const j = m.get(custom_id);
      if (!j) throw new Error(`no job: ${run_id}/${custom_id}`);
      m.set(custom_id, { ...j, ...patch });
    },

    async acquireLock(run_id) {
      if (locks.has(run_id)) return false;
      locks.add(run_id);
      return true;
    },

    async releaseLock(run_id) {
      locks.delete(run_id);
    },

    async listInFlightRuns() {
      return [...runs.values()]
        .filter((r) => r.batch_state && IN_FLIGHT_STATES.has(r.batch_state))
        .map((r) => ({ ...r }));
    },
  };
}

export function newRun(id: string, overrides: Partial<RunRow> = {}): RunRow {
  return {
    id,
    exam_pack_id: 'gate-ma',
    batch_provider: null,
    batch_id: null,
    batch_state: 'queued',
    jsonl_path: null,
    budget_locked_usd: null,
    budget_remaining_usd: 100,
    submitted_at: null,
    last_polled_at: null,
    error: null,
    ...overrides,
  };
}

export function spec(concept_id: string, suffix = ''): AtomSpec {
  return {
    concept_id,
    atom_type: 'mcq',
    difficulty: 'medium',
    prompt_template_id: 'jee-mcq-v1',
    prompt_vars: { suffix },
  };
}
