/**
 * scripts/seed-pyq-holdout.ts
 *
 * One-time seed script — flips `is_holdout = TRUE` on ~30 PYQs per exam,
 * sampled stratified by (year, topic) so the holdout bank reflects the
 * exam's natural distribution rather than over-weighting one year/topic.
 *
 * Locked invariant (eng-review D3): a PYQ NEVER moves between practice
 * and holdout after this script runs. The script REFUSES to run a second
 * time on the same exam unless --force is passed, and even then it warns
 * loudly that every prior lift number that touched moved PYQs is now
 * invalid.
 *
 * Usage:
 *   npx tsx scripts/seed-pyq-holdout.ts                    # seed all exams (default 30 each)
 *   npx tsx scripts/seed-pyq-holdout.ts --exam gate-ma     # one exam only
 *   npx tsx scripts/seed-pyq-holdout.ts --size 20          # custom holdout size
 *   npx tsx scripts/seed-pyq-holdout.ts --dry-run          # show what would change, no writes
 *   npx tsx scripts/seed-pyq-holdout.ts --force            # re-seed even if already done (DANGEROUS)
 *
 * Determinism: uses a SHA-256-derived RNG seeded by the exam_id, so the
 * same exam always picks the same PYQs across machines/replays unless
 * the underlying PYQ corpus changes. This makes the holdout reproducible
 * across local dev, CI, and production seeds.
 */

import crypto from 'crypto';
import pg from 'pg';

const { Pool } = pg;

interface Args {
  exam?: string;
  size: number;
  dryRun: boolean;
  force: boolean;
}

function parseArgs(argv: string[]): Args {
  const a: Args = { size: 30, dryRun: false, force: false };
  for (let i = 0; i < argv.length; i++) {
    const v = argv[i];
    if (v === '--exam') a.exam = argv[++i];
    else if (v === '--size') a.size = Math.max(1, parseInt(argv[++i] ?? '30', 10));
    else if (v === '--dry-run') a.dryRun = true;
    else if (v === '--force') a.force = true;
  }
  return a;
}

interface PyqRow {
  id: string;
  exam_id: string;
  year: number;
  topic: string;
  is_holdout: boolean;
}

/** Deterministic 0..1 number from (exam_id, pyq_id) — same across machines. */
function seededRandom(examId: string, pyqId: string): number {
  const h = crypto.createHash('sha256').update(`${examId}:${pyqId}`).digest();
  // First 4 bytes → uint32 → 0..1
  return h.readUInt32BE(0) / 0xffffffff;
}

/**
 * Stratified sampler: for each (year, topic) bucket, take a proportional
 * share of the target size, rounded up to at least 1 if the bucket is
 * non-empty and we have budget. Within a bucket, picks deterministically
 * via seededRandom(exam_id, pyq_id).
 */
function stratifiedSample(rows: PyqRow[], targetSize: number, examId: string): PyqRow[] {
  if (rows.length <= targetSize) return rows;

  // Bucket by (year, topic)
  const buckets = new Map<string, PyqRow[]>();
  for (const r of rows) {
    const key = `${r.year}::${r.topic}`;
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key)!.push(r);
  }

  // Allocate budget per bucket proportional to share
  const total = rows.length;
  const out: PyqRow[] = [];
  const bucketEntries = Array.from(buckets.entries());

  for (const [, bucketRows] of bucketEntries) {
    const share = bucketRows.length / total;
    const allocate = Math.max(1, Math.round(share * targetSize));
    const sorted = bucketRows
      .slice()
      .sort((a, b) => seededRandom(examId, a.id) - seededRandom(examId, b.id));
    out.push(...sorted.slice(0, Math.min(allocate, sorted.length)));
  }

  // Trim to exact target if we over-allocated due to the per-bucket floor of 1
  if (out.length > targetSize) {
    out.sort((a, b) => seededRandom(examId, a.id) - seededRandom(examId, b.id));
    return out.slice(0, targetSize);
  }
  return out;
}

