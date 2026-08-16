/**
 * WalkthroughBar — the persistent "stop N of M · what to look at · Next" strip
 * that carries an operator through the admin demo walkthrough.
 *
 * Mounted globally alongside DemoRailNav and renders nothing unless a
 * walkthrough is running, so it costs an ordinary session nothing.
 *
 * It shows `look_for` rather than the stop's title, because the title is
 * already on screen once you arrive — what the operator needs mid-demo is the
 * one sentence telling them where to point.
 */
import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronRight, ChevronLeft, X } from 'lucide-react';
import { getWalkthrough, advance, endWalkthrough, type WalkthroughCursor } from '@/lib/walkthrough';

export function WalkthroughBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [cursor, setCursor] = useState<WalkthroughCursor | null>(null);

  // Re-read on every navigation: the cursor is written just before navigating,
  // so the bar must pick up the new position when the route settles.
  useEffect(() => {
    setCursor(getWalkthrough());
  }, [location.pathname]);

  if (!cursor) return null;
  const stop = cursor.stops[cursor.index];
  if (!stop) return null;

  const hasNext = cursor.index + 1 < cursor.stops.length;
  const hasPrev = cursor.index > 0;

  const go = (delta: number) => {
    const r = advance(delta);
    if (!r) return;
    setCursor(getWalkthrough());
    navigate(r.route);
  };

  return (
    <div
      role="region"
      aria-label="Demo walkthrough"
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 60,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 16px',
        paddingBottom: 'calc(10px + env(safe-area-inset-bottom, 0px))',
        background: 'var(--surface-card)',
        borderTop: '1px solid var(--indigo)',
        boxShadow: 'var(--shadow-sheet)',
      }}
    >
      <span
        style={{
          flexShrink: 0,
          fontSize: 'var(--text-footnote)',
          fontFamily: 'var(--font-mono)',
          color: 'var(--indigo-ink)',
        }}
      >
        {cursor.index + 1}/{cursor.stops.length}
      </span>

      <span
        style={{
          flex: 1,
          minWidth: 0,
          fontSize: 'var(--text-subhead)',
          color: 'var(--text-primary)',
          lineHeight: 'var(--leading-snug)',
        }}
      >
        {stop.look_for}
        {stop.persona && (
          <span style={{ color: 'var(--text-secondary)' }}> — as {stop.persona.display_name.split(' — ')[0]}</span>
        )}
      </span>

      {hasPrev && (
        <button
          onClick={() => go(-1)}
          aria-label="Previous stop"
          style={{
            minHeight: 'var(--touch-min)',
            minWidth: 'var(--touch-min)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
          }}
        >
          <ChevronLeft size={18} />
        </button>
      )}

      {hasNext ? (
        <button
          onClick={() => go(1)}
          style={{
            flexShrink: 0,
            minHeight: 'var(--touch-min)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '0 14px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--indigo)',
            color: 'var(--text-on-accent)',
            fontSize: 'var(--text-subhead)',
            fontWeight: 'var(--weight-semibold)',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Next <ChevronRight size={16} />
        </button>
      ) : (
        <span style={{ flexShrink: 0, fontSize: 'var(--text-footnote)', color: 'var(--text-secondary)' }}>
          Last stop
        </span>
      )}

      <button
        onClick={() => {
          endWalkthrough();
          setCursor(null);
        }}
        aria-label="End walkthrough"
        style={{
          minHeight: 'var(--touch-min)',
          minWidth: 'var(--touch-min)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'none',
          border: 'none',
          color: 'var(--text-tertiary)',
          cursor: 'pointer',
        }}
      >
        <X size={16} />
      </button>
    </div>
  );
}

export default WalkthroughBar;
