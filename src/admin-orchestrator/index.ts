// @ts-nocheck
/**
 * Admin Orchestrator Agent — public surface.
 *
 * The single source of truth for owner/admin. Scans every module,
 * proposes strategies, enqueues tasks assigned to roles, surfaces
 * cross-module insights.
 *
 * Primary entry point:
 *   runAdminAgent({
 *     triggered_by: 'owner',
 *     auto_enqueue_tasks: true,
 *     attempt_llm_narration: true,  // Optional; falls back gracefully
 *   })
 *
 * All other exports are queries and authorization helpers.
 */

export * from './types';
export * from './tool-registry';
export * from './role-registry';
export { runScan } from './scanner';
export { proposeStrategies } from './strategy-engine';
export {
  createTasksFromStrategy, getTask, listTasks, claimTask, completeTask,
  blockTask, cancelTask, addTaskNote, taskCountsByRole, clearAllTasks,
} from './task-store';
export {
  runAdminAgent, getAgentRun, listAgentRuns, getLatestAgentRun, listInsights,
  _resetAgentStore,
} from './agent';
