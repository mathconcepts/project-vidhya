// @ts-nocheck
/**
 * Session Planner — pure core.
 *
 * Composes three existing primitives into a single ordered plan:
 *
 *   1. attention/resolver.ts        → budget + strategy from minutes
 *   2. engine/priority-engine.ts    → topic priorities from profile
 *   3. this file                    → intersect strategy × priorities
 *                                      → ordered list of actions
 *
 * The intersection is the interesting part:
 *
 *   strategy.gbrain_max_recommendations  → how many actions total
 *   strategy.gbrain_bias                 → which topics get preference
 *                                           (quick_win vs prerequisite_repair)
 *   strategy.mock_difficulty_mix         → mix of easy/medium/hard
 *   strategy.mock_question_count         → per-action question count
 *   priorities                           → topic ordering
 *
 * This module is PURE. No I/O, no mutation. Tests can pass a fixed
 * `now` and get byte-identical output across runs.
 */

import { budgetFromMinutes, resolveStrategy } from '../attention/resolver';
import { computePriority, MARKS_WEIGHTS, TOPIC_NAMES } from '../engine/priority-engine';
import type { AttentionBudget, AttentionStrategy } from '../attention/types';
import type { StudyProfile, TopicPriority, TopicSRStats } from '../engine/priority-engine';
import type {
  PlanRequest, SessionPlan, ActionRecommendation, ActionKind,
} from './types';

// Inline helper — every admin-orchestrator module has one of these;
// we follow the convention rather than introducing a new shared dep.
function shortId(): string {
  return Math.random().toString(36).substring(2, 10);
}

// ============================================================================
// Core
// ============================================================================

export function planSession(req: PlanRequest): SessionPlan {
  // Normalize inputs ──────────────────────────────────────────────────
  const now = req.now ?? new Date();
  const minutes = clampMinutes(req.minutes_available);

  // Build the budget and strategy ─────────────────────────────────────
  const budget: AttentionBudget = budgetFromMinutes(
    minutes,
    'student_declared',
    req.trailing_7d_minutes,
  );
  const strategy: AttentionStrategy = resolveStrategy(budget);

  // Build a StudyProfile for the priority engine ──────────────────────
  const profile: StudyProfile = {
    exam_date: req.exam_date,
    target_score: null,
    weekly_hours: req.weekly_hours ?? 8,
    topic_confidence: req.topic_confidence ?? {},
    diagnostic_scores: req.diagnostic_scores
      ? [{ scores: req.diagnostic_scores, taken_at: now.toISOString() }]
      : [],
  };
  const srStats: TopicSRStats[] = req.sr_stats ?? [];

  const allPriorities = computePriority(profile, srStats, now);
  // Order by priority score descending; ties broken by marks_weight
  // descending (alphabetical topic as ultimate tiebreaker) for stability.
  const sortedPriorities = allPriorities.slice().sort((a, b) => {
    if (b.priority !== a.priority) return b.priority - a.priority;
    if (b.marks_weight !== a.marks_weight) return b.marks_weight - a.marks_weight;
    return a.topic.localeCompare(b.topic);
  });

  // Compose actions ───────────────────────────────────────────────────
  const actions = composeActions(sortedPriorities, strategy, srStats, now, budget);

  const total_estimated_minutes = actions.reduce((sum, a) => sum + a.estimated_minutes, 0);
  const plan: SessionPlan = {
    id: `PLN-${shortId()}`,
    generated_at: now.toISOString(),
    request: { ...req, now: undefined }, // don't serialize Date into the echo
    budget,
    strategy,
    top_priorities: sortedPriorities.slice(0, 10),
    actions,
    total_estimated_minutes,
    headline: buildHeadline(budget, actions, sortedPriorities),
  };
  return plan;
}

// ============================================================================
// Composition
// ============================================================================

/**
 * Intersect the strategy (how many, what mix) with the priorities
 * (which topics) into a concrete ordered action list, respecting the
 * minutes budget at every step.
 */
