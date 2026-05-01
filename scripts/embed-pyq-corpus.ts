#!/usr/bin/env tsx
/**
 * embed-pyq-corpus.ts — backfill pyq_questions.embedding for the
 * concept-orchestrator's vector PYQ grounding (4.11).
 *
 * Usage:
 *   tsx scripts/embed-pyq-corpus.ts                     # process unembedded rows
 *   tsx scripts/embed-pyq-corpus.ts --limit 100         # cap batch size
 *   tsx scripts/embed-pyq-corpus.ts --re-embed          # also re-embed already-embedded rows
 *   tsx scripts/embed-pyq-corpus.ts --dry-run           # show what would happen, no writes
 *   tsx scripts/embed-pyq-corpus.ts --model text-embedding-3-small
 *
 * Cost: ~$0.00002 per row at text-embedding-3-small. 5,000 rows = ~$0.10.
 *
 * Idempotent: rows with embedding != NULL are skipped unless --re-embed.
 * Safe to interrupt and resume — embedded_at is set per row, so the next
 * run picks up where this one left off.
 *
 * Requires DATABASE_URL + OPENAI_API_KEY (or whatever the embed adapter uses).
 */

import pg from 'pg';
import { LLMClient } from '../src/llm/index';

const args = process.argv.slice(2);
function flag(name: string): boolean {
  return args.includes(`--${name}`);
}
function arg(name: string, fallback: string | null = null): string | null {
  const idx = args.indexOf(`--${name}`);
  if (idx === -1 || idx + 1 >= args.length) return fallback;
  return args[idx + 1];
}

const LIMIT = Number(arg('limit', '1000'));
const MODEL = arg('model', 'text-embedding-3-small')!;
const DRY_RUN = flag('dry-run');
const RE_EMBED = flag('re-embed');

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL not set — cannot run.');
    process.exit(2);
  }

  const { Pool } = pg;
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 5 });

  // Pull rows to embed.
  const where = RE_EMBED ? '' : 'WHERE embedding IS NULL';
  const r = await pool.query(
    `SELECT id, question_text, topic, exam_id FROM pyq_questions ${where} ORDER BY id LIMIT $1`,
    [LIMIT],
  );

  if (r.rows.length === 0) {
    console.log('No rows to embed (use --re-embed to redo existing).');
    await pool.end();
    return;
  }

  console.log(`Embedding ${r.rows.length} PYQ rows via ${MODEL} (dry_run=${DRY_RUN})...`);

  const config = process.env.LLM_CONFIG_PATH ? require(process.env.LLM_CONFIG_PATH) : { providers: {}, defaultProvider: '' };
  const client = new (LLMClient as any)(config);

  let embedded = 0;
  let failed = 0;

  for (const row of r.rows) {
    // Compose embed input: question + topic + exam_id so semantic search
    // captures all three signals (topic context, exam style, content).
    const text = `[${row.exam_id}] [${row.topic}] ${row.question_text}`.slice(0, 8000);
    try {
      const resp = await client.embed({ model: MODEL, input: text });
      const vec = resp?.embedding ?? resp?.data?.[0]?.embedding ?? resp?.vector;
      if (!Array.isArray(vec) || vec.length === 0) {
        console.warn(`  ! ${row.id}: empty embedding response`);
        failed++;
        continue;
      }
      if (vec.length !== 1536) {
        console.warn(`  ! ${row.id}: wrong dim ${vec.length} (expected 1536). Migration 015 sized for 1536.`);
        failed++;
        continue;
      }
      if (!DRY_RUN) {
        await pool.query(
          `UPDATE pyq_questions
             SET embedding = $1::vector, embedded_at = NOW()
             WHERE id = $2`,
          [`[${vec.join(',')}]`, row.id],
        );
      }
      embedded++;
      if (embedded % 100 === 0) console.log(`  ...${embedded} embedded`);
    } catch (err: any) {
      failed++;
      console.warn(`  ! ${row.id}: ${err.message}`);
    }
  }

  console.log(`\nDone. ${embedded} embedded, ${failed} failed${DRY_RUN ? ' (dry-run, no writes)' : ''}.`);
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
