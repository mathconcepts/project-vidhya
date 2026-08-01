import type { ReactNode } from 'react';

export interface FilterPillProps {
  active?: boolean;
  count?: number;
  onClick?: () => void;
  children?: ReactNode;
}

export function FilterPill({ active = false, count, onClick, children }: FilterPillProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        height: 34,
        padding: '0 14px',
        borderRadius: 'var(--radius-capsule)',
        border: 'none',
        cursor: 'pointer',
        background: active ? 'var(--ink)' : 'var(--surface-fill)',
        color: active ? 'var(--surface-card)' : 'var(--text-secondary)',
        fontFamily: 'var(--font-sans)',
        fontSize: 'var(--text-footnote)',
        fontWeight: 'var(--weight-medium)',
        whiteSpace: 'nowrap',
        transition: 'background var(--dur-fast) var(--ease-standard)',
      }}
    >
      {children}
      {count != null && (
        <span style={{ opacity: 0.55, fontVariantNumeric: 'tabular-nums' }}>{count}</span>
      )}
    </button>
  );
}
