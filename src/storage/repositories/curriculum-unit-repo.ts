/**
 * CurriculumUnitRepo — storage boundary for
 * src/generation/curriculum-unit-orchestrator.ts (CEO plan Phase 0, §5 /
 * §5.1 "generation + jobs modules import zero pg").
 *
 * Same split as the other job/generation repos: the orchestrator keeps the
 * unit lifecycle (generating → ready/failed/aborted), the capability-gate
 * decision, cost metering, and the pedagogy-verifier call; this repo owns
 * the seven raw queries against exam_packs, curriculum_units,
 * pyq_questions, and atom_versions.
 *
 * No File implementation — same reasoning as ContentFlywheelRepo /
 * LearningsLedgerRepo: curriculum units, PYQ links, and atom versions are
 * genuinely relational content with no meaningful file-backed mirror. The
 * factory returns `null` when DATABASE_URL is unset; generateUnit() already
 * returns an honest "DATABASE_URL not configured" failure result in that
 * case (unchanged from before this move).
 */

import type { Pool } from 'pg';
import { getSharedPool } from '../pool';

export interface UnitUpsertInput {
  id: string;
  exam_pack_id: string;
  concept_id: string;
  name: string;
  hypothesis: string | null;
  learning_objectives: unknown;
  prepared_for_pyq_ids: string[];
  retrieval_schedule: unknown;
  generation_run_id: string | null;
}

export interface StubAtomVersionInput {
  atom_id: string;
  content: string;
  generation_meta: unknown;
  generation_run_id: string | null;
}

export interface UnitReviewRow {
  atom_id: string;
  content: string;
}

export interface CurriculumUnitRepo {
  /** exam_packs.interactives_enabled for an operator pack; null if the pack has no DB row (caller falls back to YAML). */
  getInteractivesEnabled(examPackId: string): Promise<boolean | null>;
  /** Insert the unit row in 'generating' status, or flip it back to 'generating' if it was previously failed/aborted/queued. */
  upsertUnitGenerating(input: UnitUpsertInput): Promise<void>;
  /** Bidirectional PYQ link — stamps taught_by_unit_id on each PYQ not already claimed by a different unit. */
  linkPyqsToUnit(unitId: string, pyqIds: string[]): Promise<void>;
  /** Dev/test fallback when no real atom generator is wired: a minimal active atom_versions row. */
  insertStubAtomVersion(input: StubAtomVersionInput): Promise<void>;
  /** Active atom content for a unit's atom_ids, in pedagogical order — the pedagogy verifier's input. */
  readUnitForReview(unitId: string): Promise<UnitReviewRow[]>;
  markUnitReady(unitId: string, atomIds: string[], pedagogyScore: number | null): Promise<void>;
  markUnitFailed(unitId: string, partialAtomIds: string[], error: string): Promise<void>;
}

export class PgCurriculumUnitRepo implements CurriculumUnitRepo {
  constructor(private pool: Pool) {}

  async getInteractivesEnabled(examPackId: string): Promise<boolean | null> {
    const { rows } = await this.pool.query<{ interactives_enabled: boolean }>(
      `SELECT interactives_enabled FROM exam_packs WHERE id = $1`,
      [examPackId],
    );
    return rows.length > 0 ? !!rows[0].interactives_enabled : null;
  }

  async upsertUnitGenerating(input: UnitUpsertInput): Promise<void> {
    await this.pool.query(
      `INSERT INTO curriculum_units (
          id, exam_pack_id, concept_id, name, hypothesis,
          learning_objectives, prepared_for_pyq_ids, atom_ids,
          retrieval_schedule, generation_run_id, status
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, '{}'::TEXT[], $8, $9, 'generating')
        ON CONFLICT (id) DO UPDATE
          SET status = CASE
                         WHEN curriculum_units.status IN ('queued','failed','aborted')
                           THEN 'generating'
                         ELSE curriculum_units.status
                       END`,
      [
        input.id,
        input.exam_pack_id,
        input.concept_id,
        input.name,
        input.hypothesis,
        JSON.stringify(input.learning_objectives),
        input.prepared_for_pyq_ids,
        JSON.stringify(input.retrieval_schedule),
        input.generation_run_id,
      ],
    );
  }

  async linkPyqsToUnit(unitId: string, pyqIds: string[]): Promise<void> {
    if (pyqIds.length === 0) return;
    await this.pool.query(
      `UPDATE pyq_questions
          SET taught_by_unit_id = $1
        WHERE id::TEXT = ANY($2::TEXT[])
          AND (taught_by_unit_id IS NULL OR taught_by_unit_id = $1)`,
      [unitId, pyqIds],
    );
  }

  async insertStubAtomVersion(input: StubAtomVersionInput): Promise<void> {
    await this.pool.query(
      `INSERT INTO atom_versions (atom_id, version_n, content, generation_meta, active, generation_run_id)
       VALUES ($1, 1, $2, $3::JSONB, TRUE, $4)
       ON CONFLICT (atom_id, version_n) DO NOTHING`,
      [input.atom_id, input.content, JSON.stringify(input.generation_meta), input.generation_run_id],
    );
  }

  async readUnitForReview(unitId: string): Promise<UnitReviewRow[]> {
    const { rows } = await this.pool.query<UnitReviewRow>(
      `SELECT av.atom_id, av.content
         FROM curriculum_units cu
         JOIN atom_versions av ON av.atom_id = ANY(cu.atom_ids) AND av.active = TRUE
        WHERE cu.id = $1
        ORDER BY array_position(cu.atom_ids, av.atom_id)`,
      [unitId],
    );
    return rows;
  }

  async markUnitReady(unitId: string, atomIds: string[], pedagogyScore: number | null): Promise<void> {
    await this.pool.query(
      `UPDATE curriculum_units
          SET status = 'ready',
              atom_ids = $2,
              pedagogy_score = $3,
              error = NULL
        WHERE id = $1`,
      [unitId, atomIds, pedagogyScore],
    );
  }

  async markUnitFailed(unitId: string, partialAtomIds: string[], error: string): Promise<void> {
    await this.pool.query(
      `UPDATE curriculum_units
          SET status = 'failed',
              atom_ids = $2,
              error = $3
        WHERE id = $1`,
      [unitId, partialAtomIds, error.slice(0, 4000)],
    );
  }
}

/** Test/reference only — never returned by the factory (generateUnit() already short-circuits on a null repo). */
export class NullCurriculumUnitRepo implements CurriculumUnitRepo {
  async getInteractivesEnabled(): Promise<boolean | null> {
    return null;
  }
  async upsertUnitGenerating(): Promise<void> {}
  async linkPyqsToUnit(): Promise<void> {}
  async insertStubAtomVersion(): Promise<void> {}
  async readUnitForReview(): Promise<UnitReviewRow[]> {
    return [];
  }
  async markUnitReady(): Promise<void> {}
  async markUnitFailed(): Promise<void> {}
}

/** Factory: Postgres-backed when DATABASE_URL is set, `null` otherwise (matches pre-migration DB-less behavior). */
export function getCurriculumUnitRepo(): CurriculumUnitRepo | null {
  const pool = getSharedPool();
  return pool ? new PgCurriculumUnitRepo(pool) : null;
}
