/**
 * The gate, the signal derivation, and the fact that "off" is the default.
 *
 * Nothing here needs a database on purpose: `getExperiment` returns null
 * without `DATABASE_URL`, which is itself one of the behaviours worth
 * pinning — a deployment nobody enrolled must be off without anyone having
 * remembered to turn it off.
 */

import { describe, it, expect } from 'vitest';
import {
  composeFrameForLesson,
  explanationFrameExperimentId,
  isFrameTreatment,
  shakyPrerequisites,
  signalsForLesson,
  WEAK_PREREQUISITE_MASTERY,
} from '../wire';
import { bucketFor } from '../../../personalization/ab';
import { getPrerequisites } from '../../../constants/concept-graph';

// Resolved from the real hash rather than hardcoded, so a change to the
// bucketing function makes these tests wrong loudly instead of quietly.
const EXP_ID = explanationFrameExperimentId('gate-ma');
const TREATMENT_SESSION = ['sess-a', 'sess-b', 'sess-d'].find(s => bucketFor(EXP_ID, s) === 'treatment')!;
const CONTROL_SESSION = ['sess-c', 'sess-f'].find(s => bucketFor(EXP_ID, s) === 'control')!;

describe('explanationFrameExperimentId', () => {
  it('carries the version and the exam pack', () => {
    expect(explanationFrameExperimentId('gate-ma')).toBe('explanation_frame_v1_gate-ma');
    expect(explanationFrameExperimentId('jee-main')).toBe('explanation_frame_v1_jee-main');
  });

  it('gives the two exams different ids, so one cannot re-bucket the other', () => {
    expect(explanationFrameExperimentId('gate-ma')).not.toBe(explanationFrameExperimentId('jee-main'));
  });
});

describe('isFrameTreatment — all three conditions are load-bearing', () => {
  it('is off for an anonymous session even when the experiment is active', () => {
    expect(isFrameTreatment(null, 'active', EXP_ID)).toBe(false);
  });

  it('is off with no experiment row, which is what a DB-less deploy looks like', () => {
    expect(isFrameTreatment(TREATMENT_SESSION, null, EXP_ID)).toBe(false);
  });

  it('is off for a row that exists but is not active', () => {
    for (const status of ['won', 'lost', 'inconclusive', 'aborted']) {
      expect(isFrameTreatment(TREATMENT_SESSION, status, EXP_ID)).toBe(false);
    }
  });

  it('is off for a control-bucket session under an active experiment', () => {
    expect(isFrameTreatment(CONTROL_SESSION, 'active', EXP_ID)).toBe(false);
  });

  it('is on only when enrolled, active and in treatment', () => {
    expect(isFrameTreatment(TREATMENT_SESSION, 'active', EXP_ID)).toBe(true);
  });
});

describe('shakyPrerequisites', () => {
  // A real concept with real declared prerequisites, read from the graph.
  const concept = 'diagonalization';
  const prereqs = getPrerequisites(concept).map(p => p.id);

  it('the fixture concept genuinely has prerequisites, so these tests mean something', () => {
    expect(prereqs.length).toBeGreaterThan(0);
  });

  it('is empty with no mastery signal at all', () => {
    expect(shakyPrerequisites(concept, undefined)).toEqual([]);
    expect(shakyPrerequisites(concept, {})).toEqual([]);
  });

  it('names a prerequisite below the threshold', () => {
    const out = shakyPrerequisites(concept, { [prereqs[0]]: 0.1 });
    expect(out).toContain(prereqs[0]);
  });

  it('treats an unmentioned prerequisite as fine rather than as weak', () => {
    // Default 1, not 0: silence about a prerequisite is not evidence of a gap,
    // and reading it as one would surface a bridge for every anonymous visitor.
    expect(shakyPrerequisites(concept, { [concept]: 0.9 })).toEqual([]);
  });

  it('excludes a weak concept that is not a prerequisite of this one', () => {
    const outsider = 'laplace-transform';
    expect(prereqs).not.toContain(outsider);
    expect(shakyPrerequisites(concept, { [outsider]: 0.0 })).not.toContain(outsider);
  });

  it('is exclusive at the threshold — exactly 0.5 is not weak', () => {
    expect(shakyPrerequisites(concept, { [prereqs[0]]: WEAK_PREREQUISITE_MASTERY })).toEqual([]);
    expect(shakyPrerequisites(concept, { [prereqs[0]]: WEAK_PREREQUISITE_MASTERY - 0.01 }))
      .toContain(prereqs[0]);
  });
});

describe('signalsForLesson', () => {
  it('reads this concept\'s mastery, not another concept\'s', () => {
    const s = signalsForLesson({
      concept_id: 'eigenvalues',
      session_id: 'sess-a',
      mastery_by_concept: { eigenvalues: 0.8, determinants: 0.2 },
    });
    expect(s.mastery).toBe(0.8);
  });

  it('passes the served stance straight through rather than deriving a second one', () => {
    expect(signalsForLesson({ concept_id: 'eigenvalues', session_id: 'sess-a', stance: 'shaken' }).stance)
      .toBe('shaken');
  });

  it('yields an all-null signal set for an anonymous first visit', () => {
    const s = signalsForLesson({ concept_id: 'eigenvalues', session_id: null });
    expect(s.mastery).toBeNull();
    expect(s.stance).toBeNull();
    expect(s.track_id).toBeNull();
    expect(s.shaky_prerequisites).toEqual([]);
  });
});

describe('composeFrameForLesson — null is the normal answer', () => {
  it('returns null for an anonymous visitor', async () => {
    await expect(composeFrameForLesson({ concept_id: 'eigenvalues', session_id: null }))
      .resolves.toBeNull();
  });

  it('returns null with no experiments row reachable (the DB-less deploy)', async () => {
    // This suite runs without DATABASE_URL, so getExperiment resolves null.
    await expect(composeFrameForLesson({
      concept_id: 'eigenvalues',
      session_id: TREATMENT_SESSION,
      exam_pack_id: 'gate-ma',
    })).resolves.toBeNull();
  });

  it('returns null rather than throwing for a concept that does not exist', async () => {
    await expect(composeFrameForLesson({
      concept_id: 'no-such-concept-anywhere',
      session_id: TREATMENT_SESSION,
    })).resolves.toBeNull();
  });
});
