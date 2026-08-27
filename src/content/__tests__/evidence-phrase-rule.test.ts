/**
 * evidence-phrase-rule.ts — W1.2/E10 shared phrase-rule primitives.
 */
import { describe, it, expect } from 'vitest';
import { findForbiddenPhrases, evidenceLevelLicensesClaim, FORBIDDEN_UNSOURCED_PHRASES } from '../evidence-phrase-rule';

describe('findForbiddenPhrases', () => {
  it('returns [] for undefined, null, and empty text', () => {
    expect(findForbiddenPhrases(undefined)).toEqual([]);
    expect(findForbiddenPhrases(null)).toEqual([]);
    expect(findForbiddenPhrases('')).toEqual([]);
  });

  it('returns [] for clean text', () => {
    expect(findForbiddenPhrases('Eigenvalues of a symmetric matrix are always real.')).toEqual([]);
  });

  it('finds each forbidden phrase', () => {
    for (const phrase of FORBIDDEN_UNSOURCED_PHRASES) {
      const hits = findForbiddenPhrases(`This topic is ${phrase} on GATE.`);
      expect(hits).toHaveLength(1);
      expect(hits[0].phrase).toBe(phrase);
    }
  });

  it('is case-insensitive', () => {
    expect(findForbiddenPhrases('This is HIGH-YIELD content.')).toHaveLength(1);
    expect(findForbiddenPhrases('Most Repeated pattern.')).toHaveLength(1);
  });

  it('finds multiple distinct phrases in one string', () => {
    const hits = findForbiddenPhrases('This is high-yield and frequently asked.');
    expect(hits.map((h) => h.phrase).sort()).toEqual(['frequently asked', 'high-yield']);
  });

  it('finds repeated occurrences of the same phrase', () => {
    const hits = findForbiddenPhrases('often asked, often asked again');
    expect(hits).toHaveLength(2);
  });

  it('reports the character index of each hit', () => {
    const text = 'xx high-yield';
    const hits = findForbiddenPhrases(text);
    expect(hits[0].index).toBe(text.toLowerCase().indexOf('high-yield'));
  });
});

describe('evidenceLevelLicensesClaim', () => {
  it('licenses only directly_reviewed', () => {
    expect(evidenceLevelLicensesClaim('directly_reviewed')).toBe(true);
  });

  it('does not license the other three evidence_level values', () => {
    expect(evidenceLevelLicensesClaim('official')).toBe(false);
    expect(evidenceLevelLicensesClaim('pattern_supported')).toBe(false);
    expect(evidenceLevelLicensesClaim('design_hypothesis')).toBe(false);
  });

  it('does not license undefined/null/unknown values', () => {
    expect(evidenceLevelLicensesClaim(undefined)).toBe(false);
    expect(evidenceLevelLicensesClaim(null)).toBe(false);
    expect(evidenceLevelLicensesClaim('not-a-real-level')).toBe(false);
  });
});
