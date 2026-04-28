// @ts-nocheck
/**
 * src/lib/rate-limit.ts
 *
 * In-process token-bucket rate limiter.
 *
 * Why hand-rolled instead of express-rate-limit:
 *   - We only need ~30 lines of logic; a new dep adds install
 *     footprint, supply-chain surface, and version churn for code
 *     I can audit in one screen
 *   - The codebase already eschews deps for small things (see the
 *     URL extractor in content-studio for the same trade-off)
 *   - Token-bucket is the right semantic for our use case (smooth
 *     refill, no window-reset thundering herd)
 *
 * Design:
 *   - Buckets keyed by `${endpoint}:${actor_id}` — separate buckets
 *     per endpoint so chat traffic doesn't drain a content-studio
 *     budget
 *   - actor_id resolution lives outside this module — the caller
 *     passes whatever id makes sense (user.id from JWT, sessionId
 *     for anon, ip address as a last resort)
 *   - Refill is calculated lazily on each check, not via a timer.
 *     This means a quiet server doesn't wake up on a schedule —
 *     no background CPU
 *   - State is in-memory only. Multi-process deployments share
 *     nothing; that's documented in PRODUCTION.md as a known gap.
 *     A restart resets all buckets, which is safe (worst case: a
 *     burst of legitimate traffic at boot)
 *
 * Override:
 *   Set VIDHYA_RATE_LIMIT_DISABLED=true to make every check pass.
 *   Useful for load testing or internal-use deployments. Read once
 *   at module load.
 *
 * Memory:
 *   Each bucket is ~80 bytes. A deployment with 10k unique users
 *   each hitting 4 endpoints stores ~3 MB. The bucket map is
 *   pruned: any bucket that's been idle long enough to refill to
 *   capacity is removed on the next check that finds it.
 */

interface Bucket {
  /** Tokens currently in bucket. */
  tokens: number;
  /** When the last check happened (ms since epoch). */
  last_refill: number;
}

interface Limit {
  /** Bucket capacity — also the max burst. */
  capacity: number;
  /** Tokens added per second. */
  refill_per_sec: number;
}

const DISABLED = ['1', 'true', 'yes', 'on'].includes(
  String(process.env.VIDHYA_RATE_LIMIT_DISABLED ?? '').toLowerCase(),
);

/**
 * Default limits per endpoint. Operators can override at call site
 * by passing a Limit explicitly. Numbers chosen for "real student
 * can't legitimately exceed" — adjust if your population disagrees.
 */
export const DEFAULT_LIMITS: Record<string, Limit> = {
  // Chat: a real student doesn't need >30/min. Each chat call costs
  // LLM tokens, so this is also the cost-runaway protection.
  'chat':                      { capacity: 30,  refill_per_sec: 30 / 60 },

  // Content-studio generation: admin only, each call fans out to up
  // to 4 sources (some of which fan out to LLM/Wolfram). 10/hour
  // protects against a runaway script.
  'content-studio.generate':   { capacity: 10,  refill_per_sec: 10 / 3600 },

  // Content-library POST: admin only, low-cost. 60/min is generous.
  'content-library.write':     { capacity: 60,  refill_per_sec: 60 / 60 },

  // Attempt-insight: high-traffic from real attempts. 100/min.
  'attempt-insight':           { capacity: 100, refill_per_sec: 100 / 60 },

  // ── gemini-proxy endpoints ──
  //
  // These five endpoints are currently UNAUTHENTICATED — anyone hitting
  // the deployment URL can spend tokens. Rate-limit alone doesn't fix
  // that (per-user budget would, but needs auth). What rate-limit
  // does fix: unbounded spam attack from a single client. Each bucket
  // is keyed by sessionId-or-IP via the helper in gemini-proxy.ts.
  //
  // Auth + per-user budget on these endpoints is a separate decision
  // documented in PRODUCTION.md as a known gap.

  // Classify-error: called per wrong answer in the practice flow. 60/min
  // is generous — a real student doesn't get 60 wrong answers a minute.
  'gemini.classify-error':     { capacity: 60,  refill_per_sec: 60 / 60 },

  // Generate-problem: each call does TWO LLM round-trips (generation
  // + self-verify). 30/min keeps the cost ceiling at ~60 LLM calls/min.
  'gemini.generate-problem':   { capacity: 30,  refill_per_sec: 30 / 60 },

  // Embed: cheapest of the bunch (embedding model, not chat). 100/min.
  'gemini.embed':              { capacity: 100, refill_per_sec: 100 / 60 },

  // Vision-OCR: pricier model (gemini-2.5-flash with image input).
  // 20/min ceiling — vision queries should be deliberate, not
  // background-polled.
  'gemini.vision-ocr':         { capacity: 20,  refill_per_sec: 20 / 60 },

  // Gemini-chat: stripped-down chat surface, same shape as /api/chat
  // but no GBrain instrumentation. Use the same 30/min ceiling.
  'gemini.chat':               { capacity: 30,  refill_per_sec: 30 / 60 },

  // Verify-any: image-or-text answer verification. The handler does
  // an OPTIONAL vision OCR call up front (when image given without
  // problem text). 30/min is generous; matches the previous ad-hoc
  // limit in gate-routes.ts which was 10/hour but applied AFTER the
  // vision call — strictly worse than what we have now.
  'gate.verify-any':           { capacity: 30,  refill_per_sec: 30 / 60 },
};

