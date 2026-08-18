/**
 * Tests for src/readiness/compression-bonus.ts (T12/B3).
 */

import { describe, it, expect } from 'vitest';
import { compressionBonus, COMPRESSION_GAIN_CAP } from '../compression-bonus';
import { downClosureFor, CREDIT_DISCOUNT } from '../../gbrain/fire';
import type { DueReviewCandidate } from '../../core/interfaces';

function candidate(nodeId: string): DueReviewCandidate {
  return { objectId: `obj-${nodeId}`, nodeId, estMinutes: 3, recall: 0.5 };
}

describe('compressionBonus', () => {
  it('is 0 with no due cards', () => {
    expect(compressionBonus('eigenvalues', [])).toBe(0);
  });

  it('is 0 for a concept with no encompassing edges (non-LA)', () => {
    expect(compressionBonus('sequences', [candidate('determinants')])).toBe(0);
  });

  it('is 0 when no due card falls in the closure', () => {
    expect(compressionBonus('eigenvalues', [candidate('sequences')])).toBe(0);
  });

  it('sums credit*CREDIT_DISCOUNT for due cards in the closure', () => {
    const bonus = compressionBonus('eigenvalues', [candidate('determinants'), candidate('systems-of-equations')]);
    const closure = downClosureFor('eigenvalues');
    const expected = closure.get('determinants')! * CREDIT_DISCOUNT + closure.get('systems-of-equations')! * CREDIT_DISCOUNT;
    expect(bonus).toBeCloseTo(expected, 10);
  });

  it('ignores due cards outside the closure while summing the ones inside it', () => {
    const bonus = compressionBonus('eigenvalues', [candidate('determinants'), candidate('not-a-real-concept')]);
    const closure = downClosureFor('eigenvalues');
    expect(bonus).toBeCloseTo(closure.get('determinants')! * CREDIT_DISCOUNT, 10);
  });

  it('COMPRESSION_GAIN_CAP is 1.3 (== 1.0 + (1 - RETAIN_RECALL_THRESHOLD))', () => {
    expect(COMPRESSION_GAIN_CAP).toBe(1.3);
  });

  it('a large due-card list still yields a bonus a caller must cap at 1.3 - 1.0', () => {
    // matrix-inverse's closure includes determinants (0.6) + matrix-operations (0.85)
    const bonus = compressionBonus('matrix-inverse', [candidate('determinants'), candidate('matrix-operations')]);
    // Uncapped, this can legitimately exceed 0.3 — capping is the CALLER's
    // job (next-best-action.ts), not this function's.
    expect(bonus).toBeGreaterThan(0);
  });
});
