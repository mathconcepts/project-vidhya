// @ts-nocheck
/**
 * Attention Primitive — public surface.
 *
 * Usage patterns:
 *
 *   // 1. From an HTTP route (student declares their session length)
 *   import { budgetFromMinutes, resolveStrategy } from 'src/attention';
 *   const budget = budgetFromMinutes(body.minutes_available);
 *   const strategy = resolveStrategy(budget, getCoverage(user_id));
 *
 *   // 2. From a downstream module (GBrain, orchestrator, mock renderer)
 *   import { filterMockForStrategy, filterLessonForStrategy } from 'src/attention';
 *   const micro = filterMockForStrategy(fullMock.questions, strategy);
 *   const trimmed = filterLessonForStrategy(fullLesson, strategy);
 *
 *   // 3. After a session completes
 *   import { recordSession } from 'src/attention';
 *   recordSession(user_id, minutes_spent);
 */

export * from './types';
export * from './resolver';
export * from './store';
