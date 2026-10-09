/**
 * The paper-citation rule, driven over the shared fixture table.
 *
 * `fixtures/pyq-provenance-cases.json` is read by BOTH this file and
 * `frontend/src/lib/pyq-provenance.test.ts`, which drives the hand-synced
 * client mirror over the identical cases. A change to one implementation
 * that is not made to the other fails on whichever side was missed — which
 * is the only reason a mirror is acceptable here at all.
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import {
  canCiteExamPaper,
  examCitation,
  provenanceLabel,
  checkPyqProvenance,
  CITING_EVIDENCE_LEVELS,
  UNCITED_PYQ_LABEL,
} from '../pyq-provenance';

interface Case {
  name: string;
  row: Record<string, unknown>;
  citable: boolean;
  label: string;
}

const CASES: Case[] = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'fixtures/pyq-provenance-cases.json'), 'utf-8'),
).cases;

describe('pyq provenance — shared fixture table', () => {
  it('has cases on both sides of the rule, so a one-sided bug cannot pass', () => {
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
});

describe('canCiteExamPaper', () => {
  it('refuses null and undefined rather than throwing', () => {
    expect(canCiteExamPaper(null)).toBe(false);
    expect(canCiteExamPaper(undefined)).toBe(false);
    expect(provenanceLabel(null)).toBe(UNCITED_PYQ_LABEL);
  });

  it('licenses exactly the two reviewed levels and no others', () => {
    expect([...CITING_EVIDENCE_LEVELS]).toEqual(['official', 'directly_reviewed']);
    for (const level of ['official', 'directly_reviewed']) {
      expect(canCiteExamPaper({ evidence_level: level, source_locator: { paper: 'GATE ME 2023' } })).toBe(true);
    }
    for (const level of ['pattern_supported', 'design_hypothesis']) {
      expect(canCiteExamPaper({ evidence_level: level, source_locator: { paper: 'GATE ME 2023' } })).toBe(false);
    }
  });
});

describe('checkPyqProvenance', () => {
  it('requires evidence_level on every row', () => {
    const problems = checkPyqProvenance({});
    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain('evidence_level is required');
  });

  it('names the allowed values when the level is unknown', () => {
    const problems = checkPyqProvenance({ evidence_level: 'reviewed_ish' });
    expect(problems[0]).toContain("'reviewed_ish' is not one of");
    expect(problems[0]).toContain('design_hypothesis');
  });

  it('refuses a citing level with no paper — the 114-row defect, as a gate', () => {
    const problems = checkPyqProvenance({ evidence_level: 'official', year: 2024 });
    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain('source_locator.paper is missing');
  });

  it('accepts a citing level once the paper is recorded', () => {
    expect(checkPyqProvenance({
      evidence_level: 'directly_reviewed',
      source_locator: { paper: 'JEE Main 2024 Session 1', question_id: '22' },
    })).toEqual([]);
  });

  it('accepts an authored row with a year, because the year is never rendered', () => {
    expect(checkPyqProvenance({ evidence_level: 'design_hypothesis', year: 2019 })).toEqual([]);
    expect(canCiteExamPaper({ evidence_level: 'design_hypothesis', year: 2019 })).toBe(false);
  });
});
