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
import pg from 'pg';
import { computeLift } from '../experiments/lift';
import { listExperiments, updateExperimentStatus } from '../experiments/registry';
import { suggestRuns, type RunSuggestion } from '../generation/suggester';
import type {
  ExperimentRow,
  ExperimentStatus,
  GenerationRunConfig,
} from '../experiments/types';

const { Pool } = pg;
let _pool: pg.Pool | null = null;
function getPool(): pg.Pool | null {
  if (_pool) return _pool;
  if (!process.env.DATABASE_URL) return null;
  _pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 4 });
  return _pool;
}

// ============================================================================
// Public API
// ============================================================================

export interface LedgerRunResult {
  id: string;
  experiments_evaluated: number;
  promotions: number;
  demotions: number;
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
    suggestions: 0,
    digest_path: null,
    pr_url: null,
    duration_ms: 0,
  };

  const pool = getPool();
  if (!pool) {
    result.duration_ms = Date.now() - start;
    return result;
  }

  const cfg = { ...DEFAULTS, ...opts };

  await markLedgerRunRunning(pool, id);

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

  for (const exp of refreshed) {
    const lift = numOrNull(exp.lift_v1);
    const n = numOrNull(exp.lift_n);
    const pv = numOrNull(exp.lift_p);
    if (lift == null || n == null || pv == null) continue;
    if (n < cfg.n_min) continue;

    if (lift > cfg.win_lift_threshold && pv < cfg.p_threshold) {
      const decision: PromotionDecision = {
        kind: 'won',
        experiment: exp,
        lift,
        n,
        p: pv,
        targets: await fetchAtomTargets(pool, exp.id),
      };
      await applyPromotion(pool, decision);
      await updateExperimentStatus(exp.id, 'won');
      promotions.push(decision);
    } else if (lift < cfg.loss_lift_threshold && pv < cfg.p_threshold) {
      const decision: PromotionDecision = {
        kind: 'lost',
        experiment: exp,
        lift,
        n,
        p: pv,
        targets: await fetchAtomTargets(pool, exp.id),
      };
      await applyDemotion(pool, decision);
      await updateExperimentStatus(exp.id, 'lost');
      demotions.push(decision);
    }
  }
  result.promotions = promotions.length;
  result.demotions = demotions.length;

  // 3) Build suggestions from the just-decided experiments
  const baseConfigs = await loadRecentRunConfigs(pool, refreshed.map((e) => e.id));
  const suggestions = suggestRuns(refreshed, baseConfigs, {
    win_lift_threshold: cfg.win_lift_threshold,
    loss_lift_threshold: cfg.loss_lift_threshold,
    p_threshold: cfg.p_threshold,
    n_threshold: cfg.n_min,
  });
  for (const s of suggestions) {
    await upsertSuggestion(pool, s);
  }
  result.suggestions = suggestions.length;

  // 4) Write digest markdown
  if (!opts.no_digest) {
    const digest = buildDigest({
      runId: id,
      promotions,
      demotions,
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
    (promotions.length + demotions.length + suggestions.length > 0);

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

  await markLedgerRunComplete(pool, id, result, opts.no_digest ? buildDigest({
    runId: id, promotions, demotions, suggestions, evaluated: refreshed.length,
  }) : undefined);

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

async function fetchAtomTargets(pool: pg.Pool, experimentId: string): Promise<string[]> {
  const { rows } = await pool.query<{ target_id: string }>(
    `SELECT target_id
       FROM experiment_assignments
      WHERE experiment_id = $1
        AND target_kind = 'atom'
        AND variant <> 'control'`,
    [experimentId],
  );
  return rows.map((r) => r.target_id);
}

async function applyPromotion(pool: pg.Pool, d: PromotionDecision): Promise<void> {
  if (d.targets.length === 0) return;
  const reason = `lift_v1=+${d.lift.toFixed(4)} p=${d.p.toFixed(4)} n=${d.n} (exp=${d.experiment.id})`;

  await pool.query(
    `UPDATE atom_versions
       SET canonical = TRUE,
           canonical_at = NOW(),
           canonical_reason = $2
     WHERE atom_id = ANY($1::TEXT[])`,
    [d.targets, reason],
  );

  await pool.query(
    `UPDATE media_artifacts
       SET canonical = TRUE,
           canonical_at = NOW(),
           canonical_reason = $2
     WHERE atom_id = ANY($1::TEXT[]) AND status = 'done'`,
    [d.targets, reason],
  );

  // generated_problems uses `id`, not atom_id, but the experiment may
  // have assigned problem ids directly under the same target_kind=atom
  // bucket (we don't currently distinguish). Best-effort: try by id.
  await pool.query(
    `UPDATE generated_problems
       SET canonical = TRUE,
           canonical_at = NOW(),
           canonical_reason = $2
     WHERE id::TEXT = ANY($1::TEXT[]) AND verified = TRUE`,
    [d.targets, reason],
  );
}

async function applyDemotion(pool: pg.Pool, d: PromotionDecision): Promise<void> {
  if (d.targets.length === 0) return;
  const reason = `lift_v1=${d.lift.toFixed(4)} p=${d.p.toFixed(4)} n=${d.n} (exp=${d.experiment.id})`;

  // Flip media artifacts to 'failed' so applyMediaUrls skips them
  await pool.query(
    `UPDATE media_artifacts
       SET status = 'failed',
           canonical = FALSE,
           canonical_at = NOW(),
           canonical_reason = $2
     WHERE atom_id = ANY($1::TEXT[])`,
    [d.targets, reason],
  );

  // Mark atom_versions explicitly non-canonical (operator may regen)
  await pool.query(
    `UPDATE atom_versions
       SET canonical = FALSE,
           canonical_at = NOW(),
           canonical_reason = $2
     WHERE atom_id = ANY($1::TEXT[])`,
    [d.targets, reason],
  );
}

/**
 * Pull the most recent generation_runs.config for each experiment so the
 * suggester can scale or invert it.
 */
async function loadRecentRunConfigs(
  pool: pg.Pool,
  experimentIds: string[],
): Promise<Map<string, GenerationRunConfig>> {
  if (experimentIds.length === 0) return new Map();
  const { rows } = await pool.query<{
    experiment_id: string;
    config: GenerationRunConfig;
  }>(
    `SELECT DISTINCT ON (experiment_id) experiment_id, config
       FROM generation_runs
      WHERE experiment_id = ANY($1::TEXT[])
      ORDER BY experiment_id, created_at DESC`,
    [experimentIds],
  );
  const m = new Map<string, GenerationRunConfig>();
  for (const r of rows) m.set(r.experiment_id, r.config);
  return m;
}

async function upsertSuggestion(pool: pg.Pool, s: RunSuggestion): Promise<void> {
  await pool.query(
    `INSERT INTO run_suggestions (id, exam_pack_id, source_experiment_id, hypothesis, config, reason, expected_lift, expected_n)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     ON CONFLICT (id) DO UPDATE SET
       hypothesis = EXCLUDED.hypothesis,
       config     = EXCLUDED.config,
       reason     = EXCLUDED.reason,
       expected_lift = EXCLUDED.expected_lift,
       expected_n    = EXCLUDED.expected_n`,
    [
      s.id,
      s.exam_pack_id,
      s.source_experiment_id,
      s.hypothesis,
      JSON.stringify(s.config),
      s.reason,
      s.expected_lift,
      s.expected_n,
    ],
  );
}

async function markLedgerRunRunning(pool: pg.Pool, id: string): Promise<void> {
  await pool.query(
    `INSERT INTO ledger_runs (id, status) VALUES ($1, 'running')
     ON CONFLICT (id) DO NOTHING`,
    [id],
  );
}

async function markLedgerRunComplete(
  pool: pg.Pool,
  id: string,
  r: LedgerRunResult,
  digest?: string,
): Promise<void> {
  await pool.query(
    `UPDATE ledger_runs
        SET experiments_evaluated = $2,
            promotions = $3,
            demotions = $4,
            suggestions = $5,
            pr_url = $6,
            digest_md = COALESCE($7, digest_md),
            status = 'complete'
      WHERE id = $1`,
    [
      id,
      r.experiments_evaluated,
      r.promotions,
      r.demotions,
      r.suggestions,
      r.pr_url,
      digest ?? null,
    ],
  );
}

// ============================================================================
// Digest markdown
// ============================================================================

interface DigestInput {
  runId: string;
  evaluated: number;
  promotions: PromotionDecision[];
  demotions: PromotionDecision[];
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

  if (d.promotions.length + d.demotions.length + d.suggestions.length === 0) {
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
