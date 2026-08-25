// @ts-nocheck
/**
 * Seed hand-authored, server-gradable practice items from
 * data/practice-items/*.json into `generated_problems` at boot — mirrors
 * seed-static-pyqs.ts's philosophy (idempotent, a DB-unreachable run
 * degrades instead of crashing boot, runs every boot).
 *
 * Why this exists: these items already ship as committed JSON and are
 * served correctly through FileLearningObjectCatalog (practice pages,
 * warmup onboarding, checkpoint quizzes) — but generateMockExam()
 * (src/gbrain/operations/moat-operations.ts) queries `generated_problems`
 * directly via SQL, so a concept whose only content lives in these files
 * never shows up in a mock exam, topic-wise or full-length. This closes
 * that gap: all 26 Linear Algebra concepts' items (data/practice-items/
 * gate-ma-la-*.json, 127 items, plus the original 3-item demo-rail file)
 * become real `generated_problems` rows, not just file-served ones. The
 * loop itself isn't LA-specific — any future data/practice-items/*.json
 * file seeds the same way, keyed off each item's concept_id.
 *
 * Deterministic id, not gen_random_uuid(): each item's stable `id` field
 * (e.g. "la-eigen-trace-det-001") hashes to the same UUID on every boot,
 * so this is a genuine UPSERT — editing an item's text/options in the JSON
 * source re-syncs the same row on the next boot instead of leaving a stale
 * duplicate behind.
 */

import fs from 'fs';
import path from 'path';
import pg from 'pg';
import { createHash } from 'crypto';
import { CONCEPT_MAP } from '../constants/concept-graph';

const PRACTICE_ITEMS_DIR = path.resolve(process.cwd(), 'data/practice-items');

// Same rationale as seed-static-pyqs.ts's identical constant: a broken
// connection should abandon the seed (idempotent, resumes next boot), not
// spend the boot's whole time budget retrying doomed queries one by one.
const MAX_CONSECUTIVE_DB_FAILURES = 3;

/** Stable, non-cryptographic mapping from a natural item id to a UUID shape. */
export function deterministicItemId(seed: string): string {
  const hex = createHash('sha256').update(seed).digest('hex').slice(0, 32);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

interface PracticeItemFile {
  version?: number;
  items?: any[];
}

export async function seedPracticeItemsFromDisk(pool: pg.Pool): Promise<number> {
  if (!fs.existsSync(PRACTICE_ITEMS_DIR)) return 0;

  const files = fs.readdirSync(PRACTICE_ITEMS_DIR).filter((f) => f.endsWith('.json'));
  let seeded = 0;
  let skippedUnknownConcept = 0;
  let consecutiveFailures = 0;

  for (const file of files) {
    let parsed: PracticeItemFile;
    try {
      parsed = JSON.parse(fs.readFileSync(path.join(PRACTICE_ITEMS_DIR, file), 'utf-8'));
    } catch (err) {
      console.error(`[seed-la-practice-items] Failed to parse ${file}:`, (err as Error).message);
      continue;
    }
    const items = Array.isArray(parsed.items) ? parsed.items : [];

    for (const item of items) {
      if (!item?.id || !item?.concept_id || !item?.question_text || item?.correct_answer == null) continue;
      const concept = CONCEPT_MAP.get(item.concept_id);
      // Honest skip, never a guess: an item tagged with a concept_id the
      // live graph doesn't recognize (typo, renamed concept) is left out
      // rather than filed under a fabricated topic.
      if (!concept) { skippedUnknownConcept++; continue; }

      const id = deterministicItemId(item.id);
      const options = Array.isArray(item.options) ? item.options : null;
      const answerIndex = typeof item.answer_index === 'number' ? item.answer_index : null;
      const answerIndices = Array.isArray(item.answer_indices) ? item.answer_indices : null;
      const answerRange = Array.isArray(item.answer_range) ? item.answer_range : null;

      try {
        await pool.query(
          `INSERT INTO generated_problems
             (id, concept_id, topic, difficulty, question_text, correct_answer,
              solution_steps, verified, verification_method, question_type,
              marks, answer_index, answer_indices, answer_range, options)
           VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, true, $8, $9, $10, $11, $12::jsonb, $13::jsonb, $14::jsonb)
           ON CONFLICT (id) DO UPDATE SET
             concept_id = EXCLUDED.concept_id,
             topic = EXCLUDED.topic,
             difficulty = EXCLUDED.difficulty,
             question_text = EXCLUDED.question_text,
             correct_answer = EXCLUDED.correct_answer,
             solution_steps = EXCLUDED.solution_steps,
             verified = true,
             verification_method = EXCLUDED.verification_method,
             question_type = EXCLUDED.question_type,
             marks = EXCLUDED.marks,
             answer_index = EXCLUDED.answer_index,
             answer_indices = EXCLUDED.answer_indices,
             answer_range = EXCLUDED.answer_range,
             options = EXCLUDED.options`,
          [
            id,
            item.concept_id,
            concept.topic,
            typeof item.difficulty === 'number' ? item.difficulty : 0.5,
            item.question_text,
            String(item.correct_answer),
            JSON.stringify(item.solution_steps ?? []),
            item.verification_method ?? 'hand_authored',
            item.question_type ?? null,
            typeof item.marks === 'number' ? item.marks : null,
            answerIndex,
            answerIndices ? JSON.stringify(answerIndices) : null,
            answerRange ? JSON.stringify(answerRange) : null,
            options ? JSON.stringify(options) : null,
          ],
        );
        seeded++;
        consecutiveFailures = 0;
      } catch (err) {
        consecutiveFailures += 1;
        if (consecutiveFailures >= MAX_CONSECUTIVE_DB_FAILURES) {
          console.error(
            `[seed-la-practice-items] ${consecutiveFailures} consecutive query failures ` +
              `(${(err as Error).message}) — the database is unreachable, not the rows. ` +
              `Abandoning the seed so boot can finish; the idempotent upsert resumes on the next boot.`,
          );
          return seeded;
        }
        console.error(`[seed-la-practice-items] Failed to upsert ${item.id}:`, (err as Error).message);
      }
    }
  }

  if (seeded > 0) {
    console.log(`[seed-la-practice-items] Upserted ${seeded} practice item(s) from data/practice-items/`);
  }
  if (skippedUnknownConcept > 0) {
    console.log(`[seed-la-practice-items] Skipped ${skippedUnknownConcept} item(s) with an unrecognized concept_id`);
  }
  return seeded;
}
