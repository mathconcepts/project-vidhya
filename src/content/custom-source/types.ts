/**
 * src/content/custom-source/types.ts
 *
 * docs/designs/2026-09-02-content-strategy-research-integration-plan.md
 * (P7, follow-up named in TODOS.md): the research framework's custom-PDF
 * ingestion pipeline (docs/content-spec/integrated-self-improving-learning-
 * system.md §15.6):
 *
 *   register source -> permission/access metadata -> download/receive file
 *     -> compute hash -> extract text/layout/tables/figures
 *     -> OCR only when necessary, mark OCR confidence
 *     -> segment into source spans with page references
 *     -> map spans to atomic IDs and base anchors
 *     -> classify claims, examples, definitions and calculations
 *     -> verify against canonical content and independent checks
 *     -> create a draft delta with citations
 *     -> owner review or benchmark review
 *     -> publish, quarantine or reject
 *
 * This module is the DATA MODEL for that pipeline (register/store/review),
 * a real, usable seam a future upload flow can call into immediately. What
 * it deliberately does NOT do — named honestly rather than half-built — is
 * the middle of the pipeline: text/layout/table extraction and OCR need a
 * library or provider decision (Tesseract vs. a cloud OCR API, local disk
 * vs. object storage for the uploaded file itself) this pass does not make.
 * `CustomSourceExtractor` below is the Phase-0-seam contract for that step —
 * same split this repo already used for LLMJudge/CASChecker
 * (src/scoring/rubric-grader.ts, src/scoring/adapters/): an interface lands
 * first, a concrete adapter lands in its own reviewed wiring PR once the
 * provider decision is made, and nothing calls the interface until then.
 *
 * Ties into two pieces already shipped this pass:
 *   - `SourceLocator` (src/content/source-locator.ts) is exactly the right
 *     shape for citing a page/section on a claim drawn from a custom PDF —
 *     `ClaimDraft.locator` reuses it rather than inventing a second one.
 *   - `DeltaKind` (src/content/delta-kinds.ts): a claim promoted out of
 *     review becomes a `custom_source` delta. `ClaimDraft.delta_kind` is
 *     typed to the same closed union so a promoted claim is already tagged
 *     correctly, no translation step needed.
 */

import type { SourceLocator } from '../source-locator';
import type { DeltaKind } from '../delta-kinds';

export type CustomSourceDocumentStatus = 'registered' | 'extracted' | 'quarantined' | 'rejected';

export interface CustomSourceDocument {
  id: string;
  /** Who uploaded this — an operator or a student/teacher, depending on the eventual upload flow's auth model (undecided, see module doc). */
  uploader_id: string;
  title: string;
  /** SHA-256 of the raw file bytes. Registering the same file twice must resolve to the same document, not a duplicate — see findDocumentByHash. */
  file_hash: string;
  mime_type: string;
  page_count?: number;
  /**
   * Required before extraction may run (research §15.6: "obtain permission
   * and access metadata"). This module enforces it is set to true before
   * `addSpans` accepts spans for a document — it does not itself decide
   * WHAT counts as permission (an upload consent checkbox, a license
   * field, an institutional agreement) — that is the upload flow's job.
   */
  permission_confirmed: boolean;
  /** Set once extraction has run; absent means "not yet extracted". 0-1. */
  extraction_quality?: number;
  uploaded_at: string;
  status: CustomSourceDocumentStatus;
}

export type SourceSpanExtractionMethod = 'text_layer' | 'ocr';

export interface SourceSpan {
  id: string;
  source_document_id: string;
  page_number?: number;
  section_heading?: string;
  extracted_text: string;
  extraction_method: SourceSpanExtractionMethod;
  /** 0-1. OCR spans should carry a real confidence score, never a guessed constant — see CustomSourceExtractor's doc. */
  extraction_quality: number;
}

export type ClaimReviewStatus = 'pending' | 'approved' | 'rejected' | 'quarantined';

export interface ClaimDraft {
  id: string;
  source_span_id: string;
  concept_id: string;
  claim_text: string;
  /** Almost always 'custom_source' — a claim IS the custom-PDF delta type by construction — but left as the full DeltaKind union in case a span's claim is better classified once reviewed (e.g. it turns out to restate a verified_computation). */
  delta_kind: DeltaKind;
  /** WHERE in the source this claim came from — reuses source-locator.ts rather than a second locator shape. */
  locator: SourceLocator;
  review_status: ClaimReviewStatus;
  created_at: string;
  reviewed_at?: string;
  reviewer_id?: string;
  /** Required when review_status is 'rejected' or 'quarantined' — an operator decision with no reason recorded is not an audit trail. */
  review_note?: string;
}

/**
 * Phase-0 seam, deliberately unimplemented in this pass — see module doc.
 * A concrete adapter wraps a real extraction/OCR library; its own reviewed
 * wiring PR is where the provider decision gets made and tested. Until
 * then this interface exists so `CustomSourceRepo` callers (register a
 * document, later attach extracted spans) have a stable shape to code
 * against without knowing which extractor will eventually run.
 */
export interface CustomSourceExtractor {
  extract(
    fileBuffer: Buffer,
    mimeType: string,
  ): Promise<{
    spans: Array<Omit<SourceSpan, 'id' | 'source_document_id'>>;
    /** Overall extraction confidence across every span, 0-1. */
    overall_quality: number;
  }>;
}