async function seedExam(
  pool: pg.Pool,
  examId: string,
  size: number,
  dryRun: boolean,
  force: boolean,
): Promise<void> {
  const { rows: existing } = await pool.query<{ count: string }>(
    `SELECT COUNT(*)::TEXT AS count FROM pyq_questions WHERE exam_id = $1 AND is_holdout = TRUE`,
    [examId],
  );
  const existingCount = parseInt(existing[0]?.count ?? '0', 10);

  if (existingCount > 0 && !force) {
    console.warn(
      `[holdout] exam=${examId}: already has ${existingCount} holdout PYQs. ` +
        `Skipping. Use --force to re-seed (NOT RECOMMENDED — invalidates prior lift numbers).`,
    );
    return;
  }

  if (existingCount > 0 && force) {
    console.warn(
      `[holdout] ⚠️  --force: clearing ${existingCount} prior holdout flags on exam=${examId}. ` +
        `Every lift_v1 / pyq_accuracy_delta_v1 number that touched these PYQs is now invalid.`,
    );
    if (!dryRun) {
      await pool.query(
        `UPDATE pyq_questions SET is_holdout = FALSE, holdout_seeded_at = NULL WHERE exam_id = $1 AND is_holdout = TRUE`,
        [examId],
      );
    }
  }

  const { rows } = await pool.query<PyqRow>(
    `SELECT id, exam_id, year, topic, is_holdout FROM pyq_questions WHERE exam_id = $1`,
    [examId],
  );

  if (rows.length === 0) {
    console.warn(`[holdout] exam=${examId}: no PYQs in pyq_questions. Nothing to seed.`);
    return;
  }

  const sampled = stratifiedSample(rows, size, examId);
  console.log(
    `[holdout] exam=${examId}: corpus=${rows.length}, target=${size}, sampled=${sampled.length}`,
  );

  // Distribution summary
  const dist = new Map<string, number>();
  for (const r of sampled) {
    const key = `${r.year}::${r.topic}`;
    dist.set(key, (dist.get(key) ?? 0) + 1);
  }
  for (const [k, v] of Array.from(dist.entries()).sort()) {
    console.log(`            ${k}: ${v}`);
  }

  if (dryRun) {
    console.log(`[holdout] --dry-run: skipping writes for exam=${examId}`);
    return;
  }

  const ids = sampled.map((r) => r.id);
  await pool.query(
    `UPDATE pyq_questions
        SET is_holdout = TRUE,
            holdout_seeded_at = NOW()
      WHERE id::TEXT = ANY($1::TEXT[])`,
    [ids],
  );
  console.log(`[holdout] ✓ exam=${examId}: flipped ${ids.length} PYQs to is_holdout=TRUE`);
}

async function main(): Promise<number> {
  if (!process.env.DATABASE_URL) {
    console.error('✗ DATABASE_URL not set. Required for the holdout seed.');
    return 1;
  }

  const args = parseArgs(process.argv.slice(2));
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 3 });

  try {
    const exams = args.exam
      ? [args.exam]
      : (
          await pool.query<{ exam_id: string }>(
            `SELECT DISTINCT exam_id FROM pyq_questions ORDER BY exam_id`,
          )
        ).rows.map((r) => r.exam_id);

    if (exams.length === 0) {
      console.warn('No exams found in pyq_questions. Nothing to seed.');
      return 0;
    }

    console.log(
      `Seeding holdout for: ${exams.join(', ')} ` +
        `(target ${args.size}/exam, dry-run=${args.dryRun}, force=${args.force})`,
    );

    for (const exam of exams) {
      await seedExam(pool, exam, args.size, args.dryRun, args.force);
    }
    return 0;
  } finally {
    await pool.end();
  }
}

void main()
  .then((code) => process.exit(code))
  .catch((err) => {
    console.error('Unhandled error:', err);
    process.exit(1);
  });
