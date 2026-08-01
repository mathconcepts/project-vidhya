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
  if (currentHref && next.cta_href === currentHref) return null;

  const handleDismiss = () => {
    sessionStorage.setItem('vidhya.admin.nudge.dismissed', '1');
    setDismissed(true);
  };

  return (
    <div style={{
      marginBottom: 16,
      borderRadius: 'var(--radius-md)',
      border: '1px solid rgba(88,86,214,.22)',
      background: 'rgba(88,86,214,.06)',
      padding: '8px 12px',
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      fontSize: 'var(--text-caption)',
    }}>
      <span style={{ color: 'var(--indigo-ink)', fontWeight: 'var(--weight-semibold)', textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: 10, flexShrink: 0 }}>
        Next move
      </span>
      <span style={{ color: 'var(--text-secondary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {next.label}
      </span>
      <Link
        to={next.cta_href}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--indigo-ink)', textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0 }}
      >
        {next.cta_label} <ArrowRight size={11} />
      </Link>
      <button
        onClick={handleDismiss}
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--text-tertiary)', display: 'flex' }}
        aria-label="Dismiss nudge"
      >
        <X size={12} />
      </button>
    </div>
  );
}
