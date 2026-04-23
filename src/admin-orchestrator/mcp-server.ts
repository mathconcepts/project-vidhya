// @ts-nocheck
/**
 * MCP JSON-RPC server for the admin orchestrator.
 *
 * Implements the core subset of the Model Context Protocol that
 * external agents need to discover + invoke tools on this server:
 *
 *   - initialize:   handshake, returns server capabilities + info
 *   - ping:         health check
 *   - tools/list:   enumerate available tools with JSON Schema
 *   - tools/call:   invoke a tool by name with arguments
 *
 * Wire format: JSON-RPC 2.0 over HTTP POST. Responses follow the
 * standard { jsonrpc: "2.0", id, result | error } envelope.
 *
 * This does NOT implement the full MCP spec — no resources/list,
 * prompts/list, sampling/createMessage, roots/list, completion/complete,
 * or logging/setLevel. Those are acknowledged in initialize's
 * `capabilities` response so compliant clients know not to ask for them.
 *
 * Every tool call goes through the existing `invokeTool()` authorization
 * path — the caller's role is extracted from the HTTP auth context or,
 * in MCP mode, from the client's declared role during initialize.
 */

import type { RoleId } from './types';
import { TOOLS, invokeTool, listToolsForRole } from './tool-registry';

// ============================================================================
// JSON-RPC envelope types
// ============================================================================

export interface JsonRpcRequest {
  jsonrpc: '2.0';
  id?: string | number | null;
  method: string;
  params?: any;
}

export interface JsonRpcSuccess {
  jsonrpc: '2.0';
  id: string | number | null;
  result: any;
}

export interface JsonRpcError {
  jsonrpc: '2.0';
  id: string | number | null;
  error: {
    code: number;
    message: string;
    data?: any;
  };
}

export type JsonRpcResponse = JsonRpcSuccess | JsonRpcError;

// JSON-RPC 2.0 standard error codes
const ERR_PARSE_ERROR = -32700;
const ERR_INVALID_REQUEST = -32600;
const ERR_METHOD_NOT_FOUND = -32601;
const ERR_INVALID_PARAMS = -32602;
const ERR_INTERNAL_ERROR = -32603;
// MCP-specific application errors (2^31 range reserved by JSON-RPC spec for app use)
const ERR_TOOL_NOT_FOUND = -32001;
const ERR_NOT_AUTHORIZED = -32002;

// ============================================================================
// MCP server constants
// ============================================================================

export const MCP_SERVER_INFO = {
  name: 'project-vidhya-admin-orchestrator',
  version: '2.33.0',
  /** Protocol version the server implements. 2024-11-05 is the stable MCP baseline. */
  protocolVersion: '2024-11-05',
};

/**
 * Capabilities this server exposes. Each top-level key tells compatible
 * MCP clients what families of calls are safe to make.
 *
 *   tools:           list + call (core); listChanged notifications unsupported
 *   resources:       list + read (v2.24.0); subscribe unsupported; listChanged unsupported
 *   prompts:         list + get (v2.26.0); listChanged unsupported
 *   logging:         setLevel (v2.27.0). Under stdio transport, events
 *                    are pushed as notifications/message. Under HTTP
 *                    transport, setLevel is accepted for compliance
 *                    but events must be pulled via resource
 *                    vidhya://admin/logs/recent since HTTP can't push.
 *   completions:     complete (v2.28.0) — argument auto-complete for
 *                    prompts + resource template placeholders
 *   sampling:        unsupported — server does not ask client to generate
 */
export const MCP_CAPABILITIES = {
  tools: {
    /** Server does not emit listChanged notifications */
    listChanged: false,
  },
  resources: {
    /** Server does not support resources/subscribe (no push notifications) */
    subscribe: false,
    /** Server does not emit listChanged notifications */
    listChanged: false,
  },
  prompts: {
    /** Server does not emit listChanged notifications */
    listChanged: false,
  },
  logging: {},
  completions: {},
};

// ============================================================================
// Core handler
// ============================================================================

export interface MCPContext {
  /** Role claimed by the caller (extracted from auth). Defaults to 'admin'. */
  role: RoleId;
  /** User id claimed by the caller. Used as the actor on tool invocations. */
  actor: string;
  /** Session id, echoed back if provided */
  session_id?: string;
}

/**
 * Main dispatcher. Returns a JsonRpcResponse regardless of input — never
 * throws, so HTTP handlers can wrap this call once and return the envelope.
 */
