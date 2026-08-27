-- =============================================================================
-- 052_session_contract_pin.sql
-- =============================================================================
-- Plan E7 (docs/designs/2026-08-27-content-readiness-market-research-integration.md):
-- pin the assessment contract at session creation, so grading never
-- resolve-at-submit.
--
-- ── The problem this closes ──────────────────────────────────────────────
--
-- `assessment_contracts` (migration 050) exists so a marking scheme can be
-- corrected without a deploy, and so an attempt scored last year stays
-- scored under last year's rules. Both of those become false the moment
-- grading RESOLVES the contract at submit time: a student starts a mock
-- exam or a checkpoint quiz under one scheme, an operator corrects the row
-- minutes later, and the paper they were halfway through grades under
-- rules that did not exist when they read the instructions.
--
-- So `mock_exams` and `quiz_sessions` each get a snapshot at CREATION:
--
--   contract_version TEXT   — the resolved contract's version string
--                             ('gate-2026', or 'gate-2026+compiled' when no
--                             row was read — see assessment-contract-loader.ts)
--   contract_params  JSONB  — the resolved `{marking: {...}}` blob, exactly
--                             what src/scoring/contract-grading.ts's
--                             `parseContractSnapshot` reads back at grade
--                             time.
--
-- Both nullable: every row created before this migration has neither, and
-- `makeContractGrader(null)` grades that row EXACTLY as before this plan —
-- the shared `GateDeterministicScorer` with no scheme override. A legacy
-- row is never re-resolved or backfilled; it just keeps grading the way it
-- always did.
--
-- Idempotent (`ADD COLUMN IF NOT EXISTS`). No data migration. Safe to
-- re-run.
-- =============================================================================

ALTER TABLE mock_exams
  ADD COLUMN IF NOT EXISTS contract_version TEXT,
  ADD COLUMN IF NOT EXISTS contract_params  JSONB;

ALTER TABLE quiz_sessions
  ADD COLUMN IF NOT EXISTS contract_version TEXT,
  ADD COLUMN IF NOT EXISTS contract_params  JSONB;

-- =============================================================================
-- End of 052_session_contract_pin.sql
-- =============================================================================
