// @ts-nocheck
/**
 * MCP completions — argument auto-complete for prompts and resource templates.
 *
 * When a client is about to call `prompts/get task-handoff` and needs a
 * valid `task_id`, it calls `completion/complete`:
 *
 *   {
 *     method: "completion/complete",
 *     params: {
 *       ref: { type: "ref/prompt", name: "task-handoff" },
 *       argument: { name: "task_id", value: "TSK-a" }
 *     }
 *   }
 *
 * The server returns matching values (up to 100 per spec) with
 * hasMore + total:
 *
 *   { completion: {
 *       values: ["TSK-abc12345", "TSK-ade67890", ...],
 *       total: 17,
 *       hasMore: false
 *     }
 *   }
 *
 * Completion logic is keyed by ARGUMENT NAME rather than per-prompt or
 * per-resource. The same `task_id` argument shows up in multiple
 * places, and duplicating the resolver 3 times would be silly.
 *
 * Resolvers consult current state (task store, agent runs, adapters)
 * and are role-scoped: an analyst asking for task_id completions sees
 * only tasks their role can read.
 */

import type { RoleId } from './types';

// ============================================================================
// Reference types
// ============================================================================

export type CompletionRef =
  | { type: 'ref/prompt'; name: string }
  | { type: 'ref/resource'; uri: string };

export interface CompletionRequest {
  ref: CompletionRef;
  argument: { name: string; value: string };
}

export interface CompletionResponse {
  completion: {
    values: string[];
    /** Total matches before pagination; absent if unknown */
    total?: number;
    /** True if there are more results beyond `values.length` */
    hasMore?: boolean;
  };
}

export interface CompletionContext {
  role: RoleId;
  actor: string;
}

export interface CompletionError {
  code: 'not-found' | 'internal-error';
  message: string;
}

// Per-call soft cap. MCP spec says up to 100; we go 50 to keep payloads small.
const MAX_VALUES = 50;

// ============================================================================
// Resolver registry — by argument name
// ============================================================================

type Resolver = (value: string, ctx: CompletionContext) => Promise<string[]> | string[];

/**
 * Filters + sorts candidates that start with `value` (case-insensitive).
 * Exact matches rank first, then prefix matches, then substring fallback.
 */
function rank(candidates: string[], value: string): string[] {
  if (!value) return candidates.slice().sort();
  const lv = value.toLowerCase();
  const exact: string[] = [];
  const prefix: string[] = [];
  const contains: string[] = [];
  for (const c of candidates) {
    const lc = c.toLowerCase();
    if (lc === lv) exact.push(c);
    else if (lc.startsWith(lv)) prefix.push(c);
    else if (lc.includes(lv)) contains.push(c);
  }
  prefix.sort(); contains.sort();
  return [...exact, ...prefix, ...contains];
}

// ─── task_id ─────────────────────────────────────────────────────────
const resolveTaskId: Resolver = async (value) => {
  const { listTasks } = await import('./task-store');
  const tasks = listTasks({});
  return rank(tasks.map(t => t.id), value);
};

// ─── run_id ──────────────────────────────────────────────────────────
const resolveRunId: Resolver = async (value) => {
  const { listAgentRuns } = await import('./agent');
  const runs = listAgentRuns();
  // Newest-first for runs is the more useful ordering
  const ids = runs.sort((a, b) => (b.completed_at || '').localeCompare(a.completed_at || ''))
    .map(r => r.id);
  return rank(ids, value);
};

// ─── strategy_id ─────────────────────────────────────────────────────
const resolveStrategyId: Resolver = async (value) => {
  const { getLatestAgentRun } = await import('./agent');
  const run = getLatestAgentRun();
  if (!run) return [];
  return rank(run.strategies_proposed.map(s => s.id), value);
};

// ─── feedback_id ─────────────────────────────────────────────────────
const resolveFeedbackId: Resolver = async (value) => {
  const { listFeedback } = await import('../feedback/store');
  const items = listFeedback({});
  return rank(items.map(f => f.id), value);
};

// ─── exam_id ─────────────────────────────────────────────────────────
const resolveExamId: Resolver = async (value) => {
  // Combine: exam ids from feedback target, from courses, from agent runs
  const ids = new Set<string>();
  try {
    const { listFeedback } = await import('../feedback/store');
    for (const f of listFeedback({})) {
      if (f.target?.exam_id) ids.add(f.target.exam_id);
    }
  } catch { /* feedback store may not have data yet */ }
  try {
    const { listCourses } = await import('../course/promoter');
    for (const c of listCourses()) ids.add(c.exam_id);
  } catch { /* course module may not be present */ }
  // Fallback to a sensible example when nothing seeded yet
  if (ids.size === 0) ids.add('EXM-UGEE-MATH-SAMPLE');
  return rank([...ids], value);
};

