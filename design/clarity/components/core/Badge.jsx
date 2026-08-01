import React from 'react';

const TONE = {
  neutral: ['var(--surface-fill)', 'var(--text-secondary)'],
  mastery: ['var(--green-tint)', 'var(--green-ink)'],
  tutor: ['var(--indigo-tint)', 'var(--indigo-ink)'],
  warning: ['var(--orange-tint)', 'var(--orange-ink)'],
  error: ['var(--red-tint)', 'var(--red-ink)'],
};

export function Badge({ tone = 'neutral', mono = false, children }) {
  const [bg, fg] = TONE[tone] || TONE.neutral;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 8px', borderRadius: 'var(--radius-xs)', background: bg, color: fg,
      fontFamily: mono ? 'var(--font-mono)' : 'var(--font-sans)',
      fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-semibold)',
      letterSpacing: mono ? 0 : 'var(--tracking-body)', whiteSpace: 'nowrap',
    }}>{children}</span>
  );
}
