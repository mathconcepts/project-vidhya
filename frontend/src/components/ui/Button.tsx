import React, { useState, type ReactNode } from 'react';

const SIZES = {
  sm: { height: 34, padding: '0 14px', font: 'var(--text-footnote)', radius: 'var(--radius-xs)' },
  md: { height: 44, padding: '0 18px', font: 'var(--text-subhead)', radius: 'var(--radius-sm)' },
  lg: { height: 52, padding: '0 22px', font: 'var(--text-body)', radius: 'var(--radius-md)' },
} as const;

const TONE = {
  mastery: { solid: 'var(--green)', press: 'var(--green-press)', tint: 'var(--green-tint)', ink: 'var(--green-ink)' },
  tutor: { solid: 'var(--indigo)', press: 'var(--indigo-press)', tint: 'var(--indigo-tint)', ink: 'var(--indigo-ink)' },
  neutral: { solid: 'var(--ink)', press: 'var(--ink)', tint: 'var(--surface-fill)', ink: 'var(--text-primary)' },
} as const;

export interface ButtonProps {
  variant?: 'filled' | 'tinted' | 'grey' | 'plain';
  tone?: 'mastery' | 'tutor' | 'neutral';
  size?: 'sm' | 'md' | 'lg';
  full?: boolean;
  disabled?: boolean;
  icon?: ReactNode;
  iconAfter?: ReactNode;
  onClick?: () => void;
  children?: ReactNode;
  type?: 'button' | 'submit' | 'reset';
  style?: React.CSSProperties;
}

export function Button({
  variant = 'filled',
  tone = 'mastery',
  size = 'md',
  full = false,
  disabled = false,
  icon = null,
  iconAfter = null,
  onClick,
  children,
  type = 'button',
  style,
}: ButtonProps) {
  const s = SIZES[size] ?? SIZES.md;
  const t = TONE[tone] ?? TONE.mastery;
  const [down, setDown] = useState(false);

  const skin =
    variant === 'filled'
      ? { background: down ? t.press : t.solid, color: 'var(--text-on-accent)', border: 'none' }
      : variant === 'tinted'
      ? { background: t.tint, color: t.ink, border: 'none' }
      : variant === 'grey'
      ? { background: 'var(--surface-fill)', color: 'var(--text-primary)', border: 'none' }
      : { background: 'transparent', color: t.ink, border: 'none' };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      onPointerDown={() => setDown(true)}
      onPointerUp={() => setDown(false)}
      onPointerLeave={() => setDown(false)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        height: s.height,
        padding: s.padding,
        width: full ? '100%' : undefined,
        borderRadius: s.radius,
        fontFamily: 'var(--font-sans)',
        fontSize: s.font,
        fontWeight: 'var(--weight-semibold)',
        letterSpacing: 'var(--tracking-body)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.35 : 1,
        transform: down && !disabled ? 'scale(var(--press-scale))' : 'scale(1)',
        transition:
          'transform var(--dur-fast) var(--ease-standard), background var(--dur-fast) var(--ease-standard)',
        ...skin,
        ...style,
      }}
    >
      {icon}
      {children}
      {iconAfter}
    </button>
  );
}
