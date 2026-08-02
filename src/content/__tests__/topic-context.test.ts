/**
 * Topic-context importer tests.
 *
 * Covers the deterministic teaching-tips.md parser and the lazy loader:
 *   - happy path against the real committed study guides (10 topics)
 *   - concept-label headings attach at concept level
 *   - missing file / missing dir → null, never a crash
 *   - malformed headings degrade gracefully
 */

import { describe, it, expect, afterEach } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  parseTeachingTips,
  getTopicContext,
  getConceptTopicContext,
  topicIdFromDirName,
  resetTopicContextCache,
} from '../topic-context';

afterEach(() => {
  delete process.env.VIDHYA_TOPICS_DIR;
  resetTopicContextCache();
});

const ALL_TOPIC_IDS = [
  'linear-algebra', 'calculus', 'differential-equations', 'complex-variables',
  'probability-statistics', 'numerical-methods', 'transform-theory',
  'discrete-mathematics', 'graph-theory', 'vector-calculus',
];

describe('topicIdFromDirName', () => {
  it('strips the NN- prefix', () => {
    expect(topicIdFromDirName('01-linear-algebra')).toBe('linear-algebra');
    expect(topicIdFromDirName('10-vector-calculus')).toBe('vector-calculus');
  });
  it('rejects non-matching names', () => {
    expect(topicIdFromDirName('linear-algebra')).toBeNull();
    expect(topicIdFromDirName('notes')).toBeNull();
  });
});

describe('getTopicContext — real committed study guides', () => {
  it('loads all 10 topics with mental model + study strategy', () => {
    for (const topic of ALL_TOPIC_IDS) {
      const ctx = getTopicContext(topic);
      expect(ctx, topic).not.toBeNull();
      expect(ctx!.topic_id).toBe(topic);
      expect(ctx!.mental_model, `${topic} mental model`).toBeTruthy();
      expect(ctx!.study_strategy, `${topic} study strategy`).toBeTruthy();
    }
  });

  it('extracts the linear-algebra mental model prose', () => {
    const ctx = getTopicContext('linear-algebra')!;
    expect(ctx.mental_model).toContain('linear transformations');
    // Prose only — must not include the following subsection's heading
    expect(ctx.mental_model).not.toContain('Common Mistakes');
    expect(ctx.study_strategy).toContain('Eigenvalues');
  });

  it('current generic headings all attach at topic level (documented v0 outcome)', () => {
    const ctx = getTopicContext('linear-algebra')!;
    expect(Object.keys(ctx.concept_sections)).toEqual([]);
    expect(ctx.sections.length).toBeGreaterThan(0);
  });

  it('returns null for an unknown topic id', () => {
    expect(getTopicContext('no-such-topic')).toBeNull();
  });

  it('caches per topic (same object back)', () => {
    const a = getTopicContext('calculus');
    const b = getTopicContext('calculus');
    expect(a).toBe(b);
  });
});

describe('getConceptTopicContext', () => {
  it('resolves via the concept graph topic field', () => {
    const ctx = getConceptTopicContext('eigenvalues');
    expect(ctx).not.toBeNull();
    expect(ctx!.topic_id).toBe('linear-algebra');
    expect(ctx!.mental_model).toBeTruthy();
  });

  it('returns null for unknown concept ids', () => {
    expect(getConceptTopicContext('not-a-concept')).toBeNull();
  });
});

describe('parseTeachingTips — pure parser', () => {
  it('attaches a section to a concept when the heading matches its label', () => {
    const md = [
      '# Linear Algebra',
      '',
      '## Eigenvalues & Eigenvectors',
      'Stretch factors along invariant directions.',
      '',
      '## 🎯 For Students: How to Master This Topic',
      '',
      '### The Mental Model',
      'Matrices are machines.',
      '',
      '### The 3-Step Study Strategy',
      'Drill determinants first.',
    ].join('\n');
    const ctx = parseTeachingTips('linear-algebra', md);
    expect(ctx.concept_sections['eigenvalues']).toBeDefined();
    expect(ctx.concept_sections['eigenvalues'].content).toContain('Stretch factors');
    // The generic section stays at topic level
    expect(ctx.sections.length).toBe(1);
    expect(ctx.mental_model).toBe('Matrices are machines.');
    expect(ctx.study_strategy).toBe('Drill determinants first.');
  });

  it('tolerates malformed headings without crashing', () => {
    const md = '##\n### \nno headings of substance here\n#### stray deep heading\n';
    const ctx = parseTeachingTips('linear-algebra', md);
    expect(ctx.sections).toEqual([]);
    expect(ctx.mental_model).toBeNull();
    expect(ctx.study_strategy).toBeNull();
  });

  it('handles empty and non-string input', () => {
    expect(parseTeachingTips('calculus', '').sections).toEqual([]);
    expect(parseTeachingTips('calculus', undefined as unknown as string).mental_model).toBeNull();
  });
});

describe('loader shadow paths', () => {
  it('missing topics dir → every lookup null', () => {
    process.env.VIDHYA_TOPICS_DIR = '/nonexistent/vidhya-topics';
    resetTopicContextCache();
    expect(getTopicContext('linear-algebra')).toBeNull();
    expect(getConceptTopicContext('eigenvalues')).toBeNull();
  });

  it('topic dir without teaching-tips.md → null for that topic', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'vidhya-topics-'));
    fs.mkdirSync(path.join(dir, '01-linear-algebra'), { recursive: true });
    process.env.VIDHYA_TOPICS_DIR = dir;
    resetTopicContextCache();
    expect(getTopicContext('linear-algebra')).toBeNull();
    fs.rmSync(dir, { recursive: true, force: true });
  });
});
