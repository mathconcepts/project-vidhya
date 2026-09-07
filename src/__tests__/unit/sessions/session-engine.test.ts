// @ts-nocheck
/**
 * Unit tests for the Anytime Studymate session engine.
 *
 * Tested:
 *   - rankConcepts: 4 student-state scenarios (cold-start, frustrated, normal, high-mastery)
 *   - buildSessionStat / chooseSessionHighlight: imported directly from the real
 *     module (not reimplemented — a duplicate copy is exactly how this suite
 *     went stale the first time, see below) — deterministic template output,
 *     and the cumulative-mastery gate on "Strong on X" (/ui-ux-pro-max, 2026-09-06)
 *   - FRUSTRATION_STATES membership
 *
 * Not tested here:
 *   - buildSession / resumeSession (require live DB — covered by E2E)
 *   - submitAnswer / completeSession (DB-bound)
 *
 * rankConcepts below is still a reimplementation of the pure logic (the real
 * one isn't exported), but buildSessionStat/chooseSessionHighlight are
 * imported for real — an inline duplicate of THOSE previously reimplemented
 * the OLD (buggy) same-session heuristic, so this suite kept passing even
 * after the real function's signature and behavior changed underneath it.
 */

import { describe, it, expect } from 'vitest';
import { buildSessionStat, chooseSessionHighlight } from '../../../sessions/session-engine';
import type { MasteryEntry } from '../../../gbrain/student-model';

// ─── Inline the pure logic under test ────────────────────────────────────────
// The session engine exports its public API but not its internal helpers.
// We re-implement the pure functions here so we don't need a DB.

const W = { sr_decay: 0.30, error_rate: 0.30, exam_weight: 0.15, prereq_gate: 0.15, motivation_boost: 0.10 };

const FRUSTRATION_STATES = new Set(['frustrated', 'anxious', 'flagging']);

function depthToMaxDifficulty(depth: string): number {
  const map: Record<string, number> = { introductory: 0.4, standard: 0.7, advanced: 0.95 };
  return map[depth] ?? 0.7;
}

interface ConceptScore {
  concept_id: string;
  score: number;
  exam_weight: number;
  max_difficulty: number;
}

type MockLink = { weight: number; depth: string };

