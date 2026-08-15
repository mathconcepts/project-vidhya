/**
 * DemoRailNav — narration and a way forward, on a `surfaces` rail.
 *
 * The principal's journey is a drill-down across product screens rather than a
 * walk through one lesson: batch view, then taught-vs-mastered, then an
 * individual attempt. Those screens are real product surfaces with their own
 * navigation, so the rail needs something that persists across them, says where
 * the visitor is, and offers the next step without hijacking the page.
 *
 * Mounted once in AppLayout, next to DemoRoleSwitcher, so no product page has
 * to know a demo exists. It renders nothing unless BOTH a demo persona is
 * active and the current path is a step of the stored rail — so a visitor who
 * wanders off the rail is simply not narrated, rather than being pushed back
 * onto it. The plan's line is that captions are garnish, never load-bearing;
 * that applies to the rail nav too. Nothing here traps the visitor.
 *
 * Position is derived from the URL rather than an index in state, so the
 * browser back button and a mid-rail reload both stay correct.
 */

import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import {
  getDemoPersona,
  getDemoCaptions,
  getDemoOutcome,
  onDemoOutcomeChange,
  railPosition,
} from '@/lib/demoPersona';
import { captionFor } from '@/components/app/DemoCaption';

export function DemoRailNav() {
  const location = useLocation();
  const navigate = useNavigate();
  // Re-read the graded outcome when it lands. Hooks run before the early
  // returns below so their order stays stable across renders.
  const [outcome, setOutcome] = useState(() => getDemoOutcome());
  useEffect(() => onDemoOutcomeChange(() => setOutcome(getDemoOutcome())), []);
  useEffect(() => setOutcome(getDemoOutcome()), [location.pathname]);

  if (!getDemoPersona()) return null;

  const { current, next, index, total } = railPosition(location.pathname);
  if (!current) return null;

  const missedHere = outcome && !outcome.correct && current.route.endsWith(outcome.objectId);
  const caption = captionFor(
    current.at,
    getDemoCaptions(),
    outcome ? (outcome.correct ? 'correct' : 'incorrect') : null,
  );

  return (
    <aside
      aria-label="Demo rail"
      style={{
        position: 'fixed',
        left: 12,
        right: 12,
        bottom: 12,
        zIndex: 45,
        maxWidth: 640,
        margin: '0 auto',
        padding: '14px 16px',
        borderRadius: 'var(--radius-md)',
        background: 'var(--material-thick)',
        backdropFilter: 'var(--blur-nav)',
        WebkitBackdropFilter: 'var(--blur-nav)',
        boxShadow: 'inset 0 0 0 1px var(--separator), var(--shadow-card)',
      }}
    >
      <p
        style={{
          margin: '0 0 4px',
          fontSize: 11,
          fontWeight: 'var(--weight-semibold)',
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          color: 'var(--text-tertiary)',
          fontFamily: 'var(--font-mono)',
        }}
      >
        Step {index + 1} of {total} · {current.label}
      </p>

      {caption && (
        <p style={{ margin: '0 0 10px', fontSize: 15, lineHeight: 1.45, color: 'var(--text-secondary)' }}>
          {caption}
        </p>
      )}

      {missedHere ? (
        // The rail re-targets its ending peak onto the thing just missed
        // (D3.3). A nervous visitor who misses and then conquers is a stronger
        // proof than a clean win, so the journey does not end on the miss — it
        // offers the same item again, with the worked steps now on screen.
        <button
          onClick={() => navigate(0)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            minHeight: 44,
            padding: '0 4px',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            fontSize: 17,
            fontWeight: 'var(--weight-semibold)',
            color: 'var(--green-ink)',
            font: 'inherit',
          }}
        >
          Try this one again
          <ArrowRight size={16} strokeWidth={2} aria-hidden="true" />
        </button>
      ) : next ? (
        <button
          onClick={() => navigate(next.route)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            minHeight: 44,
            padding: '0 4px',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            fontSize: 17,
            fontWeight: 'var(--weight-semibold)',
            color: 'var(--green-ink)',
            font: 'inherit',
          }}
        >
          Next: {next.label}
          <ArrowRight size={16} strokeWidth={2} aria-hidden="true" />
        </button>
      ) : (
        // End of the rail. Say so plainly rather than leaving a dead control —
        // the visitor should know they reached the bottom of the drill-down.
        <p style={{ margin: 0, fontSize: 15, color: 'var(--text-tertiary)' }}>
          End of this journey. Pick another from the demo home.
        </p>
      )}
    </aside>
  );
}
