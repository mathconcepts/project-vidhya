/**
 * Real-filesystem round trip for buildContentBundle (extracted from
 * scripts/build-bundle.ts so src/jobs/nightly-content-chain.ts can call it
 * in-process). Every test writes into a temp dir — never the repo's real
 * frontend/public/data/content-bundle.json.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { buildContentBundle } from '../build-content-bundle';

let tmp: string;
let feDataDir: string;
let rawDir: string;
let genDir: string;
let topicsDir: string;

beforeEach(() => {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'build-bundle-'));
  feDataDir = path.join(tmp, 'fe-data');
  rawDir = path.join(tmp, 'raw');
  genDir = path.join(tmp, 'generated');
  topicsDir = path.join(tmp, 'topics');
  fs.mkdirSync(feDataDir, { recursive: true });
});

afterEach(() => {
  fs.rmSync(tmp, { recursive: true, force: true });
});

function opts() {
  return { feDataDir, rawDir, genDir, topicsDir, quiet: true };
}

describe('buildContentBundle', () => {
  it('writes an empty-but-valid bundle when no sources exist', () => {
    const result = buildContentBundle(opts());
    expect(fs.existsSync(result.outPath)).toBe(true);
    expect(result.total_problems).toBe(0);
    expect(result.total_explainers).toBe(0);
    expect(result.total_topic_notes).toBe(0);
    const written = JSON.parse(fs.readFileSync(result.outPath, 'utf-8'));
    expect(written.version).toBe(3);
    expect(written.problems).toEqual([]);
  });

  it('merges pyq-bank.json, dedupes by fingerprint, and normalizes difficulty', () => {
    fs.writeFileSync(
      path.join(feDataDir, 'pyq-bank.json'),
      JSON.stringify({
        problems: [
          { question_text: 'What is 2+2?', correct_answer: '4', topic: 'arithmetic', difficulty: 'easy' },
          // Exact duplicate (same question_text + correct_answer) — should be deduped.
          { question_text: 'What is 2+2?', correct_answer: '4', topic: 'arithmetic', difficulty: 'easy' },
        ],
      }),
    );
    const result = buildContentBundle(opts());
    expect(result.total_problems).toBe(1);
    const written = JSON.parse(fs.readFileSync(result.outPath, 'utf-8'));
    expect(written.problems[0].difficulty).toBe(0.25);
    expect(written.problems[0].concept_id).toBe('arithmetic');
    expect(result.by_difficulty.easy).toBe(1);
  });

  it('merges verified generated problems and skips unverified ones', () => {
    fs.mkdirSync(genDir, { recursive: true });
    fs.writeFileSync(
      path.join(genDir, 'batch-1.json'),
      JSON.stringify({
        problems: [
          { question_text: 'Verified Q', correct_answer: 'A', topic: 'calc', difficulty: 'hard', verified: true },
          { question_text: 'Unverified Q', correct_answer: 'B', topic: 'calc', difficulty: 'hard', verified: false },
        ],
      }),
    );
    const result = buildContentBundle(opts());
    expect(result.total_problems).toBe(1);
    const written = JSON.parse(fs.readFileSync(result.outPath, 'utf-8'));
    expect(written.problems[0].question_text).toBe('Verified Q');
    expect(written.problems[0].source).toBe('generated');
  });

  it('collects explainers.json by_concept map', () => {
    fs.writeFileSync(
      path.join(feDataDir, 'explainers.json'),
      JSON.stringify({ by_concept: { 'derivatives-basic': { model: 'gemini' }, 'eigenvalues': { model: 'gemini' } } }),
    );
    const result = buildContentBundle(opts());
    expect(result.total_explainers).toBe(2);
  });

  it('collects per-topic lecture-notes excerpts keyed by topic id, truncated with an ellipsis', () => {
    const dir = path.join(topicsDir, '01-linear-algebra');
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'lecture-notes.md'), 'x'.repeat(3000));
    const result = buildContentBundle(opts());
    expect(result.total_topic_notes).toBe(1);
    const written = JSON.parse(fs.readFileSync(result.outPath, 'utf-8'));
    expect(written.topic_notes['linear-algebra']).toMatch(/…$/);
    expect(written.topic_notes['linear-algebra'].length).toBeLessThan(3000);
  });

  it('is idempotent — rebuilding from the same sources produces the same problem/explainer/note counts', () => {
    fs.writeFileSync(
      path.join(feDataDir, 'pyq-bank.json'),
      JSON.stringify({ problems: [{ question_text: 'Q1', correct_answer: 'A', topic: 't' }] }),
    );
    const first = buildContentBundle(opts());
    const second = buildContentBundle(opts());
    expect(second.total_problems).toBe(first.total_problems);
  });
});
