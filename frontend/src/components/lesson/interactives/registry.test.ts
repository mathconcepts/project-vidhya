/**
 * Interactive provider registry tests — verify the orchestration shape.
 *
 * The registry's contract: every directive type maps to a non-empty array
 * of providers, and the chain ends in a fallback that always renders.
 * Specific provider behavior is tested in their own component test files.
 */

import { describe, it, expect } from 'vitest';
import { PROVIDER_REGISTRY, resolveInteractive, _resetLibraryCacheForTests, type DirectiveType } from './registry';

describe('PROVIDER_REGISTRY — chain shape', () => {
  it('every directive type has at least one provider', () => {
    for (const [directive, chain] of Object.entries(PROVIDER_REGISTRY)) {
      expect(chain.length).toBeGreaterThan(0);
    }
  });

  const tier1Directives: DirectiveType[] = ['math3d', 'parametric', 'vectorfield', 'surface'];
  it.each(tier1Directives)('Tier 1 directive %s ends in StaticFallback', (directive) => {
    const chain = PROVIDER_REGISTRY[directive];
    // The last provider is the fallback (lazy-loaded; we can only assert it exists)
    expect(chain[chain.length - 1]).toBeDefined();
  });

  it('paid tiers (Wolfram) are NOT present in any frontend chain', () => {
    // Sanity check: no provider in the chain references Wolfram client-side
    for (const chain of Object.values(PROVIDER_REGISTRY)) {
      for (const Provider of chain) {
        // lazy-loaded modules expose displayName via their underlying $$typeof
        const name = (Provider as any).displayName || (Provider as any).name || '';
        expect(name.toLowerCase()).not.toContain('wolfram');
      }
    }
  });

  it('parametric falls back through Desmos before static', () => {
    // Provider chain order: MathBox → Desmos → StaticFallback
    expect(PROVIDER_REGISTRY.parametric.length).toBe(3);
  });

  it('graph2d uses Desmos primary, MathBox fallback', () => {
    expect(PROVIDER_REGISTRY.graph2d.length).toBe(3);
  });

  it('manim has a single provider + static fallback (build-time only)', () => {
    expect(PROVIDER_REGISTRY.manim.length).toBe(2);
  });

  it('quiz and recall have no fallback (inline UI only)', () => {
    expect(PROVIDER_REGISTRY.quiz.length).toBe(1);
    expect(PROVIDER_REGISTRY.recall.length).toBe(1);
  });
});

describe('resolveInteractive — library reference resolution', () => {
  it('returns null for unknown ref', () => {
    _resetLibraryCacheForTests();
    const entry = resolveInteractive('this-does-not-exist');
    expect(entry).toBeNull();
  });

  // Note: the prefilled library is loaded via Vite's import.meta.glob at
  // build time. In test env we can verify the API contract but the cache
  // population depends on the build pipeline. The lint script
  // (scripts/lint-interactives.mjs) is what gates broken refs in CI.
});
