-- 014_concept_orchestrator.sql — Concept Generation Framework v1 (CEO plan 2026-05-01)
--
-- Three new tables backing the Concept Orchestrator:
--
--   1. atom_versions          — append-only history per atom_id with active flag.
--                                Stable atom_id + separate version table preserves
--                                atom_engagements continuity across regens (eng-review
--                                decision: stable atom_id over suffix-based ids).
--
--   2. student_atom_overrides — per-student personalized variants (E5).
--                                Triggered when error_log shows 3 failures in 7d.
--                                Cap enforced via the unique constraint below.
--
--   3. concept_cost_log       — per-concept LLM/Wolfram spend (E8) for the
--                                admin cost ceiling. month_start is YYYY-MM-01
--                                so we have one row per (concept, month).
--
-- All tables idempotent (IF NOT EXISTS). Auto-applied by src/db/auto-migrate.ts.

CREATE TABLE IF NOT EXISTS atom_versions (
  atom_id          TEXT NOT NULL,
  version_n        INTEGER NOT NULL,
  content          TEXT NOT NULL,
  generation_meta  JSONB NOT NULL DEFAULT '{}',
  generated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  active           BOOLEAN NOT NULL DEFAULT FALSE,
  improvement_reason TEXT,
  PRIMARY KEY (atom_id, version_n)
);

-- Only one active version per atom at any time.
CREATE UNIQUE INDEX IF NOT EXISTS atom_versions_active_uniq
  ON atom_versions (atom_id) WHERE active = TRUE;

CREATE INDEX IF NOT EXISTS atom_versions_generated_at_idx
  ON atom_versions (generated_at DESC);

CREATE TABLE IF NOT EXISTS student_atom_overrides (
  student_id       TEXT NOT NULL,
  atom_id          TEXT NOT NULL,
  override_content TEXT NOT NULL,
  generated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at       TIMESTAMPTZ NOT NULL,
  trigger_reason   TEXT,
  PRIMARY KEY (student_id, atom_id)
);

CREATE INDEX IF NOT EXISTS student_atom_overrides_expires_idx
  ON student_atom_overrides (expires_at);

CREATE TABLE IF NOT EXISTS concept_cost_log (
  concept_id    TEXT NOT NULL,
  month_start   DATE NOT NULL,
  llm_tokens    BIGINT NOT NULL DEFAULT 0,
  wolfram_calls INTEGER NOT NULL DEFAULT 0,
  usd_estimate  NUMERIC(10, 4) NOT NULL DEFAULT 0,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (concept_id, month_start)
);

CREATE INDEX IF NOT EXISTS concept_cost_log_month_idx
  ON concept_cost_log (month_start);
