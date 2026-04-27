// @ts-nocheck
/**
 * Unit tests for the teaching-turn store.
 *
 * Covers:
 *   - openTurn → closeTurn round trip
 *   - listTurnsForStudent filtering
 *   - reconcile() handles open-with-no-close (in-flight turn)
 *   - reconcile() handles double-close (earliest-wins)
 *   - reconcile() handles corrupt / missing log lines
 *   - summariseStudent trend computation
 *   - degraded turns stay legible
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { mkdirSync, existsSync, rmSync, cpSync, appendFileSync } from 'fs';

let savedBackup = '';

beforeAll(() => {
  if (existsSync('.data')) {
    savedBackup = `.data.turns-testsave-${Date.now()}`;
    cpSync('.data', savedBackup, { recursive: true });
    rmSync('.data', { recursive: true, force: true });
  }
  mkdirSync('.data', { recursive: true });
});

afterAll(() => {
  if (existsSync('.data')) rmSync('.data', { recursive: true, force: true });
  if (savedBackup && existsSync(savedBackup)) {
    cpSync(savedBackup, '.data', { recursive: true });
    rmSync(savedBackup, { recursive: true, force: true });
  }
});

beforeEach(async () => {
  if (existsSync('.data/teaching-turns.jsonl')) {
    rmSync('.data/teaching-turns.jsonl');
  }
});

describe('teaching turn-store', () => {
  it('round-trips a complete turn (open → close)', async () => {
    const { openTurn, closeTurn, getTurn } = await import('../../../modules/teaching');

    const turn_id = openTurn({
      student_id: 'user_test_1',
      intent: 'explain-concept',
      delivery_channel: 'web',
      routed_source: 'bundle',
      generated_content: { type: 'explanation', summary: 'derivatives basics' },
      pre_state: {
        concept_id: 'derivatives',
        topic: 'calculus',
        mastery_before: 0.4,
        attempts_so_far: 3,
        zpd_concept: 'chain-rule',
      },
    });

    expect(turn_id).toMatch(/^turn_/);

    closeTurn({
      turn_id,
      attempt_outcome: { correct: true, response_time_ms: 12000 },
      mastery_delta: { before: 0.4, after: 0.46, delta_pct: 6 },
      duration_ms: 14000,
    });

    const turn = getTurn(turn_id);
    expect(turn).not.toBeNull();
    expect(turn!.status).toBe('closed');
    expect(turn!.attempt_outcome?.correct).toBe(true);
    expect(turn!.mastery_delta?.delta_pct).toBe(6);
    expect(turn!.intent).toBe('explain-concept');
  });

  it('returns status "open" for an unfinished turn', async () => {
    const { openTurn, getTurn } = await import('../../../modules/teaching');

    const turn_id = openTurn({
      student_id: 'user_test_2',
      intent: 'practice-problem',
      delivery_channel: 'web',
      routed_source: 'generated',
      generated_content: { type: 'problem', summary: 'integration by parts' },
      pre_state: {
        concept_id: 'integration',
        topic: 'calculus',
        mastery_before: 0.3,
        attempts_so_far: 0,
        zpd_concept: null,
      },
    });

    const turn = getTurn(turn_id);
    expect(turn!.status).toBe('open');
    expect(turn!.attempt_outcome).toBeUndefined();
    expect(turn!.closed_at).toBeUndefined();
  });

  it('filters per-student correctly', async () => {
    const { openTurn, listTurnsForStudent } = await import('../../../modules/teaching');

    openTurn({
      student_id: 'student_A',
      intent: 'explain-concept',
      delivery_channel: 'web',
      routed_source: 'bundle',
      generated_content: { type: 'explanation', summary: 'A1' },
      pre_state: { concept_id: null, topic: null, mastery_before: null, attempts_so_far: null, zpd_concept: null },
    });
    openTurn({
      student_id: 'student_B',
      intent: 'practice-problem',
      delivery_channel: 'web',
      routed_source: 'generated',
      generated_content: { type: 'problem', summary: 'B1' },
      pre_state: { concept_id: null, topic: null, mastery_before: null, attempts_so_far: null, zpd_concept: null },
    });
    openTurn({
      student_id: 'student_A',
      intent: 'verify-answer',
      delivery_channel: 'telegram',
      routed_source: 'wolfram',
      generated_content: { type: 'verification', summary: 'A2' },
      pre_state: { concept_id: null, topic: null, mastery_before: null, attempts_so_far: null, zpd_concept: null },
    });

    const a_turns = listTurnsForStudent('student_A');
    const b_turns = listTurnsForStudent('student_B');
    expect(a_turns.length).toBe(2);
    expect(b_turns.length).toBe(1);
  });

  it('earliest-wins on double-close (audit-trail integrity)', async () => {
    const { openTurn, closeTurn, getTurn } = await import('../../../modules/teaching');

    const turn_id = openTurn({
      student_id: 'user_test_3',
      intent: 'practice-problem',
      delivery_channel: 'web',
      routed_source: 'generated',
      generated_content: { type: 'problem', summary: 'limit problem' },
      pre_state: { concept_id: 'limits', topic: 'calculus', mastery_before: 0.5, attempts_so_far: 2, zpd_concept: null },
    });

    closeTurn({
      turn_id,
      attempt_outcome: { correct: false, response_time_ms: 30000 },
      mastery_delta: { before: 0.5, after: 0.48, delta_pct: -2 },
      duration_ms: 31000,
    });

    // Second close — should be appended but ignored on read
    closeTurn({
      turn_id,
      attempt_outcome: { correct: true, response_time_ms: 5000 },
      mastery_delta: { before: 0.5, after: 0.6, delta_pct: 10 },
      duration_ms: 5500,
    });

    const turn = getTurn(turn_id);
    expect(turn!.attempt_outcome?.correct).toBe(false);   // first close wins
    expect(turn!.mastery_delta?.delta_pct).toBe(-2);
  });

  it('skips corrupt JSONL lines on read (durability)', async () => {
    const { openTurn, listAllTurns } = await import('../../../modules/teaching');

    openTurn({
      student_id: 'user_test_4',
      intent: 'explain-concept',
      delivery_channel: 'web',
      routed_source: 'bundle',
      generated_content: { type: 'explanation', summary: 'before corruption' },
      pre_state: { concept_id: null, topic: null, mastery_before: null, attempts_so_far: null, zpd_concept: null },
    });

    // Simulate a torn write — append garbage + an unterminated JSON object
    appendFileSync('.data/teaching-turns.jsonl', '{"kind":"open","turn_id":"torn",garbage\n');
    appendFileSync('.data/teaching-turns.jsonl', '\n');

    openTurn({
      student_id: 'user_test_4',
      intent: 'practice-problem',
      delivery_channel: 'web',
      routed_source: 'generated',
      generated_content: { type: 'problem', summary: 'after corruption' },
      pre_state: { concept_id: null, topic: null, mastery_before: null, attempts_so_far: null, zpd_concept: null },
    });

    const all = listAllTurns();
    expect(all.length).toBe(2); // both legitimate turns recovered, garbage skipped
    const summaries = all.map(t => t.generated_content.summary).sort();
    expect(summaries).toEqual(['after corruption', 'before corruption']);
  });

  it('summariseStudent reports trend correctly', async () => {
    const { openTurn, closeTurn, summariseStudent } = await import('../../../modules/teaching');

    // Five closed turns, all with positive delta — should be "improving"
    for (let i = 0; i < 5; i++) {
      const turn_id = openTurn({
        student_id: 'student_progress',
        intent: 'practice-problem',
        delivery_channel: 'web',
        routed_source: 'generated',
        generated_content: { type: 'problem', summary: `q${i}` },
        pre_state: { concept_id: 'derivatives', topic: 'calculus', mastery_before: 0.3 + i * 0.05, attempts_so_far: i, zpd_concept: null },
      });
      closeTurn({
        turn_id,
        attempt_outcome: { correct: true, response_time_ms: 10000 },
        mastery_delta: { before: 0.3 + i * 0.05, after: 0.35 + i * 0.05, delta_pct: 5 },
        duration_ms: 11000,
      });
    }

    const summary = summariseStudent('student_progress');
    expect(summary.closed_turns).toBe(5);
    expect(summary.correct_attempts).toBe(5);
    expect(summary.avg_mastery_delta_pct).toBe(5);
    expect(summary.trend).toBe('improving');
  });

  it('reports "insufficient-data" when fewer than 5 closed turns', async () => {
    const { openTurn, closeTurn, summariseStudent } = await import('../../../modules/teaching');

    const turn_id = openTurn({
      student_id: 'student_few',
      intent: 'practice-problem',
      delivery_channel: 'web',
      routed_source: 'generated',
      generated_content: { type: 'problem', summary: 'one shot' },
      pre_state: { concept_id: null, topic: null, mastery_before: null, attempts_so_far: null, zpd_concept: null },
    });
    closeTurn({
      turn_id,
      attempt_outcome: { correct: true, response_time_ms: 8000 },
      mastery_delta: { before: 0.5, after: 0.55, delta_pct: 5 },
      duration_ms: 9000,
    });

    const summary = summariseStudent('student_few');
    expect(summary.trend).toBe('insufficient-data');
  });

  it('preserves degradation reason for legibility', async () => {
    const { openTurn, getTurn } = await import('../../../modules/teaching');

    const turn_id = openTurn({
      student_id: 'student_deg',
      intent: 'explain-concept',
      delivery_channel: 'web',
      routed_source: 'cache',
      generated_content: { type: 'explanation', summary: 'cached fallback explainer' },
      pre_state: { concept_id: 'limits', topic: 'calculus', mastery_before: 0.4, attempts_so_far: 2, zpd_concept: null },
      degraded: { reason: 'no-llm-available', detail: 'GEMINI_API_KEY not set' },
    });

    const turn = getTurn(turn_id);
    expect(turn!.degraded?.reason).toBe('no-llm-available');
    expect(turn!.degraded?.detail).toContain('GEMINI_API_KEY');
  });
});
