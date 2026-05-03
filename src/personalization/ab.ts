/**
 * A/B bucketing for the PersonalizedSelector experiment.
 *
 * Per eng-review D4: bucket per-(experiment, session_id), stable
 * across the experiment's lifetime. Hash sha256(experiment_id + ':' +
 * session_id) → first 4 bytes → uniform 0..1 → split at 0.5.
 *
 * Pure function. Reproducible across machines (same experiment + same
 * session always lands in the same bucket).
 */

import crypto from 'crypto';

/**
 * Stable hash → 0..1, uniform by construction. Exposed for tests.
 */
export function hashToUnit(experimentId: string, sessionId: string): number {
  const h = crypto
    .createHash('sha256')
    .update(`${experimentId}:${sessionId}`)
    .digest();
  // First 4 bytes → uint32 → /0xffffffff
  const u32 = h.readUInt32BE(0);
  return u32 / 0xffffffff;
}

/**
 * 50/50 split at 0.5. Stable for the same (experiment, session) pair.
 */
export function bucketFor(experimentId: string, sessionId: string): 'control' | 'treatment' {
  return hashToUnit(experimentId, sessionId) < 0.5 ? 'control' : 'treatment';
}

/**
 * Sentinel experiment id for the PersonalizedSelector v1 experiment.
 * Created once via SQL/CLI as part of the rollout; the selector reads
 * the id at module init and uses it for every request.
 *
 * Convention: id includes the version to prevent silent re-bucketing
 * on a change to the selector's logic.
 */
export const PERSONALIZED_SELECTOR_EXPERIMENT_ID = 'personalized_selector_v1_gate_ma';
