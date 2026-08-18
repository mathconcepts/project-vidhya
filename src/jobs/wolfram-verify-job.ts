/**
 * wolfram-verify job — background verification of bundle problems via
 * Wolfram|Alpha, plus the step-by-step harvest (content-pipeline
 * realignment plan, Accepted Scope items 4 + 5).
 *
 * Wraps the logic of scripts/verify-wolfram-batch.ts through
 * src/services/wolfram-service.ts (NOT a rewrite of the service):
 *
 *   - rate-limited by WOLFRAM_RATE_MS between provider calls
 *   - capped by WOLFRAM_MAX_CALLS_PER_RUN (verification + steps calls
 *     share the cap); hitting the cap PAUSES the job with a resumable
 *     checkpoint (QuotaExhaustedError semantics)
 *   - checkpoint per problem
 *   - step harvest: when verification succeeds, request the
 *     step-by-step pods (the service already supports show_steps /
 *     podstate), capped separately by WOLFRAM_STEPS_MAX_PER_RUN, and
 *     cache to .data/wolfram-steps/<problem_id>.json with provenance
 *     {source:"wolfram", query_id, fetched_at}
 *   - refuses to start without WOLFRAM_APP_ID
 *
 * The bundle file is updated atomically after every state-changing item
 * so verified flags survive a pause/cancel/crash.
 */

import fs from 'fs';
import path from 'path';
import {
  registerJob,
  QuotaExhaustedError,
  ProviderTimeoutError,
  type JobContext,
  type JobDefinition,
} from './job-runner';
import { wolframSolve, verifyProblemWithWolfram } from '../services/wolfram-service';
import { writeWolframSteps, queryIdFor } from '../services/wolfram-steps-cache';
import { WOLFRAM_PER_CALL_USD } from '../generation/cost-meter';

export const WOLFRAM_VERIFY_JOB = 'wolfram-verify';

interface BundleProblem {
  id: string;
  question_text?: string;
  correct_answer?: string;
  wolfram_verified?: boolean;
  wolfram_verified_at?: string;
  [k: string]: unknown;
}

interface ContentBundle {
  problems: BundleProblem[];
  stats?: Record<string, unknown>;
  verified_at?: string;
  [k: string]: unknown;
}

/** Bundle path — override with VIDHYA_CONTENT_BUNDLE_PATH (tests). */
export function bundlePath(): string {
  return (
    process.env.VIDHYA_CONTENT_BUNDLE_PATH ||
    path.resolve(process.cwd(), 'frontend/public/data/content-bundle.json')
  );
}

/**
 * Skip heuristics mirrored from scripts/verify-wolfram-batch.ts
 * (shouldSkip). Kept in sync by the wolfram-verify job test; the script
 * stays a standalone CLI (it self-executes on import, so it cannot be
 * imported here).
 */
export function shouldSkipProblem(p: BundleProblem): string | null {
  if (!p.correct_answer || typeof p.correct_answer !== 'string') return 'no-correct-answer';
  const ans = p.correct_answer.trim();
  if (ans.length === 0) return 'empty-answer';
  if (ans.length > 100) return 'answer-too-long';

  const hasDigits = /\d/.test(ans);
  const hasMathOps = /[+\-*/^=√πΣ∫∂∇]|sin|cos|tan|log|exp|e\^|lim|sqrt|det|rank|Σ/.test(ans);
  if (!hasDigits && !hasMathOps) return 'narrative-answer';

  const qText = (p.question_text || '').toLowerCase();
  if (/requires|must be|are( the)?:|equals\b/.test(qText) && ans.length < 20 && !hasDigits) {
    return 'mcq-narrative';
  }
  return null;
}

// Injectable sleeper so tests can assert rate limiting without waiting.
let _sleep: (ms: number) => Promise<void> = (ms) => new Promise((r) => setTimeout(r, ms));

function isTimeoutError(message: string | undefined): boolean {
  if (!message) return false;
  return /abort|timed?[ -]?out/i.test(message);
}

function loadBundle(): ContentBundle {
  const file = bundlePath();
  if (!fs.existsSync(file)) {
    throw new Error(`content bundle not found at ${file} — run "npm run content:bundle" first`);
  }
  const parsed = JSON.parse(fs.readFileSync(file, 'utf-8')) as ContentBundle;
  if (!Array.isArray(parsed.problems)) {
    throw new Error(`content bundle at ${file} has no problems[] array`);
  }
  return parsed;
}

function saveBundle(bundle: ContentBundle): void {
  const file = bundlePath();
  const tmp = `${file}.tmp-${process.pid}`;
  fs.writeFileSync(tmp, JSON.stringify(bundle, null, 2));
  fs.renameSync(tmp, file);
}

