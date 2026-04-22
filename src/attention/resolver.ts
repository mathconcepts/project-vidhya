// @ts-nocheck
/**
 * Attention Resolver — pure function from (budget, context) to the
 * concrete strategy every consuming module follows.
 *
 * Design rules:
 *
 *   1. PURE. No I/O, no mutation. The resolver is deterministic so
 *      tests and audits can replay the same input and get the same
 *      strategy. Mutating state (deferrals, cumulative coverage)
 *      happens in the store module, not here.
 *
 *   2. MUST-INCLUDE FLOOR. No matter how short the session, certain
 *      content is never cut: hook + worked-example + common-traps
 *      for lessons; 1 easy + 1 medium for mocks. Short != shallow.
 *
 *   3. COMPOUND COMPETENCE. If the student's trailing-7-day minutes
 *      already total a full session's worth of time, treat them as
 *      a medium-budget student for recommendations even when the
 *      current session is nano. 12 five-minute sessions should cover
 *      what 1 sixty-minute session does.
 *
 *   4. EXPLICIT RATIONALE. Every strategy carries a human-readable
 *      rationale field so admins + students can understand why they
 *      got the recommendations they did. Black-box strategies
 *      violate the project's transparency principle.
 */

import type {
  AttentionBudget,
  SessionContext,
  AttentionStrategy,
  CumulativeCoverage,
} from './types';

// ============================================================================

const CONTEXT_BOUNDARIES: Array<{ max_minutes: number; context: SessionContext }> = [
  { max_minutes: 3, context: 'nano' },
  { max_minutes: 10, context: 'short' },
  { max_minutes: 25, context: 'medium' },
  { max_minutes: Infinity, context: 'long' },
];

export function classifyContext(minutes: number): SessionContext {
  for (const b of CONTEXT_BOUNDARIES) {
    if (minutes <= b.max_minutes) return b.context;
  }
  return 'long';
}

/**
 * Construct a budget from raw minutes. Used at the entry points
 * (HTTP routes, test harnesses) before passing to the resolver.
 */
export function budgetFromMinutes(
  minutes: number,
  source: AttentionBudget['source'] = 'student_declared',
  historical_avg_minutes?: number,
): AttentionBudget {
  // Clamp — we accept 1-180 minutes. 0 or negatives default to nano.
  const clamped = Math.max(1, Math.min(180, Math.floor(minutes)));
  return {
    minutes_available: clamped,
    context: classifyContext(clamped),
    source,
    historical_avg_minutes,
  };
}

// ============================================================================
// Pure resolver
// ============================================================================

export function resolveStrategy(
  budget: AttentionBudget,
  coverage?: CumulativeCoverage,
): AttentionStrategy {
  // Effective context: if the student has a lot of trailing-7d time,
  // they're not in crisis mode even if this session is short — we can
  // afford to route some repair work in.
  const effectiveContext = applyCompoundCompetence(budget, coverage);

  switch (effectiveContext) {
    case 'nano':    return nanoStrategy(budget);
    case 'short':   return shortStrategy(budget);
    case 'medium':  return mediumStrategy(budget);
    case 'long':    return longStrategy(budget);
  }
}

/**
 * Compound-competence adjustment: if historical cumulative time >=
 * 60 min in the last 7 days, treat a 'nano' session as if 'short' for
 * recommendation bias purposes. The student has earned the right to
 * be routed to harder material even on a 2-minute check-in.
 */
function applyCompoundCompetence(
  budget: AttentionBudget,
  coverage?: CumulativeCoverage,
): SessionContext {
  if (!coverage) return budget.context;
  if (coverage.trailing_7d_minutes >= 60 && budget.context === 'nano') {
    return 'short';
  }
  if (coverage.trailing_7d_minutes >= 180 && budget.context === 'short') {
    return 'medium';
  }
  return budget.context;
}

// ============================================================================
// Per-context strategies — each is a commented explanation of the
// trade-offs for that session length
// ============================================================================

