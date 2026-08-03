/**
 * ReceiptBorder — the "receipt aesthetic" trust marker (DESIGN-SYSTEM.md
 * "Receipt Border (verification marker)").
 *
 * Core mechanic: verified facts sit on a white surface with a 1px green inset
 * border and a ✓ disc so the eye learns "bordered = backed." Unverified content
 * never wears this border — enforced by construction. No receipt object, no border.
 */
import type { ReactNode } from 'react';

/**
 * Minimal shape a caller needs to prove a piece of content is backed by a
 * real verification record. Only `verified` is read here.
 */
export interface Receipt {
  verified: boolean;
  source?: string;
}

interface ReceiptBorderProps {
  receipt: Receipt | null | undefined;
  children: ReactNode;
  className?: string;
}

export function ReceiptBorder({ receipt, children, className }: ReceiptBorderProps) {
  const verified = !!(receipt?.verified);
  if (!verified) return <>{children}</>;

  return (
    <div
      className={className}
      style={{
        position: 'relative',
        borderRadius: 'var(--radius-sm)',
        padding: 14,
        background: 'var(--surface-card)',
        boxShadow: 'inset 0 0 0 1px var(--receipt-line)',
      }}
    >
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 5,
          marginBottom: 8,
          fontFamily: 'var(--font-sans)',
          fontSize: 'var(--text-caption)',
          fontWeight: 'var(--weight-semibold)',
          color: 'var(--green-ink)',
        }}
      >
        <span
          aria-hidden="true"
          style={{
            width: 15,
            height: 15,
            borderRadius: 'var(--radius-capsule)',
            background: 'var(--receipt-mark)',
            color: 'var(--text-on-accent)',
            fontSize: 10,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          ✓
        </span>
        Verified{receipt?.source ? ` · ${receipt.source}` : ''}
      </span>
      {children}
    </div>
  );
}
