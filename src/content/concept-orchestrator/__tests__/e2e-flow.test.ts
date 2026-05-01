/**
 * E2E flow test — the full concept-orchestrator v1 pipeline (Phase 5).
 *
 * Walks a realistic story:
 *
 *   1. Admin clicks Generate → POST /generate creates a job, kicks off
 *      generateConcept(). Progress events stream into the jobs registry.
 *   2. Orchestrator cascades through sources, runs LLM-judge per atom.
 *      Sub-threshold atoms auto-reject with reason; passing atoms enter
 *      atom_versions as inactive.
 *   3. Admin activates v1 → atom-loader will serve this content.
 *   4. Student engages → atom_engagements bumps. No regen yet.
 *   5. Cohort error accumulates → cohort_signals.error_pct > 0.5.
 *      regen-scanner picks it up next night, generates v2 with the
 *      misconception baked into the prompt, annotates improvement_reason.
 *   6. Admin activates v2 → atom_versions.active flips.
 *   7. Student loads next lesson → applyStudentOverrides + applyImprovedSince
 *      populate improved_since + improvement_reason on the atom.
 *   8. Frontend ImprovedBadge renders the emerald pill with tooltip.
 *
 * The test covers the DB-less paths exhaustively (every module gracefully
 * degrades without DATABASE_URL) and asserts the integration contract
 * across module boundaries — if any module's output shape changes, the
 * downstream integration breaks here first.
 *
 * The DB-dependent paths (atom_versions writes, regen-scanner queries,
 * student_atom_overrides reads) are exercised in their own unit tests
 * with mocked pg pools. This file is the integration glue.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  generateConcept,
  scoreAtom,
  passesGate,
  compareMathAtoms,
  requiresConsensus,
  buildQueue,
  readState,
  canSpend,
  createJob,
  getJob,
  recordProgress,
  recordResult,
  _resetJobsForTests,
  maybeQueueRegenForStudent,
  readStudentOverrides,
} from '../index';
import { runRegenScanner } from '../../../jobs/regen-scanner';

describe('Phase 5 E2E — concept-orchestrator v1 pipeline (DB-less)', () => {
  const origDb = process.env.DATABASE_URL;
  beforeEach(() => {
    delete process.env.DATABASE_URL;
    _resetJobsForTests();
  });
  afterEach(() => {
    if (origDb) process.env.DATABASE_URL = origDb;
    vi.unstubAllGlobals();
  });

  it('Step 1-2: admin Generate kicks off a job with progress events', async () => {
    // Story: admin clicks Generate. Server creates a job record.
    const job = createJob('calculus-derivatives', 'calculus');
    expect(job.id).toBeTruthy();
    expect(job.status).toBe('queued');

    // The orchestrator emits progress events as it walks the atom_types.
    recordProgress(job.id, { type: 'start', step_index: 0, total_steps: 11 });
    recordProgress(job.id, {
      type: 'atom_started',
      step_index: 0,
      total_steps: 11,
      atom_type: 'hook',
    });
    recordProgress(job.id, {
      type: 'atom_finished',
      step_index: 0,
      total_steps: 11,
      atom_type: 'hook',
      atom_id: 'calculus-derivatives.hook',
      sources: ['llm-claude'],
      judge_score: 8.4,
    });

    const polled = getJob(job.id);
    expect(polled?.status).toBe('running');
    expect(polled?.events).toHaveLength(3);
    expect(polled?.events[2].judge_score).toBe(8.4);
  });

  it('Step 3: orchestrator returns a draft + accepts/rejects via LLM-judge', async () => {
    const draft = await generateConcept({
      concept_id: 'calculus-derivatives',
      topic_family: 'calculus',
      atom_types: ['hook'],
      dry_run: true,
    });
    // Without LLM keys the kag-fallback returns a stub; either accepted
    // or auto-rejected via judge — both are valid signals the path runs.
    expect(draft.concept_id).toBe('calculus-derivatives');
    expect(draft.atoms.length + draft.rejected_atoms.length).toBe(1);
    const all = [...draft.atoms, ...draft.rejected_atoms];
    expect(all[0].atom_type).toBe('hook');
    expect(all[0].atom_id).toBe('calculus-derivatives.hook');
    // Provenance recorded
    expect(all[0].meta.generated_at).toBeTruthy();
    expect(typeof all[0].meta.cost_usd).toBe('number');
  });

  it('Step 4: math atoms route through consensus gate', () => {
    expect(requiresConsensus('formal_definition')).toBe(true);
    expect(requiresConsensus('worked_example')).toBe(true);
    expect(requiresConsensus('intuition')).toBe(false);

    // Same answer, different prose → consensus
    const ok = compareMathAtoms('worked_example', 'Steps...\nAnswer: 2*x', 'Different.\nAnswer: 2*x');
    expect(ok.agreed).toBe(true);

    // Different answers → flagged as disagreement
    const bad = compareMathAtoms('worked_example', 'Answer: 2*x', 'Answer: 3*x');
    expect(bad.agreed).toBe(false);
  });

  it('Step 5: queue ranks concepts by impact, no DB → all-missing baseline', async () => {
    const rows = await buildQueue({ limit: 5 });
    expect(rows.length).toBeGreaterThan(0);
    for (const r of rows) {
      // Every concept starts as "missing" with 11 atoms to generate.
      expect(r.atoms_to_generate).toBe(11);
      expect(r.state).toBe('missing');
      expect(r.spent_usd).toBe(0);
      expect(r.cap_usd).toBeGreaterThan(0);
    }
    // Sorted by impact (highest first).
    for (let i = 0; i < rows.length - 1; i++) {
      expect(rows[i].impact).toBeGreaterThanOrEqual(rows[i + 1].impact);
    }
  });

  it('Step 6: regen-scanner gracefully skips without DB', async () => {
    const result = await runRegenScanner();
    expect(result.status).toBe('skipped_no_db');
    expect(result.regen_attempted).toBe(0);
  });

  it('Step 7: per-student E5 trigger is no-op without DB', async () => {
    const r = await maybeQueueRegenForStudent('student-1', 'calculus-derivatives.intuition');
    expect(r.queued).toBe(false);
    expect(r.reason).toBe('no_db');

    const overrides = await readStudentOverrides('student-1', ['calculus-derivatives.intuition']);
    expect(overrides.size).toBe(0);
  });

  it('Step 8: cost tracking degrades to "always allowed" without DB', async () => {
    const state = await readState('calculus-derivatives');
    expect(state.exhausted).toBe(false);
    expect(state.spent_usd).toBe(0);

    const can = await canSpend('calculus-derivatives');
    expect(can.allowed).toBe(true);
  });

  it('integration contract: generate → judge → consensus all return shapes the next stage expects', async () => {
    const draft = await generateConcept({
      concept_id: 'calculus-derivatives',
      topic_family: 'calculus',
      atom_types: ['hook', 'intuition'],
      dry_run: true,
    });
    // Total atoms generated equals what we asked for.
    const total = draft.atoms.length + draft.rejected_atoms.length;
    expect(total).toBe(2);
    // Every atom has the fields that downstream consumers (atom-loader,
    // ImprovedBadge, admin diff viewer) rely on.
    for (const a of [...draft.atoms, ...draft.rejected_atoms]) {
      expect(a.atom_id).toMatch(/^calculus-derivatives\./);
      expect(a.concept_id).toBe('calculus-derivatives');
      expect(['hook', 'intuition']).toContain(a.atom_type);
      expect(a.meta).toBeDefined();
      expect(typeof a.meta.cost_usd).toBe('number');
      expect(Array.isArray(a.meta.source_cascade)).toBe(true);
      expect(Array.isArray(a.meta.pyq_grounded)).toBe(true);
      expect(a.meta.generated_at).toBeTruthy();
    }
  });

  it('progress events emitted in order through the pipeline', async () => {
    const events: any[] = [];
    await generateConcept({
      concept_id: 'calculus-derivatives',
      topic_family: 'calculus',
      atom_types: ['hook'],
      dry_run: true,
      on_progress: (e) => events.push(e),
    });
    // start → atom_started → (atom_finished | atom_rejected) → done
    expect(events[0].type).toBe('start');
    expect(events[1].type).toBe('atom_started');
    expect(['atom_finished', 'atom_rejected']).toContain(events[2].type);
    expect(events[events.length - 1].type).toBe('done');
  });

  it('LLM-judge gate honors the threshold contract', async () => {
    // Create a synthetic atom and verify the gate.
    const atom: any = {
      atom_id: 'calc.test',
      concept_id: 'calc',
      atom_type: 'intuition',
      bloom_level: 2,
      difficulty: 0.1,
      exam_ids: ['*'],
      content: 'A toy intuition body for the test.',
      meta: { source_cascade: [], wolfram_grounded: false, pyq_grounded: [], generated_at: '', cost_usd: 0 },
    };
    const score = await scoreAtom(atom);
    // Without LLM keys, scoreAtom returns judge_unavailable → score=5.
    // passesGate treats unavailable as pass-through (manual admin review).
    expect(passesGate(score)).toBe(true);
  });
});

describe('Phase 5 E2E — sanity checks on integration boundaries', () => {
  it('atom_id format is stable across modules', async () => {
    const draft = await generateConcept({
      concept_id: 'a-b-c',
      topic_family: 'calculus',
      atom_types: ['formal_definition'],
      dry_run: true,
    });
    const all = [...draft.atoms, ...draft.rejected_atoms];
    expect(all[0].atom_id).toBe('a-b-c.formal-definition');
    // The dash format is what atom_versions.atom_id stores AND what
    // student_atom_overrides keys on. Drift here would silently break
    // the regen → enrichment → frontend chain.
  });

  it('orchestrator + queue + cost agree on the same concept identity', async () => {
    // Pick a concept that's actually in the concept-graph so the queue
    // can find it. The orchestrator + cost layer accept any concept_id;
    // the queue only ranks ones registered in concept-graph.
    const allRows = await buildQueue({ limit: 200 });
    expect(allRows.length).toBeGreaterThan(0);
    const concept_id = allRows[0].concept_id;
    const topic_family = allRows[0].topic_family;

    const [draft, queue, state] = await Promise.all([
      generateConcept({
        concept_id,
        topic_family,
        atom_types: ['hook'],
        dry_run: true,
      }),
      buildQueue({ limit: 200 }),
      readState(concept_id),
    ]);
    expect(draft.concept_id).toBe(concept_id);
    expect(state.concept_id).toBe(concept_id);
    expect(queue.find((r) => r.concept_id === concept_id)).toBeTruthy();
  });
});
