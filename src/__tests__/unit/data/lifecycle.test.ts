// @ts-nocheck
/**
 * Unit tests for lifecycle-critical behaviours.
 *
 *   - Demo seed idempotency             (PENDING.md §2.3)
 *   - Data-rights cooling period        (PENDING.md §5)
 *   - Scheduler job registration        (PENDING.md §1.3, §13.3)
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import {
  readFileSync, mkdirSync, existsSync, rmSync, cpSync,
} from 'fs';

let savedBackup = '';

beforeAll(() => {
  if (existsSync('.data')) {
    savedBackup = `.data.testsave-${Date.now()}`;
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

beforeEach(() => {
  if (existsSync('.data')) rmSync('.data', { recursive: true, force: true });
  mkdirSync('.data', { recursive: true });
});

describe('Demo seed idempotency (PENDING §2.3)', () => {
  it('upsertFromGoogle updates existing user rather than creating a duplicate', async () => {
    const { upsertFromGoogle } = await import('../../../auth/user-store');

    const u1 = upsertFromGoogle({ google_sub: 'test-sub-abc', email: 'test1@example.com', name: 'Test User', picture: '' });
    const u2 = upsertFromGoogle({ google_sub: 'test-sub-abc', email: 'test1@example.com', name: 'Test User Updated', picture: '' });

    expect(u2.id).toBe(u1.id);
    expect(u2.name).toBe('Test User Updated');

    const raw = JSON.parse(readFileSync('.data/users.json', 'utf-8'));
    const matches = Object.values(raw.users).filter((u: any) => u.google_sub === 'test-sub-abc');
    expect(matches).toHaveLength(1);
  });

  it('running 6-user seed twice yields 6 total, not 12', async () => {
    const { upsertFromGoogle } = await import('../../../auth/user-store');
    const seed = [
      { sub: 'idem-a', email: 'a@example.com', name: 'A' },
      { sub: 'idem-b', email: 'b@example.com', name: 'B' },
      { sub: 'idem-c', email: 'c@example.com', name: 'C' },
      { sub: 'idem-d', email: 'd@example.com', name: 'D' },
      { sub: 'idem-e', email: 'e@example.com', name: 'E' },
      { sub: 'idem-f', email: 'f@example.com', name: 'F' },
    ];
    for (const s of seed) upsertFromGoogle({ google_sub: s.sub, email: s.email, name: s.name, picture: '' });
    for (const s of seed) upsertFromGoogle({ google_sub: s.sub, email: s.email, name: s.name, picture: '' });

    const raw = JSON.parse(readFileSync('.data/users.json', 'utf-8'));
    expect(Object.keys(raw.users)).toHaveLength(6);
  });
});

describe('Data-rights cooling period (PENDING §5)', () => {
  it('refuses confirmDeletion before 24h cooling elapses', async () => {
    const { upsertFromGoogle } = await import('../../../auth/user-store');
    const { requestDeletion, confirmDeletion } = await import('../../../data-rights/delete');

    const u = upsertFromGoogle({ google_sub: 'dr-sub-1', email: 'dr1@example.com', name: 'T', picture: '' });
    const req = requestDeletion(u.id);
    expect(req.ok).toBe(true);

    const confirm = confirmDeletion(u.id);
    expect(confirm.ok).toBe(false);
    expect(confirm.reason).toMatch(/cooling period/);
  });

  it('cancelDeletion restores the account', async () => {
    const { upsertFromGoogle } = await import('../../../auth/user-store');
    const { requestDeletion, cancelDeletion } = await import('../../../data-rights/delete');

    const u = upsertFromGoogle({ google_sub: 'dr-sub-2', email: 'dr2@example.com', name: 'T', picture: '' });
    requestDeletion(u.id);
    const cancel = cancelDeletion(u.id);
    expect(cancel.ok).toBe(true);

    const raw = JSON.parse(readFileSync('.data/users.json', 'utf-8'));
    const user = raw.users[u.id];
    expect(user.deletion_requested_at).toBeUndefined();
  });

  it('finaliseExpiredDeletions leaves pending requests alone', async () => {
    const { upsertFromGoogle } = await import('../../../auth/user-store');
    const { requestDeletion, finaliseExpiredDeletions } = await import('../../../data-rights/delete');

    const u = upsertFromGoogle({ google_sub: 'dr-sub-3', email: 'dr3@example.com', name: 'T', picture: '' });
    requestDeletion(u.id);

    const r = finaliseExpiredDeletions();
    expect(r.finalised).toBe(0);

    const raw = JSON.parse(readFileSync('.data/users.json', 'utf-8'));
    expect(raw.users[u.id]).toBeTruthy();
  });
});

describe('Scheduler (PENDING §1.3, §13.3)', () => {
  it('jobStatus returns the registered jobs', async () => {
    const { jobStatus } = await import('../../../jobs/scheduler');
    const jobs = jobStatus();
    expect(jobs.length).toBeGreaterThanOrEqual(2);
    const names = jobs.map((j: any) => j.name);
    expect(names).toContain('finaliseExpiredDeletions');
    expect(names).toContain('healthScan');
  });
});
