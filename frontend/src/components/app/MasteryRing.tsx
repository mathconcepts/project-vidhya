/**
 * MasteryRing (app) — SVG circular progress indicator.
 * Color auto-selects: red (<40%) → orange (40–70%) → green (≥70%).
 * Uses Clarity CSS vars, not hard-coded Tailwind stroke classes.
 */
import { useEffect, useState } from 'react';

interface MasteryRingProps {
  value: number; // 0-100
  size?: number;
  strokeWidth?: number;
  className?: string;
  children?: React.ReactNode;
}

export function MasteryRing({
  value,
  size = 40,
  strokeWidth = 3,
  className = '',
  children,
}: MasteryRingProps) {
  const [animatedValue, setAnimatedValue] = useState(0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animatedValue / 100) * circumference;

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedValue(value), 100);
    return () => clearTimeout(timer);
  }, [value]);

  const strokeColor = value >= 70
    ? 'var(--green)'
    : value >= 40
    ? 'var(--orange)'
    : 'var(--red)';

  const bgOpacity = 0.15;

  const reducedMotion = typeof window !== 'undefined'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return (
    <div className={className} style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          stroke={strokeColor}
          strokeOpacity={bgOpacity}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          stroke={strokeColor}
          style={{ transition: reducedMotion ? 'none' : 'stroke-dashoffset 0.8s ease-out' }}
        />
      </svg>
      {children && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {children}
        </div>
      )}
    </div>
  );
}
