/**
 * MathBoxLite — built-in SVG plotter used as fallback when the real
 * mathbox.js CDN bundle (mathbox + three.js, ~750KB total) is unreachable
 * or when the directive is 2D and doesn't need WebGL.
 *
 * Theme overrides per design review:
 *   bg: transparent (atom card surface-1 shows through)
 *   primary curve: var(--green) (mastery green, the design system's plot accent)
 *   axes: var(--separator) (hairline, per the Clarity spacing rules)
 *
 * Reduced-motion: respects `prefers-reduced-motion: reduce`.
 */

import { useMemo } from 'react';
import type { DirectiveType, DirectiveProps } from './registry';
import { parseRange } from './plot-utils';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

interface MathBoxLiteAttrs {
  function?: string;
  fn?: string;
  x?: string;
  y?: string;
  color?: string;
  aspect?: string;
}

function evaluateFn(fnSrc: string, x: number): number | null {
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

export function MathBoxLite({ directive, attrs }: DirectiveProps) {
  // Providers are registered as ComponentType<DirectiveProps>, so attrs arrives
  // as an open map; narrow it here rather than at the signature, which would
  // break assignability for callers passing a library entry's config blob.
  const a = attrs as MathBoxLiteAttrs;
  const reducedMotion = usePrefersReducedMotion();

  const fnSrc = (a.function || a.fn || 'x^2').trim();
  const [xMin, xMax] = parseRange(a.x, [-3, 3]);
  const [yMin, yMax] = parseRange(a.y, [-3, 3]);
  const primary = a.color || 'var(--green)';
  const aspect = a.aspect || '4 / 3';

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
    const W = 400;
    const H = 300;
    const sx = (x: number) => ((x - xMin) / (xMax - xMin)) * W;
    const sy = (y: number) => H - ((y - yMin) / (yMax - yMin)) * H;
    return samples
      .map(([x, y], i) => (i === 0 ? 'M' : 'L') + sx(x).toFixed(1) + ',' + sy(y).toFixed(1))
      .join(' ');
  }, [fnSrc, xMin, xMax, yMin, yMax]);

  if (!path) {
    throw new Error(`MathBoxLite: could not evaluate "${fnSrc}"`);
  }

  const W = 400;
  const H = 300;
  const yZero = yMin <= 0 && yMax >= 0 ? H - ((-yMin) / (yMax - yMin)) * H : null;
  const xZero = xMin <= 0 && xMax >= 0 ? ((-xMin) / (xMax - xMin)) * W : null;

  return (
    <figure
      className="my-3 rounded-md border overflow-hidden bg-transparent"
      role="img"
      aria-label={`Plot of ${fnSrc} on x ∈ [${xMin}, ${xMax}]`}
      style={{ aspectRatio: aspect, borderColor: 'var(--separator)' }}
    >
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" width="100%" height="100%">
        <g stroke="var(--separator)" strokeOpacity="0.6" strokeWidth="0.5">
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
        {yZero != null && <line x1={0} y1={yZero} x2={W} y2={yZero} stroke="#6b7280" strokeWidth="1" />}
        {xZero != null && <line x1={xZero} y1={0} x2={xZero} y2={H} stroke="#6b7280" strokeWidth="1" />}
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
        {`Built-in plot of ${fnSrc} (${directive}) on x ∈ [${xMin}, ${xMax}], y ∈ [${yMin}, ${yMax}].`}
      </figcaption>
    </figure>
  );
}
