// @ts-nocheck
/**
 * atom-versions.ts — DB layer for the atom_versions table.
 *
 * Stable atom_id + separate version table (eng-review decision) preserves
 * atom_engagements continuity across regens. Only one version is `active`
 * per atom at any time, enforced by a partial unique index.
 *
 * Graceful degradation: when DB unavailable, write/read return null and
 * orchestrator still produces drafts (just without versioning). Drafts
 * still persist in content-studio's JSONL log via the existing pipeline.
 */

import pg from 'pg';
import type { GenerationMeta } from './types';

const { Pool } = pg;
let _pool: any = null;
function getPool() {
  if (_pool) return _pool;
  if (!process.env.DATABASE_URL) return null;
  _pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 3 });
  return _pool;
}

export interface AtomVersion {
  atom_id: string;
  version_n: number;
  content: string;
  generation_meta: GenerationMeta;
  generated_at: string;
  active: boolean;
  improvement_reason: string | null;
}

/**
 * Append a new version. The new version is NOT activated by default —
 * call `activate()` after admin approval.
 */
export async function appendVersion(
  atom_id: string,
  content: string,
  meta: GenerationMeta,
  improvement_reason?: string,
): Promise<AtomVersion | null> {
  const pool = getPool();
  if (!pool) return null;
  try {
    const r = await pool.query(
      `INSERT INTO atom_versions (atom_id, version_n, content, generation_meta, improvement_reason)
         SELECT $1, COALESCE(MAX(version_n), 0) + 1, $2, $3, $4
           FROM atom_versions WHERE atom_id = $1
         RETURNING atom_id, version_n, content, generation_meta, generated_at, active, improvement_reason`,
      [atom_id, content, JSON.stringify(meta), improvement_reason ?? null],
    );
    return r.rows[0] ? mapRow(r.rows[0]) : null;
  } catch (err) {
    console.warn(`[atom-versions] append failed for ${atom_id}: ${(err as Error).message}`);
    return null;
  }
}

/**
 * Activate one version atomically. Deactivates the previously active
 * version in the same transaction so the partial unique index doesn't
 * race against itself.
 */
export async function activate(atom_id: string, version_n: number): Promise<boolean> {
  const pool = getPool();
  if (!pool) return false;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      'UPDATE atom_versions SET active = FALSE WHERE atom_id = $1 AND active = TRUE',
      [atom_id],
    );
    const r = await client.query(
      'UPDATE atom_versions SET active = TRUE WHERE atom_id = $1 AND version_n = $2',
      [atom_id, version_n],
    );
    await client.query('COMMIT');
    return r.rowCount > 0;
  } catch (err) {
    await client.query('ROLLBACK').catch(() => undefined);
    console.warn(`[atom-versions] activate failed for ${atom_id} v${version_n}: ${(err as Error).message}`);
    return false;
  } finally {
    client.release();
  }
}

export async function listVersions(atom_id: string): Promise<AtomVersion[]> {
  const pool = getPool();
  if (!pool) return [];
  try {
    const r = await pool.query(
      'SELECT atom_id, version_n, content, generation_meta, generated_at, active, improvement_reason FROM atom_versions WHERE atom_id = $1 ORDER BY version_n DESC',
      [atom_id],
    );
    return r.rows.map(mapRow);
  } catch (err) {
    console.warn(`[atom-versions] list failed for ${atom_id}: ${(err as Error).message}`);
    return [];
  }
}

export async function getActiveVersion(atom_id: string): Promise<AtomVersion | null> {
  const pool = getPool();
  if (!pool) return null;
  try {
    const r = await pool.query(
      'SELECT atom_id, version_n, content, generation_meta, generated_at, active, improvement_reason FROM atom_versions WHERE atom_id = $1 AND active = TRUE',
      [atom_id],
    );
    return r.rows[0] ? mapRow(r.rows[0]) : null;
  } catch {
    return null;
  }
}

function mapRow(row: any): AtomVersion {
  return {
    atom_id: row.atom_id,
    version_n: row.version_n,
    content: row.content,
    generation_meta: typeof row.generation_meta === 'string' ? JSON.parse(row.generation_meta) : row.generation_meta,
    generated_at: row.generated_at,
    active: row.active,
    improvement_reason: row.improvement_reason,
  };
}
