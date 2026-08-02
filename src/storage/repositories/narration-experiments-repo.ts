/**
 * NarrationExperimentsRepo — storage boundary for the nightly
 * narration-experiment-scanner job (CEO plan Phase 0, §5). Same split as
 * cohort-signals-repo.ts: the job file keeps the cost-cap logic and the
 * createExperiment() call; this repo owns the two read queries.
 *
 * No File implementation: the eligibility query joins atom_versions,
 * media_artifacts, and atom_ab_tests — none of which have a file-backed
 * mirror (out of scope for Phase 0). NullNarrationExperimentsRepo is
 * exported for tests; the factory itself returns `null` (not the Null
 * repo) when DATABASE_URL is unset, because the job's DB-less return
 * shape carries `error: 'no DATABASE_URL'` — a distinct signal from "ran
 * against Postgres and found zero eligible atoms" that a transparently
 * substituted Null repo would erase.
 */

import type { Pool } from 'pg';
import { getSharedPool } from '../pool';

export interface EligibleNarrationAtom {
  atom_id: string;
  version_n: number;
}

export interface NarrationExperimentsRepo {
  countActiveNarrationExperiments(): Promise<number>;
  findEligibleAtoms(limit: number): Promise<EligibleNarrationAtom[]>;
}

export class PgNarrationExperimentsRepo implements NarrationExperimentsRepo {
  constructor(private pool: Pool) {}

  async countActiveNarrationExperiments(): Promise<number> {
    const r = await this.pool.query(
      `SELECT COUNT(*)::int AS n FROM atom_ab_tests
         WHERE variant_kind = 'narration' AND status = 'running'`,
    );
    return r.rows[0]?.n ?? 0;
  }

  async findEligibleAtoms(limit: number): Promise<EligibleNarrationAtom[]> {
    const r = await this.pool.query(
      // atom_type derives from the atom_id suffix: '{concept_id}.{atom_type}'.
      // 'intuition' is the only narratable kind in v1 per shouldNarrate().
      `SELECT v.atom_id, v.version_n
         FROM atom_versions v
         JOIN media_artifacts m
           ON m.atom_id = v.atom_id AND m.version_n = v.version_n
         LEFT JOIN atom_ab_tests t
           ON t.atom_id = v.atom_id
          AND t.variant_kind = 'narration'
          AND t.status = 'running'
        WHERE v.active = TRUE
          AND m.kind = 'audio_narration'
          AND m.status = 'done'
          AND t.id IS NULL
          AND v.atom_id LIKE '%.intuition'
        ORDER BY m.generated_at DESC
        LIMIT $1`,
      [limit],
    );
    return r.rows;
  }
}

export class NullNarrationExperimentsRepo implements NarrationExperimentsRepo {
  async countActiveNarrationExperiments(): Promise<number> {
    return 0;
  }
  async findEligibleAtoms(): Promise<EligibleNarrationAtom[]> {
    return [];
  }
}

/** Factory: Postgres-backed when DATABASE_URL is set, a no-op otherwise (matches pre-migration DB-less behavior). */
export function getNarrationExperimentsRepo(): NarrationExperimentsRepo | null {
  const pool = getSharedPool();
  return pool ? new PgNarrationExperimentsRepo(pool) : null;
}