function composeActions(
  priorities: TopicPriority[],
  strategy: AttentionStrategy,
  srStats: TopicSRStats[],
  now: Date,
  budget: AttentionBudget,
): ActionRecommendation[] {
  const maxActions = Math.max(1, strategy.gbrain_max_recommendations);
  const actions: ActionRecommendation[] = [];
  let remainingMinutes = budget.minutes_available;

  // Step 1: Spaced-review action if there's an overdue topic.
  //
  // A topic is "overdue for review" when its last_practice_date is
  // more than 3 days old AND accuracy < 0.6 — the student studied it,
  // didn't yet master it, and has started forgetting.
  const overdueReview = findOverdueReview(srStats, now);
  if (overdueReview && remainingMinutes >= 3) {
    const spacedAction: ActionRecommendation = {
      id: `ACT-${actions.length + 1}`,
      kind: 'spaced-review',
      title: `Quick review: ${TOPIC_NAMES[overdueReview.topic] || overdueReview.topic}`,
      rationale: `You practiced this ${daysSince(overdueReview.last_practice_date, now)} days ago with ${Math.round(overdueReview.accuracy * 100)}% accuracy. Spaced-review window is open.`,
      estimated_minutes: Math.min(3, remainingMinutes),
      content_hint: {
        topic: overdueReview.topic,
        difficulty: 'easy',
        count: 1,
      },
      priority_score: priorityFor(priorities, overdueReview.topic),
    };
    actions.push(spacedAction);
    remainingMinutes -= spacedAction.estimated_minutes;
  }

  // Step 2: Main study actions keyed off top priorities.
  //
  // Strategy.gbrain_bias shapes topic selection:
  //   quick_win          → prefer topics with accuracy 0.55-0.75 (near-mastery; closable gap)
  //   balanced           → pure priority order
  //   prerequisite_repair → prefer topics with accuracy < 0.45 (deep gap)
  const biasedTopics = applyBias(priorities, srStats, strategy.gbrain_bias);

  // Difficulty rotation — use the strategy's mix.
  const difficulties = expandDifficultyMix(strategy.mock_difficulty_mix, maxActions - actions.length);

  let difficultyIdx = 0;
  for (const pri of biasedTopics) {
    if (actions.length >= maxActions) break;
    if (remainingMinutes < 2) break;

    const difficulty = difficulties[difficultyIdx % difficulties.length] ?? 'medium';
    difficultyIdx++;

    // Time per practice action — scales with difficulty.
    const perQuestion =
      difficulty === 'easy' ? 2 :
      difficulty === 'medium' ? 3 :
      5;
    const requestedCount = inferQuestionCount(strategy, budget, remainingMinutes, perQuestion);
    const cappedCount = Math.min(requestedCount, Math.floor(remainingMinutes / perQuestion));
    if (cappedCount < 1) break;
    const estMinutes = cappedCount * perQuestion;

    const kind: ActionKind = budget.context === 'nano' && actions.length === 0
      ? 'review'   // For very short sessions, lead with a review rather than practice
      : 'practice';

    const action: ActionRecommendation = {
      id: `ACT-${actions.length + 1}`,
      kind,
      title: kind === 'review'
        ? `Review: ${TOPIC_NAMES[pri.topic] || pri.topic}`
        : `Practice ${TOPIC_NAMES[pri.topic] || pri.topic} · ${capitalize(difficulty)}`,
      rationale: buildActionRationale(pri, strategy.gbrain_bias, srStats, difficulty),
      estimated_minutes: kind === 'review' ? Math.min(3, remainingMinutes) : estMinutes,
      content_hint: {
        topic: pri.topic,
        difficulty,
        count: kind === 'review' ? 1 : cappedCount,
      },
      priority_score: pri.priority,
    };
    actions.push(action);
    remainingMinutes -= action.estimated_minutes;
  }

  // Step 3: If we had a long budget and there's still room for ≥8
  // minutes after the main actions, surface a micro-mock as an
  // optional capstone. Students on short/nano budgets don't see this.
  if (
    (budget.context === 'medium' || budget.context === 'long') &&
    remainingMinutes >= 8 &&
    actions.length < maxActions + 1
  ) {
    const topFew = biasedTopics.slice(0, 3).map(p => p.topic);
    const mockMinutes = Math.min(15, remainingMinutes);
    const mockCount = Math.max(3, Math.min(5, Math.floor(mockMinutes / 3)));
    actions.push({
      id: `ACT-${actions.length + 1}`,
      kind: 'micro-mock',
      title: `Micro-mock · ${topFew.length} topic${topFew.length === 1 ? '' : 's'}`,
      rationale: `You've got ${remainingMinutes} minutes after your main practice — a short mixed mock consolidates what you've covered and simulates exam conditions.`,
      estimated_minutes: mockMinutes,
      content_hint: {
        topic: topFew[0], // content resolver can broaden from hint
        difficulty: 'medium',
        count: mockCount,
      },
      priority_score: biasedTopics[0]?.priority ?? 0,
    });
    remainingMinutes -= mockMinutes;
  }

  // Safety: never return zero actions. If we couldn't fit anything
  // (e.g. 1-minute budget), recommend a single lightweight review.
  if (actions.length === 0 && priorities.length > 0) {
    const top = priorities[0];
    actions.push({
      id: 'ACT-1',
      kind: 'review',
      title: `Review: ${TOPIC_NAMES[top.topic] || top.topic}`,
      rationale: `Your time is very tight — a quick skim of the key definitions keeps the thread live without rushing.`,
      estimated_minutes: Math.min(2, budget.minutes_available),
      content_hint: {
        topic: top.topic,
        difficulty: 'easy',
        count: 1,
      },
      priority_score: top.priority,
    });
  }

  return actions;
}

