// @ts-nocheck
/**
 * Seed pyq_questions from the static data/courses/gate-em/topics/<N>-<slug>
 * /mcqs.json files at boot, once DATABASE_URL is configured.
 *
 * These files hold real, human-authored GATE PYQs (150 across 10 topics),
 * already committed and otherwise unused by the running app. Two places
 * read them:
 *   - src/api/gate-routes.ts falls back to reading them directly when
 *     Postgres is unreachable or has no rows yet for a topic.
 *   - This file seeds the SAME files into Postgres once it's reachable.
 *
 * Why both exist: without this seed step, a topic that showed (say) 15 real
 * PYQs in file-fallback mode could show FEWER once DATABASE_URL got
 * configured, if the only rows a migration had put in pyq_questions for
 * that topic were machine-generated ones (e.g. migration 035's 11 Tier-3
 * Linear Algebra items). That would be a visible regression from
 * "fixing" the database. Seeding the real PYQs here keeps DB-mode a
 * superset of what fallback-mode already shows, not a different set.
 *
 * Idempotent: skips a topic entirely once it already has 'official_pyq'
 * rows, so this is safe to call on every boot (matches the existing
 * demo:seed philosophy elsewhere in this repo).
 */

import fs from 'fs';
import path from 'path';
import pg from 'pg';
import { gateMcqNegativeMarksFallback } from '../syllabus/exam-catalog';
import { mapPyqTagsToConceptId, mapPyqTagsToConceptIds, mapPyqTextToConceptId } from './pyq-concept-mapper';

const TOPICS_DIR = path.resolve(process.cwd(), 'data/courses/gate-em/topics');

/**
 * The app's canonical topic ids (data/curriculum/gate-ma.yml) don't all
 * match their content directory's slug — e.g. the registered topic is
 * "transforms" but its directory is "07-transform-theory". Without this
 * map, rows would get seeded under 'transform-theory'/'discrete-mathematics'
 * and gate-routes.ts's `WHERE topic = 'transforms'` query would never find
 * them — a silent zero-results bug, not a crash.
 *
 * Single source of truth: src/api/gate-routes.ts imports this same map for
 * its static-file fallback, so seeded DB rows and fallback-mode rows always
 * agree on which topic id a question belongs to.
 */
export const TOPIC_DIR_ALIAS: Record<string, string> = {
  transforms: 'transform-theory',
  discrete: 'discrete-mathematics',
};

const DIR_TO_CANONICAL_TOPIC: Record<string, string> = Object.fromEntries(
  Object.entries(TOPIC_DIR_ALIAS).map(([canonical, dirSlug]) => [dirSlug, canonical]),
);

/**
 * How many consecutive failing queries mean the database is unreachable
 * rather than one row being awkward.
 *
 * This loop issues one UPDATE per question — 164 of them. When the
 * connection itself is broken (a TLS handshake that will never succeed, for
 * instance), every one fails at roughly half a second, so the boot spends
 * ~87 seconds failing before it can bind a port. Observed on 2026-08-19:
 * the platform's port scan gave up first, marked the deploy failed, and
 * kept serving the previous instance — which made a corrected environment
 * variable look like it had been ignored. A broken connection should
 * degrade the seed, not the deploy.
 */
const MAX_CONSECUTIVE_DB_FAILURES = 3;

