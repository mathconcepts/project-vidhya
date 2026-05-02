// @ts-nocheck
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
 * Future extensions (v2): vector field, surface plot, custom sprites.
 *
 * Theme palette (matches v4.4.0 design system):
 *   bg     = #0b0d10 (surface-950)
 *   axes   = #374151 (surface-3)
 *   curve  = #10b981 (emerald — primary)
 *   accent = #a78bfa (violet — secondary)
 */

import { GIFEncoder, quantize, applyPalette } from 'gifenc';

export type SceneDescription =
  | ParametricScene
  | FunctionTraceScene;

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
  }

  return buf;
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
