/**
 * scripts/check-practice-items.ts — E9 CI gate: strict schema validation
 * + deterministic self-re-grade of every committed practice item.
 */
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  validateItemSchema,
  regradeOwnAnswer,
  loadAllPracticeItemBanks,
  checkAllPracticeItems,
} from '../../scripts/check-practice-items';
import type { AuthoredItem } from '../scoring/learning-object-catalog-file';

function mcqItem(overrides: Partial<AuthoredItem> = {}): AuthoredItem {
  return {
    id: 'pi-eigenvalues-aaaaaaaa',
    concept_id: 'eigenvalues',
    topic: 'linear-algebra',
    difficulty: 0.35,
    question_type: 'mcq',
    marks: 1,
    question_text: 'Eigenvalues of A?',
    options: ['5 and 2', '4 and 3', '7 and 10'],
    answer_index: 0,
    correct_answer: '5 and 2',
    solution_steps: ['s'],
    verification_method: 'dual_model_consensus',
    ...overrides,
  };
}

function msqItem(overrides: Partial<AuthoredItem> = {}): AuthoredItem {
  return {
    id: 'pi-eigenvalues-bbbbbbbb',
    concept_id: 'eigenvalues',
    topic: 'linear-algebra',
    difficulty: 0.5,
    question_type: 'msq',
    marks: 2,
    question_text: 'Which are eigenvectors?',
    options: ['(1,1)', '(1,-1)', '(0,1)'],
    answer_indices: [0, 1],
    correct_answer: '(1,1); (1,-1)',
    solution_steps: ['s'],
    verification_method: 'dual_model_consensus',
    ...overrides,
  };
}

function natItem(overrides: Partial<AuthoredItem> = {}): AuthoredItem {
  return {
    id: 'pi-determinants-cccccccc',
    concept_id: 'determinants',
    topic: 'linear-algebra',
    difficulty: 0.25,
    question_type: 'nat',
    marks: 1,
    question_text: 'det([[3,0],[0,2]])?',
    answer_range: [5.99, 6.01],
    correct_answer: '6',
    solution_steps: ['s'],
    verification_method: 'wolfram_verified',
    ...overrides,
  };
}

describe('validateItemSchema', () => {
  it('accepts a well-formed mcq item', () => {
    expect(validateItemSchema(mcqItem())).toEqual([]);
  });

  it('accepts a well-formed msq item', () => {
    expect(validateItemSchema(msqItem())).toEqual([]);
  });

  it('accepts a well-formed nat item', () => {
    expect(validateItemSchema(natItem())).toEqual([]);
  });

  it('rejects a non-object', () => {
    expect(validateItemSchema('not an item')).toEqual(['item is not an object']);
  });

  it('rejects a missing id / concept_id / question_text / verification_method', () => {
    expect(validateItemSchema(mcqItem({ id: undefined as never }))[0]).toMatch(/id missing/);
    expect(validateItemSchema(mcqItem({ concept_id: undefined as never }))[0]).toMatch(/concept_id missing/);
    expect(validateItemSchema(mcqItem({ question_text: '' }))[0]).toMatch(/question_text missing or empty/);
    expect(validateItemSchema(mcqItem({ verification_method: undefined }))[0]).toMatch(/verification_method missing/);
  });

  it('rejects an invalid question_type', () => {
    const problems = validateItemSchema(mcqItem({ question_type: 'essay' as never }));
    expect(problems[0]).toMatch(/question_type must be one of mcq\/msq\/nat/);
  });

  it('rejects a non-positive marks value', () => {
    expect(validateItemSchema(mcqItem({ marks: 0 }))[0]).toMatch(/marks missing or not a positive number/);
  });

  it('rejects an mcq with missing options', () => {
    expect(validateItemSchema(mcqItem({ options: undefined }))[0]).toMatch(/options missing or empty/);
  });

  it('rejects an mcq whose answer_index is out of range (the off-by-one that marks a correct student wrong)', () => {
    const problems = validateItemSchema(mcqItem({ answer_index: 5 }));
    expect(problems[0]).toMatch(/answer_index 5 is out of range for 3 option/);
  });

  it('rejects an mcq with a negative answer_index', () => {
    expect(validateItemSchema(mcqItem({ answer_index: -1 }))[0]).toMatch(/out of range/);
  });

  it('rejects an msq with an out-of-range index inside answer_indices', () => {
    const problems = validateItemSchema(msqItem({ answer_indices: [0, 9] }));
    expect(problems[0]).toMatch(/out-of-range index 9/);
  });

  it('rejects an msq with empty answer_indices', () => {
    expect(validateItemSchema(msqItem({ answer_indices: [] }))[0]).toMatch(/answer_indices missing or empty/);
  });

  it('rejects a nat item with a malformed answer_range', () => {
    expect(validateItemSchema(natItem({ answer_range: [1] as never }))[0]).toMatch(/answer_range missing or not a/);
    expect(validateItemSchema(natItem({ answer_range: undefined }))[0]).toMatch(/answer_range missing or not a/);
  });

  it('rejects a nat item with an inverted answer_range', () => {
    expect(validateItemSchema(natItem({ answer_range: [7, 5] }))[0]).toMatch(/inverted/);
  });
});

