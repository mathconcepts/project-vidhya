-- 013_atom_engagements_cohort_signals.sql
-- ContentAtom v2 — engagement logging and nightly cohort aggregation.
--
-- atom_engagements: per-student per-atom engagement log.
-- Separate table (NOT JSONB on student_models) to avoid read-modify-write
-- lock contention at scale. UNIQUE (student_id, atom_id) gives us upsert
-- semantics for the engagement endpoint and indexes both lookup directions.
--
-- cohort_signals: nightly aggregated error rates per atom, used for the
-- "X% of students at your level miss this on the practice problem" callout.
-- Upserted on atom_id by src/jobs/cohort-aggregator.ts — safe to re-run.

CREATE TABLE IF NOT EXISTS atom_engagements (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id          uuid NOT NULL,
  atom_id             text NOT NULL,
  concept_id          text NOT NULL,
  count               integer NOT NULL DEFAULT 0,
  last_seen           timestamptz NOT NULL DEFAULT NOW(),
  last_recall_correct boolean,
  UNIQUE (student_id, atom_id)
);

CREATE INDEX IF NOT EXISTS atom_engagements_student_idx ON atom_engagements (student_id);
CREATE INDEX IF NOT EXISTS atom_engagements_atom_idx    ON atom_engagements (atom_id);

CREATE TABLE IF NOT EXISTS cohort_signals (
  atom_id     text PRIMARY KEY,
  error_pct   numeric(4,3) NOT NULL,
  n_seen      integer NOT NULL,
  computed_at timestamptz NOT NULL DEFAULT NOW()
);

ALTER TABLE atom_engagements ENABLE ROW LEVEL SECURITY;
ALTER TABLE cohort_signals    ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "atom_engagements_public_all" ON atom_engagements FOR ALL USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "cohort_signals_public_read" ON cohort_signals FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
