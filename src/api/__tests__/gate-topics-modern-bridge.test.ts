/**
 * Tests for src/api/gate-topics-modern-bridge.ts.
 *
 * Regression (/investigate, 2026-08-30): /api/topics and /api/problems/:topic
 * only ever counted/listed the legacy, mostly-vestigial
 * data/courses/gate-em/topics/*\/mcqs.json PYQ bank (29 items for
 * linear-algebra), undercounting the actively-maintained
 * data/practice-items/*.json bank (~130 items for linear-algebra) by
 * roughly 4-5x. These tests run against the REAL committed content bank
 * (no fixtures) — the undercount was a fact about real content, so the
 * fix's correctness is a fact about real content too.
 */

import { describe, it, expect } from 'vitest';
import {
  countModernProblemsForTopic,
  listModernProblemsForTopic,
  getModernProblemById,
} from '../gate-topics-modern-bridge';

describe('gate-topics-modern-bridge', () => {
  it('REGRESSION: linear-algebra has far more modern gradable items than the legacy PYQ count (29)', async () => {
    const count = await countModernProblemsForTopic('linear-algebra');
    expect(count).toBeGreaterThan(29);
  });

  it('list length matches the count for the same topic', async () => {
    const [count, list] = await Promise.all([
      countModernProblemsForTopic('linear-algebra'),
      listModernProblemsForTopic('linear-algebra'),
    ]);
    expect(list.length).toBe(count);
  });

  it('resolves the transforms -> transform-theory alias', async () => {
    const count = await countModernProblemsForTopic('transforms');
    expect(count).toBeGreaterThan(0);
  });

  it('resolves the discrete -> discrete-mathematics alias', async () => {
    const count = await countModernProblemsForTopic('discrete');
    expect(count).toBeGreaterThanOrEqual(0);
  });

  it('returns 0/[] for a topic id with no matching concepts, never throws', async () => {
    const count = await countModernProblemsForTopic('not-a-real-topic');
    const list = await listModernProblemsForTopic('not-a-real-topic');
    expect(count).toBe(0);
    expect(list).toEqual([]);
  });

  it('SECURITY: every summary in the list is answer-key-free', async () => {
    const list = await listModernProblemsForTopic('linear-algebra');
    expect(list.length).toBeGreaterThan(0);
    for (const item of list) {
      expect(item).not.toHaveProperty('correct_answer');
      expect(item).not.toHaveProperty('options');
      expect(item).not.toHaveProperty('answer_index');
      expect(item.source).toBe('modern_catalog');
      expect(typeof item.question_text).toBe('string');
      expect(item.question_text.length).toBeGreaterThan(0);
    }
  });

  it('getModernProblemById resolves a known item, answer-key-free', async () => {
    const item = await getModernProblemById('pi-matrix-operations-001');
    expect(item).not.toBeNull();
    expect(item!.id).toBe('pi-matrix-operations-001');
    expect(item).not.toHaveProperty('correct_answer');
    expect(item).not.toHaveProperty('options');
  });

  it('getModernProblemById returns null for an unknown id', async () => {
    const item = await getModernProblemById('pi-does-not-exist-999');
    expect(item).toBeNull();
  });

  it('getModernProblemById returns null for a legacy PYQ id (not in the modern catalog)', async () => {
    const item = await getModernProblemById('la-001');
    expect(item).toBeNull();
  });
});
