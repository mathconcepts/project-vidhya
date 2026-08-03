/**
 * SampleDataChip — visible marker for seeded/synthetic demo content.
 *
 * Vidhya's #1 design law is "labels never lie" (DESIGN-SYSTEM.md's
 * Receipt Border section: an emerald border promises "this is proven
 * true", and — by that same law — only ever appears on real, backed
 * content). This chip is the honest opposite number: amber (the design
 * system's reserved "system warning" color, never decorative), shown
 * ONLY when what's on screen is seeded/synthetic Demo Theater content
 * (Teacher / Parent / Admin views under `?demo` — see
 * frontend/src/lib/demoMode.ts). Never render it over real data, and
 * never render real data without it once a view is in seeded-role mode.
 */

import { FlaskConical } from 'lucide-react';

export function SampleDataChip({ className = '' }: { className?: string }) {
  return (
    <span
      role="status"
      aria-label="Sample data — seeded demo content, not a real account"
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 10px',
        borderRadius: 9999,
        border: '1px solid rgba(255,159,10,.3)',
        background: 'rgba(255,159,10,.08)',
        color: 'var(--orange-ink)',
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: '0.04em',
        whiteSpace: 'nowrap',
      }}
    >
      <FlaskConical size={12} strokeWidth={2.5} aria-hidden="true" />
      Sample data
    </span>
  );
}
