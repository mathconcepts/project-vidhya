-- =============================================================================
-- 047_mock_exams.sql
-- =============================================================================
-- T22 (ENG-D3): `mock_exams` was created by RUNTIME SQL inside
-- `generateMockExam()` (src/gbrain/operations/moat-operations.ts), bypassing
-- the schema-column deny-by-default gate entirely. Gives it a real,
-- reviewed, idempotent migration instead.
--
-- `questions` stores the FULL exam payload INCLUDING each question's answer
-- key (options/correct answer/answer index) — this is a SERVER-ONLY column.
-- `GET /api/gbrain/mock-exam/:sessionId` never serializes it to the client;
-- it reads the row back, strips the key, and serves a render-safe view
-- (mirrors GET /api/practice/item/:id's leak discipline — see
-- src/api/mock-exam-routes.ts). `status` gates idempotent submission the
-- same way migration 046's quiz_sessions does: only the FIRST submit call
-- that flips `in_progress` → `submitted` grades; every later call for the
-- same exam id replays the persisted `analysis` instead of re-grading.
--
-- Idempotent. Additive. No data migration (any pre-existing ad-hoc table
-- from the old runtime CREATE TABLE has the same core columns and is left
-- alone — IF NOT EXISTS is a no-op against it, and the new `status` column
-- backfills NULL-safe via its DEFAULT).
-- =============================================================================

CREATE TABLE IF NOT EXISTS mock_exams (
  id                  TEXT PRIMARY KEY,
  session_id          TEXT NOT NULL,
  exam_key            TEXT NOT NULL,
  questions           JSONB NOT NULL,
  time_limit_minutes  INT NOT NULL,
  status              TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'submitted')),
  late                BOOLEAN NOT NULL DEFAULT FALSE,
  score               NUMERIC,
  max_marks           NUMERIC,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  submitted_at        TIMESTAMPTZ,
  graded_at           TIMESTAMPTZ,
  analysis            JSONB
);

CREATE INDEX IF NOT EXISTS idx_mock_exams_session ON mock_exams(session_id, created_at);

-- The pre-existing ad-hoc table (created by the old runtime CREATE TABLE)
-- may be missing the columns this migration adds if it was created before
-- this PR — defensive ADD COLUMN IF NOT EXISTS covers that deploy history.
ALTER TABLE mock_exams ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'in_progress';
ALTER TABLE mock_exams ADD COLUMN IF NOT EXISTS late BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE mock_exams ADD COLUMN IF NOT EXISTS score NUMERIC;
ALTER TABLE mock_exams ADD COLUMN IF NOT EXISTS max_marks NUMERIC;
ALTER TABLE mock_exams ADD COLUMN IF NOT EXISTS graded_at TIMESTAMPTZ;

-- The ALTER path above adds `status` WITHOUT the CHECK constraint the
-- CREATE TABLE branch declares inline — a pre-existing ad-hoc table would
-- otherwise end up constrained differently depending on which path created
-- it. Idempotent (matches the repo's DO-block convention elsewhere).
DO $$ BEGIN
  ALTER TABLE mock_exams ADD CONSTRAINT mock_exams_status_check CHECK (status IN ('in_progress', 'submitted'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =============================================================================
-- End of 047_mock_exams.sql
-- =============================================================================
