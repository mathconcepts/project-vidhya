/**
 * src/content/source-locator.ts
 *
 * docs/designs/2026-09-02-content-strategy-research-integration-plan.md
 * (P4, follow-up named in TODOS.md): the research framework wants claim-level
 * evidence — not just a label, but WHERE the claim was verified (a source id,
 * a URL, an official paper + year, a specific question id, a page/section).
 * `AuthoredItem.evidence_level` (src/scoring/learning-object-catalog-file.ts)
 * already carries the label; this is the locator that sits beside it.
 *
 * Deliberately narrow: this is NOT a replacement for
 * data/curriculum/gate-em/historical-evidence.yml's per-TOPIC D/P/S corpus
 * coding. That file's own header is explicit that inventing paper/year/
 * question-id locators for its 116 rows without a real item-level coding
 * protocol would be fabrication, not provenance — see its header comment.
 * This module is the opposite case: a structured place to RECORD a locator
 * an author already has for one specific item's claim, never a place to
 * back-fill one that doesn't exist. Every field is optional; an item with
 * `evidence_level` set and no locator is not wrong, just less specific than
 * it could be — see `hasAnyLocatorField` and its caller in
 * scripts/check-practice-items.ts for the one place a locator becomes
 * required (a `directly_reviewed` item making a phrase-rule-licensed claim).
 */

export interface SourceLocator {
  /** Free-text or an id matching src/jobs/source-freshness-monitor.ts's OFFICIAL_SOURCES, when applicable. */
  source_id?: string;
  /** A reachable URL for the source, when one exists (an official page/PDF). */
  url?: string;
  /** The exam paper this was reviewed against, e.g. "GATE CS 2023". */
  paper?: string;
  /** The year of the paper/source, when meaningfully separate from `paper`. */
  year?: number;
  /** The specific question id/number within the paper, when the claim is about one question. */
  question_id?: string;
  /** A page number or range within the source document. */
  page?: string;
  /** A section heading or locator within the source, for a long document. */
  section?: string;
}

const LOCATOR_FIELDS: (keyof SourceLocator)[] = [
  'source_id', 'url', 'paper', 'year', 'question_id', 'page', 'section',
];

/** True iff at least one locator field is a non-empty value — an empty `{}` is not a real locator. */
export function hasAnyLocatorField(locator: SourceLocator | null | undefined): boolean {
  if (!locator || typeof locator !== 'object') return false;
  return LOCATOR_FIELDS.some((f) => {
    const v = locator[f];
    return v !== undefined && v !== null && v !== '';
  });
}

/**
 * Structural validation only — every field is optional, but a field that IS
 * present must be the right type. Returns human-readable problem strings;
 * [] means the locator (or its absence) is fine.
 */
export function validateSourceLocatorShape(raw: unknown): string[] {
  if (raw === undefined) return [];
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return ['source_locator must be an object when present'];
  }
  const problems: string[] = [];
  const obj = raw as Record<string, unknown>;
  for (const field of ['source_id', 'url', 'paper', 'question_id', 'page', 'section'] as const) {
    if (obj[field] !== undefined && typeof obj[field] !== 'string') {
      problems.push(`source_locator.${field} must be a string when present`);
    }
  }
  if (obj.year !== undefined && typeof obj.year !== 'number') {
    problems.push('source_locator.year must be a number when present');
  }
  return problems;
}
