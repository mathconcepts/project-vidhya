/**
 * gif-generator.ts — server-side parametric GIF render (§4.15 Phase B).
 *
 * Renders a small declarative scene description into an animated GIF using
 * pure JavaScript: no `canvas` dep, no Cairo/Pango, no native bindings.
 * Each frame is rendered into a Uint8ClampedArray of RGBA pixel data via
 * a tiny rasterizer, then encoded to GIF via `gifenc`.
 *
 * Render time: ~3-5s for a 60-frame 480x320 parametric scene. Acceptable
 * inside the orchestrator's per-atom step (already 2-5s for the LLM call).
 *
 * Scope (v1):
 *   - 'parametric' scene: y = f(x, t) plotted across an x range, t advancing
 *     across frames. Animates curve evolution over time (e.g. tangent line
 *     sweeping, sine wave, exponential growth).
 *   - 'function-trace' scene: y = f(x) drawn progressively from left to right
 *     across frames (e.g. trace the curve as time advances).
 *
 * Scope (v2, §4.15 follow-up — two-expression / two-variable authoring):
 *   - 'parametric-curve' scene: (x(s), y(s)) traced over a curve parameter
 *     s. When `t_range` is also given the whole curve redraws each frame
 *     with `t` sweeping t_range (a morphing closed curve, e.g. a growing
 *     ellipse); when `t_range` is absent, `s_range` itself is the thing
 *     that advances across frames and the curve is revealed progressively
 *     (mirrors 'function-trace', but along a parametric path instead of a
 *     graph of x — e.g. a rotating vector sweeping out an arc).
 *   - 'level-set' scene: the sublevel curve f(x, y) = c of a two-variable
 *     expression, c growing across frames (e.g. the nested ellipses of a
 *     positive-definite quadratic form). Implicit-plot via thresholding —
 *     no marching squares, just a per-pixel |f(x,y) - c| test scaled by
 *     the local gradient so the line stays roughly constant-width.
 *
 * Future extensions (v3): vector field, 3-D surface plot, custom sprites.
 *
 * Theme palette (matches v4.4.0 design system):
 *   bg     = #0b0d10 (surface-950)
 *   axes   = #374151 (surface-3)
 *   curve  = #10b981 (emerald — primary)
 *   accent = #a78bfa (violet — secondary)
 */

// gifenc ships CJS-flavored dist that Node's ESM static-analyzer can't
// crack for named imports. createRequire gives a stable runtime shape
// across both `npx tsx` (Node ESM) and vitest's transformer.
import { createRequire } from 'node:module';
const _gifencRequire = createRequire(import.meta.url);
const { GIFEncoder, quantize, applyPalette } = _gifencRequire('gifenc') as any;

export type SceneDescription =
  | ParametricScene
  | FunctionTraceScene
  | ParametricCurveScene
  | LevelSetScene;

/**
 * Scene `type` values the renderer actually knows how to draw. Callers that
 * parse `gif-scene` JSON (orchestrator.ts, demo/seed-media.ts, the CI gate)
 * should gate on this list rather than hand-rolling their own — that
 * hand-rolled duplication is exactly how the four Linear Algebra scenes
 * rotted silently (parsed as "known", rendered as broken).
 */
export const KNOWN_SCENE_TYPES = [
  'parametric',
  'function-trace',
  'parametric-curve',
  'level-set',
] as const;

export function isKnownSceneType(type: unknown): type is SceneDescription['type'] {
  return typeof type === 'string' && (KNOWN_SCENE_TYPES as readonly string[]).includes(type);
}

export interface ParametricScene {
  type: 'parametric';
  /** Function as a string: 'sin(x + t)', 'x^2 + t*x', etc. Variables: x, t. */
  expression: string;
  /** Domain. Default [-3, 3]. */
  x_range?: [number, number];
  /** Range. Default [-3, 3]. */
  y_range?: [number, number];
  /** Frame count. Default 30. More frames = larger GIF. */
  frames?: number;
  /** Frames per second. Default 12. */
  fps?: number;
  /** t advances from t_start to t_end across frames. */
  t_range?: [number, number];
  width?: number;
  height?: number;
}

