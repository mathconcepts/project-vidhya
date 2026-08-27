-- =============================================================================
-- 051_attempt_facts.sql
-- =============================================================================
-- Plan E1 (docs/designs/2026-08-27-content-readiness-market-research-integration.md):
-- the durable attempt ledger — the surface a graded attempt can be STAMPED
-- on, and the only cohort-aggregate input the W1.6 anti-gaming guards have.
--
-- ── Why a new table rather than reusing one of the three that nearly work ─
--
--   attempt_dedup (030)      — an idempotency key, explicitly prunable
--                              after ~30 days. Reading history off a table
--                              whose whole point is that it can be deleted
--                              is how a metric quietly starts lying.
--   xp_events (046)          — skips SKIPPED attempts by design (no XP is
--                              awarded for a skip) and stores no
--                              correctness, no question kind, no marks. A
--                              "students got faster and started skipping
--                              the hard ones" regression is invisible in
--                              it, which is precisely the regression
--                              W1.6's guards exist to catch.
--   mock_exams.analysis (047) — an aggregate blob per exam, not per
--                              question, and only for mock exams.
--
-- So: one append-only row per graded attempt, from every graded surface.
--
-- ── Idempotency ──────────────────────────────────────────────────────────
--
-- PRIMARY KEY (student_id, object_id, ts_ms) — the SAME key attempt_dedup
-- and xp_events already use, so a retried submit that dedups there dedups
-- here too, and a caller never has to know which of the three writes it
-- is racing. Writers INSERT ... ON CONFLICT DO NOTHING.
--
-- ── Types ────────────────────────────────────────────────────────────────
--
-- `student_id` is TEXT, NOT UUID, deliberately: attempt_dedup(030),
-- attempt_error_tags(031) and xp_events(046) all key on TEXT, and every
-- writer passes the same authenticated `user.userId` to all four. A UUID
-- column here would reject exactly the ids its three sibling tables
-- accept — and because the primary write happens INSIDE
-- StudentModel.update()'s transaction, that rejection would roll back the
-- Elo and FSRS writes for a demo/dev user whose id is not UUID-shaped.
-- One id type across the four attempt-keyed tables is worth more than a
-- stricter column on one of them.
--
-- ── Latency is BUCKETED, never raw (plan E1, surveillance posture) ───────
--
-- `latency_bucket` stores one of four coarse labels, not milliseconds.
-- The guards need to answer "did this cohort start answering faster while
-- getting more wrong?", which four buckets answer. Raw per-attempt
-- milliseconds would additionally answer "how long did THIS student
-- hesitate on THIS question on THIS evening", which nothing in the
-- product needs and which is a behavioural trace, not a measurement.
-- NULL means the latency was not observed (a quiz item graded from a
-- session-level submit carries no per-item timing) — recorded as unknown
-- rather than bucketed as fast, which would be a fabrication.
--
-- Idempotent. Additive. No data migration. Safe to re-run.
-- =============================================================================

CREATE TABLE IF NOT EXISTS attempt_facts (
  -- The attempt key, identical in shape and type to attempt_dedup(030).
  student_id       TEXT NOT NULL,
  object_id        TEXT NOT NULL,
  ts_ms            BIGINT NOT NULL,

  -- 'mcq' | 'msq' | 'nat' for a deterministically-marked item. NULL for an
  -- attempt graded by a path that has no such kind (the rubric grader's
  -- descriptive responses) — the mode-split guard simply skips those rows
  -- rather than inventing a kind for them.
  question_kind    TEXT,

  -- Signed marks actually earned, and the item's maximum. Signed because
  -- negative marking is real: a wrong 2-mark question earns -2/3, and
  -- clamping that to zero here would make the ledger disagree with the
  -- receipt the student was shown.
  marks_earned     NUMERIC,
  marks_max        NUMERIC,

  -- TRUE when the student submitted nothing for this item. The single most
  -- important column here: it is what xp_events cannot say, and "answers
  -- faster by skipping more" is a gaming mode the guards must be able to see.
  skipped          BOOLEAN NOT NULL DEFAULT FALSE,

  -- Which assessment contract's rules produced marks_earned. From the
  -- session's pinned snapshot where one exists (plan E7, migration 052),
  -- otherwise resolved live. '<exam>-<year>+compiled' means the marking
  -- came from the compiled constant because no row was read — a
  -- distinguishable, honest version, never dressed up as a DB contract.
  contract_version TEXT,

  -- See the bucketing note above. Constrained so a future writer cannot
  -- quietly start putting a millisecond count in a TEXT column.
  latency_bucket   TEXT
                     CHECK (latency_bucket IS NULL
                            OR latency_bucket IN ('lt10s', '10-30s', '30-90s', 'gt90s')),

  -- The concept the item exercises, when the writer knows it. Nullable:
  -- the mock path grades questions whose topic is coarser than a concept id.
  skill_id         TEXT,

  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),

  PRIMARY KEY (student_id, object_id, ts_ms)
);

-- The guards' access pattern: "every fact for this cohort of students in
-- this window". Cohort membership is resolved elsewhere (experiment
-- assignments → sessions → students); this index is what makes the
-- subsequent scan cheap.
CREATE INDEX IF NOT EXISTS idx_attempt_facts_student_created
  ON attempt_facts (student_id, created_at DESC);

-- The mode-split guard groups by question_kind inside a window.
CREATE INDEX IF NOT EXISTS idx_attempt_facts_created_kind
  ON attempt_facts (created_at DESC, question_kind);

-- =============================================================================
-- End of 051_attempt_facts.sql
-- =============================================================================
