import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import {
  practiceItemBankPath,
  loadBank,
  mergeItems,
  writePracticeItemBank,
  PracticeItemOverwriteRefusedError,
} from '../writer';
import type { AuthoredItem } from '../../../scoring/learning-object-catalog-file';

function item(overrides: Partial<AuthoredItem> = {}): AuthoredItem {
  return {
    id: 'pi-eigenvalues-aaaaaaaa',
    concept_id: 'eigenvalues',
    topic: 'linear-algebra',
    difficulty: 0.35,
    question_type: 'mcq',
    marks: 1,
    question_text: 'q',
    options: ['a', 'b', 'c'],
    answer_index: 0,
    correct_answer: 'a',
    solution_steps: ['s'],
    verification_method: 'dual_model_consensus',
    ...overrides,
  };
}

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'practice-item-writer-'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('practiceItemBankPath', () => {
  it('builds <exam>-<topic>.json, matching the shipped naming', () => {
    expect(practiceItemBankPath('gate-ma', 'linear-algebra', tmpDir)).toBe(
      path.join(tmpDir, 'gate-ma-linear-algebra.json'),
    );
  });
});

describe('loadBank', () => {
  it('returns an empty bank when the file does not exist', () => {
    const bank = loadBank(path.join(tmpDir, 'nope.json'));
    expect(bank).toEqual({ version: 1, items: [] });
  });

  it('loads an existing bank, preserving _comment', () => {
    const p = path.join(tmpDir, 'existing.json');
    fs.writeFileSync(p, JSON.stringify({ version: 1, _comment: ['note'], items: [item()] }));
    const bank = loadBank(p);
    expect(bank._comment).toEqual(['note']);
    expect(bank.items.length).toBe(1);
  });
});

describe('mergeItems', () => {
  it('appends a new item alongside existing ones', () => {
    const existing = [item({ id: 'pi-a-11111111' })];
    const incoming = [item({ id: 'pi-b-22222222' })];
    const merged = mergeItems(existing, incoming);
    expect(merged.map((i) => i.id)).toEqual(['pi-a-11111111', 'pi-b-22222222']);
  });

  it('an incoming item with the SAME id replaces the existing one when unverified (idempotent re-run)', () => {
    const existing = [item({ id: 'pi-a-11111111', question_text: 'old', verification_method: undefined })];
    const incoming = [item({ id: 'pi-a-11111111', question_text: 'new', verification_method: undefined })];
    const merged = mergeItems(existing, incoming);
    expect(merged.length).toBe(1);
    expect(merged[0].question_text).toBe('new');
  });

  it('re-writing a verified item with BYTE-IDENTICAL content stays a no-op (idempotency preserved)', () => {
    const existing = [item({ id: 'pi-a-11111111', verification_method: 'hand-solved+wolfram' })];
    const incoming = [item({ id: 'pi-a-11111111', verification_method: 'hand-solved+wolfram' })];
    const merged = mergeItems(existing, incoming);
    expect(merged.length).toBe(1);
    expect(merged[0]).toEqual(existing[0]);
  });

  it('sorts by id for stable, byte-reproducible ordering', () => {
    const existing = [item({ id: 'pi-z-11111111' })];
    const incoming = [item({ id: 'pi-a-22222222' })];
    const merged = mergeItems(existing, incoming);
    expect(merged.map((i) => i.id)).toEqual(['pi-a-22222222', 'pi-z-11111111']);
  });

  describe('D5 — refuses to clobber a verified item by id', () => {
    it('refuses when the incoming item would overwrite a verified existing item with different content', () => {
      const existing = [
        item({ id: 'la-eig-014', question_text: 'old', verification_method: 'hand-solved+wolfram' }),
      ];
      const incoming = [
        item({ id: 'la-eig-014', question_text: 'new', verification_method: 'dual_model_consensus' }),
      ];
      expect(() => mergeItems(existing, incoming)).toThrow(PracticeItemOverwriteRefusedError);
      expect(() => mergeItems(existing, incoming)).toThrow(
        "refusing to overwrite 'la-eig-014': verification_method='hand-solved+wolfram' — pass --supersede (or supersede: true) to override",
      );
    });

    it('supersede: true permits the overwrite deliberately', () => {
      const existing = [
        item({ id: 'la-eig-014', question_text: 'old', verification_method: 'hand-solved+wolfram' }),
      ];
      const incoming = [
        item({ id: 'la-eig-014', question_text: 'new', verification_method: 'dual_model_consensus' }),
      ];
      const merged = mergeItems(existing, incoming, { supersede: true });
      expect(merged.length).toBe(1);
      expect(merged[0].question_text).toBe('new');
      expect(merged[0].verification_method).toBe('dual_model_consensus');
    });

    it('a new id merges in normally even when the bank holds verified items (unaffected)', () => {
      const existing = [
        item({ id: 'la-eig-014', verification_method: 'hand-solved+wolfram' }),
      ];
      const incoming = [item({ id: 'pi-new-22222222', verification_method: 'dual_model_consensus' })];
      const merged = mergeItems(existing, incoming);
      expect(merged.map((i) => i.id)).toEqual(['la-eig-014', 'pi-new-22222222']);
    });
  });
});

