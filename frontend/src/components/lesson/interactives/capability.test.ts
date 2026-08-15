/**
 * Tests for the interactive-tier capability probe.
 *
 * The point of the probe is that an offline or low-end device gets routed to
 * the SVG tier IMMEDIATELY rather than mounting a WebGL path and waiting for it
 * to fail. So the behaviour worth locking is: every "no" answer must be a
 * synchronous false, and a missing signal must never be read as "no".
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  hasWebGL,
  isMemoryConstrained,
  prefersReducedData,
  canRenderWebGLTier,
  __resetCapabilityCache,
} from './capability';

/** Swap in a canvas whose getContext answers however the case needs. */
function stubCanvas(getContext: (id: string) => unknown) {
  return vi
    .spyOn(document, 'createElement')
    .mockImplementation(((tag: string) => {
      if (tag !== 'canvas') return {} as HTMLElement;
      return { getContext } as unknown as HTMLCanvasElement;
    }) as typeof document.createElement);
}

function stubMatchMedia(matches: boolean | (() => never)) {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: (query: string) => {
      if (typeof matches === 'function') matches();
      return { matches: matches as boolean, media: query } as MediaQueryList;
    },
  });
}

function stubDeviceMemory(value: number | undefined) {
  Object.defineProperty(navigator, 'deviceMemory', {
    configurable: true,
    writable: true,
    value,
  });
}

describe('hasWebGL', () => {
  beforeEach(() => __resetCapabilityCache());
  afterEach(() => vi.restoreAllMocks());

  it('is true when a webgl context is granted', () => {
    stubCanvas((id) => (id === 'webgl' ? { getExtension: () => null } : null));
    expect(hasWebGL()).toBe(true);
  });

  it('falls back to the experimental context name', () => {
    stubCanvas((id) =>
      id === 'experimental-webgl' ? { getExtension: () => null } : null,
    );
    expect(hasWebGL()).toBe(true);
  });

  it('is false when the driver refuses a context', () => {
    stubCanvas(() => null);
    expect(hasWebGL()).toBe(false);
  });

  it('is false when getContext throws rather than returning null', () => {
    stubCanvas(() => {
      throw new Error('context creation blocked');
    });
    expect(hasWebGL()).toBe(false);
  });

  it('releases the probe context so drivers do not run out of them', () => {
    const loseContext = vi.fn();
    stubCanvas(() => ({
      getExtension: (name: string) =>
        name === 'WEBGL_lose_context' ? { loseContext } : null,
    }));
    hasWebGL();
    expect(loseContext).toHaveBeenCalledOnce();
  });

  it('probes only once and caches the answer', () => {
    const spy = stubCanvas(() => ({ getExtension: () => null }));
    hasWebGL();
    hasWebGL();
    hasWebGL();
    expect(spy).toHaveBeenCalledOnce();
  });
});

describe('isMemoryConstrained', () => {
  afterEach(() => stubDeviceMemory(undefined));

  it('is true at or below 2GB', () => {
    stubDeviceMemory(2);
    expect(isMemoryConstrained()).toBe(true);
  });

  it('is false above 2GB', () => {
    stubDeviceMemory(4);
    expect(isMemoryConstrained()).toBe(false);
  });

  it('treats an absent reading as unconstrained, not constrained', () => {
    // Safari never reports deviceMemory. Reading that silence as "low memory"
    // would downgrade every Safari user to the SVG tier.
    stubDeviceMemory(undefined);
    expect(isMemoryConstrained()).toBe(false);
  });
});

describe('prefersReducedData', () => {
  it('is true when the user asked to save data', () => {
    stubMatchMedia(true);
    expect(prefersReducedData()).toBe(true);
  });

  it('is false when they did not', () => {
    stubMatchMedia(false);
    expect(prefersReducedData()).toBe(false);
  });

  it('is false when matchMedia throws on an unknown query', () => {
    stubMatchMedia(() => {
      throw new Error('unsupported media query');
    });
    expect(prefersReducedData()).toBe(false);
  });
});

describe('canRenderWebGLTier', () => {
  beforeEach(() => {
    __resetCapabilityCache();
    stubMatchMedia(false);
    stubDeviceMemory(8);
  });
  afterEach(() => vi.restoreAllMocks());

  it('is true only when every signal is favourable', () => {
    stubCanvas(() => ({ getExtension: () => null }));
    expect(canRenderWebGLTier()).toBe(true);
  });

  it('is false without WebGL', () => {
    stubCanvas(() => null);
    expect(canRenderWebGLTier()).toBe(false);
  });

  it('is false on a memory-constrained device', () => {
    stubCanvas(() => ({ getExtension: () => null }));
    stubDeviceMemory(1);
    expect(canRenderWebGLTier()).toBe(false);
  });

  it('is false when the user asked to save data', () => {
    stubCanvas(() => ({ getExtension: () => null }));
    stubMatchMedia(true);
    expect(canRenderWebGLTier()).toBe(false);
  });
});
