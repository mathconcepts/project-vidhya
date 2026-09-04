/**
 * wizard-route-loader.test.ts — mirrors interactive-spec-loader.test.ts's
 * pattern for the same reason: locks the loader itself (caching, and that
 * it hands back the REAL resolver in this dev/test process, never a stub).
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  loadWizardRouteResolver,
  _resetWizardRouteResolverCacheForTests,
} from '../wizard-route-loader';

describe('loadWizardRouteResolver', () => {
  beforeEach(() => {
    _resetWizardRouteResolverCacheForTests();
  });

  it('resolves the real resolver in this process (frontend/src is on disk in dev/test/CI)', async () => {
    const resolve = await loadWizardRouteResolver();
    expect(resolve).not.toBeNull();
  });

  it('the resolved resolver actually maps a real concept to its wizard route', async () => {
    const resolve = await loadWizardRouteResolver();
    expect(resolve!('determinants')).toBe('/theorem-wizard/linear-algebra?concept=determinants');
  });

  it('the resolved resolver returns null for an unmapped concept, not a throw', async () => {
    const resolve = await loadWizardRouteResolver();
    expect(resolve!('vector-spaces')).toBeNull();
  });

  it('caches the loaded function across calls (returns the same reference)', async () => {
    const first = await loadWizardRouteResolver();
    const second = await loadWizardRouteResolver();
    expect(second).toBe(first);
  });

  it('reset clears the cache so a fresh load is exercised again', async () => {
    const first = await loadWizardRouteResolver();
    _resetWizardRouteResolverCacheForTests();
    const second = await loadWizardRouteResolver();
    expect(second).toBeTruthy();
    expect(typeof second).toBe(typeof first);
  });
});
