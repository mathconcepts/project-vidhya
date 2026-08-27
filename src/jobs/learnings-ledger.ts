/**
 * src/jobs/learnings-ledger.ts
 *
 * Sprint C — closes the Content R&D Loop.
 *
 * Nightly job that:
 *
 *   1. Recomputes lift_v1 for every active experiment (uses src/experiments/lift)
 *   2. Promotes WINNERS  — experiments where lift > 0.05, p < 0.05, n ≥ 30:
 *        - mark experiments.status = 'won'
 *        - mark all atom-variant assignments' generated_problems / atom_versions /
 *          media_artifacts canonical = TRUE
 *   3. Demotes LOSERS — experiments where lift < -0.02, p < 0.05, n ≥ 30:
 *        - mark experiments.status = 'lost'
 *        - flip media_artifacts.status = 'failed' for the assigned atoms (so the
 *          serving path stops returning their sidecars)
 *   4. Generates SUGGESTIONS via src/generation/suggester
 *        - upserts into run_suggestions table (operator inbox)
 *   5. Writes a markdown digest to docs/learnings/<YYYY-Www>.md
 *   6. Once per week (Sunday only by default), opens a PR via GitHub MCP if
 *      there are state changes to report
 *
 * Lifecycle is logged in `ledger_runs` so we can audit "what did the loop
 * decide and when".
 *
 * Runs through the same DB-less safety net as other jobs: every public
 * function is a no-op when DATABASE_URL is unset.
 *
 * Wired into src/jobs/scheduler.ts as `learningsLedger` (daily). The PR
 * step is gated by VIDHYA_LEDGER_PR=on (default off) so dev/local boots
 * don't spam the repo.
 */

import { execSync } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { computeLift } from '../experiments/lift';
import { listExperiments, updateExperimentStatus } from '../experiments/registry';
import { suggestRuns, type RunSuggestion } from '../generation/suggester';
import {
  immediateLiftFlatRetention,
  modeSplitRegression,
  speedUpErrorsUp,
} from '../experiments/promote-guards';
import type {
  ExperimentRow,
  ExperimentStatus,
  GenerationRunConfig,
} from '../experiments/types';
import { getLearningsLedgerRepo, type LearningsLedgerRepo } from '../storage/repositories/learnings-ledger-repo';

// ============================================================================
// Public API
// ============================================================================

export interface LedgerRunResult {
  id: string;
  experiments_evaluated: number;
  promotions: number;
  demotions: number;
  /** W1.6 — would-be promotions an anti-gaming guard held for operator review instead of auto-promoting. */
  held_for_review: number;
  suggestions: number;
  digest_path: string | null;
  pr_url: string | null;
  duration_ms: number;
}

export interface LedgerOptions {
  /** Lift > this AND p < p_threshold AND n ≥ n_min → promote. Default 0.05. */
  win_lift_threshold?: number;
  /** Lift < this AND p < p_threshold AND n ≥ n_min → demote. Default -0.02. */
  loss_lift_threshold?: number;
  p_threshold?: number;
  n_min?: number;
  window_days?: number;
  /** Restrict to a single exam pack. Default: all. */
  exam_pack_id?: string;
  /** Skip the PR step regardless of weekday. Default false. */
  no_pr?: boolean;
  /** Skip writing the markdown file (in-memory dry-run). Default false. */
  no_digest?: boolean;
  /** Force the PR step even mid-week. Default false. */
  force_pr?: boolean;
}

const DEFAULTS = Object.freeze({
  win_lift_threshold: 0.05,
  loss_lift_threshold: -0.02,
  p_threshold: 0.05,
  n_min: 30,
  window_days: 7,
} as const);

