// @ts-nocheck
/**
 * MCP stdio transport — persistent process speaking newline-delimited
 * JSON-RPC over stdin/stdout, for Claude Desktop and any client that
 * launches MCP servers as subprocesses.
 *
 * Wire format
 * ===========
 *
 * stdin:  one JSON-RPC request per line (newline-delimited JSON).
 * stdout: one JSON-RPC response per line.
 * stderr: structured log lines (human-readable), never mixed with stdout.
 *
 * MCP clients expect stdout to contain ONLY valid JSON-RPC responses.
 * Any incidental log output must go to stderr or the transport breaks.
 *
 * Environment variables
 * =====================
 *
 *   VIDHYA_MCP_ROLE       — role the client is assumed to act as
 *                           (owner, admin, content-ops, ..., analyst)
 *                           Default: 'admin'
 *
 *   VIDHYA_MCP_ACTOR      — user id attributed to every tool invocation
 *                           Default: 'stdio-client'
 *
 *   VIDHYA_LLM_PRIMARY_* — LLM provider config (same as HTTP server)
 *
 * Claude Desktop config
 * =====================
 *
 *   {
 *     "mcpServers": {
 *       "vidhya-admin": {
 *         "command": "npx",
 *         "args": ["-y", "tsx", "/absolute/path/to/src/admin-orchestrator/stdio-server.ts"],
 *         "env": {
 *           "VIDHYA_MCP_ROLE": "admin",
 *           "VIDHYA_LLM_PRIMARY_PROVIDER": "anthropic",
 *           "VIDHYA_LLM_PRIMARY_KEY": "sk-ant-..."
 *         }
 *       }
 *     }
 *   }
 *
 * On Linux/macOS this launches a persistent Node process; Claude
 * Desktop sends JSON-RPC down its stdin and parses lines from its
 * stdout. Clean shutdown on SIGTERM/SIGINT.
 *
 * Robustness
 * ==========
 *
 *   - Partial lines buffered until newline seen
 *   - Malformed JSON → JSON-RPC parse error response (-32700) with id=null
 *   - Handler exceptions caught and converted to internal-error envelopes
 *   - stdout ALWAYS flushed per response (no batching that could
 *     hold the response past client timeout)
 *   - Unhandled rejection + uncaught exception logged to stderr
 *     without exiting, so one bad request doesn't kill the session
 */

import { handleMCPRequest, type JsonRpcRequest, type JsonRpcResponse, type MCPContext } from './mcp-server';
import type { RoleId } from './types';

// ============================================================================
// Logger — writes to stderr ONLY so stdout stays protocol-pure
// ============================================================================

const LOG_PREFIX = '[vidhya-mcp-stdio]';
function log(level: 'info' | 'warn' | 'error', msg: string, extra?: any): void {
  const now = new Date().toISOString();
  const line = extra
    ? `${now} ${LOG_PREFIX} [${level}] ${msg} ${JSON.stringify(extra)}`
    : `${now} ${LOG_PREFIX} [${level}] ${msg}`;
  process.stderr.write(line + '\n');
}

// ============================================================================
// Context construction
// ============================================================================

function buildContext(): MCPContext {
  const role = (process.env.VIDHYA_MCP_ROLE as RoleId) || 'admin';
  const actor = process.env.VIDHYA_MCP_ACTOR || 'stdio-client';
  return { role, actor };
}

// ============================================================================
// Write a JSON-RPC response to stdout
// ============================================================================

function writeResponse(response: JsonRpcResponse): void {
  try {
    const line = JSON.stringify(response);
    // Single write + explicit newline so clients parsing line-by-line
    // never see a partial message.
    process.stdout.write(line + '\n');
  } catch (err: any) {
    log('error', `Failed to serialise response`, { error: err.message, id: (response as any)?.id });
  }
}

// ============================================================================
// Parse error envelope — used when stdin delivers malformed JSON
// ============================================================================

function parseErrorResponse(id: any, message: string): JsonRpcResponse {
  return {
    jsonrpc: '2.0',
    id: id ?? null,
    error: { code: -32700, message },
  };
}

// ============================================================================
// Process one JSON-RPC request
// ============================================================================

