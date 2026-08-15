/**
 * INTERACTIVE_PROVIDER_REGISTRY — content module v3 fallback orchestration.
 *
 * Mirrors the server-side `verifiers/` registry pattern from src/verification/.
 * For each directive type, an array of providers is tried in order; the
 * first one that loads + renders without throwing wins.
 *
 * Tier discipline (per the eng review + amendment):
 *   Tier 0  Static SVG/PNG/MP4    ~0KB     always
 *   Tier 1  MathBoxLite (SVG)     ~0KB     default for 3D/parametric/vector
 *           (was MathBox.js/WebGL — removed 2026-08-15, see note below)
 *   Tier 2  Desmos free embed     ~250KB   slider-driven 2D
 *   Tier 3  GeoGebra applet       ~600KB   fallback only — CAS/algebra
 *   Tier 4+ Wolfram (paid)        opt-in   never a fallback
 *
 * Paid tiers are NEVER fallbacks — they require explicit env-var opt-in.
 * Fallbacks always cascade to free tiers or Tier 0 static.
 */

import { lazy, ComponentType } from 'react';

export type DirectiveType =
  | 'math3d' | 'parametric' | 'vectorfield' | 'surface'   // SVG plot primary
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
//
// NOTE ON THE 3D TIER: the WebGL MathBox provider was removed (2026-08-15).
// It loaded `mathbox@2.4.1` from unpkg, and that version has never existed on
// the npm registry that unpkg serves from (latest published: 2.3.2-rc1), so
// the script 404'd on every mount and the component fell through to the SVG
// path — after first downloading ~600KB of three.js for nothing. It also
// evaluated author-supplied expressions through `new Function()`, which the
// interactive-spec evaluator explicitly forbids, and painted with the retired
// navy/emerald palette. `MathBoxLite` is what students have actually been
// seeing, so the 3D directives now route there directly and honestly.
// Reinstating a real WebGL tier is deferred by owner decision (2026-08-15):
// the slider-driven eigenvalue manipulable is the accepted substitute for 3D
// orbit-drag. If it is ever revived it needs a mathbox version that exists, a
// device-capability gate, and vendored same-origin assets so it survives an
// offline venue. The speculative probe written alongside this removal was
// deleted rather than left as dead code.
const MathBoxLite = lazy(() =>
  import('./MathBoxLite').then((m) => ({ default: m.MathBoxLite })),
);
const Desmos     = lazy(() => import('./Desmos'));
const GeoGebra   = lazy(() => import('./GeoGebra'));
const Manim      = lazy(() => import('./Manim'));
const Quiz       = lazy(() => import('./Quiz'));
const Recall     = lazy(() => import('./Recall'));
const Verify     = lazy(() => import('./Verify'));
const Interactive = lazy(() => import('./Interactive'));
const StaticFallback = lazy(() => import('./StaticFallback'));

/**
 * Provider chain per directive type.
 * The first entry is the primary; subsequent entries are fallbacks tried
 * on render error via InteractiveBoundary.
 */
export const PROVIDER_REGISTRY: Record<DirectiveType, ComponentType<DirectiveProps>[]> = {
  // Tier 1 SVG plot primary (dependency-free — survives an offline venue)
  math3d:      [MathBoxLite, StaticFallback],
  parametric:  [MathBoxLite, Desmos, StaticFallback],
  vectorfield: [MathBoxLite, StaticFallback],
  surface:     [MathBoxLite, StaticFallback],

  // Tier 2 Desmos primary
  slider:      [Desmos, StaticFallback],
  graph2d:     [Desmos, MathBoxLite, StaticFallback],

  // Tier 3 GeoGebra primary
  cas:         [GeoGebra, StaticFallback],
  construct:   [GeoGebra, StaticFallback],

  // Tier 0 pre-rendered video
  manim:       [Manim, StaticFallback],

  // Server-side verify (B5) — Wolfram-backed if env set, local fallback otherwise.
  verify:      [Verify, StaticFallback],
  'wolfram-tool': [Verify, StaticFallback],

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
