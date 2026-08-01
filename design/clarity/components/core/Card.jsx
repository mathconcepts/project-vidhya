import React from 'react';

export function Card({ padding = 20, radius = 'var(--radius-lg)', elevated = false, inset = false, style, children }) {
  return (
    <div style={{
      background: inset ? 'var(--surface-sunken)' : 'var(--surface-card)',
      borderRadius: radius,
      padding,
      boxShadow: elevated ? 'var(--shadow-card)' : 'var(--shadow-raise)',
      ...style,
    }}>{children}</div>
  );
}
