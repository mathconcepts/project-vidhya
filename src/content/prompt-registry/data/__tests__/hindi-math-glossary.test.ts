import { describe, it, expect } from 'vitest';
import { LINEAR_ALGEBRA_HINDI_GLOSSARY, lookupHindiGloss, formatHindiGloss } from '../hindi-math-glossary';

describe('LINEAR_ALGEBRA_HINDI_GLOSSARY', () => {
  it('every entry has non-empty english, devanagari, and romanized fields', () => {
    for (const e of LINEAR_ALGEBRA_HINDI_GLOSSARY) {
      expect(e.english.trim()).not.toBe('');
      expect(e.hindi_devanagari.trim()).not.toBe('');
      expect(e.hindi_romanized.trim()).not.toBe('');
    }
  });

  it('every devanagari field contains only Devanagari script, spaces, and hyphens (for compounds like लांबिक-मानीकृत)', () => {
    const devanagariRange = /^[ऀ-ॿ\s-]+$/;
    for (const e of LINEAR_ALGEBRA_HINDI_GLOSSARY) {
      expect(devanagariRange.test(e.hindi_devanagari), e.english).toBe(true);
    }
  });

  it('has no duplicate english terms', () => {
    const seen = new Set<string>();
    for (const e of LINEAR_ALGEBRA_HINDI_GLOSSARY) {
      const key = e.english.toLowerCase();
      expect(seen.has(key), key).toBe(false);
      seen.add(key);
    }
  });

  it('covers the confirmed jargon example (eigenvalue, matrix)', () => {
    expect(lookupHindiGloss('eigenvalue')).not.toBeNull();
    expect(lookupHindiGloss('matrix')).not.toBeNull();
  });
});

describe('lookupHindiGloss', () => {
  it('is case-insensitive', () => {
    expect(lookupHindiGloss('MATRIX')?.english).toBe('matrix');
    expect(lookupHindiGloss('Matrix')?.english).toBe('matrix');
  });

  it('returns null for a term not in the curated list, rather than guessing', () => {
    expect(lookupHindiGloss('quaternion')).toBeNull();
    expect(lookupHindiGloss('')).toBeNull();
  });
});

describe('formatHindiGloss', () => {
  it('formats as "devanagari (romanized)"', () => {
    const entry = lookupHindiGloss('matrix')!;
    expect(formatHindiGloss(entry)).toBe(`${entry.hindi_devanagari} (${entry.hindi_romanized})`);
  });
});
