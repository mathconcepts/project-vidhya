-- 028_blueprint_rulesets.sql
--
-- Operator-defined rulesets that constrain the blueprint arbitrator.
-- Plain text. Scoped by (exam_pack_id, concept_pattern). The arbitrator
-- and template engine read applicable rulesets and thread their ids
-- into the blueprint's `constraints[]` array with source='ruleset'.
--
-- Surveillance: rulesets describe content choices, not student behaviour.
-- No user_id / session_id / behavioural columns. Invariant 8 enforces.

CREATE TABLE IF NOT EXISTS blueprint_rulesets (
  id              TEXT PRIMARY KEY,
  exam_pack_id    TEXT NOT NULL,
  -- LIKE pattern matched against concept_id; '%' for the whole exam pack.
  concept_pattern TEXT NOT NULL DEFAULT '%',
  rule_text       TEXT NOT NULL,
  enabled         BOOLEAN NOT NULL DEFAULT TRUE,
  created_by      TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rulesets_pack
  ON blueprint_rulesets(exam_pack_id, enabled);
