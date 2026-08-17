-- 043_durable_records.sql
--
-- Durable backing for the flat-file stores that hold irreplaceable data.
--
-- An audit of every `createFlatFileStore` call site found 30 across 28 files.
-- Migrations 041 and 042 covered three. Of the rest, roughly seventeen hold
-- something a person made and nothing can recompute — and Render's free tier
-- wipes `.data` whenever the service sleeps.
--
-- The two that matter most:
--
--   notebook-store        its own docblock calls it "THE student's record —
--                         everything they've thought about, asked about, or
--                         practiced". Kept at .data/notebooks/{user_id}.json.
--
--   retention-scheduler   the live SM-2 review schedules. after-each-attempt.ts
--                         writes here, so spaced repetition — the mechanism the
--                         whole retention claim rests on — restarted from zero
--                         on every sleep. The durable `fsrs_cards` table from
--                         029 is a DIFFERENT path that the live attempt flow
--                         does not write.
--
-- ── Why one table rather than seventeen ─────────────────────────────────
--
-- Every one of these collections is read the same way: load all records for a
-- scope, operate in memory, write back. None of them queries across records
-- in SQL, because until now none of them was in SQL. Seventeen bespoke tables
-- would be seventeen migrations encoding shapes nobody queries, and each new
-- store would need another.
--
-- So: one table, a `collection` discriminator, and the domain object in a
-- `record` column — the same reasoning as 041 and 042, where a
-- field-per-column mapping across nested optional shapes drops a field
-- silently the first time a type grows.
--
-- `scope` is the per-owner key where a collection has one: a user_id for the
-- notebook, a student_id for retention and trajectory. It is what lets the
-- notebook append one row per entry instead of rewriting a student's entire
-- history on every chat message.
--
-- If a collection ever earns real SQL queries, it graduates to its own table.
-- This is the shape for data whose access pattern is "give me all of it".

CREATE TABLE IF NOT EXISTS durable_records (
  collection  TEXT NOT NULL,
  id          TEXT NOT NULL,
  scope       TEXT,
  record      JSONB NOT NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (collection, id)
);

-- The two access patterns: everything in a collection, and everything for one
-- owner within it.
CREATE INDEX IF NOT EXISTS idx_durable_records_collection
  ON durable_records (collection);

CREATE INDEX IF NOT EXISTS idx_durable_records_scope
  ON durable_records (collection, scope) WHERE scope IS NOT NULL;
