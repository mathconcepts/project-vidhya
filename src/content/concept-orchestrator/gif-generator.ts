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
 *     the local gradient so the line stays roughly constant-width. An
 *     optional `expression2` overlays a second level-set (accent color) on
 *     the same axes for contrast a single family can't show on its own —
 *     e.g. an indefinite form's open hyperbola branches next to a
 *     positive-definite form's closed ellipses.
 *
 *   - 'discrete-bars' scene: a fixed array of literal `values` drawn as bars,
 *     revealed left to right one per frame (e.g. a sequence building term by
 *     term, or a discrete probability mass function). Takes literal numbers,
 *     not an expression — it never touches `compileExpression` and adds no
 *     new expression-evaluation surface.
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

import { drawGlyphText, textDimensions } from './gif-qa-font';

export type SceneDescription =
  | ParametricScene
  | FunctionTraceScene
  | ParametricCurveScene
  | LevelSetScene
  | DiscreteBarsScene;

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
  'discrete-bars',
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
  /** Optional heading drawn top-center via the QA bitmap font (§4.15 W3.6). */
  title?: string;
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
  /** Optional heading drawn top-center via the QA bitmap font (§4.15 W3.6). */
  title?: string;
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
  /**
   * Optional second f(x, y), drawn in the accent color on the SAME axes as
   * `expression`, its own level value growing in lockstep (shared frame
   * index, independently defaulted c-range). For teaching a contrast a
   * single family of level curves can't show by itself — e.g. a
   * positive-definite form's closed ellipses (bounded, every direction
   * curves up) next to an indefinite form's open hyperbola branches (one
   * direction curves up, the other down; the level curve never closes).
   */
  expression2?: string;
  x_range?: [number, number];
  y_range?: [number, number];
  /**
   * Level value c swept across frames, drawing f(x,y) = c. Default: grows
   * from a small fraction of the domain-edge value up to the smallest
   * value f takes on the boundary of x_range/y_range, so the sublevel
   * curve grows outward without ever exceeding the visible canvas.
   */
  c_range?: [number, number];
  /** Same as c_range but for expression2. Defaulted independently when omitted. */
  c2_range?: [number, number];
  frames?: number;
  fps?: number;
  width?: number;
  height?: number;
  /** Optional heading drawn top-center via the QA bitmap font (§4.15 W3.6). */
  title?: string;
}

export interface DiscreteBarsScene {
  type: 'discrete-bars';
  /** Literal bar heights, in display order. Not an expression — no evaluator involved. */
  values: number[];
  /** One label per bar, e.g. day numbers or outcome counts. Optional. */
  labels?: string[];
  /** Display-only; not rendered into the frame. */
  title?: string;
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
  bg:     [11, 13, 16, 255],     // #0b0d10
  axes:   [55, 65, 81, 255],     // #374151
  curve:  [16, 185, 129, 255],   // #10b981 emerald — primary
  accent: [167, 139, 250, 255],  // #a78bfa violet — secondary (contrast overlays)
  label:  [229, 231, 235, 255],  // #e5e7eb light gray — titles + bar labels
};

/**
 * W3.6/E9 media QA — a scene's optional `title` and (for discrete-bars)
 * `labels` are drawn straight into the RGBA frame by drawGlyphText, since
 * gifenc cannot render text after the fact. `qa` on RenderResult is the
 * additive finding set computed from that same draw pass — see
 * evaluateSceneQa below.
 */
export interface LabelBox {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  source: 'title' | 'bar-label';
}

export interface LabelOverlap {
  kind: 'label-label' | 'label-edge';
  /** Text of the first label (kind='label-edge': the offending label). */
  a: string;
  /** Text of the second label, or the literal 'canvas-edge' for kind='label-edge'. */
  b: string;
  frame: number;
}

export interface FrameQaSample {
  frame: number;
  role: 'mid' | 'final';
  ink_density: number;
  contrast: number;
}

export interface SceneQaResult {
  label_overlaps: LabelOverlap[];
  warnings: string[];
  samples: FrameQaSample[];
  /** True iff a label overlap on the FINAL frame or a near-blank final frame was found. */
  hard_fail: boolean;
  hard_fail_reasons: string[];
}

