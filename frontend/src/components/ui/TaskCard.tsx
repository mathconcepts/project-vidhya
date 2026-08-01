import type { ReactNode } from 'react';

export interface TaskCardProps {
  eyebrow?: string;
  topic: string;
  why?: string;
  progress?: ReactNode;
  action?: ReactNode;
  chips?: ReactNode[];
  onRate?: (rating: string) => void;
}

export function TaskCard({
  eyebrow = 'Your next move',
  topic,
  why,
  progress,
  action,
  chips = [],
  onRate,
}: TaskCardProps) {
  return (
    <div
      style={{
        background: 'var(--surface-card)',
        borderRadius: 'var(--radius-xl)',
        padding: 24,
        boxShadow: 'var(--shadow-card)',
        fontFamily: 'var(--font-sans)',
      }}
    >
      <p style={{ margin: 0, fontSize: 'var(--text-footnote)', color: 'var(--text-secondary)' }}>
        {eyebrow}
      </p>
      <h2
        style={{
          margin: '6px 0 0',
          fontSize: 'var(--text-large)',
          fontWeight: 'var(--weight-bold)',
          letterSpacing: 'var(--tracking-display)',
          lineHeight: 'var(--leading-tight)',
          color: 'var(--text-primary)',
        }}
      >
        {topic}
      </h2>
      {why && (
        <p
          style={{
            margin: '10px 0 0',
            fontSize: 'var(--text-subhead)',
            color: 'var(--text-secondary)',
          }}
        >
          {why}
        </p>
      )}
      {action && <div style={{ marginTop: 18 }}>{action}</div>}
      {chips.length > 0 && (
        <div style={{ display: 'flex', gap: 8, marginTop: 14, overflowX: 'auto' }}>{chips}</div>
      )}
      {progress && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            marginTop: 18,
            paddingTop: 14,
            borderTop: 'var(--hairline) solid var(--separator)',
            fontSize: 'var(--text-footnote)',
            color: 'var(--text-secondary)',
          }}
        >
          <span>{progress}</span>
          {onRate && (
            <span style={{ display: 'flex', gap: 6 }}>
              {(['Done', 'Okay', 'Hard'] as const).map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => onRate(r.toLowerCase())}
                  style={{
                    minHeight: 34,
                    padding: '0 12px',
                    borderRadius: 'var(--radius-xs)',
                    border: 'none',
                    cursor: 'pointer',
                    background: 'var(--surface-fill)',
                    color: 'var(--text-primary)',
                    fontFamily: 'inherit',
                    fontSize: 'var(--text-caption)',
                    fontWeight: 'var(--weight-semibold)',
                  }}
                >
                  {r}
                </button>
              ))}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
