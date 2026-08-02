/**
 * setup-cli — one-command upfront credential + DB readiness check.
 *
 *   npm run content:setup
 *
 * "Take credentials from the user upfront" in practice: `.env` is loaded
 * once here (see dotenv-loader.ts), every configured provider gets a
 * LIVE call (not just an env-var presence check — the exact gap that let
 * an expired Gemini key and an invalid Anthropic key both slip through
 * until 8 concepts into a real run), and DATABASE_URL gets a fast
 * reachability check. Run this once before `npm run content:generate` (or
 * let `npm run content:generate:auto` run it for you automatically).
 *
 * Exit codes:
 *   0 — ready: Gemini is configured and reachable (the one hard
 *       requirement — content-generation refuses to start without it)
 *   1 — not ready: fix the reported errors and re-run
 */

import { loadDotEnvIntoProcess } from './dotenv-loader';
loadDotEnvIntoProcess();

import { preflightProviders } from '../llm/env-config';
import { preflightDatabase } from './db-preflight';
import { getSyllabus, DEFAULT_SYLLABUS_ID, listSyllabusIds } from '../curriculum/exam-loader';

async function main(): Promise<void> {
  const requestedSyllabus = process.env.VIDHYA_SYLLABUS || DEFAULT_SYLLABUS_ID;
  if (!listSyllabusIds().includes(requestedSyllabus)) {
    console.error(
      `[setup] VIDHYA_SYLLABUS="${requestedSyllabus}" — NOT a registered syllabus. ` +
        `Registered: ${listSyllabusIds().join(', ')}. ` +
        'Register one by adding data/curriculum/<exam-id>.yml — see docs/CURRICULUM-FRAMEWORK.md §6.',
    );
    process.exit(1);
  }
  const syllabus = getSyllabus(requestedSyllabus);
  console.log(`[setup] syllabus: ${syllabus.name} (${syllabus.id}, ${syllabus.concepts.length} concepts)`);
  if (syllabus.concepts.length === 0) {
    console.error(
      `[setup] ${syllabus.unresolvedConceptIds.length} concept_ids are declared in data/curriculum/${syllabus.id}.yml ` +
        'but none exist in concept-graph.ts yet — content-generation has nothing to generate for this syllabus. ' +
        'See docs/CURRICULUM-FRAMEWORK.md §6 to add concepts.',
    );
    process.exit(1);
  }

  console.log('[setup] checking provider credentials (live calls)...');
  const results = await preflightProviders();
  let hardFailure = false;

  if (!process.env.GEMINI_API_KEY) {
    console.error('[setup] GEMINI_API_KEY  — MISSING (required — content-generation refuses to start without it)');
    hardFailure = true;
  } else {
    const gemini = results.find((r) => r.provider === 'gemini');
    if (gemini?.ok) {
      console.log('[setup] GEMINI_API_KEY  — OK (live call succeeded)');
    } else {
      console.error(`[setup] GEMINI_API_KEY  — FAILED live check: ${gemini?.error ?? 'unknown error'}`);
      hardFailure = true;
    }
  }

  for (const provider of ['anthropic', 'openai'] as const) {
    const envVar = provider === 'anthropic' ? 'ANTHROPIC_API_KEY' : 'OPENAI_API_KEY';
    const r = results.find((x) => x.provider === provider);
    if (!process.env[envVar]) {
      console.log(`[setup] ${envVar.padEnd(15)} — not configured (optional; backs consensus/second-opinions only)`);
    } else if (r?.ok) {
      console.log(`[setup] ${envVar.padEnd(15)} — OK (live call succeeded)`);
    } else {
      console.warn(
        `[setup] ${envVar.padEnd(15)} — FAILED live check: ${r?.error ?? 'unknown error'} ` +
          '(non-blocking — consensus atoms may fall back to a single provider this run)',
      );
    }
  }

  console.log('[setup] checking DATABASE_URL...');
  if (!process.env.DATABASE_URL) {
    console.log('[setup] DATABASE_URL    — not set (FILE mode only: atoms persist as files; no DB versioning / cost ledger / PYQ grounding)');
  } else {
    const db = await preflightDatabase();
    if (db.ok) {
      console.log('[setup] DATABASE_URL    — OK (reachable)');
    } else {
      console.warn(
        `[setup] DATABASE_URL    — set but UNREACHABLE (${db.error}) — generation will still run in FILE mode ` +
          '(create the database or fix the connection string if you want DB features; not required to proceed)',
      );
    }
  }

  console.log('');
  if (hardFailure) {
    console.error('[setup] NOT READY — fix the error(s) above, then re-run `npm run content:setup`.');
    process.exit(1);
  }

  console.log('[setup] READY — safe to run `npm run content:generate`, or `npm run content:generate:auto` for an unattended run that auto-resumes and notifies you when it finishes.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
