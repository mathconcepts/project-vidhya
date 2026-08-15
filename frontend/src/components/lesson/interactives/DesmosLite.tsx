/**
 * DesmosLite — built-in SVG plotter used as fallback when the official
 * Desmos calculator CDN is unreachable, blocked, or under reduced-data.
 *
 * Same prop shape as the full Desmos provider, so the smart wrapper in
 * Desmos.tsx can swap to this without re-parsing attrs. The built-in
 * evaluator only handles polynomial / trig / exp expressions safely
 * via a regex whitelist; that covers the vast majority of seed atoms.
 */

import { useMemo, useState } from 'react';
import { type SliderSpec, parseSliders, parseRange } from './plot-utils';

interface DesmosLiteAttrs {
  equation?: string;
  expression?: string;
  /** Sliders syntax: "a:-3,3,1; b:0,5,2" (name:min,max,default; ...) */
  sliders?: string;
  x?: string;
  y?: string;
}

function evaluateWithVars(src: string, vars: Record<string, number>, x: number): number | null {
  let expr = src.replace(/\^/g, '**');
  const names = Object.keys(vars).sort((a, b) => b.length - a.length);
  for (const name of names) {
    const re = new RegExp(`\\b${name}\\b`, 'g');
    expr = expr.replace(re, `(${vars[name]})`);
  }
  expr = expr
    .replace(/\bsin\b/g, 'Math.sin')
    .replace(/\bcos\b/g, 'Math.cos')
    .replace(/\btan\b/g, 'Math.tan')
    .replace(/\blog\b/g, 'Math.log')
    .replace(/\bln\b/g, 'Math.log')
    .replace(/\bexp\b/g, 'Math.exp')
    .replace(/\bsqrt\b/g, 'Math.sqrt')
    .replace(/\babs\b/g, 'Math.abs')
    .replace(/\bpi\b/gi, 'Math.PI');
  if (!/^[\d\s+\-*/().,xMath.PIE\sa-z\b]+$/i.test(expr)) return null;
  try {
    // eslint-disable-next-line no-new-func
    const f = new Function('x', `return (${expr});`);
    const v = f(x);
    return Number.isFinite(v) ? v : null;
  } catch {
    return null;
  }
}

export function DesmosLite({ attrs }: { attrs: DesmosLiteAttrs }) {
  const eqSrc = (attrs.equation || attrs.expression || 'x^2').trim();
  const sliderSpecs = useMemo(() => parseSliders(attrs.sliders), [attrs.sliders]);
  const [xMin, xMax] = parseRange(attrs.x, [-5, 5]);
  const [yMin, yMax] = parseRange(attrs.y, [-5, 25]);

  const [vars, setVars] = useState<Record<string, number>>(() => {
    const out: Record<string, number> = {};
    for (const s of sliderSpecs) out[s.name] = s.default;
    return out;
  });

  const path = useMemo(() => {
    const n = 80;
    const W = 400;
    const H = 300;
    const samples: Array<[number, number]> = [];
    for (let i = 0; i <= n; i++) {
      const x = xMin + (i / n) * (xMax - xMin);
      const y = evaluateWithVars(eqSrc, vars, x);
      if (y == null) continue;
      samples.push([x, y]);
    }
    if (samples.length === 0) return '';
    const sx = (x: number) => ((x - xMin) / (xMax - xMin)) * W;
    const sy = (y: number) => H - ((y - yMin) / (yMax - yMin)) * H;
    return samples
      .map(([x, y], i) => (i === 0 ? 'M' : 'L') + sx(x).toFixed(1) + ',' + sy(y).toFixed(1))
      .join(' ');
  }, [eqSrc, vars, xMin, xMax, yMin, yMax]);

  if (!path) {
    throw new Error(`DesmosLite: could not evaluate "${eqSrc}"`);
  }

  const W = 400;
  const H = 300;
  const yZero = yMin <= 0 && yMax >= 0 ? H - ((-yMin) / (yMax - yMin)) * H : null;
  const xZero = xMin <= 0 && xMax >= 0 ? ((-xMin) / (xMax - xMin)) * W : null;

  return (
    <figure
      className="my-3 rounded-md border overflow-hidden"
      style={{ borderColor: 'var(--separator)', background: 'var(--surface-card)' }}
      role="img"
      aria-label={`Plot of ${eqSrc} with ${sliderSpecs.length} parameter slider(s)`}
    >
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" width="100%" height="auto">
        <g stroke="var(--separator)" strokeOpacity="0.6" strokeWidth="0.5">
          {Array.from({ length: 7 }, (_, i) => {
            const sx = (i / 6) * W;
            return <line key={`v${i}`} x1={sx} y1={0} x2={sx} y2={H} />;
          })}
          {Array.from({ length: 5 }, (_, i) => {
            const sy = (i / 4) * H;
            return <line key={`h${i}`} x1={0} y1={sy} x2={W} y2={sy} />;
          })}
        </g>
        {yZero != null && <line x1={0} y1={yZero} x2={W} y2={yZero} stroke="#6b7280" strokeWidth="1" />}
        {xZero != null && <line x1={xZero} y1={0} x2={xZero} y2={H} stroke="#6b7280" strokeWidth="1" />}
        <path d={path} fill="none" stroke="var(--green)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {sliderSpecs.length > 0 && (
        <div className="px-3 py-2 border-t space-y-1.5" style={{ borderColor: 'var(--separator)' }}>
          {sliderSpecs.map((s) => (
            <div key={s.name} className="flex items-center gap-2 text-xs">
              <span className="font-mono w-4" style={{ color: 'var(--indigo-ink)' }}>{s.name}</span>
              <input
                type="range"
                min={s.min}
                max={s.max}
                step={(s.max - s.min) / 100}
                value={vars[s.name] ?? s.default}
                onChange={(e) => setVars((v) => ({ ...v, [s.name]: Number(e.target.value) }))}
                className="flex-1"
                style={{ accentColor: 'var(--indigo)' }}
                aria-label={`Slider for ${s.name}`}
              />
              <span className="font-mono tabular-nums w-12 text-right" style={{ color: 'var(--text-secondary)' }}>
                {(vars[s.name] ?? s.default).toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      )}
      <figcaption className="sr-only">
        Built-in plot of {eqSrc}.
      </figcaption>
    </figure>
  );
}
