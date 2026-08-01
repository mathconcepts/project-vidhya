import type { ReactNode } from 'react';

export interface TabBarProps {
  items: Array<{ value: string; label: string; icon?: ReactNode }>;
  value?: string;
  onChange?: (value: string) => void;
}

export function TabBar({ items = [], value, onChange }: TabBarProps) {
  return (
    <nav
      style={{
        display: 'flex',
        alignItems: 'stretch',
        gap: 0,
        background: 'var(--material-thick)',
        backdropFilter: 'var(--blur-nav)',
        WebkitBackdropFilter: 'var(--blur-nav)',
        borderTop: 'var(--hairline) solid var(--separator)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      {items.map(it => {
        const active = it.value === value;
        return (
          <button
            key={it.value}
            onClick={() => onChange?.(it.value)}
            aria-current={active ? 'page' : undefined}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 3,
              padding: '8px 0 10px',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              color: active ? 'var(--indigo-ink)' : 'var(--text-secondary)',
              fontFamily: 'var(--font-sans)',
              fontSize: 'var(--text-caption2)',
              fontWeight: active ? 'var(--weight-semibold)' : 'var(--weight-medium)',
              transition: 'color var(--dur-fast) var(--ease-standard)',
            }}
          >
            {it.icon && (
              <span aria-hidden="true" style={{ fontSize: 20, lineHeight: 1 }}>
                {it.icon}
              </span>
            )}
            {it.label}
          </button>
        );
      })}
    </nav>
  );
}
