import React from 'react';

/**
 * Trust-aesthetic law carried over from the product: a surface only wears the
 * receipt treatment when a real receipt object is passed. No receipt, no border.
 */
export function ReceiptBadge({ receipt, source, children }) {
  const verified = !!(receipt && receipt.verified);
  if (!verified) return <>{children}</>;
  return (
    <div style={{
      position: 'relative', borderRadius: 'var(--radius-sm)', padding: 14,
      background: 'var(--surface-card)', boxShadow: 'inset 0 0 0 1px var(--receipt-line)',
    }}>
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 5, marginBottom: 8,
        fontFamily: 'var(--font-sans)', fontSize: 'var(--text-caption)',
        fontWeight: 'var(--weight-semibold)', color: 'var(--green-ink)',
      }}>
        <span aria-hidden="true" style={{
          width: 15, height: 15, borderRadius: 'var(--radius-capsule)', background: 'var(--receipt-mark)',
          color: '#fff', fontSize: 10, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        }}>✓</span>
        Verified{source ? ` · ${source}` : ''}
      </span>
      {children}
    </div>
  );
}