async function run(ctx: JobContext): Promise<void> {
  const bundle = loadBundle();
  const skipped: Record<string, number> = {};
  const candidates: BundleProblem[] = [];
  for (const p of bundle.problems) {
    if (p.wolfram_verified) continue;
    const reason = shouldSkipProblem(p);
    if (reason) {
      skipped[reason] = (skipped[reason] || 0) + 1;
      continue;
    }
    if (!p.id) continue; // checkpoints key on the problem id
    candidates.push(p);
  }
  ctx.log(
    `bundle: ${bundle.problems.length} problems, ` +
    `${bundle.problems.filter((p) => p.wolfram_verified).length} already verified, ` +
    `${candidates.length} candidates (pre-skipped: ${JSON.stringify(skipped)})`,
  );

  let wolframCalls = 0;
  let stepsHarvested = 0;

  const rateLimitedCall = async <T>(fn: () => Promise<T>): Promise<T> => {
    if (wolframCalls > 0) await _sleep(ctx.limits.wolfram_rate_ms);
    wolframCalls++;
    return fn();
  };

  await ctx.processItems(
    candidates.map((p) => ({ key: p.id, problem: p })),
    async ({ problem: p }) => {
      if (wolframCalls >= ctx.limits.wolfram_max_calls_per_run) {
        throw new QuotaExhaustedError(
          `WOLFRAM_MAX_CALLS_PER_RUN reached (${wolframCalls}/${ctx.limits.wolfram_max_calls_per_run}) — ` +
          `job paused with a resumable checkpoint; restart to continue`,
        );
      }

      const result = await rateLimitedCall(() =>
        verifyProblemWithWolfram(p.question_text || '', p.correct_answer || ''),
      );
      ctx.recordProviderCall('wolfram', !result.error, WOLFRAM_PER_CALL_USD);

      if (result.error && isTimeoutError(result.error)) {
        // Runner retries this item ×2, then skips-and-records.
        throw new ProviderTimeoutError(`wolfram timeout for ${p.id}: ${result.error}`);
      }

      // Tri-state: 'inconclusive' means the ARBITER had no opinion (outage,
      // no key, timeout-that-slipped-through, empty result) — it is not a
      // content verdict and must not read like one. Recorded under its own
      // `outcome` field (never named `status` — that key already belongs to
      // the checkpoint's own done/failed/skipped state) so operators can
      // tell "Wolfram is down" apart from "the answer is wrong" in the
      // checkpoint + logs. Both leave `wolfram_verified` unset, so the item
      // is naturally a re-verify candidate on the next full job run — this
      // is what "queued for re-verify, not demoted/discarded" means here;
      // there is no separate rejected-items store to demote it out of.
      if (result.status === 'inconclusive') {
        ctx.log(
          `${p.id}: Wolfram inconclusive (arbiter unavailable/no answer: ` +
          `${result.error ?? 'no answer'}) — queued for re-verify, not rejected`,
        );
        return {
          verified: false,
          outcome: 'inconclusive',
          wolfram_answer: result.wolfram_answer ?? null,
          ...(result.error ? { error: result.error } : {}),
        };
      }

      if (!result.verified) {
        return {
          verified: false,
          outcome: 'failed',
          wolfram_answer: result.wolfram_answer ?? null,
          ...(result.error ? { error: result.error } : {}),
        };
      }

      p.wolfram_verified = true;
      p.wolfram_verified_at = new Date().toISOString();
      bundle.stats = bundle.stats || {};
      bundle.stats.wolfram_verified = bundle.problems.filter((x) => x.wolfram_verified).length;
      bundle.verified_at = new Date().toISOString();
      saveBundle(bundle);

      // ── Step harvest (item 5) — only for verified problems, capped
      // separately by WOLFRAM_STEPS_MAX_PER_RUN, sharing the global
      // call cap + rate limiter. Failures here never undo verification.
      let steps_cached = false;
      if (
        stepsHarvested < ctx.limits.wolfram_steps_max_per_run &&
        wolframCalls < ctx.limits.wolfram_max_calls_per_run
      ) {
        const query = p.question_text || '';
        const stepRes = await rateLimitedCall(() => wolframSolve(query, { show_steps: true }));
        ctx.recordProviderCall('wolfram', !stepRes.error, WOLFRAM_PER_CALL_USD);
        if (!stepRes.error && stepRes.steps.length > 0) {
          const ok = writeWolframSteps(p.id, {
            problem_id: p.id,
            query,
            steps: stepRes.steps,
            answer: stepRes.answer,
            provenance: {
              source: 'wolfram',
              query_id: queryIdFor(query),
              fetched_at: new Date().toISOString(),
            },
          });
          if (ok) {
            stepsHarvested++;
            steps_cached = true;
          }
        }
      }

      return { verified: true, outcome: 'verified', steps_cached };
    },
  );

  const totalVerified = bundle.problems.filter((p) => p.wolfram_verified).length;
  bundle.stats = bundle.stats || {};
  bundle.stats.wolfram_verified = totalVerified;
  bundle.verified_at = new Date().toISOString();
  saveBundle(bundle);
  ctx.log(
    `done: ${totalVerified}/${bundle.problems.length} bundle problems verified, ` +
    `${stepsHarvested} step-by-step solution(s) cached this run`,
  );
}

export const wolframVerifyJob: JobDefinition = {
  name: WOLFRAM_VERIFY_JOB,
  description:
    'Verify bundle problems against Wolfram|Alpha (rate-limited, capped, checkpointed) and harvest step-by-step solutions into .data/wolfram-steps/',
  preflight(): string | null {
    if (!process.env.WOLFRAM_APP_ID) {
      return (
        'WOLFRAM_APP_ID is not set — the wolfram-verify job refuses to start. ' +
        'Set WOLFRAM_APP_ID (Wolfram|Alpha Full Results API app id) and retry.'
      );
    }
    return null;
  },
  run,
};

registerJob(wolframVerifyJob);

export const __testing = {
  setSleepForTests(fn: (ms: number) => Promise<void>): () => void {
    const prev = _sleep;
    _sleep = fn;
    return () => { _sleep = prev; };
  },
};
