import React from 'react';

export function ChatBubble({ from = 'tutor', children, footer }) {
  const mine = from === 'student';
  return (
    <div style={{ display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start', marginBottom: 10 }}>
      <div style={{
        maxWidth: '82%', padding: '10px 14px', fontFamily: 'var(--font-sans)',
        fontSize: 'var(--text-callout)', lineHeight: 'var(--leading-normal)',
        borderRadius: 20,
        borderBottomRightRadius: mine ? 6 : 20, borderBottomLeftRadius: mine ? 20 : 6,
        background: mine ? 'var(--indigo)' : 'var(--surface-card)',
        color: mine ? '#fff' : 'var(--text-primary)',
        boxShadow: mine ? 'none' : 'var(--shadow-raise)',
      }}>
        {children}
        {footer && <div style={{ marginTop: 8, fontSize: 'var(--text-caption)', color: mine ? 'rgba(255,255,255,0.7)' : 'var(--text-secondary)' }}>{footer}</div>}
      </div>
    </div>
  );
}
