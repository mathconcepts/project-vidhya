/**
 * ReceiptBorder — the "receipt aesthetic" trust marker (DESIGN-SYSTEM.md
 * "Receipt Border (verification marker)").
 *
 * Core mechanic: verified facts sit on a white surface with a 1px green inset
 * border and a ✓ disc so the eye learns "bordered = backed." Unverified content
 * never wears this border — enforced by construction. No receipt object, no border.
 */
import type { ReactNode } from 'react';
import type { Receipt } from '@/lib/receipt';

// The Receipt type and its constructors live in `@/lib/receipt` — that module
// is the only place a receipt may be minted, and `source` is required there so
// a bare `{ verified: true }` can no longer type-check at a call site. Re-
// exported here for the many components that import it alongside the border.
export type { Receipt };

interface ReceiptBorderProps {
  receipt: Receipt | null | undefined;
  children: ReactNode;
  className?: string;
  /**
   * 'positive' (default): the established green tick — for a receipt that
   * sits on its own or beside a correct/neutral result. 'neutral': for a
   * receipt nested inside a wrong-answer card. `receiptFromServerGrade`
   * deliberately attests the GRADE, not correctness — "this mark is real",
   * not "you did well" — but a green checkmark reads as a correctness
   * signal to a reader regardless of what the code comment says, and
   * inside a red "wrong answer" card that collision is exactly the
   * confusion /investigate found (2026-09-02). 'neutral' keeps the
   * "Verified · {source}" claim (still real, still shown) but stops
   * dressing it in the color that means "correct" everywhere else in the
   * app.
   */
  tone?: 'positive' | 'neutral';
}

export function ReceiptBorder({ receipt, children, className, tone = 'positive' }: ReceiptBorderProps) {
  const verified = !!(receipt?.verified);
  if (!verified) return <>{children}</>;
  const inkColor = tone === 'neutral' ? 'var(--text-secondary)' : 'var(--green-ink)';
  const markBackground = tone === 'neutral' ? 'var(--text-tertiary)' : 'var(--receipt-mark)';

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
          color: inkColor,
        }}
      >
        <span
          aria-hidden="true"
          style={{
            width: 15,
            height: 15,
            borderRadius: 'var(--radius-capsule)',
            background: markBackground,
            color: 'var(--text-on-accent)',
            fontSize: 10,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          ✓
        </span>
        Verified · {receipt.source}
      </span>
      {children}
    </div>
  );
}
