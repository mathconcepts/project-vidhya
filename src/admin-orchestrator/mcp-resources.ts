// @ts-nocheck
/**
 * MCP Resources — URI-addressed read-only views of admin state.
 *
 * MCP distinguishes "tools" (side-effectful operations the agent
 * chooses to invoke) from "resources" (state the agent can browse).
 * External agents doing `tools/call agent:summarize-health` for every
 * read is wasteful — resources give them a proper browse surface.
 *
 * URI scheme
 * ==========
 *
 *   vidhya://admin/health/latest
 *       → Latest HealthReport (or trigger-a-scan if no runs exist)
 *
 *   vidhya://admin/strategies/latest
 *       → Strategies from the latest run, ordered P0→P3
 *
 *   vidhya://admin/strategies/{strategy_id}
 *       → A single strategy by id
 *
 *   vidhya://admin/insights
 *       → Recent cross-module insights (up to 20)
 *
 *   vidhya://admin/runs/latest
 *       → Most recent AgentRun (full object)
 *
 *   vidhya://admin/runs/{run_id}
 *       → A specific run by id
 *
 *   vidhya://admin/tasks/by-role/{role}
 *       → Open tasks for a role, oldest-first
 *
 *   vidhya://admin/tasks/{task_id}
 *       → A single task by id (with activity log)
 *
 *   vidhya://admin/tools/catalog
 *       → The full tool catalog with JSON Schemas (role-scoped)
 *
 *   vidhya://admin/roles/catalog
 *       → Role registry
 *
 * Wire format
 * ===========
 *
 *   resources/list  → { resources: [ { uri, name, description, mimeType } ] }
 *   resources/read  → { contents: [ { uri, mimeType, text } ] }
 *
 * Every resource returns application/json text. External agents parse
 * the text into structured data themselves.
 *
 * Read authorization
 * ==================
 *
 * Resources are gated by role. The caller's MCP context.role is checked
 * against a per-resource minimum role. Analysts can read all read-only
 * resources. Destructive resources don't exist — by design, any state
 * mutation goes through tools/call (which enforces role authorization
 * via invokeTool()).
 */

import type { RoleId } from './types';

// ============================================================================
// Resource descriptors — static catalog
// ============================================================================

export interface ResourceDescriptor {
  /** Fixed URI for listable resources, or URI template for parameterised ones */
  uri: string;
  /** Short display name */
  name: string;
  /** One-line description for external agents */
  description: string;
  /** MIME type — always application/json for this server */
  mimeType: string;
  /** Roles authorized to read this resource */
  authorized_roles: RoleId[];
  /**
   * True if this descriptor represents a URI TEMPLATE — listed for
   * discovery but individual URIs are generated dynamically.
   * e.g. vidhya://admin/runs/{run_id}
   */
  is_template?: boolean;
}

const ALL_READERS: RoleId[] = [
  'owner', 'admin', 'content-ops', 'exam-ops', 'marketing-lead',
  'qa-reviewer', 'analyst', 'author',
];
const ANALYST_READERS: RoleId[] = ['owner', 'admin', 'analyst'];

