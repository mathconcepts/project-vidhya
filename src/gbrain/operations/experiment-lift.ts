/**
 * src/gbrain/operations/experiment-lift.ts
 *
 * CLI: compute lift_v1 for one experiment.
 *
 * Usage:
 *   npx tsx src/gbrain/operations/experiment-lift.ts <experiment-id>
 *   npx tsx src/gbrain/operations/experiment-lift.ts <experiment-id> --window 14
 *   npx tsx src/gbrain/operations/experiment-lift.ts <experiment-id> --no-persist
 *   npx tsx src/gbrain/operations/experiment-lift.ts --list
 *   npx tsx src/gbrain/operations/experiment-lift.ts --list --exam gate-ma
 *
 * Reads:  experiments, experiment_assignments, mastery_snapshots
 * Writes: experiments.lift_* (unless --no-persist)
 */

import { computeLift } from '../../experiments/lift';
import { getExperiment, listExperiments } from '../../experiments/registry';

interface ParsedArgs {
  experimentId: string | null;
  windowDays: number;
  persist: boolean;
  list: boolean;
  examPackId?: string;
}

function parseArgs(argv: string[]): ParsedArgs {
  const args: ParsedArgs = {
    experimentId: null,
    windowDays: 7,
    persist: true,
    list: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--list') args.list = true;
    else if (a === '--no-persist') args.persist = false;
    else if (a === '--window') args.windowDays = Number(argv[++i] ?? 7);
    else if (a === '--exam') args.examPackId = argv[++i];
    else if (!a.startsWith('--')) args.experimentId = a;
  }
  return args;
}

function fmt(n: number, digits = 4): string {
  return Number.isFinite(n) ? n.toFixed(digits) : 'n/a';
}

async function main(): Promise<number> {
  const args = parseArgs(process.argv.slice(2));

  if (!process.env.DATABASE_URL) {
    console.error('✗ DATABASE_URL not set. The experiment spine requires a Postgres database.');
    return 1;
  }

  if (args.list) {
    const experiments = await listExperiments({
      exam_pack_id: args.examPackId,
      limit: 50,
    });
    if (experiments.length === 0) {
      console.log('No experiments found.');
      return 0;
    }
    console.log(`\nExperiments (${experiments.length})\n`);
    console.log(
      'ID                                  STATUS         LIFT       N      P    EXAM    NAME',
    );
    console.log(
      '----------------------------------- -------------- ---------- ------ ----- ------- ----',
    );
    for (const e of experiments) {
      console.log(
        [
          e.id.padEnd(35).slice(0, 35),
          e.status.padEnd(14),
          (e.lift_v1 != null ? fmt(e.lift_v1, 4) : '—       ').padEnd(10),
          String(e.lift_n ?? '—').padEnd(6),
          (e.lift_p != null ? fmt(e.lift_p, 3) : '—   ').padEnd(5),
          (e.exam_pack_id ?? '—').padEnd(7),
          e.name.slice(0, 60),
        ].join(' '),
      );
    }
    return 0;
  }

  if (!args.experimentId) {
    console.error('Usage: experiment-lift.ts <experiment-id> [--window 7] [--no-persist]');
    console.error('   or: experiment-lift.ts --list [--exam <id>]');
    return 2;
  }

  const exp = await getExperiment(args.experimentId);
  if (!exp) {
    console.error(`✗ Experiment not found: ${args.experimentId}`);
    return 1;
  }

  console.log(`\nExperiment: ${exp.name} (${exp.id})`);
  console.log(`Exam pack:  ${exp.exam_pack_id}`);
  console.log(`Status:     ${exp.status}`);
  console.log(`Started:    ${exp.started_at}`);
  console.log(`Hypothesis: ${exp.hypothesis ?? '(none)'}`);
  console.log(`Window:     ±${args.windowDays} days from start`);
  console.log(`Persist:    ${args.persist ? 'yes (writes to experiments.lift_*)' : 'no (--no-persist)'}`);
  console.log('');

  const result = await computeLift(args.experimentId, {
    window_days: args.windowDays,
    persist: args.persist,
  });

  if (!result) {
    console.error('✗ Lift computation failed (DB unreachable?)');
    return 1;
  }

  console.log('--- Result -----------------------------------------');
  console.log(`Lift:           ${fmt(result.lift, 4)}  (mastery delta, treatment − control)`);
  console.log(`Mean treatment: ${fmt(result.mean_treatment, 4)}  (n=${result.n_treatment})`);
  console.log(`Mean control:   ${fmt(result.mean_control, 4)}  (n=${result.n_control})`);
  console.log(`P-value:        ${fmt(result.p_value, 4)}  (Welch's t, two-sided, normal approx)`);
  console.log('');

  // Verdict heuristic — same thresholds as the planned learnings-ledger
  const total = result.n_treatment + result.n_control;
  if (total < 30) {
    console.log('Verdict: ⏳ insufficient data — need n ≥ 30 (currently ' + total + ')');
  } else if (result.lift > 0.05 && result.p_value < 0.05) {
    console.log('Verdict: ✅ likely WIN — promote candidates');
  } else if (result.lift < -0.02 && result.p_value < 0.05) {
    console.log('Verdict: ❌ likely LOSS — demote candidates');
  } else {
    console.log('Verdict: 🤷 inconclusive — keep running or end');
  }

  return 0;
}

void main()
  .then((code) => process.exit(code))
  .catch((err) => {
    console.error('Unhandled error:', err);
    process.exit(1);
  });
