import type { ReactNode } from 'react';

export interface ProgressBarProps {
  value: number;
  tone?: 'mastery' | 'tutor' | 'warning' | 'neutral';
  height?: number;
  label?: string;
  trailing?: ReactNode;
  /**
   * Label text register. 'metadata' (default, var(--text-footnote), 13px)
   * suits a caption line above a stat bar. 'supporting' (var(--text-subhead),
   * 15px) is for a label that reads as real copy, not a caption — e.g. the
   * focused-work strip's "Focused work" line (DR-4, T24).
   */
  labelRegister?: 'metadata' | 'supporting';
  /**
   * Renders the trailing value in the mono tabular-figures register (same
   * family as timers and computed values, DESIGN-SYSTEM.md) instead of the
   * default sans weight — e.g. "64 / 100 min" on the focused-work strip.
   */
  monoTrailing?: boolean;
  /** Skip the fill-transition entirely (caller drives its own once-on-entry animation, or reduced motion applies). */
  disableTransition?: boolean;
}

export function ProgressBar({
  value = 0,
  tone = 'mastery',
  height = 6,
  label,
  trailing,
  labelRegister = 'metadata',
  monoTrailing = false,
  disableTransition = false,
}: ProgressBarProps) {
  const fill =
    tone === 'tutor'
      ? 'var(--indigo)'
      : tone === 'warning'
      ? 'var(--orange)'
      : tone === 'neutral'
      ? 'var(--text-tertiary)'
      : 'var(--green)';

  return (
    <div style={{ fontFamily: 'var(--font-sans)' }}>
      {(label || trailing) && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: 6,
            fontSize: labelRegister === 'supporting' ? 'var(--text-subhead)' : 'var(--text-footnote)',
          }}
        >
          <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
          <span
            style={{
              color: 'var(--text-primary)',
              fontWeight: 'var(--weight-semibold)',
              fontVariantNumeric: 'tabular-nums',
              fontFamily: monoTrailing ? 'var(--font-mono)' : undefined,
            }}
          >
            {trailing}
          </span>
        </div>
      )}
      <div
        style={{
          height,
          borderRadius: 'var(--radius-capsule)',
          background: 'var(--surface-fill)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${Math.max(0, Math.min(100, value))}%`,
            height: '100%',
            background: fill,
            borderRadius: 'var(--radius-capsule)',
            transition: disableTransition ? 'none' : 'width var(--dur-slow) var(--ease-standard)',
          }}
        />
      </div>
    </div>
  );
}
