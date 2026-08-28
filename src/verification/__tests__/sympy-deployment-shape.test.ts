/**
 * B1d — deployment-shape guard, on the surveillance-invariants grep pattern
 * (src/personalization/__tests__/surveillance-invariants.test.ts).
 *
 * `src/verification/verifiers/sympy.ts` shells out to a local python3 +
 * sympy. Neither Dockerfile installs python3, so this module must never be
 * reachable from a production `/api/**` request path — it is authoring/CI
 * only (B1d). This test fails the build the moment any file under
 * `src/api/` imports it, directly or transitively-by-name.
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const REPO_ROOT = path.resolve(__dirname, '../../..');

function readAllTsFiles(dir: string): string[] {
  const out: string[] = [];
  if (!fs.existsSync(dir)) return out;
  const stack: string[] = [dir];
  while (stack.length > 0) {
    const cur = stack.pop()!;
    for (const entry of fs.readdirSync(cur, { withFileTypes: true })) {
      const p = path.join(cur, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === '.git') continue;
        stack.push(p);
        continue;
      }
      if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) out.push(p);
    }
  }
  return out;
}

describe('B1d: no production /api path imports the SymPy verifier', () => {
  it('no file under src/api/ imports verifiers/sympy', () => {
    const apiDir = path.join(REPO_ROOT, 'src', 'api');
    const files = readAllTsFiles(apiDir);
    const IMPORT_PATTERNS = [
      /from\s+['"][^'"]*verification\/verifiers\/sympy(['"]|\.js['"])/,
      /import\s*\(\s*['"][^'"]*verification\/verifiers\/sympy(['"]|\.js['"])/,
    ];
    const hits: Array<{ file: string; line: string }> = [];
    for (const f of files) {
      const src = fs.readFileSync(f, 'utf8');
      for (const line of src.split('\n')) {
        if (IMPORT_PATTERNS.some((re) => re.test(line))) {
          hits.push({ file: path.relative(REPO_ROOT, f), line: line.trim() });
        }
      }
    }
    expect(
      hits,
      'src/api/** must never import the SymPy verifier — it shells out to python3, ' +
        'which no production Dockerfile installs. SymPy is authoring/CI only (B1d).',
    ).toEqual([]);
  });

  it('sympy.ts is not wired into the production TieredVerificationOrchestrator in src/server.ts', () => {
    const serverFile = path.join(REPO_ROOT, 'src', 'server.ts');
    const src = fs.readFileSync(serverFile, 'utf8');
    expect(
      /verifiers\/sympy/.test(src),
      'src/server.ts (the one production orchestrator construction site) must never ' +
        'import or reference verifiers/sympy — the Tier 2.5 slot stays null in production.',
    ).toBe(false);
  });
});