export const QA_THRESHOLDS = {
  /** Below this fraction of non-background pixels, a frame counts as near-blank. */
  NEAR_BLANK_INK_DENSITY: 0.002,
  /** Below this normalized (0-1) luminance delta between ink and background, a frame is low-contrast. */
  LOW_CONTRAST: 0.15,
  /** Summed per-channel RGB delta from background above which a pixel counts as "ink". */
  INK_DIFF_THRESHOLD: 20,
};

export interface RenderResult {
  buffer: Buffer;
  duration_ms: number;
  width: number;
  height: number;
  frames: number;
  /** Additive (§4.15 W3.6/E9) — never absent, computed for every render. */
  qa: SceneQaResult;
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

  // discrete-bars draws literal values on its own bar-chart layout — it has
  // no x_range/y_range and no expression, so it skips the generic
  // axis/curve coordinate system entirely rather than forcing bars through
  // a -3..3 default that has nothing to do with the data.
  if (scene.type === 'discrete-bars') {
    const totalFrames = scene.frames ?? DEFAULTS.frames;
    const barsShown = Math.max(1, Math.round((scene.values.length * (i + 1)) / totalFrames));
    drawDiscreteBars(buf, w, h, scene.values, barsShown);
    drawSceneLabels(buf, w, h, scene, i);
    return buf;
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
    const [cStart, cEnd] = resolveLevelRange(scene.c_range, xMin, xMax, yMin, yMax, f);
    const c = cStart + ((cEnd - cStart) * i) / Math.max(1, totalFrames - 1);
    drawLevelSet(buf, w, h, xMin, xMax, yMin, yMax, f, c, DEFAULTS.curve);

    // Contrast overlay: a second level-set family (e.g. an indefinite form's
    // saddle) drawn in the accent color on the same axes, its level growing
    // in lockstep with the primary curve. See LevelSetScene.expression2.
    if (scene.expression2) {
      const f2 = compileExpression(scene.expression2, ['x', 'y']);
      const [c2Start, c2End] = resolveLevelRange(scene.c2_range, xMin, xMax, yMin, yMax, f2);
      const c2 = c2Start + ((c2End - c2Start) * i) / Math.max(1, totalFrames - 1);
      drawLevelSet(buf, w, h, xMin, xMax, yMin, yMax, f2, c2, DEFAULTS.accent);
    }
  }

  drawSceneLabels(buf, w, h, scene, i);
  return buf;
}

/**
 * Shared bar-position math for 'discrete-bars': used both by drawDiscreteBars
 * (to actually paint the bars) and computeSceneLabels (to place per-bar
 * labels under them without duplicating — and risking drift from — the
 * layout formula. w/h/n only; the value-dependent baseline lives in
 * drawDiscreteBars since label placement doesn't need it.
 */
function computeBarGeometry(
  w: number,
  h: number,
  n: number,
): { marginX: number; marginBottom: number; plotW: number; barW: number; gap: number } {
  const marginX = Math.round(w * 0.05);
  const marginBottom = Math.round(h * 0.08);
  const plotW = w - marginX * 2;
  const gap = Math.max(1, Math.round(plotW * 0.015));
  const barW = Math.max(1, Math.floor((plotW - gap * (n - 1)) / n));
  return { marginX, marginBottom, plotW, barW, gap };
}

/**
 * A label the rasterizer will draw for frame `i`: a scene's optional `title`
 * (top-center, every frame it's present) plus — for discrete-bars — one
 * label per currently-revealed bar. Positions are computed WITHOUT touching
 * the pixel buffer so the same descriptors drive both the actual draw
 * (drawSceneLabels) and the QA bounding-box check (computeLabelBoxes) —
 * they can never disagree about where a label lands.
 */
interface LabelDescriptor {
  text: string;
  x: number;
  y: number;
  scale: number;
  source: 'title' | 'bar-label';
}

