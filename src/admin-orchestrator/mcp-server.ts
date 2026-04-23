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
  version: '2.24.0',
  /** Protocol version the server implements. 2024-11-05 is the stable MCP baseline. */
  protocolVersion: '2024-11-05',
};

/**
 * Capabilities this server exposes. Each top-level key tells compatible
 * MCP clients what families of calls are safe to make.
 *
 *   tools:           list + call (core); listChanged notifications unsupported
 *   resources:       list + read (v2.24.0); subscribe unsupported; listChanged unsupported
 *   prompts:         unsupported in v2.23.0 — no prompt templates exposed
 *   sampling:        unsupported — server does not ask client to generate
 *   logging:         unsupported — server does not forward logs to client
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
      'notifications/initialized',
    ],
    protocol_notes: [
      'JSON-RPC 2.0 over HTTP POST (single endpoint)',
      'Tool inputs validated by JSON Schema Draft 2020-12',
      'Every tool call goes through role-based authorization',
      'Destructive tools flagged via annotations.destructiveHint=true',
      'Resources are URI-addressed (vidhya://admin/...) and read-only',
    ],
  };
}
