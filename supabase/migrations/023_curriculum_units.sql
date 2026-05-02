-- =============================================================================
-- 023_curriculum_units.sql
-- =============================================================================
-- Phase 1 of Curriculum R&D — `curriculum_units` becomes the new generation
-- unit (single concept per unit, bundles 5–15 atoms in pedagogical sequence,
-- declares learning objectives, links to PYQs it prepares for).
--
-- Sibling migrations:
--   024_pyq_holdout.sql — adds the holdout flag + bidirectional unit↔pyq link
--   025_exam_packs.sql  — operator-defined exam packs alongside YAML packs
--
-- Idempotent. Additive. No data migration.
-- =============================================================================

CREATE TABLE IF NOT EXISTS curriculum_units (
  id                    TEXT PRIMARY KEY,
  exam_pack_id          TEXT NOT NULL,
  concept_id            TEXT NOT NULL,                       -- exactly ONE concept (eng-review D1)
  name                  TEXT NOT NULL,
  hypothesis            TEXT,                                -- why this unit exists, set by operator/generator
  learning_objectives   JSONB NOT NULL DEFAULT '[]',         -- [{id, statement, blooms_level}]
  prepared_for_pyq_ids  TEXT[] NOT NULL DEFAULT '{}',        -- bidirectional with pyq_questions.taught_by_unit_id
  atom_ids              TEXT[] NOT NULL DEFAULT '{}',        -- child atoms in pedagogical sequence (intuition → formal → practice)
  retrieval_schedule    JSONB NOT NULL DEFAULT '{"revisit_days": [3, 10, 30]}',
  pedagogy_score        NUMERIC,                             -- 0..1, set by Tier 4 PedagogyVerifier (PR #32)
  generation_run_id     TEXT,                                -- traces back to the GenerationRun that produced this
  canonical             BOOLEAN NOT NULL DEFAULT FALSE,      -- promoted by learnings-ledger when its lift wins
  canonical_at          TIMESTAMPTZ,
  canonical_reason      TEXT,
  status                TEXT NOT NULL DEFAULT 'queued'
                        CHECK (status IN ('queued','generating','ready','failed','archived')),
  error                 TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_curriculum_units_exam_status
  ON curriculum_units(exam_pack_id, status);
CREATE INDEX IF NOT EXISTS idx_curriculum_units_concept
  ON curriculum_units(concept_id);
CREATE INDEX IF NOT EXISTS idx_curriculum_units_canonical
  ON curriculum_units(canonical) WHERE canonical = TRUE;
CREATE INDEX IF NOT EXISTS idx_curriculum_units_run
  ON curriculum_units(generation_run_id);

-- updated_at auto-touch via trigger; idempotent function reuse.
CREATE OR REPLACE FUNCTION touch_updated_at() RETURNS trigger AS $body$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$body$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS curriculum_units_touch ON curriculum_units;
CREATE TRIGGER curriculum_units_touch
  BEFORE UPDATE ON curriculum_units
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- =============================================================================
-- End of 023_curriculum_units.sql
-- =============================================================================
