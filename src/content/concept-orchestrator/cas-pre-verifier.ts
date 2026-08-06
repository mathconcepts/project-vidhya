/**
 * cas-pre-verifier.ts — CAS gate that runs BEFORE atoms are persisted.
 *
 * For math-bearing atom types, this extracts the stated final answer and
 * verifies it against Wolfram Alpha. Atoms whose answers Wolfram disagrees
 * with are rejected before reaching atom_versions.
 *
 * Gate behavior (VIDHYA_CAS_PREFLIGHT env var):
 *   off (default) — no-op, zero latency added
 *   shadow        — verify and log, never reject (observe at zero risk)
 *   on            — verify and reject disagreeing atoms
 *
 * We use wolframSolve() directly rather than the full TieredVerification-
 * Orchestrator because:
 *   - Tier 1 RAG has no pre-seeded entries for newly generated content
 *   - Tier 2 LLM dual-solve would use the same models that authored the content
 *   - Wolfram is the honest symbolic check
 */

import type { AtomType } from '../content-types';
import type { GeneratedAtom } from './types';
import { wolframSolve, answersAgree } from '../../services/wolfram-service';

/** Atom types whose bodies should contain a verifiable math answer. */
const MATH_ATOM_TYPES = new Set<AtomType>([
  'worked_example',
  'interleaved_drill',
  'micro_exercise',
  'formal_definition',
]);

export interface CasPreVerifyResult {
  /** True when this atom type has no extractable answer — skip without penalty. */
  skipped: boolean;
  /** True when Wolfram confirmed the stated answer. False when it disagreed. */
  verified: boolean;
  /** Set when verified=false and skipped=false (gate mode: 'on' or 'shadow'). */
  reason?: string;
  /** The answer string that was verified (for logging / meta). */
  extractedAnswer?: string;
  /** Wolfram's own answer for logging when they disagree. */
  wolframAnswer?: string;
}

/**
 * Extract the stated final answer from an atom body.
 *
 * Supports two formats:
 *   1. "Answer: <value>" — the format the worked_example prompt specifies
 *   2. "\boxed{<value>}" — standard LaTeX math notation, brace-balanced
 */
export function extractAtomAnswer(content: string, atomType: AtomType): string | null {
  if (!MATH_ATOM_TYPES.has(atomType)) return null;

  // Pattern 1: "Answer: <value>" on its own line
  const answerLine = content.match(/^Answer:\s*(.+?)(?:\n|$)/im);
  if (answerLine?.[1]?.trim()) return answerLine[1].trim();

  // Pattern 2: \boxed{<value>} — brace-balanced extraction
  const boxedIdx = content.indexOf('\\boxed{');
  if (boxedIdx !== -1) {
    const start = boxedIdx + 7; // skip "\boxed{"
    let depth = 1;
    let i = start;
    while (i < content.length && depth > 0) {
      if (content[i] === '{') depth++;
      else if (content[i] === '}') depth--;
      i++;
    }
    if (depth === 0) {
      const inner = content.slice(start, i - 1).trim();
      if (inner) return inner;
    }
  }

  return null;
}

/**
 * Extract the problem statement (everything before the answer marker).
 * Falls back to the full content when no answer marker is present.
 */
function extractProblemPrefix(content: string): string {
  // Split at the last "---" separator (worked_example step delimiter) or at "Answer:"
  const answerIdx = content.search(/^Answer:/im);
  if (answerIdx > 0) return content.slice(0, answerIdx).trim();

  const sepIdx = content.lastIndexOf('\n---\n');
  if (sepIdx > 0) return content.slice(0, sepIdx).trim();

  return content.trim();
}

/**
 * Run CAS pre-verification on an atom before it is persisted.
 *
 * Returns a result object; the CALLER decides whether to reject the atom
 * (gate mode 'on') or just log (shadow mode). This function never throws —
 * all cascade failures are surfaced as `skipped: true`.
 */
export async function casPreVerify(
  atom: GeneratedAtom,
  topic?: string,
): Promise<CasPreVerifyResult> {
  const mode = process.env.VIDHYA_CAS_PREFLIGHT ?? 'off';
  if (mode === 'off') return { skipped: true, verified: false };

  const answer = extractAtomAnswer(atom.content, atom.atom_type);
  if (!answer) return { skipped: true, verified: false };

  const problem = extractProblemPrefix(atom.content);
  // Build a query Wolfram can solve: "solve <problem>" or just the problem if
  // it already contains an equation. Keep it tight to stay within Wolfram's
  // input limits and avoid confusing it with markdown formatting.
  const stripped = problem.replace(/\$\$[\s\S]*?\$\$/g, m => m.replace(/\$/g, ''))
                          .replace(/\$[^$]+\$/g, m => m.replace(/\$/g, ''))
                          .replace(/```[\s\S]*?```/g, '')
                          .replace(/[*_#>]/g, '')
                          .slice(0, 400);
  const query = stripped.trim();

  try {
    const result = await wolframSolve(query, { timeout_ms: 12_000 });

    if (!result.available) {
      // Wolfram not configured — treat as skipped so gate never blocks by default
      return { skipped: true, verified: false };
    }

    if (!result.answer) {
      // Wolfram couldn't parse the query — skip without penalty
      const msg = `Wolfram returned no answer for atom ${atom.atom_id} (query: "${query.slice(0, 80)}…")`;
      console.info(`[cas-pre-verifier] ${msg}`);
      return { skipped: true, verified: false };
    }

    const agreed = answersAgree(answer, result.answer);

    if (mode === 'shadow') {
      console.info(
        `[cas-pre-verifier] shadow ${atom.atom_id}: ${agreed ? 'PASS' : 'FAIL'} ` +
        `(extracted="${answer}", wolfram="${result.answer}")`,
      );
      return { skipped: false, verified: agreed, extractedAnswer: answer, wolframAnswer: result.answer };
    }

    // mode === 'on'
    if (!agreed) {
      return {
        skipped: false,
        verified: false,
        reason: `Wolfram disagrees with stated answer. Stated: "${answer}". Wolfram: "${result.answer}".`,
        extractedAnswer: answer,
        wolframAnswer: result.answer,
      };
    }
    return { skipped: false, verified: true, extractedAnswer: answer, wolframAnswer: result.answer };

  } catch (err) {
    console.warn(`[cas-pre-verifier] cascade error for ${atom.atom_id}: ${(err as Error).message}`);
    return { skipped: true, verified: false };
  }
}
