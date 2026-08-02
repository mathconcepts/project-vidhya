/**
 * pg-import allowlist ratchet (CEO plan Phase 0, §5.1).
 *
 * Run: npx tsx scripts/check-pg-allowlist.ts
 * Exit: 0 when clean, 1 on any violation.
 *
 * The storage boundary (src/storage/pool.ts + src/storage/repositories/)
 * is where new code should talk to Postgres. This check doesn't force an
 * instant full migration of the ~65 files that still import 'pg' directly
 * — scripts/pg-import-allowlist.json is a committed, reviewable snapshot
 * of exactly which files those are today. What it DOES prevent is silent
 * sprawl: a NEW file importing 'pg' outside src/storage/ and outside the
 * allowlist fails CI. Migrating a file off raw pg shrinks the allowlist
 * (always allowed, encouraged); adding a new pg-touching file requires an
 * explicit, visible diff to pg-import-allowlist.json in the same PR — a
 * reviewer sees exactly what's being added and why, instead of a query
 * quietly appearing three files deep in an unrelated change.
 *
 * `import type ... from 'pg'` doesn't count — it's compile-time only,
 * erased at build, and creates no runtime coupling to the pg package
 * (src/generation/db.ts uses this for its return-type annotation while
 * delegating the actual pool to src/storage/pool.ts).
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC_ROOT = path.join(ROOT, 'src');
const ALLOWLIST_PATH = path.join(ROOT, 'scripts/pg-import-allowlist.json');
const STORAGE_PREFIX = 'src/storage/';

// Matches a runtime import of 'pg' — default import, named import, bare
// import, or require(). Deliberately does NOT match `import type ... from 'pg'`.
const RUNTIME_PG_IMPORT = new RegExp(
  [
    String.raw`^\s*import\s+(?!type\b)[^;]*?\bfrom\s+['"]pg['"]`, // import ... from 'pg'
    String.raw`^\s*import\s+['"]pg['"]`, // bare import 'pg'
    String.raw`require\(\s*['"]pg['"]\s*\)`, // require('pg')
  ].join('|'),
  'm',
);

function* walkFiles(dir: string): Generator<string> {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '.git') continue;
      yield* walkFiles(path.join(dir, entry.name));
    } else if (entry.isFile() && /\.tsx?$/.test(entry.name)) {
      yield path.join(dir, entry.name);
    }
  }
}

function findRuntimePgImporters(): string[] {
  const found: string[] = [];
  for (const file of walkFiles(SRC_ROOT)) {
    const rel = path.relative(ROOT, file).replace(/\\/g, '/');
    if (rel.startsWith(STORAGE_PREFIX)) continue; // the boundary itself may import pg freely
    const content = fs.readFileSync(file, 'utf-8');
    if (RUNTIME_PG_IMPORT.test(content)) found.push(rel);
  }
  return found.sort();
}

function main(): void {
  console.log('check-pg-allowlist — CEO plan Phase 0 §5.1\n');

  if (!fs.existsSync(ALLOWLIST_PATH)) {
    console.error(`FAIL — missing ${path.relative(ROOT, ALLOWLIST_PATH)}`);
    process.exit(1);
  }

  let allowlist: string[];
  try {
    const parsed = JSON.parse(fs.readFileSync(ALLOWLIST_PATH, 'utf-8'));
    allowlist = Array.isArray(parsed.files) ? parsed.files : [];
  } catch (e: any) {
    console.error(`FAIL — pg-import-allowlist.json unreadable: ${e?.message}`);
    process.exit(1);
  }
  const allowedSet = new Set(allowlist);

  const actual = findRuntimePgImporters();
  const actualSet = new Set(actual);

  const newlyIntroduced = actual.filter((f) => !allowedSet.has(f));
  const nowClean = allowlist.filter((f) => !actualSet.has(f));

  if (newlyIntroduced.length > 0) {
    console.error(`FAIL — ${newlyIntroduced.length} file(s) import 'pg' outside src/storage/ and outside the allowlist:`);
    for (const f of newlyIntroduced) console.error(`  ${f}`);
    console.error(
      '\nEither route this through src/storage/ (see src/storage/pool.ts + ' +
      'src/storage/repositories/ for the pattern), or — if that\'s out of ' +
      'scope for this change — add the file to scripts/pg-import-allowlist.json ' +
      'explicitly, so the addition is a visible, reviewed diff.',
    );
    process.exit(1);
  }

  console.log(`ok  [pg-allowlist] ${actual.length} files import 'pg' outside src/storage/, all present in the allowlist`);
  if (nowClean.length > 0) {
    console.log(
      `note [pg-allowlist] ${nowClean.length} allowlisted file(s) no longer import 'pg' — ` +
      `the allowlist can shrink (not required, just available):`,
    );
    for (const f of nowClean) console.log(`  ${f}`);
  }
  console.log('\nPASS — pg-allowlist clean');
}

main();