function nanoStrategy(budget: AttentionBudget): AttentionStrategy {
  // Nano sessions (≤3 min) are commute check-ins or between-class glances.
  // Goal: one specific micro-win. No mock attempts — 3 min is not enough
  // for a meaningful question + explanation cycle. Instead, surface ONE
  // spaced-repetition card or one common-trap reminder.
  return {
    budget,
    mock_question_count: 0,            // No mock — not enough time
    mock_difficulty_mix: { easy: 0, medium: 0, hard: 0 },
    mock_allow_checkpoint: false,
    lesson_components_to_surface: ['hook', 'common-traps'],
    lesson_show_depth_cta: true,
    gbrain_max_recommendations: 1,
    gbrain_bias: 'quick_win',
    feedback_mode: 'one_tap_only',
    must_include_floor: ['one spaced-repetition card OR one common-trap review'],
    rationale:
      '≤3 min: commute / between-class window. Serve ONE quick-win ' +
      'reminder, no mock attempt (not enough time for a meaningful cycle). ' +
      'Feedback via one-tap reactions only. Extended depth available via ' +
      '"want more?" CTA for when the student returns.',
  };
}

function shortStrategy(budget: AttentionBudget): AttentionStrategy {
  // Short sessions (3-10 min) are the sweet spot to design for — most
  // mobile study sessions land here. Goal: finish a bounded unit of
  // work — micro-mock (3 questions), or one lesson core. Must-include
  // floor ensures even this 5-minute slice has real learning.
  const minutes = budget.minutes_available;
  // Each mock Q averages 60-90s including reading + explanation reveal;
  // budget 90s per Q and leave 1-2 min for wrap-up insight.
  const availableForMock = Math.max(0, minutes - 1.5);
  const maxQs = Math.floor((availableForMock * 60) / 90);
  const mock_question_count = Math.min(4, Math.max(2, maxQs));

  return {
    budget,
    mock_question_count,
    // Short session bias: easier questions to build confidence + not
    // blow time on one hard problem. 50% easy / 50% medium, 0% hard.
    mock_difficulty_mix: {
      easy: Math.ceil(mock_question_count / 2),
      medium: Math.floor(mock_question_count / 2),
      hard: 0,
    },
    mock_allow_checkpoint: true,
    lesson_components_to_surface: ['hook', 'definition', 'worked-example', 'common-traps'],
    lesson_show_depth_cta: true,
    gbrain_max_recommendations: 2,
    gbrain_bias: 'quick_win',
    feedback_mode: 'one_tap_plus_text',
    must_include_floor: [
      '≥1 easy question to build momentum',
      'hook + worked-example for any lesson',
      'common-traps always shown',
    ],
    rationale:
      `${minutes} min: typical mobile session. Serve ${mock_question_count}-question ` +
      'micro-mock, checkpoint mid-way so student can resume. 4 of 8 lesson ' +
      'components — the 4 that actually teach (hook→definition→worked→traps). ' +
      'GBrain favours quick wins here; deep repair work saved for medium sessions.',
  };
}

function mediumStrategy(budget: AttentionBudget): AttentionStrategy {
  // Medium sessions (10-25 min) are focused desk work. Goal: a
  // complete lesson or an 8-10 question mock with full analytics.
  const minutes = budget.minutes_available;
  const availableForMock = Math.max(0, minutes - 3);
  const maxQs = Math.floor((availableForMock * 60) / 75);
  const mock_question_count = Math.min(12, Math.max(6, maxQs));
  return {
    budget,
    mock_question_count,
    mock_difficulty_mix: {
      easy: Math.floor(mock_question_count * 0.3),
      medium: Math.ceil(mock_question_count * 0.5),
      hard: Math.floor(mock_question_count * 0.2),
    },
    mock_allow_checkpoint: true,
    lesson_components_to_surface: [
      'hook', 'definition', 'intuition', 'worked-example', 'micro-exercise', 'common-traps',
    ],
    lesson_show_depth_cta: true,  // formal-statement + connections on CTA
    gbrain_max_recommendations: 3,
    gbrain_bias: 'balanced',
    feedback_mode: 'full_form',
    must_include_floor: [
      'at least 1 hard question (stretch)',
      '6 of 8 lesson components for any lesson opened',
      'full feedback form available',
    ],
    rationale:
      `${minutes} min: focused desk session. Full mock experience ` +
      `(${mock_question_count} Q with 30% easy / 50% medium / 20% hard). ` +
      '6 of 8 lesson components; formal-statement + connections gated behind ' +
      '"want more depth?" for students who want the rigor layer. GBrain ' +
      'balanced — quick wins + some prerequisite repair.',
  };
}

