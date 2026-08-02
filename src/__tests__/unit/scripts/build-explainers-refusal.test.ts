/**
 * RC2 — scripts/build-explainers.ts must REFUSE to emit placeholder
 * explainers unless --allow-placeholder is passed explicitly.
 *
 * The 82-placeholder explainers.json that shipped to production was
 * produced by the old silent fallback when GEMINI_API_KEY was unset.
 * These tests spawn the real script (via tsx) to lock the new contract:
 *
 *   - no key, no flag        → exit 1, nothing written
 *   - no key, --allow-placeholder → exit 0, placeholder library written
 */

import { describe, it, expect } from 'vitest';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const SCRIPT = path.resolve(process.cwd(), 'scripts/build-explainers.ts');

function runScript(args: string[], cwd: string) {
  const env = { ...process.env };
  delete env.GEMINI_API_KEY;
  return spawnSync('npx', ['tsx', SCRIPT, ...args], {
    cwd,
    env,
    encoding: 'utf-8',
    timeout: 25_000,
  });
}

function makeTempWorkdir(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'vidhya-explainers-'));
  fs.mkdirSync(path.join(dir, 'frontend/public/data'), { recursive: true });
  return dir;
}

describe('build-explainers placeholder refusal (RC2)', () => {
  it('exits 1 and writes nothing when GEMINI_API_KEY is unset', () => {
    const cwd = makeTempWorkdir();
    const r = runScript([], cwd);
    expect(r.status).toBe(1);
    expect(r.stderr).toContain('GEMINI_API_KEY');
    expect(r.stderr).toContain('--allow-placeholder');
    expect(fs.existsSync(path.join(cwd, 'frontend/public/data/explainers.json'))).toBe(false);
    fs.rmSync(cwd, { recursive: true, force: true });
  });

  it('still writes the placeholder library when --allow-placeholder is passed', () => {
    const cwd = makeTempWorkdir();
    const r = runScript(['--allow-placeholder'], cwd);
    expect(r.status).toBe(0);
    const outPath = path.join(cwd, 'frontend/public/data/explainers.json');
    expect(fs.existsSync(outPath)).toBe(true);
    const lib = JSON.parse(fs.readFileSync(outPath, 'utf-8'));
    const entries = Object.values(lib.by_concept ?? {}) as Array<{ model?: string }>;
    expect(entries.length).toBeGreaterThan(0);
    expect(entries.every(e => e.model === 'placeholder')).toBe(true);
    fs.rmSync(cwd, { recursive: true, force: true });
  });
});
