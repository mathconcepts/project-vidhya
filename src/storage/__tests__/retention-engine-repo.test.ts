/**
 * Tests for RetentionEngineRepo (CEO plan Phase 0 §5.1). Pg implementation
 * against a mocked pg.Pool.
 */

import { describe, it, expect } from 'vitest';
import { PgRetentionEngineRepo, NullRetentionEngineRepo } from '../repositories/retention-engine-repo';

describe('PgRetentionEngineRepo', () => {
  it('getPendingEmails passes limit positionally', async () => {
    let capturedSql = '';
    let capturedParams: any[] = [];
    const query = async (sql: string, params: any[]) => {
      capturedSql = sql;
      capturedParams = params;
      return { rows: [{ id: 'e1', user_id: 'u1', template: 'welcome_day0', payload: {}, email: 'a@test.com' }] };
    };
    const repo = new PgRetentionEngineRepo({ query } as any);
    const result = await repo.getPendingEmails(20);
    expect(capturedSql).toMatch(/FROM email_queue eq/);
    expect(capturedSql).toMatch(/LIMIT \$1/);
    expect(capturedParams).toEqual([20]);
    expect(result).toEqual([{ id: 'e1', user_id: 'u1', template: 'welcome_day0', payload: {}, email: 'a@test.com' }]);
  });

  it("setEmailStatus('sent') sets status and sent_at", async () => {
    let capturedSql = '';
    let capturedParams: any[] = [];
    const query = async (sql: string, params: any[]) => {
      capturedSql = sql;
      capturedParams = params;
      return { rows: [] };
    };
    const repo = new PgRetentionEngineRepo({ query } as any);
    await repo.setEmailStatus('e1', 'sent');
    expect(capturedSql).toMatch(/SET status = 'sent', sent_at = NOW\(\)/);
    expect(capturedParams).toEqual(['e1']);
  });

  it("setEmailStatus('skipped'|'failed') parameterizes the status", async () => {
    let capturedSql = '';
    let capturedParams: any[] = [];
    const query = async (sql: string, params: any[]) => {
      capturedSql = sql;
      capturedParams = params;
      return { rows: [] };
    };
    const repo = new PgRetentionEngineRepo({ query } as any);
    await repo.setEmailStatus('e1', 'failed');
    expect(capturedSql).toMatch(/SET status = \$2 WHERE id = \$1/);
    expect(capturedParams).toEqual(['e1', 'failed']);
  });

  it('getStreakReminderCandidates selects opted-in, streak>=3, inactive-today, not-already-queued users', async () => {
    let capturedSql = '';
    const query = async (sql: string) => {
      capturedSql = sql;
      return { rows: [{ user_id: 'u1', email: 'a@test.com', streak: 5 }] };
    };
    const repo = new PgRetentionEngineRepo({ query } as any);
    const result = await repo.getStreakReminderCandidates();
    expect(capturedSql).toMatch(/current_streak/);
    expect(capturedSql).toMatch(/streak_reminders/);
    expect(result).toEqual([{ user_id: 'u1', email: 'a@test.com', streak: 5 }]);
  });

  it('getWeeklyDigestCandidates selects opted-in users not queued in the last 6 days', async () => {
    let capturedSql = '';
    const query = async (sql: string) => {
      capturedSql = sql;
      return { rows: [{ user_id: 'u1' }] };
    };
    const repo = new PgRetentionEngineRepo({ query } as any);
    const result = await repo.getWeeklyDigestCandidates();
    expect(capturedSql).toMatch(/email_digest/);
    expect(capturedSql).toMatch(/INTERVAL '6 days'/);
    expect(result).toEqual([{ user_id: 'u1' }]);
  });

  it('getWeeklyStats passes userId positionally and returns a default row when empty', async () => {
    let capturedParams: any[] = [];
    const query = async (sql: string, params: any[]) => {
      capturedParams = params;
      return { rows: [] };
    };
    const repo = new PgRetentionEngineRepo({ query } as any);
    const result = await repo.getWeeklyStats('u1');
    expect(capturedParams).toEqual(['u1']);
    expect(result).toEqual({ problems_solved: '0', accuracy: null });
  });

  it('enqueueEmail stringifies payload and ISO-formats scheduledAt', async () => {
    let capturedSql = '';
    let capturedParams: any[] = [];
    const query = async (sql: string, params: any[]) => {
      capturedSql = sql;
      capturedParams = params;
      return { rows: [] };
    };
    const repo = new PgRetentionEngineRepo({ query } as any);
    const scheduledAt = new Date('2026-08-05T00:00:00.000Z');
    await repo.enqueueEmail('u1', 'streak_reminder', { streak_count: 5 }, scheduledAt);
    expect(capturedSql).toMatch(/INSERT INTO email_queue/);
    expect(capturedParams).toEqual(['u1', 'streak_reminder', JSON.stringify({ streak_count: 5 }), '2026-08-05T00:00:00.000Z']);
  });

  it('enqueueWelcomeSequence inserts all 3 templates in one query', async () => {
    let capturedSql = '';
    let capturedParams: any[] = [];
    const query = async (sql: string, params: any[]) => {
      capturedSql = sql;
      capturedParams = params;
      return { rows: [] };
    };
    const repo = new PgRetentionEngineRepo({ query } as any);
    const day3 = new Date('2026-08-05T00:00:00.000Z');
    const day7 = new Date('2026-08-09T00:00:00.000Z');
    await repo.enqueueWelcomeSequence('u1', day3, day7);
    expect(capturedSql).toContain('welcome_day0');
    expect(capturedSql).toContain('welcome_day3');
    expect(capturedSql).toContain('welcome_day7');
    expect(capturedParams).toEqual(['u1', '2026-08-05T00:00:00.000Z', '2026-08-09T00:00:00.000Z']);
  });
});

describe('NullRetentionEngineRepo', () => {
  it('getPendingEmails returns an empty array', async () => {
    const repo = new NullRetentionEngineRepo();
    await expect(repo.getPendingEmails()).resolves.toEqual([]);
  });

  it('setEmailStatus is a safe no-op', async () => {
    const repo = new NullRetentionEngineRepo();
    await expect(repo.setEmailStatus()).resolves.toBeUndefined();
  });

  it('getStreakReminderCandidates returns an empty array', async () => {
    const repo = new NullRetentionEngineRepo();
    await expect(repo.getStreakReminderCandidates()).resolves.toEqual([]);
  });

  it('getWeeklyDigestCandidates returns an empty array', async () => {
    const repo = new NullRetentionEngineRepo();
    await expect(repo.getWeeklyDigestCandidates()).resolves.toEqual([]);
  });

  it('getWeeklyStats returns a default zero row', async () => {
    const repo = new NullRetentionEngineRepo();
    await expect(repo.getWeeklyStats()).resolves.toEqual({ problems_solved: '0', accuracy: null });
  });

  it('enqueueEmail is a safe no-op', async () => {
    const repo = new NullRetentionEngineRepo();
    await expect(repo.enqueueEmail()).resolves.toBeUndefined();
  });

  it('enqueueWelcomeSequence is a safe no-op', async () => {
    const repo = new NullRetentionEngineRepo();
    await expect(repo.enqueueWelcomeSequence()).resolves.toBeUndefined();
  });
});
