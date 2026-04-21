// @ts-nocheck
/**
 * After-Each-Attempt Insight Engine
 *
 * The core mechanism powering the "get better on every attempt" moat.
 *
 * Every time a student completes an interaction that GBrain can evaluate
 * — answering a micro-exercise, completing a problem, finishing a lesson
 * — this engine produces:
 *
 *   1. What changed in the student's model
 *   2. What was learned (even from a wrong answer)
 *   3. The most valuable next step
 *   4. A confidence-building reinforcement or a gentle correction
 *
 * Pure functions. Reads from student-model + concept-graph. No writes
 * — the caller is responsible for persisting attempt data separately.
 *
 * This is what makes Vidhya different from a chatbot: after every
 * interaction, the student is told WHY they're closer to mastering
 * something, WHAT they're uncovered about their own thinking, and WHAT
 * the most valuable next 90 seconds are.
 *
 * Design principles (from USER-JOURNEY.md):
 *   - Celebrate specific wins, not streaks
 *   - Permission-based next-step suggestions
 *   - Minimum effort, maximum competency
 */

import { CONCEPT_MAP } from '../constants/concept-graph';
import type { StudentModel, MasteryEntry } from './student-model';

// ============================================================================
// Shape of the insight returned to the UI after every attempt
// ============================================================================

export interface AttemptInsight {
  /** The attempt verdict itself — for display */
  verdict: {
    correct: boolean;
    concept_id: string;
    concept_label: string;
    difficulty?: 'easy' | 'medium' | 'hard';
  };

  /** Mastery change on this concept — the tangible progress signal */
  mastery_delta: {
    before: number;
    after: number;
    /** Human-readable: +6% from this problem, e.g. */
    delta_pct: number;
    /** Total attempts on this concept now */
    attempts: number;
  };

  /**
   * THE INSIGHT — the single most valuable thing the student learned
   * from this attempt. Framed positively even for wrong answers.
   */
  insight: {
    headline: string;
    explanation: string;
    tone: 'celebration' | 'encouragement' | 'reinforcement' | 'correction';
  };

  /** Next-step suggestion — permission-based, dismissible */
  next_step: {
    kind: 'practice_same' | 'try_harder' | 'review_prereq' | 'move_on' | 'take_break';
    label: string;
    reason: string;
    concept_id?: string;
    /** URL to navigate to if accepted */
    href?: string;
  } | null;

  /**
   * Personalized reinforcement — a one-line "why you're doing well"
   * based on streak or pattern detection. Not shown every time — only
   * when there's something specific to celebrate.
   */
  reinforcement?: {
    kind: 'streak' | 'pattern_recognized' | 'difficulty_progression' | 'mastery_milestone';
    message: string;
  };

  /**
   * Gap-to-mastery signal — how close is this concept to "mastered"
   * (score >= 0.8). Provides a progress bar UI can render.
   */
  gap_to_mastery: {
    current: number;
    target: 0.8;
    /** Rough estimate of correct attempts needed to reach 0.8 */
    estimated_attempts_remaining: number;
  };
}

// ============================================================================
// Core: compute the insight
// ============================================================================

export interface AttemptContext {
  concept_id: string;
  correct: boolean;
  difficulty?: 'easy' | 'medium' | 'hard';
  time_ms?: number;
  error_type?: string;
  /** Model BEFORE the attempt was recorded */
  model_before: StudentModel | null;
  /** Model AFTER the attempt was recorded (caller persists first) */
  model_after: StudentModel | null;
  /** Recent attempt history for streak detection — newest last */
  recent_attempts?: Array<{
    concept_id: string;
    correct: boolean;
    at: string;
    difficulty?: string;
  }>;
}

export function computeInsight(ctx: AttemptContext): AttemptInsight {
  const conceptMeta = CONCEPT_MAP.get(ctx.concept_id);
  const conceptLabel = conceptMeta?.label || ctx.concept_id.replace(/-/g, ' ');

  const before = ctx.model_before?.mastery_vector[ctx.concept_id];
  const after = ctx.model_after?.mastery_vector[ctx.concept_id];

  const beforeScore = before?.score ?? 0;
  const afterScore = after?.score ?? (ctx.correct ? 0.1 : 0);
  const attempts = after?.attempts ?? 1;

  // Mastery delta
  const mastery_delta = {
    before: beforeScore,
    after: afterScore,
    delta_pct: Math.round((afterScore - beforeScore) * 100),
    attempts,
  };

  // Gap to mastery
  const gap = Math.max(0, 0.8 - afterScore);
  // Empirical: each correct attempt of medium difficulty raises score by ~0.04-0.08
  const perAttemptGain = 0.06;
  const estimated_attempts_remaining = gap > 0 ? Math.ceil(gap / perAttemptGain) : 0;

  // THE INSIGHT — framed based on outcome + context
  const insight = buildInsight({
    correct: ctx.correct,
    concept_label: conceptLabel,
    before_score: beforeScore,
    after_score: afterScore,
    attempts,
    error_type: ctx.error_type,
    difficulty: ctx.difficulty,
    recent_attempts: ctx.recent_attempts || [],
  });

  // Reinforcement — only when pattern detected
  const reinforcement = detectReinforcement({
    recent_attempts: ctx.recent_attempts || [],
    concept_id: ctx.concept_id,
    after_score: afterScore,
    before_score: beforeScore,
  });

  // Next step — single recommendation
  const next_step = suggestNextStep({
    correct: ctx.correct,
    concept_id: ctx.concept_id,
    after_score: afterScore,
    attempts,
    difficulty: ctx.difficulty,
    error_type: ctx.error_type,
    model: ctx.model_after,
  });

  return {
    verdict: {
      correct: ctx.correct,
      concept_id: ctx.concept_id,
      concept_label: conceptLabel,
      difficulty: ctx.difficulty,
    },
    mastery_delta,
    insight,
    next_step,
    reinforcement,
    gap_to_mastery: {
      current: afterScore,
      target: 0.8,
      estimated_attempts_remaining,
    },
  };
}

