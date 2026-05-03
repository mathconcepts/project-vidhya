/**
 * src/blueprints/persistence.ts
 *
 * CRUD over content_blueprints (migration 027). DB-less safe: all
 * queries return null/empty when DATABASE_URL is unset.
 *
 * Concurrency model: optimistic via updated_at ETag. Callers pass an
 * `if_match: updated_at` value on update; mismatch returns null and the
 * REST layer translates to 409.
 */

import pg from 'pg';
import { randomBytes } from 'crypto';
import {
  type ContentBlueprint,
  type BlueprintDecisionsV1,
  type CreatedBy,
} from './types';
import { validateDecisions } from './validator';

const { Pool } = pg;

let _pool: pg.Pool | null = null;
function getPool(): pg.Pool | null {
  if (_pool) return _pool;
  if (!process.env.DATABASE_URL) return null;
  _pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 3 });
  return _pool;
}

export function newBlueprintId(): string {
  return `bp_${randomBytes(8).toString('hex')}`;
}

export interface InsertBlueprintInput {
  exam_pack_id: string;
  concept_id: string;
  template_version?: string | null;
  arbitrator_version?: string | null;
  decisions: BlueprintDecisionsV1;
  confidence?: number;
  requires_review?: boolean;
  created_by: CreatedBy;
}

export async function insertBlueprint(input: InsertBlueprintInput): Promise<ContentBlueprint | null> {
  const pool = getPool();
  if (!pool) return null;

  const v = validateDecisions(input.decisions);
  if (!v.ok) {
    throw new Error(
      `insertBlueprint: invalid decisions: ${v.errors.map((e) => `${e.path}: ${e.reason}`).join('; ')}`,
    );
  }

  const id = newBlueprintId();
  const r = await pool.query<DbRow>(
    `INSERT INTO content_blueprints
       (id, exam_pack_id, concept_id, template_version, arbitrator_version,
        decisions, confidence, requires_review, created_by)
       VALUES ($1, $2, $3, $4, $5, $6::JSONB, $7, $8, $9)
       RETURNING *`,
    [
      id,
      input.exam_pack_id,
      input.concept_id,
      input.template_version ?? null,
      input.arbitrator_version ?? null,
      JSON.stringify(input.decisions),
      input.confidence ?? 0.6,
      input.requires_review ?? false,
      input.created_by,
    ],
  );
  return r.rows[0] ? mapRow(r.rows[0]) : null;
}

export async function getBlueprint(id: string): Promise<ContentBlueprint | null> {
  const pool = getPool();
  if (!pool) return null;
  const r = await pool.query<DbRow>(
    `SELECT * FROM content_blueprints WHERE id = $1`,
    [id],
  );
  return r.rows[0] ? mapRow(r.rows[0]) : null;
}

export interface ListFilter {
  exam_pack_id?: string;
  concept_id?: string;
  requires_review?: boolean;
  limit?: number;
}

export async function listBlueprints(filter: ListFilter = {}): Promise<ContentBlueprint[]> {
  const pool = getPool();
  if (!pool) return [];
  const wheres: string[] = ['superseded_by IS NULL'];
  const vals: unknown[] = [];
  let i = 1;
  if (filter.exam_pack_id) { wheres.push(`exam_pack_id = $${i++}`); vals.push(filter.exam_pack_id); }
  if (filter.concept_id)   { wheres.push(`concept_id = $${i++}`);   vals.push(filter.concept_id); }
  if (filter.requires_review !== undefined) {
    wheres.push(`requires_review = $${i++}`);
    vals.push(filter.requires_review);
  }
  const limit = Math.min(filter.limit ?? 50, 200);
  vals.push(limit);
  const r = await pool.query<DbRow>(
    `SELECT * FROM content_blueprints
       WHERE ${wheres.join(' AND ')}
       ORDER BY created_at DESC LIMIT $${i}`,
    vals,
  );
  return r.rows.map(mapRow);
}

export interface UpdateInput {
  decisions?: BlueprintDecisionsV1;
  requires_review?: boolean;
  approved_by?: string;
}

/**
 * Optimistic update with ETag.
 *
 * Returns:
 *  - the updated row on success
 *  - { conflict: true, current } when if_match does not match the row's updated_at
 *  - null when row does not exist
 */
