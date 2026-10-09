/**
 * frontend/src/lib/pyq-provenance.ts — hand-synced mirror of
 * `src/content/pyq-provenance.ts`. Read that file's header for the rule and
 * for the defect it closes (114 of 241 bank rows were being rendered as
 * "GATE <year>" off a `year: q.year || 2024` code default).
 *
 * Why a mirror rather than an import: `frontend/public/data/pyq-bank.json`
 * is a static file the browser fetches and reads directly, so the decision
 * "may this row name a paper?" has to be answerable client-side. The
 * backend package's `rootDir` also forbids a static import across the
 * boundary in either direction. Same constraint and same manual-sync
 * precedent as `frontend/src/lib/ledger-suggestions.ts` and
 * `frontend/src/lib/mastery-confidence.ts`.
 *
 * Drift is caught, not trusted: `src/content/__tests__/pyq-provenance.test.ts`
 * drives this implementation and the backend's over the SAME shared fixture
 * table (`src/content/__tests__/fixtures/pyq-provenance-cases.json`) and
 * fails when the two disagree on any case.
 */

const CITING_EVIDENCE_LEVELS = ['official', 'directly_reviewed'] as const;
const CITING_SET = new Set<string>(CITING_EVIDENCE_LEVELS);

const LOCATOR_FIELDS = ['source_id', 'url', 'paper', 'year', 'question_id', 'page', 'section'] as const;

export interface PyqProvenanceFields {
  evidence_level?: unknown;
  source_locator?: unknown;
  year?: unknown;
}

interface Locator {
  paper?: unknown;
  question_id?: unknown;
  [k: string]: unknown;
}

function locatorOf(row: PyqProvenanceFields): Locator | null {
  const raw = row?.source_locator;
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  return raw as Locator;
}

function hasAnyLocatorField(loc: Locator | null): boolean {
  if (!loc) return false;
  return LOCATOR_FIELDS.some((f) => {
    const v = loc[f];
    return v !== undefined && v !== null && v !== '';
  });
}

function paperOf(row: PyqProvenanceFields): string | null {
  const loc = locatorOf(row);
  if (!loc || !hasAnyLocatorField(loc)) return null;
  const paper = typeof loc.paper === 'string' ? loc.paper.trim() : '';
  return paper.length > 0 ? paper : null;
}

/** True iff this row may be displayed as having come from a specific paper. */
export function canCiteExamPaper(row: PyqProvenanceFields | null | undefined): boolean {
  if (!row) return false;
  if (typeof row.evidence_level !== 'string' || !CITING_SET.has(row.evidence_level)) return false;
  return paperOf(row) !== null;
}

/** The paper string a reviewer recorded, never one assembled from a year. */
export function examCitation(row: PyqProvenanceFields | null | undefined): string | null {
  if (!row || !canCiteExamPaper(row)) return null;
  const paper = paperOf(row)!;
  const loc = locatorOf(row)!;
  const q = typeof loc.question_id === 'string' ? loc.question_id.trim() : '';
  return q.length > 0 ? `${paper} Q${q}` : paper;
}

export const UNCITED_PYQ_LABEL = 'Exam-pattern practice';

/** The citation when there is one, else the honest fallback. Never null. */
export function provenanceLabel(row: PyqProvenanceFields | null | undefined): string {
  return examCitation(row) ?? UNCITED_PYQ_LABEL;
}
