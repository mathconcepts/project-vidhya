/**
 * Pure-function tests for the mock-exam helpers added alongside
 * docs/demo/buyer-qa-demo-prep.md's C1 (topic-wise mocks) and C2
 * (exam-feel timing modes). No DB, no network — these two exports are the
 * entire piece of new logic in generateMockExam() that doesn't require a
 * Postgres pool to exercise.
 */
import { describe, it, expect } from 'vitest';
import { selectedTopicWeights, timingModeMultiplier } from '../moat-operations';
import { MARKS_WEIGHTS } from '../../../engine/priority-engine';

describe('selectedTopicWeights (C1)', () => {
  it('returns the full MARKS_WEIGHTS set when no topics are given', () => {
    expect(selectedTopicWeights(undefined)).toBe(MARKS_WEIGHTS);
    expect(selectedTopicWeights([])).toBe(MARKS_WEIGHTS);
  });

  it('returns the full set when every requested topic is unknown', () => {
    expect(selectedTopicWeights(['not-a-real-topic'])).toBe(MARKS_WEIGHTS);
  });

  it('renormalizes a subset so the weights sum to 1, preserving relative proportion', () => {
    // linear-algebra=0.15, calculus=0.15 in the real weight table — equal
    // weight, so a 2-topic selection should split 50/50.
    const out = selectedTopicWeights(['linear-algebra', 'calculus']);
    expect(Object.keys(out).sort()).toEqual(['calculus', 'linear-algebra']);
    expect(out['linear-algebra']).toBeCloseTo(0.5, 10);
    expect(out['calculus']).toBeCloseTo(0.5, 10);
  });

  it('a single topic gets the full weight of 1', () => {
    const out = selectedTopicWeights(['linear-algebra']);
    expect(out).toEqual({ 'linear-algebra': 1 });
  });

  it('drops unknown topics from a mixed list, renormalizing over the known ones only', () => {
    const out = selectedTopicWeights(['linear-algebra', 'not-a-real-topic']);
    expect(out).toEqual({ 'linear-algebra': 1 });
  });

  it('every real topic weight combination sums to 1 (renormalization invariant)', () => {
    const topics = Object.keys(MARKS_WEIGHTS).slice(0, 4);
    const out = selectedTopicWeights(topics);
    const sum = Object.values(out).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1, 10);
  });
});

describe('timingModeMultiplier (C2)', () => {
  it('standard is always the full duration', () => {
    expect(timingModeMultiplier('mock-gate-1', 'standard')).toBe(1.0);
    expect(timingModeMultiplier('mock-gate-2', 'standard')).toBe(1.0);
  });

  it('rush is a fixed 70% regardless of exam id', () => {
    expect(timingModeMultiplier('mock-gate-1', 'rush')).toBeCloseTo(0.7, 10);
    expect(timingModeMultiplier('anything-else', 'rush')).toBeCloseTo(0.7, 10);
  });

  it('compressed always lands in [0.85, 0.95)', () => {
    const ids = ['mock-gate-1', 'mock-gate-2', 'mock-bitsat-999', '', 'a-very-long-exam-id-string-1234567890'];
    for (const id of ids) {
      const m = timingModeMultiplier(id, 'compressed');
      expect(m).toBeGreaterThanOrEqual(0.85);
      expect(m).toBeLessThan(0.95);
    }
  });

  it('compressed is deterministic — same exam id always yields the same ratio', () => {
    const a = timingModeMultiplier('mock-gate-1755600000-abc123', 'compressed');
    const b = timingModeMultiplier('mock-gate-1755600000-abc123', 'compressed');
    expect(a).toBe(b);
  });

  it('compressed varies across different exam ids (not a constant in disguise)', () => {
    const values = new Set(
      ['id-1', 'id-2', 'id-3', 'id-4', 'id-5'].map((id) => timingModeMultiplier(id, 'compressed')),
    );
    expect(values.size).toBeGreaterThan(1);
  });
});
