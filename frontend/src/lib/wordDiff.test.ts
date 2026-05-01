/**
 * wordDiff — segment correctness + edge cases.
 */

import { describe, it, expect } from 'vitest';
import { wordDiff } from './wordDiff';

describe('wordDiff', () => {
  it('returns single equal segment when inputs match', () => {
    const r = wordDiff('hello world', 'hello world');
    expect(r).toEqual([{ op: 'equal', text: 'hello world' }]);
  });

  it('returns insert when first input empty', () => {
    const r = wordDiff('', 'new content');
    expect(r).toEqual([{ op: 'insert', text: 'new content' }]);
  });

  it('returns delete when second input empty', () => {
    const r = wordDiff('old content', '');
    expect(r).toEqual([{ op: 'delete', text: 'old content' }]);
  });

  it('marks added words as insert', () => {
    const r = wordDiff('hello world', 'hello new world');
    const inserted = r.filter((s) => s.op === 'insert').map((s) => s.text).join('|');
    expect(inserted).toContain('new');
  });

  it('marks deleted words as delete', () => {
    const r = wordDiff('hello old world', 'hello world');
    const deleted = r.filter((s) => s.op === 'delete').map((s) => s.text).join('|');
    expect(deleted).toContain('old');
  });

  it('preserves equal regions intact', () => {
    const r = wordDiff('the quick brown fox', 'the slow brown fox');
    const equal = r.filter((s) => s.op === 'equal').map((s) => s.text).join('');
    // "the", "brown", "fox" should all appear in equal segments
    expect(equal).toContain('the');
    expect(equal).toContain('brown');
    expect(equal).toContain('fox');
  });

  it('handles markdown formatting changes', () => {
    const a = 'The derivative is **important** for calculus.';
    const b = 'The derivative is *crucial* for calculus.';
    const r = wordDiff(a, b);
    const inserted = r.filter((s) => s.op === 'insert').map((s) => s.text).join(' ');
    const deleted = r.filter((s) => s.op === 'delete').map((s) => s.text).join(' ');
    expect(inserted + deleted).toContain('important');
    expect(inserted + deleted).toContain('crucial');
  });

  it('reconstructing the new text from equal+insert segments equals input b', () => {
    const a = 'one two three four';
    const b = 'one TWO three FIVE';
    const r = wordDiff(a, b);
    const reconstructedB = r.filter((s) => s.op !== 'delete').map((s) => s.text).join('');
    expect(reconstructedB).toBe(b);
  });

  it('reconstructing the old text from equal+delete segments equals input a', () => {
    const a = 'one two three four';
    const b = 'one TWO three FIVE';
    const r = wordDiff(a, b);
    const reconstructedA = r.filter((s) => s.op !== 'insert').map((s) => s.text).join('');
    expect(reconstructedA).toBe(a);
  });
});
