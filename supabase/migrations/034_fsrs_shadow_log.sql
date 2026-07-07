-- 034_fsrs_shadow_log.sql
--
-- Wave 12 / A7 §4 step 1: shadow mode for the FSRS/SM-2 swap. Both live
-- SM-2 sites keep scheduling exactly as before; every review event also
-- logs what FSRS-6 WOULD have scheduled (per the signed-off A7 mapping)
-- so the swap decision is data, not vibes.
--
-- Exit criterion (read via GET /api/admin/fsrs-shadow):
--   median |delta_days| <= 1 over >= 200 events.
-- This table is diagnostic-only and freely truncatable.

CREATE TABLE IF NOT EXISTS fsrs_shadow_log (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  site        TEXT NOT NULL CHECK (site IN ('lessons', 'retention')),
  student_id  TEXT NOT NULL,
  item_key    TEXT NOT NULL,          -- concept_id at both current sites
  quality     INT  NOT NULL,          -- the SM-2 quality that drove the review
  rating      INT  NOT NULL CHECK (rating BETWEEN 1 AND 4),
  sm2_due     TIMESTAMPTZ NOT NULL,   -- what actually got scheduled
  fsrs_due    TIMESTAMPTZ NOT NULL,   -- what FSRS would have scheduled
  delta_days  FLOAT NOT NULL,         -- fsrs_due - sm2_due, in days
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fsrs_shadow_created ON fsrs_shadow_log (created_at DESC);
