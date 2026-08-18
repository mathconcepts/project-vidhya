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

/**
 * Invariant 1 — new schema columns are DENIED BY DEFAULT.
 *
 * ── Why this was inverted ───────────────────────────────────────────────
 *
 * It used to be a denylist of four name prefixes: `personalized_*`,
 * `tracked_*`, `behavior_*`, `student_context_*`. That stops the columns
 * someone names naively and waves through the ones named well. A plan to add
 * `language_of_instruction`, `bandwidth_tier` and `device_class` — bandwidth
 * and device being socioeconomic proxies, the most sensitive attribute class
 * in the product — would have passed CI green, because none of those names
 * match any of those four patterns.
 *
 * A guardrail written against a naming convention protects the convention,
 * not the concept.
 *
 * ── How the inversion is affordable ─────────────────────────────────────
 *
 * There are 307 distinct column names across 40 migrations, so hand-reviewing
 * them to build a true allowlist is a day of work that mostly re-blesses
 * existing schema. Instead this uses the ratchet shape the repo already runs
 * twice (`pg-import-allowlist.json`, `fork-test-lint-baseline.json`): the
 * current 307 are grandfathered into a baseline file, and anything NOT in it
 * fails. The list may shrink freely; growing it takes an explicit diff to a
 * file whose header says what the reviewer is being asked to decide.
 *
 * The denylist is kept ON TOP of the ratchet, because those four shapes stay
 * forbidden even with an explicit diff.
 */
