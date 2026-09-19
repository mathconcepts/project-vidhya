/**
 * Tests for exam-loader.ts's stub-exam rule (CEO plan §6 baseline): a
 * concept_id is either a real concept-graph node, a declared stub, or a
 * hard validation failure — never a warning that scrolls by.
 */

import { CONCEPT_MAP } from '../../constants/concept-graph';
import { describe, it, expect } from 'vitest';
import { checkConceptId, loadAllExams } from '../exam-loader';

describe('checkConceptId — the stub-exam rule', () => {
  const known = new Set(['real-concept']);
  const stubs = new Set(['declared-stub']);

  it('passes silently for a known concept-graph node', () => {
    expect(() => checkConceptId('real-concept', 'test', known, stubs)).not.toThrow();
  });

  it('passes silently for a declared stub', () => {
    expect(() => checkConceptId('declared-stub', 'test', known, stubs)).not.toThrow();
  });

  it('throws for a concept_id that is neither known nor declared — no silent drop', () => {
    expect(() => checkConceptId('mystery-concept', 'syllabus[0]', known, stubs)).toThrow(
      /mystery-concept.*neither a known concept-graph node nor declared/s,
    );
  });

  it('the throw message names the offending path, for a debuggable error', () => {
    expect(() => checkConceptId('bogus', 'syllabus[3].concept_ids', known, stubs)).toThrow(
      /syllabus\[3\]\.concept_ids/,
    );
  });
});

describe('exam-loader stub-exam rule — real tracked files (gate-ma.yml, jee-main.yml)', () => {
  it('both load successfully (every concept_id is real or a declared stub)', () => {
    const exams = loadAllExams(true);
    expect(exams.has('gate-ma')).toBe(true);
    expect(exams.has('jee-main')).toBe(true);
  });

  it('gate-ma.yml has zero declared stubs — every concept_id it references is a real node', () => {
    const exam = loadAllExams(true).get('gate-ma')!;
    expect(exam.stub_concept_ids).toEqual([]);
  });

  it('jee-main.yml still stubs the 41 concept_ids it has not migrated', () => {
    // Was `toBe(64)` when jee-main was a fully Phase-1 stub exam. Its 23
    // Mathematics ids are real concept-graph nodes now; Physics and
    // Chemistry are not. A number is pinned rather than left loose so that
    // migrating the next subject is a deliberate edit here too.
    const exam = loadAllExams(true).get('jee-main')!;
    expect(exam.stub_concept_ids.length).toBe(41);
    expect(exam.stub_concept_ids).toContain('kinematics-1d');
    // A migrated id must be GONE from the stub list, not left in both
    // places — exam-loader would accept it either way, and a stale stub
    // entry is how a real node silently keeps reading as unresolved.
    expect(exam.stub_concept_ids).not.toContain('three-d-geometry');
  });

  it('every jee-main concept_id is EITHER a real node OR a declared stub', () => {
    // This is the actual rule the two tests here used to stand in for, and
    // unlike a stub count it holds at every point of a part-finished
    // migration. exam-loader.loadOne refuses a concept_id that is neither,
    // so a violation is a hard load failure rather than a warning.
    const exam = loadAllExams(true).get('jee-main')!;
    const stubs = new Set(exam.stub_concept_ids);
    for (const section of exam.syllabus) {
      for (const cid of section.concept_ids) {
        const real = CONCEPT_MAP.has(cid);
        expect(real || stubs.has(cid), `${cid}: neither a real node nor a declared stub`).toBe(true);
        expect(real && stubs.has(cid), `${cid}: declared BOTH real and stub`).toBe(false);
      }
    }
  });

  it('the migrated half is exactly the Mathematics section', () => {
    const exam = loadAllExams(true).get('jee-main')!;
    for (const section of exam.syllabus) {
      const realCount = section.concept_ids.filter((c) => CONCEPT_MAP.has(c)).length;
      if (section.id === 'jee-main-mathematics') {
        expect(realCount).toBe(section.concept_ids.length);
      } else {
        expect(realCount, section.id).toBe(0);
      }
    }
  });

  it('gate-ma syllabus sections have no stub_concept_ids (all real nodes)', () => {
    const exam = loadAllExams(true).get('gate-ma')!;
    for (const section of exam.syllabus) {
      expect(section.stub_concept_ids).toBeUndefined();
    }
  });
});
