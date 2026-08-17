-- 042_durable_content_stores.sql
--
-- Durable backing for two more flat-file stores that Render's free tier wipes
-- when the service sleeps. Same problem 041 fixed for user accounts, same
-- shape of fix.
--
--   src/feedback/store.ts          .data/feedback.json
--   src/syllabus-bridge/store.ts   .data/syllabus-bridge-content.json
--
-- Both matter for reasons a demo reviewer asks about directly. Student
-- feedback that vanishes overnight means "we act on your feedback" is not
-- true past a sleep cycle. Generated bridge content that vanishes means every
-- restart re-incurs the model spend that produced it.
--
-- ── The record column, again ────────────────────────────────────────────
--
-- As in 041, the domain object is stored as one JSONB value with only the
-- queried fields promoted beside it. FeedbackItem nests target, submitted_by,
-- suggestion and evidence; a field-per-column mapping drops one of them
-- silently the first time the type grows. The promoted columns are exactly
-- what listFeedback() filters on today.
--
-- Batch records are deliberately NOT persisted. They are transient job state,
-- rewritten on every unit, and a lost in-flight batch is re-runnable — unlike
-- the content it produced, which costs money to recreate.

CREATE TABLE IF NOT EXISTS feedback_items (
  id           TEXT PRIMARY KEY,
  exam_id      TEXT,
  kind         TEXT,
  status       TEXT,
  priority     TEXT,
  submitted_by TEXT,
  record       JSONB NOT NULL,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_feedback_items_exam   ON feedback_items (exam_id);
CREATE INDEX IF NOT EXISTS idx_feedback_items_status ON feedback_items (status);

CREATE TABLE IF NOT EXISTS feedback_applied_changes (
  id         TEXT PRIMARY KEY,
  exam_id    TEXT,
  record     JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_feedback_applied_exam ON feedback_applied_changes (exam_id);

CREATE TABLE IF NOT EXISTS bridge_generated_content (
  content_id TEXT PRIMARY KEY,
  mapping_id TEXT,
  unit_id    TEXT,
  -- 'mock' rows are kept: they record that a unit was attempted and failed,
  -- which is what makes it retryable. The route refuses to serve them.
  source     TEXT,
  record     JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bridge_content_mapping ON bridge_generated_content (mapping_id);
CREATE INDEX IF NOT EXISTS idx_bridge_content_unit    ON bridge_generated_content (unit_id);
