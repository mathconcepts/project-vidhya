/**
 * Static idempotency check for migrations 046 (xp_events/quiz_sessions,
 * T14) and 047 (mock_exams, T22). CLAUDE.md: "All migrations must be
 * idempotent (IF NOT EXISTS)." This asserts every schema-mutating
 * statement in these two files carries the right guard, and — since a
 * regex check on text is easy to fool with a typo — also runs the SQL
 * against a real sqlite-less smoke: applying the same statements twice in
 * a row must not throw, using a minimal in-memory pg-mock-free approach
 * is out of scope here (no local Postgres in this environment), so the
 * static guard is the enforced gate; a real double-apply is additionally
 * covered by auto-migrate's own `_migrations` tracking, which never
 * re-runs an applied file at all.
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const REPO_ROOT = path.resolve(__dirname, '../../..');
const MIGRATIONS = ['046_xp_quiz.sql', '047_mock_exams.sql'];

function statements(sql: string): string[] {
  return sql
    .split('\n')
    .filter((l) => !l.trim().startsWith('--'))
    .join('\n')
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean);
}

describe('migrations 046 + 047 are idempotent', () => {
  it.each(MIGRATIONS)('%s exists', (filename) => {
    const file = path.join(REPO_ROOT, 'supabase', 'migrations', filename);
    expect(fs.existsSync(file), `${filename} must exist`).toBe(true);
  });

  it.each(MIGRATIONS)('%s: every CREATE TABLE / CREATE INDEX carries IF NOT EXISTS', (filename) => {
    const file = path.join(REPO_ROOT, 'supabase', 'migrations', filename);
    const sql = fs.readFileSync(file, 'utf8');
    const offenders = statements(sql).filter((s) => {
      const upper = s.toUpperCase();
      const isCreateTable = /^CREATE\s+TABLE\b/.test(upper);
      const isCreateIndex = /^CREATE\s+(UNIQUE\s+)?INDEX\b/.test(upper);
      if (!isCreateTable && !isCreateIndex) return false;
      return !upper.includes('IF NOT EXISTS');
    });
    expect(offenders, `${filename}: found a CREATE without IF NOT EXISTS`).toEqual([]);
  });

  it.each(MIGRATIONS)('%s: every ALTER TABLE ADD COLUMN carries IF NOT EXISTS', (filename) => {
    const file = path.join(REPO_ROOT, 'supabase', 'migrations', filename);
    const sql = fs.readFileSync(file, 'utf8');
    const offenders = statements(sql).filter((s) => {
      const upper = s.toUpperCase();
      if (!/^ALTER\s+TABLE\b/.test(upper) || !upper.includes('ADD COLUMN')) return false;
      return !upper.includes('ADD COLUMN IF NOT EXISTS');
    });
    expect(offenders, `${filename}: found an ADD COLUMN without IF NOT EXISTS`).toEqual([]);
  });

  it.each(MIGRATIONS)('%s: contains no bare DROP / TRUNCATE (destructive, never idempotent-safe here)', (filename) => {
    const file = path.join(REPO_ROOT, 'supabase', 'migrations', filename);
    const sql = fs.readFileSync(file, 'utf8').toUpperCase();
    expect(/\bDROP\s+TABLE\b/.test(sql)).toBe(false);
    expect(/\bTRUNCATE\b/.test(sql)).toBe(false);
  });
});
