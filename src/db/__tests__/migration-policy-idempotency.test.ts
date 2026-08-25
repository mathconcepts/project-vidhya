/**
 * Static gate: every `CREATE POLICY` in a migration must be idempotent.
 *
 * Why this exists. Postgres has no `CREATE POLICY IF NOT EXISTS`. Re-running
 * a migration that creates a policy which already exists raises
 * `42710 policy "..." for table "..." already exists` — and `auto-migrate`
 * runs each file in a transaction, so that one statement rolls the WHOLE
 * migration back and the `_migrations` row is never written. The next boot
 * retries it, hits the same error, and rolls back again. Permanently.
 *
 * Observed on the live project on 2026-08-25: migrations 003, 005 and 006
 * were absent from `_migrations` (47 of 50 recorded) while every table,
 * index, policy and trigger they define was present in the database. Their
 * objects had been created out-of-band, so the migrations could never
 * re-apply cleanly, and every deploy printed three FAILED lines. Verified by
 * replaying one policy from each file against the live database — all three
 * returned 42710.
 *
 * Nothing was functionally missing, which is precisely what makes it worth
 * gating: a permanently-red line in the deploy log trains whoever reads it
 * to expect red there, and the next real migration failure sits next to it
 * unnoticed.
 *
 * The repo already had the fix idiom — 001, 004 and 013 wrap their policies
 * in `DO $$ BEGIN ... EXCEPTION WHEN duplicate_object THEN NULL; END $$;`.
 * Someone hit this before and fixed those three; 003/005/006 were missed.
 * This gate is what makes "missed" impossible rather than merely unlikely.
 *
 * `DO ... EXCEPTION` is deliberately the accepted form rather than
 * `DROP POLICY IF EXISTS` + `CREATE POLICY`. Dropping first would silently
 * replace a policy whose live definition had diverged from the migration,
 * turning a loud no-op into a quiet permission change.
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const MIGRATIONS_DIR = path.resolve(__dirname, '../../..', 'supabase', 'migrations');

/** Strips `--` line comments so prose mentioning a policy can't trip the scan. */
function withoutComments(sql: string): string {
  return sql
    .split('\n')
    .filter((line) => !line.trim().startsWith('--'))
    .join('\n');
}

function migrationFiles(): string[] {
  return fs.readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith('.sql')).sort();
}

/**
 * Splits on the `DO $$ ... $$;` blocks (and bare `BEGIN ... EXCEPTION ... END`
 * blocks, which 001 uses inside an outer DO block) that carry a
 * `duplicate_object` handler, returning only the SQL left OUTSIDE them. A
 * `CREATE POLICY` surviving in that remainder is unguarded.
 *
 * Deliberately coarse: it proves a policy sits inside *a* duplicate_object
 * handler, not that the handler is the nearest enclosing one. A regex cannot
 * establish that, and the failure it does catch — a bare `CREATE POLICY` with
 * no handler anywhere near it — is the one that actually happened.
 */
function outsideDuplicateObjectGuards(sql: string): string {
  return sql
    // DO $$ BEGIN ... EXCEPTION WHEN duplicate_object ... END $$;
    .replace(/DO\s+\$\$[\s\S]*?duplicate_object[\s\S]*?END\s*;?\s*\$\$\s*;/gi, '')
    // Bare BEGIN ... EXCEPTION WHEN duplicate_object ... END; (nested form)
    .replace(/\bBEGIN\b[\s\S]*?duplicate_object[\s\S]*?\bEND\s*;/gi, '');
}

const CREATE_POLICY = /\bCREATE\s+POLICY\s+("[^"]+"|[a-z_][a-z0-9_]*)/gi;

describe('migrations create policies idempotently', () => {
  it('finds the migrations directory', () => {
    expect(fs.existsSync(MIGRATIONS_DIR)).toBe(true);
    expect(migrationFiles().length).toBeGreaterThan(0);
  });

  it.each(migrationFiles())('%s', (filename) => {
    const sql = withoutComments(fs.readFileSync(path.join(MIGRATIONS_DIR, filename), 'utf8'));
    if (!/CREATE\s+POLICY/i.test(sql)) return; // nothing to guard

    const unguarded = outsideDuplicateObjectGuards(sql).match(CREATE_POLICY) ?? [];

    expect(
      unguarded.length,
      `${filename} has ${unguarded.length} unguarded CREATE POLICY statement(s) ` +
        `(first: ${unguarded[0]}). Postgres has no CREATE POLICY IF NOT EXISTS, so on ` +
        `any database where the policy already exists this raises 42710, rolls the whole ` +
        `migration back, and the _migrations row is never written — the migration then ` +
        `re-fails on every boot forever. Wrap it the way 001/003/004/005/006/013 do:\n\n` +
        `  DO $$ BEGIN\n` +
        `    CREATE POLICY "name" ON table ...;\n` +
        `  EXCEPTION WHEN duplicate_object THEN NULL; END $$;\n`,
    ).toBe(0);
  });

  it('the three migrations that failed in production are guarded', () => {
    // Regression pin for the specific files observed failing on 2026-08-25.
    // The it.each above would catch these anyway; naming them keeps the
    // incident legible to whoever reads this next.
    for (const filename of ['003_gate_app.sql', '005_chat_and_roles.sql', '006_notebook_readiness.sql']) {
      const sql = withoutComments(fs.readFileSync(path.join(MIGRATIONS_DIR, filename), 'utf8'));
      expect(sql, `${filename} should still create its policies`).toMatch(/CREATE\s+POLICY/i);
      expect(
        outsideDuplicateObjectGuards(sql).match(CREATE_POLICY) ?? [],
        `${filename} regressed to an unguarded CREATE POLICY`,
      ).toEqual([]);
    }
  });
});
