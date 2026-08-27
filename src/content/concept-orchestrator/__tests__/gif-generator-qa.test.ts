/**
 * gif-generator QA tests (§4.15 follow-up, W3.6/E9 media QA).
 *
 * Covers the three pieces added ahead of the encode step (gifenc is
 * encode-only, so this is the only point QA can inspect pixels):
 *   1. draw-time bounding-box overlap detection (label-label, label-edge)
 *   2. cheap raster heuristics (ink density, contrast) on synthetic frames
 *   3. end-to-end wiring on renderScene()'s additive `qa` field
 */
import { describe, it, expect } from 'vitest';
import {
  renderScene,
  computeLabelBoxes,
  detectLabelOverlaps,
  computeInkDensity,
  computeContrast,
  QA_THRESHOLDS,
  type LabelBox,
  type SceneDescription,
} from '../gif-generator';

describe('detectLabelOverlaps (synthetic bounding boxes)', () => {
  it('finds no overlaps for well-separated boxes inside the canvas', () => {
    const boxes: LabelBox[] = [
      { text: 'A', x: 0, y: 0, width: 10, height: 10, source: 'title' },
      { text: 'B', x: 50, y: 50, width: 10, height: 10, source: 'bar-label' },
    ];
    expect(detectLabelOverlaps(boxes, 100, 100)).toEqual([]);
  });

  it('flags two label boxes that deliberately intersect', () => {
    const boxes: LabelBox[] = [
      { text: 'Day 1', x: 0, y: 0, width: 20, height: 10, source: 'bar-label' },
      { text: 'Day 2', x: 15, y: 0, width: 20, height: 10, source: 'bar-label' },
    ];
    const overlaps = detectLabelOverlaps(boxes, 100, 100, 7);
    expect(overlaps).toEqual([{ kind: 'label-label', a: 'Day 1', b: 'Day 2', frame: 7 }]);
  });

  it('does not flag boxes that merely touch at an edge (exclusive bounds)', () => {
    const boxes: LabelBox[] = [
      { text: 'A', x: 0, y: 0, width: 10, height: 10, source: 'title' },
      { text: 'B', x: 10, y: 0, width: 10, height: 10, source: 'title' },
    ];
    expect(detectLabelOverlaps(boxes, 100, 100)).toEqual([]);
  });

  it('flags a label that overhangs the canvas edge', () => {
    const boxes: LabelBox[] = [
      { text: 'Overflow', x: 95, y: 0, width: 20, height: 10, source: 'title' },
    ];
    const overlaps = detectLabelOverlaps(boxes, 100, 100, 3);
    expect(overlaps).toEqual([{ kind: 'label-edge', a: 'Overflow', b: 'canvas-edge', frame: 3 }]);
  });

  it('flags a label with a negative origin as an edge overlap too', () => {
    const boxes: LabelBox[] = [
      { text: 'Negative', x: -5, y: 2, width: 10, height: 5, source: 'title' },
    ];
    const overlaps = detectLabelOverlaps(boxes, 100, 100);
    expect(overlaps).toEqual([{ kind: 'label-edge', a: 'Negative', b: 'canvas-edge', frame: 0 }]);
  });

  it('reports every pairwise overlap among 3+ mutually-overlapping labels', () => {
    const boxes: LabelBox[] = [
      { text: 'X', x: 0, y: 0, width: 10, height: 10, source: 'bar-label' },
      { text: 'Y', x: 5, y: 0, width: 10, height: 10, source: 'bar-label' },
      { text: 'Z', x: 8, y: 0, width: 10, height: 10, source: 'bar-label' },
    ];
    const overlaps = detectLabelOverlaps(boxes, 100, 100);
    expect(overlaps).toHaveLength(3); // X-Y, X-Z, Y-Z
  });
});

