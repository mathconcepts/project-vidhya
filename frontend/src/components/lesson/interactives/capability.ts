/**
 * capability — feature detection for the interactive render tiers.
 *
 * Written for the offline-venue case: a demo laptop or a floor device with no
 * network and possibly no working WebGL. The rule is feature detection, never
 * user-agent guessing, and the answer must be available SYNCHRONOUSLY so a
 * caller can pick the right tier on first paint instead of mounting a heavy
 * path and waiting for it to fail.
 *
 * Prior art this replaces: the MathBox component used to decide by *attempting*
 * a CDN load and catching the rejection, which cost a 6-second timeout on an
 * offline device before it fell back to SVG. Six seconds of blank box reads as
 * a broken product. Probing costs microseconds.
 */

/** Cached so repeated atom mounts don't each create a throwaway GL context. */
let webglCache: boolean | null = null;

/**
 * True when the browser can actually create a WebGL context.
 *
 * Creating and discarding one real context is the only reliable test — the
 * presence of `window.WebGLRenderingContext` says the API exists, not that the
 * GPU/driver will grant a context, which is exactly what fails on the low-end
 * hardware this needs to survive.
 */
export function hasWebGL(): boolean {
  if (webglCache !== null) return webglCache;
  if (typeof document === 'undefined') return (webglCache = false);
  try {
    const canvas = document.createElement('canvas');
    const gl =
      canvas.getContext('webgl') ??
      canvas.getContext('experimental-webgl');
    webglCache = gl !== null;
    // Release the context immediately; some drivers cap the number of live ones.
    if (gl && 'getExtension' in gl) {
      (gl as WebGLRenderingContext).getExtension('WEBGL_lose_context')?.loseContext();
    }
  } catch {
    webglCache = false;
  }
  return webglCache;
}

/**
 * True when the device looks too small for a heavy 3D payload.
 *
 * `navigator.deviceMemory` is Chromium-only and coarse (rounded to powers of
 * two, capped at 8). Absence is treated as "not constrained" rather than
 * "constrained" — refusing to render richer content on Safari, which never
 * reports the field, would punish the majority to protect a minority.
 */
export function isMemoryConstrained(): boolean {
  if (typeof navigator === 'undefined') return false;
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  return typeof mem === 'number' && mem <= 2;
}

/** True when the user asked the OS to save data; heavy tiers should stay off. */
export function prefersReducedData(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  try {
    return window.matchMedia('(prefers-reduced-data: reduce)').matches;
  } catch {
    return false;
  }
}

/**
 * The single question callers should ask before choosing a WebGL-backed tier.
 * Every "no" answer routes to the SVG tier, which has no dependencies and
 * therefore cannot fail at a venue with no network.
 */
export function canRenderWebGLTier(): boolean {
  return hasWebGL() && !isMemoryConstrained() && !prefersReducedData();
}

/** Test seam — resets the cached probe between cases. */
export function __resetCapabilityCache(): void {
  webglCache = null;
}
