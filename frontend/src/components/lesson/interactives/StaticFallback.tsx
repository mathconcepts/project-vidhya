/**
 * StaticFallback — Tier 0 always-available fallback.
 *
 * Renders when:
 *   - prefers-reduced-data is set (skip heavy interactives)
 *   - the primary provider chain is exhausted (all threw)
 *   - the directive has a static `src` poster authored
 *
 * Two modes:
 *   1. If attrs has `static_src` or `poster`: render the image with caption alt-text
 *   2. Otherwise: render a quiet text-only placeholder so the atom stays readable
 */

import type { DirectiveProps } from './registry';

interface StaticFallbackAttrs {
  static_src?: string;
  poster?: string;
  alt?: string;
  alt_text?: string;
  caption?: string;
}

export default function StaticFallback({ directive, attrs }: DirectiveProps) {
  const a = attrs as StaticFallbackAttrs;
  const src = a.static_src ?? a.poster;
  const alt = a.alt ?? a.alt_text ?? a.caption ?? `Static visualization for ${directive}`;

  if (src) {
    return (
      <figure
        className="my-3 rounded-md border overflow-hidden"
        style={{ borderColor: 'var(--separator)', background: 'var(--surface-card)' }}
      >
        <img src={src} alt={alt} loading="lazy" className="w-full h-auto" />
        {a.caption && (
          <figcaption
            className="px-3 py-2 text-xs border-t"
            style={{ color: 'var(--text-secondary)', borderColor: 'var(--separator)' }}
          >
            {a.caption}
          </figcaption>
        )}
      </figure>
    );
  }

  // Quiet text-only — atom remains readable per the upfront-baseline contract.
  return (
    <div
      className="my-3 p-3 rounded-md border text-xs italic"
      style={{ background: 'var(--surface-fill)', borderColor: 'var(--separator)', color: 'var(--text-tertiary)' }}
      role="note"
    >
      Interactive visualization unavailable on this connection — see the explanation above.
    </div>
  );
}
