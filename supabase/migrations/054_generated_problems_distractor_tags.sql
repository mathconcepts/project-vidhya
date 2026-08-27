-- 054_generated_problems_distractor_tags.sql
--
-- W3.4/E2 (docs/designs/2026-08-27-content-readiness-market-research-integration.md):
-- an optional, nullable JSONB column so a `generated_problems` mcq row can
-- carry the same per-distractor failure-hypothesis map
-- src/gbrain/marking-derivation.ts's deriveMarking() now produces (POST-
-- shuffle option index -> ErrorTag). Mirrors the migration 032/033 pattern
-- exactly: NULLABLE, additive, no writer required to populate it — the
-- generation-side gate (`require_failure_tags`) is off by default (wave-1
-- runs enable it deliberately), so this column stays empty until then, and
-- `markingPayloadFromRow` in src/scoring/learning-object-catalog-pg.ts
-- threads it through only when present.
--
-- Server-only column: never selected into a render-safe view (see
-- practice-routes.ts's GET /api/practice/item/:id and its leak test) —
-- the one option WITHOUT a tag would otherwise reveal the answer.

ALTER TABLE generated_problems
  ADD COLUMN IF NOT EXISTS distractor_failure_tags JSONB;

COMMENT ON COLUMN generated_problems.distractor_failure_tags IS
  'mcq only: JSONB object, POST-shuffle option index (as a string key) -> ErrorTag. NULL = no failure hypotheses authored for this item. Server-only — never served pre-answer.';
