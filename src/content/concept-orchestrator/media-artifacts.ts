// @ts-nocheck
/**
 * media-artifacts.ts — DB layer for multi-modal sidecars (§4.15).
 *
 * Wraps the media_artifacts table from migration 018. Sidecars are keyed
 * on (atom_id, version_n, kind) so a single atom version can have a GIF
 * AND audio narration without conflict.
 *
 * Storage strategy: paths point to MEDIA_STORAGE_DIR (default .data/media/).
 * Filenames are deterministic: {atom_id}.{version_n}.{ext}. This keeps
 * the file system browseable from the operator's terminal and lets the
 * audio/GIF route serve files via a simple ID lookup.
 *
 * Pruning: on regen, the orchestrator's prune-on-supersede sweep deletes
 * superseded rows + their files. Old versions don't accumulate.
 *
 * Graceful degradation: when DATABASE_URL or MEDIA_STORAGE_DIR is unset,
 * every function is a no-op so dev/free-tier doesn't crash.
 */

import fs from 'node:fs';
import path from 'node:path';
import pg from 'pg';

const { Pool } = pg;
let _pool: any = null;
function getPool() {
  if (_pool) return _pool;
  if (!process.env.DATABASE_URL) return null;
  _pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 3 });
  return _pool;
}

export const MEDIA_STORAGE_DIR = process.env.MEDIA_STORAGE_DIR
  ?? path.join(process.cwd(), '.data', 'media');

export type MediaKind = 'gif' | 'audio_narration';
export type MediaStatus = 'queued' | 'rendering' | 'done' | 'failed';

export interface MediaArtifact {
  atom_id: string;
  version_n: number;
  kind: MediaKind;
  status: MediaStatus;
  src_path: string;
  bytes: number | null;
  duration_ms: number | null;
  generated_at: string;
  expires_at: string | null;
  error_log: string | null;
}

const EXT_BY_KIND: Record<MediaKind, string> = {
  gif: 'gif',
  audio_narration: 'mp3',
};

function ensureStorageDir(): boolean {
  try {
    fs.mkdirSync(MEDIA_STORAGE_DIR, { recursive: true });
    return true;
  } catch (err) {
    console.warn(`[media-artifacts] could not create ${MEDIA_STORAGE_DIR}: ${(err as Error).message}`);
    return false;
  }
}

/** Build the canonical filename for a (atom_id, version_n, kind) tuple. */
export function pathForArtifact(atom_id: string, version_n: number, kind: MediaKind): string {
  const ext = EXT_BY_KIND[kind];
  return path.join(MEDIA_STORAGE_DIR, `${atom_id}.v${version_n}.${ext}`);
}

/**
 * Write a buffer to the media dir + insert/upsert a row in media_artifacts.
 * Returns the row, or null when DB or storage is unavailable.
 */
export async function writeArtifact(
  atom_id: string,
  version_n: number,
  kind: MediaKind,
  buffer: Buffer,
  meta: { duration_ms?: number } = {},
): Promise<MediaArtifact | null> {
  if (!ensureStorageDir()) return null;
  const src_path = pathForArtifact(atom_id, version_n, kind);
  try {
    fs.writeFileSync(src_path, buffer);
  } catch (err) {
    console.warn(`[media-artifacts] write failed for ${src_path}: ${(err as Error).message}`);
    return null;
  }

  const pool = getPool();
  if (!pool) {
    // No DB — return a synthetic row so the caller can still wire the
    // file path into atom metadata.
    return {
      atom_id, version_n, kind,
      status: 'done',
      src_path,
      bytes: buffer.length,
      duration_ms: meta.duration_ms ?? null,
      generated_at: new Date().toISOString(),
      expires_at: null,
      error_log: null,
    };
  }

  try {
    const r = await pool.query(
      `INSERT INTO media_artifacts (atom_id, version_n, kind, status, src_path, bytes, duration_ms)
         VALUES ($1, $2, $3, 'done', $4, $5, $6)
         ON CONFLICT (atom_id, version_n, kind) DO UPDATE
           SET status = 'done',
               src_path = EXCLUDED.src_path,
               bytes = EXCLUDED.bytes,
               duration_ms = EXCLUDED.duration_ms,
               generated_at = NOW(),
               error_log = NULL
         RETURNING *`,
      [atom_id, version_n, kind, src_path, buffer.length, meta.duration_ms ?? null],
    );
    return r.rows[0] ? mapRow(r.rows[0]) : null;
  } catch (err) {
    console.warn(`[media-artifacts] DB write failed: ${(err as Error).message}`);
    return null;
  }
}

