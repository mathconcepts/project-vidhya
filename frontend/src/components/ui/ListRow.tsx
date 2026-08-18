import type { ReactNode } from 'react';

export interface ListRowProps {
  title: string;
  subtitle?: string;
  leading?: ReactNode;
  trailing?: ReactNode;
  chevron?: boolean;
  last?: boolean;
  onClick?: () => void;
  /**
   * Horizontal/vertical padding override. Defaults to the settings-sheet
   * convention ('10px 16px'). A row sitting directly on the bare canvas
   * (DR-1's hairline-rows-on-canvas convention) should pass '0 2px' to stay
   * flush with sibling text instead of picking up an indent.
   */
  padding?: string;
  /** Dims the title to var(--text-secondary) — a de-emphasized row (e.g. a "later" frontier concept). */
  muted?: boolean;
  /** Accessible name when it must carry more than the visible title (e.g. "Diagonalization, after eigenvalues"). */
  ariaLabel?: string;
}

export function ListRow({
  title,
  subtitle,
  leading,
  trailing,
  chevron = false,
  last = false,
  onClick,
  padding = '10px 16px',
  muted = false,
  ariaLabel,
}: ListRowProps) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      onClick={onClick}
      aria-label={ariaLabel}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        width: '100%',
        minHeight: 'var(--touch-min)',
        padding,
        textAlign: 'left',
        background: 'transparent',
        border: 'none',
        cursor: onClick ? 'pointer' : 'default',
        borderBottom: last ? 'none' : 'var(--hairline) solid var(--separator)',
        fontFamily: 'var(--font-sans)',
      }}
    >
      {leading}
      <span style={{ flex: 1, minWidth: 0 }}>
        <span
          style={{
            display: 'block',
            fontSize: 'var(--text-body)',
            fontWeight: 'var(--weight-medium)',
            color: muted ? 'var(--text-secondary)' : 'var(--text-primary)',
          }}
        >
          {title}
        </span>
        {subtitle && (
          <span
            style={{
              display: 'block',
              fontSize: 'var(--text-subhead)',
              color: 'var(--text-secondary)',
              marginTop: 1,
            }}
          >
            {subtitle}
          </span>
        )}
      </span>
      {trailing}
      {chevron && (
        <span aria-hidden="true" style={{ color: 'var(--text-tertiary)', fontSize: 17 }}>
          ›
        </span>
      )}
    </Tag>
  );
}
