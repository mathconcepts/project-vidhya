/**
 * scripts/check-gif-scenes.ts — media QA baseline-gate tests (§4.15
 * follow-up, W3.6/E9). Spawns the real script (via tsx) against an isolated
 * fixture tree + an isolated baseline file, same pattern as
 * check-la-walkthrough.test.ts: nothing here ever mutates the real
 * modules/project-vidhya-content tree or scripts/gif-scene-baseline.json.
 *
 * Focus: the QA hard-fail path specifically (label overlap on the final
 * frame) is a SEPARATE finding class from "would not render" — a fixture
 * with a valid, renderable scene that nonetheless overlaps its own labels.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const REPO_ROOT = process.cwd();
const SCRIPT = path.resolve(REPO_ROOT, 'scripts/check-gif-scenes.ts');
const TSX_BIN = path.resolve(REPO_ROOT, 'node_modules/.bin/tsx');

/**
 * A discrete-bars scene with 20 bars and long "Day N" labels on a narrow
 * 200px canvas — deterministically forces adjacent bar labels to overlap
 * on every frame including the final one (verified directly against
 * gif-generator.ts in gif-generator-qa.test.ts; this test only cares that
 * the CI SCRIPT wraps that finding into a blocking/grandfathered gate).
 */
const OVERLAPPING_SCENE = JSON.stringify({
  type: 'discrete-bars',
  values: Array.from({ length: 20 }, (_, i) => i + 1),
  labels: Array.from({ length: 20 }, (_, i) => `Day ${i + 1}`),
  frames: 4,
  width: 200,
  height: 100,
});

const CLEAN_SCENE = JSON.stringify({
  type: 'function-trace',
  expression: 'sin(x)',
  x_range: [-6, 6],
  y_range: [-1.5, 1.5],
  frames: 4,
});

const cleanups: Array<() => void> = [];
afterEach(() => {
  while (cleanups.length) cleanups.pop()!();
});

function makeFixture(sceneJson: string): { conceptFile: string; conceptDir: string; key: string } {
  const conceptDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gif-qa-fixture-'));
  cleanups.push(() => fs.rmSync(conceptDir, { recursive: true, force: true }));
  const conceptFile = path.join(conceptDir, 'visual-analogy.md');
  fs.writeFileSync(
    conceptFile,
    `---\nid: fixture-atom\natom_type: visual_analogy\n---\n\n` +
      '```gif-scene\n' + sceneJson + '\n```\n',
  );
  // Same relative-path key computation as check-gif-scenes.ts:
  // `path.relative(ROOT, file)` where ROOT = repo root.
  const key = path.relative(REPO_ROOT, conceptFile);
  return { conceptFile, conceptDir, key };
}

function makeBaseline(content: object): string {
  const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'gif-qa-baseline-')), 'baseline.json');
  cleanups.push(() => fs.rmSync(path.dirname(file), { recursive: true, force: true }));
  fs.writeFileSync(file, JSON.stringify(content));
  return file;
}

function runScript(args: string[]) {
  return spawnSync(TSX_BIN, [SCRIPT, ...args], {
    encoding: 'utf-8',
    timeout: 60_000,
    cwd: REPO_ROOT,
  });
}

describe('check-gif-scenes.ts — media QA baseline gate', () => {
  it('passes cleanly on a scene with no title/labels to overlap', () => {
    const { conceptDir } = makeFixture(CLEAN_SCENE);
    const baseline = makeBaseline({ known_broken_scenes: [], qa_grandfathered: {} });
    const r = runScript(['--dir', conceptDir, '--baseline', baseline]);
    expect(r.status).toBe(0);
    expect(r.stdout).toContain('pass media QA cleanly');
  });

  it('fails the build on a NEW QA hard-failure not in qa_grandfathered', () => {
    const { conceptDir } = makeFixture(OVERLAPPING_SCENE);
    const baseline = makeBaseline({ known_broken_scenes: [], qa_grandfathered: {} });
    const r = runScript(['--dir', conceptDir, '--baseline', baseline]);
    expect(r.status).toBe(1);
    expect(r.stderr).toContain('failed media QA');
    expect(r.stderr).toContain('label overlap on final frame');
  });

  it('passes when the same QA hard-failure IS grandfathered by key', () => {
    const { conceptDir, key } = makeFixture(OVERLAPPING_SCENE);
    const baseline = makeBaseline({
      known_broken_scenes: [],
      qa_grandfathered: { [key]: 'fixture: intentionally narrow canvas, pre-existing debt' },
    });
    const r = runScript(['--dir', conceptDir, '--baseline', baseline]);
    expect(r.status).toBe(0);
    expect(r.stdout).toContain('grandfathered');
  });

  it('--report-only never blocks even on a new QA hard-failure', () => {
    const { conceptDir } = makeFixture(OVERLAPPING_SCENE);
    const baseline = makeBaseline({ known_broken_scenes: [], qa_grandfathered: {} });
    const r = runScript(['--dir', conceptDir, '--baseline', baseline, '--report-only']);
    expect(r.status).toBe(0);
    expect(r.stderr).toContain('failed media QA');
  });

  it('flags (without failing) a qa_grandfathered entry that now passes QA', () => {
    const { conceptDir, key } = makeFixture(CLEAN_SCENE);
    const baseline = makeBaseline({
      known_broken_scenes: [],
      qa_grandfathered: { [key]: 'stale — this scene does not actually fail QA' },
    });
    const r = runScript(['--dir', conceptDir, '--baseline', baseline]);
    expect(r.status).toBe(0);
    expect(r.stdout).toContain('now pass QA and should be');
  });

  it('render-failure and QA-failure are independent gates (render failure still blocks under a QA-only baseline)', () => {
    const { conceptDir } = makeFixture(JSON.stringify({ type: 'parametric', expression: 'x;require("fs")' }));
    const baseline = makeBaseline({ known_broken_scenes: [], qa_grandfathered: {} });
    const r = runScript(['--dir', conceptDir, '--baseline', baseline]);
    expect(r.status).toBe(1);
    expect(r.stderr).toContain('would not render');
  });
});