export async function runLearningsLedger(
  opts: LedgerOptions = {},
): Promise<LedgerRunResult> {
  const start = Date.now();
  const id = `ledger_${new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14)}`;
  const result: LedgerRunResult = {
    id,
    experiments_evaluated: 0,
    promotions: 0,
    demotions: 0,
    held_for_review: 0,
    suggestions: 0,
    digest_path: null,
    pr_url: null,
    duration_ms: 0,
  };

  const repo = getLearningsLedgerRepo();
  if (!repo) {
    result.duration_ms = Date.now() - start;
    return result;
  }

  const cfg = { ...DEFAULTS, ...opts };

  await repo.markLedgerRunRunning(id);

  // 1) Pull active experiments
  const experiments = await listExperiments({
    exam_pack_id: cfg.exam_pack_id,
    limit: 500,
  });
  const active = experiments.filter((e) => e.status === 'active');

  // 2) Recompute lift for each
  const promotions: PromotionDecision[] = [];
  const demotions: PromotionDecision[] = [];

  for (const exp of active) {
    try {
      await computeLift(exp.id, { window_days: cfg.window_days, persist: true });
    } catch {
      continue;
    }
  }

  // Re-read after recompute so we have fresh lift columns
  const refreshed = await listExperiments({
    exam_pack_id: cfg.exam_pack_id,
    status: 'active',
    limit: 500,
  });
  result.experiments_evaluated = refreshed.length;

  // Fetched here (moved up from step 3) so a guard-triggered review
  // suggestion (W1.6, below) can reuse the SAME config lookup the
  // ride-win/confirm-win/recover-loss suggester rules already make —
  // never a second query for the same experiment ids.
  const runConfigRows = await repo.loadRecentRunConfigs(refreshed.map((e) => e.id));
  const baseConfigs = new Map<string, GenerationRunConfig>(
    runConfigRows.map((r) => [r.experiment_id, r.config as GenerationRunConfig]),
  );

  const held: HeldDecision[] = [];

  for (const exp of refreshed) {
    const lift = numOrNull(exp.lift_v1);
    const n = numOrNull(exp.lift_n);
    const pv = numOrNull(exp.lift_p);
    if (lift == null || n == null || pv == null) continue;
    if (n < cfg.n_min) continue;

    if (lift > cfg.win_lift_threshold && pv < cfg.p_threshold) {
      // W1.6 — anti-gaming guards run over cohort-aggregate data the
      // ledger already reads (mastery_snapshots + attempt_facts) BEFORE
      // any promotion side-effect. A tripped guard redirects into an
      // operator-review suggestion instead of auto-promoting; it does NOT
      // demote or otherwise touch the experiment's status — the next
      // night's run reconsiders it exactly like any other active
      // experiment, so more data can clear the guard on its own.
      const trippedGuards = await evaluateAntiGamingGuards(repo, exp, lift, n, cfg.window_days);
      if (trippedGuards.length > 0) {
        held.push({ experiment: exp, lift, n, p: pv, trippedGuards });
        const baseConfig = baseConfigs.get(exp.id);
        if (baseConfig) {
          await repo.upsertSuggestion(reviewSuggestion(exp, lift, n, baseConfig, trippedGuards));
        }
        continue;
      }

      const decision: PromotionDecision = {
        kind: 'won',
        experiment: exp,
        lift,
        n,
        p: pv,
        targets: await repo.fetchAtomTargets(exp.id),
      };
      await repo.applyPromotion(decision.targets, promotionReason(decision));
      await updateExperimentStatus(exp.id, 'won');
      promotions.push(decision);
    } else if (lift < cfg.loss_lift_threshold && pv < cfg.p_threshold) {
      const decision: PromotionDecision = {
        kind: 'lost',
        experiment: exp,
        lift,
        n,
        p: pv,
        targets: await repo.fetchAtomTargets(exp.id),
      };
      await repo.applyDemotion(decision.targets, demotionReason(decision));
      await updateExperimentStatus(exp.id, 'lost');
      demotions.push(decision);
    }
  }
  result.promotions = promotions.length;
  result.demotions = demotions.length;
  result.held_for_review = held.length;

  // 3) Build suggestions from the just-decided experiments
  const suggestions = suggestRuns(refreshed, baseConfigs, {
    win_lift_threshold: cfg.win_lift_threshold,
    loss_lift_threshold: cfg.loss_lift_threshold,
    p_threshold: cfg.p_threshold,
    n_threshold: cfg.n_min,
  });
  for (const s of suggestions) {
    await repo.upsertSuggestion(s);
  }
  // held.length review suggestions were already upserted above, inside the
  // promote loop — counted separately (result.held_for_review) since they
  // are a hold, not a follow-up run suggestion of the suggestRuns() kind.
  result.suggestions = suggestions.length;

  // 4) Write digest markdown
  if (!opts.no_digest) {
    const digest = buildDigest({
      runId: id,
      promotions,
      demotions,
      held,
      suggestions,
      evaluated: refreshed.length,
    });
    result.digest_path = await writeDigest(digest);
  }

  // 5) Optionally open PR (Sunday by default, or with --force_pr)
  const today = new Date();
  const isSunday = today.getUTCDay() === 0;
  const wantPr =
    process.env.VIDHYA_LEDGER_PR === 'on' &&
    !opts.no_pr &&
    (isSunday || opts.force_pr === true) &&
    (promotions.length + demotions.length + held.length + suggestions.length > 0);

  if (wantPr && result.digest_path) {
    try {
      result.pr_url = await openLedgerPR(result.digest_path, {
        promotions,
        demotions,
        suggestions,
        runId: id,
      });
    } catch (e: any) {
      console.error(`[ledger] PR step failed: ${e?.message ?? e}`);
    }
  }

  await repo.markLedgerRunComplete({
    id,
    experiments_evaluated: result.experiments_evaluated,
    promotions: result.promotions,
    demotions: result.demotions,
    suggestions: result.suggestions,
    pr_url: result.pr_url,
    digest: opts.no_digest ? buildDigest({
      runId: id, promotions, demotions, held, suggestions, evaluated: refreshed.length,
    }) : undefined,
  });

  result.duration_ms = Date.now() - start;
  return result;
}

