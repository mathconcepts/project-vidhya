/**
 * JourneyNudge — small banner shown at the top of admin pages that
 * surfaces the current `next` milestone (if any) so admins always know
 * what the next high-leverage move is, without leaving the page they're
 * on.
 *
 * Pages opt in by importing + rendering at the top of their content.
 * The component fetches journey state itself; pages don't need to thread it.
 *
 * Surveillance: this component renders only progress + counts; never
 * per-student data.
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, X } from 'lucide-react';
import { getJourneyProgress, type Milestone } from '@/api/admin/journey';

interface Props {
  /** Hide the nudge if the current page IS where the next milestone points. */
  currentHref?: string;
}

export function JourneyNudge({ currentHref }: Props) {
  const [next, setNext] = useState<Milestone | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem('vidhya.admin.nudge.dismissed') === '1') {
      setDismissed(true);
      return;
    }
    getJourneyProgress()
      .then((p) => {
        const nxt = p.milestones.find((m) => m.status === 'next') ?? null;
        setNext(nxt);
      })
      .catch(() => { /* silent — nudge is opportunistic */ });
  }, []);

  if (dismissed || !next) return null;
  // Don't nudge to the page the admin is already on.
  if (currentHref && next.cta_href === currentHref) return null;

  const handleDismiss = () => {
    sessionStorage.setItem('vidhya.admin.nudge.dismissed', '1');
    setDismissed(true);
  };

  return (
    <div className="mb-4 rounded-lg border border-violet-500/30 bg-violet-500/5 px-3 py-2 flex items-center gap-3 text-xs">
      <span className="text-violet-300 font-medium uppercase tracking-wider">Next move</span>
      <span className="text-surface-300 flex-1 truncate">{next.label}</span>
      <Link
        to={next.cta_href}
        className="inline-flex items-center gap-1 text-violet-300 hover:text-violet-200 whitespace-nowrap"
      >
        {next.cta_label} <ArrowRight size={11} />
      </Link>
      <button
        onClick={handleDismiss}
        className="text-surface-500 hover:text-surface-300"
        aria-label="Dismiss nudge"
      >
        <X size={12} />
      </button>
    </div>
  );
}
