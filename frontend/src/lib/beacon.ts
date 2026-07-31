/**
 * beacon.ts — batched analytics beacon (Vidhya UX doc §2.3).
 *
 * This is NOT a new analytics system. It reuses the exact same endpoint and
 * schema as `frontend/src/lib/analytics.ts` (`trackEvent`) — POST /api/analytics,
 * inserting into the existing `analytics_events` table (`event_type`,
 * `identifier`, `metadata`). Do not duplicate that endpoint or table.
 *
 * What this module adds on top: a thin batching/queuing layer with
 * `navigator.sendBeacon` delivery (falling back to `fetch({keepalive:true})`),
 * flushed on a short interval AND on `visibilitychange`/`pagehide`/`online`,
 * and queued (persisted to localStorage, best-effort) while offline. The
 * house codebase already uses localStorage extensively for durable
 * client-side state (session id, dismiss flags, feature preferences — see
 * `frontend/src/hooks/useSession.ts`, `useDismissible.ts`), so this follows
 * that convention rather than staying purely in-memory.
 *
 * IMPORTANT — the backend `/api/analytics` route (src/api/gate-routes.ts,
 * `handleAnalytics`) accepts exactly ONE event object per request; it does
 * not accept an array. So "batching" here means queuing + flushing together
 * on a schedule, not one multi-event network payload — each queued event is
 * still POSTed individually when the queue flushes. Each payload stays small
 * (a single event's JSON, well under 1KB) even though delivery is batched in
 * time. Changing the backend to accept true multi-event payloads is a
 * follow-up, out of scope here (see CLAUDE.md — avoid parallel infra; this
 * wrapper deliberately stays inside the existing endpoint's contract).
 *
 * The backend also does not currently record or truncate caller IPs at all
 * (no IP column on analytics_events, no read of req.socket.remoteAddress in
 * handleAnalytics) — so there's nothing to truncate today. If a future
 * change starts capturing IPs there, IP truncation must be added at that
 * point; flagging it here as a backend follow-up rather than fixing it in
 * this frontend-only pass.
 *
 * Event shapes (locked, per UX doc §2.3):
 *   page_view      { route, ms_to_content, device_class, offline }
 *   action         { name, route }
 *   drop           { route, last_action, elapsed }
 *   share          { artifact }
 *   pending_grade  { ms, outcome }
 *
 * The exported function signatures below are the stable public contract —
 * other pages (e.g. the diagnostic funnel) can call these without reading
 * this file's internals.
 */

const ENDPOINT = '/api/analytics';
const FLUSH_INTERVAL_MS = 4000;
const QUEUE_STORAGE_KEY = 'vidhya_beacon_queue_v1';
// Same localStorage key useSession() uses for the anonymous session id — we
// reuse it as the beacon's identifier so beacon events join the same
// `analytics_events.identifier` space as `trackEvent()` calls, without
// depending on the useSession() React hook (this module has no React import).
const SESSION_STORAGE_KEY = 'gate_session_id';

interface QueuedEvent {
  event_type: 'page_view' | 'action' | 'drop' | 'share' | 'pending_grade';
  identifier: string;
  metadata: Record<string, unknown>;
}

let queue: QueuedEvent[] = [];
let wired = false;

function getIdentifier(): string {
  try {
    return localStorage.getItem(SESSION_STORAGE_KEY) || 'anon-beacon';
  } catch {
    return 'anon-beacon';
  }
}

function deviceClass(): 'mobile' | 'desktop' {
  if (typeof navigator === 'undefined' || !navigator.userAgent) return 'desktop';
  return /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) ? 'mobile' : 'desktop';
}

function isOffline(): boolean {
  return typeof navigator !== 'undefined' && 'onLine' in navigator ? !navigator.onLine : false;
}

function loadPersistedQueue(): QueuedEvent[] {
  try {
    const raw = localStorage.getItem(QUEUE_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persistQueue(): void {
  try {
    if (queue.length === 0) {
      localStorage.removeItem(QUEUE_STORAGE_KEY);
    } else {
      localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
    }
  } catch {
    // best-effort — private mode / full storage / disabled storage
  }
}

function sendOne(evt: QueuedEvent): void {
  const body = JSON.stringify(evt);
  if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
    const blob = new Blob([body], { type: 'application/json' });
    if (navigator.sendBeacon(ENDPOINT, blob)) return;
  }
  // Fallback — fire-and-forget, keepalive so it survives page unload.
  fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    keepalive: true,
  }).catch(() => {});
}

function flush(): void {
  if (queue.length === 0 || isOffline()) return; // stay queued, retry next flush
  const pending = queue;
  queue = [];
  persistQueue();
  for (const evt of pending) sendOne(evt);
}

function ensureWired(): void {
  if (wired || typeof window === 'undefined') return;
  wired = true;
  queue = [...loadPersistedQueue(), ...queue];
  setInterval(flush, FLUSH_INTERVAL_MS);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flush();
  });
  window.addEventListener('pagehide', flush);
  window.addEventListener('online', flush);
}

function enqueue(event_type: QueuedEvent['event_type'], metadata: Record<string, unknown>): void {
  ensureWired();
  queue.push({
    event_type,
    identifier: getIdentifier(),
    metadata: { ...metadata, timestamp: new Date().toISOString() },
  });
  persistQueue();
}

// ─── Public API ────────────────────────────────────────────────────────────

/**
 * Record a page view. Call once from a page's mount effect.
 * @param route - the route path (e.g. '/', '/diagnostic').
 * @param msToContent - optional ms from navigation to meaningful content paint.
 */
export function trackPageView(route: string, msToContent?: number): void {
  enqueue('page_view', {
    route,
    ms_to_content: msToContent ?? null,
    device_class: deviceClass(),
    offline: isOffline(),
  });
}

/**
 * Record a named user action taken on a route (button taps, CTA clicks, etc).
 * @param name - short action identifier, e.g. 'diagnostic_cta_click'.
 * @param route - the route the action happened on.
 */
export function trackAction(name: string, route: string): void {
  enqueue('action', { name, route });
}

/**
 * Record a funnel drop — the student left mid-flow.
 * @param route - the route they dropped from.
 * @param lastAction - the last action name recorded before the drop.
 * @param elapsedMs - time spent on the flow before dropping, in ms.
 */
export function trackDrop(route: string, lastAction: string, elapsedMs: number): void {
  enqueue('drop', { route, last_action: lastAction, elapsed: elapsedMs });
}

/**
 * Record a share action (e.g. sharing a result, digest, or audit link).
 * @param artifact - what was shared, e.g. 'weekly_digest'.
 */
export function trackShare(artifact: string): void {
  enqueue('share', { artifact });
}

/**
 * Record how long a pending (queued) grade took to resolve, and its outcome.
 * @param ms - wait time in ms.
 * @param outcome - e.g. 'graded', 'timeout', 'error'.
 */
export function trackPendingGrade(ms: number, outcome: string): void {
  enqueue('pending_grade', { ms, outcome });
}