// ============================================================================
// Internals
// ============================================================================

interface PromotionDecision {
  kind: 'won' | 'lost';
  experiment: ExperimentRow;
  lift: number;
  n: number;
  p: number;
  /** atom_id list assigned to this experiment with non-control variants. */
  targets: string[];
}

/** Matches the pre-migration inline format exactly — a leading '+' since win lift is always positive. */
function promotionReason(d: PromotionDecision): string {
  return `lift_v1=+${d.lift.toFixed(4)} p=${d.p.toFixed(4)} n=${d.n} (exp=${d.experiment.id})`;
}

/** Matches the pre-migration inline format exactly — no leading '+', loss lift is already negative. */
function demotionReason(d: PromotionDecision): string {
  return `lift_v1=${d.lift.toFixed(4)} p=${d.p.toFixed(4)} n=${d.n} (exp=${d.experiment.id})`;
}

// ============================================================================
// W1.6 — anti-gaming guards
// ============================================================================

/** A would-be promotion an anti-gaming guard held for operator review. */
interface HeldDecision {
  experiment: ExperimentRow;
  lift: number;
  n: number;
  p: number;
  /** Every guard that tripped — usually one, but a run can trip more than one at once. */
  trippedGuards: Array<{ name: string; reason: string }>;
}

/**
 * Runs all three W1.6 guards for one would-be-won experiment, over cohort-
 * aggregate data fetched from the repo (mastery_snapshots + attempt_facts).
 * Every fetch is best-effort (never throws — see the repo's own header);
 * a guard with no usable data returns not-tripped with an 'insufficient
 * data' reason, so a DB-less deploy or a young experiment promotes exactly
 * as it did before this plan.
 */
async function evaluateAntiGamingGuards(
  repo: LearningsLedgerRepo,
  exp: ExperimentRow,
  lift: number,
  n: number,
  windowDays: number,
): Promise<Array<{ name: string; reason: string }>> {
  const [delayed, modeSplit, speed] = await Promise.all([
    repo.fetchDelayedRetention(exp.id, exp.exam_pack_id, exp.started_at, windowDays),
    repo.fetchModeSplitAccuracy(exp.id, exp.exam_pack_id, exp.started_at, windowDays),
    repo.fetchSpeedAccuracy(exp.id, exp.exam_pack_id, exp.started_at, windowDays),
  ]);

  const tripped: Array<{ name: string; reason: string }> = [];

  const g1 = immediateLiftFlatRetention({
    liftV1: lift, liftN: n,
    delayedMasteryDelta: delayed?.delta ?? null, delayedN: delayed?.n ?? null,
  });
  if (g1.tripped) tripped.push({ name: 'immediate_lift_flat_retention', reason: g1.reason });

  const g2 = modeSplitRegression({ byKind: modeSplit });
  if (g2.tripped) tripped.push({ name: 'mode_split_regression', reason: g2.reason });

  const g3 = speedUpErrorsUp({
    meanBucketIndexPre: speed?.meanBucketIndexPre ?? null,
    meanBucketIndexPost: speed?.meanBucketIndexPost ?? null,
    accuracyPre: speed?.accuracyPre ?? null,
    accuracyPost: speed?.accuracyPost ?? null,
    n: speed?.n ?? null,
  });
  if (g3.tripped) tripped.push({ name: 'speed_up_errors_up', reason: g3.reason });

  return tripped;
}