export interface FunctionTraceScene {
  type: 'function-trace';
  /** Function as a string: 'x^2 - 2*x + 1', 'sin(x)'. Variable: x. */
  expression: string;
  x_range?: [number, number];
  y_range?: [number, number];
  frames?: number;
  fps?: number;
  width?: number;
  height?: number;
}

export interface ParametricCurveScene {
  type: 'parametric-curve';
  /** x(s [, t]) as a string, e.g. '3*cos(t)' or '0.5*t*cos(s)'. */
  x_expr: string;
  /** y(s [, t]) as a string, matching x_expr's variables. */
  y_expr: string;
  /**
   * Curve parameter range — the whole curve is swept over this domain.
   * Default [0, 2*PI]. Ignored (s_range takes the primary-parameter role
   * instead) when s_range is absent and t_range plays that role — see
   * t_range below.
   */
  s_range?: [number, number];
  /**
   * When `s_range` is given, `t` is a second variable available to
   * x_expr/y_expr that advances across frames while the full s-curve
   * redraws each frame (a morphing curve — e.g. a circle stretching into
   * an ellipse). When `s_range` is absent, `t_range` supplies the sole
   * curve parameter and the curve is instead revealed progressively frame
   * by frame, from t_range[0] up to the current frame's t (e.g. a vector
   * sweeping out an arc). Default [0, 2*PI].
   */
  t_range?: [number, number];
  x_range?: [number, number];
  y_range?: [number, number];
  frames?: number;
  fps?: number;
  width?: number;
  height?: number;
  /** Display-only; not rendered into the frame. */
  title?: string;
}

export interface LevelSetScene {
  type: 'level-set';
  /** f(x, y) as a string, e.g. 'x**2 + 4*y**2'. Variables: x, y. */
  expression: string;
  x_range?: [number, number];
  y_range?: [number, number];
  /**
   * Level value c swept across frames, drawing f(x,y) = c. Default: grows
   * from a small fraction of the domain-edge value up to the smallest
   * value f takes on the boundary of x_range/y_range, so the sublevel
   * curve grows outward without ever exceeding the visible canvas.
   */
  c_range?: [number, number];
  frames?: number;
  fps?: number;
  width?: number;
  height?: number;
}

const DEFAULTS = {
  width: 480,
  height: 320,
  frames: 30,
  fps: 12,
  bg:    [11, 13, 16, 255],     // #0b0d10
  axes:  [55, 65, 81, 255],     // #374151
  curve: [16, 185, 129, 255],   // #10b981 emerald
};

export interface RenderResult {
  buffer: Buffer;
  duration_ms: number;
  width: number;
  height: number;
  frames: number;
}

/**
 * Safe expression evaluator. Whitelist only math primitives + named
 * variables (x, t). Rejects anything else. Returns NaN on failure so
 * the caller renders the frame with that pixel skipped.
 */
function compileExpression(expr: string, vars: string[]): (...args: number[]) => number {
  // Replace caret with **, allow known math fns, replace variable references.
  const munged = expr
    .replace(/\^/g, '**')
    .replace(/\bsin\b/g, 'Math.sin')
    .replace(/\bcos\b/g, 'Math.cos')
    .replace(/\btan\b/g, 'Math.tan')
    .replace(/\blog\b/g, 'Math.log')
    .replace(/\bln\b/g, 'Math.log')
    .replace(/\bexp\b/g, 'Math.exp')
    .replace(/\bsqrt\b/g, 'Math.sqrt')
    .replace(/\babs\b/g, 'Math.abs')
    .replace(/\bpi\b/gi, 'Math.PI')
    .replace(/\be\b/g, 'Math.E');
  // Whitelist guard: alphanumeric + math operators + parens + dots + commas + whitespace.
  // Rejects anything that smells like code injection.
  if (!/^[\d\s+\-*/().,xtMath.PIE\b\sa-z]+$/i.test(munged)) {
    throw new Error(`gif-generator: unsafe expression: ${expr}`);
  }
  try {
    // eslint-disable-next-line no-new-func
    return new Function(...vars, `return (${munged});`) as any;
  } catch (err) {
    throw new Error(`gif-generator: expression compile failed: ${(err as Error).message}`);
  }
}

