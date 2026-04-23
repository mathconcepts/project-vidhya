// @ts-nocheck
/**
 * Session Planner — public API.
 *
 * This is the entry point for every consumer (HTTP routes, MCP tools,
 * future CLI). The planner itself is pure; the store module provides
 * audit persistence; both are exported here so consumers only import
 * from one place.
 */

export { planSession, planMultiExamSession } from './planner';
export {
  savePlan, getPlan, listPlansForStudent, listAllPlans,
  recordExecution, sumTrailingMinutes, projectSrStatsFromExecutions,
  _resetPlanStore,
} from './store';
export type {
  PlanRequest, MultiExamPlanRequest, SessionPlan,
  ActionRecommendation, ActionKind, ContentHint,
  PlanExecution, ActionOutcome,
} from './types';