describe('surveillance invariant 1: new schema columns are denied by default', () => {
  const migrationsDir = path.join(REPO_ROOT, 'supabase', 'migrations');
  const BASELINE_PATH = path.join(REPO_ROOT, 'scripts', 'schema-column-baseline.json');

  /** Column declarations, as `<name> <TYPE>` at the start of a line. */
  const COLUMN_DECL = /^([a-z_][a-z0-9_]*)\s+(TEXT|UUID|INT|INTEGER|BIGINT|BOOLEAN|NUMERIC|FLOAT|JSONB|TIMESTAMPTZ|DATE|SERIAL)/i;

  function declaredColumns(): Array<{ file: string; line: number; name: string; text: string }> {
    if (!fs.existsSync(migrationsDir)) return [];
    const out: Array<{ file: string; line: number; name: string; text: string }> = [];
    for (const f of fs.readdirSync(migrationsDir).filter((x) => x.endsWith('.sql'))) {
      const lines = fs.readFileSync(path.join(migrationsDir, f), 'utf8').split('\n');
      lines.forEach((line, i) => {
        const s = line.trim();
        if (!s || s.startsWith('--')) return;
        const m = s.match(COLUMN_DECL);
        if (m) out.push({ file: f, line: i + 1, name: m[1], text: s });
      });
    }
    return out;
  }

  it('every column in every migration is on the reviewed baseline', () => {
    const baseline = new Set<string>(JSON.parse(fs.readFileSync(BASELINE_PATH, 'utf8')).columns);
    const unlisted = declaredColumns().filter((c) => !baseline.has(c.name));

    expect(
      unlisted.map((c) => `${c.file}:${c.line}  ${c.name}`),
      'A migration declares a column that is not on scripts/schema-column-baseline.json.\n' +
        'This is deliberate friction. Before adding the name to that file, ask whether a new\n' +
        'per-student attribute should exist at all — that question is the whole point of the\n' +
        'gate. Add it in the SAME PR as the migration so the two are reviewed together.',
    ).toEqual([]);
  });

  it('still refuses the four surveillance-shaped names outright', () => {
    // These stay forbidden even WITH an explicit baseline entry. The ratchet
    // asks "should this exist?"; this asks nothing, it just says no.
    const FORBIDDEN = [
      /^personalized_/i,
      /^tracked_/i,
      /^behavior_/i,
      /^student_context_/i,
    ];
    const offenders = declaredColumns().filter((c) => FORBIDDEN.some((re) => re.test(c.name)));
    expect(
      offenders.map((o) => `${o.file}:${o.line}  ${o.text}`),
      'These name shapes are refused regardless of the baseline.',
    ).toEqual([]);
  });

  it('the baseline is a real snapshot, not an empty file that passes vacuously', () => {
    // A baseline of [] would make the first test pass only if the scanner
    // found nothing — which is also what a broken scanner looks like.
    const baseline = JSON.parse(fs.readFileSync(BASELINE_PATH, 'utf8'));
    expect(baseline.columns.length).toBeGreaterThan(100);
    expect(declaredColumns().length).toBeGreaterThan(100);
  });

  it('would catch the circumstance columns that motivated this inversion', () => {
    // The regression, stated as data: these three names defeat the old
    // denylist and must be caught by the new ratchet.
    const baseline = new Set<string>(JSON.parse(fs.readFileSync(BASELINE_PATH, 'utf8')).columns);
    for (const name of ['language_of_instruction', 'bandwidth_tier', 'device_class']) {
      expect(baseline.has(name), `${name} must not already be grandfathered`).toBe(false);
    }
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

describe('surveillance invariant 8: blueprints describe content choices, never student behaviour', () => {
  it.each([
    ['027_content_blueprints.sql'],
    ['028_blueprint_rulesets.sql'],
  ])('migration %s contains no behavioural column names', (filename) => {
    const file = path.join(REPO_ROOT, 'supabase', 'migrations', filename);
    if (!fs.existsSync(file)) return; // forward-looking until migration lands
    // Strip comments so explanations like "-- no user_id here" don't trip the grep.
    const sql = fs
      .readFileSync(file, 'utf8')
      .split('\n')
      .filter((line) => !line.trim().startsWith('--'))
      .join('\n');
    const FORBIDDEN = [
      /\buser_id\b/i,
      /\bsession_id\b/i,
      /\bstudent_id\b/i,
      /\bbehavior_\w+/i,
      /\btracked_\w+/i,
    ];
    const offenders: string[] = [];
    for (const re of FORBIDDEN) {
      if (re.test(sql)) offenders.push(re.source);
    }
    expect(
      offenders,
      `${filename} must not introduce behavioural / per-student columns. Blueprints describe content only.`,
    ).toEqual([]);
  });

  it('blueprint validator (when present) refuses forbidden field names at any depth', async () => {
    const file = path.join(REPO_ROOT, 'src', 'blueprints', 'validator.ts');
    if (!fs.existsSync(file)) return;
    const src = fs.readFileSync(file, 'utf8');
    expect(
      /SURVEILLANCE_FORBIDDEN/.test(src),
      'validator.ts must export a SURVEILLANCE_FORBIDDEN guard regex',
    ).toBe(true);
  });
});

describe('surveillance invariant 10: cohort attention surface stays narrow', () => {
  it('admin-cohort-routes.ts caps the response shape and forbids names/emails', () => {
    const file = path.join(REPO_ROOT, 'src', 'api', 'admin-cohort-routes.ts');
    if (!fs.existsSync(file)) return;
    const src = fs.readFileSync(file, 'utf8');
    // Strip comments before checking — comments may legitimately mention these tokens
    // to explain WHY they're forbidden.
    const stripped = src
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .split('\n')
      .map((l) => {
        const idx = l.indexOf('//');
        return idx === -1 ? l : l.slice(0, idx);
      })
      .join('\n');

    // ATTENTION_CAP must exist + be a small constant. Surfacing 200 students
    // would defeat the surveillance-discipline goal.
    expect(/ATTENTION_CAP\s*=\s*\d{1,2}\b/.test(stripped),
      'ATTENTION_CAP must be a 1-2 digit literal (cap of 10 today). Surveilling more than ~20 students at once defeats the purpose.',
    ).toBe(true);

    // Must NOT echo names / emails from any table.
    const FORBIDDEN_FIELDS = [
      /\bemail\s*:/,
      /\bstudent_name\s*:/,
      /\bdisplay_name\s*:/,
      /\bfull_name\s*:/,
    ];
    const found = FORBIDDEN_FIELDS.filter((re) => re.test(stripped));
    expect(found,
      'admin-cohort-routes.ts must not echo personally-identifying fields. Use session_id only.',
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

// ----------------------------------------------------------------------------

describe('surveillance invariant 11: XP is personal-only — no leagues, no peer/rank fields', () => {
  // T14 (B5): "Personal XP; no leagues" (locked plan decision D2). Invariant
  // 10 already covers the cohort surface generally; this writes the XP-
  // specific promise explicitly per ENG-D4 #12: xp_* fields must never
  // appear in any cohort/peer/admin-aggregate payload, and no XP route may
  // emit a rank/percentile/leaderboard shape to a student either.
  const FORBIDDEN_SHAPES = [
    /\brank\s*:/i,
    /\bpercentile\s*:/i,
    /\bleaderboard\b/i,
    /\bpeer_\w+\s*:/i,
    /\bcohort_avg\w*\s*:/i,
    /\bvs_average\b/i,
  ];

  it('admin-cohort-routes.ts never echoes an xp_* field', () => {
    const file = path.join(REPO_ROOT, 'src', 'api', 'admin-cohort-routes.ts');
    if (!fs.existsSync(file)) return;
    const src = fs.readFileSync(file, 'utf8');
    expect(
      /\bxp_\w+\s*:/i.test(src),
      'admin-cohort-routes.ts must not surface any xp_* field — XP stays personal-only, ' +
        'never part of the cohort-attention payload.',
    ).toBe(false);
  });

  it('the quiz/XP API routes never emit rank, percentile, leaderboard, or peer-comparison fields', () => {
    const candidates = [
      path.join(REPO_ROOT, 'src', 'api', 'quiz-routes.ts'),
      path.join(REPO_ROOT, 'src', 'gbrain', 'xp-store.ts'),
    ];
    const offenders: string[] = [];
    for (const file of candidates) {
      if (!fs.existsSync(file)) continue;
      const src = fs.readFileSync(file, 'utf8');
      for (const re of FORBIDDEN_SHAPES) {
        if (re.test(src)) offenders.push(`${path.relative(REPO_ROOT, file)}: ${re}`);
      }
    }
    expect(
      offenders,
      'XP/quiz surfaces must stay personal-only — no rank/percentile/leaderboard/peer fields.',
    ).toEqual([]);
  });

  it('migration 046 (xp_events/quiz_sessions) declares no per-student columns beyond the owning id', () => {
    const file = path.join(REPO_ROOT, 'supabase', 'migrations', '046_xp_quiz.sql');
    if (!fs.existsSync(file)) return;
    const sql = fs
      .readFileSync(file, 'utf8')
      .split('\n')
      .filter((line) => !line.trim().startsWith('--'))
      .join('\n');
    // student_id is expected exactly once per table as the owning key —
    // anything shaped like a SECOND identity column (peer_id, compared_to,
    // cohort_id) is what this guards against.
    const FORBIDDEN = [/\bpeer_id\b/i, /\bcompared_to\b/i, /\bcohort_id\b/i, /\brank\b/i];
    const offenders = FORBIDDEN.filter((re) => re.test(sql));
    expect(offenders, 'migration 046 must not introduce peer/rank/cohort columns.').toEqual([]);
  });
});
