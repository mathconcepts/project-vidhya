/**
 * loadScript — dedup + timeout + reduced-data short-circuit.
 *
 * jsdom doesn't actually run injected <script> tags, so we drive load/error
 * events manually by spying on appendChild and triggering them.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { loadScript, _resetLoadScriptCacheForTests } from './loadScript';

describe('loadScript', () => {
  beforeEach(() => {
    _resetLoadScriptCacheForTests();
    document.head.innerHTML = '';
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('resolves with the global probe value when the script loads', async () => {
    const original = document.head.appendChild.bind(document.head);
    const spy = vi.spyOn(document.head, 'appendChild').mockImplementation((node: any) => {
      // Simulate immediate success.
      queueMicrotask(() => {
        (window as any).MyLib = { ok: true };
        node.onload?.();
      });
      return original(node);
    });

    const lib = await loadScript('https://example.test/lib.js', {
      globalProbe: () => (window as any).MyLib,
    });
    expect(lib).toEqual({ ok: true });
    spy.mockRestore();
  });

  it('rejects on script error', async () => {
    const original = document.head.appendChild.bind(document.head);
    vi.spyOn(document.head, 'appendChild').mockImplementation((node: any) => {
      queueMicrotask(() => node.onerror?.());
      return original(node);
    });
    await expect(
      loadScript('https://example.test/bad.js', { globalProbe: () => null }),
    ).rejects.toThrow(/error event/);
  });

  it('dedupes parallel calls for the same src', async () => {
    let appendCount = 0;
    const original = document.head.appendChild.bind(document.head);
    vi.spyOn(document.head, 'appendChild').mockImplementation((node: any) => {
      appendCount++;
      queueMicrotask(() => {
        (window as any).Dedup = 1;
        node.onload?.();
      });
      return original(node);
    });
    const probe = () => (window as any).Dedup;
    const [a, b] = await Promise.all([
      loadScript('https://example.test/dedup.js', { globalProbe: probe }),
      loadScript('https://example.test/dedup.js', { globalProbe: probe }),
    ]);
    expect(a).toBe(1);
    expect(b).toBe(1);
    expect(appendCount).toBe(1);
  });

  it('rejects when prefers-reduced-data is set', async () => {
    const mq = vi.fn().mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
    Object.defineProperty(window, 'matchMedia', { value: mq, writable: true });
    await expect(
      loadScript('https://example.test/reduce.js', { globalProbe: () => null }),
    ).rejects.toThrow(/prefers-reduced-data/);
  });
});
