import React from 'react';

export function ProgressBar({ value = 0, tone = 'mastery', height = 6, label, trailing }) {
  const fill = tone === 'tutor' ? 'var(--indigo)' : tone === 'warning' ? 'var(--orange)' : 'var(--green)';
  return (
    <div style={{ fontFamily: 'var(--font-sans)' }}>
      {(label || trailing) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 'var(--text-footnote)' }}>
          <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
          <span style={{ color: 'var(--text-primary)', fontWeight: 'var(--weight-semibold)', fontVariantNumeric: 'tabular-nums' }}>{trailing}</span>
        </div>
      )}
      <div style={{ height, borderRadius: 'var(--radius-capsule)', background: 'var(--surface-fill)', overflow: 'hidden' }}>
        <div style={{
          width: `${Math.max(0, Math.min(100, value))}%`, height: '100%', background: fill,
          borderRadius: 'var(--radius-capsule)', transition: 'width var(--dur-slow) var(--ease-out)',
        }} />
      </div>
    </div>
  );
}
