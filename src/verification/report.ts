/**
 * src/verification/report.ts
 *
 * "How much of what we serve students has actually been checked, and by
 * what?" — the pass-rate report the readiness ledger (29 Aug 2026) asked
 * for: "the number that matters is the pass rate, not the item count...
 * publish the sampling rate rather than claiming total coverage."
 *
 * Reads TWO separate, real, already-committed data sources — there is no
 * single unified verification ledger today, so this computes live from
 * both rather than trusting either alone:
 *
 *   1. data/practice-items/*.json — 505 hand-authored items. Each carries
 *      a free-text `verification_method` (a dual-method cross-check label,
 *      e.g. "hand_checkable_triangular_diagonal") stamped when the item
 *      was authored. This is real, but it is a HAND cross-check, not an
 *      automated re-run — coverage here means "was documented how it was
 *      checked," not "was swept by the Wolfram job."
 *
 *   2. frontend/public/data/content-bundle.json — 756 problems (PYQs plus,
 *      as of the live-QA practice-pool fix, the 505-item practice-items
 *      bank folded in too — see build-content-bundle.ts's
 *      collectPracticeItems()). Each carries a boolean `wolfram_verified`,
 *      set only by src/jobs/wolfram-verify-job.ts actually running. As of
 *      this report's first run, that number is 0/756 — the automated sweep
 *      exists in code (wired into the nightly contentPipelineNightly job,
 *      gated off by CONTENT_CRON_ENABLED) but has never executed in this
 *      environment.
 *
 * Deliberately does NOT invent a "quarantine" list for content-bundle.json —
 * per src/jobs/wolfram-verify-job.ts's own contract, a problem that hasn't
 * been swept yet is "not yet attempted," not "failed." Nothing persists a
 * per-item failure ledger across runs today (verify-sweep's own SKILL.md:
 * "no verification_audit_log table, no quarantine_problems table"). This
 * report states that plainly rather than fabricating a quarantine count.
 *
 * Pure, synchronous, no network calls — safe to call from an HTTP handler
 * on every request; the underlying files are small (<1MB) and read once.
 */

import fs from 'fs';
import path from 'path';

export interface VerificationReport {
  generated_at: string;
  practice_bank: {
    total_items: number;
    bank_count: number;
    with_verification_method: number;
    without_verification_method: number;
    hand_checkable_count: number;
    other_method_count: number;
    per_bank: Array<{ file: string; item_count: number }>;
    /** Items with NO verification_method at all — a real gap, not "never swept." */
    unmethoded_sample: Array<{ id: string; bank: string }>;
  };
  content_bundle: {
    total_problems: number;
    wolfram_verified: number;
    never_yet_swept: number;
    by_topic: Record<string, { total: number; wolfram_verified: number }>;
  };
  headline: {
    /** % of the 505-item hand-authored bank with a documented verification method. */
    hand_verified_coverage_pct: number;
    /** % of the content-bundle.json problems that has passed the automated Wolfram sweep. */
    automated_sweep_coverage_pct: number;
  };
  /** Honest non-data, same pattern as src/operator/dashboard.ts's caveats array. */
  caveats: string[];
}

// cwd-relative, matching src/lib/flat-file-store.ts's convention — every
// job/script in this repo is invoked from the repo root. Overridable via
// computeVerificationReport()'s options, mainly so tests can point at a
// scratch directory without a process.cwd() dance.
const DEFAULT_PRACTICE_ITEMS_DIR = path.resolve(process.cwd(), 'data', 'practice-items');
const DEFAULT_CONTENT_BUNDLE_PATH = path.resolve(process.cwd(), 'frontend', 'public', 'data', 'content-bundle.json');

interface AuthoredItemLite {
  id?: string;
  verification_method?: string;
}

interface BundleProblemLite {
  id?: string;
  topic?: string;
  wolfram_verified?: boolean;
}

function pct(numerator: number, denominator: number): number {
  if (denominator === 0) return 0;
  return Math.round((numerator / denominator) * 1000) / 10; // one decimal place
}

