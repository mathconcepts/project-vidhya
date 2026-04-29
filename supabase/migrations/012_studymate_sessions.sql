-- Studymate Sessions — adaptive 15-min study session engine
-- Migration 012: studymate_sessions, studymate_session_problems, thinking_gap_cache

-- ============================================================================
-- STUDYMATE_SESSIONS — one row per 15-min session
-- ============================================================================
CREATE TABLE IF NOT EXISTS studymate_sessions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID,                    -- null for anonymous
  session_id     TEXT NOT NULL,           -- anonymous localStorage key
  exam_id        TEXT NOT NULL,           -- e.g. 'gate-ma'
  session_type   TEXT NOT NULL DEFAULT 'daily'
                 CHECK (session_type IN ('daily', 'targeted', 'review')),
  state          TEXT NOT NULL DEFAULT 'IDLE'
                 CHECK (state IN (
                   'IDLE','LOADING','READY','IN_PROGRESS',
                   'PROBLEM_ANSWERED','THINKING_GAP_SHOWN',
                   'SESSION_COMPLETE','STAT_SHOWN'
                 )),
  problem_count  SMALLINT NOT NULL DEFAULT 5,
  current_index  SMALLINT NOT NULL DEFAULT 0,
  session_stat   TEXT,                    -- deterministic end-of-session line
  started_at     TIMESTAMPTZ,
  completed_at   TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_studymate_resume
  ON studymate_sessions(session_id, state, updated_at)
  WHERE state NOT IN ('SESSION_COMPLETE','STAT_SHOWN','IDLE');

CREATE INDEX IF NOT EXISTS idx_studymate_user
  ON studymate_sessions(user_id, updated_at)
  WHERE user_id IS NOT NULL;

-- ============================================================================
-- STUDYMATE_SESSION_PROBLEMS — one row per problem attempt in a session
-- ============================================================================
CREATE TABLE IF NOT EXISTS studymate_session_problems (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studymate_id     UUID NOT NULL REFERENCES studymate_sessions(id) ON DELETE CASCADE,
  problem_id       UUID NOT NULL REFERENCES pyq_questions(id),
  concept_id       TEXT NOT NULL,
  position         SMALLINT NOT NULL,     -- 0-indexed position in session
  user_answer      TEXT,
  was_correct      BOOLEAN,
  gap_text         TEXT,                  -- thinking-gap explanation
  answered_at      TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_session_problems_session
  ON studymate_session_problems(studymate_id, position);

-- ============================================================================
-- THINKING_GAP_CACHE — scalar-keyed cache (no embeddings)
-- ============================================================================
CREATE TABLE IF NOT EXISTS thinking_gap_cache (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  concept_id          TEXT NOT NULL,
  error_type          TEXT NOT NULL,      -- e.g. 'sign_error', 'wrong_formula'
  misconception_hash  TEXT NOT NULL,      -- hash of top-3 misconceptions
  gap_text            TEXT NOT NULL,
  hit_count           INT NOT NULL DEFAULT 0,
  generated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_thinking_gap UNIQUE (concept_id, error_type, misconception_hash)
);

CREATE INDEX IF NOT EXISTS idx_thinking_gap_lookup
  ON thinking_gap_cache(concept_id, error_type, misconception_hash);
