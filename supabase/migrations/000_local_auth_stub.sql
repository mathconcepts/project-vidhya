-- =============================================================================
-- 000_local_auth_stub.sql
-- =============================================================================
-- Purpose: Provide stub `auth` schema + functions + users table for local
--          (plain Postgres) deploys, so migrations 001..N that reference
--          Supabase's `auth.users` / `auth.role()` / `auth.uid()` apply
--          cleanly without errors.
--
-- Supabase-safe: every CREATE is conditional on the object not already
-- existing. On a real Supabase Postgres (where `auth` schema and these
-- objects are managed by the platform), this migration is a silent no-op.
--
-- Why first? Migrations are applied in lexical order (`/migrations/*.sql`
-- glob is sorted). `000_*` runs before `001_*`, guaranteeing the auth
-- contract exists before any later migration depends on it.
--
-- Owning concern: docker-compose local dev parity (CLAUDE.md "Local
-- development" + the `db` + `migrate` services in docker-compose.yml).
-- =============================================================================

-- 1. Schema --------------------------------------------------------------------
CREATE SCHEMA IF NOT EXISTS auth;

-- 2. auth.users stub -----------------------------------------------------------
-- Minimal columns needed by FK references in 005_chat_and_roles.sql,
-- 006_notebook_readiness.sql, 007_study_commander.sql, etc.
-- Real Supabase has many more columns; we only need (id) for FKs to resolve.
CREATE TABLE IF NOT EXISTS auth.users (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email              TEXT UNIQUE,
  raw_user_meta_data JSONB DEFAULT '{}',
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_auth_users_email ON auth.users(email);

-- 3. auth.role() stub ----------------------------------------------------------
-- In Supabase: returns the JWT's `role` claim (e.g. 'authenticated',
-- 'service_role'). Locally we always return 'service_role' so RLS policies
-- written as `USING (auth.role() = 'service_role')` permit access.
DO $outer$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'auth' AND p.proname = 'role'
  ) THEN
    CREATE FUNCTION auth.role() RETURNS TEXT
    LANGUAGE SQL STABLE
    AS $body$ SELECT 'service_role'::TEXT $body$;
  END IF;
END $outer$;

-- 4. auth.uid() stub -----------------------------------------------------------
-- In Supabase: returns the JWT's `sub` claim as UUID. Locally we return NULL
-- (no authenticated user concept). RLS policies that compare auth.uid() to
-- a row owner will fail-closed, which is the safe default.
DO $outer$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'auth' AND p.proname = 'uid'
  ) THEN
    CREATE FUNCTION auth.uid() RETURNS UUID
    LANGUAGE SQL STABLE
    AS $body$ SELECT NULL::UUID $body$;
  END IF;
END $outer$;

-- 5. auth.jwt() stub -----------------------------------------------------------
-- Some policies reference auth.jwt() to inspect custom claims. Stub returns
-- empty JSONB locally.
DO $outer$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'auth' AND p.proname = 'jwt'
  ) THEN
    CREATE FUNCTION auth.jwt() RETURNS JSONB
    LANGUAGE SQL STABLE
    AS $body$ SELECT '{}'::JSONB $body$;
  END IF;
END $outer$;

-- =============================================================================
-- End of 000_local_auth_stub.sql
-- =============================================================================
