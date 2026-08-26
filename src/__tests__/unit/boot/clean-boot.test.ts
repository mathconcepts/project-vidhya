/**
 * Two errors that every deploy logged, neither of which was a real fault.
 *
 * Both were noise of the worst kind: a real error message, printed forever,
 * about something not actually broken. A log that always contains errors
 * trains whoever reads it to skip them, and the next genuine failure sits in
 * that same blind spot.
 *
 *   [exam-loader] failed gate-ma.floor.yml: metadata block required
 *   [scheduler] healthScan failed: modules.yaml not found — orchestrator
 *               cannot boot without it
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { isExamSidecar } from '../../../curriculum/exam-loader';

const ROOT = path.resolve(__dirname, '../../../..');

describe('exam sidecar files are not exam packs', () => {
  it('recognises the floor contract, which has no metadata block by design', () => {
    // scripts/check-syllabus-floor.ts resolves `${examId}.floor.yml` by exactly
    // this name, so the suffix is an existing convention, not one invented here.
    expect(isExamSidecar('gate-ma.floor.yml')).toBe(true);
    expect(isExamSidecar('jee-main.floor.yaml')).toBe(true);
  });

  it('does not skip real exam packs', () => {
    expect(isExamSidecar('gate-ma.yml')).toBe(false);
    expect(isExamSidecar('jee-main.yml')).toBe(false);
    // Not a sidecar just because "floor" appears somewhere in the name.
    expect(isExamSidecar('floor-plan-exam.yml')).toBe(false);
  });

  it('the floor file this was written for is actually present and is skipped', () => {
    // If the file is ever renamed, this test fails rather than the skip
    // silently applying to nothing.
    const floor = path.join(ROOT, 'data/curriculum/gate-ma.floor.yml');
    expect(fs.existsSync(floor), 'gate-ma.floor.yml moved — the skip may now be dead code').toBe(true);
    expect(isExamSidecar(path.basename(floor))).toBe(true);
  });

  it('the loader still refuses a genuinely malformed pack', () => {
    // The metadata error is the loader's only defence against a broken exam
    // pack. Quieting the sidecar must not have quieted that too, which is why
    // the skip is by filename and not by "this file has no metadata block".
    const src = fs.readFileSync(path.join(ROOT, 'src/curriculum/exam-loader.ts'), 'utf8');
    expect(src).toContain('metadata block required');
  });
});

describe('modules.yaml reaches the image', () => {
  // src/orchestrator/registry.ts reads it from process.cwd(). It is tracked in
  // git, but neither Dockerfile copied it — both copy the modules/ DIRECTORY,
  // which is content, not the registry. So loadRegistry() threw in every
  // deployed image and the scheduler's healthScan hit it every five minutes.
  const dockerfiles = ['Dockerfile', 'demo/Dockerfile'];

  it('is tracked at the repo root, where the registry expects it', () => {
    expect(fs.existsSync(path.join(ROOT, 'modules.yaml'))).toBe(true);
  });

  it.each(dockerfiles)('%s copies modules.yaml into the runtime stage', (df) => {
    const content = fs.readFileSync(path.join(ROOT, df), 'utf8');
    // `COPY modules/ modules/` must not satisfy this — that is the directory.
    const copiesRegistry = /COPY\s+(--from=\S+\s+)?\S*modules\.yaml/.test(content);
    expect(
      copiesRegistry,
      `${df} never copies modules.yaml, so loadRegistry() throws at runtime`,
    ).toBe(true);
  });

  it('is not excluded from the build context', () => {
    // A COPY line is useless if .dockerignore hides the file from the daemon.
    const ignore = fs.readFileSync(path.join(ROOT, '.dockerignore'), 'utf8');
    const patterns = ignore
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith('#') && !l.startsWith('!'));
    for (const p of patterns) {
      expect(p).not.toBe('modules.yaml');
      expect(p).not.toBe('*.yaml');
      expect(p).not.toBe('*.yml');
    }
  });
});
