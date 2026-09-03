import { useState, type CSSProperties, type ReactNode } from 'react';

export interface IconButtonProps {
  label: string;
  size?: number;
  tone?: 'neutral' | 'mastery' | 'tutor';
  filled?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  children?: ReactNode;
  style?: CSSProperties;
}

export function IconButton({
  label,
  size = 44,
  tone = 'neutral',
  filled = false,
  disabled = false,
  onClick,
  children,
  style,
}: IconButtonProps) {
  const [down, setDown] = useState(false);
  const color =
    tone === 'tutor'
      ? 'var(--indigo-ink)'
      : tone === 'mastery'
      ? 'var(--green-ink)'
      : 'var(--text-secondary)';

  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      onPointerDown={() => setDown(true)}
      onPointerUp={() => setDown(false)}
      onPointerLeave={() => setDown(false)}
      style={{
        width: size,
        height: size,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 'var(--radius-capsule)',
        border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.35 : 1,
        color,
        background: filled ? 'var(--surface-fill)' : 'transparent',
        transform: down && !disabled ? 'scale(var(--press-scale))' : 'scale(1)',
        transition:
          'transform var(--dur-fast) var(--ease-standard), background var(--dur-fast) var(--ease-standard)',
        ...style,
      }}
    >
      {children}
    </button>
  );
}