export async function handleMCPRequest(
  request: JsonRpcRequest,
  ctx: MCPContext,
): Promise<JsonRpcResponse> {
  const id = request.id ?? null;

  // Validate envelope
  if (request.jsonrpc !== '2.0') {
    return errorResponse(id, ERR_INVALID_REQUEST, 'jsonrpc field must be "2.0"');
  }
  if (typeof request.method !== 'string') {
    return errorResponse(id, ERR_INVALID_REQUEST, 'method field is required');
  }

  try {
    switch (request.method) {
      case 'initialize':
        return handleInitialize(id, request.params, ctx);
      case 'ping':
        return successResponse(id, {});
      case 'tools/list':
        return handleToolsList(id, request.params, ctx);
      case 'tools/call':
        return await handleToolsCall(id, request.params, ctx);
      case 'resources/list':
        return await handleResourcesList(id, request.params, ctx);
      case 'resources/read':
        return await handleResourcesRead(id, request.params, ctx);
      case 'prompts/list':
        return await handlePromptsList(id, request.params, ctx);
      case 'prompts/get':
        return await handlePromptsGet(id, request.params, ctx);
      case 'logging/setLevel':
        return await handleLoggingSetLevel(id, request.params, ctx);
      case 'completion/complete':
        return await handleCompletionComplete(id, request.params, ctx);
      case 'notifications/initialized':
        // Per MCP: client sends this after initialize. Acknowledge silently.
        return successResponse(id, null);
      default:
        return errorResponse(id, ERR_METHOD_NOT_FOUND, `Method '${request.method}' not supported`);
    }
  } catch (err: any) {
    return errorResponse(id, ERR_INTERNAL_ERROR, err.message ?? String(err));
  }
}

// ============================================================================
// Method handlers
// ============================================================================

function handleInitialize(id: any, params: any, ctx: MCPContext): JsonRpcResponse {
  // params carries clientInfo + protocolVersion + capabilities from client
  const clientProtocol = params?.protocolVersion ?? 'unknown';
  return successResponse(id, {
    protocolVersion: MCP_SERVER_INFO.protocolVersion,
    serverInfo: MCP_SERVER_INFO,
    capabilities: MCP_CAPABILITIES,
    /** Server-side note echoed to client for their logs */
    instructions:
      `Project Vidhya admin orchestrator MCP server. ` +
      `${TOOLS.length} tools available for role '${ctx.role}'. ` +
      `Client announced protocol: ${clientProtocol}.`,
  });
}

function handleToolsList(id: any, _params: any, ctx: MCPContext): JsonRpcResponse {
  // Scope tools by caller role — an external agent only sees what its
  // declared role is authorized to call. Prevents accidental discovery
  // of destructive tools by analyst-role callers.
  const authorized = listToolsForRole(ctx.role);

  const tools = authorized.map(t => ({
    name: t.id,
    description: t.description,
    inputSchema: t.input_schema ?? { type: 'object', properties: {}, additionalProperties: false },
    // MCP-specific optional metadata
    annotations: {
      title: t.label,
      category: t.category,
      destructiveHint: t.is_destructive,
      readOnlyHint: t.category === 'read',
    },
  }));

  return successResponse(id, { tools });
}

async function handleToolsCall(id: any, params: any, ctx: MCPContext): Promise<JsonRpcResponse> {
  if (!params || typeof params !== 'object') {
    return errorResponse(id, ERR_INVALID_PARAMS, 'params must be an object with { name, arguments }');
  }
  const { name, arguments: args } = params;
  if (typeof name !== 'string') {
    return errorResponse(id, ERR_INVALID_PARAMS, 'params.name must be a string');
  }

  const tool = TOOLS.find(t => t.id === name);
  if (!tool) {
    return errorResponse(id, ERR_TOOL_NOT_FOUND, `Tool '${name}' not found`);
  }

  // Invoke via the existing registry — this path enforces role authorization
  const invocation = await invokeTool(name, args ?? {}, ctx.actor, ctx.role);

  if (invocation.error) {
    // Distinguish authorization from other errors so the client can retry
    // vs. give up cleanly.
    const isAuth = invocation.error.includes('not authorized');
    return errorResponse(
      id,
      isAuth ? ERR_NOT_AUTHORIZED : ERR_INTERNAL_ERROR,
      invocation.error,
      { invocation_id: invocation.id, tool_id: name },
    );
  }

  // Encode the tool's output as MCP content blocks. Server keeps things
  // simple: every tool returns a JSON-serialized single text block.
  // External agents then parse the JSON body themselves.
  const text = JSON.stringify(invocation.output, null, 2);

  return successResponse(id, {
    content: [
      {
        type: 'text',
        text,
      },
    ],
    isError: false,
    /** MCP extension: non-standard metadata external clients can use */
    _meta: {
      invocation_id: invocation.id,
      tool_id: name,
      duration_ms: invocation.duration_ms,
    },
  });
}

