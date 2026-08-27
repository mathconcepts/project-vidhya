/**
 * evidence-phrase-rule.ts — W1.2/E10 CI phrase rule, shared source of truth.
 *
 * Student-facing committed content may not claim a topic is "high-yield" /
 * "frequently asked" / "most repeated" / "often asked" UNLESS the specific
 * item making the claim carries a structured `evidence_level: 'directly_reviewed'`
 * label (D10: `evidence_level` is the structured provenance field;
 * `verification_method` / free-text detail sits beneath it, never a rival).
 *
 * Used by two CI gates, each scoped to the surface it already owns:
 *   - scripts/check-practice-items.ts: data/practice-items/*.json
 *     question_text + solution_steps, and frontend/public/data/pyq-bank.json
 *     question_text + explanation.
 *   - scripts/check-intent-catalogue.ts: atomic-catalogue.json seo.title,
 *     intent-profiles.yml problem_statement_frame.
 *
 * Kept as ONE shared module rather than two copies deliberately — CLAUDE.md's
 * "Multi-Provider LLM Support" postmortem is exactly the failure class two
 * independent phrase lists would become the moment someone edited one and
 * not the other.
 *
 * Best-effort layer (E10, plan-level rule): this is a grep-style heuristic
 * over COMMITTED text, not exhaustive prose review, and it does not run at
 * generation time for runtime-generated copy CI never sees — the plan names
 * that gap explicitly rather than overclaiming grep coverage (§7 metric 2).
 */

export const FORBIDDEN_UNSOURCED_PHRASES = [
  'high-yield',
  'frequently asked',
  'most repeated',
  'often asked',
] as const;

export interface PhraseHit {
  phrase: string;
  /** Character offset into the lower-cased text where the phrase starts. */
  index: number;
}

/**
 * Case-insensitive scan for every forbidden phrase in `text`, in order of
 * appearance. Returns [] for empty/undefined/null text — absence of text is
 * not a violation.
 */
export function findForbiddenPhrases(text: string | undefined | null): PhraseHit[] {
  if (!text) return [];
  const hits: PhraseHit[] = [];
  const lower = text.toLowerCase();
  for (const phrase of FORBIDDEN_UNSOURCED_PHRASES) {
    let idx = lower.indexOf(phrase);
    while (idx !== -1) {
      hits.push({ phrase, index: idx });
      idx = lower.indexOf(phrase, idx + phrase.length);
    }
  }
  return hits;
}

/**
 * True iff `evidenceLevel` is the one value that licenses using a forbidden
 * phrase on this specific item. Anything else (undefined, or one of the
 * other three AuthoredItem.evidence_level values) does not.
 */
export function evidenceLevelLicensesClaim(evidenceLevel: string | undefined | null): boolean {
  return evidenceLevel === 'directly_reviewed';
}
