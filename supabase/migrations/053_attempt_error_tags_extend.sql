-- 053_attempt_error_tags_extend.sql
--
-- W3.4 (docs/designs/2026-08-27-content-readiness-market-research-integration.md,
-- amendments E4/D9): extends src/core/interfaces.ts's ErrorTag union from 6
-- to 13 members (additive: method_selection, representation, mode_msq,
-- mode_nat_entry, time_pressure, risk_decision, prerequisite). Migration
-- 031's CHECK constraint on attempt_error_tags.error_tag is inline and
-- unnamed, so Postgres auto-named it `attempt_error_tags_error_tag_check`
-- (verified against the live catalog naming rule, not guessed). Swap it for
-- one that accepts all 13 values.
--
-- Old rows are unaffected — every pre-existing tag value stays a member of
-- the new, wider set, so no data migration is needed.
--
-- Guarded per the v4.36 CREATE-POLICY postmortem (CLAUDE.md): an unguarded
-- statement that fails mid-file rolls the whole transactional migration
-- back, the `_migrations` row is never written, and the next boot retries
-- and fails identically, forever. DROP CONSTRAINT IF EXISTS is already
-- idempotent on its own. ADD CONSTRAINT has no IF NOT EXISTS form in
-- Postgres, so it's wrapped in the repo's DO $$ ... EXCEPTION idiom
-- (matching migration 003's CREATE POLICY guards) — a re-run after the
-- swap already happened once hits `duplicate_object` and no-ops instead
-- of boot-looping.

ALTER TABLE attempt_error_tags
  DROP CONSTRAINT IF EXISTS attempt_error_tags_error_tag_check;

DO $$ BEGIN
  ALTER TABLE attempt_error_tags
    ADD CONSTRAINT attempt_error_tags_error_tag_check
      CHECK (error_tag IN (
        'sign', 'unit', 'misread', 'transcription', 'method', 'careless',
        'method_selection', 'representation', 'mode_msq', 'mode_nat_entry',
        'time_pressure', 'risk_decision', 'prerequisite'
      ));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
