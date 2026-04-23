// @ts-nocheck
/**
 * OpenAPI 3.1 specification generator for /api/admin/agent/* routes.
 *
 * Produces a valid OpenAPI 3.1 document describing all 19 admin-agent
 * routes shipped since v2.22. Non-MCP consumers (REST clients, test
 * frameworks, Postman imports, code generators) use this to discover
 * the surface without reading the TypeScript source.
 *
 * Generated at request time so the document always reflects current
 * protocol versions, tool counts, resource catalog sizes, and so on.
 * The generation cost is trivial — a few kilobytes of JSON, pure
 * in-process composition.
 *
 * OpenAPI 3.1 was chosen over 3.0 because:
 *   - OpenAPI 3.1 aligns with JSON Schema Draft 2020-12, which is what
 *     our tool input_schemas already use. No translation needed —
 *     schemas lift straight through.
 *   - Null unions, nullable types, and const are first-class, which
 *     matters for the enum-valued properties we have.
 *   - Webhooks and callbacks are modelled cleanly (we don't use them
 *     yet, but logging/setLevel push notifications fit the shape if
 *     we ever expose them over WebSocket).
 */

import { TOOLS } from '../admin-orchestrator/tool-registry';
import { RESOURCE_CATALOG } from '../admin-orchestrator/mcp-resources';
import { PROMPT_CATALOG } from '../admin-orchestrator/mcp-prompts';
import { MCP_SERVER_INFO, MCP_CAPABILITIES } from '../admin-orchestrator/mcp-server';

// ============================================================================
// Reusable schema snippets
// ============================================================================

const SCHEMA = {
  // JSON-RPC envelope shapes
  JsonRpcRequest: {
    type: 'object',
    required: ['jsonrpc', 'method'],
    properties: {
      jsonrpc: { type: 'string', const: '2.0' },
      id: {
        oneOf: [{ type: 'string' }, { type: 'number' }, { type: 'null' }],
      },
      method: { type: 'string',
        examples: ['initialize', 'tools/list', 'tools/call',
                   'resources/list', 'resources/read',
                   'prompts/list', 'prompts/get',
                   'logging/setLevel', 'completion/complete', 'ping'] },
      params: { type: 'object', additionalProperties: true },
    },
  },
  JsonRpcSuccess: {
    type: 'object',
    required: ['jsonrpc', 'id', 'result'],
    properties: {
      jsonrpc: { type: 'string', const: '2.0' },
      id: { oneOf: [{ type: 'string' }, { type: 'number' }, { type: 'null' }] },
      result: {},
    },
  },
  JsonRpcError: {
    type: 'object',
    required: ['jsonrpc', 'id', 'error'],
    properties: {
      jsonrpc: { type: 'string', const: '2.0' },
      id: { oneOf: [{ type: 'string' }, { type: 'number' }, { type: 'null' }] },
      error: {
        type: 'object',
        required: ['code', 'message'],
        properties: {
          code: { type: 'integer',
            description: 'JSON-RPC error code. -32700 parse / -32600 invalid request / -32601 method not found / -32602 invalid params / -32603 internal. -32001 tool/resource/prompt not found. -32002 not authorized.' },
          message: { type: 'string' },
          data: {},
        },
      },
    },
  },

  // Common admin-orchestrator primitives
  RoleId: {
    type: 'string',
    enum: ['owner', 'admin', 'content-ops', 'exam-ops', 'marketing-lead',
           'qa-reviewer', 'analyst', 'author'],
    description: 'One of eight roles the orchestrator recognizes',
  },
  Priority: {
    type: 'string',
    enum: ['P0', 'P1', 'P2', 'P3'],
  },
  TaskStatus: {
    type: 'string',
    enum: ['open', 'in_progress', 'blocked', 'done', 'cancelled'],
  },
  HealthReport: {
    type: 'object',
    properties: {
      overall: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['healthy', 'attention-needed', 'degraded'] },
          summary: { type: 'string' },
          critical_count: { type: 'integer', minimum: 0 },
          warning_count: { type: 'integer', minimum: 0 },
        },
      },
      modules: { type: 'object', additionalProperties: true },
      signals: { type: 'array', items: { $ref: '#/components/schemas/Signal' } },
    },
  },
  Signal: {
    type: 'object',
    properties: {
      code: { type: 'string' },
      severity: { type: 'string', enum: ['critical', 'warning', 'info'] },
      headline: { type: 'string' },
      detail: { type: 'string' },
      detected_at: { type: 'string', format: 'date-time' },
    },
  },
  Strategy: {
    type: 'object',
    properties: {
      id: { type: 'string' },
      kind: { type: 'string' },
      priority: { $ref: '#/components/schemas/Priority' },
      headline: { type: 'string' },
      rationale: { type: 'string' },
      expected_outcome: { type: 'string' },
      evidence: { type: 'array', items: { type: 'string' } },
      affected_exams: { type: 'array', items: { type: 'string' } },
      affected_topic_ids: { type: 'array', items: { type: 'string' } },
      proposed_tasks: { type: 'array', items: { type: 'object', additionalProperties: true } },
      llm_narration: { type: 'string', nullable: true },
      generated_at: { type: 'string', format: 'date-time' },
    },
  },
  Task: {
    type: 'object',
    properties: {
      id: { type: 'string' },
      title: { type: 'string' },
      description: { type: 'string' },
      assigned_role: { $ref: '#/components/schemas/RoleId' },
      status: { $ref: '#/components/schemas/TaskStatus' },
      estimated_effort_minutes: { type: 'integer', minimum: 0 },
      strategy_id: { type: 'string', nullable: true },
      suggested_tool_ids: { type: 'array', items: { type: 'string' } },
      created_at: { type: 'string', format: 'date-time' },
      activity_log: { type: 'array', items: { type: 'object', additionalProperties: true } },
    },
  },
  AgentRun: {
    type: 'object',
    properties: {
      id: { type: 'string' },
      started_at: { type: 'string', format: 'date-time' },
      completed_at: { type: 'string', format: 'date-time' },
      duration_ms: { type: 'integer', minimum: 0 },
      triggered_by: { type: 'string' },
      trigger_kind: { type: 'string', enum: ['manual', 'event-driven', 'scheduled'] },
      health_report: { $ref: '#/components/schemas/HealthReport' },
      strategies_proposed: { type: 'array', items: { $ref: '#/components/schemas/Strategy' } },
      tasks_enqueued: { type: 'integer', minimum: 0 },
      llm_narration_attempted: { type: 'boolean' },
      llm_narration_succeeded: { type: 'boolean' },
    },
  },
};