export function computeVerificationReport(opts?: {
  practiceItemsDir?: string;
  contentBundlePath?: string;
}): VerificationReport {
  const practiceItemsDir = opts?.practiceItemsDir ?? DEFAULT_PRACTICE_ITEMS_DIR;
  const contentBundlePath = opts?.contentBundlePath ?? DEFAULT_CONTENT_BUNDLE_PATH;
  const caveats: string[] = [];

  // ─── Practice bank (data/practice-items/*.json) ───────────────────────
  let bankFiles: string[] = [];
  try {
    bankFiles = fs.readdirSync(practiceItemsDir).filter(f => f.endsWith('.json'));
  } catch (e: any) {
    caveats.push(`practice-items directory unreadable: ${e?.message ?? 'unknown'}`);
  }

  let total_items = 0;
  let with_verification_method = 0;
  let hand_checkable_count = 0;
  const per_bank: Array<{ file: string; item_count: number }> = [];
  const unmethoded_sample: Array<{ id: string; bank: string }> = [];

  for (const file of bankFiles) {
    try {
      const raw = fs.readFileSync(path.join(practiceItemsDir, file), 'utf-8');
      const parsed = JSON.parse(raw);
      const items: AuthoredItemLite[] = Array.isArray(parsed?.items) ? parsed.items : [];
      per_bank.push({ file, item_count: items.length });
      total_items += items.length;
      for (const item of items) {
        const method = item.verification_method;
        if (typeof method === 'string' && method.trim().length > 0) {
          with_verification_method++;
          if (method.startsWith('hand_checkable')) hand_checkable_count++;
        } else if (unmethoded_sample.length < 20) {
          unmethoded_sample.push({ id: item.id ?? '(no id)', bank: file });
        }
      }
    } catch (e: any) {
      caveats.push(`${file} unreadable or invalid JSON: ${e?.message ?? 'unknown'}`);
    }
  }

  // ─── Content bundle (frontend/public/data/content-bundle.json) ────────
  let content_bundle: VerificationReport['content_bundle'] = {
    total_problems: 0,
    wolfram_verified: 0,
    never_yet_swept: 0,
    by_topic: {},
  };
  try {
    const raw = fs.readFileSync(contentBundlePath, 'utf-8');
    const parsed = JSON.parse(raw);
    const problems: BundleProblemLite[] = Array.isArray(parsed?.problems) ? parsed.problems : [];
    const by_topic: Record<string, { total: number; wolfram_verified: number }> = {};
    let verified = 0;
    for (const p of problems) {
      const topic = p.topic ?? 'unknown';
      if (!by_topic[topic]) by_topic[topic] = { total: 0, wolfram_verified: 0 };
      by_topic[topic].total++;
      if (p.wolfram_verified) {
        verified++;
        by_topic[topic].wolfram_verified++;
      }
    }
    content_bundle = {
      total_problems: problems.length,
      wolfram_verified: verified,
      never_yet_swept: problems.length - verified,
      by_topic,
    };
  } catch (e: any) {
    caveats.push(`content-bundle.json unreadable: ${e?.message ?? 'unknown'} — run "npm run content:bundle" to generate it`);
  }

  if (content_bundle.total_problems > 0 && content_bundle.wolfram_verified === 0) {
    caveats.push(
      'The automated Wolfram sweep exists in code (src/jobs/wolfram-verify-job.ts, wired into the ' +
      'nightly contentPipelineNightly job) but has never run against this bundle — 0 of ' +
      `${content_bundle.total_problems} problems carry an automated pass. Run "npm run content:verify" ` +
      '(needs WOLFRAM_APP_ID) or enable CONTENT_CRON_ENABLED=true to change this number.',
    );
  }
  if (unmethoded_sample.length > 0) {
    caveats.push(
      `${unmethoded_sample.length >= 20 ? '20+' : unmethoded_sample.length} practice-bank item(s) have ` +
      'no documented verification_method at all — a real gap, distinct from the content-bundle items ' +
      'that simply have not been swept yet.',
    );
  }

  return {
    generated_at: new Date().toISOString(),
    practice_bank: {
      total_items,
      bank_count: bankFiles.length,
      with_verification_method,
      without_verification_method: total_items - with_verification_method,
      hand_checkable_count,
      other_method_count: with_verification_method - hand_checkable_count,
      per_bank,
      unmethoded_sample,
    },
    content_bundle,
    headline: {
      hand_verified_coverage_pct: pct(with_verification_method, total_items),
      automated_sweep_coverage_pct: pct(content_bundle.wolfram_verified, content_bundle.total_problems),
    },
    caveats,
  };
}
