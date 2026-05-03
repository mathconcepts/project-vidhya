-- 027_content_blueprints.sql
--
-- Introduces the Content Blueprint primitive: a human-editable spec that
-- lives between RunLauncher and the curriculum-unit-orchestrator.
--
-- Locked invariant: decisions JSONB shape is `version: 1`. Future shape
-- changes ship as a parallel column `decisions_v2 JSONB` — never mutate
-- v1 in place.
--
-- Surveillance discipline: the decisions JSONB describes CONTENT CHOICES
-- (atom_kinds, sequencing, constraints), not student behaviour. No
-- user_id, no session_id, no behavioural fields. CI invariant 8
-- enforces this against the migration text.

CREATE TABLE IF NOT EXISTS content_blueprints (
  id                 TEXT PRIMARY KEY,
  exam_pack_id       TEXT NOT NULL,
  concept_id         TEXT NOT NULL,
  template_version   TEXT,
  arbitrator_version TEXT,
  decisions          JSONB NOT NULL,
  confidence         NUMERIC NOT NULL DEFAULT 0.6,
  requires_review    BOOLEAN NOT NULL DEFAULT FALSE,
  created_by         TEXT NOT NULL CHECK (created_by IN ('template', 'arbitrator', 'operator')),
  approved_at        TIMESTAMPTZ,
  approved_by        TEXT,
  superseded_by      TEXT REFERENCES content_blueprints(id),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_blueprints_concept
  ON content_blueprints(exam_pack_id, concept_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_blueprints_review
  ON content_blueprints(requires_review)
  WHERE requires_review = TRUE AND approved_at IS NULL;

-- Connect generation_runs back to the blueprint they were built from.
-- Nullable: legacy runs (and any run that opts out) have NULL.
ALTER TABLE generation_runs
  ADD COLUMN IF NOT EXISTS blueprint_id TEXT REFERENCES content_blueprints(id);
CREATE INDEX IF NOT EXISTS idx_runs_blueprint
  ON generation_runs(blueprint_id) WHERE blueprint_id IS NOT NULL;