/** Mark a render as failed (for async paths). v1 GIF render is sync so unused. */
export async function markFailed(
  atom_id: string,
  version_n: number,
  kind: MediaKind,
  error: string,
): Promise<void> {
  const pool = getPool();
  if (!pool) return;
  try {
    await pool.query(
      `INSERT INTO media_artifacts (atom_id, version_n, kind, status, src_path, error_log)
         VALUES ($1, $2, $3, 'failed', '', $4)
         ON CONFLICT (atom_id, version_n, kind) DO UPDATE
           SET status = 'failed', error_log = EXCLUDED.error_log, generated_at = NOW()`,
      [atom_id, version_n, kind, error],
    );
  } catch (err) {
    console.warn(`[media-artifacts] markFailed: ${(err as Error).message}`);
  }
}

/**
 * Read the active artifact for (atom_id, kind) — looks up the active
 * version_n in atom_versions and returns its sidecar.
 */
export async function getActiveArtifact(
  atom_id: string,
  kind: MediaKind,
): Promise<MediaArtifact | null> {
  const pool = getPool();
  if (!pool) return null;
  try {
    const r = await pool.query(
      `SELECT m.*
         FROM media_artifacts m
         JOIN atom_versions v
           ON m.atom_id = v.atom_id AND m.version_n = v.version_n
         WHERE m.atom_id = $1 AND m.kind = $2 AND m.status = 'done'
           AND v.active = TRUE
         LIMIT 1`,
      [atom_id, kind],
    );
    return r.rows[0] ? mapRow(r.rows[0]) : null;
  } catch (err) {
    console.warn(`[media-artifacts] getActiveArtifact: ${(err as Error).message}`);
    return null;
  }
}

export async function listForAtom(atom_id: string): Promise<MediaArtifact[]> {
  const pool = getPool();
  if (!pool) return [];
  try {
    const r = await pool.query(
      `SELECT * FROM media_artifacts WHERE atom_id = $1 ORDER BY version_n DESC, kind ASC`,
      [atom_id],
    );
    return r.rows.map(mapRow);
  } catch (err) {
    console.warn(`[media-artifacts] listForAtom: ${(err as Error).message}`);
    return [];
  }
}

/**
 * Delete superseded media: artifacts where the atom version is no longer
 * active AND there's a newer active version. Removes both DB row and file.
 * Called after atom_versions.activate() to keep storage tidy.
 */
export async function pruneSuperseded(atom_id: string): Promise<{ deleted: number }> {
  const pool = getPool();
  if (!pool) return { deleted: 0 };
  let deleted = 0;
  try {
    const r = await pool.query(
      `SELECT m.atom_id, m.version_n, m.kind, m.src_path
         FROM media_artifacts m
         JOIN atom_versions v
           ON m.atom_id = v.atom_id AND m.version_n = v.version_n
         WHERE m.atom_id = $1 AND v.active = FALSE
           AND EXISTS (
             SELECT 1 FROM atom_versions v2
              WHERE v2.atom_id = m.atom_id AND v2.active = TRUE
                AND v2.version_n > m.version_n
           )`,
      [atom_id],
    );
    for (const row of r.rows) {
      try {
        if (row.src_path && fs.existsSync(row.src_path)) {
          fs.unlinkSync(row.src_path);
        }
      } catch { /* best effort */ }
      await pool.query(
        `DELETE FROM media_artifacts WHERE atom_id = $1 AND version_n = $2 AND kind = $3`,
        [row.atom_id, row.version_n, row.kind],
      );
      deleted++;
    }
  } catch (err) {
    console.warn(`[media-artifacts] pruneSuperseded: ${(err as Error).message}`);
  }
  return { deleted };
}

function mapRow(row: any): MediaArtifact {
  return {
    atom_id: row.atom_id,
    version_n: row.version_n,
    kind: row.kind,
    status: row.status,
    src_path: row.src_path,
    bytes: row.bytes,
    duration_ms: row.duration_ms,
    generated_at: typeof row.generated_at === 'string' ? row.generated_at : new Date(row.generated_at).toISOString(),
    expires_at: row.expires_at ? (typeof row.expires_at === 'string' ? row.expires_at : new Date(row.expires_at).toISOString()) : null,
    error_log: row.error_log,
  };
}
