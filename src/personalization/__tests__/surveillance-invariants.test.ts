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
  it('no migration in this PR introduces a column named personalized_*, tracked_*, behavior_*, or student_context_*', () => {
    const migrationsDir = path.join(REPO_ROOT, 'supabase', 'migrations');
    const files = fs.existsSync(migrationsDir)
      ? fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql'))
      : [];

    const SUSPECT_PATTERNS = [
      /personalized_\w+/i,
      /\btracked_\w+/i,
      /\bbehavior_\w+/i,
      /\bstudent_context_\w+/i,  // Phase B: student-context lives in-memory only
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

describe('surveillance invariant 2b (Phase B): student-context.ts only READS, never WRITES', () => {
  it('student-context.ts contains no INSERT INTO / UPDATE — only SELECT', () => {
    const file = path.join(REPO_ROOT, 'src', 'personalization', 'student-context.ts');
    expect(fs.existsSync(file), 'student-context.ts must exist').toBe(true);
    const src = fs.readFileSync(file, 'utf8');

    // Strip comments
    const stripped = src
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .split('\n')
      .map((l) => {
        const idx = l.indexOf('//');
        return idx === -1 ? l : l.slice(0, idx);
      })
      .join('\n');

    const FORBIDDEN = [
      /INSERT\s+INTO/i,
      /UPDATE\s+\w+\s+SET/i,
      /DELETE\s+FROM/i,
    ];
    const found = FORBIDDEN.filter((re) => re.test(stripped));
    expect(
      found,
      'student-context.ts MUST NOT mutate the database. ' +
        'It assembles a payload from existing tables; persistence is forbidden.',
    ).toEqual([]);
  });
});

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
    // Allowlist: the lesson-wire helper is the single eng-review-locked
    // integration point. It only re-orders atoms in place — it never
    // surfaces scores, layers, or any selector internals to the response.
    // Any OTHER import from src/personalization into src/api/ is forbidden.
    const ALLOWED_IMPORTS = [/\/personalization\/lesson-wire(['"]|$)/];
    const importers: string[] = [];
    for (const f of files) {
      const src = fs.readFileSync(f, 'utf8');
      const personalizationImports = src
        .split('\n')
        .filter((l) =>
          /from\s+['"](\.\.\/)+personalization/.test(l) ||
          /from\s+['"]@\/personalization/.test(l),
        );
      for (const line of personalizationImports) {
        if (!ALLOWED_IMPORTS.some((re) => re.test(line))) {
          importers.push(`${path.relative(REPO_ROOT, f)}: ${line.trim()}`);
        }
      }
    }
    expect(
      importers,
      'No src/api/* route may import from src/personalization (except the ' +
        'allowlisted lesson-wire helper, which is score-free). The selector ' +
        'is invisible to the public surface; if you need a debug endpoint, ' +
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

  it('CompoundingCard.tsx never references comparison/leaderboard/peer data', () => {
    // Locked plan invariant: the CompoundingCard surfaces personal
    // trajectory ("you cracked X in October"), NOT social comparison
    // ("you ranked above 80% of peers"). A future PR that adds peer
    // data here triggers a "calm/no-comparisons" review.
    const file = path.join(REPO_ROOT, 'frontend', 'src', 'components', 'app', 'CompoundingCard.tsx');
    expect(fs.existsSync(file)).toBe(true);
    const src = fs.readFileSync(file, 'utf8');
    const FORBIDDEN = [
      /\bpeer_\w+/i,
      /\bleaderboard/i,
      /\bpercentile\b/i,
      /\branked above\b/i,
      /\bcompared to\b/i,
      /\bother students\b/i,
    ];
    const found = FORBIDDEN.filter((re) => re.test(src));
    expect(
      found,
      'CompoundingCard.tsx must surface personal trajectory only — no peer/comparison framing.',
    ).toEqual([]);
  });

  it('/api/student/compounding response shape is allowlisted (server side)', () => {
    // The compounding endpoint's payload is the bridge from gbrain →
    // student-visible bytes. Tighten the allowlist so a future PR can't
    // sneak comparison/peer fields through without a review.
    const file = path.join(REPO_ROOT, 'src', 'api', 'me-routes.ts');
    const src = fs.readFileSync(file, 'utf8');
    const FORBIDDEN_FIELDS = [
      /percentile\s*:/i,
      /peer_\w+\s*:/i,
      /leaderboard\s*:/i,
      /vs_average\s*:/i,
      /rank\s*:/i,
    ];
    // Restrict the scan to the handleCompounding function block.
    const startIdx = src.indexOf('async function handleCompounding');
    const endIdx = src.indexOf('export const meRoutes', startIdx);
    expect(startIdx, 'handleCompounding handler must exist').toBeGreaterThan(-1);
    const block = src.slice(startIdx, endIdx === -1 ? undefined : endIdx);
    const found = FORBIDDEN_FIELDS.filter((re) => re.test(block));
    expect(
      found,
      'handleCompounding must not emit peer/comparison fields to the client.',
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

// ----------------------------------------------------------------------------

describe('surveillance invariant 5: persona files contain no real PII / UUIDs', () => {
  it('data/personas/*.yaml contain no UUIDs, session ids, or email-shaped strings', () => {
    const dir = path.join(REPO_ROOT, 'data', 'personas');
    if (!fs.existsSync(dir)) return; // no personas yet — vacuously fine
    const files = fs.readdirSync(dir).filter((f) => f.endsWith('.yaml'));

    // Real UUID v1-5 shape — 32 hex chars + 4 dashes.
    const UUID_RE = /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/i;
    const EMAIL_RE = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i;
    const SESSION_RE = /\bsession[_-]?id\s*:/i;

    const offenders: Array<{ file: string; line: number; text: string }> = [];
    for (const f of files) {
      const content = fs.readFileSync(path.join(dir, f), 'utf8');
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.trim().startsWith('#')) continue; // skip comments
        if (UUID_RE.test(line) || EMAIL_RE.test(line) || SESSION_RE.test(line)) {
          offenders.push({ file: f, line: i + 1, text: line.trim() });
        }
      }
    }
    expect(
      offenders,
      'Persona YAML files must not contain real UUIDs, emails, or session_ids. ' +
        'Personas are scripted demo data; never paste real student rows here.\n' +
        offenders.map((o) => `  ${o.file}:${o.line}  ${o.text}`).join('\n'),
    ).toEqual([]);
  });
});

describe('surveillance invariant 6: scenario routes never expose scorer internals', () => {
  it('any future src/api/admin-scenarios-routes.ts may not echo layers/scores/weights', () => {
    const file = path.join(REPO_ROOT, 'src', 'api', 'admin-scenarios-routes.ts');
    if (!fs.existsSync(file)) return; // route doesn't exist yet — invariant is forward-looking
    const src = fs.readFileSync(file, 'utf8');
    const FORBIDDEN_FIELDS = [
      /\blayers\s*:/,
      /\bscore\s*:/,
      /\blayer_weights\s*:/,
      /\bScoredAtom\b/,
    ];
    const found = FORBIDDEN_FIELDS.filter((re) => re.test(src));
    expect(
      found,
      'admin-scenarios-routes.ts must not surface scorer internals to the wire.',
    ).toEqual([]);
  });
});

describe('surveillance invariant 7: /admin/scenarios is admin-gated', () => {
  it('admin-scenarios-routes.ts (when present) requires the admin role', () => {
    const file = path.join(REPO_ROOT, 'src', 'api', 'admin-scenarios-routes.ts');
    if (!fs.existsSync(file)) return;
    const src = fs.readFileSync(file, 'utf8');
    expect(
      /requireRole\s*\(\s*['"]admin['"]\s*\)/.test(src),
      'admin-scenarios-routes.ts must call requireRole("admin"). ' +
        'Persona trial output is operator-only debug data.',
    ).toBe(true);
  });
});
