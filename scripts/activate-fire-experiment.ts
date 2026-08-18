/**
 * scripts/activate-fire-experiment.ts
 *
 * Operator CLI — creates the `fire_v1_gate_ma` experiments row that turns
 * FIRe-lite propagation (T11/B2, `VIDHYA_FIRE=on`) into a MEASURED
 * experiment rather than a silent flag flip. Follows the same
 * out-of-band-activation pattern already documented for
 * `personalized_selector_v1_gate_ma` (src/personalization/ab.ts,
 * src/personalization/lesson-wire.ts): the flag alone changes runtime
 * behavior; the experiments row is what lets the nightly learnings-ledger
 * (src/jobs/learnings-ledger.ts) and the lift CLI compute `lift_v1` for it.
 *
 * No migration — `experiments` (migration 020) already has every column
 * this needs.
 *
 * Usage:
 *   npx tsx scripts/activate-fire-experiment.ts               # create (idempotent)
 *   npx tsx scripts/activate-fire-experiment.ts --dry-run      # show what would be created
 *   npx tsx scripts/activate-fire-experiment.ts --exam jee-main --id fire_v1_jee_main
 *
 * Exit criterion (named in the hypothesis, per the plan's OV amendment
 * #10 / T11 §5): review-load reduction — fewer EXPLICIT reviews per
 * retained concept for the treatment cohort — with `lift_v1` non-negative.
 * Same significance thresholds as every other experiment (n >= 30, p < 0.05).
 */

import { createExperiment, getExperiment } from '../src/experiments/registry';

interface Args {
  id: string;
  examPackId: string;
  dryRun: boolean;
}

function parseArgs(argv: string[]): Args {
  const a: Args = { id: 'fire_v1_gate_ma', examPackId: 'gate-ma', dryRun: false };
  for (let i = 0; i < argv.length; i++) {
    const v = argv[i];
    if (v === '--id') a.id = argv[++i] ?? a.id;
    else if (v === '--exam') a.examPackId = argv[++i] ?? a.examPackId;
    else if (v === '--dry-run') a.dryRun = true;
  }
  return a;
}

const HYPOTHESIS =
  'FIRe-lite implicit-review credit propagation (VIDHYA_FIRE=on) reduces ' +
  'the number of EXPLICIT reviews a student needs per retained linear-algebra ' +
  'concept, without a negative mastery lift. Exit criterion: review-load ' +
  'reduction (explicit reviews per retained concept, treatment vs matched ' +
  'control) with lift_v1 >= 0, n >= 30, p < 0.05 — the same promotion ' +
  'thresholds every other experiment in the ledger uses.';

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  if (args.dryRun) {
    console.log('--dry-run: would create experiment:');
    console.log(JSON.stringify({ id: args.id, exam_pack_id: args.examPackId, hypothesis: HYPOTHESIS, variant_kind: 'flag' }, null, 2));
    return;
  }

  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set — nothing to activate against. Refusing to no-op silently.');
    process.exit(1);
  }

  const existing = await getExperiment(args.id);
  if (existing) {
    console.log(`Experiment "${args.id}" already exists (status=${existing.status}, exam_pack_id=${existing.exam_pack_id}). Nothing to do.`);
    console.log('Set VIDHYA_FIRE=on in the runtime environment to activate propagation — this script only creates the measurement row.');
    return;
  }

  const created = await createExperiment({
    id: args.id,
    name: 'FIRe-lite credit propagation (linear algebra)',
    exam_pack_id: args.examPackId,
    hypothesis: HYPOTHESIS,
    variant_kind: 'flag',
    metadata: { flag: 'VIDHYA_FIRE', flag_value: 'on', edge_type: 'encompasses', max_depth: 2 },
  });

  if (!created) {
    console.error('createExperiment returned null — DATABASE_URL was unset at call time. Nothing was created.');
    process.exit(1);
  }

  console.log(`Created experiment "${created.id}" (exam_pack_id=${created.exam_pack_id}, status=${created.status}).`);
  console.log('Next step: set VIDHYA_FIRE=on in the runtime environment. This script only creates the measurement row — it does not flip the flag.');
}

main().catch((err) => {
  console.error('activate-fire-experiment failed:', err);
  process.exit(1);
});
