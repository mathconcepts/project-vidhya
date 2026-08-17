-- 041_auth_user_records.sql
--
-- Durable backing for src/auth/user-store.ts.
--
-- The store is flat-file only — .data/users.json — with no Postgres path at
-- all. Render's free tier wipes .data when the service sleeps, so accounts
-- created through the web, Telegram, WhatsApp and operator surfaces did not
-- survive the night. The store's own docblock anticipated needing this
-- ("swap this module for a Postgres-backed implementation"), and the id
-- generator already carries a comment about JWTs surviving "a Render
-- free-tier restart which wipes the file" — the symptom was known; the data
-- loss underneath it was not addressed.
--
-- ── Why the whole User is a JSONB record ────────────────────────────────
--
-- User has twelve-plus fields including four arrays (teacher_of,
-- guardian_of, guardians, channels) and several optionals, and both
-- auth/types.ts and auth/user-store.ts carry @ts-nocheck — so a
-- field-per-column mapping gets no compiler help and one forgotten column
-- silently drops a parent's guardian list. The record round-trips verbatim
-- instead. The columns beside it are exactly the three lookups the code
-- performs (by google_sub, by email, by channel) plus the owner flag,
-- promoted so they can be indexed rather than scanned.
--
-- One row per user, not one blob for the store, so two concurrent writers
-- touching different users cannot clobber each other.

CREATE TABLE IF NOT EXISTS auth_user_records (
  id          TEXT PRIMARY KEY,
  org_id      TEXT NOT NULL DEFAULT 'default',
  google_sub  TEXT,
  email       TEXT,
  -- Replaces the file's store-level owner_id. Exactly one row may be true;
  -- the partial unique index below enforces it.
  is_owner    BOOLEAN NOT NULL DEFAULT FALSE,
  record      JSONB NOT NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_auth_user_google_sub
  ON auth_user_records (google_sub) WHERE google_sub IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_auth_user_email
  ON auth_user_records (LOWER(email)) WHERE email IS NOT NULL;

-- At most one owner. A second owner is a bug worth failing the write over,
-- not something to reconcile later.
CREATE UNIQUE INDEX IF NOT EXISTS idx_auth_user_single_owner
  ON auth_user_records (org_id) WHERE is_owner;