export async function updateBlueprint(
  id: string,
  if_match: string,
  patch: UpdateInput,
): Promise<{ ok: ContentBlueprint } | { conflict: ContentBlueprint } | null> {
  const pool = getPool();
  if (!pool) return null;

  if (patch.decisions) {
    const v = validateDecisions(patch.decisions);
    if (!v.ok) {
      throw new Error(
        `updateBlueprint: invalid decisions: ${v.errors.map((e) => `${e.path}: ${e.reason}`).join('; ')}`,
      );
    }
  }

  // Check current state under the same query for atomicity.
  const existing = await pool.query<DbRow>(
    `SELECT * FROM content_blueprints WHERE id = $1`,
    [id],
  );
  if (existing.rows.length === 0) return null;
  const current = mapRow(existing.rows[0]);
  if (current.updated_at !== if_match) {
    return { conflict: current };
  }

  const sets: string[] = ['updated_at = NOW()'];
  const vals: unknown[] = [];
  let i = 1;
  if (patch.decisions !== undefined) {
    sets.push(`decisions = $${i++}::JSONB`);
    vals.push(JSON.stringify(patch.decisions));
  }
  if (patch.requires_review !== undefined) {
    sets.push(`requires_review = $${i++}`);
    vals.push(patch.requires_review);
  }
  if (patch.approved_by !== undefined) {
    sets.push(`approved_by = $${i++}`, `approved_at = NOW()`);
    vals.push(patch.approved_by);
  }
  vals.push(id);
  const r = await pool.query<DbRow>(
    `UPDATE content_blueprints SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`,
    vals,
  );
  return { ok: mapRow(r.rows[0]) };
}

/** Marks the blueprint as superseded by a new id. Does NOT delete. */
export async function supersedeBlueprint(old_id: string, new_id: string): Promise<void> {
  const pool = getPool();
  if (!pool) return;
  // Loop guard: refuse to write a cycle.
  if (await wouldCreateCycle(pool, old_id, new_id)) {
    throw new Error(`supersedeBlueprint: would create cycle ${old_id} → ${new_id}`);
  }
  await pool.query(
    `UPDATE content_blueprints SET superseded_by = $1, updated_at = NOW() WHERE id = $2`,
    [new_id, old_id],
  );
}

async function wouldCreateCycle(pool: pg.Pool, old_id: string, new_id: string): Promise<boolean> {
  // Walk the new_id's superseded_by chain; if we hit old_id, it's a cycle.
  let cur: string | null = new_id;
  for (let depth = 0; depth < 64; depth++) {
    if (cur === null) return false;
    if (cur === old_id) return true;
    const result: pg.QueryResult<{ superseded_by: string | null }> = await pool.query(
      `SELECT superseded_by FROM content_blueprints WHERE id = $1`,
      [cur],
    );
    const next: string | null = result.rows[0]?.superseded_by ?? null;
    cur = next;
  }
  return false;
}

// ----------------------------------------------------------------------------

interface DbRow {
  id: string;
  exam_pack_id: string;
  concept_id: string;
  template_version: string | null;
  arbitrator_version: string | null;
  decisions: BlueprintDecisionsV1;
  confidence: string | number;
  requires_review: boolean;
  created_by: CreatedBy;
  approved_at: Date | null;
  approved_by: string | null;
  superseded_by: string | null;
  created_at: Date;
  updated_at: Date;
}

function mapRow(r: DbRow): ContentBlueprint {
  return {
    id: r.id,
    exam_pack_id: r.exam_pack_id,
    concept_id: r.concept_id,
    template_version: r.template_version,
    arbitrator_version: r.arbitrator_version,
    decisions: r.decisions,
    confidence: typeof r.confidence === 'string' ? Number(r.confidence) : r.confidence,
    requires_review: r.requires_review,
    created_by: r.created_by,
    approved_at: r.approved_at?.toISOString() ?? null,
    approved_by: r.approved_by,
    superseded_by: r.superseded_by,
    created_at: r.created_at.toISOString(),
    updated_at: r.updated_at.toISOString(),
  };
}