// ============================================================================
// Insight builder — the "why this attempt mattered" narrative
// ============================================================================

function buildInsight(p: {
  correct: boolean;
  concept_label: string;
  before_score: number;
  after_score: number;
  attempts: number;
  error_type?: string;
  difficulty?: string;
  recent_attempts: Array<{ concept_id: string; correct: boolean }>;
}): AttemptInsight['insight'] {
  // Correct answer paths
  if (p.correct) {
    // First time ever on this concept
    if (p.attempts === 1) {
      return {
        headline: 'You got it on your first try.',
        explanation: `First attempt on ${p.concept_label} — and you nailed it. The method you used is now in your toolkit.`,
        tone: 'celebration',
      };
    }

    // Returning success after previous errors
    const sameConceptRecent = p.recent_attempts.filter(a => !a.correct).length;
    if (sameConceptRecent > 0 && p.after_score > p.before_score) {
      return {
        headline: 'The earlier struggle paid off.',
        explanation: `You got this after working through ${sameConceptRecent} harder attempt${sameConceptRecent > 1 ? 's' : ''}. The friction is what made the learning stick.`,
        tone: 'celebration',
      };
    }

    // Milestone: crossing mastery threshold
    if (p.before_score < 0.8 && p.after_score >= 0.8) {
      return {
        headline: `You've mastered ${p.concept_label}.`,
        explanation: 'This concept is now firmly yours. Time to build on it with related topics.',
        tone: 'celebration',
      };
    }

    // High-difficulty success
    if (p.difficulty === 'hard') {
      return {
        headline: 'That was a hard problem.',
        explanation: `Solving a hard ${p.concept_label} problem is worth several easier ones. Your model of this concept just got significantly stronger.`,
        tone: 'celebration',
      };
    }

    // Steady progress
    return {
      headline: 'Another layer of mastery.',
      explanation: `Each correct attempt reinforces the neural pathway. You're now at ${Math.round(p.after_score * 100)}% mastery on ${p.concept_label}.`,
      tone: 'reinforcement',
    };
  }

  // Wrong answer paths — ALWAYS framed as learning
  if (p.error_type) {
    const errorExplanations: Record<string, string> = {
      conceptual:
        `Your answer reveals a specific gap in how you're thinking about ${p.concept_label}. This is exactly what we can fix.`,
      procedural:
        `The method is right; a step was off. These are the easiest errors to eliminate — one more attempt usually does it.`,
      computational:
        `The approach was correct; the arithmetic slipped. Slow down on the next one and watch for the sign or decimal.`,
      notation:
        `You understand the idea; the notation convention tripped you up. These get faster with exposure.`,
      application:
        `You know the rule; identifying when to apply it is the hard part. Pattern recognition comes from seeing more cases.`,
    };
    const explanation = errorExplanations[p.error_type] ||
      `This attempt surfaced a specific misconception about ${p.concept_label}. Knowing exactly what's off is the hard part — and you now have that.`;

    return {
      headline: 'This wrong answer just made you sharper.',
      explanation,
      tone: 'encouragement',
    };
  }

  // Generic wrong-answer framing — still productive
  if (p.attempts === 1) {
    return {
      headline: 'First attempt — valuable data.',
      explanation: `You've now seen one flavor of ${p.concept_label}. The next attempt will be informed by this one. That's how learning compounds.`,
      tone: 'encouragement',
    };
  }

  return {
    headline: 'Closer than last time.',
    explanation: `Even without a correct answer, the act of attempting is building your cognitive map of ${p.concept_label}. Keep going.`,
    tone: 'encouragement',
  };
}

// ============================================================================
// Reinforcement detector — celebrate patterns, not streaks
// ============================================================================

