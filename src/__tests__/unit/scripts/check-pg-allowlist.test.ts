/**
 * scripts/check-pg-allowlist.ts (CEO plan Phase 0 §5.1) — spawns the real
 * script (via tsx) against the actual repo tree to lock the ratchet
 * contract:
 *   - clean repo state → exit 0
 *   - a new file importing 'pg' outside src/storage/ and outside the
 *     allowlist → exit 1, names the offending file
 *   - `import type ... from 'pg'` doesn't trip the guard (compile-time only)
 *   - a file under src/storage/ importing 'pg' doesn't trip the guard
 */

import { describe, it, expect, afterEach } from 'vitest';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const SCRIPT = path.resolve(process.cwd(), 'scripts/check-pg-allowlist.ts');

function runScript() {
  return spawnSync('npx', ['tsx', SCRIPT], { encoding: 'utf-8', timeout: 25_000 });
}

const scratchFiles: string[] = [];

afterEach(() => {
  for (const f of scratchFiles) {
    if (fs.existsSync(f)) fs.rmSync(f);
    const dir = path.dirname(f);
    if (fs.existsSync(dir) && fs.readdirSync(dir).length === 0) fs.rmdirSync(dir);
  }
  scratchFiles.length = 0;
});

describe('check-pg-allowlist', () => {
  it('passes cleanly against the current repo tree', () => {
    const r = runScript();
    expect(r.status).toBe(0);
    expect(r.stdout).toContain('PASS — pg-allowlist clean');
  });

  it('fails when a new file imports pg outside src/storage/ and outside the allowlist', () => {
    const dir = path.resolve(process.cwd(), 'src/_scratch_pg_guard_test');
    const file = path.join(dir, 'offender.ts');
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(file, `import pg from 'pg';\nexport const x = pg;\n`, 'utf-8');
    scratchFiles.push(file);

    const r = runScript();
    expect(r.status).toBe(1);
    expect(r.stderr).toContain('src/_scratch_pg_guard_test/offender.ts');
  });

  it('does not flag a type-only pg import', () => {
    const dir = path.resolve(process.cwd(), 'src/_scratch_pg_guard_test');
    const file = path.join(dir, 'type-only.ts');
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(file, `import type pg from 'pg';\nexport type X = pg.Pool;\n`, 'utf-8');
    scratchFiles.push(file);

    const r = runScript();
    expect(r.status).toBe(0);
  });

  it('does not flag a file under src/storage/', () => {
    const dir = path.resolve(process.cwd(), 'src/storage/_scratch_pg_guard_test');
    const file = path.join(dir, 'offender.ts');
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(file, `import pg from 'pg';\nexport const x = pg;\n`, 'utf-8');
    scratchFiles.push(file);

    const r = runScript();
    expect(r.status).toBe(0);
  });
});
