/**
 * Manim — Tier 0 pre-rendered MP4 video provider.
 *
 * Per the eng review's Manim policy: build-time only, never browser-rendered.
 * If the MP4 file is missing, throws so the boundary falls through to
 * StaticFallback (which serves a captioned still SVG).
 *
 * Reduced-motion: when prefers-reduced-motion is set, render the poster
 * frame only with a "Tap to play" affordance — no auto-play.
 *
 * preload="metadata" so only the poster loads until the user taps play
 * (saves bandwidth on slow connections).
 */

import { useEffect, useState } from 'react';
import type { DirectiveProps } from './registry';

interface ManimAttrs {
  src: string;
  alt?: string;
  caption?: string;
  poster?: string;
  autoplay?: string; // "once" or omitted
  muted?: string;
}

export default function Manim({ attrs }: DirectiveProps) {
  const a = attrs as Partial<ManimAttrs>;
  const src = a.src;
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const onChange = () => setReducedMotion(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  if (!src) {
    throw new Error('Manim: missing required src attribute');
  }

  const autoplay = a.autoplay === 'once' && !reducedMotion;
  // VTT captions are sibling: foo.mp4 → foo.vtt
  const captionsSrc = src.replace(/\.(mp4|webm|ogg)$/i, '.vtt');

  return (
    <figure className="my-3 rounded-md border border-surface-800 overflow-hidden bg-surface-900">
      <video
        src={src}
        poster={a.poster}
        autoPlay={autoplay}
        muted={autoplay || a.muted === 'true'}
        playsInline
        controls
        preload="metadata"
        className="w-full h-auto"
        aria-label={a.alt ?? a.caption ?? 'Animated explanation'}
      >
        <track kind="captions" src={captionsSrc} default />
        Your browser does not support video playback.
      </video>
      {a.caption && (
        <figcaption className="px-3 py-2 text-xs text-surface-400 border-t border-surface-800">
          {a.caption}
        </figcaption>
      )}
    </figure>
  );
}
