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
 *
 * Isolation: every scenario except "passes cleanly against the current
 * repo tree" runs against a throwaway OS temp tree (via
 * CONNECTION_BUDGET_SCAN_ROOT) and a throwaway allowlist copy (via
 * CONNECTION_BUDGET_ALLOWLIST_PATH) — see the script's own doc comment.
 * Neither the real src/ tree nor the real allowlist JSON is ever written
 * to, so a crash mid-test can't pollute the repo and two runs (e.g. CI
 * shards) can't collide on the same shared file.
 */

import { describe, it, expect, afterEach } from 'vitest';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const SCRIPT = path.resolve(process.cwd(), 'scripts/check-connection-budget.ts');

function runScript(env: Record<string, string> = {}) {
  return spawnSync('npx', ['tsx', SCRIPT], {
    encoding: 'utf-8',
    timeout: 25_000,
    env: { ...process.env, ...env },
  });
}

/** A fresh, isolated `<tmp>/src` tree + a fresh, isolated allowlist file. */
function makeIsolatedTree(allowlistFiles: string[] = []) {
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'conn-budget-test-'));
  const srcRoot = path.join(tmpRoot, 'src');
  fs.mkdirSync(srcRoot, { recursive: true });
  const allowlistPath = path.join(tmpRoot, 'allowlist.json');
  fs.writeFileSync(allowlistPath, JSON.stringify({ files: allowlistFiles }), 'utf-8');

  return {
    srcRoot,
    allowlistPath,
    env: { CONNECTION_BUDGET_SCAN_ROOT: srcRoot, CONNECTION_BUDGET_ALLOWLIST_PATH: allowlistPath },
    write(name: string, content: string): string {
      const file = path.join(srcRoot, name);
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, content, 'utf-8');
      return file;
    },
    cleanup() {
      fs.rmSync(tmpRoot, { recursive: true, force: true });
    },
  };
}

const cleanups: Array<() => void> = [];
afterEach(() => {
  while (cleanups.length) cleanups.pop()!();
});

describe('check-connection-budget', () => {
  it('passes cleanly against the current repo tree', () => {
    const r = runScript();
    expect(r.status).toBe(0);
    expect(r.stdout).toContain('PASS — connection-budget clean');
  });

  it('fails on an un-guarded new Pool(...) inside an exported function', () => {
    const tree = makeIsolatedTree();
    cleanups.push(tree.cleanup);
    tree.write(
      'offender.ts',
      [
        "import pg from 'pg';",
        'export async function handleThing() {',
        "  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });",
        '  return pool.query("SELECT 1");',
        '}',
      ].join('\n'),
    );

    const r = runScript(tree.env);
    expect(r.status).toBe(1);
    expect(r.stderr).toContain('src/offender.ts');
  });

  it('fails on an un-guarded new Pool(...) inside a PRIVATE (non-exported) function reached only through an exported table — the gbrain-routes.ts shape', () => {
    const tree = makeIsolatedTree();
    cleanups.push(tree.cleanup);
    tree.write(
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

    const r = runScript(tree.env);
    expect(r.status).toBe(1);
    expect(r.stderr).toContain('src/private-handler.ts');
  });

  it('does not flag the lazy-singleton memoization guard shape, any variable name', () => {
    const tree = makeIsolatedTree();
    cleanups.push(tree.cleanup);
    tree.write(
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

    const r = runScript(tree.env);
    expect(r.status).toBe(0);
  });

  it('does not flag a file under src/storage/', () => {
    const tree = makeIsolatedTree();
    cleanups.push(tree.cleanup);
    tree.write(
      'storage/offender.ts',
      [
        "import pg from 'pg';",
        'export async function handleThing() {',
        '  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });',
        '  return pool.query("SELECT 1");',
        '}',
      ].join('\n'),
    );

    const r = runScript(tree.env);
    expect(r.status).toBe(0);
  });

  it('an allowlist entry suppresses only its own file:line', () => {
    const tree = makeIsolatedTree(['src/flagged-but-allowlisted.ts:3']);
    cleanups.push(tree.cleanup);
    tree.write(
      'flagged-but-allowlisted.ts',
      [
        "import pg from 'pg';",
        'export async function handleThing() {',
        '  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });', // line 3
        '  return pool.query("SELECT 1");',
        '}',
      ].join('\n'),
    );

    const r = runScript(tree.env);
    expect(r.status).toBe(0);
  });

  it('an allowlist entry does NOT suppress a different, unlisted violation in the same isolated tree', () => {
    const tree = makeIsolatedTree(['src/flagged-but-allowlisted.ts:3']);
    cleanups.push(tree.cleanup);
    tree.write(
      'flagged-but-allowlisted.ts',
      [
        "import pg from 'pg';",
        'export async function handleThing() {',
        '  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });', // line 3, allowlisted
        '  return pool.query("SELECT 1");',
        '}',
      ].join('\n'),
    );
    tree.write(
      'also-flagged.ts',
      [
        "import pg from 'pg';",
        'export async function handleOther() {',
        '  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });', // NOT allowlisted
        '  return pool.query("SELECT 1");',
        '}',
      ].join('\n'),
    );

    const r = runScript(tree.env);
    expect(r.status).toBe(1);
    expect(r.stderr).toContain('src/also-flagged.ts');
    expect(r.stderr).not.toContain('src/flagged-but-allowlisted.ts');
  });
});
