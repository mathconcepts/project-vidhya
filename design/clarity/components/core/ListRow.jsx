import React from 'react';

export function ListRow({ title, subtitle, leading, trailing, chevron = false, last = false, onClick }) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 12, width: '100%',
        minHeight: 'var(--touch-min)', padding: '10px 16px', textAlign: 'left',
        background: 'transparent', border: 'none', cursor: onClick ? 'pointer' : 'default',
        borderBottom: last ? 'none' : 'var(--hairline) solid var(--separator)',
        fontFamily: 'var(--font-sans)',
      }}
    >
      {leading}
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: 'block', fontSize: 'var(--text-callout)', fontWeight: 'var(--weight-medium)', color: 'var(--text-primary)' }}>{title}</span>
        {subtitle && <span style={{ display: 'block', fontSize: 'var(--text-footnote)', color: 'var(--text-secondary)', marginTop: 1 }}>{subtitle}</span>}
      </span>
      {trailing}
      {chevron && <span aria-hidden="true" style={{ color: 'var(--text-tertiary)', fontSize: 17 }}>›</span>}
    </Tag>
  );
}