// ============================================================================
// Resources handlers (v2.24.0)
// ============================================================================

async function handleResourcesList(id: any, _params: any, ctx: MCPContext): Promise<JsonRpcResponse> {
  const { listResourcesForRole } = await import('./mcp-resources');
  const listed = listResourcesForRole(ctx.role);
  return successResponse(id, listed);
}

async function handleResourcesRead(id: any, params: any, ctx: MCPContext): Promise<JsonRpcResponse> {
  if (!params || typeof params !== 'object' || typeof params.uri !== 'string') {
    return errorResponse(id, ERR_INVALID_PARAMS, 'params.uri (string) required');
  }
  const { readResource } = await import('./mcp-resources');
  const result = await readResource(params.uri, { role: ctx.role, actor: ctx.actor });

  if ('error' in result) {
    const code = result.error.code === 'not-authorized' ? ERR_NOT_AUTHORIZED
      : result.error.code === 'not-found' ? ERR_TOOL_NOT_FOUND  // reuse -32001 for resource-not-found
      : ERR_INTERNAL_ERROR;
    return errorResponse(id, code, result.error.message, { uri: params.uri });
  }

  // MCP resources/read returns { contents: [ { uri, mimeType, text } ] }
  // — potentially multiple contents if the resource aggregates. Our
  // server always returns a single content block.
  return successResponse(id, {
    contents: [
      {
        uri: result.uri,
        mimeType: result.mimeType,
        text: result.text,
      },
    ],
  });
}

// ============================================================================
// Prompts handlers (v2.26.0)
// ============================================================================

async function handlePromptsList(id: any, _params: any, ctx: MCPContext): Promise<JsonRpcResponse> {
  const { listPromptsForRole } = await import('./mcp-prompts');
  return successResponse(id, listPromptsForRole(ctx.role));
}

async function handlePromptsGet(id: any, params: any, ctx: MCPContext): Promise<JsonRpcResponse> {
  if (!params || typeof params !== 'object' || typeof params.name !== 'string') {
    return errorResponse(id, ERR_INVALID_PARAMS, 'params.name (string) required');
  }
  const args = params.arguments && typeof params.arguments === 'object' ? params.arguments : {};

  const { getPrompt } = await import('./mcp-prompts');
  const result = await getPrompt(params.name, args, { role: ctx.role, actor: ctx.actor });

  if ('error' in result) {
    const code =
      result.error.code === 'not-authorized' ? ERR_NOT_AUTHORIZED :
      result.error.code === 'not-found' ? ERR_TOOL_NOT_FOUND :  // reuse -32001 for prompt-not-found
      result.error.code === 'invalid-arguments' ? ERR_INVALID_PARAMS :
      ERR_INTERNAL_ERROR;
    return errorResponse(id, code, result.error.message, { name: params.name });
  }

  return successResponse(id, {
    description: result.description,
    messages: result.messages,
  });
}

// ============================================================================
// Logging handler (v2.27.0)
// ============================================================================

/**
 * handle `logging/setLevel`.
 *
 * Per MCP spec, the call persists a threshold for subsequent
 * `notifications/message` events. Our implementation:
 *
 *   1. Parses + validates the level (debug/info/notice/warning/error/
 *      critical/alert/emergency).
 *   2. Stores it keyed by session id (from ctx.session_id, falling
 *      back to ctx.actor if no session is declared).
 *   3. Returns an empty success result per spec.
 *
 * The stdio transport separately subscribes a callback that pushes
 * matching events as `notifications/message` to stdout. The HTTP
 * transport doesn't push — HTTP callers can pull recent events via
 * vidhya://admin/logs/recent resource.
 */
async function handleLoggingSetLevel(id: any, params: any, ctx: MCPContext): Promise<JsonRpcResponse> {
  if (!params || typeof params !== 'object') {
    return errorResponse(id, ERR_INVALID_PARAMS, 'params.level (string) required');
  }
  const { parseLevel, setSessionLevel, info } = await import('./logger');
  const level = parseLevel(params.level);
  if (!level) {
    return errorResponse(id, ERR_INVALID_PARAMS,
      `Invalid level '${params.level}'. Must be one of: debug, info, notice, warning, error, critical, alert, emergency`);
  }
  const sessionKey = ctx.session_id || ctx.actor || 'default';
  setSessionLevel(sessionKey, level);
  info('mcp-server', `logging level set`, { session: sessionKey, level, actor: ctx.actor });
  return successResponse(id, {});
}

// ============================================================================
// Completion handler (v2.28.0)
// ============================================================================

