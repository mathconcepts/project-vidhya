/**
 * getNarrationBucket tests (Phase F TTS A/B, §4.15).
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getNarrationBucket } from '../ab-tester';

describe('getNarrationBucket (DB-less)', () => {
  const prev = process.env.DATABASE_URL;
  beforeEach(() => { delete process.env.DATABASE_URL; });
  afterEach(() => { if (prev) process.env.DATABASE_URL = prev; else delete process.env.DATABASE_URL; });

  it('returns null when no student_id provided', async () => {
    const r = await getNarrationBucket('atom_x', null);
    expect(r).toBeNull();
  });

  it('returns null when student_id is empty string', async () => {
    const r = await getNarrationBucket('atom_x', '');
    expect(r).toBeNull();
  });

  it('returns null when DATABASE_URL is unset (no experiment readable)', async () => {
    const r = await getNarrationBucket('atom_x', 'student_42');
    expect(r).toBeNull();
  });

  it('returns null when student_id is undefined', async () => {
    const r = await getNarrationBucket('atom_x', undefined as any);
    expect(r).toBeNull();
  });
});