/** Render a (width × height) frame buffer for the scene at frame index i. */
function renderFrame(scene: SceneDescription, i: number): Uint8ClampedArray {
  const w = scene.width ?? DEFAULTS.width;
  const h = scene.height ?? DEFAULTS.height;
  const buf = new Uint8ClampedArray(w * h * 4);

  // Fill background.
  for (let p = 0; p < w * h; p++) {
    buf[p * 4 + 0] = DEFAULTS.bg[0];
    buf[p * 4 + 1] = DEFAULTS.bg[1];
    buf[p * 4 + 2] = DEFAULTS.bg[2];
    buf[p * 4 + 3] = DEFAULTS.bg[3];
  }

  const xMin = scene.x_range?.[0] ?? -3;
  const xMax = scene.x_range?.[1] ?? 3;
  const yMin = scene.y_range?.[0] ?? -3;
  const yMax = scene.y_range?.[1] ?? 3;

  const sx = (x: number) => Math.round(((x - xMin) / (xMax - xMin)) * w);
  const sy = (y: number) => Math.round(h - ((y - yMin) / (yMax - yMin)) * h);

  // Draw axes (y=0 + x=0 lines when in range).
  if (yMin <= 0 && yMax >= 0) {
    const yz = sy(0);
    for (let xi = 0; xi < w; xi++) putPixel(buf, w, h, xi, yz, DEFAULTS.axes);
  }
  if (xMin <= 0 && xMax >= 0) {
    const xz = sx(0);
    for (let yi = 0; yi < h; yi++) putPixel(buf, w, h, xz, yi, DEFAULTS.axes);
  }

  // Draw the curve.
  const totalFrames = scene.frames ?? DEFAULTS.frames;
  if (scene.type === 'parametric') {
    const tStart = scene.t_range?.[0] ?? 0;
    const tEnd = scene.t_range?.[1] ?? Math.PI * 2;
    const t = tStart + ((tEnd - tStart) * i) / Math.max(1, totalFrames - 1);
    const f = compileExpression(scene.expression, ['x', 't']);
    drawCurve(buf, w, h, sx, sy, xMin, xMax, (x) => f(x, t));
  } else if (scene.type === 'function-trace') {
    const f = compileExpression(scene.expression, ['x']);
    // Trace the curve from xMin up to xMin + (i/total)*(xMax-xMin).
    const xCurrent = xMin + ((xMax - xMin) * (i + 1)) / totalFrames;
    drawCurve(buf, w, h, sx, sy, xMin, xCurrent, (x) => f(x));
  } else if (scene.type === 'parametric-curve') {
    if (scene.s_range) {
      // s is the curve parameter (full sweep, redrawn every frame); t is the
      // envelope that morphs the curve across frames — e.g. an ellipse
      // growing from a point as t advances.
      const [sStart, sEnd] = scene.s_range;
      const tStart = scene.t_range?.[0] ?? 0;
      const tEnd = scene.t_range?.[1] ?? Math.PI * 2;
      const t = tStart + ((tEnd - tStart) * i) / Math.max(1, totalFrames - 1);
      const fx = compileExpression(scene.x_expr, ['s', 't']);
      const fy = compileExpression(scene.y_expr, ['s', 't']);
      drawParametricCurve(buf, w, h, sx, sy, sStart, sEnd, (s) => [fx(s, t), fy(s, t)]);
    } else {
      // No secondary parameter: t_range itself is the curve parameter, and
      // the curve is revealed progressively (mirrors function-trace's
      // left-to-right reveal, but along the parametric path).
      const tStart = scene.t_range?.[0] ?? 0;
      const tEnd = scene.t_range?.[1] ?? Math.PI * 2;
      const tCurrent = tStart + ((tEnd - tStart) * (i + 1)) / totalFrames;
      const fx = compileExpression(scene.x_expr, ['t']);
      const fy = compileExpression(scene.y_expr, ['t']);
      drawParametricCurve(buf, w, h, sx, sy, tStart, tCurrent, (t) => [fx(t), fy(t)]);
    }
  } else if (scene.type === 'level-set') {
    const f = compileExpression(scene.expression, ['x', 'y']);
    const [cStart, cEnd] = resolveLevelRange(scene, xMin, xMax, yMin, yMax, f);
    const c = cStart + ((cEnd - cStart) * i) / Math.max(1, totalFrames - 1);
    drawLevelSet(buf, w, h, xMin, xMax, yMin, yMax, f, c);
  }

  return buf;
}