// ============================================================================
// Route descriptors — paths grouped by tag
// ============================================================================

function buildPaths(): Record<string, any> {
  const paths: Record<string, any> = {};

  // ─── Runs ────────────────────────────────────────────────────────
  paths['/api/admin/agent/run'] = {
    post: {
      tags: ['Runs'],
      summary: 'Trigger a new agent run',
      description: 'Executes scanner → strategy engine → task enqueue cycle. Optionally attempts LLM narration on each strategy.',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: false,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                triggered_by: { type: 'string', default: 'api' },
                trigger_kind: { type: 'string', enum: ['manual', 'event-driven', 'scheduled'], default: 'manual' },
                auto_enqueue_tasks: { type: 'boolean', default: true },
                attempt_llm_narration: { type: 'boolean', default: true },
              },
            },
          },
        },
      },
      responses: {
        '200': jsonResponse({ $ref: '#/components/schemas/AgentRun' }),
        '401': errorResponse('Missing or invalid Bearer token'),
      },
    },
  };

  paths['/api/admin/agent/runs'] = {
    get: {
      tags: ['Runs'],
      summary: 'List all agent runs (most recent 50)',
      security: [{ bearerAuth: [] }],
      responses: {
        '200': jsonResponse({
          type: 'object',
          properties: { runs: { type: 'array', items: { $ref: '#/components/schemas/AgentRun' } } },
        }),
      },
    },
  };

  paths['/api/admin/agent/runs/{id}'] = {
    get: {
      tags: ['Runs'],
      summary: 'Get a specific agent run by id',
      security: [{ bearerAuth: [] }],
      parameters: [pathParam('id', 'Run id, e.g. RUN-abc12345')],
      responses: {
        '200': jsonResponse({ $ref: '#/components/schemas/AgentRun' }),
        '404': errorResponse('Run not found'),
      },
    },
  };

  paths['/api/admin/agent/latest'] = {
    get: {
      tags: ['Runs'],
      summary: 'Get the most recent agent run',
      security: [{ bearerAuth: [] }],
      responses: {
        '200': jsonResponse({
          type: 'object',
          properties: { run: { oneOf: [{ $ref: '#/components/schemas/AgentRun' }, { type: 'null' }] } },
        }),
      },
    },
  };

  paths['/api/admin/agent/health'] = {
    get: {
      tags: ['Runs'],
      summary: 'Standalone scanner health check (no strategy or tasks)',
      security: [{ bearerAuth: [] }],
      responses: {
        '200': jsonResponse({ $ref: '#/components/schemas/HealthReport' }),
      },
    },
  };

  paths['/api/admin/agent/strategies'] = {
    get: {
      tags: ['Runs'],
      summary: 'List strategies from the most recent run',
      security: [{ bearerAuth: [] }],
      responses: {
        '200': jsonResponse({
          type: 'object',
          properties: { strategies: { type: 'array', items: { $ref: '#/components/schemas/Strategy' } } },
        }),
      },
    },
  };

  paths['/api/admin/agent/insights'] = {
    get: {
      tags: ['Runs'],
      summary: 'Recent cross-module insights',
      security: [{ bearerAuth: [] }],
      responses: {
        '200': jsonResponse({
          type: 'object',
          properties: { insights: { type: 'array', items: { type: 'object' } } },
        }),
      },
    },
  };

  // ─── Tasks ───────────────────────────────────────────────────────
  paths['/api/admin/agent/tasks'] = {
    get: {
      tags: ['Tasks'],
      summary: 'List tasks',
      security: [{ bearerAuth: [] }],
      parameters: [
        queryParam('role', { $ref: '#/components/schemas/RoleId' }, 'Filter by assigned role'),
        queryParam('strategy_id', { type: 'string' }, 'Filter by parent strategy'),
      ],
      responses: {
        '200': jsonResponse({
          type: 'object',
          properties: { tasks: { type: 'array', items: { $ref: '#/components/schemas/Task' } } },
        }),
      },
    },
  };

  for (const [path, action] of [
    ['/api/admin/agent/tasks/{id}/claim', 'claim'],
    ['/api/admin/agent/tasks/{id}/complete', 'complete'],
    ['/api/admin/agent/tasks/{id}/block', 'block'],
    ['/api/admin/agent/tasks/{id}/note', 'note'],
  ] as const) {
    paths[path] = {
      post: {
        tags: ['Tasks'],
        summary: `${action.charAt(0).toUpperCase() + action.slice(1)} a task`,
        security: [{ bearerAuth: [] }],
        parameters: [pathParam('id', 'Task id, e.g. TSK-abc12345')],
        requestBody: {
          required: false,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  actor: { type: 'string' },
                  note: { type: 'string', description: 'Optional note appended to the activity log' },
                },
              },
            },
          },
        },
        responses: {
          '200': jsonResponse({ $ref: '#/components/schemas/Task' }),
          '404': errorResponse('Task not found'),
        },
      },
    };
  }

  // ─── Tools + Roles ───────────────────────────────────────────────
  paths['/api/admin/agent/tools'] = {
    get: {
      tags: ['Tools'],
      summary: 'List all tools (role-scoped via query parameter)',
      security: [{ bearerAuth: [] }],
      parameters: [
        queryParam('role', { $ref: '#/components/schemas/RoleId' }, 'Filter to tools the given role can invoke'),
      ],
      responses: {
        '200': jsonResponse({
          type: 'object',
          properties: {
            tools: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  domain: { type: 'string' },
                  label: { type: 'string' },
                  description: { type: 'string' },
                  category: { type: 'string', enum: ['read', 'write', 'action', 'analysis'] },
                  is_destructive: { type: 'boolean' },
                  required_roles: { type: 'array', items: { $ref: '#/components/schemas/RoleId' } },
                  input_schema: { type: 'object', description: 'JSON Schema Draft 2020-12 input contract' },
                },
              },
            },
          },
        }),
      },
    },
  };

  paths['/api/admin/agent/tools/{id}/invoke'] = {
    post: {
      tags: ['Tools'],
      summary: 'Invoke a tool by id',
      description:
        'Enforces role-based authorization; if the caller\'s role is not in required_roles, returns 403. ' +
        'Body is passed as the tool\'s `input` argument; shape depends on the tool\'s input_schema (retrievable from GET /api/admin/agent/tools).',
      security: [{ bearerAuth: [] }],
      parameters: [pathParam('id', 'Tool id, e.g. feedback:triage')],
      requestBody: {
        required: false,
        content: {
          'application/json': {
            schema: { type: 'object', additionalProperties: true },
          },
        },
      },
      responses: {
        '200': jsonResponse({
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Invocation id' },
            tool_id: { type: 'string' },
            output: {},
            duration_ms: { type: 'integer' },
          },
        }),
        '403': errorResponse('Role not authorized to invoke this tool'),
        '404': errorResponse('Tool not found'),
      },
    },
  };

  paths['/api/admin/agent/roles'] = {
    get: {
      tags: ['Tools'],
      summary: 'List role definitions',
      security: [{ bearerAuth: [] }],
      responses: {
        '200': jsonResponse({
          type: 'object',
          properties: {
            roles: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { $ref: '#/components/schemas/RoleId' },
                  label: { type: 'string' },
                  responsibilities: { type: 'array', items: { type: 'string' } },
                  authorized_tool_ids: { type: 'array', items: { type: 'string' } },
                },
              },
            },
          },
        }),
      },
    },
  };

  // ─── MCP ─────────────────────────────────────────────────────────
  paths['/api/admin/agent/mcp'] = {
    post: {
      tags: ['MCP'],
      summary: 'JSON-RPC 2.0 endpoint for MCP protocol',
      description:
        'Single endpoint for all MCP methods: initialize, ping, tools/list, tools/call, ' +
        'resources/list, resources/read, prompts/list, prompts/get, logging/setLevel, ' +
        'completion/complete, notifications/initialized.',
      security: [{ bearerAuth: [] }],
      parameters: [
        queryParam('role', { $ref: '#/components/schemas/RoleId' }, 'Role claimed by the MCP client'),
        queryParam('session', { type: 'string' }, 'Session id for logging/setLevel state'),
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/JsonRpcRequest' },
            examples: {
              initialize: {
                value: {
                  jsonrpc: '2.0', id: 1,
                  method: 'initialize',
                  params: { protocolVersion: '2024-11-05', clientInfo: { name: 'my-client' } },
                },
              },
              toolsList: {
                value: { jsonrpc: '2.0', id: 2, method: 'tools/list' },
              },
              toolsCall: {
                value: {
                  jsonrpc: '2.0', id: 3,
                  method: 'tools/call',
                  params: { name: 'feedback:list-pending-triage', arguments: {} },
                },
              },
              resourcesRead: {
                value: {
                  jsonrpc: '2.0', id: 4,
                  method: 'resources/read',
                  params: { uri: 'vidhya://admin/health/latest' },
                },
              },
              promptsGet: {
                value: {
                  jsonrpc: '2.0', id: 5,
                  method: 'prompts/get',
                  params: { name: 'daily-standup', arguments: {} },
                },
              },
              completionComplete: {
                value: {
                  jsonrpc: '2.0', id: 6,
                  method: 'completion/complete',
                  params: {
                    ref: { type: 'ref/prompt', name: 'task-handoff' },
                    argument: { name: 'task_id', value: 'TSK-' },
                  },
                },
              },
            },
          },
        },
      },
      responses: {
        '200': {
          description: 'JSON-RPC response (result or error envelope). Transport-level status is always 200 for well-formed requests; MCP-level errors live inside the error envelope.',
          content: {
            'application/json': {
              schema: {
                oneOf: [
                  { $ref: '#/components/schemas/JsonRpcSuccess' },
                  { $ref: '#/components/schemas/JsonRpcError' },
                ],
              },
            },
          },
        },
      },
    },
  };

  paths['/api/admin/agent/mcp/manifest'] = {
    get: {
      tags: ['MCP'],
      summary: 'Public MCP server manifest (unauthenticated)',
      description: 'Discoverable metadata for MCP clients — server info, capabilities, supported methods, tool count. No authentication required.',
      responses: {
        '200': jsonResponse({
          type: 'object',
          properties: {
            serverInfo: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                version: { type: 'string' },
                protocolVersion: { type: 'string' },
              },
            },
            capabilities: { type: 'object', additionalProperties: true },
            endpoints: { type: 'object', additionalProperties: true },
            auth: { type: 'object', additionalProperties: true },
            tool_count: { type: 'integer' },
            methods_supported: { type: 'array', items: { type: 'string' } },
            protocol_notes: { type: 'array', items: { type: 'string' } },
          },
        }),
      },
    },
  };

  // ─── Diagnostics ─────────────────────────────────────────────────
  paths['/api/admin/agent/llm-status'] = {
    get: {
      tags: ['Diagnostics'],
      summary: 'LLM bridge availability check (no paid call made)',
      security: [{ bearerAuth: [] }],
      responses: {
        '200': jsonResponse({
          type: 'object',
          properties: {
            llm: {
              type: 'object',
              properties: {
                available: { type: 'boolean' },
                provider_id: { type: 'string', nullable: true },
                reason: { type: 'string', nullable: true,
                  description: 'Present when available=false — one of no-config, no-key, unsupported-provider' },
              },
            },
          },
        }),
      },
    },
  };

  // ─── Dashboard (legacy redirect) ─────────────────────────────────
  paths['/api/admin/agent/dashboard'] = {
    get: {
      tags: ['Dashboard'],
      summary: 'Legacy dashboard URL — redirects to /admin/agent/dashboard',
      description: 'Deprecated since v2.26.0. Returns 301 with Location: /admin/agent/dashboard. The dashboard is now served as a static HTML file alongside the frontend SPA.',
      responses: {
        '301': {
          description: 'Redirect to new dashboard URL',
          headers: {
            Location: {
              schema: { type: 'string', const: '/admin/agent/dashboard' },
            },
          },
        },
      },
    },
  };

  return paths;
}

