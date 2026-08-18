/**
 * WarmupEntryCard — T8 (A8). Self-fetching entry point into the warmup
 * onboarding flow, surfaced from PlannedSessionPage and KnowledgeHomePage
 * for students with no attempt history. Mirrors the self-fetching pattern
 * used by JourneyNudge (admin surfaces) — checks its own gating condition
 * on mount rather than depending on the parent's data-fetch orchestration,
 * which keeps both host pages' edits additive/surgical (a single
 * `<WarmupEntryCard />` line, no new fetch wired through the page itself).
 *
 * Gate: GET /api/readiness/next-action's `reason === 'building your
 * baseline'` is the same "fresh student, nothing concrete yet" signal the
 * readiness engine already uses elsewhere — a real attempt or a completed
 * warmup both clear it. Belt-and-suspenders: also hides for the rest of
 * the browser session once the warmup flow itself sets
 * `WARMUP_COMPLETED_KEY`, so the card can't flash back on a stale read
 * immediately after finishing.
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authFetch } from '@/lib/auth/client';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { WARMUP_COMPLETED_KEY } from '@/lib/warmup-logic';

export function WarmupEntryCard() {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let cancelled = false;
    try {
      if (localStorage.getItem(WARMUP_COMPLETED_KEY) === '1') return;
    } catch { /* private mode — fall through to the server check */ }

    authFetch('/api/readiness/next-action')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        if (data.reason === 'building your baseline') setVisible(true);
      })
      .catch(() => { /* silent — the card just doesn't offer itself */ });

    return () => { cancelled = true; };
  }, []);

  if (!visible) return null;

  return (
    <Card elevated padding={20} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <p style={{ margin: 0, fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-semibold)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-caps)', color: 'var(--green-ink)' }}>
        New here
      </p>
      <p style={{ margin: 0, fontSize: 'var(--text-body)', fontWeight: 'var(--weight-semibold)', color: 'var(--text-primary)', letterSpacing: 'var(--tracking-body)' }}>
        Find your starting line
      </p>
      <p style={{ margin: '0 0 8px', fontSize: 'var(--text-subhead)', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
        A 2-minute warm-up places you on linear algebra — no grade, just a starting point.
      </p>
      <Button tone="mastery" size="md" onClick={() => navigate('/warmup')}>
        Start the warm-up
      </Button>
    </Card>
  );
}