describe('writePracticeItemBank', () => {
  it('creates a new bank file with the {version, items} shape', () => {
    const p = path.join(tmpDir, 'gate-ma-linear-algebra.json');
    writePracticeItemBank(p, [item()]);
    const onDisk = JSON.parse(fs.readFileSync(p, 'utf-8'));
    expect(onDisk.version).toBe(1);
    expect(onDisk.items).toHaveLength(1);
    expect(onDisk.items[0].id).toBe('pi-eigenvalues-aaaaaaaa');
  });

  it('is idempotent: writing the same item twice produces byte-identical output', () => {
    const p = path.join(tmpDir, 'gate-ma-linear-algebra.json');
    writePracticeItemBank(p, [item()]);
    const first = fs.readFileSync(p, 'utf-8');
    writePracticeItemBank(p, [item()]);
    const second = fs.readFileSync(p, 'utf-8');
    expect(second).toBe(first);
  });

  it('merges into an existing bank without disturbing unrelated items', () => {
    const p = path.join(tmpDir, 'gate-ma-linear-algebra.json');
    writePracticeItemBank(p, [item({ id: 'pi-existing-11111111' })]);
    writePracticeItemBank(p, [item({ id: 'pi-new-22222222' })]);
    const onDisk = JSON.parse(fs.readFileSync(p, 'utf-8'));
    expect(onDisk.items.map((i: AuthoredItem) => i.id).sort()).toEqual([
      'pi-existing-11111111',
      'pi-new-22222222',
    ]);
  });

  it('D5: refuses to overwrite a verified item on disk and leaves the file untouched', () => {
    const p = path.join(tmpDir, 'gate-ma-linear-algebra.json');
    writePracticeItemBank(p, [item({ id: 'la-eig-014', question_text: 'old', verification_method: 'hand-solved+wolfram' })]);
    const before = fs.readFileSync(p, 'utf-8');
    expect(() =>
      writePracticeItemBank(p, [item({ id: 'la-eig-014', question_text: 'new', verification_method: 'dual_model_consensus' })]),
    ).toThrow("refusing to overwrite 'la-eig-014': verification_method='hand-solved+wolfram'");
    expect(fs.readFileSync(p, 'utf-8')).toBe(before);
  });

  it('D5: writes through when supersede: true is passed', () => {
    const p = path.join(tmpDir, 'gate-ma-linear-algebra.json');
    writePracticeItemBank(p, [item({ id: 'la-eig-014', question_text: 'old', verification_method: 'hand-solved+wolfram' })]);
    writePracticeItemBank(
      p,
      [item({ id: 'la-eig-014', question_text: 'new', verification_method: 'dual_model_consensus' })],
      undefined,
      { supersede: true },
    );
    const onDisk = JSON.parse(fs.readFileSync(p, 'utf-8'));
    expect(onDisk.items[0].question_text).toBe('new');
  });

  it('preserves an existing _comment when none is supplied', () => {
    const p = path.join(tmpDir, 'gate-ma-linear-algebra.json');
    fs.writeFileSync(p, JSON.stringify({ version: 1, _comment: ['keep me'], items: [] }));
    writePracticeItemBank(p, [item()]);
    const onDisk = JSON.parse(fs.readFileSync(p, 'utf-8'));
    expect(onDisk._comment).toEqual(['keep me']);
  });

  it('creates the parent directory if missing', () => {
    const p = path.join(tmpDir, 'nested', 'dir', 'gate-ma-linear-algebra.json');
    writePracticeItemBank(p, [item()]);
    expect(fs.existsSync(p)).toBe(true);
  });
});