async function processLine(line: string, ctx: MCPContext): Promise<void> {
  const trimmed = line.trim();
  if (!trimmed) return; // ignore blank lines

  let request: JsonRpcRequest;
  try {
    request = JSON.parse(trimmed);
  } catch (err: any) {
    log('warn', `Malformed JSON from stdin`, { preview: trimmed.slice(0, 80) });
    writeResponse(parseErrorResponse(null, `Parse error: ${err.message}`));
    return;
  }

  let response: JsonRpcResponse;
  try {
    response = await handleMCPRequest(request, ctx);
  } catch (err: any) {
    // handleMCPRequest is supposed to never throw — catch here belt-and-braces.
    log('error', `Handler threw unexpectedly`, { error: err.message, stack: err.stack });
    response = {
      jsonrpc: '2.0',
      id: request.id ?? null,
      error: { code: -32603, message: err.message ?? 'Internal error' },
    };
  }

  writeResponse(response);
}

// ============================================================================
// stdin reader — line-buffered
// ============================================================================

function startStdinReader(ctx: MCPContext): void {
  let buffer = '';
  process.stdin.setEncoding('utf8');

  process.stdin.on('data', (chunk: string) => {
    buffer += chunk;
    // Split on newline, process each complete line, keep tail in buffer
    let newlineIdx = buffer.indexOf('\n');
    while (newlineIdx !== -1) {
      const line = buffer.slice(0, newlineIdx);
      buffer = buffer.slice(newlineIdx + 1);
      // Fire-and-forget; processLine itself writes the response.
      processLine(line, ctx).catch(err => {
        log('error', `processLine error (should not happen)`, { error: err.message });
      });
      newlineIdx = buffer.indexOf('\n');
    }
  });

  process.stdin.on('end', () => {
    if (buffer.trim().length > 0) {
      // Flush a final message without a terminator
      processLine(buffer, ctx).catch(err => {
        log('error', `Final processLine error`, { error: err.message });
      });
    }
    log('info', 'stdin closed; shutting down');
    process.exit(0);
  });

  process.stdin.on('error', (err: any) => {
    log('error', 'stdin error', { error: err.message });
  });
}

// ============================================================================
// Signal handling for graceful shutdown
// ============================================================================

function installSignalHandlers(): void {
  for (const sig of ['SIGTERM', 'SIGINT', 'SIGHUP']) {
    process.on(sig as any, () => {
      log('info', `received ${sig}, shutting down`);
      process.exit(0);
    });
  }

  // Don't crash the session on a single bad request
  process.on('unhandledRejection', (reason: any) => {
    log('error', 'unhandledRejection', { reason: reason?.message ?? String(reason) });
  });
  process.on('uncaughtException', (err: Error) => {
    log('error', 'uncaughtException', { error: err.message, stack: err.stack });
  });
}

// ============================================================================
// Entry point — only runs when invoked directly (not when imported)
// ============================================================================

async function main(): Promise<void> {
  const ctx = buildContext();
  log('info', `starting stdio MCP server`, {
    role: ctx.role,
    actor: ctx.actor,
    protocol: '2024-11-05',
    pid: process.pid,
  });

  installSignalHandlers();
  startStdinReader(ctx);

  // Pre-load exam adapters so the scanner sees them. Without this step,
  // the first tools/list or resources/list call to a fresh stdio
  // process returns an empty exam-builder module.
  try {
    await import('../exams/adapters/index');
    log('info', 'exam adapters preloaded');
  } catch (err: any) {
    log('warn', 'could not preload exam adapters', { error: err.message });
  }

  // Keep alive until stdin closes or a signal arrives
  process.stdin.resume();
}

// Only run main() when this file is the program entry point.
// Under tsx, the check below is approximate but sufficient for our
// launch scenarios.
const isEntryPoint =
  typeof import.meta !== 'undefined' &&
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (import.meta as any).url &&
  process.argv[1] &&
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (import.meta as any).url.endsWith(process.argv[1].split('/').pop()!);

if (isEntryPoint) {
  main().catch(err => {
    log('error', 'fatal startup error', { error: err.message, stack: err.stack });
    process.exit(1);
  });
}

// Also export pieces for testing (the line-processing function is the
// interesting unit to smoke-test without actually spawning a subprocess).
export { processLine, buildContext, writeResponse, parseErrorResponse };
