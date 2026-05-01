// @ts-nocheck
/**
 * prompt-patterns.ts — self-improving prompts (PENDING.md §4.13).
 *
 * Mines winning prompt patterns from A/B experiment verdicts. When a
 * candidate is promoted, the pattern that generated it (topic_family +
 * atom_type + scaffold + flags) gets a +1 promoted_count. When control
 * wins, the candidate's pattern gets +1 reverted_count. Surfaces a
 * ranked list to admin for promotion to the YAML template DSL.
 *
 * Safety rail: never auto-promotes patterns to YAML. Admin reviews the
 * top-ranked patterns and decides which to bake into the template files.
 * A pattern with 5 promotions and 4 reversions is noisy and shouldn't
 * silently rewrite the templates.
 *
 * Pattern signature derivation:
 *   - Read candidate's atom_versions.generation_meta JSONB
 *   - Pull: topic_family (from concept-graph), atom_type (from atom_id),
 *     template + scaffold (from generation_meta), llm_consensus,
 *     pyq_grounded
 *   - Canonicalize as pattern_key: lowercase, dot-joined, sorted flags
 */

import pg from 'pg';
import { ALL_CONCEPTS } from '../../constants/concept-graph';

const { Pool } = pg;
let _pool: any = null;
function getPool() {
  if (_pool) return _pool;
  if (!process.env.DATABASE_URL) return null;
  _pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 3 });
  return _pool;
}

export interface PatternSignature {
  topic_family: string;
  atom_type: string;
  scaffold: string;
  flags: {
    consensus: boolean;
    pyq: boolean;
    wolfram: boolean;
    multi_source: boolean;
  };
}

/** Derive a canonical pattern_key for index lookup. Stable across calls. */
export function buildPatternKey(sig: PatternSignature): string {
  const flagBits = [
    `consensus=${sig.flags.consensus}`,
    `pyq=${sig.flags.pyq}`,
    `wolfram=${sig.flags.wolfram}`,
    `multi_source=${sig.flags.multi_source}`,
  ].sort().join(',');
  return `${sig.topic_family}.${sig.atom_type}.${sig.scaffold}.${flagBits}`.toLowerCase();
}

/**
 * Read an atom_version row's generation_meta and derive its pattern signature.
 * Returns null when the version row doesn't exist or generation_meta is empty.
 */
export async function patternForVersion(
  pool: any,
  atom_id: string,
  version_n: number,
): Promise<PatternSignature | null> {
  try {
    const r = await pool.query(
      `SELECT generation_meta FROM atom_versions WHERE atom_id = $1 AND version_n = $2`,
      [atom_id, version_n],
    );
    const meta: any = r.rows[0]?.generation_meta;
    if (!meta) return null;
    return signatureFromMeta(atom_id, meta);
  } catch {
    return null;
  }
}

/**
 * Derive a pattern signature from atom_id + generation_meta. Used by
 * the ab-evaluator to record outcomes per pattern. Pure function on
 * its inputs — testable without DB.
 */
export function signatureFromMeta(atom_id: string, meta: any): PatternSignature {
  const concept_id = atom_id.split('.')[0];
  const concept = ALL_CONCEPTS.find((c: any) => c.id === concept_id);
  const topic_family = concept?.topic_family ?? concept?.topic ?? 'generic';

  // atom_id stores hyphenated atom_type (e.g. "formal-definition");
  // canonicalize to underscore form for the key.
  const atom_name = atom_id.slice(atom_id.indexOf('.') + 1);
  const atom_type = atom_name.replace(/-/g, '_');

  // template field is "topic_family.atom_type" form e.g. "calculus.intuition";
  // scaffold is the actual scaffold name from the YAML template (e.g.
  // "zoom-to-tangent"). When meta.template missing, fall back to "generic".
  const scaffold = (meta.scaffold as string) || extractScaffoldFromTemplate(meta.template) || 'generic';

  const sources: string[] = Array.isArray(meta.source_cascade) ? meta.source_cascade : [];

  return {
    topic_family,
    atom_type,
    scaffold,
    flags: {
      consensus: meta.llm_consensus === true,
      pyq: Array.isArray(meta.pyq_grounded) && meta.pyq_grounded.length > 0,
      wolfram: meta.wolfram_grounded === true,
      multi_source: sources.length > 1,
    },
  };
}

function extractScaffoldFromTemplate(template?: string): string | null {
  // template is "calculus.intuition" form; we don't have the scaffold name
  // here without re-reading the YAML. Fall back to using atom_type as
  // a coarser signature.
  if (!template) return null;
  const parts = template.split('.');
  return parts.length >= 2 ? parts[1] : null;
}

// ─── Recording outcomes ───────────────────────────────────────────────

export type PatternOutcome = 'promoted' | 'reverted' | 'tie' | 'insufficient_data';

/**
 * Record an A/B verdict against a pattern. Called by ab-evaluator after
 * each experiment evaluation. Idempotent within a single experiment
 * (the evaluator only updates a verdict once when ripe).
 */