export async function seedStaticPyqQuestions(pool: pg.Pool): Promise<number> {
  if (!fs.existsSync(TOPICS_DIR)) return 0;

  const topicDirs = fs.readdirSync(TOPICS_DIR).filter(d => {
    try {
      return fs.statSync(path.join(TOPICS_DIR, d)).isDirectory();
    } catch {
      return false;
    }
  });

  let seededCount = 0;
  // concept_id mapping summary (T3 / A2) — counted across both the fresh
  // INSERT path and the migration-035 backfill below; never silently
  // dropped, so an operator can see coverage without querying the DB.
  let mappedCount = 0;
  let unmappedCount = 0;

  // Reset per call, not per module: a later boot with a working database
  // must get a full run, not inherit an earlier one's verdict.
  let consecutiveFailures = 0;

  for (const dirName of topicDirs) {
    const mcqsPath = path.join(TOPICS_DIR, dirName, 'mcqs.json');
    if (!fs.existsSync(mcqsPath)) continue;

    let parsed: any;
    try {
      parsed = JSON.parse(fs.readFileSync(mcqsPath, 'utf-8'));
    } catch (err) {
      console.error(`[seed-static-pyqs] Failed to parse ${mcqsPath}:`, (err as Error).message);
      continue;
    }

    const fileSlug = parsed.topic || dirName.replace(/^\d+-/, '');
    const topic = DIR_TO_CANONICAL_TOPIC[fileSlug] || fileSlug;
    const questions = Array.isArray(parsed.questions) ? parsed.questions : [];
    if (questions.length === 0) continue;

    // Backfill concept_id / concept_ids on rows already seeded by a PAST
    // server boot, BEFORE the skip-guard below `continue`s past this whole
    // topic. Tags aren't persisted to pyq_questions (INSERT never wrote
    // them), so matching against already-seeded rows has to go by exact
    // question_text — the same text this file would insert, and the only
    // field the mapper's text-keyword fallback also works from. Guard is
    // `concept_id IS NULL OR concept_ids IS NULL` (not just concept_id) so
    // a row seeded by a PRE-concept_ids deploy — concept_id already set,
    // concept_ids never written — gets concept_ids backfilled too, on the
    // very next boot after this column existed. Fully idempotent: once
    // both columns are non-null the row never matches again.
    for (const q of questions) {
      const tagConceptIds = mapPyqTagsToConceptIds(topic, q.tags);
      const conceptId = tagConceptIds[0] ?? mapPyqTextToConceptId(topic, q.question);
      if (!conceptId) continue;
      const conceptIds = tagConceptIds.length > 0 ? tagConceptIds : [conceptId];
      try {
        await pool.query(
          `UPDATE pyq_questions SET concept_id = $1, concept_ids = $2
             WHERE topic = $3 AND question_text = $4
               AND (concept_id IS NULL OR concept_ids IS NULL)`,
          [conceptId, conceptIds, topic, q.question],
        );
      } catch (err) {
        consecutiveFailures += 1;
        if (consecutiveFailures >= MAX_CONSECUTIVE_DB_FAILURES) {
          console.error(
            `[seed-static-pyqs] ${consecutiveFailures} consecutive query failures ` +
              `(${(err as Error).message}) — the database is unreachable, not the rows. ` +
              `Abandoning the backfill so boot can finish and the server can bind its port; ` +
              `it is idempotent and picks up where it left off on the next boot.`,
          );
          return seededCount;
        }
        console.error(`[seed-static-pyqs] Backfill failed for ${dirName}/${q.id}:`, (err as Error).message);
      }
      consecutiveFailures = 0;
    }

    // Idempotency: skip this topic once it already has real-PYQ rows —
    // avoids re-inserting the same 15 questions on every restart.
    let existingCount = 0;
    try {
      const existing = await pool.query(
        `SELECT COUNT(*) AS n FROM pyq_questions WHERE topic = $1 AND source = 'official_pyq'`,
        [topic],
      );
      existingCount = parseInt(existing.rows[0]?.n, 10) || 0;
    } catch (err) {
      console.error(`[seed-static-pyqs] Failed to check existing rows for ${topic}:`, (err as Error).message);
      continue;
    }
    if (existingCount > 0) continue;

    const examId = parsed.exam_id || 'gate-engineering-maths';

    for (const q of questions) {
      const tagConceptIds = mapPyqTagsToConceptIds(topic, q.tags);
      const conceptId = tagConceptIds[0] ?? mapPyqTextToConceptId(topic, q.question);
      const conceptIds = tagConceptIds.length > 0 ? tagConceptIds : (conceptId ? [conceptId] : []);
      if (conceptId) mappedCount++; else unmappedCount++;
      try {
        await pool.query(
          `INSERT INTO pyq_questions
             (exam_id, year, question_text, options, correct_answer, explanation,
              topic, difficulty, marks, negative_marks, source, concept_id, concept_ids)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'official_pyq', $11, $12)`,
          [
            examId,
            q.year ?? null,
            q.question,
            JSON.stringify(q.options || {}),
            q.correct_answer,
            q.explanation || null,
            topic,
            q.difficulty || 'medium',
            q.marks ?? 1,
            // U1-13: reads GATE's canonical marking_table row instead of a
            // hardcoded `-0.33` literal (was duplicated with the identical
            // fallback in src/api/gate-routes.ts's staticProblemsForTopic()).
            q.negative_marks ?? gateMcqNegativeMarksFallback(q.marks ?? 1),
            conceptId,
            conceptIds.length > 0 ? conceptIds : null,
          ],
        );
        seededCount++;
      } catch (err) {
        console.error(`[seed-static-pyqs] Failed to insert ${dirName}/${q.id}:`, (err as Error).message);
      }
    }
  }

  // Migration 035's 11 hand-inserted Tier-3 linear-algebra rows have no
  // `tags` (raw SQL, not authored via mcqs.json) — backfill them via the
  // text-keyword fallback only. Runs unconditionally (idempotent: only
  // touches rows still NULL), independent of the topic-directory loop
  // above since these rows aren't seeded from a static file.
  try {
    const { rows } = await pool.query(
      `SELECT id, question_text FROM pyq_questions
         WHERE topic = 'linear-algebra' AND source = 'generated_tier3'
           AND (concept_id IS NULL OR concept_ids IS NULL)`,
    );
    for (const row of rows) {
      const conceptId = mapPyqTextToConceptId('linear-algebra', row.question_text);
      if (!conceptId) { unmappedCount++; continue; }
      mappedCount++;
      // Text-keyword rules only ever yield a single concept (no
      // author-curated tag order to derive a secondary concept from — see
      // pyq-concept-mapper.ts's header comment), so concept_ids is a
      // one-element array here, not a guess at additional concepts.
      await pool.query(
        `UPDATE pyq_questions SET concept_id = $1, concept_ids = $2 WHERE id = $3`,
        [conceptId, [conceptId], row.id],
      );
    }
  } catch (err) {
    console.error('[seed-static-pyqs] Migration-035 backfill failed:', (err as Error).message);
  }

  if (seededCount > 0) {
    console.log(`[seed-static-pyqs] Seeded ${seededCount} official PYQ(s) from static files`);
  }
  if (mappedCount > 0 || unmappedCount > 0) {
    console.log(
      `[seed-static-pyqs] concept_id mapping: ${mappedCount} mapped, ${unmappedCount} unmapped ` +
      `(unmapped rows stay NULL — never guessed; see src/db/pyq-concept-mapper.ts)`,
    );
  }

  return seededCount;
}