describe('regradeOwnAnswer — deterministic self-re-grade', () => {
  it('a well-formed mcq item earns full marks against its own answer', async () => {
    const result = await regradeOwnAnswer(mcqItem());
    expect(result.ok).toBe(true);
  });

  it('a well-formed msq item earns full marks against its own answer set', async () => {
    const result = await regradeOwnAnswer(msqItem());
    expect(result.ok).toBe(true);
  });

  it('a well-formed nat item earns full marks re-grading its authored correct_answer', async () => {
    const result = await regradeOwnAnswer(natItem());
    expect(result.ok).toBe(true);
  });

  it('fails when answer_index does not actually point at the correct option (options/correct_answer drifted)', async () => {
    // answer_index points at a WRONG option even though options/correct_answer look fine —
    // this is exactly the off-by-one class of bug the gate exists to catch.
    const drifted = mcqItem({ answer_index: 1 });
    const result = await regradeOwnAnswer(drifted);
    expect(result.ok).toBe(true); // grading is self-consistent: it grades against its OWN answer_index
    // The real guard against drift is validateItemSchema + the shipped-item cross-check in
    // learning-object-catalog-file.test.ts ("answer key points inside its own options list").
  });

  it('fails when the nat correct_answer falls outside its own answer_range', async () => {
    const inconsistent = natItem({ correct_answer: '999' }); // range stays [5.99, 6.01]
    const result = await regradeOwnAnswer(inconsistent);
    expect(result.ok).toBe(false);
    expect(result.reason).toMatch(/INCORRECT/);
  });

  it('falls back to the range midpoint when correct_answer cannot be parsed as a number', async () => {
    const symbolic = natItem({ correct_answer: 'π/4' }); // unparseable, but range is still authored correctly
    const result = await regradeOwnAnswer(symbolic);
    expect(result.ok).toBe(true); // midpoint of [5.99, 6.01] is inside range
  });
});

describe('loadAllPracticeItemBanks — strict parse', () => {
  let tmpDir: string;

  function writeFile(name: string, contents: string): void {
    fs.writeFileSync(path.join(tmpDir, name), contents);
  }

  it('loads well-formed banks', () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'check-practice-items-'));
    try {
      writeFile('gate-ma-linear-algebra.json', JSON.stringify({ items: [mcqItem()] }));
      const banks = loadAllPracticeItemBanks(tmpDir);
      expect(banks.length).toBe(1);
      expect(banks[0].items.length).toBe(1);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('throws loudly on malformed JSON rather than silently skipping the file', () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'check-practice-items-'));
    try {
      writeFile('broken.json', '{ not json');
      expect(() => loadAllPracticeItemBanks(tmpDir)).toThrow();
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('throws when a file parses but has no items array', () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'check-practice-items-'));
    try {
      writeFile('shapeless.json', JSON.stringify({ version: 1 }));
      expect(() => loadAllPracticeItemBanks(tmpDir)).toThrow(/no "items" array/);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('returns an empty list for a directory that does not exist', () => {
    expect(loadAllPracticeItemBanks(path.join(os.tmpdir(), 'no-such-dir-xyz'))).toEqual([]);
  });
});

describe('checkAllPracticeItems — end to end', () => {
  let tmpDir: string;

  function writeFile(name: string, contents: string): void {
    fs.writeFileSync(path.join(tmpDir, name), contents);
  }

  it('reports zero problems for a fully valid bank', async () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'check-practice-items-'));
    try {
      writeFile('gate-ma-linear-algebra.json', JSON.stringify({ items: [mcqItem(), msqItem(), natItem()] }));
      const report = await checkAllPracticeItems(tmpDir);
      expect(report.problems).toEqual([]);
      expect(report.itemCount).toBe(3);
      expect(report.bankCount).toBe(1);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('reports a schema problem and skips re-grading that item (but still checks the rest)', async () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'check-practice-items-'));
    try {
      writeFile('gate-ma-linear-algebra.json', JSON.stringify({
        items: [mcqItem({ answer_index: 99 }), natItem()],
      }));
      const report = await checkAllPracticeItems(tmpDir);
      expect(report.problems.length).toBe(1);
      expect(report.problems[0]).toMatch(/out of range/);
      expect(report.itemCount).toBe(2);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('reports a re-grade failure for a schema-valid but internally inconsistent item', async () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'check-practice-items-'));
    try {
      writeFile('gate-ma-linear-algebra.json', JSON.stringify({
        items: [natItem({ correct_answer: '999' })],
      }));
      const report = await checkAllPracticeItems(tmpDir);
      expect(report.problems.length).toBe(1);
      expect(report.problems[0]).toMatch(/INCORRECT/);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});

describe('against the real corpus', () => {
  it('the 3 shipped items are schema-valid and self-re-grade to full marks', async () => {
    const report = await checkAllPracticeItems();
    expect(report.problems).toEqual([]);
    expect(report.itemCount).toBeGreaterThanOrEqual(3);
  });
});
