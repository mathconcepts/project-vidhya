// @ts-nocheck
/**
 * Session Planner — public API.
 *
 * This is the entry point for every consumer (HTTP routes, MCP tools,
 * future CLI). The planner itself is pure; the store module provides
 * audit persistence; both are exported here so consumers only import
 * from one place.
 */

export { planSession } from './planner';
export {
  savePlan, getPlan, listPlansForStudent, listAllPlans, _resetPlanStore,
} from './store';
export type {
  PlanRequest, SessionPlan, ActionRecommendation, ActionKind, ContentHint,
} from './types';
