import { describe, it, expect, afterEach } from 'vitest';
import { prefersReducedData } from './mediaPreferences';

const original = window.matchMedia;

function stub(value: unknown) {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value,
  });
}

describe('prefersReducedData', () => {
  afterEach(() => {
    stub(original);
  });

  it('is true when the user asked to save data', () => {
    stub((q: string) => ({ matches: true, media: q }));
    expect(prefersReducedData()).toBe(true);
  });

  it('is false when they did not', () => {
    stub((q: string) => ({ matches: false, media: q }));
    expect(prefersReducedData()).toBe(false);
  });

  it('is false when matchMedia is absent', () => {
    // Older browsers and jsdom without the shim. Absence of an answer must not
    // read as "yes, downgrade" — that would silently degrade every such user.
    stub(undefined);
    expect(prefersReducedData()).toBe(false);
  });

  it('is false when the query throws', () => {
    stub(() => {
      throw new Error('unsupported media query');
    });
    expect(prefersReducedData()).toBe(false);
  });
});