/**
 * handle `completion/complete`.
 *
 * Per MCP spec, returns candidate argument values for a given prompt
 * or resource template placeholder. We centralize resolution by
 * argument name — so `task_id` resolves the same whether it's the
 * argument of `task-handoff` prompt or the `{task_id}` placeholder
 * in `vidhya://admin/tasks/{task_id}`.
 *
 * Validation layers:
 *   1. params.ref and params.argument must be shaped correctly.
 *   2. params.ref.type must be 'ref/prompt' or 'ref/resource'.
 *   3. The referenced prompt/resource must exist, and the argument
 *      name must actually be declared on it (else -32001).
 *   4. If argument name is not in the resolver registry, return empty
 *      (not an error — unknown but benign).
 */
async function handleCompletionComplete(id: any, params: any, ctx: MCPContext): Promise<JsonRpcResponse> {
  if (!params || typeof params !== 'object') {
    return errorResponse(id, ERR_INVALID_PARAMS, 'params required');
  }
  const ref = params.ref;
  const argument = params.argument;
  if (!ref || typeof ref !== 'object' || typeof ref.type !== 'string') {
    return errorResponse(id, ERR_INVALID_PARAMS, 'params.ref.type (string) required');
  }
  if (ref.type !== 'ref/prompt' && ref.type !== 'ref/resource') {
    return errorResponse(id, ERR_INVALID_PARAMS,
      `Invalid ref.type '${ref.type}'. Must be 'ref/prompt' or 'ref/resource'.`);
  }
  if (ref.type === 'ref/prompt' && typeof ref.name !== 'string') {
    return errorResponse(id, ERR_INVALID_PARAMS, 'params.ref.name (string) required for ref/prompt');
  }
  if (ref.type === 'ref/resource' && typeof ref.uri !== 'string') {
    return errorResponse(id, ERR_INVALID_PARAMS, 'params.ref.uri (string) required for ref/resource');
  }
  if (!argument || typeof argument !== 'object' || typeof argument.name !== 'string') {
    return errorResponse(id, ERR_INVALID_PARAMS, 'params.argument.name (string) required');
  }
  const value = typeof argument.value === 'string' ? argument.value : '';

  const { complete } = await import('./mcp-completions');
  const result = await complete(
    { ref, argument: { name: argument.name, value } },
    { role: ctx.role, actor: ctx.actor },
  );

  if ('error' in result) {
    const code =
      result.error.code === 'not-found' ? ERR_TOOL_NOT_FOUND :
      ERR_INTERNAL_ERROR;
    return errorResponse(id, code, result.error.message, {
      ref: ref.type === 'ref/prompt' ? ref.name : ref.uri,
      argument: argument.name,
    });
  }

  return successResponse(id, result);
}

// ============================================================================
// Response helpers
// ============================================================================

function successResponse(id: any, result: any): JsonRpcSuccess {
  return { jsonrpc: '2.0', id, result };
}

function errorResponse(id: any, code: number, message: string, data?: any): JsonRpcError {
  return { jsonrpc: '2.0', id, error: { code, message, ...(data ? { data } : {}) } };
}

// ============================================================================
// Manifest — public, unauthenticated metadata for external agents to
// discover the server BEFORE they authenticate. Does not include role-
// scoped tool lists; clients must call tools/list post-initialize for that.
// ============================================================================

export function getPublicManifest(): any {
  return {
    serverInfo: MCP_SERVER_INFO,
    capabilities: MCP_CAPABILITIES,
    endpoints: {
      jsonrpc: '/api/admin/agent/mcp',
      manifest: '/api/admin/agent/mcp/manifest',
    },
    auth: {
      /** External agents authenticate via the existing Anthropic-style auth middleware */
      scheme: 'bearer',
      header: 'authorization',
      required: true,
    },
    tool_count: TOOLS.length,
    methods_supported: [
      'initialize', 'ping', 'tools/list', 'tools/call',
      'resources/list', 'resources/read',
      'prompts/list', 'prompts/get',
      'logging/setLevel',
      'completion/complete',
      'notifications/initialized',
    ],
    protocol_notes: [
      'JSON-RPC 2.0 over HTTP POST (single endpoint)',
      'Tool inputs validated by JSON Schema Draft 2020-12',
      'Every tool call goes through role-based authorization',
      'Destructive tools flagged via annotations.destructiveHint=true',
      'Resources are URI-addressed (vidhya://admin/...) and read-only',
      'Prompts return MCP-formatted messages the client runs through its own LLM',
      'logging/setLevel is supported; under stdio transport events push as notifications/message, under HTTP transport events are pulled via vidhya://admin/logs/recent',
      'completion/complete resolves prompt arguments and resource template placeholders against live state (tasks, runs, exams, roles)',
    ],
  };
}
