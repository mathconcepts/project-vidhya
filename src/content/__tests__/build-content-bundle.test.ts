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
import { buildContentBundle, validateConceptIds, InvalidConceptIdError } from '../build-content-bundle';
import { ALL_CONCEPTS } from '../../constants/concept-graph';

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
    // A problem with no concept_id stays concept_id-less — it must NEVER
    // fall back to the topic label ('arithmetic' here). That silent
    // fallback is exactly how the topic label 'linear-algebra' shipped as
    // a fake concept id in the real content-bundle.json before this fix.
    expect(written.problems[0].concept_id).toBeUndefined();
    expect(result.by_difficulty.easy).toBe(1);
  });

  it('refuses (and drops, without aborting the rest) a pyq-bank.json problem carrying an invalid concept_id', () => {
    fs.writeFileSync(
      path.join(feDataDir, 'pyq-bank.json'),
      JSON.stringify({
        problems: [
          // Exactly the two real bugs found in production: a topic label
          // used as concept_id, and a plausible-but-unregistered id.
          { id: 'bad-1', question_text: 'Q1', correct_answer: 'A', topic: 'linear-algebra', concept_id: 'linear-algebra' },
          { id: 'bad-2', question_text: 'Q2', correct_answer: 'A', topic: 'linear-algebra', concept_id: 'matrix-rank' },
          { id: 'good-1', question_text: 'Q3', correct_answer: 'A', topic: 'linear-algebra', concept_id: 'eigenvalues' },
        ],
      }),
    );
    const result = buildContentBundle(opts());
    expect(result.total_problems).toBe(1);
    const written = JSON.parse(fs.readFileSync(result.outPath, 'utf-8'));
    expect(written.problems.map((p: any) => p.id)).toEqual(['good-1']);
  });

  it('refuses a pyq-bank.json problem whose concept_ids array carries even one invalid id', () => {
    fs.writeFileSync(
      path.join(feDataDir, 'pyq-bank.json'),
      JSON.stringify({
        problems: [
          { id: 'bad-array', question_text: 'Q', correct_answer: 'A', topic: 'linear-algebra', concept_id: 'eigenvalues', concept_ids: ['eigenvalues', 'not-a-real-concept'] },
        ],
      }),
    );
    const result = buildContentBundle(opts());
    expect(result.total_problems).toBe(0);
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

  it('merges verified generated problems and refuses one with an invalid concept_id, without dropping its valid siblings', () => {
    fs.mkdirSync(genDir, { recursive: true });
    fs.writeFileSync(
      path.join(genDir, 'batch-1.json'),
      JSON.stringify({
        problems: [
          { id: 'gen-good', question_text: 'Good Q', correct_answer: 'A', topic: 'linear-algebra', concept_id: 'eigenvalues', difficulty: 'hard', verified: true },
          { id: 'gen-bad', question_text: 'Bad Q', correct_answer: 'B', topic: 'linear-algebra', concept_id: 'linear-algebra', difficulty: 'hard', verified: true },
        ],
      }),
    );
    const result = buildContentBundle(opts());
    expect(result.total_problems).toBe(1);
    const written = JSON.parse(fs.readFileSync(result.outPath, 'utf-8'));
    expect(written.problems[0].id).toBe('gen-good');
  });

  it('refuses a scraped-corpus JSONL problem with an invalid concept_id, keeping the file\'s other valid lines', () => {
    fs.mkdirSync(rawDir, { recursive: true });
    const lines = [
      JSON.stringify({ kind: 'problem', source: 'corpus', metadata: { id: 'raw-good', question_text: 'Good raw Q', correct_answer: 'A', topic: 'linear-algebra', concept_id: 'eigenvalues' } }),
      JSON.stringify({ kind: 'problem', source: 'corpus', metadata: { id: 'raw-bad', question_text: 'Bad raw Q', correct_answer: 'B', topic: 'linear-algebra', concept_id: 'matrix-rank' } }),
    ];
    fs.writeFileSync(path.join(rawDir, 'sample.jsonl'), lines.join('\n'));
    const result = buildContentBundle(opts());
    expect(result.total_problems).toBe(1);
    const written = JSON.parse(fs.readFileSync(result.outPath, 'utf-8'));
    expect(written.problems[0].id).toBe('raw-good');
    // Corpus JSONL never carries its own concept_ids array (only ever a
    // scalar concept_id) — the fallback synthesizes it, so a
    // concept_ids-only consumer (buildPyqConceptIndex) can still find this
    // single-concept item.
    expect(written.problems[0].concept_ids).toEqual(['eigenvalues']);
  });
});

describe('validateConceptIds — the hard refuse-invalid-concept-id gate', () => {
  it('is a no-op for a real, registered concept_id', () => {
    expect(() => validateConceptIds({ id: 'p1', concept_id: 'eigenvalues' }, 'test')).not.toThrow();
  });

  it('is a no-op when concept_id/concept_ids are both absent — unmapped is honest, not invalid', () => {
    expect(() => validateConceptIds({ id: 'p1' }, 'test')).not.toThrow();
  });

  it('throws InvalidConceptIdError for a topic label used as concept_id ("linear-algebra")', () => {
    expect(() => validateConceptIds({ id: 'p1', concept_id: 'linear-algebra' }, 'pyq-bank.json'))
      .toThrow(InvalidConceptIdError);
  });

  it('throws InvalidConceptIdError for a plausible-but-unregistered id ("matrix-rank")', () => {
    try {
      validateConceptIds({ id: 'la-x', concept_id: 'matrix-rank' }, 'corpus.jsonl');
      expect.unreachable('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(InvalidConceptIdError);
      const e = err as InvalidConceptIdError;
      expect(e.conceptId).toBe('matrix-rank');
      expect(e.problemId).toBe('la-x');
      expect(e.message).toContain('matrix-rank');
      expect(e.message).toContain('la-x');
    }
  });

  it('throws for the FIRST invalid entry inside a concept_ids array, even when concept_id itself is valid', () => {
    expect(() =>
      validateConceptIds({ id: 'p1', concept_id: 'eigenvalues', concept_ids: ['eigenvalues', 'bogus-concept'] }, 'test'),
    ).toThrow(InvalidConceptIdError);
  });

  it('every real concept id in ALL_CONCEPTS passes (sanity: the validator agrees with its own source of truth)', () => {
    for (const concept of ALL_CONCEPTS.slice(0, 25)) {
      expect(() => validateConceptIds({ id: 'p', concept_id: concept.id }, 'test')).not.toThrow();
    }
  });
});
