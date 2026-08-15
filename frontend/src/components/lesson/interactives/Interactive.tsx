/**
 * Interactive — `:::interactive{ref=name}` library reference resolver.
 *
 * Looks up the `ref` attr in the prefilled interactives library
 * (modules/project-vidhya-content/interactives-library/{ref}.json),
 * then dispatches to the appropriate provider component based on the
 * library entry's tier + config.
 *
 * The library lets one MathBox/Desmos config serve many atoms — author
 * once, reuse everywhere. See the CEO plan amendment for rationale.
 */

import { lazy, Suspense } from 'react';
import { resolveInteractive } from './registry';
import type { DirectiveProps } from './registry';

// The `mathbox` tier renders through the dependency-free SVG plotter. The WebGL
// provider it used to point at was removed on 2026-08-15 — it fetched a mathbox
// version that has never existed on npm, so it 404'd and fell through to this
// same component on every mount. See registry.ts for the full note.
const MathBoxLite = lazy(() =>
  import('./MathBoxLite').then((m) => ({ default: m.MathBoxLite })),
);
const Desmos = lazy(() => import('./Desmos'));
const Manim = lazy(() => import('./Manim'));
const StaticFallback = lazy(() => import('./StaticFallback'));

interface LibraryEntry {
  id: string;
  tier: 'mathbox' | 'desmos' | 'manim' | 'static';
  title?: string;
  description?: string;
  config: Record<string, any>;
  fallback?: {
    tier: 'static';
    src: string;
    alt_text: string;
  };
}

export default function Interactive({ attrs }: DirectiveProps) {
  const ref = attrs.ref as string | undefined;
  if (!ref) {
    throw new Error('Interactive: missing required `ref` attribute');
  }

  const entry = resolveInteractive(ref) as LibraryEntry | null;
  if (!entry) {
    throw new Error(`Interactive: ref "${ref}" not found in interactives-library/`);
  }

  // Map entry config to directive attrs the provider expects.
  // Each tier component already accepts a generic attrs map.
  const passthrough = {
    directive: entry.tier as any,
    attrs: { ...(entry.config ?? {}), ...(entry.fallback ?? {}) },
  };

  const Provider =
    entry.tier === 'mathbox'
      ? MathBoxLite
      : entry.tier === 'desmos'
        ? Desmos
        : entry.tier === 'manim'
          ? Manim
          : StaticFallback;

  return (
    <Suspense
      fallback={
        <div
          className="my-3 h-32 rounded-md border animate-pulse"
          style={{ background: 'var(--surface-card)', borderColor: 'var(--separator)' }}
        />
      }
    >
      <Provider {...passthrough} />
    </Suspense>
  );
}