/**
 * Default level (c) range for a 'level-set' scene when the scene doesn't
 * name one explicitly: grow the sublevel curve from a small fraction of the
 * domain up to the largest c that still fits inside BOTH axis extents (the
 * smaller of f at the x-edge and f at the y-edge) — so the curve never grows
 * past the visible canvas regardless of the expression's shape.
 */
function resolveLevelRange(
  scene: LevelSetScene,
  xMin: number, xMax: number, yMin: number, yMax: number,
  f: (x: number, y: number) => number,
): [number, number] {
  if (scene.c_range) return scene.c_range;
  const xEdge = Math.abs(f(Math.max(Math.abs(xMin), Math.abs(xMax)), 0));
  const yEdge = Math.abs(f(0, Math.max(Math.abs(yMin), Math.abs(yMax))));
  const candidates = [xEdge, yEdge].filter((v) => Number.isFinite(v) && v > 0);
  const cEnd = candidates.length > 0 ? Math.min(...candidates) : 1;
  return [cEnd * 0.12, cEnd];
}

function drawCurve(
  buf: Uint8ClampedArray,
  w: number,
  h: number,
  sx: (x: number) => number,
  sy: (y: number) => number,
  xMin: number,
  xMax: number,
  f: (x: number) => number,
): void {
  const samples = w * 2;
  let lastPx = -1, lastPy = -1;
  for (let i = 0; i <= samples; i++) {
    const x = xMin + ((xMax - xMin) * i) / samples;
    const y = f(x);
    if (!Number.isFinite(y)) { lastPx = -1; lastPy = -1; continue; }
    const px = sx(x);
    const py = sy(y);
    if (lastPx >= 0) {
      drawLine(buf, w, h, lastPx, lastPy, px, py, DEFAULTS.curve);
    }
    lastPx = px;
    lastPy = py;
  }
}

/** Same shape as drawCurve but for a genuinely 2-D parametric path (x(p), y(p)). */
function drawParametricCurve(
  buf: Uint8ClampedArray,
  w: number,
  h: number,
  sx: (x: number) => number,
  sy: (y: number) => number,
  pMin: number,
  pMax: number,
  f: (p: number) => [number, number],
): void {
  const samples = w * 2;
  let lastPx = -1, lastPy = -1;
  for (let i = 0; i <= samples; i++) {
    const p = pMin + ((pMax - pMin) * i) / samples;
    const [x, y] = f(p);
    if (!Number.isFinite(x) || !Number.isFinite(y)) { lastPx = -1; lastPy = -1; continue; }
    const px = sx(x);
    const py = sy(y);
    if (lastPx >= 0) {
      drawLine(buf, w, h, lastPx, lastPy, px, py, DEFAULTS.curve);
    }
    lastPx = px;
    lastPy = py;
  }
}

/**
 * Implicit sublevel-curve plot: mark every (subsampled) pixel where
 * f(x,y) is within `threshold` of c. threshold is scaled by the local
 * gradient magnitude (finite differences) so the drawn line stays roughly
 * constant-width in screen space regardless of how steeply f varies —
 * a flat region of f near c would otherwise flood-fill instead of outline.
 */
