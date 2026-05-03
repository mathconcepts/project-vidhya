/**
 * src/blueprints/rulesets.ts
 *
 * Operator-defined rulesets. CRUD over blueprint_rulesets (migration 028)
 * + a pure helper that finds the rulesets applicable to a given
 * (exam_pack_id, concept_id) and emits their ids as constraints.
 *
 * DB-less safe: returns null/empty when DATABASE_URL is unset (test +
 * dev paths fall through to template-only behaviour).
 *
 * Concept-pattern matching: SQL LIKE semantics. `%` matches any concept
 * in the pack; `vectors-%` matches every vectors-* concept; etc. Done
 * server-side so a single SQL call returns only applicable rules.
 */

import pg from 'pg';
import { randomBytes } from 'crypto';
import type { BlueprintConstraint } from './types';

const { Pool } = pg;

let _pool: pg.Pool | null = null;
function getPool(): pg.Pool | null {
  if (_pool) return _pool;
  if (!process.env.DATABASE_URL) return null;
  _pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 2 });
  return _pool;
}

export function newRulesetId(): string {
  return `rs_${randomBytes(8).toString('hex')}`;
}

export interface BlueprintRuleset {
  id: string;
  exam_pack_id: string;
  concept_pattern: string;
  rule_text: string;
  enabled: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CreateRulesetInput {
  exam_pack_id: string;
  concept_pattern?: string;
  rule_text: string;
  created_by: string;
  enabled?: boolean;
}

export async function createRuleset(input: CreateRulesetInput): Promise<BlueprintRuleset | null> {
  const pool = getPool();
  if (!pool) return null;
  if (!input.rule_text || input.rule_text.trim().length === 0) {
    throw new Error('rule_text required');
  }
  if (input.rule_text.length > 2000) {
    throw new Error('rule_text too long (max 2000 chars)');
  }
  const id = newRulesetId();
  const r = await pool.query<DbRow>(
    `INSERT INTO blueprint_rulesets
       (id, exam_pack_id, concept_pattern, rule_text, enabled, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
    [
      id,
      input.exam_pack_id,
      input.concept_pattern ?? '%',
      input.rule_text.trim(),
      input.enabled ?? true,
      input.created_by,
    ],
  );
  return r.rows[0] ? mapRow(r.rows[0]) : null;
}

export async function listRulesets(filter: {
  exam_pack_id?: string;
  enabled?: boolean;
} = {}): Promise<BlueprintRuleset[]> {
  const pool = getPool();
  if (!pool) return [];
  const wheres: string[] = [];
  const vals: unknown[] = [];
  let i = 1;
  if (filter.exam_pack_id) { wheres.push(`exam_pack_id = $${i++}`); vals.push(filter.exam_pack_id); }
  if (filter.enabled !== undefined) { wheres.push(`enabled = $${i++}`); vals.push(filter.enabled); }
  const whereSql = wheres.length > 0 ? `WHERE ${wheres.join(' AND ')}` : '';
  const r = await pool.query<DbRow>(
    `SELECT * FROM blueprint_rulesets ${whereSql} ORDER BY created_at DESC LIMIT 200`,
    vals,
  );
  return r.rows.map(mapRow);
}

export async function deleteRuleset(id: string): Promise<boolean> {
  const pool = getPool();
  if (!pool) return false;
  const r = await pool.query(
    `DELETE FROM blueprint_rulesets WHERE id = $1`,
    [id],
  );
  return (r.rowCount ?? 0) > 0;
}

export async function setRulesetEnabled(id: string, enabled: boolean): Promise<BlueprintRuleset | null> {
  const pool = getPool();
  if (!pool) return null;
  const r = await pool.query<DbRow>(
    `UPDATE blueprint_rulesets SET enabled = $1, updated_at = NOW()
       WHERE id = $2 RETURNING *`,
    [enabled, id],
  );
  return r.rows[0] ? mapRow(r.rows[0]) : null;
}

/**
 * Returns enabled rulesets matching (exam_pack_id, concept_id).
 * The orchestrator/arbitrator calls this and threads the result as
 * constraints with source='ruleset'.
 */
export async function applicableRulesets(
  exam_pack_id: string,
  concept_id: string,
): Promise<BlueprintRuleset[]> {
  const pool = getPool();
  if (!pool) return [];
  const r = await pool.query<DbRow>(
    `SELECT * FROM blueprint_rulesets
       WHERE exam_pack_id = $1
         AND enabled = TRUE
         AND $2 LIKE concept_pattern
       ORDER BY created_at DESC`,
    [exam_pack_id, concept_id],
  );
  return r.rows.map(mapRow);
}

/**
 * Pure helper: turn a list of rulesets into BlueprintConstraint entries.
 * Idempotent — same input → same output.
 */
export function rulesetsToConstraints(rulesets: BlueprintRuleset[]): BlueprintConstraint[] {
  return rulesets.map((rs) => ({
    id: rs.id,
    source: 'ruleset' as const,
    note: rs.rule_text,
  }));
}

// ----------------------------------------------------------------------------

interface DbRow {
  id: string;
  exam_pack_id: string;
  concept_pattern: string;
  rule_text: string;
  enabled: boolean;
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

function mapRow(r: DbRow): BlueprintRuleset {
  return {
    id: r.id,
    exam_pack_id: r.exam_pack_id,
    concept_pattern: r.concept_pattern,
    rule_text: r.rule_text,
    enabled: r.enabled,
    created_by: r.created_by,
    created_at: r.created_at.toISOString(),
    updated_at: r.updated_at.toISOString(),
  };
}
