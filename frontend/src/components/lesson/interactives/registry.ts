/**
 * INTERACTIVE_PROVIDER_REGISTRY — content module v3 fallback orchestration.
 *
 * Mirrors the server-side `verifiers/` registry pattern from src/verification/.
 * For each directive type, an array of providers is tried in order; the
 * first one that loads + renders without throwing wins.
 *
 * Tier discipline (per the eng review + amendment):
 *   Tier 0  Static SVG/PNG/MP4    ~0KB     always
 *   Tier 1  MathBox.js            ~150KB   default for 3D/parametric/vector
 *   Tier 2  Desmos free embed     ~250KB   slider-driven 2D
 *   Tier 3  GeoGebra applet       ~600KB   fallback only — CAS/algebra
 *   Tier 4+ Wolfram (paid)        opt-in   never a fallback
 *
 * Paid tiers are NEVER fallbacks — they require explicit env-var opt-in.
 * Fallbacks always cascade to free tiers or Tier 0 static.
 */

import { lazy, ComponentType } from 'react';

export type DirectiveType =
  | 'math3d' | 'parametric' | 'vectorfield' | 'surface'   // MathBox primary
  | 'slider' | 'graph2d'                                  // Desmos primary
  | 'cas' | 'construct'                                   // GeoGebra primary
  | 'manim'                                               // Pre-rendered MP4
  | 'verify' | 'wolfram-tool'                             // Server-side
  | 'quiz' | 'recall'                                     // No fallback
  | 'interactive';                                        // Library reference

export interface DirectiveProps {
  directive: DirectiveType;
  attrs: Record<string, any>;
}

// Lazy-load every provider so the lesson page first paint stays small.
const MathBox    = lazy(() => import('./MathBox'));
const Desmos     = lazy(() => import('./Desmos'));
// GeoGebra deferred — Tier 3 fallback, ~600KB. Author when first :::cas atom ships.
// const GeoGebra   = lazy(() => import('./GeoGebra'));
const Manim      = lazy(() => import('./Manim'));
const Quiz       = lazy(() => import('./Quiz'));
const Recall     = lazy(() => import('./Recall'));
const Interactive = lazy(() => import('./Interactive'));
const StaticFallback = lazy(() => import('./StaticFallback'));

/**
 * Provider chain per directive type.
 * The first entry is the primary; subsequent entries are fallbacks tried
 * on render error via InteractiveBoundary.
 */
export const PROVIDER_REGISTRY: Record<DirectiveType, ComponentType<DirectiveProps>[]> = {
  // Tier 1 MathBox primary
  math3d:      [MathBox, StaticFallback],
  parametric:  [MathBox, Desmos, StaticFallback],
  vectorfield: [MathBox, StaticFallback],
  surface:     [MathBox, StaticFallback],

  // Tier 2 Desmos primary
  slider:      [Desmos, StaticFallback],
  graph2d:     [Desmos, MathBox, StaticFallback],

  // Tier 3 GeoGebra primary (deferred — until first :::cas atom ships)
  cas:         [StaticFallback],
  construct:   [StaticFallback],

  // Tier 0 pre-rendered video
  manim:       [Manim, StaticFallback],

  // Server-side: no client-side fallback chain (handled in API)
  verify:      [Recall],
  'wolfram-tool': [Recall],

  // Inline UI components
  quiz:        [Quiz],
  recall:      [Recall],

  // Library reference — resolves to one of the above
  interactive: [Interactive, StaticFallback],
};

// ─── Library resolution

let _libraryCache: Record<string, any> | null = null;

/**
 * Resolves an `:::interactive{ref=name}` directive against the prefilled
 * interactives library (modules/project-vidhya-content/interactives-library/).
 *
 * In the browser bundle, the library is loaded via Vite's import.meta.glob
 * at build time so refs resolve synchronously.
 *
 * Returns null when the ref doesn't resolve (renderer logs a warning;
 * StaticFallback in the chain handles the user-visible state).
 */
export function resolveInteractive(ref: string): any | null {
  if (!_libraryCache) {
    try {
      // Vite resolves this at build time; each JSON gets eagerly imported
      // into the bundle. ~ small overhead per library entry, negligible.
      const modules = import.meta.glob('/modules/project-vidhya-content/interactives-library/*.json', {
        eager: true,
      }) as Record<string, any>;
      _libraryCache = {};
      for (const [path, mod] of Object.entries(modules)) {
        const id = path.split('/').pop()!.replace(/\.json$/, '');
        _libraryCache[id] = (mod as any).default ?? mod;
      }
    } catch (err) {
      console.warn('[interactives-library] glob failed:', err);
      _libraryCache = {};
    }
  }
  return _libraryCache[ref] ?? null;
}

/** For tests: reset the library cache so test fixtures take effect. */
export function _resetLibraryCacheForTests(): void {
  _libraryCache = null;
}

// ─── InteractiveBoundary
// Re-exported from boundary.tsx so callers only import from registry.

export { InteractiveBoundary } from './InteractiveBoundary';