// ============================================================================
// Helpers
// ============================================================================

function clampMinutes(n: number): number {
  if (!Number.isFinite(n) || n <= 0) return 1;
  return Math.min(180, Math.floor(n));
}

function findOverdueReview(srStats: TopicSRStats[], now: Date): TopicSRStats | null {
  const candidates = srStats
    .filter(s => s.last_practice_date)
    .filter(s => s.accuracy > 0 && s.accuracy < 0.6)
    .filter(s => daysSince(s.last_practice_date!, now) >= 3)
    // Most-overdue first, then lowest accuracy
    .sort((a, b) =>
      daysSince(b.last_practice_date!, now) - daysSince(a.last_practice_date!, now) ||
      a.accuracy - b.accuracy,
    );
  return candidates[0] ?? null;
}

function daysSince(iso: string, now: Date): number {
  const then = new Date(iso).getTime();
  return Math.max(0, Math.floor((now.getTime() - then) / (1000 * 60 * 60 * 24)));
}

function priorityFor(priorities: TopicPriority[], topic: string): number {
  return priorities.find(p => p.topic === topic)?.priority ?? 0;
}

function applyBias(
  priorities: TopicPriority[],
  srStats: TopicSRStats[],
  bias: AttentionStrategy['gbrain_bias'],
): TopicPriority[] {
  if (bias === 'balanced') return priorities;
  const srMap = new Map(srStats.map(s => [s.topic, s]));
  if (bias === 'quick_win') {
    // Partition: quick-win first (accuracy 0.55-0.75), then the rest.
    const quick: TopicPriority[] = [];
    const rest: TopicPriority[] = [];
    for (const p of priorities) {
      const sr = srMap.get(p.topic);
      if (sr && sr.accuracy >= 0.55 && sr.accuracy <= 0.75) quick.push(p);
      else rest.push(p);
    }
    return [...quick, ...rest];
  }
  if (bias === 'prerequisite_repair') {
    // Partition: deep-gap topics first (accuracy < 0.45), then rest.
    const deep: TopicPriority[] = [];
    const rest: TopicPriority[] = [];
    for (const p of priorities) {
      const sr = srMap.get(p.topic);
      if (sr && sr.accuracy > 0 && sr.accuracy < 0.45) deep.push(p);
      else rest.push(p);
    }
    return [...deep, ...rest];
  }
  return priorities;
}