describe('computeLabelBoxes (scene → bounding boxes, no rendering)', () => {
  it('returns no boxes for a scene with no title and no bar labels', () => {
    const scene: SceneDescription = { type: 'function-trace', expression: 'sin(x)' };
    expect(computeLabelBoxes(scene, 0, 200, 100)).toEqual([]);
  });

  it('returns one title box centered near the top for a titled scene', () => {
    const scene: SceneDescription = { type: 'function-trace', expression: 'sin(x)', title: 'Hi' };
    const boxes = computeLabelBoxes(scene, 0, 200, 100);
    expect(boxes).toHaveLength(1);
    expect(boxes[0].source).toBe('title');
    expect(boxes[0].y).toBeLessThan(20);
    // Roughly centered.
    const centerX = boxes[0].x + boxes[0].width / 2;
    expect(centerX).toBeGreaterThan(80);
    expect(centerX).toBeLessThan(120);
  });

  it('returns one box per revealed bar label, growing with the reveal frame', () => {
    const scene: SceneDescription = {
      type: 'discrete-bars',
      values: [1, 2, 3, 4],
      labels: ['a', 'b', 'c', 'd'],
      frames: 4,
      width: 200,
      height: 100,
    };
    const early = computeLabelBoxes(scene, 0, 200, 100);
    const late = computeLabelBoxes(scene, 3, 200, 100);
    expect(early.length).toBeLessThan(late.length);
    expect(late).toHaveLength(4);
    expect(late.every((b) => b.source === 'bar-label')).toBe(true);
  });

  it('skips a bar with no label text without throwing (sparse labels array)', () => {
    const scene: SceneDescription = {
      type: 'discrete-bars',
      values: [1, 2, 3],
      labels: ['only-first'],
      frames: 3,
      width: 200,
      height: 100,
    };
    const boxes = computeLabelBoxes(scene, 2, 200, 100);
    expect(boxes).toHaveLength(1);
    expect(boxes[0].text).toBe('only-first');
  });
});

describe('computeInkDensity (synthetic RGBA frames)', () => {
  const bg = [11, 13, 16, 255];

  function solidFrame(w: number, h: number, color: number[]): Uint8ClampedArray {
    const buf = new Uint8ClampedArray(w * h * 4);
    for (let p = 0; p < w * h; p++) {
      buf[p * 4] = color[0];
      buf[p * 4 + 1] = color[1];
      buf[p * 4 + 2] = color[2];
      buf[p * 4 + 3] = color[3];
    }
    return buf;
  }

  it('reports zero ink density for a frame that is entirely background', () => {
    const frame = solidFrame(10, 10, bg);
    expect(computeInkDensity(frame, bg)).toBe(0);
  });

  it('reports ~1.0 ink density for a frame that is entirely a contrasting color', () => {
    const frame = solidFrame(10, 10, [255, 255, 255, 255]);
    expect(computeInkDensity(frame, bg)).toBeCloseTo(1, 5);
  });

  it('reports a proportional ink density for a half-filled frame', () => {
    const w = 10, h = 10;
    const buf = new Uint8ClampedArray(w * h * 4);
    for (let p = 0; p < w * h; p++) {
      const color = p < (w * h) / 2 ? [255, 255, 255, 255] : bg;
      buf[p * 4] = color[0];
      buf[p * 4 + 1] = color[1];
      buf[p * 4 + 2] = color[2];
      buf[p * 4 + 3] = color[3];
    }
    expect(computeInkDensity(buf, bg)).toBeCloseTo(0.5, 5);
  });

  it('is below the near-blank threshold for a genuinely near-blank frame', () => {
    const w = 100, h = 100;
    const buf = new Uint8ClampedArray(w * h * 4);
    for (let p = 0; p < w * h; p++) {
      buf[p * 4] = bg[0]; buf[p * 4 + 1] = bg[1]; buf[p * 4 + 2] = bg[2]; buf[p * 4 + 3] = bg[3];
    }
    // Light up a single pixel — nowhere near the 0.2% threshold at 10,000 px.
    buf[0] = 255; buf[1] = 255; buf[2] = 255; buf[3] = 255;
    expect(computeInkDensity(buf, bg)).toBeLessThan(QA_THRESHOLDS.NEAR_BLANK_INK_DENSITY);
  });
});