/**
 * The operator-review `run_suggestions` row for a guard-held experiment.
 * Deterministic id (`sugg_review_<exp.id>`) — mirrors suggestRuns()'s own
 * id scheme, idempotent via upsertSuggestion's ON CONFLICT. Reuses the
 * experiment's own most-recent generation-run config unchanged (the same
 * "no baseConfig → no suggestion row" discipline suggestRuns() already
 * follows) — this suggestion is "review before promoting", not a proposal
 * to change anything about the run itself.
 */
function reviewSuggestion(
  exp: ExperimentRow,
  lift: number,
  n: number,
  baseConfig: GenerationRunConfig,
  trippedGuards: Array<{ name: string; reason: string }>,
): { id: string; exam_pack_id: string; source_experiment_id: string; hypothesis: string; config: GenerationRunConfig; reason: string; expected_lift: number | null; expected_n: number | null } {
  return {
    id: `sugg_review_${exp.id}`,
    exam_pack_id: exp.exam_pack_id,
    source_experiment_id: exp.id,
    hypothesis: `Review before promoting: ${exp.hypothesis ?? exp.name}`,
    config: baseConfig,
    reason:
      `Lift +${lift.toFixed(4)} (n=${n}) would have promoted, but ${trippedGuards.length === 1 ? 'a guard' : `${trippedGuards.length} guards`} ` +
      `tripped: ${trippedGuards.map((g) => `${g.name} — ${g.reason}`).join(' | ')}`,
    expected_lift: lift,
    expected_n: n,
  };
}

// fetchAtomTargets / applyPromotion / applyDemotion / loadRecentRunConfigs /
// upsertSuggestion / markLedgerRunRunning / markLedgerRunComplete moved to
// src/storage/repositories/learnings-ledger-repo.ts (CEO plan Phase 0 §5.1
// storage boundary) — same SQL, called via `repo.*` in runLearningsLedger()
// above. promotionReason()/demotionReason() (just above) carry the reason
// string formatting that used to live inline in applyPromotion/applyDemotion.

// ============================================================================
// Digest markdown
// ============================================================================

interface DigestInput {
  runId: string;
  evaluated: number;
  promotions: PromotionDecision[];
  demotions: PromotionDecision[];
  held: HeldDecision[];
  suggestions: RunSuggestion[];
}

function buildDigest(d: DigestInput): string {
  const today = new Date();
  const yearWeek = isoYearWeek(today);

  let md = `# Learnings ${yearWeek}\n\n`;
  md += `Generated by the nightly learnings-ledger job (\`${d.runId}\`).\n\n`;
  md += `**Active experiments evaluated:** ${d.evaluated}\n\n`;
  md += `| Decisions | Count |\n|---|---|\n`;
  md += `| Promotions | ${d.promotions.length} |\n`;
  md += `| Demotions  | ${d.demotions.length} |\n`;
  md += `| Held for review | ${d.held.length} |\n`;
  md += `| Suggestions | ${d.suggestions.length} |\n\n`;

  if (d.promotions.length > 0) {
    md += `## ✅ Promoted (canonical=true)\n\n`;
    md += `| Experiment | Lift | n | p | Atoms |\n|---|---|---|---|---|\n`;
    for (const p of d.promotions) {
      md += `| ${escMd(p.experiment.name)} | +${p.lift.toFixed(4)} | ${p.n} | ${p.p.toFixed(4)} | ${p.targets.length} |\n`;
    }
    md += `\n`;
  }

  if (d.demotions.length > 0) {
    md += `## ❌ Demoted (status=failed)\n\n`;
    md += `| Experiment | Lift | n | p | Atoms |\n|---|---|---|---|---|\n`;
    for (const p of d.demotions) {
      md += `| ${escMd(p.experiment.name)} | ${p.lift.toFixed(4)} | ${p.n} | ${p.p.toFixed(4)} | ${p.targets.length} |\n`;
    }
    md += `\n`;
  }

  if (d.held.length > 0) {
    md += `## 🛑 Held for review (W1.6 anti-gaming guard)\n\n`;
    md += `Would have promoted on lift alone; an anti-gaming guard held it instead. ` +
          `See \`/admin/content-rd\` for the review suggestion (where a launchable config exists).\n\n`;
    for (const h of d.held) {
      md += `### ${escMd(h.experiment.name)}\n\n`;
      md += `- **Lift:** +${h.lift.toFixed(4)} (n=${h.n}, p=${h.p.toFixed(4)})\n`;
      for (const g of h.trippedGuards) {
        md += `- **Guard \`${g.name}\`:** ${escMd(g.reason)}\n`;
      }
      md += `\n`;
    }
  }

  if (d.suggestions.length > 0) {
    md += `## 📈 Suggested follow-up runs\n\n`;
    md += `Pending operator approval at \`/admin/content-rd\`.\n\n`;
    for (const s of d.suggestions) {
      md += `### ${escMd(s.hypothesis)}\n\n`;
      md += `- **Source:** \`${s.source_experiment_id}\`\n`;
      md += `- **Reason:** ${escMd(s.reason)}\n`;
      md += `- **Config:** \`count=${s.config.quota.count}\`, ` +
            `\`tier=${s.config.verification.tier_ceiling}\`, ` +
            `\`max_cost=$${s.config.quota.max_cost_usd.toFixed(2)}\`\n\n`;
    }
  }

  if (d.promotions.length + d.demotions.length + d.held.length + d.suggestions.length === 0) {
    md += `_No state changes this run. Loop is healthy; experiments still need more cohort time._\n`;
  }

  // PR-B: append the rate-limit table from the most recent on-disk
  // checkpoint. Hourly rateLimitCheckpoint job writes it; we just
  // append. Soft-fail if the file is missing (telemetry never blocks
  // the digest).
  try {
    // Lazy import keeps the digest module light + avoids cycles.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { readCheckpoint, renderDigestSection } = require('../llm/rate-limit-tracker');
    const snap = readCheckpoint();
    if (snap) md += '\n' + renderDigestSection(snap);
  } catch { /* ignore — telemetry never blocks the digest */ }

  return md;
}

