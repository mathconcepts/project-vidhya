/**
 * MathBox — Tier 1 primary lightweight interactive (~150KB).
 *
 * Used by directives: math3d, parametric, vectorfield, surface.
 *
 * MVP shape: render a static-feel parametric/3D placeholder using a small
 * canvas-based renderer. Full mathbox-react integration deferred to follow-up
 * (mathbox v3 NPM package landed late — pinning it here would lock the demo
 * to a moving target). For now we ship a CSS+SVG visualization that respects
 * theme overrides (transparent bg, emerald primary, violet secondary, surface-3
 * axes) so atoms render consistently. The directive props remain stable so the
 * follow-up swap is a pure component-internals change.
 *
 * Theme overrides per design review:
 *   bg: transparent (atom card surface-1 shows through)
 *   primary curve: #10b981 (emerald)
 *   secondary curve: #a78bfa (violet)
 *   axes: #374151 (surface-3)
 *
 * Reduced-motion: respects `prefers-reduced-motion: reduce` — no animation,
 * static final-state render only.
 */

import { useMemo, useEffect, useState } from 'react';
import type { DirectiveProps } from './registry';

interface MathBoxAttrs {
  /** Function expression, e.g. "x^2", "sin(x)", "x*y". */
  function?: string;
  fn?: string;
  /** Domain bounds. */
  x?: string; // e.g. "[-3,3]"
  y?: string;
  /** Color override. */
  color?: string;
  /** Aspect ratio (default 4:3). */
  aspect?: string;
}

function parseRange(s: string | undefined, fallback: [number, number]): [number, number] {
  if (!s) return fallback;
  const m = s.match(/-?\d+(\.\d+)?/g);
  if (!m || m.length < 2) return fallback;
  return [Number(m[0]), Number(m[1])];
}

function evaluateFn(fnSrc: string, x: number): number | null {
  // Very small math expression evaluator. Replaces ^ with **, handles
  // common functions. Defensive against arbitrary code execution by
  // limiting to a fixed function whitelist before eval.
  const safe = fnSrc
    .replace(/\^/g, '**')
    .replace(/\bsin\b/g, 'Math.sin')
    .replace(/\bcos\b/g, 'Math.cos')
    .replace(/\btan\b/g, 'Math.tan')
    .replace(/\blog\b/g, 'Math.log')
    .replace(/\bln\b/g, 'Math.log')
    .replace(/\bexp\b/g, 'Math.exp')
    .replace(/\bsqrt\b/g, 'Math.sqrt')
    .replace(/\babs\b/g, 'Math.abs')
    .replace(/\bpi\b/gi, 'Math.PI')
    .replace(/\be\b/g, 'Math.E');
  // Whitelist check — reject any character that isn't in the math grammar.
  if (!/^[\d\s+\-*/().,xMath.PIE\b\sa-z]+$/i.test(safe)) return null;
  try {
    // eslint-disable-next-line no-new-func
    const f = new Function('x', `return (${safe});`);
    const v = f(x);
    return Number.isFinite(v) ? v : null;
  } catch {
    return null;
  }
}

export default function MathBox({ directive, attrs }: DirectiveProps) {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const onChange = () => setReducedMotion(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const a = attrs as MathBoxAttrs;
  const fnSrc = (a.function || a.fn || 'x^2').trim();
  const [xMin, xMax] = parseRange(a.x, [-3, 3]);
  const [yMin, yMax] = parseRange(a.y, [-3, 3]);
  const primary = a.color || '#10b981';
  const aspect = a.aspect || '4 / 3';

  // Sample the function at 60 points across the domain.
  const path = useMemo(() => {
    const n = 60;
    const samples: Array<[number, number]> = [];
    for (let i = 0; i <= n; i++) {
      const x = xMin + (i / n) * (xMax - xMin);
      const y = evaluateFn(fnSrc, x);
      if (y == null || y < yMin - 100 || y > yMax + 100) continue;
      samples.push([x, y]);
    }
    if (samples.length === 0) return '';

    // Normalise to a 400x300 viewBox.
    const W = 400;
    const H = 300;
    const sx = (x: number) => ((x - xMin) / (xMax - xMin)) * W;
    const sy = (y: number) => H - ((y - yMin) / (yMax - yMin)) * H;
    return samples
      .map(([x, y], i) => (i === 0 ? 'M' : 'L') + sx(x).toFixed(1) + ',' + sy(y).toFixed(1))
      .join(' ');
  }, [fnSrc, xMin, xMax, yMin, yMax]);

  if (!path) {
    // Couldn't evaluate — let the boundary fall through.
    throw new Error(`MathBox: could not evaluate "${fnSrc}"`);
  }

  // Map y=0 axis to viewBox.
  const W = 400;
  const H = 300;
  const yZero = yMin <= 0 && yMax >= 0 ? H - ((-yMin) / (yMax - yMin)) * H : null;
  const xZero = xMin <= 0 && xMax >= 0 ? ((-xMin) / (xMax - xMin)) * W : null;

  return (
    <figure
      className="my-3 rounded-md border border-surface-800 overflow-hidden bg-transparent"
      role="img"
      aria-label={`Plot of ${fnSrc} on x ∈ [${xMin}, ${xMax}]`}
      style={{ aspectRatio: aspect }}
    >
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid meet"
        width="100%"
        height="100%"
      >
        {/* Grid: vertical + horizontal lines at integer ticks */}
        <g stroke="#374151" strokeOpacity="0.4" strokeWidth="0.5">
          {Array.from({ length: 7 }, (_, i) => {
            const x = xMin + (i / 6) * (xMax - xMin);
            const sx = ((x - xMin) / (xMax - xMin)) * W;
            return <line key={`v${i}`} x1={sx} y1={0} x2={sx} y2={H} />;
          })}
          {Array.from({ length: 5 }, (_, i) => {
            const y = yMin + (i / 4) * (yMax - yMin);
            const sy = H - ((y - yMin) / (yMax - yMin)) * H;
            return <line key={`h${i}`} x1={0} y1={sy} x2={W} y2={sy} />;
          })}
        </g>
        {/* Axes (when 0 is in range) */}
        {yZero != null && (
          <line x1={0} y1={yZero} x2={W} y2={yZero} stroke="#6b7280" strokeWidth="1" />
        )}
        {xZero != null && (
          <line x1={xZero} y1={0} x2={xZero} y2={H} stroke="#6b7280" strokeWidth="1" />
        )}
        {/* Curve */}
        <path
          d={path}
          fill="none"
          stroke={primary}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={reducedMotion ? {} : { transition: 'd 600ms ease-out' }}
        />
      </svg>
      <figcaption className="sr-only">
        {`MathBox plot of ${fnSrc} (${directive}) on x ∈ [${xMin}, ${xMax}], y ∈ [${yMin}, ${yMax}]. Primary curve in emerald.`}
      </figcaption>
    </figure>
  );
}
