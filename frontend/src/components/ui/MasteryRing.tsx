import { useState, useEffect, type ReactNode } from 'react';

export interface MasteryRingProps {
  value: number;
  size?: number;
  stroke?: number;
  label?: ReactNode;
  animate?: boolean;
}

export function MasteryRing({
  value = 0,
  size = 56,
  stroke = 5,
  label,
  animate = true,
}: MasteryRingProps) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const [shown, setShown] = useState(animate ? 0 : value);

  useEffect(() => {
    const t = setTimeout(() => setShown(value), 60);
    return () => clearTimeout(t);
  }, [value]);

  const color =
    value >= 70 ? 'var(--green)' : value >= 40 ? 'var(--orange)' : 'var(--red)';

  return (
    <div
      style={{
        position: 'relative',
        width: size,
        height: size,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--surface-fill)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (shown / 100) * c}
          style={{ transition: 'stroke-dashoffset var(--dur-slow) var(--ease-out)' }}
        />
      </svg>
      <span
        style={{
          position: 'absolute',
          fontFamily: 'var(--font-sans)',
          fontSize: size > 48 ? 'var(--text-subhead)' : 'var(--text-caption)',
          fontWeight: 'var(--weight-semibold)',
          color: 'var(--text-primary)',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {label != null ? label : `${value}%`}
      </span>
    </div>
  );
}
