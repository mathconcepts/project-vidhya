-- =============================================================================
-- 046_xp_quiz.sql
-- =============================================================================
-- T14 (Milestone B — B5): personal XP ledger + checkpoint quiz sessions.
--
-- xp_events — append-only ledger, one row per graded (non-skipped) attempt
-- (practice or quiz). `xp_amount` mirrors the signed marks ratio actually
-- earned (src/scoring/xp.ts's xpForAttempt) — it CAN be negative (a wrong
-- MCQ under GATE negative marking) or zero (wrong MSQ/NAT, which GATE never
-- penalizes). Negative/zero rows are kept for an honest audit trail but are
-- NEVER surfaced to the student individually and NEVER summed into any
-- cohort/peer view — there is no such view; surveillance invariant 10
-- (src/personalization/__tests__/surveillance-invariants.test.ts) extends
-- to every xp_* field. The visible running total floors at 0 at READ time
-- (src/gbrain/xp-store.ts), not here — the ledger itself stays truthful.
--
-- Idempotency mirrors attempt_dedup (migration 030): UNIQUE (student_id,
-- object_id, ts_ms) so a retried attempt can't double-award XP even if the
-- caller doesn't know whether StudentModel.update() deduped it.
--
-- quiz_sessions — one row per STARTED checkpoint quiz (never per mere
-- offer — a rendered-but-unattempted quiz is not tracked, by the same
-- surveillance-discipline choice as the rest of this table: no serve log).
-- `item_ids` is the ordered, pre-selected item list — pool-protection
-- (no-repeat window, within-quiz dedup, 2× depth gate) happens ONCE at
-- start time in application code (src/readiness/quiz-pool.ts); the row
-- itself is just the resulting commitment. `status` gates idempotent
-- submission: `POST .../submit` only grades on the FIRST call that flips
-- 'in_progress' → 'submitted' (optimistic `WHERE status = 'in_progress'`,
-- same pattern as PgTeacherQueueRepo's resolve()); every later call for the
-- same id returns the already-persisted `result` instead of re-grading.
-- `late` records whether the submit landed after `deadline_at` — graded
-- either way, no bonus either way (there was never a bonus for on-time).
--
-- Idempotent. Additive. No data migration.
-- =============================================================================

CREATE TABLE IF NOT EXISTS xp_events (
  id           BIGSERIAL PRIMARY KEY,
  student_id   TEXT NOT NULL,
  object_id    TEXT NOT NULL,
  skill_id     TEXT,
  xp_amount    NUMERIC NOT NULL,
  source       TEXT NOT NULL CHECK (source IN ('practice', 'quiz')),
  ts_ms        BIGINT NOT NULL,
  awarded_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (student_id, object_id, ts_ms)
);

CREATE INDEX IF NOT EXISTS idx_xp_events_student_awarded ON xp_events(student_id, awarded_at);

CREATE TABLE IF NOT EXISTS quiz_sessions (
  id            TEXT PRIMARY KEY,
  student_id    TEXT NOT NULL,
  item_ids      TEXT[] NOT NULL,
  status        TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'submitted')),
  started_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  deadline_at   TIMESTAMPTZ NOT NULL,
  submitted_at  TIMESTAMPTZ,
  graded_at     TIMESTAMPTZ,
  late          BOOLEAN NOT NULL DEFAULT FALSE,
  score         NUMERIC,
  max_marks     NUMERIC,
  result        JSONB
);

CREATE INDEX IF NOT EXISTS idx_quiz_sessions_student ON quiz_sessions(student_id, started_at);

-- =============================================================================
-- End of 046_xp_quiz.sql
-- =============================================================================