function computeSceneLabels(scene: SceneDescription, i: number, w: number, h: number): LabelDescriptor[] {
  const labels: LabelDescriptor[] = [];
  const totalFrames = scene.frames ?? DEFAULTS.frames;

  const title = scene.title;
  if (title) {
    const scale = 2;
    const dim = textDimensions(title, scale);
    const x = Math.max(2, Math.round((w - dim.width) / 2));
    const y = 3;
    labels.push({ text: title, x, y, scale, source: 'title' });
  }

  if (scene.type === 'discrete-bars' && scene.labels && scene.labels.length > 0) {
    const n = scene.values.length;
    const barsShown = Math.max(1, Math.round((n * (i + 1)) / totalFrames));
    const { marginX, marginBottom, barW, gap } = computeBarGeometry(w, h, n);
    const scale = 1;
    const shown = Math.min(barsShown, n, scene.labels.length);
    for (let idx = 0; idx < shown; idx++) {
      const text = scene.labels[idx];
      if (!text) continue;
      const barX = marginX + idx * (barW + gap);
      const dim = textDimensions(text, scale);
      const x = barX + Math.max(0, Math.round((barW - dim.width) / 2));
      const y = h - marginBottom + 2;
      labels.push({ text, x, y, scale, source: 'bar-label' });
    }
  }

  return labels;
}

/** Actually paint computeSceneLabels' descriptors into the frame buffer. */
function drawSceneLabels(buf: Uint8ClampedArray, w: number, h: number, scene: SceneDescription, i: number): void {
  for (const l of computeSceneLabels(scene, i, w, h)) {
    drawGlyphText(l.text, l.x, l.y, l.scale, (px, py) => putPixel(buf, w, h, px, py, DEFAULTS.label));
  }
}

/**
 * QA-facing bounding boxes for every label a scene would draw at frame
 * `frameIndex` — same geometry as computeSceneLabels, just measured instead
 * of painted. Exported for direct unit testing (synthetic scenes) and for
 * evaluateSceneQa below.
 */
export function computeLabelBoxes(
  scene: SceneDescription,
  frameIndex: number,
  width?: number,
  height?: number,
): LabelBox[] {
  const w = width ?? scene.width ?? DEFAULTS.width;
  const h = height ?? scene.height ?? DEFAULTS.height;
  return computeSceneLabels(scene, frameIndex, w, h).map((l) => {
    const dim = textDimensions(l.text, l.scale);
    return { text: l.text, x: l.x, y: l.y, width: dim.width, height: dim.height, source: l.source };
  });
}

/**
 * Deterministic pairwise overlap check: every label against every other
 * label, and every label against the canvas edge (a label that would be
 * clipped off-frame is exactly as illegible as one crossing another label).
 * Pure — takes bounding boxes, not a rendered scene — so it's testable with
 * hand-built synthetic boxes independent of the rasterizer.
 */
export function detectLabelOverlaps(
  boxes: LabelBox[],
  width: number,
  height: number,
  frame = 0,
): LabelOverlap[] {
  const overlaps: LabelOverlap[] = [];
  for (let a = 0; a < boxes.length; a++) {
    const box = boxes[a];
    if (box.x < 0 || box.y < 0 || box.x + box.width > width || box.y + box.height > height) {
      overlaps.push({ kind: 'label-edge', a: box.text, b: 'canvas-edge', frame });
    }
    for (let b = a + 1; b < boxes.length; b++) {
      if (boxesIntersect(box, boxes[b])) {
        overlaps.push({ kind: 'label-label', a: box.text, b: boxes[b].text, frame });
      }
    }
  }
  return overlaps;
}

