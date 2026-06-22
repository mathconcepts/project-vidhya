/**
 * src/readiness/syllabus-context.ts — Wave 5 pure helpers.
 *
 * Encodes the "where in your prep are you?" reasoning the engine
 * needs to vary action selection by syllabus position. Per the CEO
 * audit (Dimension 3): a student 10% into the syllabus 3 months from
 * the exam needs Acquisition; a student 90% in 2 weeks out needs
 * Extraction. The engine's arm weights should shift accordingly.
 *
 * All pure functions over the inputs the StudentModel + CurriculumRepo
 * already expose. No new persistence. No clock other than `now`.
 */

import type { CurriculumRepo, ConceptId, MasteryState, StudentId, StudentModel } from '../core/interfaces';

// ────────────────────────────────────────────────────────────────────
// Phase model — coarse, intentionally only 4 phases.
//
// EARLY:        weeks_to_exam > 8, coverage < 60%       → favor Teach
// MID:          4 < weeks_to_exam <= 8                  → balanced
// CRUNCH:       1 < weeks_to_exam <= 4                  → favor Practice + Retain
// FINAL_WEEK:   weeks_to_exam <= 1                      → Retain-heavy + mocks
//
// "Coverage" pulls EARLY forward — a student 80% covered 10 weeks out
// is already in MID territory because they've earned it.
// ────────────────────────────────────────────────────────────────────

export type PrepPhase = 'early' | 'mid' | 'crunch' | 'final-week';

export interface PhaseInputs {
  weeksToExam: number;
  pctSyllabusCovered: number;     // 0..1
}

export function inferPhase({ weeksToExam, pctSyllabusCovered }: PhaseInputs): PrepPhase {
  if (weeksToExam <= 1) return 'final-week';
  if (weeksToExam <= 4) return 'crunch';
  if (weeksToExam <= 8) return 'mid';
  // > 8 weeks out: a well-prepared student is still mid (don't punish them).
  if (pctSyllabusCovered >= 0.6) return 'mid';
  return 'early';
}

/**
 * Days-to-exam → weeks. Rounds up so "8 days out" reads as 2 weeks (not 1).
 */
export function weeksToExam(examDate: Date | null | undefined, now: Date = new Date()): number {
  if (!examDate) return 999;            // no exam date → treat as far future
  const days = (examDate.getTime() - now.getTime()) / 86_400_000;
  if (days <= 0) return 0;
  return Math.ceil(days / 7);
}

// ────────────────────────────────────────────────────────────────────
// Coverage — fraction of skills in `mastered` state out of all skills.
//
// We treat `practicing` as half-credit toward coverage so a student who
// has touched everything but mastered nothing isn't classed as 0%.
// ────────────────────────────────────────────────────────────────────

export interface CoverageInputs {
  states: ReadonlyMap<ConceptId, MasteryState>;
}

export function pctSyllabusCovered({ states }: CoverageInputs): number {
  if (states.size === 0) return 0;
  let credit = 0;
  for (const s of states.values()) {
    if (s === 'mastered') credit += 1;
    else if (s === 'practicing') credit += 0.5;
    else if (s === 'at-risk') credit += 0.3;
  }
  return Math.min(1, credit / states.size);
}

// ────────────────────────────────────────────────────────────────────
// Arm-weight shifts. The DefaultReadinessEngine's candidate weights
// (retain ~1.0+, practice 1.0, teach 0.8, diagnose 0.3) are the baseline.
// Multipliers per phase tilt the loop toward what matters.
// ────────────────────────────────────────────────────────────────────

export interface ArmWeights {
  retain: number;
  practice: number;
  teach: number;
  diagnose: number;
}

export function armWeightsForPhase(phase: PrepPhase): ArmWeights {
  switch (phase) {
    case 'early':       return { retain: 0.8, practice: 1.0, teach: 1.4, diagnose: 1.0 };
    case 'mid':         return { retain: 1.0, practice: 1.1, teach: 1.0, diagnose: 0.8 };
    case 'crunch':      return { retain: 1.2, practice: 1.3, teach: 0.7, diagnose: 0.5 };
    case 'final-week':  return { retain: 1.5, practice: 1.2, teach: 0.4, diagnose: 0.3 };
  }
}

// ────────────────────────────────────────────────────────────────────
// Prereq-aware allowed-nodes filter.
//
// A node is "ready to teach" only when all its prereqs are at least in
// the `practicing` state. The CEO audit's concrete example: a student
// 30% through the syllabus shouldn't see Calc 2 if Calc 1 isn't there.
// ────────────────────────────────────────────────────────────────────

export async function eligibleNodes(
  candidates: ReadonlyArray<ConceptId>,
  studentId: StudentId,
  deps: { curriculum: CurriculumRepo; studentModel: Pick<StudentModel, 'masteryState'> },
): Promise<ConceptId[]> {
  const result: ConceptId[] = [];
  for (const id of candidates) {
    const node = await deps.curriculum.getNode(id);
    if (!node) continue;
    const prereqs = node.prereqs;
    if (prereqs.length === 0) {
      result.push(id);
      continue;
    }
    let allOk = true;
    for (const p of prereqs) {
      const state = await deps.studentModel.masteryState(studentId, p);
      // 'practicing' / 'mastered' / 'at-risk' all unblock; 'not-started' / 'learning' block.
      if (state === 'not-started' || state === 'learning') {
        allOk = false;
        break;
      }
    }
    if (allOk) result.push(id);
  }
  return result;
}