export async function recordOutcome(
  candidate_atom_id: string,
  candidate_version_n: number,
  outcome: PatternOutcome,
): Promise<void> {
  const pool = getPool();
  if (!pool) return;
  const sig = await patternForVersion(pool, candidate_atom_id, candidate_version_n);
  if (!sig) return;
  const key = buildPatternKey(sig);

  const incrementCol =
    outcome === 'promoted' ? 'promoted_count'
    : outcome === 'reverted' ? 'reverted_count'
    : outcome === 'tie' ? 'tie_count'
    : 'insufficient_count';
  const timestampCol =
    outcome === 'promoted' ? 'last_promoted_at'
    : outcome === 'reverted' ? 'last_reverted_at'
    : null;

  try {
    if (timestampCol) {
      await pool.query(
        `INSERT INTO prompt_pattern_stats
           (pattern_key, topic_family, atom_type, scaffold, flags,
            ${incrementCol}, ${timestampCol})
           VALUES ($1, $2, $3, $4, $5::jsonb, 1, NOW())
           ON CONFLICT (pattern_key) DO UPDATE
             SET ${incrementCol} = prompt_pattern_stats.${incrementCol} + 1,
                 ${timestampCol} = NOW()`,
        [key, sig.topic_family, sig.atom_type, sig.scaffold, JSON.stringify(sig.flags)],
      );
    } else {
      await pool.query(
        `INSERT INTO prompt_pattern_stats
           (pattern_key, topic_family, atom_type, scaffold, flags, ${incrementCol})
           VALUES ($1, $2, $3, $4, $5::jsonb, 1)
           ON CONFLICT (pattern_key) DO UPDATE
             SET ${incrementCol} = prompt_pattern_stats.${incrementCol} + 1`,
        [key, sig.topic_family, sig.atom_type, sig.scaffold, JSON.stringify(sig.flags)],
      );
    }
  } catch (err) {
    console.warn(`[prompt-patterns] recordOutcome failed for ${key}: ${(err as Error).message}`);
  }
}

// ─── Admin readout ────────────────────────────────────────────────────

export interface PatternStats {
  pattern_key: string;
  topic_family: string;
  atom_type: string;
  scaffold: string;
  flags: any;
  promoted_count: number;
  reverted_count: number;
  tie_count: number;
  insufficient_count: number;
  score: number;        // promoted - reverted
  total: number;        // all observations
  win_rate: number;     // promoted / (promoted + reverted), 0 when 0 obs
  first_seen_at: string;
  last_promoted_at: string | null;
}

/**
 * Top patterns ranked by (promoted - reverted), filtered to those with
 * meaningful evidence (default: at least 3 promotions). Admin uses this
 * to identify which (scaffold, flags) combos consistently produce winners
 * worth baking into the YAML templates.
 */
export async function topPatterns(opts: {
  limit?: number;
  min_promoted?: number;
  topic_family?: string;
  atom_type?: string;
} = {}): Promise<PatternStats[]> {
  const pool = getPool();
  if (!pool) return [];
  const limit = opts.limit ?? 50;
  const min_promoted = opts.min_promoted ?? 3;
  const params: any[] = [min_promoted, limit];
  let where = 'WHERE promoted_count >= $1';
  if (opts.topic_family) {
    where += ` AND topic_family = $${params.length + 1}`;
    params.push(opts.topic_family);
  }
  if (opts.atom_type) {
    where += ` AND atom_type = $${params.length + 1}`;
    params.push(opts.atom_type);
  }

  try {
    const r = await pool.query(
      `SELECT pattern_key, topic_family, atom_type, scaffold, flags,
              promoted_count, reverted_count, tie_count, insufficient_count,
              first_seen_at, last_promoted_at
         FROM prompt_pattern_stats
         ${where}
         ORDER BY (promoted_count - reverted_count) DESC, promoted_count DESC
         LIMIT $2`,
      params,
    );
    return r.rows.map(toStats);
  } catch (err) {
    console.warn(`[prompt-patterns] topPatterns failed: ${(err as Error).message}`);
    return [];
  }
}

function toStats(row: any): PatternStats {
  const promoted = row.promoted_count || 0;
  const reverted = row.reverted_count || 0;
  const tie = row.tie_count || 0;
  const insufficient = row.insufficient_count || 0;
  const score = promoted - reverted;
  const total = promoted + reverted + tie + insufficient;
  const decisive = promoted + reverted;
  const win_rate = decisive > 0 ? promoted / decisive : 0;
  return {
    pattern_key: row.pattern_key,
    topic_family: row.topic_family,
    atom_type: row.atom_type,
    scaffold: row.scaffold,
    flags: typeof row.flags === 'string' ? JSON.parse(row.flags) : row.flags,
    promoted_count: promoted,
    reverted_count: reverted,
    tie_count: tie,
    insufficient_count: insufficient,
    score,
    total,
    win_rate,
    first_seen_at: row.first_seen_at,
    last_promoted_at: row.last_promoted_at,
  };
}
