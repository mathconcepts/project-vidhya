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
export {
  getProfile, upsertProfile, addExam, removeExam,
  _resetExamProfileStore,
} from './exam-profile-store';
export type {
  ExamRegistration, StudentExamProfile,
} from './exam-profile-store';
export {
  createTemplate, listTemplatesForStudent, getTemplate,
  deleteTemplate, markTemplateUsed, _resetTemplateStore,
} from './template-store';
export type { PlanTemplate } from './template-store';
export { PRESET_TEMPLATES, unadoptedPresets } from './template-presets';
export type { PresetTemplate } from './template-presets';
export {
  logPracticeSession, sumTrailingPracticeMinutes, countTrailingSessions,
  _resetPracticeSessionLog, _enumerateEntriesForTest,
} from './practice-session-log';
export type { PracticeSessionEntry } from './practice-session-log';
export type {
  PlanRequest, MultiExamPlanRequest, SessionPlan,
  ActionRecommendation, ActionKind, ContentHint,
  PlanExecution, ActionOutcome,
} from './types';
