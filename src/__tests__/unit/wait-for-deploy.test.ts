/**
 * The post-deploy commit gate's comparison logic.
 *
 * This gate decides whether every check after it describes the build under
 * test or some earlier one. If it is wrong in the permissive direction, the
 * whole smoke suite becomes a report about stale code that says "pass" — the
 * exact failure `prod-smoke.yml` was built to prevent, and which its own
 * history records happening twice (a wait loop that matched nothing, and a
 * version gate that matches instantly whenever the version did not change).
 *
 * So the cases that matter most here are the ones where something is absent
 * or malformed: those must never come back as a match.
 */

import { describe, it, expect } from 'vitest';
import { classifyCommit, exitCodeFor } from '../../../scripts/wait-for-deploy';

const SHA = 'a1410e31acfc086e818bcb7aa09473a28c24527f';

describe('classifyCommit', () => {
  it('matches an identical sha', () => {
    expect(classifyCommit(SHA, SHA)).toBe('match');
  });

  it('matches a short sha against a full one, and the reverse', () => {
    // CI passes the full sha; a human pastes the short one. Requiring exact
    // equality would report a correct deploy as a mismatch.
    expect(classifyCommit(SHA, SHA.slice(0, 7))).toBe('match');
    expect(classifyCommit(SHA.slice(0, 7), SHA)).toBe('match');
  });

  it('is case-insensitive', () => {
    expect(classifyCommit(SHA.toUpperCase(), SHA)).toBe('match');
  });

  it('reports a different commit as a mismatch', () => {
    expect(classifyCommit('b'.repeat(40), SHA)).toBe('mismatch');
  });

  it.each([
    ['null', null],
    ['undefined', undefined],
    ['empty string', ''],
    ['whitespace', '   '],
    ['a number', 12345],
    ['an object', { sha: SHA }],
  ])('treats %s as unknown, never a match', (_label, reported) => {
    // A build that cannot say which commit it is has not been verified.
    // Reading any of these as a match is how a check passes without checking.
    expect(classifyCommit(reported, SHA)).toBe('unknown');
  });

  it('refuses to prefix-match on a too-short value', () => {
    // Without a length floor, a reported "a" would prefix-match this sha and
    // every other sha starting with the same character.
    expect(classifyCommit('a', SHA)).toBe('unknown');
    expect(classifyCommit('a1410', SHA)).toBe('unknown');
    expect(classifyCommit(SHA, 'a1410')).toBe('unknown');
  });

  it('accepts the shortest sha git itself abbreviates to', () => {
    expect(classifyCommit(SHA, SHA.slice(0, 7))).toBe('match');
  });
});

describe('exitCodeFor', () => {
  it('always succeeds on a match', () => {
    expect(exitCodeFor('match', true)).toBe(0);
    expect(exitCodeFor('match', false)).toBe(0);
  });

  it('fails a strict run on a mismatch or an unknown build', () => {
    // On a push we are waiting for OUR deploy. Anything else means the
    // checks below would describe different code.
    expect(exitCodeFor('mismatch', true)).toBe(1);
    expect(exitCodeFor('unknown', true)).toBe(1);
  });

  it('warns rather than failing a scheduled run', () => {
    // On the daily cron a version skew usually means someone landed to main
    // without deploying — a real, reportable state, not a broken run. Going
    // red there masks every downstream result behind one noisy step.
    expect(exitCodeFor('mismatch', false)).toBe(0);
    expect(exitCodeFor('unknown', false)).toBe(0);
  });
});
