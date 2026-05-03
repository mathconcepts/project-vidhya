/**
 * User-mastery-match scorer (Layer 4, weight 0.30).
 *
 * Reads student_model.representation_mode (one of 'algebraic', 'geometric',
 * 'numerical', 'balanced') — the cognitive preference inferred elsewhere
 * in gbrain — and matches it against atom_type:
 *
 *   geometric  ↔ visual_analogy           (1.0)
 *                worked_example/intuition (0.6)
 *                formal_definition         (0.3)
 *
 *   algebraic  ↔ formal_definition        (1.0)
 *                worked_example            (0.85)
 *                practice                  (0.7)
 *                visual_analogy            (0.3)
 *
 *   numerical  ↔ worked_example/practice  (1.0)
 *                interactive_manipulable   (0.95)
 *                formal_definition         (0.5)
 *                visual_analogy            (0.4)
 *
 *   balanced   ↔ neutral 0.5 across all (no-op)
 *
 * For anonymous sessions (student_id = null) or students with no
 * student_model row, all atoms score 0.5 (neutral). Layer 4 contributes
 * 0.5 * 0.30 = 0.15 to the total — a soft "all atoms are okay" signal,
 * not a punishment.
 */

import pg from 'pg';
import type { AtomShape, RankingContext } from '../types';

const { Pool } = pg;
let _pool: pg.Pool | null = null;
function getPool(): pg.Pool | null {
  if (_pool) return _pool;
  if (!process.env.DATABASE_URL) return null;
  _pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 2 });
  return _pool;
}

type RepresentationMode = 'algebraic' | 'geometric' | 'numerical' | 'balanced';

const MODE_ATOM_AFFINITY: Record<RepresentationMode, Record<string, number>> = {
  geometric: {
    visual_analogy: 1.0,
    interactive_simulation: 0.95,
    interactive_manipulable: 0.85,
    intuition: 0.65,
    worked_example: 0.6,
    formal_definition: 0.3,
    common_traps: 0.55,
    practice: 0.5,
    retrieval_prompt: 0.45,
    interactive_walkthrough: 0.65,
  },
  algebraic: {
    formal_definition: 1.0,
    worked_example: 0.85,
    practice: 0.7,
    common_traps: 0.65,
    interactive_walkthrough: 0.65,
    intuition: 0.5,
    retrieval_prompt: 0.55,
    interactive_manipulable: 0.45,
    visual_analogy: 0.3,
    interactive_simulation: 0.35,
  },
  numerical: {
    worked_example: 1.0,
    practice: 1.0,
    interactive_manipulable: 0.95,
    interactive_walkthrough: 0.85,
    common_traps: 0.7,
    formal_definition: 0.5,
    visual_analogy: 0.4,
    intuition: 0.5,
    retrieval_prompt: 0.55,
    interactive_simulation: 0.55,
  },
  balanced: {}, // empty: every atom_type → fallback 0.5 (neutral)
};

export async function scoreByUserMastery(
  atoms: AtomShape[],
  ctx: RankingContext,
): Promise<Map<string, number>> {
  const out = new Map<string, number>();
  if (atoms.length === 0) return out;

  // No student → neutral.
  if (!ctx.student_id) {
    for (const a of atoms) out.set(a.id, 0.5);
    return out;
  }

  const pool = getPool();
  if (!pool) {
    for (const a of atoms) out.set(a.id, 0.5);
    return out;
  }

  let mode: RepresentationMode = 'balanced';
  try {
    const r = await pool.query<{ representation_mode: RepresentationMode | null }>(
      `SELECT representation_mode FROM student_model WHERE user_id = $1::UUID LIMIT 1`,
      [ctx.student_id],
    );
    if (r.rows.length > 0 && r.rows[0].representation_mode) {
      mode = r.rows[0].representation_mode;
    }
  } catch {
    // Bad UUID, missing table, etc. → neutral
  }

  const affinity = MODE_ATOM_AFFINITY[mode];
  for (const a of atoms) {
    const v = affinity[a.atom_type];
    out.set(a.id, typeof v === 'number' ? v : 0.5);
  }
  return out;
}
