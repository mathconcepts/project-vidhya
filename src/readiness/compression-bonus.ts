/**
 * src/readiness/compression-bonus.ts — T12/B3: repetition-compression-lite
 * in task selection (ENG-D2's corrected cap).
 *
 * `practiceCandidate` in `next-best-action.ts` used to hardcode
 * `expectedGain: 1.0` — every practice item looked equally valuable to
 * the selector, even one that (via FIRe's encompassing graph) would also
 * knock out several other concepts' overdue reviews. This computes that
 * bonus using the SAME discounted credit FIRe itself grants
 * (`src/gbrain/fire.ts`'s `downClosureFor` + `CREDIT_DISCOUNT`), so the
 * number surfaced here is never optimistic relative to what actually
 * happens to the student's FSRS cards if they take this practice item.
 *
 * Cap is 1.3, not 1.0 + raw sum (ENG-D2, replacing the outside-voice
 * amendment's original 1.8): `1.0 + (1 − RETAIN_RECALL_THRESHOLD)` is the
 * gain floor of a surfaced overdue retain candidate
 * (`next-best-action.ts`'s `pickDueReview`, `RETAIN_RECALL_THRESHOLD =
 * 0.7`) — so ANY surfaced retain (gain >= 1.3) still outranks a
 * compression-boosted practice, honoring the Extraction-first tie-break.
 * Locked here as a literal (not imported from next-best-action.ts) to
 * avoid a circular import between the two modules; the value must move in
 * lockstep with `RETAIN_RECALL_THRESHOLD` if that constant ever changes —
 * a property test in next-best-action's test suite pins the relationship.
 */

import { downClosureFor, CREDIT_DISCOUNT } from '../gbrain/fire';
import type { ConceptId, DueReviewCandidate } from '../core/interfaces';

/** `1.0 + (1 - RETAIN_RECALL_THRESHOLD)` — see module doc comment. */
export const COMPRESSION_GAIN_CAP = 1.3;

/**
 * Sum of discounted implicit-review credit a practice attempt on
 * `conceptId` would grant toward the student's currently-due cards, via
 * the encompassing graph's depth-<=2 down-closure. Concepts with no
 * encompassing edges (every non-LA concept today) and due-card lists with
 * no closure overlap both return exactly 0 — a compression bonus is
 * never fabricated for a concept FIRe itself would grant nothing for.
 */
export function compressionBonus(
  conceptId: ConceptId,
  dueCardsList: ReadonlyArray<DueReviewCandidate>,
): number {
  if (dueCardsList.length === 0) return 0;
  const closure = downClosureFor(conceptId);
  if (closure.size === 0) return 0;

  let sum = 0;
  for (const card of dueCardsList) {
    const credit = closure.get(card.nodeId);
    if (credit !== undefined) sum += credit * CREDIT_DISCOUNT;
  }
  return sum;
}
