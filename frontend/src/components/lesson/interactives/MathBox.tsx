/**
 * MathBox — Tier 1 interactive (smart wrapper).
 *
 * For 3D directives (math3d/surface/vectorfield), tries to load mathbox.js
 * via unpkg. The bundle pulls Three.js (~600KB) so this is gated behind the
 * directive type — 2D parametric atoms always render through MathBoxLite
 * with no extra cost. On any load failure (timeout, blocked CDN, reduced
 * data), we cascade to MathBoxLite which projects the function to 2D.
 *
 * Theme overrides per design review:
 *   bg: transparent
 *   primary curve: #10b981 (emerald)
 *   axes: #374151 (surface-3)
 */

import { useEffect, useRef, useState } from 'react';
import type { DirectiveProps } from './registry';
import { MathBoxLite } from './MathBoxLite';
import { loadScript } from '@/lib/loadScript';

interface MathBoxAttrs {
  function?: string;
  fn?: string;
  x?: string;
  y?: string;
  z?: string;
  color?: string;
  aspect?: string;
}

const THREE_CDN = 'https://unpkg.com/three@0.133.1/build/three.min.js';
const MATHBOX_CDN = 'https://unpkg.com/mathbox@2.4.1/build/bundle/mathbox.js';
const MATHBOX_CSS = 'https://unpkg.com/mathbox@2.4.1/build/mathbox.css';

const THREE_DIRECTIVES = new Set(['math3d', 'surface', 'vectorfield']);

type LoadState = 'pending' | 'webgl' | 'lite';

function ensureCss(href: string) {
  if (typeof document === 'undefined') return;
  if (document.querySelector(`link[href="${href}"]`)) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  document.head.appendChild(link);
}

export default function MathBox({ directive, attrs }: DirectiveProps) {
  const a = attrs as MathBoxAttrs;
  const is3d = THREE_DIRECTIVES.has(directive as string);
  const [state, setState] = useState<LoadState>(is3d ? 'pending' : 'lite');
  const containerRef = useRef<HTMLDivElement | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!is3d) return;
    let cancelled = false;
    ensureCss(MATHBOX_CSS);
    // Sequence: Three first, then MathBox (which depends on THREE global).
    loadScript(THREE_CDN, { globalProbe: () => (window as any).THREE, timeoutMs: 6000 })
      .then(() => loadScript(MATHBOX_CDN, { globalProbe: () => (window as any).mathBox, timeoutMs: 6000 }))
      .then((mathBoxFactory: any) => {
        if (cancelled || !containerRef.current) return;
        try {
          const mb = mathBoxFactory({
            element: containerRef.current,
            plugins: ['core', 'controls', 'cursor'],
            controls: { klass: (window as any).THREE.OrbitControls },
          });
          const three = mb.three;
          three.renderer.setClearColor(new (window as any).THREE.Color('#0b0d10'), 0);
          mb.set('scale', 720, 'focus', 3);
          const view = mb.cartesian({ range: [[-3, 3], [-3, 3], [-3, 3]], scale: [1, 1, 1] });
          view.axis({ axis: 1, color: '#374151' })
              .axis({ axis: 2, color: '#374151' })
              .axis({ axis: 3, color: '#374151' });
          const fnSrc = (a.function || a.fn || 'sin(x)*cos(y)').trim();
          const expr = `(x, y) => { try { with (Math) { return (${fnSrc.replace(/\^/g, '**')}); } } catch { return 0; } }`;
          // eslint-disable-next-line no-new-func
          const fn = new Function(`return ${expr}`)();
          view.area({
            width: 32, height: 32,
            axes: [1, 3],
            expr: (emit: any, x: number, y: number) => emit(x, fn(x, y), y),
            channels: 3,
          }).surface({ color: '#10b981', shaded: true, lineX: false, lineY: false });
          cleanupRef.current = () => { try { mb.destroy(); } catch { /* ignore */ } };
          setState('webgl');
        } catch {
          setState('lite');
        }
      })
      .catch(() => {
        if (!cancelled) setState('lite');
      });
    return () => {
      cancelled = true;
      cleanupRef.current?.();
      cleanupRef.current = null;
    };
  }, [is3d, a.function, a.fn]);

  if (state === 'lite') {
    return <MathBoxLite directive={directive} attrs={a} />;
  }

  return (
    <figure
      className="my-3 rounded-md border border-surface-800 overflow-hidden bg-transparent"
      role="img"
      aria-label={`3D plot of ${a.function || a.fn || 'surface'}`}
      style={{ aspectRatio: a.aspect || '4 / 3' }}
    >
      <div
        ref={containerRef}
        className={state === 'pending' ? 'animate-pulse bg-surface-800/40' : ''}
        style={{ width: '100%', height: '100%', minHeight: 280 }}
      />
      <figcaption className="sr-only">
        {`Interactive 3D plot of ${a.function || a.fn || 'surface'} (${directive}).`}
      </figcaption>
    </figure>
  );
}
