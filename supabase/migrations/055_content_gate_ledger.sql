-- =============================================================================
-- 055_content_gate_ledger.sql
-- =============================================================================
-- Plan W1.3 (docs/designs/2026-08-27-content-readiness-market-research-integration.md):
-- the quality-gate ledger. One row = one named gate's verdict on one
-- generated item.
--
-- Five gates, and they are a CLOSED set (CHECK-enforced below):
--
--   scope                  — is this item inside the syllabus scope it
--                            claims? (concept_id resolves in the concept
--                            graph, topic is set)
--   mathematics            — is the ANSWER KEY right? NEVER auto-passed.
--                            See the note below; this is the whole reason
--                            the table exists.
--   assessment_contract    — does the item carry a marking shape the
--                            contract can actually grade (question_type +
--                            marks + the answer field that kind needs)?
--   misconception_coverage — does every mcq distractor name the failure
--                            hypothesis it embodies (W3.4/E2)?
--   provenance             — does the item carry the run that produced it,
--                            and a structured evidence label (W1.2/E10)?
--
-- ── Why `mathematics` starts 'pending' and only an operator moves it ──────
--
-- The plan's `automatic_release_forbidden_for` rule: answer keys, marking
-- rules and canonical definitions always require operator approval. Every
-- OTHER gate here is a mechanical property of the row and is written by
-- the batch pipeline at processing time. `mathematics` is a claim about
-- whether a number is correct, and the verification cascade's agreement is
-- EVIDENCE for that claim, never the decision itself. So the automated
-- writer opens this gate as 'pending' with the cascade's evidence in
-- `reason`, and only src/api/admin-review-queue-routes.ts's decide handler
-- writes 'passed'/'failed' — stamping `decided_by` with the operator's id.
-- A row with status='passed' and decided_by IS NULL is, by construction,
-- impossible on this gate; anything that produced one would be a bug.
--
-- ── Scope (plan E8) ──────────────────────────────────────────────────────
--
-- This ledger applies ONLY to items carrying `generation_run_id`
-- provenance, and is enforced at PROMOTION (learnings-ledger's canonical
-- flip) and at DB-serving of provenance-carrying `generated_problems`
-- rows. It is NEVER consulted on the file-catalog read path: the 505
-- committed items in data/practice-items/ and the PYQ bank are covered by
-- the existing floor gates plus the hand-verification protocol, and the
-- DB-less demo has no ledger and no generated-item serving at all. An
-- item with `generation_run_id IS NULL` is untouched by everything here.
--
-- Numbering (plan E14): 050-054 are taken by this plan's earlier
-- migrations; 055 was verified free before this landed.
--
-- Idempotent. Additive. No data migration. Safe to re-run.
-- =============================================================================

CREATE TABLE IF NOT EXISTS content_gate_ledger (
  id                TEXT PRIMARY KEY,

  -- The run that produced the item. NOT NULL by design: a row without a
  -- run is an item this ledger has no jurisdiction over (E8), and storing
  -- one would quietly widen the scope the plan deliberately narrowed.
  generation_run_id TEXT NOT NULL,

  -- The item the verdict is about. NULLABLE on purpose: a gate can also be
  -- recorded at the RUN level (e.g. a scope verdict for the whole batch)
  -- before any individual item exists.
  item_id           TEXT,

  gate              TEXT NOT NULL
                    CHECK (gate IN ('scope','mathematics','assessment_contract',
                                    'misconception_coverage','provenance')),

  status            TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','passed','failed','waived')),

  -- Why. Free text, but every writer in the codebase fills it to the
  -- repo's refusal-precision standard (plan D8): name the thing, the
  -- actual, and the required.
  reason            TEXT,

  -- Operator id for the decisions only a human may make. NULL for every
  -- automated verdict — that NULL is the audit signal, not a gap.
  decided_by        TEXT,
  decided_at        TIMESTAMPTZ,

  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- One verdict per (run, item, gate). Re-recording the same gate for the
-- same item UPDATEs rather than appending a second, contradictory row —
-- the writers upsert on this key.
CREATE UNIQUE INDEX IF NOT EXISTS idx_content_gate_ledger_key
  ON content_gate_ledger(generation_run_id, COALESCE(item_id, ''), gate);

-- The enforcement read: "all five gates for these item ids". Also serves
-- the review queue's per-run listing.
CREATE INDEX IF NOT EXISTS idx_content_gate_ledger_run_item
  ON content_gate_ledger(generation_run_id, item_id);

-- The review queue's default read: pending mathematics gates, oldest first.
CREATE INDEX IF NOT EXISTS idx_content_gate_ledger_gate_status
  ON content_gate_ledger(gate, status, created_at);

COMMENT ON TABLE content_gate_ledger IS
  'W1.3 quality-gate ledger. One row per (generation_run_id, item_id, gate). Scoped to items with generation_run_id provenance only (plan E8) — never consulted for file-catalog or PYQ items.';
COMMENT ON COLUMN content_gate_ledger.decided_by IS
  'Operator id for gates a human must decide (mathematics). NULL on every automated verdict.';

-- =============================================================================
-- Baseline entries
-- =============================================================================
-- The ledger starts EMPTY of item rows, and that is the honest state: no
-- generation run has ever executed in this repo's environments (plan E16 —
-- no provider keys), so there is not one item anywhere carrying
-- `generation_run_id` provenance to have a verdict about. Seeding
-- placeholder verdicts would fabricate exactly the thing this table exists
-- to make unfabricable.
--
-- What IS seeded is the sentinel run below. It documents the two facts an
-- operator reading this table cold needs, in the table's own vocabulary,
-- and it is `item_id IS NULL` so it can never be mistaken for a verdict
-- about a real item or satisfy any item's five-gate check.
INSERT INTO content_gate_ledger (id, generation_run_id, item_id, gate, status, reason, decided_by, decided_at)
VALUES
  ('baseline-scope-note', '__baseline__', NULL, 'scope', 'waived',
   'Baseline sentinel, not a verdict. This ledger governs items carrying generation_run_id provenance only (plan E8); the 505 committed items in data/practice-items/ and the PYQ bank are out of scope and are covered by the floor gates (npm run ci:practice-items, ci:syllabus-floor, ci:la-walkthrough) plus the hand-verification protocol.',
   NULL, NULL),
  ('baseline-mathematics-note', '__baseline__', NULL, 'mathematics', 'pending',
   'Baseline sentinel, not a verdict. The mathematics gate is never auto-passed: the verification cascade writes its agreement into reason as evidence, and only an operator decision through /admin/review-queue sets passed/failed, stamping decided_by. See docs/ops/content-verification-runbook.md.',
   NULL, NULL)
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- End of 055_content_gate_ledger.sql
-- =============================================================================
