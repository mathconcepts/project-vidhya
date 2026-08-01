export interface SegmentedControlProps {
  options: Array<{ value: string; label: string }>;
  value?: string;
  onChange?: (value: string) => void;
  full?: boolean;
}

export function SegmentedControl({
  options = [],
  value,
  onChange,
  full = false,
}: SegmentedControlProps) {
  return (
    <div
      role="tablist"
      style={{
        display: full ? 'grid' : 'inline-grid',
        gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))`,
        gap: 2,
        padding: 2,
        borderRadius: 'var(--radius-sm)',
        background: 'var(--surface-fill)',
      }}
    >
      {options.map(o => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange?.(o.value)}
            style={{
              height: 34,
              padding: '0 14px',
              border: 'none',
              cursor: 'pointer',
              borderRadius: 'calc(var(--radius-sm) - 2px)',
              background: active ? 'var(--surface-card)' : 'transparent',
              boxShadow: active ? 'var(--shadow-raise)' : 'none',
              color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontFamily: 'var(--font-sans)',
              fontSize: 'var(--text-footnote)',
              fontWeight: active ? 'var(--weight-semibold)' : 'var(--weight-medium)',
              transition: 'background var(--dur-fast) var(--ease-standard)',
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
