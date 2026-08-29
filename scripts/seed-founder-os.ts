// @ts-nocheck
/**
 * Seed the "Complete AND Paid" 90-day OS from the readiness ledger.
 *
 * Source: the readiness & options register dated 29 August 2026
 * (5 gaps, the consolidated funding/revenue register, and the 10-week
 * build order). Run once, after this feature is deployed:
 *
 *   npx tsx scripts/seed-founder-os.ts
 *
 * Idempotent — skips any milestone whose title already exists in the
 * plan, so re-running after editing this file only adds what's new.
 * Matches the shell-access-gated pattern of scripts/admin/assign-owner.ts:
 * this touches the same flat-file store directly, no HTTP round-trip.
 */

import {
  listMilestones,
  createMilestone,
  updateSettings,
  DEFAULT_PLAN_ID,
} from '../src/operator/founder-os';

const WINDOW_START = '2026-08-29T00:00:00.000Z'; // the ledger's own date

interface SeedMilestone {
  title: string;
  description: string;
  category: string;
  target_date: string; // YYYY-MM-DD
}

// Loopable = a script or scheduled job can carry this out end-to-end once
// launched; manual = needs a human decision, an external party, or a
// one-time irreversible action. Stated explicitly in each description so
// the founder page shows it, not just this file.
const MILESTONES: SeedMilestone[] = [
  {
    title: 'Read the STACK codebase and docs',
    description: '[Manual] One-sentence-delta check before building Gap 1 — STACK (GPL, Maxima-based) already does CAS assessment of engineering maths with 4,200+ questions. Skip building anything until you can say what this repo adds beyond it.',
    category: 'verification',
    target_date: '2026-09-05',
  },
  {
    title: 'Start Karnataka Pvt Ltd incorporation',
    description: '[Manual, external] Gap 5. Runs in the background ~2 weeks. Time it to the Karnataka ELEVATE window, not defensively — incorporation starts the SISFS clock. Incorporate in India, not Delaware/Singapore.',
    category: 'legal',
    target_date: '2026-09-05',
  },
  {
    title: 'Enter the AIMO Interpretability Challenge',
    description: '[Manual] Closes 1 Nov. Sound-reasoning-vs-right-answer-wrong-reasoning is the verification thesis stated as a benchmark task. Open to independents, no entity needed.',
    category: 'funding',
    target_date: '2026-11-01',
  },
  {
    title: 'Email Renaissance Philanthropy (AI for Math Fund)',
    description: '[Manual] aiformath@renaissancephilanthropy.org — ask about seed-grant eligibility for a non-US individual and whether it can be structured as a services agreement (FCRA-clean).',
    category: 'funding',
    target_date: '2026-09-05',
  },
  {
    title: 'Build the independent verification channel (Gap 1, keystone)',
    description: "[Partly automatable] This repo already has the CAS layer: src/verification/verifiers/sympy.ts (Tier 2.5, authoring/CI only today) and a live Wolfram Tier 3 (WOLFRAM_APP_ID set in production per CHANGELOG v4.39.0) via src/jobs/wolfram-verify-job.ts. What's still manual: the method-tag check + human spot-audit layer the ledger calls for — a CAS alone catches arithmetic/algebra errors, not method-selection or problem-modelling errors, which is what LLMs actually get wrong now.",
    category: 'verification',
    target_date: '2026-10-10',
  },
  {
    title: 'Build a real mastery model (Gap 2)',
    description: '[Manual, engineering] BKT or Elo/IRT over the tagged item bank, so "marks gained per study-hour" becomes a computed output, not an intention. Also the AICTE NEAT eligibility requirement (pre-learning-status measurement + customised delivery).',
    category: 'product',
    target_date: '2026-10-24',
  },
  {
    title: 'Run the item bank through the verification audit (Gap 3)',
    description: '[Automatable once Gap 1 closes] This is exactly what npm run content:verify (wolfram-verify job) already does — and it is already wired into the contentPipelineNightly scheduled job (src/jobs/scheduler.ts), gated off by CONTENT_CRON_ENABLED (default false). Once Gap 1s method-tag layer exists, flip CONTENT_CRON_ENABLED=true in production and this runs itself nightly, rate-limited and cost-capped, publishing pass rate + quarantine log automatically.',
    category: 'verification',
    target_date: '2026-10-24',
  },
  {
    title: 'Sand down onboarding — one complete session a stranger can finish unaided',
    description: '[Manual, product] A pilot partner will not hand over 30 students for something that needs you in the room.',
    category: 'product',
    target_date: '2026-10-24',
  },
  {
    title: 'Email Foundation For Excellence / Vidyadhan (scholarship trust pilot)',
    description: '[Manual] FFE has 18,884 engineering scholars and already buys from vendors. The pilot itself closes Gap 4. Do not start before Gap 1 closes — a report on unverified content burns the relationship.',
    category: 'partnerships',
    target_date: '2026-09-05',
  },
  {
    title: 'Launch instrumented pilot cohort (Gap 4)',
    description: '[Manual, needs a partner] 30-50 learners via FFE, DIPS Academy, Infostudy, or an NIT SC-ST cell. Deliverable: a per-student marks-gained-per-study-hour report — the single artefact that converts the largest number of rows in the funding register. Blocked on Gap 1.',
    category: 'partnerships',
    target_date: '2026-11-07',
  },
  {
    title: 'Call MeitY TIDE 2.0 (via IIIT-B or FSID-IISc)',
    description: '[Manual] EIR tier needs no entity. IIIT-B names "Civic Tech & Education" as its first priority area — lowest barrier in the register.',
    category: 'funding',
    target_date: '2026-09-05',
  },
  {
    title: 'Apply: South Park Commons Bengaluru',
    description: '[Manual] Nothing blocking. Solo founders explicitly welcome; rolling between cohorts.',
    category: 'funding',
    target_date: '2026-09-05',
  },
  {
    title: 'Apply: Entrepreneur First Bangalore W27',
    description: '[Manual, fixed deadline] 5 October. Pitch the safety-critical/verification edge, not Vidhya as a product — expect to be pushed toward a different idea.',
    category: 'funding',
    target_date: '2026-10-05',
  },
  {
    title: 'Watch: Tools Competition 2027 tracks announced',
    description: "[Manual, fixed date] ~10 September. If the postsecondary track goes global, GATE qualifies with no reframe. Needs Gaps 1+2 for credibility with learning-science judges once you apply.",
    category: 'funding',
    target_date: '2026-09-10',
  },
  {
    title: 'File: Y Combinator W2027 (only if pilot has retention data)',
    description: '[Manual, conditional fixed deadline] 2 November. Under 1% without usage data — do not file without Gap 4s pilot output in hand.',
    category: 'funding',
    target_date: '2026-11-02',
  },
];

function main() {
  const existingTitles = new Set(listMilestones(DEFAULT_PLAN_ID).map(m => m.title));

  updateSettings(DEFAULT_PLAN_ID, {
    window_start: WINDOW_START,
    window_days: 90,
    // Revenue target intentionally left unset — that's the founder's call,
    // not a number to guess from a strategy document. Set it on the
    // founder page once you have one.
  });

  let created = 0;
  let skipped = 0;
  for (const m of MILESTONES) {
    if (existingTitles.has(m.title)) {
      skipped++;
      continue;
    }
    const result = createMilestone({
      plan_id: DEFAULT_PLAN_ID,
      title: m.title,
      description: m.description,
      category: m.category,
      target_date: m.target_date,
    });
    if (result.ok) created++;
    else console.error(`  ! failed to create "${m.title}": ${result.reason}`);
  }

  console.log(`[seed-founder-os] ${created} milestone(s) created, ${skipped} already present (skipped).`);
  console.log(`[seed-founder-os] Window: 90 days from ${WINDOW_START.slice(0, 10)}.`);
  console.log(`[seed-founder-os] Revenue target not set — set it on /admin/founder.`);
}

main();
