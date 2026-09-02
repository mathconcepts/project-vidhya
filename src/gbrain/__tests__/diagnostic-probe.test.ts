import { describe, it, expect, vi } from 'vitest';

/**
 * Synthetic bounded graph, independent of the real 101-concept graph
 * (same isolation discipline as pedagogy-engine.test.ts's synthetic atoms):
 *
 *   target -> [B, E]
 *   B      -> [C]
 *   C      -> [D]
 *   E      -> []
 *   D      -> []
 *
 * At maxDepth=2 from `target`: B=1hop, E=1hop, C=2hops. D (3 hops) is
 * outside the bound and must never appear in candidates.
 */
function node(id: string, prerequisites: string[] = []) {
  return { id, topic: 't', label: `Label ${id}`, description: '', difficulty_base: 0.5, gate_frequency: 'medium' as const, prerequisites };
}

const GRAPH_MAP = new Map(
  [
    node('target', ['B', 'E']),
    node('B', ['C']),
    node('C', ['D']),
    node('D', []),
    node('E', []),
  ].map((n) => [n.id, n]),
);

vi.mock('../../constants/concept-graph', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../constants/concept-graph')>();
  return { ...actual, CONCEPT_MAP: GRAPH_MAP };
});

const { diagnoseWrongAnswer } = await import('../diagnostic-probe');
const { FIRE_MAX_DEPTH } = await import('../fire');

function mv(entries: Record<string, number>): Record<string, { score: number }> {
  return Object.fromEntries(Object.entries(entries).map(([k, v]) => [k, { score: v }]));
}

describe('diagnoseWrongAnswer', () => {
  it('reports insufficient evidence when the target itself is not weak', () => {
    const result = diagnoseWrongAnswer('target', mv({ target: 0.8, B: 0.1 }), { maxDepth: 2 });
    expect(result.evidence_sufficient).toBe(false);
    expect(result.recommended_probe).toBeNull();
    expect(result.reason).toMatch(/at or above the weak threshold/);
  });

  it('reports insufficient evidence when the target is weak but every prerequisite is fine', () => {
    const result = diagnoseWrongAnswer('target', mv({ target: 0.1, B: 0.9, E: 0.9, C: 0.9 }), { maxDepth: 2 });
    expect(result.evidence_sufficient).toBe(false);
    expect(result.recommended_probe).toBeNull();
    expect(result.reason).toMatch(/gap is likely in the target concept itself/);
  });

  it('recommends a probe when target AND at least one prerequisite are weak (converging evidence)', () => {
    const result = diagnoseWrongAnswer('target', mv({ target: 0.1, B: 0.2, E: 0.9 }), { maxDepth: 2 });
    expect(result.evidence_sufficient).toBe(true);
    expect(result.recommended_probe?.concept_id).toBe('B');
    expect(result.reason).toMatch(/converging evidence/);
  });

  it('ranks by distance first, then mastery ascending within the same distance', () => {
    // B and E are both 1 hop; E is weaker, so E should be recommended over B.
    const result = diagnoseWrongAnswer('target', mv({ target: 0.1, B: 0.2, E: 0.05 }), { maxDepth: 2 });
    expect(result.recommended_probe?.concept_id).toBe('E');
    // Candidates list itself is fully ranked: E (d1, weakest), B (d1), C (d2).
    expect(result.candidates.map((c) => c.concept_id)).toEqual(['E', 'B', 'C']);
  });

  it('a closer-but-slightly-stronger candidate still outranks a farther weaker one', () => {
    // E is deliberately strong here so it's not the confound — this test is
    // about B (distance 1, weak) vs C (distance 2, weakest overall).
    const result = diagnoseWrongAnswer('target', mv({ target: 0.1, B: 0.29, E: 0.9, C: 0.0 }), { maxDepth: 2 });
    // B (distance 1) ranks ahead of C (distance 2) regardless of C's lower mastery.
    expect(result.candidates[0].concept_id).toBe('B');
  });

  it('respects the bounded depth — a concept 3 hops away never appears', () => {
    const result = diagnoseWrongAnswer('target', mv({ target: 0.1, D: 0.0 }), { maxDepth: 2 });
    expect(result.candidates.some((c) => c.concept_id === 'D')).toBe(false);
  });

  it('a larger maxDepth reaches the farther concept', () => {
    const result = diagnoseWrongAnswer('target', mv({ target: 0.1, D: 0.0 }), { maxDepth: 3 });
    const d = result.candidates.find((c) => c.concept_id === 'D');
    expect(d).toBeDefined();
    expect(d?.distance).toBe(3);
  });

  it('defaults maxDepth to FIRE_MAX_DEPTH — one bounded-depth convention, not two', () => {
    const withDefault = diagnoseWrongAnswer('target', mv({ target: 0.1, D: 0.0 }));
    const withExplicit = diagnoseWrongAnswer('target', mv({ target: 0.1, D: 0.0 }), { maxDepth: FIRE_MAX_DEPTH });
    expect(withDefault.candidates).toEqual(withExplicit.candidates);
  });

  it('honors a custom threshold', () => {
    // mastery 0.4 is "weak" only under a raised threshold.
    const strict = diagnoseWrongAnswer('target', mv({ target: 0.4, B: 0.4 }), { maxDepth: 2, threshold: 0.3 });
    expect(strict.evidence_sufficient).toBe(false); // target not weak at threshold 0.3

    const loose = diagnoseWrongAnswer('target', mv({ target: 0.4, B: 0.4 }), { maxDepth: 2, threshold: 0.5 });
    expect(loose.evidence_sufficient).toBe(true); // now both target and B count as weak
  });

  it('a leaf concept with no prerequisites has an empty candidate list and no probe, even if weak', () => {
    const result = diagnoseWrongAnswer('E', mv({ E: 0.0 }), { maxDepth: 2 });
    expect(result.candidates).toEqual([]);
    expect(result.evidence_sufficient).toBe(false);
    expect(result.recommended_probe).toBeNull();
  });

  it('an unknown target concept id does not throw and reports no evidence', () => {
    const result = diagnoseWrongAnswer('does-not-exist', mv({}), { maxDepth: 2 });
    expect(result.candidates).toEqual([]);
    expect(result.evidence_sufficient).toBe(false);
    expect(result.recommended_probe).toBeNull();
  });

  it('missing mastery entries default to 0 (treated as unattempted/weak), not throwing', () => {
    const result = diagnoseWrongAnswer('target', mv({}), { maxDepth: 2 });
    expect(result.target_mastery).toBe(0);
    expect(result.evidence_sufficient).toBe(true); // 0 < 0.3, and prereqs also default to 0
    expect(result.recommended_probe).not.toBeNull();
  });

  it('is deterministic — same inputs, same output, called repeatedly', () => {
    const inputs = mv({ target: 0.1, B: 0.2, E: 0.05, C: 0.1 });
    const a = diagnoseWrongAnswer('target', inputs, { maxDepth: 2 });
    const b = diagnoseWrongAnswer('target', inputs, { maxDepth: 2 });
    expect(a).toEqual(b);
  });
});
