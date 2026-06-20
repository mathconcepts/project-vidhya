-- 029_blueprint_100x.sql
--
-- Schema for the 100x Blueprint foundation: Elo ratings, FSRS card state,
-- and the descriptive-grading teacher-review queue.
--
-- All three tables are idempotent (IF NOT EXISTS) and surveillance-clean:
-- nothing about student behaviour, demographics, or PII beyond the
-- session_id / student_id keys already in use across the codebase.
--
-- Refs:
--   blueprint §3.1  (Elo)
--   blueprint §3.4  (FSRS)
--   blueprint §3.5  (rubric grading + human queue)

-- ────────────────────────────────────────────────────────────────────
-- Elo ratings — per (student, skill) and per (object, skill).
-- ────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS student_skill_elo (
  student_id   TEXT NOT NULL,
  skill_id     TEXT NOT NULL,
  rating       DOUBLE PRECISION NOT NULL DEFAULT 1500,
  n            INTEGER NOT NULL DEFAULT 0,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (student_id, skill_id)
);

CREATE INDEX IF NOT EXISTS idx_student_skill_elo_skill ON student_skill_elo (skill_id);

CREATE TABLE IF NOT EXISTS item_difficulty_elo (
  object_id    TEXT NOT NULL,
  skill_id     TEXT NOT NULL,
  rating       DOUBLE PRECISION NOT NULL DEFAULT 1500,
  n            INTEGER NOT NULL DEFAULT 0,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (object_id, skill_id)
);

CREATE INDEX IF NOT EXISTS idx_item_difficulty_elo_skill ON item_difficulty_elo (skill_id);

-- ────────────────────────────────────────────────────────────────────
-- FSRS cards — per (student, object). Replaces SM-2 over time; the
-- SM-2 retention-scheduler stays online during the dual-write window
-- so callers can be migrated incrementally.
-- ────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS fsrs_cards (
  student_id     TEXT NOT NULL,
  object_id      TEXT NOT NULL,
  stability      DOUBLE PRECISION NOT NULL,
  difficulty     DOUBLE PRECISION NOT NULL,
  last_review_at TIMESTAMPTZ NOT NULL,
  due_at         TIMESTAMPTZ NOT NULL,
  reps           INTEGER NOT NULL DEFAULT 0,
  lapses         INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (student_id, object_id)
);

CREATE INDEX IF NOT EXISTS idx_fsrs_cards_due ON fsrs_cards (student_id, due_at);

-- ────────────────────────────────────────────────────────────────────
-- Teacher review queue for low-confidence descriptive grades.
-- Confirmed/corrected rows feed the calibration set.
-- ────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS grading_reviews (
  id                TEXT PRIMARY KEY,
  student_id        TEXT,                  -- nullable for anonymous attempts
  item_id           TEXT NOT NULL,
  student_response  TEXT NOT NULL,
  proposed_grade    JSONB NOT NULL,
  final_grade       JSONB,
  status            TEXT NOT NULL DEFAULT 'pending'
                       CHECK (status IN ('pending','confirmed','corrected','dismissed')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at       TIMESTAMPTZ,
  reviewer_id       TEXT,
  reviewer_notes    TEXT
);

CREATE INDEX IF NOT EXISTS idx_grading_reviews_status_created
  ON grading_reviews (status, created_at DESC);
