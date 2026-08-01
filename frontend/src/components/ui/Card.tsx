import type { CSSProperties, ReactNode } from 'react';

export interface CardProps {
  padding?: number;
  radius?: string;
  elevated?: boolean;
  inset?: boolean;
  style?: CSSProperties;
  children?: ReactNode;
  className?: string;
}

export function Card({
  padding = 20,
  radius = 'var(--radius-lg)',
  elevated = false,
  inset = false,
  style,
  children,
  className,
}: CardProps) {
  return (
    <div
      className={className}
      style={{
        background: inset ? 'var(--surface-sunken)' : 'var(--surface-card)',
        borderRadius: radius,
        padding,
        boxShadow: elevated ? 'var(--shadow-card)' : 'var(--shadow-raise)',
        ...style,
      }}
    >
      {children}
    </div>
  );
}
