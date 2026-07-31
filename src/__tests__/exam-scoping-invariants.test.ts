/**
 * EXAM-SCOPING INVARIANT TEST (U1-12)
 *
 * The Multi-Exam Expansion Design says every exam-facing entity must
 * "carry or be reachable via an exam_id (or equivalent scoping key)" so a
 * second exam pack (BITSAT, JEE, ...) can never silently see or pollute
 * another exam's data. This is ONE test file (not a rebuild) that checks
 * that invariant across the entity groups the design calls out:
 *
 *   1. items          — generated_problems, pyq_questions
 *   2. attempts        — attempt_dedup, attempt_error_tags, Elo/FSRS state
 *   3. registrations   — exam_profile_store (student's chosen exams)
 *   4. concept mappings — concept_graph <-> exam-catalog topic membership
 *
 * Style/location follows
 * src/personalization/__tests__/surveillance-invariants.test.ts: grep-based
 * structural checks against migrations + source, no live DB required, so
 * this runs in the same `npm test` pass as everything else.
 *
 * ── FINDING (U1-12, reported — not silently patched) ──────────────────────
 * `pyq_questions`, `exam_profile_store`, and `curriculum_units` all carry a
 * direct exam_id / exam_pack_id column or field. But the core interaction
 * tables — `generated_problems`, `attempt_dedup`, `attempt_error_tags`,
 * `student_skill_elo`, `item_difficulty_elo`, and `fsrs_cards` — do NOT.
 * They scope by `concept_id` / `object_id` / `skill_id` only.
 *
 * That's scoped correctly TODAY only because the concept graph is
 * exam-agnostic BY DESIGN — the same concept_id (e.g. 'chain-rule') can
 * legitimately serve GATE, JEE, and BITSAT (see
 * src/gbrain/cross-exam-coverage.ts's whole premise: "You've already
 * covered 60% of JEE Advanced concepts through your GATE-CS prep"), and
 * every exam declares its topic membership in exactly one place
 * (src/syllabus/exam-catalog.ts). That makes these tables *reachable* via
 * an exam_id (concept_id -> concept_graph.topic -> examIdsForTopic(topic)),
 * not *scoped* by one directly.
 *
 * This test locks that the reachability chain is real (not aspirational)
 * for every concept currently in the graph. It does NOT add a direct
 * exam_id column to those six tables — that would mean a migration +
 * backfill + touching every writer (student-model-pg.ts, the Elo/FSRS
 * persistence layers, the practice-attempt route), which is a real
 * multi-file change, not a "1-2 clearest call site" precision fix. Flagged
 * here as a genuine follow-up for the capability register, with two
 * concrete risk scenarios documented in the skipped test below.
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { EXAMS, examIdsForTopic } from '../syllabus/exam-catalog';
import { ALL_CONCEPTS } from '../constants/concept-graph';

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const MIGRATIONS_DIR = path.join(REPO_ROOT, 'supabase', 'migrations');

function readMigration(filename: string): string {
  const p = path.join(MIGRATIONS_DIR, filename);
  expect(fs.existsSync(p), `expected migration ${filename} to exist`).toBe(true);
  return fs.readFileSync(p, 'utf8');
}

/** Pulls the `CREATE TABLE IF NOT EXISTS <name> ( ... )` block for one table out of a migration file's text. */
function extractTableBlock(sql: string, tableName: string): string {
  const re = new RegExp(`CREATE TABLE IF NOT EXISTS ${tableName}\\s*\\(`, 'i');
  const m = re.exec(sql);
  expect(m, `expected a CREATE TABLE block for ${tableName}`).not.toBeNull();
  const start = m!.index + m![0].length;
  let depth = 1;
  let i = start;
  while (i < sql.length && depth > 0) {
    if (sql[i] === '(') depth++;
    else if (sql[i] === ')') depth--;
    i++;
  }
  return sql.slice(start, i);
}

// ─────────────────────────────────────────────────────────────────────────
// 1. Entities that DO carry a direct exam-scoping column — lock it so a
//    future edit can't quietly drop it.
// ─────────────────────────────────────────────────────────────────────────

