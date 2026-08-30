/**
 * `__dirname` / `__filename` must not appear in runtime source.
 *
 * `package.json` sets `"type": "module"` and the server boots via
 * `npx tsx src/server.ts` (Dockerfile CMD), so both identifiers are
 * genuinely undefined at runtime. Referencing either at module top level
 * throws `ReferenceError: … is not defined in ES module scope` during
 * module EVALUATION — before any route, guard or try/catch exists — which
 * takes the whole process down at boot.
 *
 * That is not hypothetical. `src/content/atomic-topic-spec.ts` shipped to
 * `main` with `path.resolve(__dirname, '../../docs/content-spec')`, and
 * because `src/server.ts` → `src/api/admin-content-spec-routes.ts` → that
 * file is an unconditional import chain, every boot of `main` died on it.
 *
 * The reason the existing suite could not see it is the reason this test is
 * written as a source grep rather than as a behavioural test: vitest injects
 * a `__dirname` shim into the modules it transforms, so the identifier works
 * fine under test and only fails under the real ESM loader. Test files
 * therefore legitimately use it and are excluded here.
 *
 * A boot smoke test in CI would catch this class more directly and is the
 * better long-term fix; this is the cheap, fast guard that holds the line
 * until then.
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const SRC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

/** Vitest transforms test files and shims `__dirname` into them, so a test
 *  using it is correct and must not fail this guard. */
function isTestFile(rel: string): boolean {
  return (
    rel.includes(`${path.sep}__tests__${path.sep}`) ||
    /\.(test|spec)\.[cm]?tsx?$/.test(rel)
  );
}

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules') continue;
      walk(full, out);
    } else if (/\.[cm]?tsx?$/.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

describe('ESM runtime source', () => {
  it('never references __dirname or __filename outside test files', () => {
    const offenders: string[] = [];
    for (const file of walk(SRC)) {
      const rel = path.relative(SRC, file);
      if (isTestFile(rel)) continue;
      const text = fs.readFileSync(file, 'utf8');
      // Word-boundary match so a comment mentioning the identifier by name
      // (this file's own docblock, for instance) is not what we key on —
      // only real identifier usage. Comments are stripped first for the
      // same reason: a doc comment explaining the hazard is not the hazard.
      const code = text
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/^[ \t]*\/\/.*$/gm, '');
      if (/\b__(dirname|filename)\b/.test(code)) {
        offenders.push(rel);
      }
    }
    expect(
      offenders,
      `These runtime modules use __dirname/__filename in an ESM package and will ` +
        `throw at import time under \`npx tsx\` (the production CMD). Resolve paths ` +
        `from import.meta.url instead:\n  ${offenders.join('\n  ')}`,
    ).toEqual([]);
  });
});
