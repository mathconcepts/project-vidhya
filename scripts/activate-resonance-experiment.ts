#!/usr/bin/env npx tsx
/**
 * scripts/activate-resonance-experiment.ts
 *
 * Creates the row that turns on measurement for the resonance beat
 * mechanism (docs/designs/2026-08-30-resonance-fused-atoms-plan.md §W4.5):
 * `experiments.id = 'resonance_hooks_v1_gate_ma'`, with atom-target
 * assignments for the hook atoms that carry a fused beat scene.
 *
 * ## Why this exists (W4.5's own rationale)
 *
 * The repo built the experiments/lift apparatus precisely to answer "did a
 * content change help" — shipping the resonance beats without wiring them
 * into it would repeat the exact anti-pattern that apparatus exists to end.
 * Honest expectation, stated up front: with today's traffic this row stays
 * `inconclusive` (promotion needs n >= 30 per lift.ts's locked thresholds);
 * the point is that the measurement exists from day one, so evidence
 * accrues the moment real sessions do. No auto-promotion/demotion behavior
 * change — the nightly learnings-ledger already handles `experiments` rows
 * generically once assigned.
 *
 * ## Why a script and not a migration
 *
 * Same call as scripts/activate-personalised-selector.ts (CLAUDE.md §5.2):
 * a migration runs on every deploy of every environment, switching this on
 * everywhere the schema is applied, including environments nobody intended
 * to enrol. Activation is an operator decision about one exam pack, so it
 * gets an operator command.
 *
 * ## What the assignments are
 *
 * Every atom_id under modules/project-vidhya-content/concepts/*\/atoms/
 * whose hook body carries a ```narration_steps``` beat (the resonance
 * mechanism) is assigned target_kind='atom', variant='treatment'. As of
 * this script's authoring that's the 4 pioneer concepts
 * (orthogonality, linear-transformations, determinants, eigenvalues) —
 * W3's authoring fan-out and any future generation batch (W4) both land
 * more hook atoms with the same fence, and re-running this script (it is
 * idempotent) picks them up as new assignments without touching existing
 * rows.
 *
 * ## Usage
 *
 *   DATABASE_URL=postgres://… npx tsx scripts/activate-resonance-experiment.ts
 *   …                                                        --exam gate-ma
 *   …                                                        --deactivate
 *   …                                                        --dry-run
 *
 * Idempotent: re-running reports the existing row, changes nothing on the
 * experiment itself (`ON CONFLICT (id) DO NOTHING`, same as the
 * personalised-selector precedent — never clobbers an operator's edits to
 * status/lift), and adds any newly-discovered atom assignments via
 * `ON CONFLICT (experiment_id, target_kind, target_id) DO NOTHING`.
 */

import fs from 'fs';
import path from 'path';
import { getSharedPool } from '../src/storage/pool';
import { execSync } from 'child_process';

const EXPERIMENT_ID = 'resonance_hooks_v1_gate_ma';
const CONCEPTS_DIR = path.resolve(process.cwd(), 'modules/project-vidhya-content/concepts');

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

/**
 * Every hook atom_id (as `<concept_id>.hook`) whose body carries a
 * ```narration_steps``` beat block — the resonance mechanism's fingerprint.
 * Reads the committed content module directly rather than the DB, so it
 * finds new resonance-carrying hooks the moment they're committed, before
 * any generation run or admin activation touches atom_versions.
 */
function findResonanceHookAtomIds(): string[] {
  if (!fs.existsSync(CONCEPTS_DIR)) return [];
  const ids: string[] = [];
  for (const conceptDir of fs.readdirSync(CONCEPTS_DIR, { withFileTypes: true })) {
    if (!conceptDir.isDirectory()) continue;
    const hookFile = path.join(CONCEPTS_DIR, conceptDir.name, 'atoms', 'hook.md');
    if (!fs.existsSync(hookFile)) continue;
    const body = fs.readFileSync(hookFile, 'utf8');
    if (body.includes('narration_steps')) {
      ids.push(`${conceptDir.name}.hook`);
    }
  }
  return ids.sort();
}