function detectReinforcement(p: {
  recent_attempts: Array<{ concept_id: string; correct: boolean }>;
  concept_id: string;
  after_score: number;
  before_score: number;
}): AttemptInsight['reinforcement'] | undefined {
  // Mastery threshold crossed
  if (p.before_score < 0.8 && p.after_score >= 0.8) {
    return {
      kind: 'mastery_milestone',
      message: `Mastery milestone reached.`,
    };
  }

  // 3+ consecutive correct on same concept
  const lastThree = p.recent_attempts.slice(-3);
  if (lastThree.length >= 3 && lastThree.every(a => a.concept_id === p.concept_id && a.correct)) {
    return {
      kind: 'streak',
      message: `Three in a row — this concept is clicking.`,
    };
  }

  // Diverse success — answered correctly across 3+ different concepts recently
  const recentCorrect = p.recent_attempts.filter(a => a.correct);
  const uniqueConcepts = new Set(recentCorrect.map(a => a.concept_id));
  if (uniqueConcepts.size >= 3 && recentCorrect.length >= 3) {
    return {
      kind: 'pattern_recognized',
      message: `You're connecting ideas across ${uniqueConcepts.size} concepts — that's how deep learning happens.`,
    };
  }

  return undefined;
}

// ============================================================================
// Next-step suggester — one recommendation, permission-based
// ============================================================================

function suggestNextStep(p: {
  correct: boolean;
  concept_id: string;
  after_score: number;
  attempts: number;
  difficulty?: string;
  error_type?: string;
  model: StudentModel | null;
}): AttemptInsight['next_step'] {
  const conceptLabel = CONCEPT_MAP.get(p.concept_id)?.label || p.concept_id;

  // Mastered — push to related
  if (p.after_score >= 0.8 && p.correct) {
    const related = findRelatedConcept(p.concept_id, p.model);
    if (related) {
      return {
        kind: 'move_on',
        label: `Try ${CONCEPT_MAP.get(related)?.label || related}`,
        reason: `You've got ${conceptLabel}. This is the natural next step.`,
        concept_id: related,
        href: `/lesson/${related}`,
      };
    }
  }

  // Correct but not mastered — practice more
  if (p.correct && p.after_score < 0.8 && p.after_score >= 0.5) {
    return {
      kind: p.difficulty === 'hard' ? 'practice_same' : 'try_harder',
      label: p.difficulty === 'hard' ? 'Try one more hard one' : 'Level up difficulty',
      reason: 'You\'ve got the method — time to test it against harder problems.',
      concept_id: p.concept_id,
      href: `/smart-practice?concept=${p.concept_id}`,
    };
  }

  // Wrong answer with clear prereq issue
  if (!p.correct && p.error_type === 'conceptual' && p.model) {
    const prereq = findWeakestPrereq(p.concept_id, p.model);
    if (prereq) {
      return {
        kind: 'review_prereq',
        label: `Review ${CONCEPT_MAP.get(prereq)?.label || prereq} first`,
        reason: 'This concept is often a prerequisite issue — strengthening it usually fixes the misconception upstream.',
        concept_id: prereq,
        href: `/lesson/${prereq}`,
      };
    }
  }

  // Wrong answer, just try again
  if (!p.correct && p.attempts < 5) {
    return {
      kind: 'practice_same',
      label: 'One more attempt',
      reason: 'Errors teach fastest when the correction is immediate. Another one reinforces what you just learned.',
      concept_id: p.concept_id,
      href: `/smart-practice?concept=${p.concept_id}`,
    };
  }

  // Too many attempts in a row — suggest break
  if (p.attempts >= 5 && !p.correct) {
    return {
      kind: 'take_break',
      label: 'Step away for 10 minutes',
      reason: 'Mental fatigue is real. Memory consolidates during breaks — come back sharper.',
    };
  }

  // Default: more practice
  return {
    kind: 'practice_same',
    label: 'Another problem on this concept',
    reason: `Reinforce the pattern. You're ${Math.round((0.8 - p.after_score) / 0.06)} attempts from mastery.`,
    concept_id: p.concept_id,
    href: `/smart-practice?concept=${p.concept_id}`,
  };
}

// ============================================================================
// Helpers — concept navigation
// ============================================================================

function findRelatedConcept(concept_id: string, model: StudentModel | null): string | null {
  const meta = CONCEPT_MAP.get(concept_id);
  if (!meta) return null;

  // Look at successors (what this unlocks)
  const successors = (meta as any).successors || [];
  for (const s of successors) {
    const score = model?.mastery_vector[s]?.score ?? 0;
    if (score < 0.5) return s; // pick one not yet mastered
  }
  return null;
}

function findWeakestPrereq(concept_id: string, model: StudentModel | null): string | null {
  const meta = CONCEPT_MAP.get(concept_id);
  if (!meta || !model) return null;
  const prereqs = (meta as any).prerequisites || [];
  let weakest: string | null = null;
  let weakestScore = 1;
  for (const p of prereqs) {
    const score = model.mastery_vector[p]?.score ?? 0;
    if (score < weakestScore) {
      weakest = p;
      weakestScore = score;
    }
  }
  return weakestScore < 0.7 ? weakest : null;
}
