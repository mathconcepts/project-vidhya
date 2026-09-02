import { describe, it, expect } from 'vitest';
import { DELTA_KINDS, DELTA_KIND_DESCRIPTIONS, isDeltaKind } from '../delta-kinds';

describe('delta-kinds', () => {
  it('has exactly the 10 research-named kinds plus general_remediation', () => {
    expect(DELTA_KINDS).toEqual([
      'prerequisite_repair',
      'representation_shift',
      'definition_boundary',
      'execution_drill',
      'assessment_mode',
      'time_and_risk',
      'custom_source',
      'verified_computation',
      'language_accessibility',
      'confidence_calibration',
      'general_remediation',
    ]);
  });

  it('every DeltaKind has a non-empty description', () => {
    for (const kind of DELTA_KINDS) {
      expect(DELTA_KIND_DESCRIPTIONS[kind]?.length).toBeGreaterThan(10);
    }
  });

  it('DELTA_KIND_DESCRIPTIONS has no extra keys beyond DELTA_KINDS', () => {
    expect(Object.keys(DELTA_KIND_DESCRIPTIONS).sort()).toEqual([...DELTA_KINDS].sort());
  });

  it('isDeltaKind narrows correctly', () => {
    expect(isDeltaKind('execution_drill')).toBe(true);
    expect(isDeltaKind('general_remediation')).toBe(true);
    expect(isDeltaKind('not_a_real_kind')).toBe(false);
    expect(isDeltaKind(undefined)).toBe(false);
    expect(isDeltaKind(42)).toBe(false);
  });
});
