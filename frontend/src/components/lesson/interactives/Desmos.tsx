/**
 * Desmos — Tier 2 free embed.
 *
 * Strategy: try the official Desmos calculator from the CDN first. If the
 * script fails to load (network blocked, metered connection, timeout) or
 * the user has prefers-reduced-data, fall through to the built-in
 * SVG-based DesmosLite renderer. Either way the directive renders.
 *
 * Theme overrides on the official calc:
 *   bg: surface-1 (#111827)
 *   curve: emerald (#10b981)
 *
 * The DesmosLite path uses the same theme tokens via SVG.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import type { DirectiveProps } from './registry';
import { DesmosLite } from './DesmosLite';
import { loadScript } from '@/lib/loadScript';

interface DesmosAttrs {
  equation?: string;
  expression?: string;
  /** Sliders syntax: "a:-3,3,1; b:0,5,2" (name:min,max,default; ...) */
  sliders?: string;
  x?: string;
  y?: string;
}

interface SliderSpec {
  name: string;
  min: number;
  max: number;
  default: number;
}

function parseSliders(s: string | undefined): SliderSpec[] {
  if (!s) return [];
  return s
    .split(/[;\n]+/)
    .map((seg) => seg.trim())
    .filter(Boolean)
    .map((seg) => {
      const m = seg.match(/^([a-z])\s*:\s*(-?\d+(\.\d+)?)\s*,\s*(-?\d+(\.\d+)?)\s*(,\s*(-?\d+(\.\d+)?))?$/i);
      if (!m) return null;
      return {
        name: m[1],
        min: Number(m[2]),
        max: Number(m[4]),
        default: m[7] != null ? Number(m[7]) : (Number(m[2]) + Number(m[4])) / 2,
      };
    })
    .filter((x): x is SliderSpec => x != null);
}

const DESMOS_CDN = 'https://www.desmos.com/api/v1.10/calculator.js?apiKey=dcb31709b452b1cf9dc26972add0fda6';

type LoadState = 'pending' | 'cdn' | 'lite';

export default function Desmos({ attrs }: DirectiveProps) {
  const a = attrs as DesmosAttrs;
  const eqSrc = (a.equation || a.expression || 'x^2').trim();
  const sliderSpecs = useMemo(() => parseSliders(a.sliders), [a.sliders]);
  const [state, setState] = useState<LoadState>('pending');
  const containerRef = useRef<HTMLDivElement | null>(null);
  const calcRef = useRef<any>(null);

  // Attempt CDN load on mount; fall through to lite renderer on any failure.
  useEffect(() => {
    let cancelled = false;
    loadScript(DESMOS_CDN, {
      globalProbe: () => (window as any).Desmos,
      timeoutMs: 5000,
    })
      .then((Desmos) => {
        if (cancelled) return;
        if (!containerRef.current) {
          setState('lite');
          return;
        }
        try {
          const calc = Desmos.GraphingCalculator(containerRef.current, {
            keypad: false,
            expressions: false,
            settingsMenu: false,
            zoomButtons: false,
            border: false,
            lockViewport: false,
          });
          // Set viewport explicitly for predictable presentation.
          calc.setMathBounds({
            left: -5, right: 5, bottom: -5, top: 25,
          });
          // Plug in sliders + the equation as Desmos expressions.
          for (const s of sliderSpecs) {
            calc.setExpression({ id: `slider-${s.name}`, latex: `${s.name}=${s.default}`, sliderBounds: { min: String(s.min), max: String(s.max) } });
          }
          calc.setExpression({ id: 'main', latex: `y=${eqSrc.replace(/\*\*/g, '^')}`, color: '#10b981', lineWidth: 3 });
          calcRef.current = calc;
          setState('cdn');
        } catch {
          setState('lite');
        }
      })
      .catch(() => {
        if (!cancelled) setState('lite');
      });
    return () => {
      cancelled = true;
      try { calcRef.current?.destroy?.(); } catch { /* ignore */ }
      calcRef.current = null;
    };
  }, [eqSrc, sliderSpecs]);

  if (state === 'lite') {
    return <DesmosLite attrs={a} />;
  }

  // 'pending' or 'cdn' — render a host element. While pending, show a
  // skeleton matching the eventual calculator height so the layout doesn't
  // shift when the script lands.
  return (
    <figure
      className="my-3 rounded-md border border-surface-800 overflow-hidden bg-surface-900/50"
      role="img"
      aria-label={`Interactive plot of ${eqSrc}`}
    >
      <div
        ref={containerRef}
        style={{ height: 320 }}
        className={state === 'pending' ? 'animate-pulse bg-surface-800/40' : ''}
      />
      <figcaption className="sr-only">
        Interactive plot of {eqSrc}.
      </figcaption>
    </figure>
  );
}
