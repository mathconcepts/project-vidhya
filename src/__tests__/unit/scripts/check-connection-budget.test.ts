/**
 * scripts/check-connection-budget.ts (T16 / D4 / OV2 correction #10) —
 * spawns the real script (via tsx) against the actual repo tree, same
 * pattern as check-pg-allowlist.test.ts, to lock the ratchet contract:
 *   - clean repo state → exit 0
 *   - a NEW un-guarded `new Pool(...)` construction → exit 1, names the
 *     offending file:line
 *   - the codebase's lazy-singleton memoization guard shape (whatever
 *     variable name it uses, as long as it ends in `Pool`/`_instance`) is
 *     recognized as safe and does NOT trip the check
 *   - a construction inside a NON-exported/private function still gets
 *     flagged if unguarded — this is the exact gap that let
 *     src/gbrain/gbrain-routes.ts's per-call bug through an earlier,
 *     narrower version of this heuristic
 *   - src/storage/ is exempt (it's the pool boundary itself)
 *   - an entry in scripts/connection-budget-allowlist.json suppresses a
 *     specific file:line without suppressing others
 */

import { describe, it, expect, afterEach } from 'vitest';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const SCRIPT = path.resolve(process.cwd(), 'scripts/check-connection-budget.ts');
const SCRATCH_DIR = path.resolve(process.cwd(), 'src/_scratch_connection_budget_test');

function runScript() {
  return spawnSync('npx', ['tsx', SCRIPT], { encoding: 'utf-8', timeout: 25_000 });
}

function writeScratch(name: string, content: string): string {
  fs.mkdirSync(SCRATCH_DIR, { recursive: true });
  const file = path.join(SCRATCH_DIR, name);
  fs.writeFileSync(file, content, 'utf-8');
  return file;
}

afterEach(() => {
  if (fs.existsSync(SCRATCH_DIR)) fs.rmSync(SCRATCH_DIR, { recursive: true, force: true });
});

describe('check-connection-budget', () => {
  it('passes cleanly against the current repo tree', () => {
    const r = runScript();
    expect(r.status).toBe(0);
    expect(r.stdout).toContain('PASS — connection-budget clean');
  });

  it('fails on an un-guarded new Pool(...) inside an exported function', () => {
    writeScratch(
      'offender.ts',
      [
        "import pg from 'pg';",
        'export async function handleThing() {',
        "  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });",
        '  return pool.query("SELECT 1");',
        '}',
      ].join('\n'),
    );

    const r = runScript();
    expect(r.status).toBe(1);
    expect(r.stderr).toContain('src/_scratch_connection_budget_test/offender.ts');
  });

  it('fails on an un-guarded new Pool(...) inside a PRIVATE (non-exported) function reached only through an exported table — the gbrain-routes.ts shape', () => {
    writeScratch(
      'private-handler.ts',
      [
        "import pg from 'pg';",
        // Not exported directly — only reachable via the routes array below,
        // exactly like gbrain-routes.ts's handleAttempt.
        'async function handleAttempt() {',
        '  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });',
        '  return pool.query("SELECT 1");',
        '}',
        'export const routes = [{ method: "POST", path: "/x", handler: handleAttempt }];',
      ].join('\n'),
    );

    const r = runScript();
    expect(r.status).toBe(1);
    expect(r.stderr).toContain('src/_scratch_connection_budget_test/private-handler.ts');
  });

  it('does not flag the lazy-singleton memoization guard shape, any variable name', () => {
    writeScratch(
      'safe-singleton.ts',
      [
        "import pg from 'pg';",
        'let _myThingPool: pg.Pool | null = null;',
        'export function getPool(): pg.Pool {',
        '  if (_myThingPool) return _myThingPool;',
        '  _myThingPool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 5 });',
        '  return _myThingPool;',
        '}',
      ].join('\n'),
    );

    const r = runScript();
    expect(r.status).toBe(0);
  });

  it('does not flag a file under src/storage/', () => {
    fs.mkdirSync(path.resolve(process.cwd(), 'src/storage/_scratch_connection_budget_test'), { recursive: true });
    const file = path.resolve(process.cwd(), 'src/storage/_scratch_connection_budget_test/offender.ts');
    fs.writeFileSync(
      file,
      [
        "import pg from 'pg';",
        'export async function handleThing() {',
        '  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });',
        '  return pool.query("SELECT 1");',
        '}',
      ].join('\n'),
      'utf-8',
    );

    try {
      const r = runScript();
      expect(r.status).toBe(0);
    } finally {
      fs.rmSync(path.resolve(process.cwd(), 'src/storage/_scratch_connection_budget_test'), { recursive: true, force: true });
    }
  });

  it('an allowlist entry suppresses only its own file:line', () => {
    const allowlistPath = path.resolve(process.cwd(), 'scripts/connection-budget-allowlist.json');
    const original = fs.readFileSync(allowlistPath, 'utf-8');
    const originalParsed = JSON.parse(original);
    writeScratch(
      'flagged-but-allowlisted.ts',
      [
        "import pg from 'pg';",
        'export async function handleThing() {',
        '  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });', // line 3
        '  return pool.query("SELECT 1");',
        '}',
      ].join('\n'),
    );

    try {
      // Extend, don't replace — the real allowlist already has reviewed
      // entries for pre-existing findings (§5 of the T16 runbook); wiping
      // them out would make THIS test the thing that fails, not the
      // scratch file it's actually exercising.
      fs.writeFileSync(
        allowlistPath,
        JSON.stringify({
          files: [
            ...(originalParsed.files ?? []),
            'src/_scratch_connection_budget_test/flagged-but-allowlisted.ts:3',
          ],
        }),
        'utf-8',
      );
      const r = runScript();
      expect(r.status).toBe(0);
    } finally {
      fs.writeFileSync(allowlistPath, original, 'utf-8');
    }
  });
});