export const RESOURCE_CATALOG: ResourceDescriptor[] = [
  {
    uri: 'vidhya://admin/health/latest',
    name: 'Latest health report',
    description: 'HealthReport from the most recent agent run. Triggers a scan if no runs exist.',
    mimeType: 'application/json',
    authorized_roles: ANALYST_READERS,
  },
  {
    uri: 'vidhya://admin/strategies/latest',
    name: 'Latest proposed strategies',
    description: 'Strategies from the most recent agent run, ordered P0→P3.',
    mimeType: 'application/json',
    authorized_roles: ANALYST_READERS,
  },
  {
    uri: 'vidhya://admin/strategies/{strategy_id}',
    name: 'Strategy by id',
    description: 'A single Strategy object with rationale, evidence, and proposed tasks.',
    mimeType: 'application/json',
    authorized_roles: ANALYST_READERS,
    is_template: true,
  },
  {
    uri: 'vidhya://admin/insights',
    name: 'Cross-module insights',
    description: 'Recent cross-module insights (up to 20, newest first).',
    mimeType: 'application/json',
    authorized_roles: ANALYST_READERS,
  },
  {
    uri: 'vidhya://admin/runs/latest',
    name: 'Latest agent run',
    description: 'Most recent full AgentRun object.',
    mimeType: 'application/json',
    authorized_roles: ANALYST_READERS,
  },
  {
    uri: 'vidhya://admin/runs/{run_id}',
    name: 'Agent run by id',
    description: 'A specific AgentRun by id.',
    mimeType: 'application/json',
    authorized_roles: ANALYST_READERS,
    is_template: true,
  },
  {
    uri: 'vidhya://admin/tasks/by-role/{role}',
    name: 'Open tasks for a role',
    description: 'Open tasks assigned to the given role, oldest-first.',
    mimeType: 'application/json',
    authorized_roles: ALL_READERS,
    is_template: true,
  },
  {
    uri: 'vidhya://admin/tasks/{task_id}',
    name: 'Task by id',
    description: 'A single Task by id with its full activity log.',
    mimeType: 'application/json',
    authorized_roles: ALL_READERS,
    is_template: true,
  },
  {
    uri: 'vidhya://admin/tools/catalog',
    name: 'Tool catalog (role-scoped)',
    description: 'Full list of tools the caller is authorized to invoke, with JSON Schema input contracts.',
    mimeType: 'application/json',
    authorized_roles: ALL_READERS,
  },
  {
    uri: 'vidhya://admin/roles/catalog',
    name: 'Role registry',
    description: 'Role definitions with responsibilities and authorized tool ids.',
    mimeType: 'application/json',
    authorized_roles: ALL_READERS,
  },
];

// ============================================================================
// URI parsing
// ============================================================================

interface ParsedURI {
  /** The bucket the resource belongs to (e.g. 'health', 'strategies', 'tasks') */
  bucket: string;
  /** Sub-path under the bucket */
  segments: string[];
  /** Original URI for logging */
  raw: string;
}

/**
 * Parse a vidhya:// URI into its components. Returns null if the URI
 * doesn't match the expected scheme.
 */
export function parseResourceURI(uri: string): ParsedURI | null {
  const match = uri.match(/^vidhya:\/\/admin\/([^/]+)(?:\/(.+))?$/);
  if (!match) return null;
  const bucket = match[1];
  const remainder = match[2] ?? '';
  const segments = remainder ? remainder.split('/').filter(Boolean) : [];
  return { bucket, segments, raw: uri };
}

/**
 * Find the descriptor matching a concrete URI — either an exact match
 * on a static URI or a pattern match on a template.
 */
export function findDescriptor(uri: string): ResourceDescriptor | null {
  // Exact match first
  const exact = RESOURCE_CATALOG.find(d => d.uri === uri);
  if (exact) return exact;

  const parsed = parseResourceURI(uri);
  if (!parsed) return null;

  // Template match — find the descriptor whose URI has the same bucket
  // structure and matching fixed segments. For example, a concrete URI
  // of 'vidhya://admin/runs/RUN-xxx' matches template
  // 'vidhya://admin/runs/{run_id}'.
  for (const desc of RESOURCE_CATALOG) {
    if (!desc.is_template) continue;
    const descParsed = parseResourceURI(desc.uri);
    if (!descParsed) continue;
    if (descParsed.bucket !== parsed.bucket) continue;
    if (descParsed.segments.length !== parsed.segments.length) continue;
    // A template segment like '{run_id}' matches any concrete segment;
    // fixed segments must match literally.
    let ok = true;
    for (let i = 0; i < descParsed.segments.length; i++) {
      const tSeg = descParsed.segments[i];
      const cSeg = parsed.segments[i];
      if (tSeg.startsWith('{') && tSeg.endsWith('}')) continue; // template
      if (tSeg !== cSeg) { ok = false; break; }
    }
    if (ok) return desc;
  }
  return null;
}

// ============================================================================
// Read dispatcher
// ============================================================================

export interface ResourceReadContext {
  role: RoleId;
  actor: string;
}

export interface ResourceReadResult {
  uri: string;
  mimeType: string;
  /** JSON-serialized body */
  text: string;
}

export interface ResourceReadError {
  /** MCP error code — mapped to JSON-RPC error envelope by the caller */
  code: 'not-found' | 'not-authorized' | 'internal-error';
  message: string;
}

/**
 * Read the contents of a resource by URI. Returns either a result or
 * an error; never throws.
 *
 * All state access is read-only. No mutation happens in this path.
 */
