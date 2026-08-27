/**
 * Tests for src/generation/gate-ledger.ts — W1.3's quality-gate ledger.
 *
 * The rules being pinned here are the ones the plan calls non-negotiable:
 *   - the `mathematics` gate is never auto-passed (plan
 *     automatic_release_forbidden_for),
 *   - enforcement fails CLOSED,
 *   - and every refusal reason names the identifier and the number (D8).
 */

import { describe, it, expect, vi } from 'vitest';
import type pg from 'pg';
import {
  CONTENT_GATES,
  evaluateAutomatedGates,
  gateLedgerRowId,
  gatesSatisfiedItemIds,
  recordGates,
  decideGate,
  type GateVerdict,
} from '../gate-ledger';
import type { AuthoredItem } from '../../scoring/learning-object-catalog-file';

function item(overrides: Partial<AuthoredItem> = {}): AuthoredItem {
  return {
    id: 'pi-eigenvalues-3f2a1b0c',
    concept_id: 'eigenvalues',
    topic: 'linear-algebra',
    difficulty: 0.5,
    question_type: 'mcq',
    marks: 2,
    question_text: 'What is the trace of A?',
    options: ['4', '5', '6', '7'],
    answer_index: 0,
    distractor_failure_tags: { 1: 'sign', 2: 'method', 3: 'careless' },
    correct_answer: '4',
    solution_steps: ['sum the diagonal'],
    verification_method: 'dual_model_consensus',
    generation_run_id: 'run-abc',
    evidence_level: 'pattern_supported',
    ...overrides,
  } as AuthoredItem;
}

const goodInput = {
  item: item(),
  verification: { agreed: true, method: 'dual_model_consensus', detail: 'both legs agreed' },
  requireFailureTags: true,
  contractVersion: 'gate-2026',
};

function byGate(verdicts: GateVerdict[]) {
  return Object.fromEntries(verdicts.map((v) => [v.gate, v]));
}

describe('evaluateAutomatedGates — the five gates', () => {
  it('emits exactly the five named gates, once each', () => {
    const v = evaluateAutomatedGates(goodInput);
    expect(v.map((x) => x.gate).sort()).toEqual([...CONTENT_GATES].sort());
  });

  it('passes scope, assessment_contract, misconception_coverage and provenance on a complete item', () => {
    const g = byGate(evaluateAutomatedGates(goodInput));
    expect(g.scope.status).toBe('passed');
    expect(g.assessment_contract.status).toBe('passed');
    expect(g.misconception_coverage.status).toBe('passed');
    expect(g.provenance.status).toBe('passed');
  });

  it('NEVER auto-passes mathematics, even when the cascade agreed', () => {
    const g = byGate(evaluateAutomatedGates(goodInput));
    expect(g.mathematics.status).toBe('pending');
    expect(g.mathematics.reason).toMatch(/AGREED/);
    expect(g.mathematics.reason).toMatch(/Evidence is not a verdict/);
  });

  it('mathematics stays pending when the cascade did NOT agree — still not a verdict', () => {
    const g = byGate(
      evaluateAutomatedGates({ ...goodInput, verification: { agreed: false, method: 'wolfram_verified', detail: 'wolfram said 5' } }),
    );
    expect(g.mathematics.status).toBe('pending');
    expect(g.mathematics.reason).toMatch(/DID NOT agree/);
  });

  it('fails scope with a D8-precise reason for an unknown concept', () => {
    const g = byGate(evaluateAutomatedGates({ ...goodInput, item: item({ concept_id: 'not-a-concept' }) }));
    expect(g.scope.status).toBe('failed');
    expect(g.scope.reason).toContain("concept_id 'not-a-concept'");
    expect(g.scope.reason).toMatch(/known concepts/);
  });

  it('fails scope when the topic contradicts the concept', () => {
    const g = byGate(evaluateAutomatedGates({ ...goodInput, item: item({ topic: 'calculus' }) }));
    expect(g.scope.status).toBe('failed');
    expect(g.scope.reason).toContain("topic 'calculus'");
    expect(g.scope.reason).toContain("'linear-algebra'");
  });

  it('fails assessment_contract naming each missing marking fact', () => {
    const g = byGate(
      evaluateAutomatedGates({
        ...goodInput,
        item: item({ question_type: 'mcq', marks: undefined, answer_index: undefined }),
        contractVersion: null,
      }),
    );
    expect(g.assessment_contract.status).toBe('failed');
    expect(g.assessment_contract.reason).toContain('marks');
    expect(g.assessment_contract.reason).toContain('answer_index');
    expect(g.assessment_contract.reason).toContain('contract_version');
    expect(g.assessment_contract.reason).toMatch(/of 4 required marking facts/);
  });

  it('fails misconception_coverage with the untagged indices when the run required tags', () => {
    const g = byGate(
      evaluateAutomatedGates({ ...goodInput, item: item({ distractor_failure_tags: { 1: 'sign' } }) }),
    );
    expect(g.misconception_coverage.status).toBe('failed');
    expect(g.misconception_coverage.reason).toContain('2 of 3 distractors missing failure_tag');
    expect(g.misconception_coverage.reason).toContain('2, 3');
  });

  it('waives misconception_coverage (never blocks) when the run did not require tags', () => {
    const g = byGate(
      evaluateAutomatedGates({
        ...goodInput,
        requireFailureTags: false,
        item: item({ distractor_failure_tags: undefined }),
      }),
    );
    expect(g.misconception_coverage.status).toBe('waived');
    expect(g.misconception_coverage.reason).toMatch(/did not set require_failure_tags/);
  });

  it('passes misconception_coverage as not-applicable for nat', () => {
    const g = byGate(
      evaluateAutomatedGates({
        ...goodInput,
        item: item({ question_type: 'nat', options: undefined, answer_index: undefined, answer_range: [3.9, 4.1] }),
      }),
    );
    expect(g.misconception_coverage.status).toBe('passed');
    expect(g.misconception_coverage.reason).toMatch(/not applicable/);
  });

  it('fails provenance naming both missing facts', () => {
    const g = byGate(
      evaluateAutomatedGates({
        ...goodInput,
        item: item({ generation_run_id: undefined, evidence_level: undefined }),
      }),
    );
    expect(g.provenance.status).toBe('failed');
    expect(g.provenance.reason).toContain('generation_run_id');
    expect(g.provenance.reason).toContain('evidence_level');
    expect(g.provenance.reason).toMatch(/2 of 2 provenance facts/);
  });

  it('is pure — same input, same verdicts', () => {
    expect(evaluateAutomatedGates(goodInput)).toEqual(evaluateAutomatedGates(goodInput));
  });
});

