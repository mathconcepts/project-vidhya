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
      className={[
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full',
        'border border-amber-500/40 bg-amber-500/15 text-amber-300',
        'text-xs font-semibold tracking-wide whitespace-nowrap',
        className,
      ].join(' ')}
    >
      <FlaskConical size={12} strokeWidth={2.5} aria-hidden="true" />
      Sample data
    </span>
  );
}