// ============================================================================
// Helpers
// ============================================================================

function jsonResponse(schema: any): any {
  return {
    description: 'Success',
    content: { 'application/json': { schema } },
  };
}

function errorResponse(description: string): any {
  return {
    description,
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: { error: { type: 'string' } },
        },
      },
    },
  };
}

function pathParam(name: string, description: string): any {
  return {
    name, in: 'path', required: true,
    schema: { type: 'string' },
    description,
  };
}

function queryParam(name: string, schema: any, description: string): any {
  return {
    name, in: 'query', required: false,
    schema, description,
  };
}

// ============================================================================
// Top-level generator
// ============================================================================

export function buildOpenAPISpec(baseUrl: string = 'http://localhost:8080'): any {
  return {
    openapi: '3.1.0',
    info: {
      title: 'Project Vidhya — Admin Orchestrator API',
      version: MCP_SERVER_INFO.version,
      description:
        `REST + JSON-RPC API for the Project Vidhya admin orchestrator.\n\n` +
        `This specification covers all 19 \`/api/admin/agent/*\` routes, including the MCP ` +
        `JSON-RPC endpoint at \`/api/admin/agent/mcp\`. For the MCP-native view of the same ` +
        `surface, see the manifest at \`/api/admin/agent/mcp/manifest\` or the MCP Integration ` +
        `Guide at \`docs/mcp-integration.md\`.\n\n` +
        `**Key facts about this deployment:**\n` +
        `- ${TOOLS.length} tools across ${new Set(TOOLS.map(t => t.domain)).size} domains\n` +
        `- ${RESOURCE_CATALOG.length} MCP resources (URI-addressed, read-only)\n` +
        `- ${PROMPT_CATALOG.length} MCP prompts (templates run on client-side LLM)\n` +
        `- Protocol version: ${MCP_SERVER_INFO.protocolVersion}\n` +
        `- JSON Schema dialect: Draft 2020-12\n\n` +
        `All routes except \`/mcp/manifest\` and \`/dashboard\` (legacy) require a Bearer JWT.`,
      contact: {
        name: 'Project Vidhya',
        url: 'https://github.com/mathconcepts/project-vidhya',
      },
      license: {
        name: 'Proprietary',
      },
    },
    servers: [
      { url: baseUrl, description: 'Current deployment' },
    ],
    tags: [
      { name: 'Runs', description: 'Scanner runs, strategies, insights' },
      { name: 'Tasks', description: 'Task queue — claim, complete, block, note' },
      { name: 'Tools', description: 'Tool catalog + role-authorized invocation' },
      { name: 'MCP', description: 'Model Context Protocol (JSON-RPC 2.0)' },
      { name: 'Diagnostics', description: 'Health + capability checks' },
      { name: 'Dashboard', description: 'Admin UI (legacy redirect only — current dashboard at /admin/agent/dashboard)' },
    ],
    security: [{ bearerAuth: [] }],
    paths: buildPaths(),
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Admin JWT obtained via POST /api/auth/bootstrap (see main quick-start docs).',
        },
      },
      schemas: SCHEMA,
    },
    // OpenAPI 3.1 extension — surfaces runtime catalog counts for discoverability
    'x-vidhya-stats': {
      tool_count: TOOLS.length,
      tool_domains: [...new Set(TOOLS.map(t => t.domain))].sort(),
      resource_count: RESOURCE_CATALOG.length,
      prompt_count: PROMPT_CATALOG.length,
      mcp_capabilities: MCP_CAPABILITIES,
      generated_at: new Date().toISOString(),
    },
  };
}