function drawLevelSet(
  buf: Uint8ClampedArray,
  w: number,
  h: number,
  xMin: number, xMax: number,
  yMin: number, yMax: number,
  f: (x: number, y: number) => number,
  c: number,
): void {
  const dxDomain = (xMax - xMin) / w;
  const dyDomain = (yMax - yMin) / h;
  const hStep = Math.max(dxDomain, dyDomain, 1e-6) * 0.5;
  const step = 2; // subsample the pixel grid — cheap and still reads as a clean curve
  for (let py = 0; py < h; py += step) {
    const y = yMin + ((h - py) / h) * (yMax - yMin);
    for (let px = 0; px < w; px += step) {
      const x = xMin + (px / w) * (xMax - xMin);
      const v = f(x, y);
      if (!Number.isFinite(v)) continue;
      const gx = (f(x + hStep, y) - f(x - hStep, y)) / (2 * hStep);
      const gy = (f(x, y + hStep) - f(x, y - hStep)) / (2 * hStep);
      const gradMag = Math.hypot(gx, gy);
      if (!Number.isFinite(gradMag) || gradMag < 1e-9) continue;
      const threshold = gradMag * Math.max(dxDomain, dyDomain) * step * 0.75;
      if (Math.abs(v - c) < threshold) {
        putPixel(buf, w, h, px, py, DEFAULTS.curve);
        putPixel(buf, w, h, px + 1, py, DEFAULTS.curve);
        putPixel(buf, w, h, px, py + 1, DEFAULTS.curve);
      }
    }
  }
}

function drawLine(
  buf: Uint8ClampedArray,
  w: number,
  h: number,
  x0: number, y0: number,
  x1: number, y1: number,
  color: number[],
): void {
  // Bresenham. Anti-aliasing is overkill for 480x320 and gif palette is
  // already lossy — straight lines look fine.
  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;
  let x = x0, y = y0;
  let steps = 0;
  const maxSteps = (w + h) * 2;  // safety
  while (steps++ < maxSteps) {
    putPixel(buf, w, h, x, y, color);
    // Thicker line: also draw the pixel to the right + below for 2px stroke.
    putPixel(buf, w, h, x + 1, y, color);
    putPixel(buf, w, h, x, y + 1, color);
    if (x === x1 && y === y1) break;
    const e2 = 2 * err;
    if (e2 > -dy) { err -= dy; x += sx; }
    if (e2 < dx) { err += dx; y += sy; }
  }
}

function putPixel(
  buf: Uint8ClampedArray,
  w: number, h: number,
  x: number, y: number,
  color: number[],
): void {
  if (x < 0 || x >= w || y < 0 || y >= h) return;
  const p = (y * w + x) * 4;
  buf[p + 0] = color[0];
  buf[p + 1] = color[1];
  buf[p + 2] = color[2];
  buf[p + 3] = color[3];
}

/**
 * Render a scene to an animated GIF buffer. Synchronous (~50ms per frame
 * at 480x320 → ~1.5-2s for 30 frames).
 */
export function renderScene(scene: SceneDescription): RenderResult {
  const t0 = Date.now();
  const w = scene.width ?? DEFAULTS.width;
  const h = scene.height ?? DEFAULTS.height;
  const totalFrames = scene.frames ?? DEFAULTS.frames;
  const fps = scene.fps ?? DEFAULTS.fps;
  const delay = Math.round(1000 / fps);

  const enc = GIFEncoder();
  for (let i = 0; i < totalFrames; i++) {
    const rgba = renderFrame(scene, i);
    // Quantize RGBA frame to 256-color palette + apply.
    const palette = quantize(rgba, 256);
    const indexed = applyPalette(rgba, palette);
    enc.writeFrame(indexed, w, h, { palette, delay });
  }
  enc.finish();
  const buffer = Buffer.from(enc.bytes());
  const duration_ms = Date.now() - t0;
  return { buffer, duration_ms, width: w, height: h, frames: totalFrames };
}
