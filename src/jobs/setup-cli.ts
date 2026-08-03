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
 *   0 — ready: at least one LLM provider (Gemini, Anthropic, OpenAI,
 *       OpenRouter, ...) is configured and reachable — content-generation
 *       refuses to start with zero working providers, but doesn't care
 *       which one you picked.
 *   1 — not ready: fix the reported errors and re-run
 */

import { loadDotEnvIntoProcess } from './dotenv-loader';
loadDotEnvIntoProcess();

import { preflightProviders } from '../llm/env-config';
import { loadProvidersRegistry } from '../llm/registry';
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

  // Report every provider the registry knows about — including ones with
  // no key set — so "not configured" is visible, not just silently absent.
  try {
    const registry = loadProvidersRegistry();
    for (const [id, p] of Object.entries(registry.providers)) {
      if (!p.enabled || !p.api_key_env) continue; // keyless (ollama) has nothing to report here
      if (!process.env[p.api_key_env]) {
        console.log(`[setup] ${p.api_key_env.padEnd(20)} — not configured`);
      }
    }
  } catch {
    // registry load failure surfaces below via preflightProviders' own empty-config fallback
  }

  if (results.length === 0) {
    console.error(
      '[setup] No LLM provider is configured — content-generation refuses to start. ' +
        'Set at least one of GEMINI_API_KEY, ANTHROPIC_API_KEY, OPENAI_API_KEY, OPENROUTER_API_KEY ' +
        'and re-run.',
    );
    hardFailure = true;
  } else {
    for (const r of results) {
      if (r.ok) {
        console.log(`[setup] ${r.provider.padEnd(20)} — OK (live call succeeded)`);
      } else {
        console.warn(`[setup] ${r.provider.padEnd(20)} — FAILED live check: ${r.error ?? 'unknown error'}`);
      }
    }
    if (!results.some((r) => r.ok)) {
      console.error(
        '[setup] Every configured provider failed its live check — content-generation refuses to start ' +
          'with zero working providers. Fix at least one key/quota above and retry.',
      );
      hardFailure = true;
    } else if (results.some((r) => !r.ok)) {
      console.warn(
        '[setup] Some configured providers failed their live check (non-blocking — generation will use ' +
          'whichever providers ARE working; consensus/second-opinion atoms may fall back to a single provider).',
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