function longStrategy(budget: AttentionBudget): AttentionStrategy {
  // Long sessions (>25 min) are extended deep work — rare in mobile
  // context, more common before mocks or on weekends. Goal: full
  // 20-question mock, complete 8-component lesson, multi-topic queue.
  const minutes = budget.minutes_available;
  const availableForMock = Math.max(0, minutes - 5);
  const maxQs = Math.floor((availableForMock * 60) / 70);
  const mock_question_count = Math.min(30, Math.max(15, maxQs));
  return {
    budget,
    mock_question_count,
    mock_difficulty_mix: {
      easy: Math.floor(mock_question_count * 0.25),
      medium: Math.ceil(mock_question_count * 0.45),
      hard: Math.floor(mock_question_count * 0.30),
    },
    mock_allow_checkpoint: true,
    lesson_components_to_surface: [
      'hook', 'definition', 'intuition', 'worked-example',
      'micro-exercise', 'common-traps', 'formal-statement', 'connections',
    ],
    lesson_show_depth_cta: false,  // all components inline
    gbrain_max_recommendations: 5,
    gbrain_bias: 'prerequisite_repair',
    feedback_mode: 'full_form',
    must_include_floor: [
      'full 8-component lesson for any lesson opened',
      'mock includes hard questions (30% of mock)',
      'multi-concept recommendation queue',
    ],
    rationale:
      `${minutes} min: extended deep-work session. Full-fidelity ` +
      `${mock_question_count}-Q mock with 25/45/30 difficulty mix. All 8 lesson ` +
      'components surfaced inline. GBrain routes toward prerequisite repair — ' +
      'this is the session length that can afford the slower payoff of deep work.',
  };
}

// ============================================================================
// Mock / lesson filtering helpers — used by downstream modules
// ============================================================================

/**
 * Given a full mock (e.g. 20 questions) and an AttentionStrategy,
 * return the subset of questions that fits the budget + difficulty mix.
 *
 * Pure — doesn't mutate the input mock. Deterministic given the same
 * inputs (no randomization inside; caller seeds if randomness desired).
 */
export function filterMockForStrategy<Q extends { difficulty?: 'easy' | 'medium' | 'hard' }>(
  questions: Q[],
  strategy: AttentionStrategy,
): Q[] {
  if (strategy.mock_question_count === 0) return [];

  const byDifficulty = { easy: [] as Q[], medium: [] as Q[], hard: [] as Q[] };
  for (const q of questions) {
    const d = q.difficulty ?? 'medium';
    byDifficulty[d].push(q);
  }

  const picked: Q[] = [];
  const targets = strategy.mock_difficulty_mix;
  for (const d of ['easy', 'medium', 'hard'] as const) {
    const want = targets[d];
    const avail = byDifficulty[d];
    picked.push(...avail.slice(0, want));
  }

  // Must-include floor: if the strategy demands at least 1 easy question
  // and we somehow ended up with 0 (mock lacked easy questions), borrow
  // from medium. This enforces the "no blank mocks" invariant.
  if (strategy.must_include_floor.some(s => s.includes('easy question')) && picked.length > 0) {
    if (!picked.some(q => (q.difficulty ?? 'medium') === 'easy') && byDifficulty.medium.length > 0) {
      picked.unshift(byDifficulty.medium[0]);
    }
  }

  // If we couldn't fill the target count from available questions (mock
  // too small), fall back to serving what we have rather than blocking.
  if (picked.length < strategy.mock_question_count && questions.length > picked.length) {
    const remaining = questions.filter(q => !picked.includes(q));
    const need = strategy.mock_question_count - picked.length;
    picked.push(...remaining.slice(0, need));
  }

  return picked;
}

/**
 * Given a full lesson (with 8 components) and an AttentionStrategy,
 * return only the components the strategy says to surface. Preserves
 * lesson.id + meta and trims the components list. Pure.
 */
export function filterLessonForStrategy<L extends { components: any[] }>(
  lesson: L,
  strategy: AttentionStrategy,
): L {
  const allowed = new Set(strategy.lesson_components_to_surface);
  return {
    ...lesson,
    components: (lesson.components ?? []).filter((c: any) => allowed.has(c.kind)),
  };
}
