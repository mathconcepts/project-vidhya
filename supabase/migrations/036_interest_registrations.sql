-- ============================================================
-- Interest registrations (U1-10 — demand-test pages).
--
-- Backs two lightweight fake-door / lead-capture pages:
--   kind = 'institute_batch'  — "Bring your batch" institute one-pager
--   kind = 'sell_course'      — ethical fake-door for a hypothetical
--                               "sell your course through Vidhya" feature
--
-- This is explicitly a demand TEST, not a live transactional feature —
-- no order/payment/course fields here on purpose. A row here means
-- "someone told us they're interested," nothing more.
-- ============================================================

CREATE TABLE IF NOT EXISTS interest_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kind TEXT NOT NULL CHECK (kind IN ('institute_batch', 'sell_course')),
  name TEXT NOT NULL,
  org_name TEXT,
  email TEXT NOT NULL,
  phone TEXT,
  message TEXT,
  source_page TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_interest_registrations_kind_created
  ON interest_registrations (kind, created_at DESC);
