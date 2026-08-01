/**
 * GeoGebra — Tier 3 fallback (~600KB lazy).
 *
 * Used by directives: cas, construct (and as a fallback for any algebra-heavy
 * MathBox/Desmos failure).
 *
 * Strategy: render the GeoGebra applet via the `geogebra/html5-app` iframe
 * embed when present; otherwise render a static expression card so the
 * cascade can fall through to StaticFallback. This keeps the chunk small —
 * the official geogebra deployment script is loaded by the browser only when
 * the iframe URL is fetched, so we don't ship the 600KB to atoms that don't
 * actually use cas/construct directives.
 *
 * We deliberately don't import the geogebra-net npm package — that would pull
 * the full applet into the bundle. The iframe approach gives us:
 *   - 0KB cost for atoms that never reach this provider
 *   - Same theme-friendly background via &dark=1 query param
 *   - Caption text remains crawlable for SEO + accessibility
 *
 * Honors prefers-reduced-data: throws so the boundary cascades to
 * StaticFallback (no third-party network on metered connections).
 */

import { useEffect, useState } from 'react';
import type { DirectiveProps } from './registry';

interface GeoGebraAttrs {
  /** GeoGebra material id (e.g. "RHYH3UQ8") OR an exported applet id */
  material_id?: string;
  /** Inline CAS/construction command (single line) */
  command?: string;
  /** Caption shown beneath the iframe / static card */
  caption?: string;
  /** Bare expression for quick-eval atoms (e.g. "Solve(x^2 - 4 = 0, x)") */
  expression?: string;
  width?: string;
  height?: string;
  alt_text?: string;
}

const REDUCED_DATA_QUERY = '(prefers-reduced-data: reduce)';

export default function GeoGebra({ attrs }: DirectiveProps) {
  const a = attrs as GeoGebraAttrs;
  const [reducedData, setReducedData] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia(REDUCED_DATA_QUERY);
    setReducedData(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedData(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Reduced-data: never load the applet — cascade.
  if (reducedData) {
    throw new Error('GeoGebra: reduced-data — cascade to StaticFallback');
  }

  if (!a.material_id) {
    // No material — serve a quiet algebra card with the command/expression
    // so authors can use :::cas without setting up GeoGebra Materials yet.
    const text = a.command || a.expression;
    if (!text) {
      throw new Error('GeoGebra: missing material_id and command/expression');
    }
    return (
      <figure
        className="my-3 rounded-md border px-4 py-3"
        style={{ borderColor: 'var(--separator)', background: 'var(--surface-card)' }}
        role="img"
        aria-label={a.alt_text || `Computer algebra: ${text}`}
      >
        <div className="text-xs uppercase tracking-wider mb-1" style={{ color: 'rgba(88,86,214,.8)' }}>CAS</div>
        <code className="block text-sm font-mono break-all" style={{ color: 'var(--green-ink)' }}>{text}</code>
        {a.caption && (
          <figcaption className="text-xs mt-2" style={{ color: 'var(--text-tertiary)' }}>{a.caption}</figcaption>
        )}
      </figure>
    );
  }

  const width = a.width || '100%';
  const height = a.height || '420';
  // GeoGebra Materials embed format. The site honors `?embed=true` and a few
  // appearance flags. We also pass a transparent bg flag so it blends with
  // the lesson surface; the real theme overlay would require the JS API.
  const src = `https://www.geogebra.org/material/iframe/id/${encodeURIComponent(a.material_id)}/width/800/height/600/border/00000000/sb/false/sri/true/rc/false/ai/false/sdz/false`;

  return (
    <figure
      className="my-3 rounded-md border overflow-hidden"
      style={{ borderColor: 'var(--separator)', background: 'var(--surface-card)' }}
      role="img"
      aria-label={a.alt_text || `GeoGebra interactive ${a.material_id}`}
    >
      <iframe
        title={a.alt_text || `GeoGebra ${a.material_id}`}
        src={src}
        width={width}
        height={height}
        className="block w-full"
        loading="lazy"
        referrerPolicy="no-referrer"
        sandbox="allow-scripts allow-same-origin"
      />
      {a.caption && (
        <figcaption
          className="px-3 py-2 text-xs border-t"
          style={{ color: 'var(--text-tertiary)', borderColor: 'var(--separator)' }}
        >
          {a.caption}
        </figcaption>
      )}
    </figure>
  );
}
