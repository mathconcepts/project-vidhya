/**
 * Realtime-nudge scorer (Layer 6, weight 0.10).
 *
 * THIS FILE MUST NOT WRITE TO ANY DATABASE. The surveillance-cliff
 * invariant test in __tests__/surveillance-invariants.test.ts will FAIL
 * if this file imports `pg` or contains the strings 'INSERT INTO',
 * 'UPDATE ', 'pool.query'.
 *
 * Realtime signals are passed in via ctx.realtime, computed by the caller
 * within a single request, and DIE WITH THE REQUEST. No persistence.
 *
 * Behaviour:
 *   - last_correct = true  → slight push toward harder atoms (practice / common_traps).
 *   - last_correct = false → slight push toward intuition / worked_example (warm-up).
 *   - local_hour late at night (22-04) → soften toward gentler atoms; never punish.
 *   - default (no signals) → neutral 0.5 across the board.
 *
 * Pure function over the in-memory ctx. Synchronous.
 */

import type { AtomShape, RankingContext } from '../types';

const SOFT_KINDS = new Set(['intuition', 'visual_analogy', 'worked_example']);
const HARDER_KINDS = new Set(['practice', 'common_traps', 'exam_pattern']);

export function scoreByRealtime(
  atoms: AtomShape[],
  ctx: RankingContext,
): Map<string, number> {
  const out = new Map<string, number>();
  if (atoms.length === 0) return out;

  const rt = ctx.realtime;
  if (!rt) {
    for (const a of atoms) out.set(a.id, 0.5);
    return out;
  }

  const lateNight =
    typeof rt.local_hour === 'number' &&
    (rt.local_hour >= 22 || rt.local_hour < 5);

  for (const a of atoms) {
    let v = 0.5;
    if (rt.last_correct === true && HARDER_KINDS.has(a.atom_type)) v = 0.75;
    if (rt.last_correct === false && SOFT_KINDS.has(a.atom_type)) v = 0.75;
    // Late-night softening: bump soft kinds further, dampen hard ones.
    if (lateNight) {
      if (SOFT_KINDS.has(a.atom_type)) v = Math.max(v, 0.65);
      if (HARDER_KINDS.has(a.atom_type)) v = Math.min(v, 0.45);
    }
    out.set(a.id, v);
  }
  return out;
}