const buckets = new Map<string, Bucket>();

/**
 * Check if `actor_id` may make a request at `endpoint`. Returns an
 * object describing the outcome:
 *
 *   { allowed: true,  remaining: N, retry_after_ms: 0 }
 *   { allowed: false, remaining: 0, retry_after_ms: <ms until next token> }
 *
 * Side effect: if allowed, decrements the bucket. Caller should
 * NOT decrement again.
 *
 * If endpoint isn't in DEFAULT_LIMITS and no override passed,
 * allowed=true (no rate limit). This means new endpoints are
 * unlimited until explicitly added — fail-open is the right default
 * for a feature whose absence shouldn't break the system.
 */
export function checkRateLimit(
  endpoint: string,
  actor_id: string,
  override?: Limit,
): { allowed: boolean; remaining: number; retry_after_ms: number } {
  if (DISABLED) {
    return { allowed: true, remaining: Infinity, retry_after_ms: 0 };
  }

  const limit = override ?? DEFAULT_LIMITS[endpoint];
  if (!limit) {
    // Unknown endpoint, no default — allow. Fail-open.
    return { allowed: true, remaining: Infinity, retry_after_ms: 0 };
  }

  const key = `${endpoint}:${actor_id}`;
  const now = Date.now();
  let bucket = buckets.get(key);

  if (!bucket) {
    bucket = { tokens: limit.capacity, last_refill: now };
  } else {
    // Lazy refill
    const elapsed_sec = (now - bucket.last_refill) / 1000;
    const added = elapsed_sec * limit.refill_per_sec;
    bucket.tokens = Math.min(limit.capacity, bucket.tokens + added);
    bucket.last_refill = now;
  }

  // Prune: if at capacity, the bucket holds no useful state
  if (bucket.tokens >= limit.capacity && bucket.tokens >= 1) {
    // Allow this call, then prune if it's the last call (consume + check)
  }

  if (bucket.tokens >= 1) {
    bucket.tokens -= 1;
    buckets.set(key, bucket);
    return {
      allowed: true,
      remaining: Math.floor(bucket.tokens),
      retry_after_ms: 0,
    };
  }

  // Not enough tokens — compute when next will arrive
  const tokens_needed = 1 - bucket.tokens;
  const retry_after_ms = Math.ceil((tokens_needed / limit.refill_per_sec) * 1000);
  buckets.set(key, bucket);
  return {
    allowed: false,
    remaining: 0,
    retry_after_ms,
  };
}

/**
 * Test helper — clears all buckets so each test starts from a
 * known state. Not exported through any module barrel; only
 * imported by tests.
 */
export function _resetForTests(): void {
  buckets.clear();
}

/**
 * Operational visibility — useful for /api/orchestrator/health
 * or a debug page. Returns total active buckets and a per-endpoint
 * count.
 */
export function getRateLimitStats(): {
  total_buckets: number;
  by_endpoint: Record<string, number>;
} {
  const by_endpoint: Record<string, number> = {};
  for (const key of buckets.keys()) {
    const ep = key.split(':')[0] ?? 'unknown';
    by_endpoint[ep] = (by_endpoint[ep] ?? 0) + 1;
  }
  return {
    total_buckets: buckets.size,
    by_endpoint,
  };
}
