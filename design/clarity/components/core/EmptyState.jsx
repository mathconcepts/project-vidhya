import React from 'react';

export function EmptyState({ title, body, action, glyph }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: 8, padding: '48px 24px', textAlign: 'center', fontFamily: 'var(--font-sans)',
    }}>
      {glyph && <div style={{ color: 'var(--text-tertiary)', marginBottom: 4 }}>{glyph}</div>}
      <p style={{ margin: 0, fontSize: 'var(--text-title3)', fontWeight: 'var(--weight-semibold)', letterSpacing: 'var(--tracking-title)' }}>{title}</p>
      {body && <p style={{ margin: 0, maxWidth: 280, fontSize: 'var(--text-subhead)', color: 'var(--text-secondary)' }}>{body}</p>}
      {action && <div style={{ marginTop: 12 }}>{action}</div>}
    </div>
  );
}