describe('exam-scoping invariant: entities with a direct exam_id column', () => {
  it('pyq_questions (items) carries exam_id', () => {
    const sql = readMigration('001_rag_schema.sql');
    const block = extractTableBlock(sql, 'pyq_questions');
    expect(/\bexam_id\b/i.test(block)).toBe(true);
  });

  it('curriculum_units (concept mapping unit) carries exam_pack_id', () => {
    const sql = readMigration('023_curriculum_units.sql');
    const block = extractTableBlock(sql, 'curriculum_units');
    expect(/\bexam_pack_id\b/i.test(block)).toBe(true);
  });

  it('exam_profile_store (enrollment / registration) keys every entry by exam_id', () => {
    const file = path.join(REPO_ROOT, 'src', 'session-planner', 'exam-profile-store.ts');
    const src = fs.readFileSync(file, 'utf8');
    // ExamRegistration is the per-entry shape; exam_id must be required
    // (not optional) since an unscoped registration is meaningless.
    const interfaceMatch = /interface ExamRegistration \{([\s\S]*?)\n\}/.exec(src);
    expect(interfaceMatch, 'expected an ExamRegistration interface').not.toBeNull();
    expect(/\bexam_id: string;/.test(interfaceMatch![1])).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// 2. Entities that scope INDIRECTLY, via concept_id/topic reachability —
//    verify the reachability mechanism is real, not just asserted in a
//    comment.
// ─────────────────────────────────────────────────────────────────────────

describe('exam-scoping invariant: entities reachable via concept_id -> topic -> exam_id', () => {
  it('generated_problems (items) scopes by concept_id, which is reachable to an exam via its topic', () => {
    const sql = readMigration('011_gbrain_cognitive_architecture.sql');
    const block = extractTableBlock(sql, 'generated_problems');
    expect(/\bconcept_id\b/i.test(block)).toBe(true);
  });

  it.each([
    ['attempt_dedup', '030_attempt_dedup.sql', 'object_id'],
    ['attempt_error_tags', '031_attempt_error_tags.sql', 'object_id'],
    ['student_skill_elo', '029_blueprint_100x.sql', 'skill_id'],
    ['fsrs_cards', '029_blueprint_100x.sql', 'object_id'],
  ])('%s (attempt) carries a %s scoping key', (table, migrationFile, key) => {
    const sql = readMigration(migrationFile);
    const block = extractTableBlock(sql, table);
    expect(new RegExp(`\\b${key}\\b`, 'i').test(block)).toBe(true);
  });

  it('every concept in the graph has a topic that at least one cataloged exam claims', () => {
    // This is the load-bearing check: it proves concept_id -> topic ->
    // exam_id is a REAL chain today, for every concept currently in the
    // graph — not just possible in principle.
    const orphans = ALL_CONCEPTS
      .map(c => ({ concept_id: c.id, topic: c.topic, exams: examIdsForTopic(c.topic) }))
      .filter(x => x.exams.length === 0);

    expect(
      orphans,
      'Every concept_graph entry must have a topic that at least one exam-catalog ' +
        'entry lists, or generated_problems/attempts/Elo/FSRS rows using that concept ' +
        'are unreachable to any exam.\n' +
        orphans.map(o => `  ${o.concept_id} (topic: ${o.topic})`).join('\n'),
    ).toEqual([]);
  });

  it('examIdsForTopic resolves GATE topics to gate-ma specifically (not just "some exam")', () => {
    for (const topic of EXAMS['gate-ma'].topics) {
      expect(examIdsForTopic(topic)).toContain('gate-ma');
    }
  });

  it('examIdsForTopic returns [] for a topic no exam claims (no false-positive reachability)', () => {
    expect(examIdsForTopic('not-a-real-topic-id')).toEqual([]);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// 3. Documented gap — not silently patched. See the file header for the
//    full writeup; this test exists so the gap shows up in `npm test`
//    output (yellow, not a failure) instead of living only in a PR
//    description someone can lose track of.
// ─────────────────────────────────────────────────────────────────────────

it.todo(
  'GAP (U1-12): generated_problems / attempt_dedup / attempt_error_tags / ' +
    'student_skill_elo / item_difficulty_elo / fsrs_cards have no DIRECT exam_id ' +
    'column — only reachability via concept_id/skill_id -> topic -> exam-catalog. ' +
    'Two concrete risks this indirection does NOT cover: ' +
    '(1) a future concept added to the graph with a typo\'d/unclaimed topic silently ' +
    'becomes unreachable to any exam (this suite\'s "every concept has a topic an exam ' +
    'claims" test catches that for concepts that exist today, but a bad topic string on a ' +
    'NEW concept only fails CI if this test is re-run with the graph change in the same PR); ' +
    '(2) if a concept is ever genuinely exam-specific in a way that needs different ' +
    'grading behavior per exam (not just different topic weighting), the shared-concept ' +
    'design has no column to hang that on without a schema change. Adding a direct ' +
    'exam_id to these six tables is a real migration + backfill + writer change ' +
    '(student-model-pg.ts, the Elo/FSRS persistence layers, practice-routes.ts) — out of ' +
    'scope for this precision pass; tracked for the capability register.',
);
