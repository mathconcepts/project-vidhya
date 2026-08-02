/**
 * Tests for exam-loader.ts's stub-exam rule (CEO plan §6 baseline): a
 * concept_id is either a real concept-graph node, a declared stub, or a
 * hard validation failure — never a warning that scrolls by.
 */

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

  it('jee-main.yml declares all 64 of its concept_ids as stubs (Phase-1 stub exam)', () => {
    const exam = loadAllExams(true).get('jee-main')!;
    expect(exam.stub_concept_ids.length).toBe(64);
    expect(exam.stub_concept_ids).toContain('kinematics-1d');
  });

  it('jee-main syllabus sections carry stub_concept_ids for every concept_id (none are real nodes yet)', () => {
    const exam = loadAllExams(true).get('jee-main')!;
    for (const section of exam.syllabus) {
      expect(section.stub_concept_ids?.length).toBe(section.concept_ids.length);
    }
  });

  it('gate-ma syllabus sections have no stub_concept_ids (all real nodes)', () => {
    const exam = loadAllExams(true).get('gate-ma')!;
    for (const section of exam.syllabus) {
      expect(section.stub_concept_ids).toBeUndefined();
    }
  });
});
