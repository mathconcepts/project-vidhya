import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { practiceItemBankPath, loadBank, mergeItems, writePracticeItemBank } from '../writer';
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

  it('an incoming item with the SAME id replaces the existing one (idempotent re-run)', () => {
    const existing = [item({ id: 'pi-a-11111111', question_text: 'old' })];
    const incoming = [item({ id: 'pi-a-11111111', question_text: 'new' })];
    const merged = mergeItems(existing, incoming);
    expect(merged.length).toBe(1);
    expect(merged[0].question_text).toBe('new');
  });

  it('sorts by id for stable, byte-reproducible ordering', () => {
    const existing = [item({ id: 'pi-z-11111111' })];
    const incoming = [item({ id: 'pi-a-22222222' })];
    const merged = mergeItems(existing, incoming);
    expect(merged.map((i) => i.id)).toEqual(['pi-a-22222222', 'pi-z-11111111']);
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