/**
 * Build a deterministic sequence of difficulties using the strategy's
 * mix. E.g. mix={easy:0.6,medium:0.3,hard:0.1}, count=5 →
 * ['easy','easy','easy','medium','medium'] (with rounding).
 */
function expandDifficultyMix(
  mix: { easy: number; medium: number; hard: number },
  count: number,
): Array<'easy' | 'medium' | 'hard'> {
  if (count <= 0) return [];
  const easyN = Math.round(mix.easy * count);
  const mediumN = Math.round(mix.medium * count);
  const hardN = Math.max(0, count - easyN - mediumN);
  return [
    ...Array(easyN).fill('easy'),
    ...Array(mediumN).fill('medium'),
    ...Array(hardN).fill('hard'),
  ];
}

function inferQuestionCount(
  strategy: AttentionStrategy,
  budget: AttentionBudget,
  remainingMinutes: number,
  perQuestion: number,
): number {
  // Roughly distribute mock_question_count across the gbrain_max_recommendations
  // slots, floored to 1 and capped by remaining time.
  const perSlot = Math.max(1, Math.ceil(strategy.mock_question_count / strategy.gbrain_max_recommendations));
  return Math.min(perSlot, Math.floor(remainingMinutes / perQuestion));
}

function buildActionRationale(
  pri: TopicPriority,
  bias: AttentionStrategy['gbrain_bias'],
  srStats: TopicSRStats[],
  difficulty: 'easy' | 'medium' | 'hard',
): string {
  const sr = srStats.find(s => s.topic === pri.topic);
  const weakness = pri.weakness;
  const marks = pri.marks_weight;
  const proximity = pri.exam_proximity;

  const parts: string[] = [];
  if (bias === 'quick_win' && sr && sr.accuracy >= 0.55) {
    parts.push(`You're at ${Math.round(sr.accuracy * 100)}% here — close to mastery.`);
  } else if (bias === 'prerequisite_repair' && sr && sr.accuracy < 0.45) {
    parts.push(`Your accuracy on this topic is only ${Math.round(sr.accuracy * 100)}% — it's a foundation worth repairing.`);
  } else if (weakness >= 0.6) {
    parts.push(`This is one of your weaker topics.`);
  }

  if (marks >= 0.12) {
    parts.push(`It's a high-weight area (${Math.round(marks * 100)}% of exam marks).`);
  }
  if (proximity >= 0.8) {
    parts.push(`Your exam is close, so high-yield topics matter most right now.`);
  }

  // At least one sentence always.
  if (parts.length === 0) {
    parts.push(`Next on your priority queue for this exam.`);
  }
  return parts.join(' ');
}

function buildHeadline(
  budget: AttentionBudget,
  actions: ActionRecommendation[],
  priorities: TopicPriority[],
): string {
  const minutes = budget.minutes_available;
  const practiceTopics = actions.filter(a => a.kind === 'practice').map(a => TOPIC_NAMES[a.content_hint.topic] || a.content_hint.topic);
  const uniqueTopics = [...new Set(practiceTopics)];

  if (actions.length === 0) {
    return `${minutes} minutes — not enough to start; come back with more time.`;
  }
  if (uniqueTopics.length === 0) {
    return `${minutes} minutes · ${actions.length} action${actions.length === 1 ? '' : 's'} mapped out for you.`;
  }
  if (uniqueTopics.length === 1) {
    return `${minutes} minutes on ${uniqueTopics[0]} — focused and deliberate.`;
  }
  if (uniqueTopics.length === 2) {
    return `${minutes} minutes across ${uniqueTopics[0]} and ${uniqueTopics[1]}.`;
  }
  return `${minutes} minutes across ${uniqueTopics.slice(0, 2).join(', ')} and ${uniqueTopics.length - 2} more.`;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
