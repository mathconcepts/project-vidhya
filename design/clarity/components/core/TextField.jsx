import React from 'react';

export function TextField({ label, placeholder, value, onChange, type = 'text', hint, invalid = false, leading }) {
  const [focus, setFocus] = React.useState(false);
  return (
    <label style={{ display: 'block', fontFamily: 'var(--font-sans)' }}>
      {label && <span style={{ display: 'block', fontSize: 'var(--text-footnote)', color: 'var(--text-secondary)', marginBottom: 6 }}>{label}</span>}
      <span style={{
        display: 'flex', alignItems: 'center', gap: 8, height: 44, padding: '0 14px',
        borderRadius: 'var(--radius-sm)', background: 'var(--surface-fill)',
        boxShadow: invalid ? 'inset 0 0 0 2px var(--red)' : focus ? 'inset 0 0 0 2px var(--indigo)' : 'none',
        transition: 'box-shadow var(--dur-fast) var(--ease-standard)',
      }}>
        {leading}
        <input
          type={type} value={value} placeholder={placeholder}
          onChange={e => onChange && onChange(e.target.value)}
          onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
          style={{
            flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent',
            fontFamily: 'inherit', fontSize: 'var(--text-callout)', color: 'var(--text-primary)',
          }}
        />
      </span>
      {hint && <span style={{ display: 'block', marginTop: 6, fontSize: 'var(--text-caption)', color: invalid ? 'var(--red-ink)' : 'var(--text-secondary)' }}>{hint}</span>}
    </label>
  );
}
