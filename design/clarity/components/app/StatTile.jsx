import React from 'react';

export function StatTile({ value, label, delta, tone = 'neutral' }) {
  const color = tone === 'mastery' ? 'var(--green-ink)' : tone === 'tutor' ? 'var(--indigo-ink)' : 'var(--text-primary)';
  return (
    <div style={{
      background: 'var(--surface-card)', borderRadius: 'var(--radius-md)', padding: 16,
      boxShadow: 'var(--shadow-raise)', fontFamily: 'var(--font-sans)',
    }}>
      <div style={{
        fontSize: 'var(--text-title1)', fontWeight: 'var(--weight-semibold)', color,
        letterSpacing: 'var(--tracking-title)', fontVariantNumeric: 'tabular-nums', lineHeight: 1.1,
      }}>{value}</div>
      <div style={{ marginTop: 4, fontSize: 'var(--text-footnote)', color: 'var(--text-secondary)' }}>{label}</div>
      {delta && <div style={{ marginTop: 6, fontSize: 'var(--text-caption)', color: 'var(--green-ink)' }}>{delta}</div>}
    </div>
  );
}
