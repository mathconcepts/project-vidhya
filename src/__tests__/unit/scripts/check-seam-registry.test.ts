/**
 * scripts/check-seam-registry.ts (CEO plan Phase 0 §4 "the law") — spawns
 * the real script against the real seam-registry.json + repo tree.
 */

import { describe, it, expect, afterEach } from 'vitest';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const SCRIPT = path.resolve(process.cwd(), 'scripts/check-seam-registry.ts');

// Repo-pinned tsx, not `npx tsx` — a cold npx cache installs from the network
// and writes its warning to stderr (see check-la-walkthrough.test.ts).
const TSX_BIN = path.resolve(process.cwd(), 'node_modules/.bin/tsx');
const REGISTRY = path.resolve(process.cwd(), 'seam-registry.json');

function runScript() {
  return spawnSync(TSX_BIN, [SCRIPT], { encoding: 'utf-8', timeout: 25_000 });
}

describe('check-seam-registry', () => {
  it('passes cleanly against the committed seam-registry.json', () => {
    const r = runScript();
    expect(r.status).toBe(0);
    expect(r.stdout).toContain('PASS — seam-registry clean');
  });

  it('every seam has a name, interface_file, and conformance_test_path', () => {
    const registry = JSON.parse(fs.readFileSync(REGISTRY, 'utf-8'));
    expect(Array.isArray(registry.seams)).toBe(true);
    expect(registry.seams.length).toBeGreaterThan(0);
    for (const seam of registry.seams) {
      expect(typeof seam.name).toBe('string');
      expect(seam.name.length).toBeGreaterThan(0);
      expect(fs.existsSync(path.resolve(process.cwd(), seam.interface_file))).toBe(true);
      expect(fs.existsSync(path.resolve(process.cwd(), seam.conformance_test_path))).toBe(true);
    }
  });

  it('seam names are unique', () => {
    const registry = JSON.parse(fs.readFileSync(REGISTRY, 'utf-8'));
    const names = registry.seams.map((s: any) => s.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it('fails when a conformance_test_path is broken', () => {
    const original = fs.readFileSync(REGISTRY, 'utf-8');
    try {
      const registry = JSON.parse(original);
      registry.seams[0].conformance_test_path = 'src/does/not/exist.test.ts';
      fs.writeFileSync(REGISTRY, JSON.stringify(registry, null, 2), 'utf-8');

      const r = runScript();
      expect(r.status).toBe(1);
      expect(r.stderr).toContain('does not exist');
    } finally {
      fs.writeFileSync(REGISTRY, original, 'utf-8');
    }
  });

  it('fails when the interface_file is broken', () => {
    const original = fs.readFileSync(REGISTRY, 'utf-8');
    try {
      const registry = JSON.parse(original);
      registry.seams[0].interface_file = 'src/does/not/exist.ts';
      fs.writeFileSync(REGISTRY, JSON.stringify(registry, null, 2), 'utf-8');

      const r = runScript();
      expect(r.status).toBe(1);
      expect(r.stderr).toContain('does not exist');
    } finally {
      fs.writeFileSync(REGISTRY, original, 'utf-8');
    }
  });
});