function rankConcepts(
  conceptIds: string[],
  linkMap: Record<string, MockLink>,
  masteryVector: Record<string, any>,
  prerequisiteAlerts: Array<{ concept: string; severity: string }>,
  isFrustrated: boolean,
): ConceptScore[] {
  const criticalAlerts = new Set(
    prerequisiteAlerts.filter(a => a.severity === 'critical').map(a => a.concept),
  );

  return conceptIds
    .filter(id => !criticalAlerts.has(id))
    .map(id => {
      const link = linkMap[id];
      if (!link) return null;

      const mastery = masteryVector[id];
      const attempts = mastery?.attempts ?? 0;
      const correct = mastery?.correct ?? 0;
      const lastUpdate = mastery?.last_update ? new Date(mastery.last_update) : null;

      const daysSince = lastUpdate
        ? (Date.now() - lastUpdate.getTime()) / 86_400_000
        : Infinity;
      const srDecay = Math.min(1.0, attempts === 0 ? 1.0 : daysSince / 7);
      const errorRate = attempts === 0 ? 0.5 : 1 - correct / attempts;
      const prereqGate = 1;
      const motivationBoost = isFrustrated ? 0.1 : 0;

      const score =
        srDecay * W.sr_decay +
        errorRate * W.error_rate +
        link.weight * W.exam_weight +
        prereqGate * W.prereq_gate +
        motivationBoost * W.motivation_boost;

      return { concept_id: id, score, exam_weight: link.weight, max_difficulty: depthToMaxDifficulty(link.depth) };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score);
}

// ─── Test data ────────────────────────────────────────────────────────────────

const LINKS: Record<string, MockLink> = {
  'eigenvalues':     { weight: 0.10, depth: 'standard' },
  'integration':     { weight: 0.08, depth: 'advanced' },
  'ode-first-order': { weight: 0.06, depth: 'introductory' },
  'probability':     { weight: 0.12, depth: 'standard' },
};

const CONCEPTS = Object.keys(LINKS);

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('FRUSTRATION_STATES', () => {
  it('includes frustrated, anxious, flagging', () => {
    expect(FRUSTRATION_STATES.has('frustrated')).toBe(true);
    expect(FRUSTRATION_STATES.has('anxious')).toBe(true);
    expect(FRUSTRATION_STATES.has('flagging')).toBe(true);
  });

  it('does not include driven or steady', () => {
    expect(FRUSTRATION_STATES.has('driven')).toBe(false);
    expect(FRUSTRATION_STATES.has('steady')).toBe(false);
  });
});

describe('rankConcepts — cold-start (no history)', () => {
  const ranked = rankConcepts(CONCEPTS, LINKS, {}, [], false);

  it('returns all concepts when no critical alerts', () => {
    expect(ranked.length).toBe(CONCEPTS.length);
  });

  it('cold-start srDecay=1.0 and errorRate=0.5 for all', () => {
    // All concepts get the same decay/error, so only exam_weight + prereqGate differ
    // probability (weight 0.12) should rank above eigenvalues (0.10)
    const probIdx = ranked.findIndex(r => r.concept_id === 'probability');
    const eigenIdx = ranked.findIndex(r => r.concept_id === 'eigenvalues');
    expect(probIdx).toBeLessThan(eigenIdx);
  });

  it('max_difficulty maps correctly from depth', () => {
    const intro = ranked.find(r => r.concept_id === 'ode-first-order');
    const adv = ranked.find(r => r.concept_id === 'integration');
    expect(intro?.max_difficulty).toBe(0.4);
    expect(adv?.max_difficulty).toBe(0.95);
  });
});

describe('rankConcepts — frustrated mode', () => {
  const ranked = rankConcepts(CONCEPTS, LINKS, {}, [], true);

  it('all scores include motivation_boost (0.10 × 0.10 = 0.01 added)', () => {
    const notFrustratedRanked = rankConcepts(CONCEPTS, LINKS, {}, [], false);
    // Each frustrated score should be exactly 0.01 higher
    for (let i = 0; i < ranked.length; i++) {
      const normal = notFrustratedRanked.find(r => r.concept_id === ranked[i].concept_id);
      expect(ranked[i].score - (normal?.score ?? 0)).toBeCloseTo(0.01, 5);
    }
  });
});

describe('rankConcepts — high mastery (recent correct)', () => {
  const recentDate = new Date(Date.now() - 86_400_000).toISOString(); // 1 day ago
  const mastery = {
    'eigenvalues': { attempts: 10, correct: 9, last_update: recentDate }, // 90% correct, fresh
    'probability': { attempts: 2, correct: 0, last_update: null },        // 0% correct, cold
  };

  const ranked = rankConcepts(CONCEPTS, LINKS, mastery, [], false);

  it('high-error concept ranks above high-mastery concept when weights are similar', () => {
    const probIdx = ranked.findIndex(r => r.concept_id === 'probability');
    const eigenIdx = ranked.findIndex(r => r.concept_id === 'eigenvalues');
    expect(probIdx).toBeLessThan(eigenIdx);
  });
});

describe('rankConcepts — prerequisite gating', () => {
  it('filters out concepts with critical prerequisite alerts', () => {
    const alerts = [{ concept: 'eigenvalues', severity: 'critical' }];
    const ranked = rankConcepts(CONCEPTS, LINKS, {}, alerts, false);
    expect(ranked.find(r => r.concept_id === 'eigenvalues')).toBeUndefined();
    expect(ranked.length).toBe(CONCEPTS.length - 1);
  });

  it('keeps concepts with non-critical alerts', () => {
    const alerts = [{ concept: 'eigenvalues', severity: 'warning' }];
    const ranked = rankConcepts(CONCEPTS, LINKS, {}, alerts, false);
    expect(ranked.find(r => r.concept_id === 'eigenvalues')).toBeDefined();
  });
});

describe('buildSessionStat', () => {
  it('empty attempts returns generic line', () => {
    expect(buildSessionStat([], {})).toBe('Session complete.');
  });

  it('zero correct returns encouragement line', () => {
    const result = buildSessionStat([
      { concept_id: 'eigenvalues', was_correct: false },
      { concept_id: 'integration', was_correct: false },
    ], {});
    expect(result).toMatch(/^0\/2/);
    expect(result).toContain('pattern recognition');
  });

  it('correct answers with no cumulative mastery evidence get the honest fallback, never "Strong"', () => {
    // Root-caused (/ui-ux-pro-max, 2026-09-06): a 3-question session with one
    // correct answer previously said "Strong on X" off that single in-session
    // correct answer alone — no different from a coin flip.
    const result = buildSessionStat([
      { concept_id: 'eigenvalues', was_correct: true },
      { concept_id: 'integration', was_correct: false },
      { concept_id: 'probability', was_correct: true },
    ], {});
    expect(result).toMatch(/^2\/3/);
    expect(result).not.toContain('Strong');
    expect(result).toContain('keep going');
  });

  it('names the concept "Strong" once its cumulative mastery clears the bar', () => {
    const masteryVector: Record<string, MasteryEntry> = {
      eigenvalues: { score: 0.85, attempts: 6, correct: 5, last_update: '2026-09-01' },
    };
    const result = buildSessionStat([
      { concept_id: 'eigenvalues', was_correct: true },
      { concept_id: 'integration', was_correct: false },
    ], masteryVector);
    expect(result).toMatch(/^1\/2/);
    expect(result).toContain('Strong on eigenvalues');
  });

  it('all correct with no mastery evidence still gets the honest fallback, not "Strong"', () => {
    const result = buildSessionStat([
      { concept_id: 'ode-first-order', was_correct: true },
    ], {});
    expect(result).toMatch(/^1\/1/);
    expect(result).not.toContain('Strong');
    expect(result).toContain('keep going');
  });
});

describe('chooseSessionHighlight', () => {
  it('returns null when no concept has any cumulative mastery evidence', () => {
    expect(chooseSessionHighlight(['eigenvalues'], {})).toBeNull();
  });

  it('requires the minimum attempt count, not just a high score', () => {
    const masteryVector: Record<string, MasteryEntry> = {
      eigenvalues: { score: 0.95, attempts: 1, correct: 1, last_update: '2026-09-01' },
    };
    expect(chooseSessionHighlight(['eigenvalues'], masteryVector)).toBeNull();
  });

  it('requires the score to clear the mastery threshold, not just enough attempts', () => {
    const masteryVector: Record<string, MasteryEntry> = {
      eigenvalues: { score: 0.5, attempts: 10, correct: 5, last_update: '2026-09-01' },
    };
    expect(chooseSessionHighlight(['eigenvalues'], masteryVector)).toBeNull();
  });

  it('picks the highest-scoring qualifying concept among several correct ones', () => {
    const masteryVector: Record<string, MasteryEntry> = {
      eigenvalues: { score: 0.82, attempts: 4, correct: 3, last_update: '2026-09-01' },
      probability: { score: 0.91, attempts: 8, correct: 7, last_update: '2026-09-01' },
    };
    expect(chooseSessionHighlight(['eigenvalues', 'probability'], masteryVector)).toBe('probability');
  });
});
