/**
 * Unit tests for RunConsolePage's pure derivation logic (state tone,
 * progress formatting, start-button eligibility). The interactive parts
 * (polling, buttons wired to authFetch) are exercised manually / by the
 * backend's own job-routes.test.ts — these tests pin the pure functions
 * so a refactor can't silently change what an operator sees.
 */

import { describe, it, expect } from 'vitest';
import { __testing } from './RunConsolePage';
import type { JobListing } from '@/api/admin/jobs';

const { stateTone, formatProgress, canStart } = __testing;

function job(status: JobListing['status']): JobListing {
  return { name: 'content-generation', description: 'test job', status };
}

describe('RunConsolePage.stateTone', () => {
  it('maps completed to good, failed/cancelled to bad, paused to warn', () => {
    expect(stateTone('completed')).toBe('good');
    expect(stateTone('failed')).toBe('bad');
    expect(stateTone('cancelled')).toBe('bad');
    expect(stateTone('paused')).toBe('warn');
  });

  it('maps running and undefined (idle) to neutral', () => {
    expect(stateTone('running')).toBe('neutral');
    expect(stateTone(undefined)).toBe('neutral');
  });
});

describe('RunConsolePage.formatProgress', () => {
  it('reports "never run" when the job has no status yet', () => {
    expect(formatProgress(job(null))).toBe('never run');
  });

  it('formats a bare done/total with no extras', () => {
    expect(
      formatProgress(
        job({ job: 'x', state: 'running', progress: { total: 10, done: 4, skipped: 0, failed: 0 }, started_at: '', last_update: '', last_error: null, message: null }),
      ),
    ).toBe('4/10');
  });

  it('appends failed and skipped counts when present, in that order', () => {
    expect(
      formatProgress(
        job({ job: 'x', state: 'completed', progress: { total: 10, done: 7, skipped: 2, failed: 1 }, started_at: '', last_update: '', last_error: null, message: null }),
      ),
    ).toBe('7/10 (1 failed, 2 skipped)');
  });
});

describe('RunConsolePage.canStart', () => {
  const idle = job(null);
  const running = job({ job: 'x', state: 'running', progress: { total: 1, done: 0, skipped: 0, failed: 0 }, started_at: '', last_update: '', last_error: null, message: null });
  const paused = job({ job: 'x', state: 'paused', progress: { total: 1, done: 0, skipped: 0, failed: 0 }, started_at: '', last_update: '', last_error: null, message: null });
  const completed = job({ job: 'x', state: 'completed', progress: { total: 1, done: 1, skipped: 0, failed: 0 }, started_at: '', last_update: '', last_error: null, message: null });

  it('allows starting an idle or completed job when the kill switch is off', () => {
    expect(canStart(idle, false)).toBe(true);
    expect(canStart(completed, false)).toBe(true);
  });

  it('refuses to start a job that is running or paused', () => {
    expect(canStart(running, false)).toBe(false);
    expect(canStart(paused, false)).toBe(false);
  });

  it('refuses to start anything when the kill switch is engaged, regardless of job state', () => {
    expect(canStart(idle, true)).toBe(false);
    expect(canStart(completed, true)).toBe(false);
  });
});
