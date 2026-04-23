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
export { INPUT_SCHEMAS } from './input-schemas';
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
export {
  callLLMWithConfig, describeLLMAvailability,
} from './llm-bridge';
export {
  narrateStrategyTool, summarizeHealthTool, suggestNextActionTool,
  describeCapabilitiesTool,
} from './agent-tools';
export {
  handleMCPRequest, getPublicManifest, MCP_SERVER_INFO, MCP_CAPABILITIES,
} from './mcp-server';
export type {
  JsonRpcRequest, JsonRpcResponse, MCPContext,
} from './mcp-server';
export {
  RESOURCE_CATALOG, listResourcesForRole, readResource, findDescriptor, parseResourceURI,
} from './mcp-resources';
export type {
  ResourceDescriptor, ResourceReadContext, ResourceReadResult, ResourceReadError,
} from './mcp-resources';
export {
  PROMPT_CATALOG, listPromptsForRole, getPrompt,
} from './mcp-prompts';
export type {
  PromptDescriptor, PromptArgumentSpec, PromptMessage, PromptGetResult,
  PromptGetError, PromptGetContext,
} from './mcp-prompts';
export {
  emit as logEmit, debug as logDebug, info as logInfo, notice as logNotice,
  warning as logWarning, error as logError,
  subscribe as subscribeLogger, unsubscribe as unsubscribeLogger,
  listSubscribers, recentEvents, clearRingBuffer,
  setSessionLevel, getSessionLevel, clearSessionLevel,
  parseLevel, levelPasses, _resetLoggerForTests,
} from './logger';
export type { LogLevel, LogEvent } from './logger';
export { getDashboardHTML } from './dashboard-html';
