/**
 * active-exam.ts — the dependency-free resolver concept-graph.ts and
 * exam-loader.ts share.
 *
 * The policy tests below matter more than they look. Before this module the
 * "which exam is active" rule existed twice: exam-loader.resolveActiveExamId()
 * had it, and concept-graph.ts didn't have it at all (it hardcoded gate-ma),
 * which is precisely why the graph could not follow DEFAULT_EXAM_ID.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import {
  CURRICULUM_DIR,
  isExamSidecar,
  listExamPackFiles,
  pickActiveExamId,
  resolveActiveExamPack,
  __resetExamPackCache,
} from '../active-exam';

const ORIGINAL_DEFAULT_EXAM_ID = process.env.DEFAULT_EXAM_ID;

afterEach(() => {
  if (ORIGINAL_DEFAULT_EXAM_ID === undefined) delete process.env.DEFAULT_EXAM_ID;
  else process.env.DEFAULT_EXAM_ID = ORIGINAL_DEFAULT_EXAM_ID;
  __resetExamPackCache();
});

describe('pickActiveExamId — the shared policy', () => {
  beforeEach(() => {
    delete process.env.DEFAULT_EXAM_ID;
  });

  it('returns null when there are no exams at all', () => {
    expect(pickActiveExamId([])).toBeNull();
  });

  it('honours DEFAULT_EXAM_ID when it names an available exam', () => {
    process.env.DEFAULT_EXAM_ID = 'jee-main';
    expect(pickActiveExamId(['gate-ma', 'jee-main'])).toBe('jee-main');
  });

  it('ignores DEFAULT_EXAM_ID naming an exam that is not available', () => {
    // Pointing at a pack that failed to load (or was never installed) must not
    // make the deployment claim to serve it.
    process.env.DEFAULT_EXAM_ID = 'neet';
    expect(pickActiveExamId(['gate-ma', 'jee-main'])).toBe('gate-ma');
  });

  it('ignores a blank / whitespace-only DEFAULT_EXAM_ID', () => {
    process.env.DEFAULT_EXAM_ID = '   ';
    expect(pickActiveExamId(['gate-ma', 'jee-main'])).toBe('gate-ma');
  });

  it('falls back to sorted-first, not input order', () => {
    // This is the behaviour change: the fallback used to be "whatever the
    // filesystem listed first", so two machines running identical code could
    // disagree on the active exam. Same set, different order, same answer.
    expect(pickActiveExamId(['jee-main', 'gate-ma'])).toBe('gate-ma');
    expect(pickActiveExamId(['gate-ma', 'jee-main'])).toBe('gate-ma');
  });

  it('does not mutate the caller\'s array while sorting', () => {
    const ids = ['jee-main', 'gate-ma'];
    pickActiveExamId(ids);
    expect(ids).toEqual(['jee-main', 'gate-ma']);
  });
});

describe('isExamSidecar', () => {
  it('treats <exam>.floor.yml / .yaml as a sidecar, not an exam', () => {
    expect(isExamSidecar('gate-ma.floor.yml')).toBe(true);
    expect(isExamSidecar('jee-main.floor.yaml')).toBe(true);
  });

  it('treats a real pack as a pack', () => {
    expect(isExamSidecar('gate-ma.yml')).toBe(false);
    expect(isExamSidecar('jee-main.yml')).toBe(false);
  });

  it('matches on the .floor. suffix, not the word "floor" anywhere', () => {
    expect(isExamSidecar('floor-plan-exam.yml')).toBe(false);
  });
});

describe('listExamPackFiles — against the real data/curriculum/', () => {
  beforeEach(() => {
    delete process.env.DEFAULT_EXAM_ID;
    __resetExamPackCache();
  });

  it('finds the shipped packs and skips the floor sidecar', () => {
    const ids = listExamPackFiles(true).map((p) => p.id);
    expect(ids).toContain('gate-ma');
    expect(ids).toContain('jee-main');
    expect(ids.some((id) => id.includes('.floor'))).toBe(false);
  });

  it('takes the id from metadata.id, and every path exists on disk', () => {
    for (const pack of listExamPackFiles(true)) {
      expect(fs.existsSync(pack.path)).toBe(true);
      const body = fs.readFileSync(pack.path, 'utf-8');
      expect(body).toContain(`id: ${pack.id}`);
    }
  });

  it('is sorted by id', () => {
    const ids = listExamPackFiles(true).map((p) => p.id);
    expect(ids).toEqual([...ids].sort());
  });

  it('resolves CURRICULUM_DIR from the module, not the cwd', () => {
    // exam-loader.ts used to compute this from process.cwd(), which made a
    // script or test spawned elsewhere see zero exams.
    expect(fs.existsSync(CURRICULUM_DIR)).toBe(true);
    expect(path.basename(CURRICULUM_DIR)).toBe('curriculum');
  });
});

describe('resolveActiveExamPack', () => {
  beforeEach(() => {
    __resetExamPackCache();
  });

  it('defaults to gate-ma with no DEFAULT_EXAM_ID set', () => {
    delete process.env.DEFAULT_EXAM_ID;
    expect(resolveActiveExamPack(true)?.id).toBe('gate-ma');
  });

  it('follows DEFAULT_EXAM_ID to another installed pack', () => {
    process.env.DEFAULT_EXAM_ID = 'jee-main';
    const pack = resolveActiveExamPack(true);
    expect(pack?.id).toBe('jee-main');
    expect(pack?.filename).toBe('jee-main.yml');
  });
});

describe('a stray file in data/curriculum/ is not an exam pack', () => {
  // Both cases below used to be boot-fatal or silently identity-changing. The
  // temp file goes into the REAL data/curriculum/, so cleanup is guaranteed in
  // afterEach — a leftover would be loaded by every other test in the suite.
  const STRAY = path.join(CURRICULUM_DIR, 'aaa-stray-test.yml');

  beforeEach(() => {
    delete process.env.DEFAULT_EXAM_ID;
    __resetExamPackCache();
  });

  afterEach(() => {
    if (fs.existsSync(STRAY)) fs.unlinkSync(STRAY);
    __resetExamPackCache();
  });

  it('skips a file that is not parseable as YAML instead of letting it reach a parse throw', () => {
    // concept-graph.ts builds its universe from this list at module scope, so
    // an unparseable file that survived to a throw took the whole server down
    // at boot — for every exam, not just the broken one.
    fs.writeFileSync(STRAY, 'this: [is\n  broken yaml: :::\n', 'utf-8');
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const ids = listExamPackFiles(true).map((p) => p.id);
    expect(ids).not.toContain('aaa-stray-test');
    expect(ids).toContain('gate-ma');
    expect(warn).toHaveBeenCalled(); // skipped loudly, never silently
    warn.mockRestore();
  });

  it('skips a parseable file with no metadata.id, so it can never win the alphabetical fallback', () => {
    // The fallback is sorted-first, so anything sorting before `gate-ma` used
    // to become the concept graph's "active exam" while exam-loader — which
    // only ever considered packs that really loaded — still said gate-ma.
    fs.writeFileSync(STRAY, 'notes:\n  - just some scratch\n', 'utf-8');
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(listExamPackFiles(true).map((p) => p.id)).not.toContain('aaa-stray-test');
    expect(resolveActiveExamPack(true)?.id).toBe('gate-ma');
    warn.mockRestore();
  });

  it('carries each pack\'s parsed document, so no caller re-reads the file', () => {
    for (const pack of listExamPackFiles(true)) {
      expect(pack.doc?.metadata?.id).toBe(pack.id);
    }
  });
});
