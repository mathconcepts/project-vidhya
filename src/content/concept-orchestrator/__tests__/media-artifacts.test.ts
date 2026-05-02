/**
 * media-artifacts tests (§4.15 Phase A).
 * DB-less graceful degradation + path naming.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {
  pathForArtifact,
  writeArtifact,
  getActiveArtifact,
  listForAtom,
  markFailed,
} from '../media-artifacts';

describe('media-artifacts', () => {
  const prevDb = process.env.DATABASE_URL;
  const prevDir = process.env.MEDIA_STORAGE_DIR;

  beforeEach(() => {
    delete process.env.DATABASE_URL; // force DB-less path
  });
  afterEach(() => {
    if (prevDb) process.env.DATABASE_URL = prevDb;
    if (prevDir) process.env.MEDIA_STORAGE_DIR = prevDir;
    else delete process.env.MEDIA_STORAGE_DIR;
  });

  it('builds deterministic paths', () => {
    const p1 = pathForArtifact('atom_abc', 3, 'gif');
    expect(p1.endsWith('atom_abc.v3.gif')).toBe(true);
    const p2 = pathForArtifact('atom_abc', 3, 'audio_narration');
    expect(p2.endsWith('atom_abc.v3.mp3')).toBe(true);
  });

  it('writeArtifact returns synthetic row when DB unavailable', async () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'media-test-'));
    process.env.MEDIA_STORAGE_DIR = tmp;
    const buf = Buffer.from([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]);
    const r = await writeArtifact('atom_x', 1, 'gif', buf, { duration_ms: 100 });
    expect(r).not.toBeNull();
    expect(r!.atom_id).toBe('atom_x');
    expect(r!.kind).toBe('gif');
    // File should exist on disk regardless of DB
    expect(fs.existsSync(r!.src_path)).toBe(true);
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  it('getActiveArtifact returns null without DB', async () => {
    const r = await getActiveArtifact('atom_nonexistent', 'gif');
    expect(r).toBeNull();
  });

  it('listForAtom returns empty without DB', async () => {
    const r = await listForAtom('atom_nonexistent');
    expect(r).toEqual([]);
  });

  it('markFailed is a no-op without DB', async () => {
    await expect(
      markFailed('atom_x', 1, 'gif', 'render error'),
    ).resolves.not.toThrow();
  });
});
