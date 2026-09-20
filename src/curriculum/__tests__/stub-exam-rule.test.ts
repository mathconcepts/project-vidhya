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

  it('jee-main.yml has zero declared stubs — the migration is finished', () => {
    // Was `toBe(64)` when jee-main was a fully Phase-1 stub exam, then
    // `toBe(41)` once its Mathematics half migrated. Physics and Chemistry
    // have now landed too, so the pack joins gate-ma at zero.
    //
    // The pinned-number discipline that got it here is kept by the test
    // above (gate-ma) and this one: a stub reappearing is a deliberate edit,
    // not a drift. What this specifically catches is a STALE stub entry — a
    // migrated id left in both places. exam-loader accepts either, and a
    // leftover entry is how a real node silently keeps reading as
    // unresolved, which is the failure mode that made the count worth
    // pinning in the first place.
    const exam = loadAllExams(true).get('jee-main')!;
    expect(exam.stub_concept_ids).toEqual([]);
    for (const migrated of ['three-d-geometry', 'kinematics-1d', 'coordination-compounds']) {
      expect(exam.stub_concept_ids).not.toContain(migrated);
      expect(CONCEPT_MAP.has(migrated)).toBe(true);
    }
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

  it('no section is HALF migrated — each is entirely real or entirely stub', () => {
    // Was keyed on the single section id `jee-main-mathematics`. v4.86.0
    // split Mathematics into six sections (sections are what the app renders
    // as topics, and one bucket of 23 concepts is not a topic list), which
    // broke the literal id check while leaving the actual rule untouched.
    //
    // Restated as the property it was always standing in for: migration
    // happens a whole section at a time, so a section with SOME real nodes
    // and SOME stubs means someone migrated half a subject and the topic
    // would render as studiable while parts of it lead nowhere. This holds
    // through any future split or rename.
    //
    // It also holds now that jee-main is fully migrated. The earlier version
    // additionally asserted that BOTH a migrated and a stub section existed,
    // because a pack that was entirely stub would have satisfied the
    // half-migrated rule vacuously. That guard has done its job and is gone:
    // with every section migrated the rule below is non-vacuous on its own,
    // and demanding a stub section would now demand the pack be unfinished.
    const exam = loadAllExams(true).get('jee-main')!;
    let migrated = 0;
    for (const section of exam.syllabus) {
      const real = section.concept_ids.filter((c) => CONCEPT_MAP.has(c)).length;
      const all = section.concept_ids.length;
      expect(all).toBeGreaterThan(0);
      expect(real === 0 || real === all, `${section.id}: ${real}/${all} real — half migrated`).toBe(true);
      if (real === all) migrated++;
    }
    expect(migrated).toBe(exam.syllabus.length);
  });

  it('gate-ma syllabus sections have no stub_concept_ids (all real nodes)', () => {
    const exam = loadAllExams(true).get('gate-ma')!;
    for (const section of exam.syllabus) {
      expect(section.stub_concept_ids).toBeUndefined();
    }
  });
});
