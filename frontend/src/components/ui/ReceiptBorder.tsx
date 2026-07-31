/**
 * ReceiptBorder — the "receipt aesthetic" trust marker (DESIGN-SYSTEM.md
 * "Receipt Border (verification marker)").
 *
 * Core mechanic: verified facts sit on a subtly different surface (hairline
 * emerald border + ✓) so the eye learns "bordered = backed." Estimates and
 * unverified content never wear this border.
 *
 * Enforcement: the border classes only render when a non-null `receipt` prop
 * is passed. No receipt object, no border — by construction. Callers should
 * never apply these classes manually outside this component; a lint rule
 * that catches that at the component-authoring level is a deferred item.
 */

import type { ReactNode } from 'react';
import { clsx } from 'clsx';

/**
 * Minimal shape a caller needs to prove a piece of content is backed by a
 * real verification record. Individual features can pass richer receipt
 * objects (e.g. from `verification_log`) — only `verified` is read here.
 */
export interface Receipt {
  /** True when the content this wraps has an actual backing verification record. */
  verified: boolean;
  /** Optional free-text source for debugging/audit — not rendered. */
  source?: string;
}

interface ReceiptBorderProps {
  /** Pass a Receipt to render the bordered surface; pass null/undefined for none. */
  receipt: Receipt | null | undefined;
  children: ReactNode;
  className?: string;
}

export function ReceiptBorder({ receipt, children, className }: ReceiptBorderProps) {
  const hasReceipt = !!receipt?.verified;

  return (
    <div
      className={clsx('relative rounded-[10px]', hasReceipt && 'bg-surface-900 border', className)}
      style={hasReceipt ? { borderColor: 'hsl(var(--receipt-border) / 0.4)' } : undefined}
    >
      {hasReceipt && (
        <span
          aria-hidden="true"
          className="absolute -top-2 -right-2 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold text-surface-950"
          style={{ backgroundColor: 'hsl(var(--receipt-border-strong))' }}
        >
          ✓
        </span>
      )}
      {children}
    </div>
  );
}
