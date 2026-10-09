/**
 * src/content/pyq-provenance.ts — may this question claim it came from a paper?
 *
 * ## The defect this exists to close
 *
 * `frontend/public/data/pyq-bank.json` shipped 241 questions, every one of
 * them carrying a `year`, and four surfaces rendered that year as a paper
 * citation: `TopicPage.tsx` ("GATE 2024"), `TeachingDashboardPage.tsx`,
 * `src/api/topic-pages.ts` (public SEO pages) and `src/jobs/daily-problem.ts`
 * ("Year: GATE 2024", posted to a Telegram group).
 *
 * 114 of those years were not a claim anybody made. They came from
 * `scripts/upload-gate-em-materials.ts`'s `year: q.year || 2024` — a code
 * default over source files that carry no year at all (524 of the 634
 * committed `mcqs.json` questions have none). A student was being told a
 * question was from GATE 2024 because a fallback literal said so.
 *
 * The remaining years ARE an authored claim, but no row anywhere carries a
 * locator naming the paper and question it came from, so none of them is
 * checkable either.
 *
 * ## The rule
 *
 * A paper citation is licensed by a LOCATOR, never by a bare year.
 * `source_locator.paper` (src/content/source-locator.ts) is the only thing
 * that may be printed as the source of a question, and only on a row whose
 * `evidence_level` says somebody actually looked at that paper.
 *
 * That makes "this is a real past-paper question" unfakeable without
 * recording where it was read, which is the whole point: a future import of
 * genuine PYQs is trustworthy precisely because it has to name its source,
 * and today's authored bank cannot accidentally pass itself off as one.
 *
 * `year` is deliberately NOT deleted from an authored row. It is a lead for
 * whoever reviews the bank against real papers later. It is simply never
 * rendered as a citation. (The 114 code-defaulted years were removed, not
 * kept: a fallback literal is not a lead.)
 *
 * ## Mirrored on the frontend
 *
 * `frontend/src/lib/pyq-provenance.ts` is a hand-synced mirror — the bank is
 * a static JSON file the browser reads directly, so the rule has to exist on
 * both sides (same constraint, and same manual-sync precedent, as
 * `src/experiments/ledger-suggestions.ts` and `src/lib/mastery-confidence.ts`).
 * `src/content/__tests__/pyq-provenance.test.ts` drives BOTH implementations
 * over the same shared fixture table, so neither can drift in silence.
 */

import { hasAnyLocatorField, type SourceLocator } from './source-locator';
import { EVIDENCE_LEVELS, type EvidenceLevel } from '../scoring/learning-object-catalog-file';

/**
 * The evidence levels under which a row is allowed to name a paper at all.
 *
 * `official` = transcribed from the exam body's own published paper.
 * `directly_reviewed` = a human read this question against that paper.
 *
 * `pattern_supported` and `design_hypothesis` are claims about the question
 * TYPE being exam-relevant, not about this question having been asked. They
 * never license a citation, however confident the author was.
 */
export const CITING_EVIDENCE_LEVELS: readonly EvidenceLevel[] = ['official', 'directly_reviewed'];

const CITING_SET: ReadonlySet<string> = new Set(CITING_EVIDENCE_LEVELS);
const LEVEL_SET: ReadonlySet<string> = new Set(EVIDENCE_LEVELS);

/** The subset of a bank row this module reads. Anything else rides along. */
export interface PyqProvenanceFields {
  evidence_level?: unknown;
  source_locator?: unknown;
  year?: unknown;
}

function locatorOf(row: PyqProvenanceFields): SourceLocator | null {
  const raw = row?.source_locator;
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  return raw as SourceLocator;
}

function paperOf(row: PyqProvenanceFields): string | null {
  const loc = locatorOf(row);
  if (!loc || !hasAnyLocatorField(loc)) return null;
  const paper = typeof loc.paper === 'string' ? loc.paper.trim() : '';
  return paper.length > 0 ? paper : null;
}

/**
 * True iff this row may be displayed as having come from a specific paper.
 *
 * Both halves are required, and each rules out a real case:
 *   - the level, because an authored question can be perfectly good and
 *     still never have been asked;
 *   - `source_locator.paper`, because a year on its own identifies nothing
 *     and is exactly what the 114 defaulted rows had.
 */
export function canCiteExamPaper(row: PyqProvenanceFields | null | undefined): boolean {
  if (!row) return false;
  if (typeof row.evidence_level !== 'string' || !CITING_SET.has(row.evidence_level)) return false;
  return paperOf(row) !== null;
}

/**
 * What to print as the question's source, or null when nothing may be
 * printed. Never assembles a citation out of an exam name plus a year —
 * it returns the paper string a reviewer recorded, and the question number
 * alongside it when they recorded that too.
 */
export function examCitation(row: PyqProvenanceFields | null | undefined): string | null {
  if (!row || !canCiteExamPaper(row)) return null;
  const paper = paperOf(row)!;
  const loc = locatorOf(row)!;
  const q = typeof loc.question_id === 'string' ? loc.question_id.trim() : '';
  return q.length > 0 ? `${paper} Q${q}` : paper;
}

/**
 * The honest label for a row that cannot cite a paper. Deliberately says
 * what the question IS rather than apologising for what it is not: an
 * exam-pattern question written to the paper's shape is a legitimate thing
 * to practise on, and the previous fallback copy ("Generated · verified")
 * described neither its origin nor its checking accurately.
 */
export const UNCITED_PYQ_LABEL = 'Exam-pattern practice';

/** The citation when there is one, else the honest fallback. Never null. */
export function provenanceLabel(row: PyqProvenanceFields | null | undefined): string {
  return examCitation(row) ?? UNCITED_PYQ_LABEL;
}

/**
 * Schema problems with a row's provenance. Empty array = clean.
 *
 * `evidence_level` is REQUIRED here, unlike on `AuthoredItem` where it stays
 * optional. The reason is the surfaces above: a practice item has never had
 * a paper citation to make, and a PYQ-bank row is rendered next to one. A
 * row with no level is a row nothing can decide about, which is how the
 * defaulted years got out.
 */
export function checkPyqProvenance(row: PyqProvenanceFields | null | undefined): string[] {
  const out: string[] = [];
  if (!row) return ['row is not an object'];

  if (row.evidence_level === undefined || row.evidence_level === null) {
    out.push(
      `evidence_level is required on every pyq-bank row — one of {${EVIDENCE_LEVELS.join(', ')}}; ` +
        `use 'design_hypothesis' for a question authored in the exam's style and never checked ` +
        `against a paper, and 'official'/'directly_reviewed' only with a source_locator.paper`,
    );
  } else if (typeof row.evidence_level !== 'string' || !LEVEL_SET.has(row.evidence_level)) {
    out.push(`evidence_level '${String(row.evidence_level)}' is not one of {${EVIDENCE_LEVELS.join(', ')}}`);
  } else if (CITING_SET.has(row.evidence_level) && paperOf(row) === null) {
    out.push(
      `evidence_level '${row.evidence_level}' claims this question was read against a paper, ` +
        `but source_locator.paper is missing — record the paper (and question_id when known), ` +
        `or drop to 'pattern_supported'/'design_hypothesis'`,
    );
  }

  return out;
}
