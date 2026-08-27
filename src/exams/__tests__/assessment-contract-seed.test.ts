/**
 * The seed row and the compiled module are the LAST two statements of the
 * marking fact that still exist (plan D7/E6 deleted the other three). This
 * test is what keeps them from becoming two.
 *
 * It parses `supabase/migrations/050_assessment_contracts.sql` — the real
 * file, not a fixture — pulls the seeded values out of the INSERT, and
 * asserts they equal `COMPILED_ASSESSMENT_CONTRACT` exactly. Edit either
 * side alone and this fails, naming what drifted.
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  COMPILED_ASSESSMENT_CONTRACT,
  COMPILED_CONTRACT_KEY,
} from '../marking-constants';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const MIGRATION_PATH = path.join(REPO_ROOT, 'supabase/migrations/050_assessment_contracts.sql');

function migrationSql(): string {
  return fs.readFileSync(MIGRATION_PATH, 'utf8');
}

/**
 * Pull the VALUES tuple out of the seed INSERT. Deliberately a narrow
 * parse over a file this repo controls: a general SQL parser would be more
 * machinery than the one statement warrants, and a parse failure here is
 * itself a useful signal that the seed stopped looking like the thing this
 * test knows how to check.
 */
function seededValues(): {
  id: string;
  exam: string;
  paper: string;
  year: number;
  marking: unknown;
  official_source_url: string;
  verified_at: string;
} {
  const sql = migrationSql();
  const insertIdx = sql.indexOf('INSERT INTO assessment_contracts');
  expect(insertIdx, 'the migration must contain the seed INSERT').toBeGreaterThan(-1);

  const tuple = sql.slice(insertIdx);

  const quoted = (label: string, re: RegExp): string => {
    const m = tuple.match(re);
    expect(m, `could not read ${label} out of the seed INSERT`).toBeTruthy();
    return m![1];
  };

  // The JSONB literal: a single-quoted JSON object cast to ::jsonb.
  const markingRaw = quoted('marking', /'(\{"mcq".*?\})'::jsonb/s);

  // The three key columns + provenance, in the order the INSERT lists them.
  const values = quoted('the VALUES tuple', /VALUES\s*\(([\s\S]*?)\)\s*ON CONFLICT/);
  const parts = values
    .replace(/'(\{"mcq".*?\})'::jsonb/s, '__MARKING__')
    .split(',')
    .map((s) => s.trim());

  const unquote = (s: string) => s.replace(/^'/, '').replace(/'$/, '');

  return {
    id: unquote(parts[0]),
    exam: unquote(parts[1]),
    paper: unquote(parts[2]),
    year: Number(parts[3]),
    marking: JSON.parse(markingRaw),
    official_source_url: unquote(parts[5]),
    verified_at: unquote(parts[6]),
  };
}

describe('assessment_contracts seed row ↔ compiled marking module', () => {
  it('the migration file exists at the number plan E14 reserves', () => {
    expect(fs.existsSync(MIGRATION_PATH)).toBe(true);
  });

  it('seeds the key the compiled contract answers for', () => {
    const seeded = seededValues();
    expect(seeded.exam).toBe(COMPILED_CONTRACT_KEY.exam);
    expect(seeded.paper).toBe(COMPILED_CONTRACT_KEY.paper);
    expect(seeded.year).toBe(COMPILED_CONTRACT_KEY.year);
    expect(seeded.id).toBe(
      `${COMPILED_CONTRACT_KEY.exam}-${COMPILED_CONTRACT_KEY.paper}-${COMPILED_CONTRACT_KEY.year}`,
    );
  });

  it('seeds marking values byte-equal to the compiled contract', () => {
    const seeded = seededValues();
    // Round-trip the compiled object through JSON so the comparison is on
    // the values that actually survive the JSONB column, not on TypeScript
    // object identity.
    const compiled = JSON.parse(JSON.stringify(COMPILED_ASSESSMENT_CONTRACT.marking));
    expect(seeded.marking).toEqual(compiled);
  });

  it('seeds the same provenance the compiled contract claims', () => {
    const seeded = seededValues();
    expect(seeded.official_source_url).toBe(COMPILED_ASSESSMENT_CONTRACT.official_source_url);
    expect(seeded.verified_at).toBe(COMPILED_ASSESSMENT_CONTRACT.verified_at);
  });

  it('every seeded strategy id is one this build actually registers', async () => {
    const { resolveMarkingStrategy, listMarkingStrategyIds } = await import('../../scoring/marking-strategy');
    const seeded = seededValues().marking as Record<string, { strategy: string }>;
    for (const [kind, entry] of Object.entries(seeded)) {
      expect(
        resolveMarkingStrategy(entry.strategy),
        `seed row's ${kind}.strategy '${entry.strategy}' is not registered; ` +
        `known: ${listMarkingStrategyIds().join(', ')}`,
      ).toBeDefined();
    }
  });

  it('is idempotent — CREATE TABLE IF NOT EXISTS and ON CONFLICT DO NOTHING', () => {
    const sql = migrationSql();
    expect(sql).toMatch(/CREATE TABLE IF NOT EXISTS assessment_contracts/);
    expect(sql).toMatch(/CREATE UNIQUE INDEX IF NOT EXISTS/);
    expect(sql).toMatch(/ON CONFLICT \(id\) DO NOTHING/);
  });
});