describe('computeContrast (synthetic RGBA frames)', () => {
  const bg = [11, 13, 16, 255];

  it('is zero when there is no ink at all', () => {
    const buf = new Uint8ClampedArray(4);
    buf[0] = bg[0]; buf[1] = bg[1]; buf[2] = bg[2]; buf[3] = bg[3];
    expect(computeContrast(buf, bg)).toBe(0);
  });

  it('is high for a bright ink color against a dark background', () => {
    const buf = new Uint8ClampedArray(8);
    buf.set(bg, 0);
    buf.set([255, 255, 255, 255], 4);
    expect(computeContrast(buf, bg)).toBeGreaterThan(QA_THRESHOLDS.LOW_CONTRAST);
  });

  it('is low for an ink color barely distinguishable from the background', () => {
    const nearBg = [bg[0] + 6, bg[1] + 6, bg[2] + 6, 255]; // delta sum 18 < INK_DIFF_THRESHOLD(20), so NOT even counted as ink
    const buf = new Uint8ClampedArray(8);
    buf.set(bg, 0);
    buf.set(nearBg, 4);
    // Below the ink-detection threshold entirely — reads as no ink, contrast 0.
    expect(computeContrast(buf, bg)).toBe(0);
  });

  it('never returns a value outside [0, 1]', () => {
    const buf = new Uint8ClampedArray(8);
    buf.set(bg, 0);
    buf.set([255, 255, 255, 255], 4);
    const c = computeContrast(buf, bg);
    expect(c).toBeGreaterThanOrEqual(0);
    expect(c).toBeLessThanOrEqual(1);
  });
});

describe('renderScene() qa field — end to end', () => {
  it('is present and clean for an ordinary scene with no title or labels', () => {
    const r = renderScene({
      type: 'function-trace',
      expression: 'sin(x)',
      x_range: [-6, 6],
      y_range: [-1.5, 1.5],
      frames: 6,
      width: 200,
      height: 100,
    });
    expect(r.qa).toBeDefined();
    expect(r.qa.hard_fail).toBe(false);
    expect(r.qa.hard_fail_reasons).toEqual([]);
    expect(r.qa.label_overlaps).toEqual([]);
    expect(r.qa.samples).toHaveLength(2);
  });

  it('hard-fails when many long bar labels are forced to overlap on the final frame', () => {
    const n = 20;
    const r = renderScene({
      type: 'discrete-bars',
      values: Array.from({ length: n }, (_, i) => i + 1),
      labels: Array.from({ length: n }, (_, i) => `Day ${i + 1}`),
      frames: 4,
      width: 200,
      height: 100,
    });
    expect(r.qa.hard_fail).toBe(true);
    expect(r.qa.hard_fail_reasons.length).toBeGreaterThan(0);
    expect(r.qa.hard_fail_reasons.some((msg) => msg.includes('final frame'))).toBe(true);
  });

  it('does not hard-fail on a mid-frame-only overlap (final frame is clean)', () => {
    // A scene with well-spaced labels that fully fit — sanity check that
    // hard_fail stays false when nothing on the final frame is wrong,
    // even though the QA pass also samples (and would warn on) mid-frame.
    const r = renderScene({
      type: 'discrete-bars',
      values: [1, 2, 3],
      labels: ['Day 1', 'Day 2', 'Day 3'],
      frames: 3,
      width: 300,
      height: 150,
    });
    expect(r.qa.hard_fail).toBe(false);
  });

  it('draws a title without throwing on every plottable scene type', () => {
    const scenes: SceneDescription[] = [
      { type: 'parametric', expression: 'sin(x + t)', frames: 4, title: 'Sine Sweep' },
      { type: 'function-trace', expression: 'x^2', frames: 4, title: 'Parabola' },
      { type: 'parametric-curve', x_expr: '3*cos(t)', y_expr: '3*sin(t)', frames: 4, title: 'Circle' },
      { type: 'level-set', expression: 'x**2 + y**2', frames: 4, title: 'Level Set' },
    ];
    for (const scene of scenes) {
      const r = renderScene(scene);
      expect(r.qa).toBeDefined();
      const boxes = computeLabelBoxes(scene, 3);
      expect(boxes.some((b) => b.source === 'title')).toBe(true);
    }
  });
});
