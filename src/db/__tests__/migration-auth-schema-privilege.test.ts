/**
 * Static gate: no migration may create objects inside the `auth` schema
 * without first checking that the connecting role actually holds CREATE on
 * it.
 *
 * Why this exists. `000_local_auth_stub.sql` builds a stub `auth` schema so
 * plain-Postgres deploys (docker compose, CI) can satisfy the `auth.users`
 * foreign keys that migrations 005+ declare. It was written to be a silent
 * no-op on managed Supabase, and every statement carried `IF NOT EXISTS` —
 * which reads like enough, and is not. On a live Supabase project the `auth`
 * schema is owned by `supabase_auth_admin`; even the `postgres` role the
 * connection string uses cannot create in it. Postgres checks schema
 * permission BEFORE evaluating `IF NOT EXISTS`, so the statement raised
 * `42501 permission denied for schema auth` rather than skipping. Verified
 * against a live project on 2026-08-19: `has_schema_privilege('postgres',
 * 'auth', 'CREATE')` is false there while `auth.users` exists.
 *
 * `auto-migrate` catches per-migration failures and continues, so this
 * never blocked a boot — it printed a FAILED line on every deploy forever,
 * which is worse than a hard failure in one specific way: it trains whoever
 * reads the logs to expect a red line there, and the next real migration
 * failure sits next to it unnoticed.
 *
 * The gate is file-level and deliberately coarse: a migration that touches
 * `auth.*` with DDL must mention the privilege check somewhere. A regex
 * cannot prove the guard actually wraps the statement, but it can force the
 * author to think about the permission at all, which is the step that was
 * missed.
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const MIGRATIONS_DIR = path.resolve(__dirname, '../../..', 'supabase', 'migrations');

/** Strips `--` line comments so prose about auth.users can't trip the scan. */
function withoutComments(sql: string): string {
  return sql
    .split('\n')
    .filter((line) => !line.trim().startsWith('--'))
    .join('\n');
}

/**
 * DDL that would need CREATE (or TRIGGER) rights on the `auth` schema.
 *
 * Two things are deliberately NOT matched, both verified against the live
 * project on 2026-08-19 rather than assumed:
 *
 *   - `REFERENCES auth.users(id)` in a column definition. A foreign key
 *     needs REFERENCES on the target table, which managed Supabase grants.
 *     Migrations 005/006/007/012 declare exactly that and applied cleanly.
 *   - `CREATE TRIGGER ... ON auth.users`. A trigger needs TRIGGER on the
 *     table, again granted. 005's `on_auth_user_created` applied cleanly.
 *
 * What IS matched is creating an object whose own name lives in `auth`
 * (a table, function, view, type, sequence) — the thing that needs CREATE
 * on the schema itself, and the thing that actually failed.
 *
 * `CREATE INDEX ... ON auth.<table>` is matched too, on the reasoning that
 * indexing a platform-owned table needs ownership. No migration does this
 * today, so unlike the two exclusions above it rests on reasoning rather
 * than on a live result; if a future migration needs it, verify before
 * assuming the guard is the right answer.
 */
const AUTH_DDL = [
  /\bCREATE\s+(?:OR\s+REPLACE\s+)?(?:TABLE|VIEW|SEQUENCE|TYPE|FUNCTION)\s+(?:IF\s+NOT\s+EXISTS\s+)?auth\.[a-z_]+/gi,
  /\bCREATE\s+(?:UNIQUE\s+)?INDEX\b[^;]*?\bON\s+auth\.[a-z_]+/gis,
];

const PRIVILEGE_GUARD = /has_schema_privilege\s*\(\s*current_user\s*,\s*'auth'\s*,\s*'CREATE'\s*\)/i;

function migrationFiles(): string[] {
  return fs.readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith('.sql')).sort();
}

describe('migrations never create in the auth schema unguarded', () => {
  it('finds the migrations directory', () => {
    expect(fs.existsSync(MIGRATIONS_DIR)).toBe(true);
    expect(migrationFiles().length).toBeGreaterThan(0);
  });

  it.each(migrationFiles())('%s', (filename) => {
    const sql = withoutComments(fs.readFileSync(path.join(MIGRATIONS_DIR, filename), 'utf8'));
    const authDdl = AUTH_DDL.flatMap((re) => sql.match(re) ?? []);
    if (authDdl.length === 0) return; // nothing to guard

    expect(
      PRIVILEGE_GUARD.test(sql),
      `${filename} creates objects in the auth schema (${authDdl.length} statement(s), first: ` +
        `"${authDdl[0].replace(/\s+/g, ' ').slice(0, 80)}…") but never checks ` +
        `has_schema_privilege(current_user, 'auth', 'CREATE'). On managed Supabase the auth ` +
        `schema is owned by the platform and this raises 42501 — IF NOT EXISTS does not help, ` +
        `because permission is checked before existence.`,
    ).toBe(true);
  });

  it('000_local_auth_stub still builds the stub when the role DOES own the schema', () => {
    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, '000_local_auth_stub.sql'), 'utf8');
    // The guard must be a conjunction with an existence check, not a bare
    // privilege check — otherwise a plain-Postgres deploy that re-runs the
    // file would try to recreate a table it already owns.
    expect(sql).toMatch(/to_regclass\s*\(\s*'auth\.users'\s*\)\s+IS\s+NULL/i);
    expect(sql).toMatch(PRIVILEGE_GUARD);
    // And it must still contain the stub definition itself — a "fix" that
    // deleted the table would break every plain-Postgres deploy's FKs.
    expect(sql).toMatch(/CREATE TABLE auth\.users/i);
  });
});