/** Idempotently ensure a 'treatment' assignment row per atom; returns how many were new. */
async function reconcileAssignments(
  pool: { query: (sql: string, params: unknown[]) => Promise<{ rowCount: number | null }> },
  atomIds: string[],
): Promise<number> {
  let added = 0;
  for (const atomId of atomIds) {
    const r = await pool.query(
      `INSERT INTO experiment_assignments (experiment_id, target_kind, target_id, variant)
       VALUES ($1, 'atom', $2, 'treatment')
       ON CONFLICT (experiment_id, target_kind, target_id) DO NOTHING`,
      [EXPERIMENT_ID, atomId],
    );
    if ((r.rowCount ?? 0) > 0) added++;
  }
  return added;
}

async function main(): Promise<void> {
  const pool = getSharedPool();
  if (!pool) {
    console.error(
      '[activate-resonance] DATABASE_URL is not set. Experiments are a database-backed\n' +
        'gate, so there is nothing to switch on without one — a DB-less deploy has no\n' +
        'lift measurement to wire up either way.',
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
      console.log(`[activate-resonance] no row to remove — resonance measurement is already off.`);
      return;
    }
    if (dryRun) {
      console.log(`[activate-resonance] --dry-run: would DELETE ${EXPERIMENT_ID} (cascades its assignments).`);
      return;
    }
    await pool.query(`DELETE FROM experiments WHERE id = $1`, [EXPERIMENT_ID]);
    console.log(
      `[activate-resonance] removed ${EXPERIMENT_ID} and its assignments. No lift is measured for resonance hooks.`,
    );
    return;
  }

  const atomIds = findResonanceHookAtomIds();

  if (existing.length > 0) {
    const row = existing[0];
    console.log(
      `[activate-resonance] already active — id=${row.id} exam=${row.exam_pack_id} ` +
        `status=${row.status} since=${row.started_at?.toISOString?.() ?? row.started_at}`,
    );
    if (atomIds.length === 0) {
      console.log(`[activate-resonance] no resonance-carrying hook atoms found on disk — nothing to assign.`);
      return;
    }
    if (dryRun) {
      console.log(`[activate-resonance] --dry-run: would ensure ${atomIds.length} treatment assignment(s): ${atomIds.join(', ')}`);
      return;
    }
    const added = await reconcileAssignments(pool, atomIds);
    console.log(`[activate-resonance] assignments reconciled — ${added} new, ${atomIds.length - added} already present.`);
    return;
  }

  if (dryRun) {
    console.log(
      `[activate-resonance] --dry-run: would INSERT ${EXPERIMENT_ID} for exam pack "${examPack}" with ` +
        `${atomIds.length} treatment assignment(s): ${atomIds.join(', ') || '(none found on disk)'}`,
    );
    return;
  }

  await pool.query(
    `INSERT INTO experiments (id, name, exam_pack_id, git_sha, hypothesis, variant_kind, status)
     VALUES ($1, $2, $3, $4, $5, 'atom', 'active')
     ON CONFLICT (id) DO NOTHING`,
    [
      EXPERIMENT_ID,
      'Resonance beat-fused hooks v1',
      examPack,
      gitSha(),
      'Fusing hook + intuition + trap into one scripted beat sequence (motion, ' +
        'caption, emphasis, one erroneous-example trap, per-stance text) raises ' +
        'measured mastery against the prior static-card presentation.',
    ],
  );

  const added = await reconcileAssignments(pool, atomIds);

  console.log(
    `[activate-resonance] activated ${EXPERIMENT_ID} for exam pack "${examPack}" with ${added} treatment ` +
      `assignment(s): ${atomIds.join(', ') || '(none found on disk yet)'}.\n` +
      `Expect status to stay "inconclusive" until n >= 30 sessions accrue (lift.ts's locked threshold) —` +
      ` the point of this script is that the row exists from day one, not that it wins today.`,
  );
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(`[activate-resonance] failed: ${(err as Error).message}`);
    process.exit(1);
  });