describe('gateLedgerRowId', () => {
  it('is deterministic per (run, item, gate) and distinct across gates', () => {
    expect(gateLedgerRowId('r1', 'i1', 'scope')).toBe(gateLedgerRowId('r1', 'i1', 'scope'));
    expect(gateLedgerRowId('r1', 'i1', 'scope')).not.toBe(gateLedgerRowId('r1', 'i1', 'mathematics'));
    expect(gateLedgerRowId('r1', null, 'scope')).not.toBe(gateLedgerRowId('r1', 'i1', 'scope'));
  });
});

describe('recordGates', () => {
  it('refuses to auto-record a decided mathematics verdict', async () => {
    const pool = { query: vi.fn() } as unknown as pg.Pool;
    await expect(
      recordGates(
        { generation_run_id: 'r', item_id: 'i', verdicts: [{ gate: 'mathematics', status: 'passed', reason: 'looks fine' }] },
        pool,
      ),
    ).rejects.toThrow(/require an operator decision/);
    expect((pool.query as ReturnType<typeof vi.fn>)).not.toHaveBeenCalled();
  });

  it('writes the mechanical verdicts and the pending mathematics gate', async () => {
    const query = vi.fn().mockResolvedValue({ rows: [] });
    const pool = { query } as unknown as pg.Pool;
    const written = await recordGates(
      { generation_run_id: 'r', item_id: 'i', verdicts: evaluateAutomatedGates(goodInput) },
      pool,
    );
    expect(written).toBe(CONTENT_GATES.length);
  });

  it('is a no-op with no pool (DB-less), never a throw', async () => {
    await expect(recordGates({ generation_run_id: 'r', item_id: 'i', verdicts: [] }, null)).resolves.toBe(0);
  });

  it('still refuses a decided mathematics verdict with NO pool — the refusal is a contract, not a DB behaviour', async () => {
    await expect(
      recordGates(
        { generation_run_id: 'r', item_id: 'i', verdicts: [{ gate: 'mathematics', status: 'passed', reason: 'looks fine' }] },
        null,
      ),
    ).rejects.toThrow(/require an operator decision/);
  });
});

describe('decideGate', () => {
  it('requires an operator id', async () => {
    await expect(
      decideGate({ generation_run_id: 'r', item_id: 'i', gate: 'mathematics', status: 'passed', reason: 'ok', decided_by: '' }),
    ).rejects.toThrow(/requires decided_by/);
  });

  it('stamps decided_by into the row it writes', async () => {
    const query = vi.fn().mockResolvedValue({ rows: [] });
    const pool = { query } as unknown as pg.Pool;
    await decideGate(
      { generation_run_id: 'r', item_id: 'i', gate: 'mathematics', status: 'passed', reason: 'ok', decided_by: 'admin-7' },
      pool,
    );
    const params = query.mock.calls[0][1] as unknown[];
    expect(params).toContain('admin-7');
    expect(String(query.mock.calls[0][0])).toMatch(/decided_at/);
  });
});

describe('gatesSatisfiedItemIds — enforcement fails closed', () => {
  it('accepts only items with all five gates passed-or-waived', async () => {
    const query = vi.fn().mockResolvedValue({
      rows: [
        { item_id: 'all-five', satisfied: String(CONTENT_GATES.length) },
        { item_id: 'four-of-five', satisfied: String(CONTENT_GATES.length - 1) },
      ],
    });
    const pool = { query } as unknown as pg.Pool;
    const ok = await gatesSatisfiedItemIds(['all-five', 'four-of-five', 'no-rows'], pool);
    expect([...ok]).toEqual(['all-five']);
  });

  it('returns nothing when the ledger read throws — never serves ungated content', async () => {
    const pool = { query: vi.fn().mockRejectedValue(new Error('relation "content_gate_ledger" does not exist')) } as unknown as pg.Pool;
    const ok = await gatesSatisfiedItemIds(['x', 'y'], pool);
    expect(ok.size).toBe(0);
  });

  it('returns nothing with no pool', async () => {
    expect((await gatesSatisfiedItemIds(['x'], null)).size).toBe(0);
  });

  it('does no query at all for an empty id list', async () => {
    const query = vi.fn();
    const pool = { query } as unknown as pg.Pool;
    expect((await gatesSatisfiedItemIds([], pool)).size).toBe(0);
    expect(query).not.toHaveBeenCalled();
  });
});
