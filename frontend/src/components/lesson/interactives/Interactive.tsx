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

const MathBox = lazy(() => import('./MathBox'));
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
      ? MathBox
      : entry.tier === 'desmos'
        ? Desmos
        : entry.tier === 'manim'
          ? Manim
          : StaticFallback;

  return (
    <Suspense
      fallback={
        <div className="my-3 h-32 rounded-md bg-surface-900 border border-surface-800 animate-pulse" />
      }
    >
      <Provider {...passthrough} />
    </Suspense>
  );
}