export async function readResource(
  uri: string,
  ctx: ResourceReadContext,
): Promise<ResourceReadResult | { error: ResourceReadError }> {
  const descriptor = findDescriptor(uri);
  if (!descriptor) {
    return { error: { code: 'not-found', message: `Resource '${uri}' is not in the catalog` } };
  }
  if (!descriptor.authorized_roles.includes(ctx.role)) {
    return {
      error: {
        code: 'not-authorized',
        message: `Role '${ctx.role}' cannot read '${uri}' (requires one of: ${descriptor.authorized_roles.join(', ')})`,
      },
    };
  }

  const parsed = parseResourceURI(uri);
  if (!parsed) {
    return { error: { code: 'not-found', message: `Malformed URI '${uri}'` } };
  }

  try {
    const body = await _dispatch(parsed, ctx);
    return {
      uri,
      mimeType: descriptor.mimeType,
      text: JSON.stringify(body, null, 2),
    };
  } catch (err: any) {
    return { error: { code: 'internal-error', message: err.message ?? String(err) } };
  }
}

async function _dispatch(parsed: ParsedURI, ctx: ResourceReadContext): Promise<any> {
  const { bucket, segments } = parsed;

  if (bucket === 'health' && segments[0] === 'latest') {
    const { getLatestAgentRun, runAdminAgent } = await import('./agent');
    let run = getLatestAgentRun();
    if (!run) {
      // No runs yet — trigger a scan-only run so the resource isn't empty
      run = await runAdminAgent({
        triggered_by: `mcp-resource:${ctx.actor}`,
        trigger_kind: 'event-driven',
        auto_enqueue_tasks: false,
        attempt_llm_narration: false,
      });
    }
    return run.health_report;
  }

  if (bucket === 'strategies') {
    const { getLatestAgentRun } = await import('./agent');
    const run = getLatestAgentRun();
    if (!run) return { strategies: [], note: 'No agent runs yet. POST /api/admin/agent/run to generate.' };
    if (segments[0] === 'latest') return { strategies: run.strategies_proposed };
    // By id
    const id = segments[0];
    const strategy = run.strategies_proposed.find(s => s.id === id);
    if (!strategy) throw new Error(`Strategy '${id}' not found in latest run`);
    return strategy;
  }

  if (bucket === 'insights' && segments.length === 0) {
    const { listInsights } = await import('./agent');
    return { insights: listInsights(20) };
  }

  if (bucket === 'runs') {
    const { getAgentRun, getLatestAgentRun } = await import('./agent');
    if (segments[0] === 'latest') {
      const run = getLatestAgentRun();
      if (!run) throw new Error('No agent runs yet');
      return run;
    }
    const run = getAgentRun(segments[0]);
    if (!run) throw new Error(`Run '${segments[0]}' not found`);
    return run;
  }

  if (bucket === 'tasks') {
    const { listTasks, getTask } = await import('./task-store');
    if (segments[0] === 'by-role') {
      const role = segments[1] as RoleId;
      if (!role) throw new Error('role segment required, e.g. vidhya://admin/tasks/by-role/admin');
      const tasks = listTasks({ statuses: ['open', 'in_progress', 'blocked'], role });
      // Oldest first for resource-read (MCP resources are for scanning; UI
      // can re-sort for display).
      tasks.sort((a, b) => a.created_at.localeCompare(b.created_at));
      return { role, count: tasks.length, tasks };
    }
    // Single task by id
    const task = getTask(segments[0]);
    if (!task) throw new Error(`Task '${segments[0]}' not found`);
    return task;
  }

  if (bucket === 'tools' && segments[0] === 'catalog') {
    const { listToolsForRole } = await import('./tool-registry');
    return {
      role: ctx.role,
      tools: listToolsForRole(ctx.role),
    };
  }

  if (bucket === 'roles' && segments[0] === 'catalog') {
    const { listRoles } = await import('./role-registry');
    return { roles: listRoles() };
  }

  throw new Error(`No dispatch handler for bucket '${bucket}'`);
}

// ============================================================================
// List accessors
// ============================================================================

/**
 * The resources/list response, scoped to the caller's role. Template
 * URIs are included so agents can discover the pattern, but only
 * concrete-form resources (static URIs) are really "readable" without
 * substituting parameters.
 */
export function listResourcesForRole(role: RoleId): {
  resources: Array<Omit<ResourceDescriptor, 'authorized_roles' | 'is_template'> & { is_template?: boolean }>;
} {
  return {
    resources: RESOURCE_CATALOG
      .filter(d => d.authorized_roles.includes(role))
      .map(({ authorized_roles, ...rest }) => rest),
  };
}
