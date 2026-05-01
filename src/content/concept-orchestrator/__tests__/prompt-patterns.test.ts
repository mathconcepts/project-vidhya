/**
 * prompt-patterns tests — signature derivation + key canonicalization
 * + DB-less graceful path (PENDING.md §4.13).
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  buildPatternKey,
  signatureFromMeta,
  recordOutcome,
  topPatterns,
  type PatternSignature,
} from '../prompt-patterns';

describe('buildPatternKey', () => {
  it('produces a stable canonical form for the same signature', () => {
    const sig: PatternSignature = {
      topic_family: 'calculus',
      atom_type: 'intuition',
      scaffold: 'zoom-to-tangent',
      flags: { consensus: false, pyq: true, wolfram: false, multi_source: true },
    };
    const k1 = buildPatternKey(sig);
    const k2 = buildPatternKey({ ...sig });
    expect(k1).toBe(k2);
    expect(k1).toContain('calculus');
    expect(k1).toContain('intuition');
    expect(k1).toContain('zoom-to-tangent');
  });

  it('flags are sorted so insertion order does not change the key', () => {
    const sigA: PatternSignature = {
      topic_family: 'calculus',
      atom_type: 'intuition',
      scaffold: 'x',
      flags: { consensus: true, pyq: false, wolfram: true, multi_source: false },
    };
    const sigB: PatternSignature = {
      topic_family: 'calculus',
      atom_type: 'intuition',
      scaffold: 'x',
      flags: { multi_source: false, wolfram: true, pyq: false, consensus: true },
    };
    expect(buildPatternKey(sigA)).toBe(buildPatternKey(sigB));
  });

  it('different flags produce different keys', () => {
    const a = buildPatternKey({
      topic_family: 'calculus', atom_type: 'intuition', scaffold: 'x',
      flags: { consensus: true, pyq: false, wolfram: false, multi_source: false },
    });
    const b = buildPatternKey({
      topic_family: 'calculus', atom_type: 'intuition', scaffold: 'x',
      flags: { consensus: false, pyq: false, wolfram: false, multi_source: false },
    });
    expect(a).not.toBe(b);
  });
});

describe('signatureFromMeta', () => {
  it('extracts topic_family from concept-graph and atom_type from id', () => {
    // Pick an id with a real concept_id from ALL_CONCEPTS.
    const sig = signatureFromMeta('limits.formal-definition', {
      template: 'calculus.formal_definition',
      llm_consensus: true,
      pyq_grounded: ['pyq-1', 'pyq-2'],
      wolfram_grounded: false,
      source_cascade: ['llm-claude', 'llm-gemini'],
    });
    expect(sig.atom_type).toBe('formal_definition');
    expect(sig.topic_family).toBe('calculus');
    expect(sig.flags.consensus).toBe(true);
    expect(sig.flags.pyq).toBe(true);
    expect(sig.flags.wolfram).toBe(false);
    expect(sig.flags.multi_source).toBe(true);
  });

  it('falls back to "generic" topic_family for unknown concept', () => {
    const sig = signatureFromMeta('unknown-concept-id.intuition', {
      template: 'whatever',
    });
    expect(sig.topic_family).toBe('generic');
  });

  it('handles missing flags gracefully (all false)', () => {
    const sig = signatureFromMeta('limits.intuition', {});
    expect(sig.flags.consensus).toBe(false);
    expect(sig.flags.pyq).toBe(false);
    expect(sig.flags.wolfram).toBe(false);
    expect(sig.flags.multi_source).toBe(false);
  });

  it('multi_source false when only 1 source in cascade', () => {
    const sig = signatureFromMeta('limits.intuition', {
      source_cascade: ['llm-claude'],
    });
    expect(sig.flags.multi_source).toBe(false);
  });

  it('hyphen → underscore for atom_type', () => {
    const sig = signatureFromMeta('limits.worked-example', {});
    expect(sig.atom_type).toBe('worked_example');
  });
});

describe('prompt-patterns DB-less graceful path', () => {
  const origDb = process.env.DATABASE_URL;
  beforeEach(() => { delete process.env.DATABASE_URL; });
  afterEach(() => { if (origDb) process.env.DATABASE_URL = origDb; });

  it('recordOutcome no-op without DB', async () => {
    // Should resolve without throwing.
    await expect(
      recordOutcome('limits.intuition', 1, 'promoted')
    ).resolves.toBeUndefined();
  });

  it('topPatterns returns empty array without DB', async () => {
    const r = await topPatterns({ limit: 10 });
    expect(r).toEqual([]);
  });

  it('topPatterns honors filter params without DB', async () => {
    const r = await topPatterns({ topic_family: 'calculus', atom_type: 'intuition' });
    expect(r).toEqual([]);
  });
});
