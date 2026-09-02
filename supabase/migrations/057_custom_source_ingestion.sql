-- 057_custom_source_ingestion.sql
--
-- docs/designs/2026-09-02-content-strategy-research-integration-plan.md
-- (P7): the storage layer for the research framework's custom-PDF
-- ingestion pipeline (docs/content-spec/integrated-self-improving-
-- learning-system.md §15.6) — see src/content/custom-source/types.ts for
-- the full contract and what this pass deliberately does NOT implement
-- (extraction/OCR itself needs a provider decision not made here).
--
-- Three tables, empty until a future upload flow calls into
-- src/content/custom-source/repo.ts's CustomSourceRepo:
--
--   custom_source_documents — one row per uploaded/registered file,
--     keyed by content hash so re-registering the same file resolves to
--     the same document rather than creating a duplicate.
--   source_spans — extracted text segments with page/section locators,
--     produced by a (not-yet-built) CustomSourceExtractor.
--   source_claim_drafts — a claim drawn from one span, pending operator
--     review before it may become a real `custom_source` delta
--     (src/content/delta-kinds.ts). `locator` mirrors
--     src/content/source-locator.ts's SourceLocator shape as JSONB rather
--     than duplicating its fields as columns — the TypeScript type is the
--     source of truth; this stays a flexible bag other locator variants
--     can reuse without another migration.
--
-- All idempotent (IF NOT EXISTS). Auto-applied by src/db/auto-migrate.ts.

CREATE TABLE IF NOT EXISTS custom_source_documents (
  id                    TEXT PRIMARY KEY,
  uploader_id           TEXT NOT NULL,
  title                 TEXT NOT NULL,
  file_hash             TEXT NOT NULL UNIQUE,
  mime_type             TEXT NOT NULL,
  page_count            INTEGER,
  permission_confirmed  BOOLEAN NOT NULL DEFAULT FALSE,
  extraction_quality    NUMERIC,
  uploaded_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status                TEXT NOT NULL DEFAULT 'registered'
);

DO $$ BEGIN
  ALTER TABLE custom_source_documents
    ADD CONSTRAINT custom_source_documents_status_check
      CHECK (status IN ('registered', 'extracted', 'quarantined', 'rejected'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS source_spans (
  id                    TEXT PRIMARY KEY,
  source_document_id    TEXT NOT NULL REFERENCES custom_source_documents(id),
  page_number           INTEGER,
  section_heading       TEXT,
  extracted_text        TEXT NOT NULL,
  extraction_method     TEXT NOT NULL,
  extraction_quality    NUMERIC NOT NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$ BEGIN
  ALTER TABLE source_spans
    ADD CONSTRAINT source_spans_extraction_method_check
      CHECK (extraction_method IN ('text_layer', 'ocr'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS source_spans_document_idx
  ON source_spans (source_document_id);

CREATE TABLE IF NOT EXISTS source_claim_drafts (
  id                    TEXT PRIMARY KEY,
  source_span_id        TEXT NOT NULL REFERENCES source_spans(id),
  concept_id            TEXT NOT NULL,
  claim_text            TEXT NOT NULL,
  delta_kind            TEXT NOT NULL,
  locator               JSONB NOT NULL DEFAULT '{}',
  review_status         TEXT NOT NULL DEFAULT 'pending',
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at           TIMESTAMPTZ,
  reviewer_id           TEXT,
  review_note           TEXT
);

DO $$ BEGIN
  ALTER TABLE source_claim_drafts
    ADD CONSTRAINT source_claim_drafts_review_status_check
      CHECK (review_status IN ('pending', 'approved', 'rejected', 'quarantined'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Mirrors migration 056's delta_kind CHECK exactly — kept as two separate
-- constraints (not a shared domain type) because Postgres domains can't be
-- ADD CONSTRAINT IF NOT EXISTS-guarded the same forgiving way a table
-- column check can; two guarded CHECKs is the lower-risk choice here.
DO $$ BEGIN
  ALTER TABLE source_claim_drafts
    ADD CONSTRAINT source_claim_drafts_delta_kind_check
      CHECK (delta_kind IN (
        'prerequisite_repair', 'representation_shift', 'definition_boundary',
        'execution_drill', 'assessment_mode', 'time_and_risk',
        'custom_source', 'verified_computation', 'language_accessibility',
        'confidence_calibration', 'general_remediation'
      ));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS source_claim_drafts_concept_idx
  ON source_claim_drafts (concept_id);
CREATE INDEX IF NOT EXISTS source_claim_drafts_status_idx
  ON source_claim_drafts (review_status);