function boxesIntersect(a: LabelBox, b: LabelBox): boolean {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

function luminance(rgb: readonly number[]): number {
  return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
}

/**
 * Fraction of pixels that differ from the background by more than
 * QA_THRESHOLDS.INK_DIFF_THRESHOLD (summed per-channel RGB delta) — cheap
 * near-blank-frame detector. Pure function over a raw RGBA buffer so it's
 * directly testable with synthetic frames, no renderScene call needed.
 */
export function computeInkDensity(rgba: Uint8ClampedArray, bg: readonly number[] = DEFAULTS.bg): number {
  const total = rgba.length / 4;
  if (total === 0) return 0;
  let ink = 0;
  for (let p = 0; p < total; p++) {
    const o = p * 4;
    const delta = Math.abs(rgba[o] - bg[0]) + Math.abs(rgba[o + 1] - bg[1]) + Math.abs(rgba[o + 2] - bg[2]);
    if (delta > QA_THRESHOLDS.INK_DIFF_THRESHOLD) ink++;
  }
  return ink / total;
}

/**
 * Normalized (0-1) luminance delta between the average "ink" pixel and the
 * background. 0 when there's no ink at all (computeInkDensity would already
 * flag that as near-blank) — never NaN.
 */
export function computeContrast(rgba: Uint8ClampedArray, bg: readonly number[] = DEFAULTS.bg): number {
  const total = rgba.length / 4;
  if (total === 0) return 0;
  const bgLum = luminance(bg);
  let inkLumSum = 0;
  let ink = 0;
  for (let p = 0; p < total; p++) {
    const o = p * 4;
    const delta = Math.abs(rgba[o] - bg[0]) + Math.abs(rgba[o + 1] - bg[1]) + Math.abs(rgba[o + 2] - bg[2]);
    if (delta > QA_THRESHOLDS.INK_DIFF_THRESHOLD) {
      inkLumSum += luminance([rgba[o], rgba[o + 1], rgba[o + 2]]);
      ink++;
    }
  }
  if (ink === 0) return 0;
  return Math.min(1, Math.abs(inkLumSum / ink - bgLum) / 255);
}

/**
 * Assemble the full SceneQaResult for a render: label-overlap checks on the
 * mid + final sampled frames, plus near-blank / low-contrast raster
 * heuristics on those same two frames. Hard-fail is deliberately narrow —
 * label overlap OR near-blank on the FINAL frame only (E9: "label overlap on
 * the final frame, near-blank"); everything else (mid-frame issues,
 * low-contrast at any sample) is a warning an operator can triage, not an
 * automatic media_artifacts.status='failed'.
 */
function evaluateSceneQa(
  scene: SceneDescription,
  w: number,
  h: number,
  midIndex: number,
  finalIndex: number,
  midRgba: Uint8ClampedArray,
  finalRgba: Uint8ClampedArray,
): SceneQaResult {
  const warnings: string[] = [];
  const hardReasons: string[] = [];

  const samples: FrameQaSample[] = [
    { frame: midIndex, role: 'mid', ink_density: computeInkDensity(midRgba), contrast: computeContrast(midRgba) },
    { frame: finalIndex, role: 'final', ink_density: computeInkDensity(finalRgba), contrast: computeContrast(finalRgba) },
  ];

  for (const s of samples) {
    if (s.ink_density < QA_THRESHOLDS.NEAR_BLANK_INK_DENSITY) {
      const msg = `near-blank ${s.role} frame (frame ${s.frame}): ink_density=${s.ink_density.toFixed(4)} below ${QA_THRESHOLDS.NEAR_BLANK_INK_DENSITY}`;
      warnings.push(msg);
      if (s.role === 'final') hardReasons.push(msg);
    }
    if (s.contrast < QA_THRESHOLDS.LOW_CONTRAST) {
      warnings.push(`low-contrast ${s.role} frame (frame ${s.frame}): contrast=${s.contrast.toFixed(4)} below ${QA_THRESHOLDS.LOW_CONTRAST}`);
    }
  }

  const label_overlaps: LabelOverlap[] = [];
  const sampled: Array<{ index: number; role: 'mid' | 'final' }> = [
    { index: midIndex, role: 'mid' },
    { index: finalIndex, role: 'final' },
  ];
  for (const { index, role } of sampled) {
    const boxes = computeLabelBoxes(scene, index, w, h);
    const overlaps = detectLabelOverlaps(boxes, w, h, index);
    label_overlaps.push(...overlaps);
    for (const o of overlaps) {
      const msg = `label overlap on ${role} frame (frame ${index}): ${o.kind} between "${o.a}" and "${o.b}"`;
      warnings.push(msg);
      if (role === 'final') hardReasons.push(msg);
    }
  }

  return {
    label_overlaps,
    warnings,
    samples,
    hard_fail: hardReasons.length > 0,
    hard_fail_reasons: hardReasons,
  };
}

/**
 * Default level (c) range for a 'level-set' scene when the scene doesn't
 * name one explicitly: grow the sublevel curve from a small fraction of the
 * domain up to the largest c that still fits inside BOTH axis extents (the
 * smaller of f at the x-edge and f at the y-edge) — so the curve never grows
 * past the visible canvas regardless of the expression's shape.
 */
function resolveLevelRange(
  override: [number, number] | undefined,
  xMin: number, xMax: number, yMin: number, yMax: number,
  f: (x: number, y: number) => number,
): [number, number] {
  if (override) return override;
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
  color: number[],
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
        putPixel(buf, w, h, px, py, color);
        putPixel(buf, w, h, px + 1, py, color);
        putPixel(buf, w, h, px, py + 1, color);
      }
    }
  }
}

