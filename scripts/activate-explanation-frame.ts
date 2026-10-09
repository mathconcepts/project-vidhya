#!/usr/bin/env npx tsx
/**
 * scripts/activate-explanation-frame.ts
 *
 * The operator switch for the Explanation Frame on the lesson path.
 *
 * `src/content/explanation-frame/wire.ts`'s `composeFrameForLesson` requires
 * an `experiments` row with id `explanation_frame_v1_<exam_pack>` and status
 * `active` before it composes anything. With no row it returns null and
 * `/api/lesson/compose` responds exactly as it did before the wire existed.
 * That is the point: a 50/50 bucket hash with no row would be ON for half of
 * everybody the moment the code deployed, everywhere the code deployed.
 *
 * ## Why a script and not a migration
 *
 * Same call as scripts/activate-personalised-selector.ts and
 * scripts/activate-resonance-experiment.ts (CLAUDE.md §5.2): a migration
 * runs on every deploy of every environment, which would enrol environments
 * nobody intended to. Enrolment is an operator decision about one exam pack.
 *
 * ## What turning it on does, and does not, change today
 *
 * It does NOT change what a student reads. The composed frame is attached to
 * the lesson response as an additive `explanation_frame` field and no client
 * renders it yet. What it changes is that for treatment-bucket sessions the
 * composition actually RUNS — against that student's real stance, mastery,
 * weak prerequisites and board track, on the real serving path — and
 * `enrichment_level` lands in the response for the lift ledger to group by.
 * Rendering it is a separate, client-side decision that deserves its own
 * verification pass; this is the measurement half.
 *
 * Honest expectation, stated up front, same as the resonance script's: with
 * today's traffic this row stays `inconclusive` (promotion needs n >= 30 per
 * lift.ts's locked thresholds). The point is that the measurement exists
 * from day one so evidence accrues the moment real sessions do.
 *
 * ## Usage
 *
 *   DATABASE_URL=postgres://… npx tsx scripts/activate-explanation-frame.ts
 *   …                                                      --exam jee-main
 *   …                                                      --deactivate
 *   …                                                      --dry-run
 *
 * Idempotent: re-running reports the existing row and changes nothing. The
 * insert is `ON CONFLICT (id) DO NOTHING`, so it cannot clobber a row an
 * operator has since edited (a paused status, a recorded lift).
 */

import { getSharedPool } from '../src/storage/pool';
import { explanationFrameExperimentId } from '../src/content/explanation-frame/wire';
import { execSync } from 'child_process';

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
      '[activate-explanation-frame] DATABASE_URL is not set. The gate is a\n' +
        'database-backed row, so there is nothing to switch on without one — a\n' +
        'DB-less deploy serves the unframed lesson by construction, and that is\n' +
        'not something this script can change.',
    );
    process.exit(1);
  }

  const examPack = arg('exam') || 'gate-ma';
  const dryRun = arg('dry-run') !== undefined;
  const deactivate = arg('deactivate') !== undefined;
  const experimentId = explanationFrameExperimentId(examPack);

  const { rows: existing } = await pool.query(
    `SELECT id, status, exam_pack_id, started_at FROM experiments WHERE id = $1`,
    [experimentId],
  );

  if (deactivate) {
    if (existing.length === 0) {
      console.log(`[activate-explanation-frame] no row to remove — ${experimentId} is already off.`);
      return;
    }
    if (dryRun) {
      console.log(`[activate-explanation-frame] --dry-run: would DELETE ${experimentId}.`);
      return;
    }
    await pool.query(`DELETE FROM experiments WHERE id = $1`, [experimentId]);
    console.log(
      `[activate-explanation-frame] removed ${experimentId}. Every session returns to the\n` +
        `unframed response (explanation_frame: null).`,
    );
    return;
  }

  if (existing.length > 0) {
    const row = existing[0];
    console.log(
      `[activate-explanation-frame] already active — id=${row.id} exam=${row.exam_pack_id} ` +
        `status=${row.status} since=${row.started_at?.toISOString?.() ?? row.started_at}\n` +
        `Nothing changed.`,
    );
    return;
  }

  if (dryRun) {
    console.log(
      `[activate-explanation-frame] --dry-run: would INSERT ${experimentId} for exam pack "${examPack}".`,
    );
    return;
  }

  await pool.query(
    `INSERT INTO experiments (id, name, exam_pack_id, git_sha, hypothesis, variant_kind, status)
     VALUES ($1, $2, $3, $4, $5, 'flag', 'active')
     ON CONFLICT (id) DO NOTHING`,
    [
      experimentId,
      `Explanation Frame v1 (${examPack})`,
      examPack,
      gitSha(),
      'Composing a lesson explanation from the declared static/variable frame, ' +
        'enriched by whatever learner signals exist, raises measured mastery ' +
        'against the unframed atom stack.',
    ],
  );

  console.log(
    `[activate-explanation-frame] activated ${experimentId} for exam pack "${examPack}".\n` +
      `Treatment-bucket sessions now get a composed explanation_frame on\n` +
      `POST /api/lesson/compose. No client renders it yet, so nothing a student\n` +
      `reads changes — see this script's header for why that is deliberate.`,
  );
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(`[activate-explanation-frame] failed: ${(err as Error).message}`);
    process.exit(1);
  });
