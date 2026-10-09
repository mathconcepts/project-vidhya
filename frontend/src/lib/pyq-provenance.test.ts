/**
 * The client mirror, driven over the SAME fixture table the backend test
 * uses (src/content/__tests__/fixtures/pyq-provenance-cases.json).
 *
 * Read with node:fs rather than imported: the file lives outside the
 * frontend package, and the whole point is that both sides consume one
 * table rather than two copies of a case list that could drift apart
 * exactly like the two implementations could.
 */

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { canCiteExamPaper, examCitation, provenanceLabel, UNCITED_PYQ_LABEL } from './pyq-provenance';

interface Case {
  name: string;
  row: Record<string, unknown>;
  citable: boolean;
  label: string;
}

const here = path.dirname(fileURLToPath(import.meta.url));
const FIXTURE = path.resolve(here, '../../../src/content/__tests__/fixtures/pyq-provenance-cases.json');
const CASES: Case[] = JSON.parse(fs.readFileSync(FIXTURE, 'utf-8')).cases;

describe('pyq provenance (frontend mirror) — shared fixture table', () => {
  it('reads the same table the backend test drives', () => {
    expect(CASES.length).toBeGreaterThanOrEqual(12);
    expect(CASES.some(c => c.citable)).toBe(true);
    expect(CASES.some(c => !c.citable)).toBe(true);
  });

  for (const c of CASES) {
    it(c.name, () => {
      expect(canCiteExamPaper(c.row)).toBe(c.citable);
      expect(provenanceLabel(c.row)).toBe(c.label);
      expect(examCitation(c.row)).toBe(c.citable ? c.label : null);
    });
  }

  it('mirrors the backend fallback label verbatim', () => {
    expect(UNCITED_PYQ_LABEL).toBe('Exam-pattern practice');
  });

  it('refuses null and undefined rather than throwing', () => {
    expect(canCiteExamPaper(null)).toBe(false);
    expect(provenanceLabel(undefined)).toBe(UNCITED_PYQ_LABEL);
  });
});
