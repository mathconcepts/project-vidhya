/**
 * Simulation.tsx
 *
 * Parameterized animation. Plays a (x(t), y(t)) trace over a small SVG
 * canvas; play/pause via a single button. Honors prefers-reduced-motion
 * (renders the static endpoint instead of animating).
 *
 * No D3 / canvas — plain SVG path with a moving circle. Light and good
 * enough for v1 of "watch the eigenvector trace stay parallel".
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { evalFormula, type SimulationSpec } from './types';

const SVG_W = 320;
const SVG_H = 200;
const PADDING = 16;

interface Props {
  spec: SimulationSpec;
}

export function Simulation({ spec }: Props) {
  const samples = useMemo(() => sampleCurve(spec), [spec]);
  const viewBox = useMemo(
    () => spec.view_box ?? autoViewBox(samples.points),
    [spec.view_box, samples.points],
  );
  const projector = useMemo(() => makeProjector(viewBox), [viewBox]);

  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(1); // 0..1, 1 = fully traced
  const reducedMotion = usePrefersReducedMotion();
  const rafRef = useRef<number | null>(null);
  const lastTickRef = useRef<number>(0);

  const duration = (spec.duration_sec ?? 4) * 1000;

  // Tick loop
  useEffect(() => {
    if (!playing) return;
    function tick(now: number) {
      const dt = lastTickRef.current ? now - lastTickRef.current : 0;
      lastTickRef.current = now;
      setProgress((p) => {
        const next = p + dt / duration;
        if (next >= 1) {
          setPlaying(false);
          return 1;
        }
        return next;
      });
      rafRef.current = requestAnimationFrame(tick);
    }
    lastTickRef.current = 0;
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [playing, duration]);

  function play() {
    if (progress >= 1) setProgress(0);
    setPlaying(true);
  }
  function reset() {
    setPlaying(false);
    setProgress(reducedMotion ? 1 : 0);
  }

  if (samples.error) {
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-3 text-xs text-red-300">
        Simulation error: {samples.error}
      </div>
    );
  }

  // Compute the visible portion of the path
  const cutoff = Math.max(1, Math.round(samples.points.length * (reducedMotion ? 1 : progress)));
  const visiblePoints = samples.points.slice(0, cutoff);
  const head = visiblePoints[visiblePoints.length - 1];
  const pathD = visiblePoints
    .map((p, i) => {
      const [x, y] = projector(p.x, p.y);
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(' ');

  return (
    <div className="rounded-xl border border-violet-500/25 bg-violet-500/5 p-4 space-y-3">
      <header className="flex items-center justify-between gap-2">
        <h4 className="text-sm font-semibold text-surface-100">{spec.title}</h4>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => (playing ? setPlaying(false) : play())}
            disabled={reducedMotion}
            className="p-1.5 rounded-md bg-surface-900 border border-surface-800 text-surface-300 hover:text-violet-300 disabled:opacity-50"
            aria-label={playing ? 'Pause simulation' : 'Play simulation'}
          >
            {playing ? <Pause size={12} /> : <Play size={12} />}
          </button>
          <button
            type="button"
            onClick={reset}
            disabled={reducedMotion}
            className="p-1.5 rounded-md bg-surface-900 border border-surface-800 text-surface-300 hover:text-violet-300 disabled:opacity-50"
            aria-label="Reset simulation"
          >
            <RotateCcw size={12} />
          </button>
        </div>
      </header>

      <svg
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        width="100%"
        className="rounded-md bg-surface-900/40 border border-surface-800"
        preserveAspectRatio="xMidYMid meet"
        aria-label={`Animated trace: ${spec.title}`}
      >
        <Axes viewBox={viewBox} projector={projector} />
        {pathD && (
          <path d={pathD} stroke="currentColor" strokeWidth={2} fill="none" className="text-violet-400" />
        )}
        {head && (
          <circle
            cx={projector(head.x, head.y)[0]}
            cy={projector(head.x, head.y)[1]}
            r={4}
            className="fill-emerald-400"
          />
        )}
      </svg>

      {reducedMotion && (
        <p className="text-[10px] text-surface-600">
          Reduced-motion enabled — showing the final trace instead of animation.
        </p>
      )}

      {spec.caption && <p className="text-[11px] text-surface-500 leading-relaxed">{spec.caption}</p>}
    </div>
  );
}

// ============================================================================
// Sampling + projection helpers
// ============================================================================

function sampleCurve(spec: SimulationSpec): { points: Array<{ x: number; y: number }>; error: string | null } {
  const n = 80;
  const points: Array<{ x: number; y: number }> = [];
  const span = spec.t_max - spec.t_min;
  for (let i = 0; i <= n; i++) {
    const t = spec.t_min + (span * i) / n;
    let x: number, y: number;
    try {
      x = evalFormula(spec.x_expr, { t });
      y = evalFormula(spec.y_expr, { t });
    } catch (e) {
      return { points: [], error: (e as Error).message };
    }
    if (Number.isFinite(x) && Number.isFinite(y)) points.push({ x, y });
  }
  if (points.length === 0) return { points, error: 'no finite samples' };
  return { points, error: null };
}

function autoViewBox(points: Array<{ x: number; y: number }>): SimulationSpec['view_box'] {
  let xMin = Infinity, xMax = -Infinity, yMin = Infinity, yMax = -Infinity;
  for (const p of points) {
    if (p.x < xMin) xMin = p.x;
    if (p.x > xMax) xMax = p.x;
    if (p.y < yMin) yMin = p.y;
    if (p.y > yMax) yMax = p.y;
  }
  const padX = (xMax - xMin) * 0.1 || 1;
  const padY = (yMax - yMin) * 0.1 || 1;
  return { x_min: xMin - padX, x_max: xMax + padX, y_min: yMin - padY, y_max: yMax + padY };
}

function makeProjector(view_box: SimulationSpec['view_box']) {
  const v = view_box ?? { x_min: -1, x_max: 1, y_min: -1, y_max: 1 };
  const innerW = SVG_W - PADDING * 2;
  const innerH = SVG_H - PADDING * 2;
  return (x: number, y: number): [number, number] => {
    const px = PADDING + ((x - v.x_min) / (v.x_max - v.x_min)) * innerW;
    const py = PADDING + ((v.y_max - y) / (v.y_max - v.y_min)) * innerH;
    return [px, py];
  };
}

// ============================================================================
// Axes (light grid lines through origin if visible)
// ============================================================================

function Axes({
  viewBox,
  projector,
}: {
  viewBox: SimulationSpec['view_box'];
  projector: (x: number, y: number) => [number, number];
}) {
  const v = viewBox ?? { x_min: -1, x_max: 1, y_min: -1, y_max: 1 };
  const showX = v.y_min < 0 && v.y_max > 0;
  const showY = v.x_min < 0 && v.x_max > 0;
  return (
    <g className="text-surface-700 stroke-current" strokeWidth={1} fill="none">
      <rect x={0} y={0} width={SVG_W} height={SVG_H} className="fill-transparent" />
      {showX && (() => {
        const [x1, y1] = projector(v.x_min, 0);
        const [x2, y2] = projector(v.x_max, 0);
        return <line x1={x1} y1={y1} x2={x2} y2={y2} />;
      })()}
      {showY && (() => {
        const [x1, y1] = projector(0, v.y_min);
        const [x2, y2] = projector(0, v.y_max);
        return <line x1={x1} y1={y1} x2={x2} y2={y2} />;
      })()}
    </g>
  );
}

// ============================================================================
// prefers-reduced-motion hook
// ============================================================================

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mql.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mql.addEventListener?.('change', handler);
    return () => mql.removeEventListener?.('change', handler);
  }, []);
  return reduced;
}
