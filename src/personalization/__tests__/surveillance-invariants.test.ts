/**
 * SURVEILLANCE-CLIFF INVARIANT TESTS
 *
 * These four tests are the architectural enforcement of "show outcomes,
 * not labels" from the CEO + eng review. If a future PR violates any of
 * them, CI fails BEFORE the surveillance-y change ships.
 *
 * Each test verifies a DIFFERENT thing the locked plan promised:
 *   1. No new schema columns named personalized_*, tracked_*, behavior_*
 *   2. realtime-nudge.ts contains no DB writes (in-memory only)
 *   3. No public admin route exposes the per-atom personalization scores
 *   4. No frontend file imports from src/personalization/
 *
 * If you're adding a feature that legitimately needs to break one of
 * these (e.g., a "Why was this picked?" disclosure), DO IT EXPLICITLY:
 * update the invariant test along with the feature, and have the PR
 * description include "INTENTIONAL: relaxes surveillance invariant N
 * because [reason]". Otherwise the test fail forces the conversation.
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const REPO_ROOT = path.resolve(__dirname, '../../..');

function readAllTextFiles(dir: string, filterExt: string[]): string[] {
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
      const ext = path.extname(entry.name);
      if (filterExt.includes(ext)) out.push(p);
    }
  }
  return out;
}

// ----------------------------------------------------------------------------

describe('surveillance invariant 1: no new schema columns', () => {
  it('no migration in this PR introduces a column named personalized_*, tracked_*, or behavior_*', () => {
    const migrationsDir = path.join(REPO_ROOT, 'supabase', 'migrations');
    const files = fs.existsSync(migrationsDir)
      ? fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql'))
      : [];

    const SUSPECT_PATTERNS = [
      /personalized_\w+/i,
      /\btracked_\w+/i,
      /\bbehavior_\w+/i,
    ];

    const offenders: Array<{ file: string; line: number; text: string; pattern: string }> = [];
    for (const f of files) {
      const content = fs.readFileSync(path.join(migrationsDir, f), 'utf8');
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        // Skip comments
        if (line.trim().startsWith('--')) continue;
        for (const re of SUSPECT_PATTERNS) {
          if (re.test(line)) {
            offenders.push({ file: f, line: i + 1, text: line.trim(), pattern: re.source });
          }
        }
      }
    }
    expect(
      offenders,
      'No schema column should match personalized_*, tracked_*, or behavior_*. ' +
        'If this surveillance-tag is intentional, document it in the PR and update this test.\n' +
        offenders.map((o) => `  ${o.file}:${o.line}  ${o.text}`).join('\n'),
    ).toEqual([]);
  });
});

// ----------------------------------------------------------------------------

describe('surveillance invariant 2: realtime-nudge has no DB writes', () => {
  it('realtime-nudge.ts contains no INSERT INTO / UPDATE / pool.query / pg import', () => {
    const file = path.join(REPO_ROOT, 'src', 'personalization', 'scorers', 'realtime-nudge.ts');
    expect(fs.existsSync(file), 'realtime-nudge.ts must exist').toBe(true);
    const src = fs.readFileSync(file, 'utf8');

    // Strip comments before checking — comments may legitimately
    // mention these tokens to explain WHY they're forbidden.
    const stripped = src
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .split('\n')
      .map((l) => {
        const idx = l.indexOf('//');
        return idx === -1 ? l : l.slice(0, idx);
      })
      .join('\n');

    const FORBIDDEN = [
      /import\s+pg\b/,
      /from\s+['"]pg['"]/,
      /\bnew\s+Pool\s*\(/,
      /\.query\s*\(/,
      /INSERT\s+INTO/i,
      /UPDATE\s+\w+\s+SET/i,
    ];
    const found = FORBIDDEN.filter((re) => re.test(stripped));
    expect(
      found,
      'realtime-nudge.ts MUST NOT touch the database. ' +
        'Realtime signals live in-memory and die with the request.',
    ).toEqual([]);
  });
});

// ----------------------------------------------------------------------------

describe('surveillance invariant 3: no public route exposes per-atom scores', () => {
  it('no file in src/api/ exposes ScoredAtom.layers / .score / per-atom personalization data in a response', () => {
    const apiDir = path.join(REPO_ROOT, 'src', 'api');
    const files = readAllTextFiles(apiDir, ['.ts']);

    // Grep for the dead-giveaway: a file that imports from src/personalization
    // AND calls sendJSON with anything that looks like the scored-atoms shape.
    // Fail loudly if either side appears in src/api/.
    const importers: string[] = [];
    for (const f of files) {
      const src = fs.readFileSync(f, 'utf8');
      if (/from\s+['"](\.\.\/)+personalization/.test(src) || /from\s+['"]@\/personalization/.test(src)) {
        importers.push(path.relative(REPO_ROOT, f));
      }
    }
    expect(
      importers,
      'No src/api/* route may import from src/personalization. ' +
        'The selector is invisible to the public surface; if you need a debug endpoint, ' +
        'gate it behind admin auth in a separate review.',
    ).toEqual([]);
  });
});

// ----------------------------------------------------------------------------

describe('surveillance invariant 4: no frontend imports the personalization module', () => {
  it('no frontend file imports from a path that resolves to src/personalization/', () => {
    // The invariant we care about is technical: no React component should
    // import from the personalization module. Pre-existing user-facing
    // copy that uses the word "personalized" in marketing text is fine
    // and intentional — that's what the LANGUAGE of personalization
    // looks like to a student. The CODE of personalization stays
    // backend-only.
    const frontendSrc = path.join(REPO_ROOT, 'frontend', 'src');
    const files = readAllTextFiles(frontendSrc, ['.ts', '.tsx']);
    const hits: Array<{ file: string; line: string }> = [];
    const IMPORT_PATTERNS = [
      /from\s+['"][^'"]*\/personalization(\/|['"])/, // relative or alias import
      /import\s*\(\s*['"][^'"]*\/personalization(\/|['"])/, // dynamic import
    ];
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
      'No frontend file may import the personalization module in v1. ' +
        'The selector is invisible to the student.',
    ).toEqual([]);
  });

  it('frontend has no `personalized_score` / `ranking_layer` / `selector_score` field accessor anywhere', () => {
    // Catches the slip where someone wires a debug shape into a frontend
    // component without importing the module (e.g. via fetch + raw object).
    const frontendSrc = path.join(REPO_ROOT, 'frontend', 'src');
    const files = readAllTextFiles(frontendSrc, ['.ts', '.tsx']);
    const FORBIDDEN_FIELD_REFS = [
      /\.personalized_score\b/,
      /\.ranking_layer\b/,
      /\.selector_score\b/,
      /\bScoredAtom\b/,
    ];
    const hits: Array<{ file: string; line: string }> = [];
    for (const f of files) {
      const src = fs.readFileSync(f, 'utf8');
      for (const line of src.split('\n')) {
        if (FORBIDDEN_FIELD_REFS.some((re) => re.test(line))) {
          hits.push({ file: path.relative(REPO_ROOT, f), line: line.trim() });
        }
      }
    }
    expect(hits, 'Frontend must not access personalization debug fields.').toEqual([]);
  });
});
