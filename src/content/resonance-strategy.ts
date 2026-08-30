/**
 * resonance-strategy.ts — joins the founder's per-topic content-generation
 * spec (atomic-topic-spec.ts, 116 GATE Engineering Mathematics topics) to
 * this app's concept_id space via the hand-verified crosswalk
 * (atomic-concept-map.ts), giving buildPrompt() a single answer to "what
 * attention strategy has already been designed for this concept?"
 *
 * Why this file exists (docs/designs/2026-08-30-resonance-fused-atoms-plan.md
 * §W4 / §4 finding 4): the founder's spec carries `recommended_hooks`,
 * `base_sequence`, `personalized_delta_slots` and an
 * `attention_design_hypothesis` per atomic topic, and — until this module —
 * nothing in generation read any of it. atomic-concept-map.ts resolves
 * 100/116 atomic_ids to a concept_id; this module is the first real
 * consumer of that crosswalk from the generation path.
 *
 * The join is N:1, and the merge rule is locked by the plan (not a design
 * choice made here): `eigenvalues` resolves from BOTH `LA-06` (Eigenvalues)
 * and `LA-07` (Eigenvectors) — this app teaches them as one concept, and
 * `getAtomicIdsForConceptId` returns `string[]` for exactly this reason.
 * Merge:
 *   - `recommended_hooks`   — concatenated in sorted-atomic-id order,
 *                             de-duplicated (order of first appearance kept)
 *   - `personalized_delta_slots` — unioned the same way
 *   - `base_sequence` / `attention_design_hypothesis` — taken from the
 *     LOWEST atomic id only. These are boilerplate-per-family in the source
 *     CSVs today (verified: LA-06 and LA-07's rows are byte-identical on
 *     both fields), so first-wins loses nothing now; revisit this rule if
 *     the CSVs ever diverge per individual topic instead of per family.
 *
 * A concept with no atomic_id mapping at all (`getAtomicIdsForConceptId`
 * returns `[]` — either a concept the founder's base spec never covered, or
 * one of the 15 richer Linear Algebra concepts added beyond it) returns
 * `null`. Callers (buildPrompt) must omit the resonance block entirely on
 * `null` rather than fabricating a strategy — the same discipline
 * atomic-concept-map.ts already applies to unmapped atomic_ids.
 *
 * Memoized like atomic-topic-spec.ts: both the crosswalk and the CSVs are
 * static within a process lifetime. Call
 * `__resetResonanceStrategyCacheForTests()` in tests that swap either
 * underlying source.
 */

import { getAtomicIdsForConceptId } from './atomic-concept-map';
import { getAtomicTopicSpec, type AtomicTopicSpec } from './atomic-topic-spec';

export interface ResonanceStrategy {
  concept_id: string;
  /** Ascending — the atomic ids this concept's strategy was merged from. */
  atomic_ids: string[];
  recommended_hooks: string[];
  personalized_delta_slots: string[];
  base_sequence: string[];
  attention_design_hypothesis: string;
}

let _cache: Map<string, ResonanceStrategy | null> | null = null;

function dedupeConcat(lists: string[][]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const list of lists) {
    for (const item of list) {
      if (!seen.has(item)) {
        seen.add(item);
        out.push(item);
      }
    }
  }
  return out;
}

function computeStrategy(conceptId: string): ResonanceStrategy | null {
  // Sorted ascending — atomic ids within one domain are zero-padded
  // (LA-01..LA-11), so a plain string sort is a numeric sort too.
  const atomicIds = [...getAtomicIdsForConceptId(conceptId)].sort();
  if (atomicIds.length === 0) return null;

  // Resolve every atomic id to its spec, in sorted order, skipping any
  // atomic id the crosswalk knows about but the CSVs don't (mapping and
  // spec loading are independent failure modes — never fabricate for one
  // from the other). The first entry that DOES resolve supplies the
  // "lowest atomic id" fields.
  const resolved: AtomicTopicSpec[] = [];
  for (const atomicId of atomicIds) {
    const spec = getAtomicTopicSpec(atomicId);
    if (spec) resolved.push(spec);
  }
  if (resolved.length === 0) return null;

  const lowest = resolved[0];
  return {
    concept_id: conceptId,
    atomic_ids: resolved.map((s) => s.atomic_id),
    recommended_hooks: dedupeConcat(resolved.map((s) => s.structure.recommended_hooks)),
    personalized_delta_slots: dedupeConcat(resolved.map((s) => s.structure.personalized_delta_slots)),
    base_sequence: lowest.structure.base_sequence,
    attention_design_hypothesis: lowest.structure.attention_design_hypothesis,
  };
}

/**
 * The merged per-topic attention/hook strategy for one concept, or `null`
 * when the concept has no atomic_id mapping. Memoized per concept_id.
 */
export function resonanceStrategyFor(conceptId: string): ResonanceStrategy | null {
  if (!_cache) _cache = new Map();
  if (_cache.has(conceptId)) return _cache.get(conceptId) ?? null;
  const strategy = computeStrategy(conceptId);
  _cache.set(conceptId, strategy);
  return strategy;
}

/** Test-only: drop the memoized results so a test fixture takes effect. */
export function __resetResonanceStrategyCacheForTests(): void {
  _cache = null;
}
