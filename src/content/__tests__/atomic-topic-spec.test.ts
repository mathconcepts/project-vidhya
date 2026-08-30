import { describe, it, expect, beforeEach } from 'vitest';
import {
  loadAtomicTopicSpecs,
  getAtomicTopicSpec,
  listAtomicTopicSpecsByDomain,
  splitCsvLine,
  __resetAtomicTopicSpecCacheForTests,
} from '../atomic-topic-spec';

describe('splitCsvLine', () => {
  it('splits a plain comma-delimited line', () => {
    expect(splitCsvLine('a,b,c')).toEqual(['a', 'b', 'c']);
  });

  it('keeps a comma inside a quoted field as part of that field', () => {
    expect(splitCsvLine('LA-01,Linear Algebra,"scalar algebra, equations",MCQ')).toEqual([
      'LA-01',
      'Linear Algebra',
      'scalar algebra, equations',
      'MCQ',
    ]);
  });

  it('unescapes doubled quotes inside a quoted field', () => {
    expect(splitCsvLine('a,"she said ""hi""",c')).toEqual(['a', 'she said "hi"', 'c']);
  });
});

describe('loadAtomicTopicSpecs (real docs/content-spec/ files)', () => {
  beforeEach(() => {
    __resetAtomicTopicSpecCacheForTests();
  });

  it('loads 116 merged atomic topics from the committed CSVs', () => {
    const specs = loadAtomicTopicSpecs();
    expect(specs.size).toBe(116);
  });

  it('resolves LA-06 (eigenvalues) with the expected hooks and template family', () => {
    const spec = getAtomicTopicSpec('LA-06');
    expect(spec).not.toBeNull();
    expect(spec!.structure.template_family).toBe('eigen');
    expect(spec!.generation.template_family).toBe('eigen');
    expect(spec!.structure.recommended_hooks.length).toBeGreaterThan(0);
    expect(spec!.generation.hooks.length).toBeGreaterThan(0);
    expect(spec!.generation.base_sequence).toContain('hook');
  });

  it('returns null for an unknown atomic_id', () => {
    expect(getAtomicTopicSpec('ZZ-99')).toBeNull();
  });

  it('lists every Linear Algebra atomic topic under its domain', () => {
    const laTopics = listAtomicTopicSpecsByDomain('Linear Algebra');
    expect(laTopics.length).toBeGreaterThan(0);
    expect(laTopics.every((t) => t.atomic_id.startsWith('LA-'))).toBe(true);
  });

  it('memoizes — a second call returns the same Map instance', () => {
    const first = loadAtomicTopicSpecs();
    const second = loadAtomicTopicSpecs();
    expect(first).toBe(second);
  });
});
