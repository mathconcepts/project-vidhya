-- 017_prompt_pattern_stats.sql — Self-improving prompts (PENDING.md §4.13).
--
-- Aggregates A/B experiment outcomes by prompt pattern so admin can see
-- which (topic_family, atom_type, scaffold, flags) combos consistently
-- produce winners. Surfaces patterns ripe for promotion to the YAML
-- template DSL — admin reviews, never auto-promoted (per the PENDING
-- safety rail "needs human review before promotion").
--
-- pattern_key shape: "{topic_family}.{atom_type}.{scaffold}.{flags}"
--   e.g. "calculus.intuition.zoom-to-tangent.consensus=false.pyq=true"
--
-- The score column is a derived rank: promoted_count - reverted_count.
-- Ties + insufficient_data are tracked but don't move the score; they
-- represent "no clear winner" and aren't evidence either way.
--
-- Updated by ab-tester.evaluateRipeExperiments() per verdict.

CREATE TABLE IF NOT EXISTS prompt_pattern_stats (
  pattern_key       TEXT PRIMARY KEY,
  topic_family      TEXT NOT NULL,
  atom_type         TEXT NOT NULL,
  scaffold          TEXT NOT NULL,
  flags             JSONB NOT NULL DEFAULT '{}',
  promoted_count    INTEGER NOT NULL DEFAULT 0,
  reverted_count    INTEGER NOT NULL DEFAULT 0,
  tie_count         INTEGER NOT NULL DEFAULT 0,
  insufficient_count INTEGER NOT NULL DEFAULT 0,
  first_seen_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_promoted_at  TIMESTAMPTZ,
  last_reverted_at  TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS prompt_pattern_stats_score_idx
  ON prompt_pattern_stats ((promoted_count - reverted_count) DESC);

CREATE INDEX IF NOT EXISTS prompt_pattern_stats_topic_atom_idx
  ON prompt_pattern_stats (topic_family, atom_type);
