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
      try {
        await pool.query(
          `INSERT INTO pyq_questions
             (exam_id, year, question_text, options, correct_answer, explanation,
              topic, difficulty, marks, negative_marks, source)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'official_pyq')`,
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
            q.negative_marks ?? -0.33,
          ],
        );
        seededCount++;
      } catch (err) {
        console.error(`[seed-static-pyqs] Failed to insert ${dirName}/${q.id}:`, (err as Error).message);
      }
    }
  }

  if (seededCount > 0) {
    console.log(`[seed-static-pyqs] Seeded ${seededCount} official PYQ(s) from static files`);
  }

  return seededCount;
}
