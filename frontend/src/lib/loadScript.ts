/**
 * loadScript — promise-based, deduplicated, timeout-bounded CDN loader.
 *
 * Used by interactives that prefer a real third-party library when reachable
 * (Desmos calculator, MathBox.js) but must fall through to a built-in
 * lightweight renderer when the CDN is blocked, slow, or the user is on a
 * metered connection.
 *
 * Contract:
 *   - One <script> tag per src, regardless of how many components await it
 *   - Resolves with the global from `globalProbe` when the script loads
 *   - Rejects on `error` event, on timeout, or under prefers-reduced-data
 *   - Does not retry — caller decides whether to fall back
 */

const inflight = new Map<string, Promise<any>>();

interface LoadOptions {
  /** ms before rejecting; default 6000. */
  timeoutMs?: number;
  /** A function that returns the loaded global when ready (e.g. () => window.Desmos). */
  globalProbe: () => any;
  /** Honor prefers-reduced-data (default true). */
  honorReducedData?: boolean;
}

function isReducedData(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  try {
    return window.matchMedia('(prefers-reduced-data: reduce)').matches;
  } catch {
    return false;
  }
}

export function loadScript(src: string, opts: LoadOptions): Promise<any> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('loadScript: no window'));
  }

  const cacheKey = src;
  const cached = inflight.get(cacheKey);
  if (cached) return cached;

  const honorReducedData = opts.honorReducedData ?? true;
  if (honorReducedData && isReducedData()) {
    return Promise.reject(new Error('loadScript: prefers-reduced-data'));
  }

  // Already loaded?
  const probed = opts.globalProbe();
  if (probed) return Promise.resolve(probed);

  const timeoutMs = opts.timeoutMs ?? 6000;

  const p = new Promise<any>((resolve, reject) => {
    let settled = false;
    const tag = document.createElement('script');
    tag.src = src;
    tag.async = true;
    tag.crossOrigin = 'anonymous';

    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      reject(new Error(`loadScript: timeout after ${timeoutMs}ms (${src})`));
    }, timeoutMs);

    tag.onload = () => {
      if (settled) return;
      const g = opts.globalProbe();
      if (!g) {
        settled = true;
        clearTimeout(timer);
        reject(new Error(`loadScript: loaded but globalProbe returned falsy (${src})`));
        return;
      }
      settled = true;
      clearTimeout(timer);
      resolve(g);
    };

    tag.onerror = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reject(new Error(`loadScript: error event (${src})`));
    };

    document.head.appendChild(tag);
  });

  inflight.set(cacheKey, p);
  // On rejection, drop from cache so the next render can retry on a fresh
  // navigation (the call site usually doesn't, but the policy is correct).
  p.catch(() => inflight.delete(cacheKey));
  return p;
}

/** For tests — drop the cache so each test starts fresh. */
export function _resetLoadScriptCacheForTests(): void {
  inflight.clear();
}
