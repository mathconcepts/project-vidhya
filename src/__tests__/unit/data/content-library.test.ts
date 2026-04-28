// @ts-nocheck
/**
 * Unit tests for the content-library store.
 *
 * Covers:
 *   - Seed loader picks up the 3 committed concepts
 *   - getEntry round-trips a known concept
 *   - findEntries respects prefer_difficulty ranking
 *   - findEntries respects exam_id ranking
 *   - findEntries with tags filters strictly (all-tags-required)
 *   - addEntry validates required fields
 *   - addEntry rejects non-kebab-case concept_id
 *   - addEntry persists to JSONL and survives reload
 *   - addEntry overrides seed entries with the same concept_id
 *   - getStats reports correct source breakdown
 *   - masteryToDifficulty thresholds
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { mkdirSync, existsSync, rmSync, cpSync, writeFileSync } from 'fs';
import { join } from 'path';

let savedBackup = '';

beforeAll(() => {
  if (existsSync('.data')) {
    savedBackup = `.data.lib-testsave-${Date.now()}`;
    cpSync('.data', savedBackup, { recursive: true });
    rmSync('.data', { recursive: true, force: true });
  }
  mkdirSync('.data', { recursive: true });
});

afterAll(() => {
  if (existsSync('.data')) rmSync('.data', { recursive: true, force: true });
  if (savedBackup && existsSync(savedBackup)) {
    cpSync(savedBackup, '.data', { recursive: true });
    rmSync(savedBackup, { recursive: true, force: true });
  }
});

beforeEach(async () => {
  if (existsSync('.data/content-library-additions.jsonl')) {
    rmSync('.data/content-library-additions.jsonl');
  }
  // Force a fresh re-load on every test
  const m = await import('../../../modules/content-library');
  m.reloadIndex();
});

describe('content-library store', () => {
  it('seed loader picks up the 3 committed concepts', async () => {
    const m = await import('../../../modules/content-library');
    const summaries = m.listSummaries();
    const ids = summaries.map(s => s.concept_id).sort();
    expect(ids).toContain('calculus-derivatives');
    expect(ids).toContain('complex-numbers');
    expect(ids).toContain('linear-algebra-eigenvalues');
    expect(summaries.every(s => s.source === 'seed')).toBe(true);
  });

  it('getEntry round-trips a known seed concept', async () => {
    const { getEntry } = await import('../../../modules/content-library');
    const e = getEntry('calculus-derivatives');
    expect(e).not.toBeNull();
    expect(e!.title).toBe('Derivative');
    expect(e!.difficulty).toBe('intro');
    expect(e!.licence).toBe('MIT');
    expect(e!.source).toBe('seed');
    expect(e!.explainer_md.length).toBeGreaterThan(500);
    expect(e!.worked_example_md).toBeDefined();
    expect(e!.tags).toContain('calculus');
    expect(e!.exams).toContain('EXM-BITSAT-MATH-SAMPLE');
  });

  it('returns null for unknown concept_id', async () => {
    const { getEntry } = await import('../../../modules/content-library');
    expect(getEntry('does-not-exist')).toBeNull();
  });

  it('findEntries ranks by prefer_difficulty match', async () => {
    const { findEntries } = await import('../../../modules/content-library');
    const intro_first = findEntries({ prefer_difficulty: 'intro' });
    expect(intro_first[0].difficulty).toBe('intro');
    expect(intro_first[0].concept_id).toBe('calculus-derivatives');
  });

  it('findEntries ranks by exam_id relevance', async () => {
    const { findEntries } = await import('../../../modules/content-library');
    const ugee = findEntries({ exam_id: 'EXM-UGEE-MATH-SAMPLE' });
    // Both calculus-derivatives and linear-algebra-eigenvalues
    // include UGEE; complex-numbers does not. Top 2 should be the
    // UGEE-tagged ones.
    const top_two = ugee.slice(0, 2).map(e => e.concept_id).sort();
    expect(top_two).toEqual(['calculus-derivatives', 'linear-algebra-eigenvalues']);
  });

  it('findEntries with tags filter is strict (all-tags-required)', async () => {
    const { findEntries } = await import('../../../modules/content-library');
    const calculus_only = findEntries({ tags: ['calculus'] });
    expect(calculus_only.map(e => e.concept_id)).toEqual(['calculus-derivatives']);
    // 'derivatives' alone should also match calculus-derivatives
    const derivs = findEntries({ tags: ['derivatives'] });
    expect(derivs.map(e => e.concept_id)).toEqual(['calculus-derivatives']);
    // Both tags required — still calculus-derivatives only
    const both = findEntries({ tags: ['calculus', 'derivatives'] });
    expect(both.map(e => e.concept_id)).toEqual(['calculus-derivatives']);
    // Tag that doesn't exist on any entry → empty
    const none = findEntries({ tags: ['nonexistent-tag'] });
    expect(none).toEqual([]);
  });

  it('masteryToDifficulty bands match documented thresholds', async () => {
    const { masteryToDifficulty } = await import('../../../modules/content-library');
    expect(masteryToDifficulty(0)).toBe('intro');
    expect(masteryToDifficulty(0.29)).toBe('intro');
    expect(masteryToDifficulty(0.3)).toBe('intermediate');
    expect(masteryToDifficulty(0.69)).toBe('intermediate');
    expect(masteryToDifficulty(0.7)).toBe('advanced');
    expect(masteryToDifficulty(1)).toBe('advanced');
  });

  it('addEntry persists and is retrievable after reload', async () => {
    const { addEntry, reloadIndex, getEntry } = await import('../../../modules/content-library');
    const added = addEntry({
      concept_id: 'test-add-persist',
      title: 'Test Persist',
      difficulty: 'intermediate',
      tags: ['test'],
      exams: [],
      explainer_md: 'persisted body',
      added_by: 'unit-test',
      source: 'user',
    });
    expect(added.source).toBe('user');
    expect(added.added_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);

    reloadIndex();
    const re = getEntry('test-add-persist');
    expect(re).not.toBeNull();
    expect(re!.title).toBe('Test Persist');
    expect(re!.added_by).toBe('unit-test');
  });

  it('addEntry rejects missing required fields', async () => {
    const { addEntry } = await import('../../../modules/content-library');
    expect(() => addEntry({ concept_id: '', title: 'x', difficulty: 'intro', tags: [], explainer_md: 'body', added_by: 't', source: 'user' } as any)).toThrow();
    expect(() => addEntry({ concept_id: 'foo', title: '', difficulty: 'intro', tags: [], explainer_md: 'body', added_by: 't', source: 'user' } as any)).toThrow();
    expect(() => addEntry({ concept_id: 'foo', title: 'x', difficulty: 'intro', tags: [], explainer_md: '', added_by: 't', source: 'user' } as any)).toThrow();
    expect(() => addEntry({ concept_id: 'foo', title: 'x', difficulty: 'intro', tags: [], explainer_md: 'body', added_by: '', source: 'user' } as any)).toThrow();
  });

  it('addEntry rejects non-kebab-case concept_id', async () => {
    const { addEntry } = await import('../../../modules/content-library');
    expect(() => addEntry({ concept_id: 'Foo-Bar', title: 'x', difficulty: 'intro', tags: [], explainer_md: 'body', added_by: 't', source: 'user' } as any)).toThrow();
    expect(() => addEntry({ concept_id: 'foo bar', title: 'x', difficulty: 'intro', tags: [], explainer_md: 'body', added_by: 't', source: 'user' } as any)).toThrow();
    expect(() => addEntry({ concept_id: 'foo_bar', title: 'x', difficulty: 'intro', tags: [], explainer_md: 'body', added_by: 't', source: 'user' } as any)).toThrow();
    // valid kebab forms accepted
    expect(() => addEntry({ concept_id: 'foo-bar', title: 'x', difficulty: 'intro', tags: [], explainer_md: 'body', added_by: 't', source: 'user' } as any)).not.toThrow();
    expect(() => addEntry({ concept_id: 'foo-bar-2', title: 'x', difficulty: 'intro', tags: [], explainer_md: 'body', added_by: 't', source: 'user' } as any)).not.toThrow();
  });

  it("addEntry rejects 'seed' as a source — that's reserved", async () => {
    const { addEntry } = await import('../../../modules/content-library');
    expect(() => addEntry({ concept_id: 'foo', title: 'x', difficulty: 'intro', tags: [], explainer_md: 'body', added_by: 't', source: 'seed' } as any)).toThrow();
  });

  it('additions override seed entries with the same concept_id', async () => {
    const { addEntry, reloadIndex, getEntry } = await import('../../../modules/content-library');
    const seed_before = getEntry('calculus-derivatives');
    expect(seed_before!.source).toBe('seed');

    addEntry({
      concept_id: 'calculus-derivatives',
      title: 'Derivatives — local override',
      difficulty: 'advanced',
      tags: ['override'],
      exams: [],
      explainer_md: 'overridden body',
      added_by: 'unit-test',
      source: 'user',
    });
    reloadIndex();
    const after = getEntry('calculus-derivatives');
    expect(after!.source).toBe('user');
    expect(after!.title).toBe('Derivatives — local override');
    expect(after!.difficulty).toBe('advanced');
  });

  it('getStats reports correct source breakdown after additions', async () => {
    const { addEntry, reloadIndex, getStats } = await import('../../../modules/content-library');
    const before = getStats();
    expect(before.by_source.seed).toBe(3);
    expect(before.by_source.user).toBe(0);

    addEntry({
      concept_id: 'first-add',
      title: 'First',
      difficulty: 'intro',
      tags: [],
      explainer_md: 'body',
      added_by: 'test',
      source: 'user',
    });
    addEntry({
      concept_id: 'second-add',
      title: 'Second',
      difficulty: 'intro',
      tags: [],
      explainer_md: 'body',
      added_by: 'test',
      source: 'llm',
    });
    reloadIndex();
    const after = getStats();
    expect(after.total).toBe(5);
    expect(after.by_source.seed).toBe(3);
    expect(after.by_source.user).toBe(1);
    expect(after.by_source.llm).toBe(1);
  });

  it('feature flag content_library.user_authoring defaults to false', async () => {
    const { isContentLibraryFeatureEnabled, contentLibraryFeatureFlags } = await import('../../../modules/content-library/feature-flags');
    expect(isContentLibraryFeatureEnabled('content_library.user_authoring')).toBe(false);
    const flags = contentLibraryFeatureFlags();
    const f = flags.find((x: any) => x.flag === 'content_library.user_authoring');
    expect(f).toBeDefined();
    expect(f!.default).toBe(false);
    expect(f!.enabled).toBe(false);
    expect(f!.overridden).toBe(false);
  });
});