/**
 * Draw the first `barsShown` bars of `values` left to right, most-recently
 * revealed bar in the accent color so the "one more term" beat reads
 * clearly, earlier bars in the primary curve color. A zero baseline is
 * drawn so negative values (not used by either current caller, but not
 * assumed away) read correctly above/below it.
 */
function drawDiscreteBars(
  buf: Uint8ClampedArray,
  w: number,
  h: number,
  values: number[],
  barsShown: number,
): void {
  const n = values.length;
  if (n === 0) return;

  const vMax = Math.max(0, ...values);
  const vMin = Math.min(0, ...values);
  const span = vMax - vMin || 1;

  const marginTop = Math.round(h * 0.08);
  const { marginX, marginBottom, plotW, barW, gap } = computeBarGeometry(w, h, n);
  const plotH = h - marginTop - marginBottom;

  const baselineY = marginTop + Math.round(((vMax - 0) / span) * plotH);
  for (let xi = marginX; xi < w - marginX; xi++) putPixel(buf, w, h, xi, baselineY, DEFAULTS.axes);

  for (let idx = 0; idx < Math.min(barsShown, n); idx++) {
    const value = values[idx];
    const barX = marginX + idx * (barW + gap);
    const valueY = marginTop + Math.round(((vMax - value) / span) * plotH);
    const top = Math.min(valueY, baselineY);
    const bottom = Math.max(valueY, baselineY);
    const color = idx === barsShown - 1 ? DEFAULTS.accent : DEFAULTS.curve;
    for (let bx = barX; bx < barX + barW; bx++) {
      for (let by = top; by <= bottom; by++) putPixel(buf, w, h, bx, by, color);
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

  // W3.6/E9 media QA samples the mid + final frame's pre-encoding RGBA —
  // gifenc is encode-only and cannot be asked to decode its own output back
  // out, so this is the only point in the pipeline where pixel-level QA is
  // possible at all.
  const midIndex = Math.floor(Math.max(0, totalFrames - 1) / 2);
  const finalIndex = Math.max(0, totalFrames - 1);
  let midRgba: Uint8ClampedArray | null = null;
  let finalRgba: Uint8ClampedArray | null = null;

  const enc = GIFEncoder();
  for (let i = 0; i < totalFrames; i++) {
    const rgba = renderFrame(scene, i);
    if (i === midIndex) midRgba = rgba;
    if (i === finalIndex) finalRgba = rgba;
    // Quantize RGBA frame to 256-color palette + apply.
    const palette = quantize(rgba, 256);
    const indexed = applyPalette(rgba, palette);
    enc.writeFrame(indexed, w, h, { palette, delay });
  }
  enc.finish();
  const buffer = Buffer.from(enc.bytes());
  const duration_ms = Date.now() - t0;

  // totalFrames <= 0 is an authoring error the loop above never executes
  // for — render the two QA sample frames directly rather than let QA read
  // a null sample (defensive; not exercised by any known scene today).
  if (!midRgba) midRgba = renderFrame(scene, midIndex);
  if (!finalRgba) finalRgba = renderFrame(scene, finalIndex);

  const qa = evaluateSceneQa(scene, w, h, midIndex, finalIndex, midRgba, finalRgba);

  return { buffer, duration_ms, width: w, height: h, frames: totalFrames, qa };
}
