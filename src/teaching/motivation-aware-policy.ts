/**
 * src/teaching/motivation-aware-policy.ts — Wave 6 TeachingPolicy.
 *
 * Encodes Challenge C1 (right-modality manim) with engagement signal.
 * The CEO audit's Dimension 2: a flagging student and a driven student
 * shouldn't see the same dry worked example. Policy picks among the
 * candidate objects the curriculum repo offers, ranking by modality
 * preference per motivation state.
 *
 * State → modality ranking (highest preference first):
 *
 *   driven       worked_example, practice, manim, interactive, story
 *     Wants efficient progress. Worked examples → solo practice.
 *
 *   steady       worked_example, practice, interactive, manim, story
 *     Same as driven but slightly more receptive to a manim hook.
 *
 *   flagging     story, interactive, manim, worked_example, practice
 *     Engagement is the bottleneck. A story hook restores momentum
 *     before throwing math at them.
 *
 *   frustrated   manim, interactive, worked_example, story, practice
 *     Visual + manipulable beats text. Manim hints at the structure;
 *     interactives let them touch the idea before solving.
 *
 *   anxious      worked_example, interactive, story, manim, practice
 *     Wants a clear path. Worked example shows it; interactive lets
 *     them follow safely; practice is intentionally LAST — too
 *     vulnerable to a wrong-answer spike.
 *
 *   null         worked_example, practice, manim, interactive, story
 *     Cold-start defaults to the "steady" preference — safe baseline.
 *
 * Honest framing: this is heuristic, not learned. A future Phase 4
 * could fit modality preferences per student from interaction logs.
 * For now, mapping the legacy motivation signal to modality
 * preference is the smallest delta that delivers right-modality.
 */

import type {
  CurriculumNode,
  LearningObject,
  ObjectType,
  StudentId,
  TeachingPolicy,
  TeachingPolicyContext,
} from '../core/interfaces';
import type { MotivationSource, MotivationState } from './motivation-source';

// ────────────────────────────────────────────────────────────────────
// Modality preference table — locked here. A/B variants land as new
// policy implementations, never as silent edits to this table.
// ────────────────────────────────────────────────────────────────────

const MODALITY_RANK: Record<MotivationState | 'default', ReadonlyArray<ObjectType>> = {
  driven:      ['worked_example', 'practice', 'manim', 'interactive', 'story'],
  steady:      ['worked_example', 'practice', 'interactive', 'manim', 'story'],
  flagging:    ['story', 'interactive', 'manim', 'worked_example', 'practice'],
  frustrated:  ['manim', 'interactive', 'worked_example', 'story', 'practice'],
  anxious:     ['worked_example', 'interactive', 'story', 'manim', 'practice'],
  default:     ['worked_example', 'practice', 'manim', 'interactive', 'story'],
};

export const ANXIOUS_PRACTICE_DEMOTION = true;

// ────────────────────────────────────────────────────────────────────
// Implementation
// ────────────────────────────────────────────────────────────────────

export interface MotivationAwarePolicyDeps {
  motivation: MotivationSource;
}

export class MotivationAwareTeachingPolicy implements TeachingPolicy {
  constructor(private deps: MotivationAwarePolicyDeps) {}

  async selectObject(
    studentId: StudentId,
    _node: CurriculumNode,
    candidates: LearningObject[],
    ctx: TeachingPolicyContext,
  ): Promise<LearningObject | null> {
    if (candidates.length === 0) return null;

    const motivation = await this.deps.motivation.stateFor(studentId);
    const ranking = MODALITY_RANK[motivation ?? 'default'];

    // Worked-example fading: if the student has already seen one, drop
    // it down the ranking so a different modality gets a chance.
    const effective: ReadonlyArray<ObjectType> = ctx.hasSeenWorkedExample
      ? [...ranking.filter(t => t !== 'worked_example'), 'worked_example']
      : ranking;

    // Time-budget gate: if the budget is tight (≤ 3 min), prefer a
    // light modality. Practice items are usually short; manim videos
    // are usually long. Filter candidates by time fit FIRST, then rank.
    const fits = candidates.filter(c => c.estMinutes <= ctx.timeBudgetMin);
    const pool = fits.length > 0 ? fits : candidates;

    // Pick the highest-ranked modality available; within that modality
    // pick the lowest difficulty (a non-worked_example session is meant
    // to ease back in, not raise the stakes).
    for (const type of effective) {
      const matching = pool.filter(c => c.type === type);
      if (matching.length === 0) continue;
      matching.sort((a, b) => a.difficulty - b.difficulty);
      return matching[0];
    }
    // Fallback: nothing matched the ranking (caller passed exotic
    // types). Return the first candidate that fits the time budget.
    return pool[0];
  }
}

export function makeMotivationAwarePolicy(deps: MotivationAwarePolicyDeps): TeachingPolicy {
  return new MotivationAwareTeachingPolicy(deps);
}
