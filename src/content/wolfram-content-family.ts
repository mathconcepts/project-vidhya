/**
 * src/content/wolfram-content-family.ts
 *
 * Classifies each of the 116 GATE-EM atomic topics into one of 14
 * "Wolfram content families" (matrix/eigen/limit/derivative/integral/
 * optimization/vector/ode/pde/complex/probability/statistics/numerical/
 * discrete), per the uploaded gate_wolfram_atomic_mapping.{json,csv,md}.
 *
 * This is data classification, NOT a new prompt block — it informs which
 * prompt resources a topic's `topics` matching SHOULD reach (a resource
 * registered under family name 'eigen' fires for LA-06/LA-07/etc.), but
 * it does not itself write into buildPrompt(). Joins through the
 * EXISTING atomic-concept-map.ts crosswalk (100/116 atomic_ids already
 * resolve to a real concept_id) rather than re-deriving a second topic
 * taxonomy.
 *
 * classify() keyword logic is carried over verbatim from the uploaded
 * generate_gate_wolfram_atomic_mapping.py's own classify() — same rules,
 * same family boundaries, so this repo's classification agrees with the
 * uploaded gate_wolfram_atomic_mapping.json byte-for-byte on every input
 * that script was run against.
 */

import { getAtomicTopicSpec, loadAtomicTopicSpecs, type AtomicTopicSpec } from './atomic-topic-spec';
import { getConceptIdForAtomicId } from './atomic-concept-map';

export const WOLFRAM_CONTENT_FAMILIES = [
  'matrix', 'eigen', 'limit', 'derivative', 'integral', 'optimization',
  'vector', 'ode', 'pde', 'complex', 'probability', 'statistics',
  'numerical', 'discrete',
] as const;
export type WolframContentFamily = (typeof WOLFRAM_CONTENT_FAMILIES)[number];

/**
 * Verbatim port of the uploaded generator script's classify(name, domain,
 * template) — first-match-wins keyword rules over the concatenated,
 * lowercased (subtopic + domain + template_family) string. 'matrix' is
 * the fallback family when nothing else matches, same as the source.
 */
export function classifyWolframContentFamily(
  atomicSubtopic: string,
  domain: string,
  templateFamily: string,
): WolframContentFamily {
  const s = `${atomicSubtopic} ${domain} ${templateFamily}`.toLowerCase();
  if (s.includes('eigen') || s.includes('diagonal') || s.includes('symmetric') || s.includes('cayley')) return 'eigen';
  if (s.includes('matrix') || s.includes('rank') || s.includes('linear') || s.includes('determinant') || s.includes('inverse') || s.includes('lu ')) return 'matrix';
  if (s.includes('limit') || s.includes('continuity')) return 'limit';
  if (s.includes('derivative') || s.includes('differenti') || s.includes('mean value') || s.includes('taylor')) return 'derivative';
  if (s.includes('integral') || s.includes('area') || s.includes('volume')) return 'integral';
  if (s.includes('maxima') || s.includes('minima') || s.includes('optimization') || s.includes('lagrange')) return 'optimization';
  if (s.includes('vector') || s.includes('gradient') || s.includes('divergence') || s.includes('curl') || s.includes('line integral') || s.includes('surface integral')) return 'vector';
  if (s.includes('pde') || s.includes('partial differential')) return 'pde';
  if (s.includes('ode') || s.includes('differential equation')) return 'ode';
  if (s.includes('complex') || s.includes('analytic') || s.includes('residue') || s.includes('contour')) return 'complex';
  if (s.includes('probab') || s.includes('random') || s.includes('bayes') || s.includes('distribution')) return 'probability';
  if (s.includes('statistic') || s.includes('regression') || s.includes('correlation') || s.includes('hypothesis')) return 'statistics';
  if (s.includes('numerical') || s.includes('newton') || s.includes('interpolation') || s.includes('runge') || s.includes('trapezoid') || s.includes('euler')) return 'numerical';
  if (s.includes('graph') || s.includes('logic') || s.includes('set') || s.includes('relation') || s.includes('recurrence') || s.includes('combin') || s.includes('number theor')) return 'discrete';
  return 'matrix';
}

export interface AtomicTopicFamilyEntry {
  atomic_id: string;
  concept_id: string | null;
  family: WolframContentFamily;
  spec: AtomicTopicSpec;
}

/**
 * The full per-topic classification, joined to concept_id via the
 * existing crosswalk. `concept_id` is null for the 16 atomic_ids
 * atomic-concept-map.ts already documents as unmapped — never guessed.
 */
export function classifyAllAtomicTopics(): AtomicTopicFamilyEntry[] {
  const specs = loadAtomicTopicSpecs();
  const out: AtomicTopicFamilyEntry[] = [];
  for (const spec of specs.values()) {
    const family = classifyWolframContentFamily(
      spec.structure.atomic_subtopic,
      spec.structure.domain,
      spec.structure.template_family,
    );
    out.push({
      atomic_id: spec.atomic_id,
      concept_id: getConceptIdForAtomicId(spec.atomic_id),
      family,
      spec,
    });
  }
  return out;
}

/** Family for one atomic_id, or null if the id isn't in the loaded spec set. */
export function wolframContentFamilyFor(atomicId: string): WolframContentFamily | null {
  const spec = getAtomicTopicSpec(atomicId);
  if (!spec) return null;
  return classifyWolframContentFamily(spec.structure.atomic_subtopic, spec.structure.domain, spec.structure.template_family);
}