async function writeDigest(md: string): Promise<string> {
  const dir = path.resolve(process.cwd(), 'docs', 'learnings');
  await fs.mkdir(dir, { recursive: true });
  const file = `${isoYearWeek(new Date())}.md`;
  const filePath = path.join(dir, file);
  await fs.writeFile(filePath, md, 'utf8');
  return path.relative(process.cwd(), filePath);
}

function isoYearWeek(d: Date): string {
  // ISO 8601 year + week number, zero-padded.
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${date.getUTCFullYear()}-W${week.toString().padStart(2, '0')}`;
}

function escMd(s: string): string {
  return s.replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
}

function numOrNull(x: unknown): number | null {
  if (x == null) return null;
  const n = typeof x === 'number' ? x : Number(x);
  return Number.isFinite(n) ? n : null;
}

// ============================================================================
// Optional GitHub PR opener
// ============================================================================

interface OpenPrInput {
  runId: string;
  promotions: PromotionDecision[];
  demotions: PromotionDecision[];
  suggestions: RunSuggestion[];
}

async function openLedgerPR(digestRelPath: string, _input: OpenPrInput): Promise<string | null> {
  // Uses the gh CLI when available — keeps this module free of MCP deps so
  // it works in cron contexts. Set GITHUB_TOKEN in the environment.
  const yearWeek = isoYearWeek(new Date());
  const branch = `chore/learnings-${yearWeek}-${_input.runId.slice(-6)}`;
  const title = `chore: Learnings ${yearWeek}`;
  const body =
    `Auto-generated by the nightly learnings-ledger.\n\n` +
    `See \`${digestRelPath}\` for the digest. Promotions: ${_input.promotions.length} · ` +
    `Demotions: ${_input.demotions.length} · Suggestions: ${_input.suggestions.length}.`;

  try {
    execSync(`git checkout -b ${branch}`, { stdio: 'pipe' });
    execSync(`git add ${digestRelPath}`, { stdio: 'pipe' });
    execSync(`git -c user.name='vidhya-ledger' -c user.email='ledger@vidhya.local' commit -m ${shellEscape(title)} --no-verify`, { stdio: 'pipe' });
    execSync(`git push origin ${branch}`, { stdio: 'pipe' });
    const out = execSync(`gh pr create --title ${shellEscape(title)} --body ${shellEscape(body)} --base main --head ${branch}`, { stdio: 'pipe' }).toString().trim();
    // Switch back to whatever we were on
    execSync(`git checkout -`, { stdio: 'pipe' });
    return out || null;
  } catch (e: any) {
    console.error(`[ledger] git/gh failed: ${e?.message ?? e}`);
    try { execSync(`git checkout -`, { stdio: 'pipe' }); } catch { /* ignore */ }
    return null;
  }
}

function shellEscape(s: string): string {
  return `'${s.replace(/'/g, "'\\''")}'`;
}

// Exported for tests
export const __testing = { buildDigest, isoYearWeek, escMd };
