-- =============================================================================
-- 050_assessment_contracts.sql
-- =============================================================================
-- Plan W1.1 (docs/designs/2026-08-27-content-readiness-market-research-integration.md):
-- the versioned assessment contract. One row = one paper of one exam in one
-- year, and how every question type in it is marked.
--
-- Why a table and not a constant: marking schemes are RE-NOTIFIED annually
-- by the exam authority, and an attempt graded last year must stay graded
-- under last year's rules. A compiled constant can only ever describe
-- "now"; a keyed row describes each year separately and lets an operator
-- correct a scheme without a deploy. The compiled constant
-- (src/exams/marking-constants.ts) does not go away — it is the DB-less
-- fallback and the generator of the seed row below.
--
-- Numbering: plan E14 reserves 050+ for this plan's migrations (two
-- `035_*` files already collide in this directory, so the next free number
-- is not simply "one past the highest"). 049 is the highest existing file;
-- 050 was verified free before this landed.
--
-- ── Shape (plan Premise 7) ───────────────────────────────────────────────
--
-- `marking` is per-question-type, and each type names a STRATEGY plus its
-- PARAMS:
--
--   {"mcq": {"strategy": "gate_2026", "params": {...}}, "msq": {...}, ...}
--
-- The split is the whole point. An exam whose marking is the same
-- arithmetic on different numbers (JEE Main: MCQ +4/-1) is a new ROW and
-- zero code. An exam whose marking needs arithmetic no registered strategy
-- can express (JEE Advanced's partial-marking matrix) is ONE new registered
-- strategy — never a fork of the scorer. That claim was tested on paper
-- against a real JEE Advanced scheme BEFORE this migration shipped; see
-- docs/designs/2026-08-27-assessment-contract-jee-advanced-check.md for the
-- worked exercise and its conclusion that this shape survives unchanged.
--
-- An unregistered `strategy` id is a REFUSAL at resolve time, not a silent
-- fallback to whatever the scorer happens to do — see
-- src/scoring/marking-strategy.ts.
--
-- ── Honesty note (plan D17) ──────────────────────────────────────────────
--
-- A contract row closes step 2 ("exam profile row") of
-- docs/add-an-exam-recipe.md's 10 steps, and nothing else. Steps 3-4
-- (capability check, launch bank through the full verification gauntlet)
-- are the expensive ones. "One contract row" prices the marking seam,
-- never the exam.
--
-- Idempotent. Additive. No data migration. Safe to re-run.
-- =============================================================================

CREATE TABLE IF NOT EXISTS assessment_contracts (
  -- Stable slug, `<exam>-<paper>-<year>`. Explicit rather than generated so
  -- an operator can name a row in a support conversation.
  id                  TEXT PRIMARY KEY,

  -- The (exam, paper, year) key. THREE columns, not one: marking is a
  -- property of a specific paper in a specific year, and collapsing any of
  -- the three into the slug would make "every contract for this exam" or
  -- "what changed between 2025 and 2026" unqueryable.
  exam                TEXT NOT NULL,
  paper               TEXT NOT NULL,
  year                INT  NOT NULL,

  -- Per-question-type {strategy, params}. See the shape note above.
  marking             JSONB NOT NULL,

  -- Where the numbers came from, and when a human last checked them
  -- against it. Both nullable: a row an operator is drafting has neither
  -- yet, and a NULL that says "unverified" is worth more than a fabricated
  -- URL that says the opposite.
  official_source_url TEXT,
  verified_at         TIMESTAMPTZ,

  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- The real key. `id` is the human-facing handle; this is what makes
-- "one contract per paper per year" an enforced fact rather than a
-- convention, and what the loader's lookup rides on.
CREATE UNIQUE INDEX IF NOT EXISTS idx_assessment_contracts_key
  ON assessment_contracts(exam, paper, year);

-- =============================================================================
-- Seed row — GENERATED FROM src/exams/marking-constants.ts
-- =============================================================================
-- Every value below is a transcription of COMPILED_ASSESSMENT_CONTRACT.
-- It is NOT independently authored, and it must never be edited by hand:
-- src/exams/__tests__/assessment-contract-seed.test.ts parses THIS FILE and
-- fails when any of it drifts from the compiled module. Changing a marking
-- number means changing the module and re-transcribing here in the same
-- commit — which is exactly the friction plan D7/E6 asks for, since these
-- two are the last two statements of the marking fact that still exist.
--
-- ON CONFLICT DO NOTHING, not an upsert: once a contract row is live,
-- attempts have been graded under it. A migration re-run must never
-- silently rewrite the rules those attempts were scored by. An operator
-- correcting a live contract does it deliberately, through the admin
-- surface, not as a side effect of a boot.
INSERT INTO assessment_contracts (id, exam, paper, year, marking, official_source_url, verified_at)
VALUES (
  'gate-common-em-2026',
  'gate',
  'common-em',
  2026,
  '{"mcq":{"strategy":"gate_2026","params":{"marks_wrong_by_marks":{"1":-0.3333333333333333,"2":-0.6666666666666666},"marks_wrong_fallback_divisor":3}},"msq":{"strategy":"gate_2026","params":{"marks_wrong":0,"partial_credit":false}},"nat":{"strategy":"gate_2026","params":{"marks_wrong":0,"tolerance_epsilon":1e-9}}}'::jsonb,
  'https://gate2026.iitg.ac.in',
  '2026-08-27'
)
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- End of 050_assessment_contracts.sql
-- =============================================================================
