-- 056_delta_kind.sql
--
-- docs/designs/2026-09-02-content-strategy-research-integration-plan.md (P2):
-- student_atom_overrides.trigger_reason has always been free text -- nothing
-- in the codebase tags WHY a personalization write happened in a way another
-- query can group by. Adds a closed, nullable delta_kind column: the 10
-- research-named delta types (prerequisite_repair, representation_shift,
-- definition_boundary, execution_drill, assessment_mode, time_and_risk,
-- custom_source, verified_computation, language_accessibility,
-- confidence_calibration) plus one honest 11th, general_remediation, for the
-- one trigger path that exists today (3-failures-in-7-days -> whole-atom
-- regen grounded in error text). That path doesn't cleanly match any single
-- research kind; general_remediation says so rather than fabricating
-- precision the system doesn't have. src/content/delta-kinds.ts is the
-- TypeScript mirror -- keep the two in lockstep the way ErrorTag and its
-- CHECK constraint already are (migration 053).
--
-- Nullable and additive: existing rows (and any write path not yet updated)
-- stay valid with delta_kind = NULL. No backfill -- past trigger_reason text
-- is not reliably reclassifiable without guessing.
--
-- Guarded per the v4.36 CREATE-POLICY postmortem / migration 053 precedent:
-- ADD CONSTRAINT has no IF NOT EXISTS form in Postgres.

ALTER TABLE student_atom_overrides
  ADD COLUMN IF NOT EXISTS delta_kind TEXT;

DO $$ BEGIN
  ALTER TABLE student_atom_overrides
    ADD CONSTRAINT student_atom_overrides_delta_kind_check
      CHECK (delta_kind IS NULL OR delta_kind IN (
        'prerequisite_repair', 'representation_shift', 'definition_boundary',
        'execution_drill', 'assessment_mode', 'time_and_risk',
        'custom_source', 'verified_computation', 'language_accessibility',
        'confidence_calibration', 'general_remediation'
      ));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

COMMENT ON COLUMN student_atom_overrides.delta_kind IS
  'Closed taxonomy (src/content/delta-kinds.ts DeltaKind) tagging why this personalized variant was generated. NULL on rows written before this column existed. See docs/designs/2026-09-02-content-strategy-research-integration-plan.md.';
