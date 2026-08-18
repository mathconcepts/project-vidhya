/**
 * scripts/check-connection-budget.ts — T16 (D4 / OV2 correction #10).
 *
 * Run: npx tsx scripts/check-connection-budget.ts
 * Exit: 0 when clean, 1 on any violation.
 *
 * `scripts/check-pg-allowlist.ts` catches a NEW file importing 'pg' at
 * all. It does NOT catch the more specific failure mode this script
 * exists for: a Pool constructed FRESH ON EVERY CALL instead of once per
 * process. `src/readiness/warmup-onboarding.ts` had exactly this bug
 * (a `new Pool({max:3})` inside `applyWarmupPriors`, rebuilt — and never
 * freed until `.end()` on the way out — on every single warmup persist)
 * and it was invisible to the pg-allowlist check because it reached 'pg'
 * through a dynamic `await import('pg')`, which that check's static
 * import regex does not match. This script closes both gaps: it flags
 * per-call pool construction AND doesn't care whether the import was
 * static or dynamic, because it matches on the constructor call site
 * (`new ...Pool(`), not the import statement.
 *
 * Heuristic (deliberately coarse — see the task brief this shipped
 * against): a `new <anything>Pool(` call site is a violation when it is
 * NOT immediately preceded by the codebase's own lazy-singleton
 * memoization guard — every safe module in src/ follows the same
 * `if (_pool) return _pool; _pool = new Pool(...)` (or
 * `this.pool`/`_instance`) shape, so "no guard nearby" is a good proxy
 * for "rebuilt every call."
 *
 * An earlier version of this heuristic also required the call site to
 * sit inside an EXPORTED function, on the theory that a private helper
 * can't leak per-request. That version missed a real bug found in the
 * same audit: `src/gbrain/gbrain-routes.ts`'s `handleAttempt` built (and
 * never closed) a fresh Pool on every confidence-rated attempt, but
 * `handleAttempt` itself is a private, un-exported function only reached
 * indirectly through an exported route table — so "is this identifier
 * exported" said nothing about whether the code actually runs per
 * request. Dropping that requirement is deliberately over-inclusive
 * instead: a handful of legitimate module-top-level singletons (built
 * once at import, e.g. `src/api/blog-routes.ts`'s top-level `const pool
 * = new pg.Pool(...)`) and one class whose memoization guard lives in a
 * separate factory function (`src/sessions/session-store.ts`'s
 * `PostgresStore`) get flagged too — those are recorded, with the
 * reasoning for why they're safe, in
 * scripts/connection-budget-allowlist.json rather than silently passing.
 *
 * This is NOT a real parser — it will not catch every conceivable
 * construction site. That tradeoff is deliberate: scripts/pg-import-
 * allowlist.json already gates *whether* a file may touch 'pg' at all;
 * this script only needs to ratchet the much narrower "does it leak a
 * fresh pool per call" failure mode forward from here, not prove it
 * retroactively for the whole codebase. A false positive — new or
 * pre-existing — is fixed by tightening the guard regex or by an
 * explicit, reviewed entry in scripts/connection-budget-allowlist.json —
 * same ratchet shape as the pg-allowlist, so an addition is a visible
 * diff a reviewer sees, never a silent exemption.
 *
 * Scope: src/ only. scripts/ and demo/ are one-shot CLI processes that
 * build a pool and exit — there is no "shared" for them to join, and
 * they're audited separately in docs/ops/render-database-url.md's audit
 * table. src/storage/ is the pool boundary itself and is exempt by
 * design (src/storage/pool.ts IS the one shared pool; its own
 * `checkConnectivity()` deliberately builds a short-lived throwaway
 * pool per call, by design, documented in that file).
 *
 * Test isolation: `CONNECTION_BUDGET_SCAN_ROOT` and
 * `CONNECTION_BUDGET_ALLOWLIST_PATH` override the scan root and the
 * allowlist file respectively (both default to the real repo paths above
 * when unset — production/CI behavior is unchanged). This exists so
 * `src/__tests__/unit/scripts/check-connection-budget.test.ts` can point
 * a run at a throwaway OS temp tree + a throwaway allowlist copy instead
 * of writing scratch fixtures into the real `src/` and mutating the real
 * allowlist JSON in place — a crash mid-test can no longer leave stray
 * files in the repo, and two test runs can no longer collide on the same
 * shared file.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC_ROOT = process.env.CONNECTION_BUDGET_SCAN_ROOT
  ? path.resolve(process.env.CONNECTION_BUDGET_SCAN_ROOT)
  : path.join(ROOT, 'src');
const ALLOWLIST_PATH = process.env.CONNECTION_BUDGET_ALLOWLIST_PATH
  ? path.resolve(process.env.CONNECTION_BUDGET_ALLOWLIST_PATH)
  : path.join(ROOT, 'scripts/connection-budget-allowlist.json');
// Violations are reported relative to SRC_ROOT's parent, so a report reads
// "src/foo.ts:12" in both the real repo (REL_BASE === ROOT) and an
// isolated test tree rooted at "<tmp>/src" (REL_BASE === "<tmp>").
const REL_BASE = path.dirname(SRC_ROOT);
const STORAGE_PREFIX = 'src/storage/';

// `new Pool(`, `new pg.Pool(`, `new pg.default.Pool(`, etc. — any `new`
// expression whose constructed identifier ends in `Pool`.
const POOL_CONSTRUCTION = /\bnew\s+[\w.$]*\bPool\s*\(/;

// The codebase's lazy-singleton memoization guard, in its several
// observed shapes: `if (_pool) return _pool`, `if (_atomPool) return
// _atomPool` (module-specific pool variable names — `_enrichmentPool`,
// `_dbPool`, `_atomPool`, etc. — all end in `[Pp]ool`), `if (this.pool)`,
// `if (!_instance)`, `_pool ??=`, `_pool !== undefined`. Matching any of
// these ANYWHERE in the preceding window is treated as "this call site
// is memoized," not "rebuilt every call."
const MEMOIZATION_GUARD = /\b(_\w*[Pp]ool|_instance|this\.pool)\b\s*(!==?|===?|\?\?=)|if\s*\(\s*!?\s*(_\w*[Pp]ool|_instance|this\.pool)\b/;

// How far back (lines) to look for a memoization guard before the
// `new Pool(` call site. Generous enough to span a getPool() function's
// full body (the longest in the codebase today is ~6 lines) without
// bleeding into an unrelated preceding function.
const GUARD_WINDOW = 12;

interface Violation {
  file: string;
  line: number;
  snippet: string;
}

function* walkFiles(dir: string): Generator<string> {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === '__tests__') continue;
      yield* walkFiles(path.join(dir, entry.name));
    } else if (entry.isFile() && /\.tsx?$/.test(entry.name) && !/\.(test|spec)\.tsx?$/.test(entry.name)) {
      yield path.join(dir, entry.name);
    }
  }
}

function hasNearbyGuard(lines: string[], matchIdx: number): boolean {
  const start = Math.max(0, matchIdx - GUARD_WINDOW);
  for (let i = start; i <= matchIdx; i++) {
    if (MEMOIZATION_GUARD.test(lines[i])) return true;
  }
  return false;
}

function findViolations(): Violation[] {
  const violations: Violation[] = [];
  for (const file of walkFiles(SRC_ROOT)) {
    const rel = path.relative(REL_BASE, file).replace(/\\/g, '/');
    if (rel.startsWith(STORAGE_PREFIX)) continue; // the boundary itself

    const content = fs.readFileSync(file, 'utf-8');
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();
      if (trimmed.startsWith('//') || trimmed.startsWith('*')) continue; // comment/doc line
      if (!POOL_CONSTRUCTION.test(line)) continue;

      if (hasNearbyGuard(lines, i)) continue; // memoized lazy singleton — safe

      violations.push({ file: rel, line: i + 1, snippet: trimmed });
    }
  }
  return violations;
}

function loadAllowlist(): Set<string> {
  if (!fs.existsSync(ALLOWLIST_PATH)) return new Set();
  try {
    const parsed = JSON.parse(fs.readFileSync(ALLOWLIST_PATH, 'utf-8'));
    const files: string[] = Array.isArray(parsed.files) ? parsed.files : [];
    return new Set(files);
  } catch {
    return new Set();
  }
}

function main(): void {
  console.log('check-connection-budget — T16 (D4 / OV2 correction #10)\n');

  const allowlist = loadAllowlist();
  const violations = findViolations();
  const newViolations = violations.filter((v) => !allowlist.has(`${v.file}:${v.line}`));

  if (newViolations.length > 0) {
    console.error(`FAIL — ${newViolations.length} likely per-call Pool construction(s) on the request path:\n`);
    for (const v of newViolations) {
      console.error(`  ${v.file}:${v.line}`);
      console.error(`    ${v.snippet}`);
    }
    console.error(
      '\nA Pool built with no lazy-singleton guard nearby opens (and often ' +
      'never frees) a new connection pool on every call to the function it ' +
      'sits in — exactly what exhausted Supabase\'s connection ceiling under ' +
      'load (T16 audit, docs/ops/render-database-url.md).\n' +
      'Fix: use getSharedPool() from src/storage/pool.ts instead of ' +
      'constructing your own Pool. If this really does need its own ' +
      'dedicated pool (e.g. a genuine session-scoped advisory-lock user — ' +
      'see src/storage/pool.ts\'s exception-policy doc comment for the only ' +
      'documented cases), memoize it with the same `if (_pool) return _pool` ' +
      'shape every other module uses, or add an explicit, reviewed entry to ' +
      'scripts/connection-budget-allowlist.json.',
    );
    process.exit(1);
  }

  console.log(`ok  [connection-budget] ${violations.length} known exception(s), 0 new violations`);
  console.log('\nPASS — connection-budget clean');
}

main();
