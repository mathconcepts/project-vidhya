-- 031_attempt_error_tags.sql
--
-- Per-tag error log feeding StudentModel.errorProfile() and the
-- mock-to-marks Extraction report. One row per (attempt × tag) so
-- a single attempt with `['sign', 'unit']` tags produces two rows.
--
-- Composite key includes ts_ms to allow re-tagging without clobbering
-- when the rubric grader resolves a teacher-queue review.

CREATE TABLE IF NOT EXISTS attempt_error_tags (
  student_id   TEXT NOT NULL,
  object_id    TEXT NOT NULL,
  ts_ms        BIGINT NOT NULL,
  error_tag    TEXT NOT NULL
                 CHECK (error_tag IN ('sign','unit','misread','transcription','method','careless')),
  recorded_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (student_id, object_id, ts_ms, error_tag)
);

CREATE INDEX IF NOT EXISTS idx_attempt_error_tags_student_recorded
  ON attempt_error_tags (student_id, recorded_at DESC);