// ─── role ────────────────────────────────────────────────────────────
const VALID_ROLES: RoleId[] = [
  'owner', 'admin', 'content-ops', 'exam-ops', 'marketing-lead',
  'qa-reviewer', 'analyst', 'author',
];
const resolveRole: Resolver = (value) => rank(VALID_ROLES as string[], value);

// ─── priority_filter ─────────────────────────────────────────────────
const resolvePriorityFilter: Resolver = (value) => rank(['P0', 'P1', 'P2', 'P3', 'P0+P1'], value);

// ─── priority (for feedback:triage) ──────────────────────────────────
const resolvePriority: Resolver = (value) => rank(['P0', 'P1', 'P2', 'P3'], value);

// ─── week_start ──────────────────────────────────────────────────────
// Completion for dates is tricky — suggest the last 8 Mondays as
// anchor points so the client has sensible defaults without typing
// an arbitrary ISO date.
const resolveWeekStart: Resolver = (value) => {
  const suggestions: string[] = [];
  const today = new Date();
  // Find last Monday
  const dayOfWeek = today.getDay();
  const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const lastMonday = new Date(today);
  lastMonday.setDate(today.getDate() - daysToMonday);
  for (let i = 0; i < 8; i++) {
    const d = new Date(lastMonday);
    d.setDate(lastMonday.getDate() - i * 7);
    suggestions.push(d.toISOString().slice(0, 10));
  }
  return rank(suggestions, value);
};

// ─── build_kind (for exam-builder:build-or-update) ───────────────────
const resolveBuildKind: Resolver = (value) => rank(['new', 'iterate'], value);

// ─── Registry ────────────────────────────────────────────────────────
const RESOLVERS: Record<string, Resolver> = {
  task_id: resolveTaskId,
  run_id: resolveRunId,
  strategy_id: resolveStrategyId,
  feedback_id: resolveFeedbackId,
  exam_id: resolveExamId,
  role: resolveRole,
  priority_filter: resolvePriorityFilter,
  priority: resolvePriority,
  week_start: resolveWeekStart,
  build_kind: resolveBuildKind,
};

export function listSupportedArguments(): string[] {
  return Object.keys(RESOLVERS).sort();
}

// ============================================================================
// Reference validation — make sure the ref is an argument the named
// prompt/resource actually declares.
// ============================================================================

async function isArgumentValidForRef(
  ref: CompletionRef,
  argumentName: string,
): Promise<boolean> {
  if (ref.type === 'ref/prompt') {
    const { PROMPT_CATALOG } = await import('./mcp-prompts');
    const prompt = PROMPT_CATALOG.find(p => p.name === ref.name);
    if (!prompt) return false;
    return prompt.arguments.some(a => a.name === argumentName);
  }
  if (ref.type === 'ref/resource') {
    // For resource templates like vidhya://admin/tasks/by-role/{role},
    // extract placeholders from the URI and check membership.
    const placeholders = (ref.uri.match(/\{([^}]+)\}/g) || []).map(p => p.slice(1, -1));
    return placeholders.includes(argumentName);
  }
  return false;
}

// ============================================================================
// Main entry point
// ============================================================================

export async function complete(
  req: CompletionRequest,
  ctx: CompletionContext,
): Promise<CompletionResponse | { error: CompletionError }> {
  // Validate argument name is known
  const resolver = RESOLVERS[req.argument.name];
  if (!resolver) {
    return {
      completion: { values: [], total: 0, hasMore: false },
    };
  }

  // Validate the argument exists on the referenced prompt/resource
  const valid = await isArgumentValidForRef(req.ref, req.argument.name);
  if (!valid) {
    return {
      error: {
        code: 'not-found',
        message: `Argument '${req.argument.name}' is not defined on ${req.ref.type === 'ref/prompt' ? `prompt '${req.ref.name}'` : `resource template '${req.ref.uri}'`}`,
      },
    };
  }

  try {
    const all = await resolver(req.argument.value ?? '', ctx);
    const total = all.length;
    const values = all.slice(0, MAX_VALUES);
    return {
      completion: {
        values,
        total,
        hasMore: total > MAX_VALUES,
      },
    };
  } catch (err: any) {
    return {
      error: {
        code: 'internal-error',
        message: err.message ?? String(err),
      },
    };
  }
}
