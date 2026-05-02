/**
 * gif-generator tests (§4.15 Phase B).
 */
import { describe, it, expect } from 'vitest';
import { renderScene, type SceneDescription } from '../gif-generator';

describe('gif-generator', () => {
  it('renders a parametric scene to a non-empty GIF buffer', () => {
    const scene: SceneDescription = {
      type: 'parametric',
      expression: 'sin(x + t)',
      x_range: [-3, 3],
      y_range: [-2, 2],
      t_range: [0, 6.28],
      frames: 8,
      fps: 8,
      width: 120,
      height: 80,
    };
    const r = renderScene(scene);
    expect(r.buffer).toBeInstanceOf(Uint8Array);
    expect(r.buffer.length).toBeGreaterThan(100);
    // GIF89a magic bytes
    expect(r.buffer[0]).toBe(0x47); // G
    expect(r.buffer[1]).toBe(0x49); // I
    expect(r.buffer[2]).toBe(0x46); // F
    expect(r.frames).toBe(8);
  });

  it('renders a function-trace scene', () => {
    const scene: SceneDescription = {
      type: 'function-trace',
      expression: 'x^2',
      x_range: [-2, 2],
      y_range: [0, 4],
      frames: 6,
      fps: 8,
      width: 100,
      height: 80,
    };
    const r = renderScene(scene);
    expect(r.buffer.length).toBeGreaterThan(50);
  });

  it('rejects expressions containing characters outside the whitelist', () => {
    const bad: SceneDescription = {
      type: 'parametric',
      expression: 'x; require("fs")',
      frames: 2,
      width: 60,
      height: 40,
    };
    expect(() => renderScene(bad)).toThrow();
  });
});
