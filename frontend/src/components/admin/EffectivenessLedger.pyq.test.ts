/**
 * Unit tests for the pyqDeltaOf helper added in PR #34.
 * Pure pluck-from-metadata; no network, no DB.
 */

import { describe, it, expect } from 'vitest';
import { pyqDeltaOf } from './EffectivenessLedger';
import type { ExperimentRow } from '@/api/admin/content-rd';

function row(meta: Record<string, unknown> | undefined): ExperimentRow {
  return {
    id: 'exp_x',
    name: 'X',
    exam_pack_id: 'gate-ma',
    git_sha: 'abc',
    hypothesis: null,
    variant_kind: null,
    started_at: '2026-04-25T00:00:00Z',
    ended_at: null,
    status: 'active',
    lift_v1: null,
    lift_n: null,
    lift_p: null,
    lift_updated_at: null,
    metadata: (meta ?? {}) as Record<string, unknown>,
  };
}

describe('pyqDeltaOf', () => {
  it('returns null when metadata is empty', () => {
    expect(pyqDeltaOf(row(undefined))).toBeNull();
    expect(pyqDeltaOf(row({}))).toBeNull();
  });

  it('returns null when pyq_accuracy_delta_v1 is missing', () => {
    expect(pyqDeltaOf(row({ something_else: 42 }))).toBeNull();
  });

  it('returns null when delta field is non-numeric', () => {
    expect(pyqDeltaOf(row({ pyq_accuracy_delta_v1: { delta: 'not a number' } }))).toBeNull();
    expect(pyqDeltaOf(row({ pyq_accuracy_delta_v1: { delta: NaN } }))).toBeNull();
  });

  it('returns null when pyq_accuracy_delta_v1 is not an object', () => {
    expect(pyqDeltaOf(row({ pyq_accuracy_delta_v1: 0.18 }))).toBeNull();
  });

  it('returns the delta number when present', () => {
    expect(pyqDeltaOf(row({ pyq_accuracy_delta_v1: { delta: 0.18 } }))).toBe(0.18);
    expect(pyqDeltaOf(row({ pyq_accuracy_delta_v1: { delta: -0.05 } }))).toBe(-0.05);
  });

  it('handles delta=0 (not falsy)', () => {
    expect(pyqDeltaOf(row({ pyq_accuracy_delta_v1: { delta: 0 } }))).toBe(0);
  });
});
