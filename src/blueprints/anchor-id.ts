/**
 * src/blueprints/anchor-id.ts
 *
 * W2.2/E12 — deterministic anchor ids for blueprint stage instances.
 *
 * anchor_id = hash(concept_id, stage_id, ordinal, template_version)
 *
 * Follows src/generation/batch/jsonl-builder.ts's customIdFor() precedent
 * exactly: SHA-256 over a canonical string, truncated to 12 hex chars
 * (48 bits — plenty for one unit's stage count), prefixed for readability.
 * Same input → same id, forever, for a given template_version; a
 * template_version bump changes every id it touches — intentional (see the
 * module doc on to-unit-spec.ts's blueprintToUnitSpec()).
 *
 * Anchors exist to give W2.3's future delta machinery (gated on the
 * stance-variant n≥30 threshold, plan §4 W2.3) something stable to attach
 * to. Nothing reads anchor_id yet — this module and its caller are pure
 * additive plumbing.
 */

import { createHash } from 'crypto';

const ANCHOR_ID_PREFIX = 'anchor-';
const ANCHOR_ID_HEX_LENGTH = 12;

/**
 * Deterministic anchor id for one stage instance within one concept's
 * blueprint translation. `ordinal` is the stage instance's 0-based position
 * in the unit's flattened atom sequence (a practice stage repeated N times
 * yields N distinct ordinals, hence N distinct anchors) — NOT the stage's
 * position within `decisions.stages` (those differ whenever any stage
 * repeats via `count`).
 */
export function computeAnchorId(
  concept_id: string,
  stage_id: string,
  ordinal: number,
  template_version: string,
): string {
  const canonical = `${concept_id}::${stage_id}::${ordinal}::${template_version}`;
  const hex = createHash('sha256').update(canonical).digest('hex');
  return `${ANCHOR_ID_PREFIX}${hex.slice(0, ANCHOR_ID_HEX_LENGTH)}`;
}
