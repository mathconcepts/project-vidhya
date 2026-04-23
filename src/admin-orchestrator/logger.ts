// @ts-nocheck
/**
 * Central logger for the admin orchestrator.
 *
 * MCP's logging primitive (`logging/setLevel`) lets the client subscribe
 * to server-side log events at a chosen severity. The server then pushes
 * `notifications/message` records back to the client.
 *
 * Our challenge: the HTTP transport is request-response. We can't push
 * unsolicited notifications on an HTTP connection. But the stdio
 * transport CAN (stdout is write-at-will). So the design is:
 *
 *   1. A single Logger emitter — every component in the admin
 *      orchestrator logs through it with a severity label.
 *
 *   2. Each session can set its level via `logging/setLevel`. Events
 *      below that threshold are filtered out FOR THAT SESSION.
 *
 *   3. Subscribers register with a level + a callback. The stdio
 *      transport registers a callback that writes
 *      `notifications/message` to stdout. The HTTP transport keeps a
 *      small in-memory ring buffer so callers can read recent logs
 *      via a resource (vidhya://admin/logs/recent).
 *
 *   4. Stderr logging is unconditional — regardless of any subscribed
 *      client, every event lands in stderr for operator observability.
 *
 * MCP log levels (per spec, aligned with syslog):
 *
 *     debug  info  notice  warning  error  critical  alert  emergency
 *
 * Most of our code uses only debug/info/warning/error. notice through
 * emergency are accepted for spec-completeness but rarely emitted.
 */

export type LogLevel =
  | 'debug' | 'info' | 'notice' | 'warning' | 'error'
  | 'critical' | 'alert' | 'emergency';

/** Level ordering: higher number = more severe */
const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 0, info: 1, notice: 2, warning: 3,
  error: 4, critical: 5, alert: 6, emergency: 7,
};

export function parseLevel(raw: unknown): LogLevel | null {
  if (typeof raw !== 'string') return null;
  const lower = raw.toLowerCase();
  return (lower in LEVEL_ORDER) ? (lower as LogLevel) : null;
}

/** Returns true if event is at or above threshold (passes the filter) */
export function levelPasses(event: LogLevel, threshold: LogLevel): boolean {
  return LEVEL_ORDER[event] >= LEVEL_ORDER[threshold];
}

// ============================================================================
// Log event
// ============================================================================

export interface LogEvent {
  /** ISO timestamp */
  ts: string;
  /** Severity */
  level: LogLevel;
  /** Short message */
  message: string;
  /** Optional structured fields */
  data?: Record<string, unknown>;
  /** Human-readable origin (e.g. 'mcp-server', 'scanner', 'agent') */
  logger: string;
}

// ============================================================================
// Subscribers
// ============================================================================

type Subscriber = {
  id: string;
  level: LogLevel;
  callback: (event: LogEvent) => void;
};

const _subscribers: Subscriber[] = [];

/**
 * Register a subscriber to receive log events at or above `level`.
 * Returns an unsubscribe function.
 */
export function subscribe(
  id: string,
  level: LogLevel,
  callback: (event: LogEvent) => void,
): () => void {
  // Replace any existing subscriber with the same id so repeated
  // `logging/setLevel` calls from the same session don't stack up.
  const existing = _subscribers.findIndex(s => s.id === id);
  const entry = { id, level, callback };
  if (existing >= 0) {
    _subscribers[existing] = entry;
  } else {
    _subscribers.push(entry);
  }
  return () => {
    const idx = _subscribers.findIndex(s => s.id === id);
    if (idx >= 0) _subscribers.splice(idx, 1);
  };
}

export function unsubscribe(id: string): boolean {
  const idx = _subscribers.findIndex(s => s.id === id);
  if (idx < 0) return false;
  _subscribers.splice(idx, 1);
  return true;
}

export function listSubscribers(): Array<{ id: string; level: LogLevel }> {
  return _subscribers.map(({ id, level }) => ({ id, level }));
}

// ============================================================================
// Ring buffer — for HTTP callers who want recent events without pushing
// ============================================================================

const BUFFER_CAPACITY = 200;
const _ring: LogEvent[] = [];

export function recentEvents(limit = 50, minLevel: LogLevel = 'debug'): LogEvent[] {
  const filtered = _ring.filter(e => levelPasses(e.level, minLevel));
  return filtered.slice(-limit);
}

export function clearRingBuffer(): void {
  _ring.length = 0;
}

// ============================================================================
// Emit
// ============================================================================

/**
 * Primary emit function. Pushes to ring buffer, notifies all matching
 * subscribers, and writes to stderr for operator visibility.
 *
 * This function NEVER throws; a bad subscriber callback that throws is
 * logged to stderr and then swallowed so one broken listener cannot
 * take down the logger.
 */
export function emit(
  level: LogLevel,
  logger: string,
  message: string,
  data?: Record<string, unknown>,
): void {
  const event: LogEvent = {
    ts: new Date().toISOString(),
    level,
    message,
    data,
    logger,
  };

  // Ring buffer (bounded)
  _ring.push(event);
  if (_ring.length > BUFFER_CAPACITY) _ring.shift();

  // Subscribers
  for (const sub of _subscribers) {
    if (!levelPasses(level, sub.level)) continue;
    try {
      sub.callback(event);
    } catch (err: any) {
      // Don't recurse into emit() — write directly to stderr.
      process.stderr.write(
        `${event.ts} [vidhya-logger] [error] subscriber '${sub.id}' threw: ${err.message ?? String(err)}\n`,
      );
    }
  }

  // Stderr — always, regardless of subscribers, for operator visibility.
  // Suppress stderr when VIDHYA_LOG_STDERR=off (useful in tests).
  if (process.env.VIDHYA_LOG_STDERR !== 'off') {
    const dataStr = data ? ' ' + JSON.stringify(data) : '';
    process.stderr.write(
      `${event.ts} [${logger}] [${level}] ${message}${dataStr}\n`,
    );
  }
}

// ============================================================================
// Convenience loggers — one per severity. Each is a thin wrapper over emit().
// ============================================================================

export function debug(logger: string, message: string, data?: Record<string, unknown>): void {
  emit('debug', logger, message, data);
}
export function info(logger: string, message: string, data?: Record<string, unknown>): void {
  emit('info', logger, message, data);
}
export function notice(logger: string, message: string, data?: Record<string, unknown>): void {
  emit('notice', logger, message, data);
}
export function warning(logger: string, message: string, data?: Record<string, unknown>): void {
  emit('warning', logger, message, data);
}
export function error(logger: string, message: string, data?: Record<string, unknown>): void {
  emit('error', logger, message, data);
}

// ============================================================================
// Per-session level tracking — used by MCP logging/setLevel
// ============================================================================

const _sessionLevels = new Map<string, LogLevel>();

/** Called by the MCP dispatch for logging/setLevel */
export function setSessionLevel(sessionId: string, level: LogLevel): void {
  _sessionLevels.set(sessionId, level);
}

export function getSessionLevel(sessionId: string): LogLevel | null {
  return _sessionLevels.get(sessionId) ?? null;
}

export function clearSessionLevel(sessionId: string): void {
  _sessionLevels.delete(sessionId);
}

// ============================================================================
// Test-only reset
// ============================================================================

export function _resetLoggerForTests(): void {
  _subscribers.length = 0;
  _ring.length = 0;
  _sessionLevels.clear();
}
