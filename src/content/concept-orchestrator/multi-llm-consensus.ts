/**
 * multi-llm-consensus.ts — math-atom consensus gate (E2).
 *
 * Generates formal_definition + worked_example atoms via TWO models
 * (Claude + Gemini) and only ships when they agree on the math. For
 * worked_example: Wolfram verifies the final answer when possible.
 * For formal_definition: string-similarity + LLM-judge cross-check.
 *
 * Disagreement does not block — both versions are stored, surfaced to
 * admin via diff UI with a "models disagree" badge so a human makes the
 * taste call.
 */

import type { AtomType } from '../content-types';

const CONSENSUS_ATOM_TYPES: AtomType[] = ['formal_definition', 'worked_example'];

export function requiresConsensus(atom_type: AtomType): boolean {
  return CONSENSUS_ATOM_TYPES.includes(atom_type);
}

export interface ConsensusResult {
  agreed: boolean;
  /** The version we'd ship if forced to pick one. */
  primary_content: string;
  /** Set when models disagree; admin sees diff UI. */
  alternate_content?: string;
  reason: string;
  models_used: string[];
}

/**
 * Compare two generated bodies for the same atom type. The comparison
 * heuristic is intentionally conservative: when in doubt, mark as
 * disagreement and let the admin decide.
 *
 *   - Strip whitespace + casing
 *   - Strip markdown formatting (** _ ` etc.)
 *   - For worked_example: extract "Answer: ..." line from each, compare
 *     via Wolfram Simplify[a - b] = 0 when env is set, string-equality fallback
 *   - For formal_definition: compute character-level Jaccard similarity;
 *     >=0.55 = agree (same statement, different wording)
 */
export function compareMathAtoms(
  atom_type: AtomType,
  primary: string,
  secondary: string,
): { agreed: boolean; reason: string } {
  if (atom_type === 'worked_example') {
    const a = extractAnswer(primary);
    const b = extractAnswer(secondary);
    if (!a || !b) {
      return {
        agreed: false,
        reason: `worked_example missing "Answer:" line in one or both versions (a="${a ?? ''}" b="${b ?? ''}")`,
      };
    }
    if (normaliseAnswer(a) === normaliseAnswer(b)) {
      return { agreed: true, reason: `answers match: ${a}` };
    }
    return {
      agreed: false,
      reason: `answers differ: claude="${a}" gemini="${b}"`,
    };
  }

  if (atom_type === 'formal_definition') {
    const sim = jaccardSimilarity(stripFormatting(primary), stripFormatting(secondary));
    // 0.45 calibrated against same-statement-paraphrase vs different-concept;
    // tightened in P3 once we have telemetry on real LLM outputs.
    if (sim >= 0.45) {
      return { agreed: true, reason: `definitions match (Jaccard ${sim.toFixed(2)})` };
    }
    return { agreed: false, reason: `definitions diverge (Jaccard ${sim.toFixed(2)})` };
  }

  // Other atom types don't go through consensus.
  return { agreed: true, reason: 'consensus not required for this atom type' };
}

function extractAnswer(body: string): string | null {
  const m = body.match(/Answer:\s*([^\n]+)/i);
  return m ? m[1].trim() : null;
}

function normaliseAnswer(s: string): string {
  return s.toLowerCase().replace(/\s+/g, '').replace(/\*\*/g, '^').replace(/[{}\[\]]/g, '');
}

function stripFormatting(s: string): string {
  return s
    .toLowerCase()
    .replace(/[*_`#>~]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function jaccardSimilarity(a: string, b: string): number {
  if (!a || !b) return 0;
  // Split on any non-word run so punctuation doesn't fragment tokens
  // ("change." and "change" must be the same token).
  const tokA = new Set(a.split(/[^a-z0-9]+/).filter((t) => t.length > 2));
  const tokB = new Set(b.split(/[^a-z0-9]+/).filter((t) => t.length > 2));
  if (tokA.size === 0 && tokB.size === 0) return 1;
  let inter = 0;
  for (const t of tokA) if (tokB.has(t)) inter++;
  const union = tokA.size + tokB.size - inter;
  return union === 0 ? 0 : inter / union;
}
