import { describe, it, expect } from 'vitest';
import { hasAnyLocatorField, validateSourceLocatorShape } from '../source-locator';

describe('hasAnyLocatorField', () => {
  it('is false for undefined, null, and an empty object', () => {
    expect(hasAnyLocatorField(undefined)).toBe(false);
    expect(hasAnyLocatorField(null)).toBe(false);
    expect(hasAnyLocatorField({})).toBe(false);
  });

  it('is false when every field is an empty string', () => {
    expect(hasAnyLocatorField({ source_id: '', url: '', paper: '' })).toBe(false);
  });

  it('is true when any single field is a real value, including year=0-ish numbers', () => {
    expect(hasAnyLocatorField({ url: 'https://example.test' })).toBe(true);
    expect(hasAnyLocatorField({ question_id: 'Q1' })).toBe(true);
    expect(hasAnyLocatorField({ year: 2023 })).toBe(true);
  });
});

describe('validateSourceLocatorShape', () => {
  it('accepts undefined (the field is optional)', () => {
    expect(validateSourceLocatorShape(undefined)).toEqual([]);
  });

  it('accepts a well-formed locator', () => {
    expect(validateSourceLocatorShape({
      source_id: 'gate2026-syllabus',
      url: 'https://example.test',
      paper: 'GATE CS 2023',
      year: 2023,
      question_id: 'Q42',
      page: '17',
      section: 'Linear Algebra',
    })).toEqual([]);
  });

  it('rejects a non-object', () => {
    expect(validateSourceLocatorShape('not an object')).toHaveLength(1);
    expect(validateSourceLocatorShape(42)).toHaveLength(1);
    expect(validateSourceLocatorShape(['a'])).toHaveLength(1);
    expect(validateSourceLocatorShape(null)).toHaveLength(1);
  });

  it('rejects a non-string string-field and names it', () => {
    const problems = validateSourceLocatorShape({ url: 42 });
    expect(problems).toEqual(['source_locator.url must be a string when present']);
  });

  it('rejects a non-number year', () => {
    const problems = validateSourceLocatorShape({ year: '2023' });
    expect(problems).toEqual(['source_locator.year must be a number when present']);
  });

  it('reports every bad field independently', () => {
    const problems = validateSourceLocatorShape({ url: 1, year: 'x', page: true });
    expect(problems).toHaveLength(3);
  });
});
