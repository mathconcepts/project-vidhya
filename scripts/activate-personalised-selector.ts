#!/usr/bin/env npx tsx
/**
 * scripts/activate-personalised-selector.ts
 *
 * Creates the one row that switches the personalised selector on:
 * `experiments.id = 'personalized_selector_v1_gate_ma'`.
 *
 * ## Why a script and not a migration
 *
 * CLAUDE.md §5.2 states the activation row is created "deliberately
 * out-of-band, NOT a migration", and that is the right call: a migration runs
 * on every deploy of every environment, so putting the row there would switch
 * personalisation on everywhere the schema is applied, including environments
 * nobody intended to enrol. Activation is an operator decision about one exam
 * pack, so it gets an operator command.
 *
 * ## What being off actually meant
 *
 * `src/personalization/lesson-wire.ts` reads this row to decide bucketing.
 * With no row, every session short-circuits into the control bucket and every
 * student is served the generic selection — and until the content-maturity
 * report existed, nothing said so. The report's top line, "Students are seeing
 * generic content", is driven by exactly this.
 *
 * ## Usage
 *
 *   DATABASE_URL=postgres://… npx tsx scripts/activate-personalised-selector.ts
 *   …                                                        --exam gate-ma
 *   …                                                        --deactivate
 *   …                                                        --dry-run
 *
 * Idempotent: re-running reports the existing row and changes nothing. The
 * insert is `ON CONFLICT (id) DO NOTHING`, so it cannot clobber a row that an
 * operator has since edited (a paused status, a recorded lift).
 */

import { getSharedPool } from '../src/storage/pool';
import { execSync } from 'child_process';

const EXPERIMENT_ID = 'personalized_selector_v1_gate_ma';

function arg(name: string): string | undefined {
  const hit = process.argv.find((a) => a === `--${name}` || a.startsWith(`--${name}=`));
  if (!hit) return undefined;
  return hit.includes('=') ? hit.slice(hit.indexOf('=') + 1) : '';
}

/** The experiments table records the code state an experiment started from.
 *  Unknown is honest when the script runs outside a checkout. */
function gitSha(): string {
  try {
    return execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
  } catch {
    return 'unknown';
  }
}

async function main(): Promise<void> {
  const pool = getSharedPool();
  if (!pool) {
    console.error(
      '[activate-selector] DATABASE_URL is not set. The selector is a database-backed\n' +
        'gate, so there is nothing to switch on without one — a DB-less deploy serves\n' +
        'the generic selection by construction, and that is not something this script\n' +
        'can change.',
    );
    process.exit(1);
  }

  const examPack = arg('exam') || 'gate-ma';
  const dryRun = arg('dry-run') !== undefined;
  const deactivate = arg('deactivate') !== undefined;

  const { rows: existing } = await pool.query(
    `SELECT id, status, exam_pack_id, started_at FROM experiments WHERE id = $1`,
    [EXPERIMENT_ID],
  );

  if (deactivate) {
    if (existing.length === 0) {
      console.log(`[activate-selector] no row to remove — the selector is already off.`);
      return;
    }
    if (dryRun) {
      console.log(`[activate-selector] --dry-run: would DELETE ${EXPERIMENT_ID}.`);
      return;
    }
    await pool.query(`DELETE FROM experiments WHERE id = $1`, [EXPERIMENT_ID]);
    console.log(
      `[activate-selector] removed ${EXPERIMENT_ID}. Every session returns to the control bucket.`,
    );
    return;
  }

  if (existing.length > 0) {
    const row = existing[0];
    console.log(
      `[activate-selector] already active — id=${row.id} exam=${row.exam_pack_id} ` +
        `status=${row.status} since=${row.started_at?.toISOString?.() ?? row.started_at}\n` +
        `Nothing changed.`,
    );
    return;
  }

  if (dryRun) {
    console.log(
      `[activate-selector] --dry-run: would INSERT ${EXPERIMENT_ID} for exam pack "${examPack}".`,
    );
    return;
  }

  await pool.query(
    `INSERT INTO experiments (id, name, exam_pack_id, git_sha, hypothesis, variant_kind, status)
     VALUES ($1, $2, $3, $4, $5, 'flag', 'active')
     ON CONFLICT (id) DO NOTHING`,
    [
      EXPERIMENT_ID,
      'Personalised selector v1',
      examPack,
      gitSha(),
      'Re-ranking the already-selected atom set by the five weighted layers ' +
        'raises measured mastery against an unranked control.',
    ],
  );

  console.log(
    `[activate-selector] activated ${EXPERIMENT_ID} for exam pack "${examPack}".\n` +
      `Sessions are now bucketed; /api/admin/content-maturity should stop reporting\n` +
      `"every session is in the control bucket" on its next read.`,
  );
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(`[activate-selector] failed: ${(err as Error).message}`);
    process.exit(1);
  });
