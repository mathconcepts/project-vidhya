/**
 * WalkthroughRail — the four-leg per-concept walkthrough
 * (Explanation → Interactive → Practice → Test), rendered under the atom
 * stack on LessonPage.
 *
 * Reads GET /api/lesson/walkthrough/:concept_id for per-leg availability +
 * counts (counts only — no per-student data) and renders a compact
 * hairline-separated rail directly on the canvas — never a card grid
 * (Clarity: "everything else is plain text or hairline-separated rows
 * directly on the canvas"). Status is a coloured dot (green = available,
 * grey = not), matching the same idiom FrontierSpine already uses for its
 * concept rows — not a new icon-meaning convention.
 *
 * Every leg is honest about whether it's reachable. An unavailable leg is
 * never a dead link: it renders as a non-interactive row (no chevron, no
 * onClick) with copy naming exactly what's missing, rather than a button
 * that goes nowhere or 4xx's on tap.
 *
 * The Test leg keeps the checkpoint quiz's existing XP-cycle gate
 * unweakened (src/api/quiz-routes.ts) — that per-student gate isn't
 * something this counts-only endpoint can see, so rather than promise an
 * unconditional start, the row's own copy says up front that it unlocks
 * once practice XP is banked.
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { ListRow } from '@/components/ui/ListRow';

interface WalkthroughLegs {
  explanation: { available: boolean; atom_count: number };
  interactive: { available: boolean; count: number };
  practice: { available: boolean; item_count: number; first_object_id: string | null };
  /**
   * `exam_tested === false` means this concept is a prerequisite exams
   * assume rather than directly test — the server sends this on every
   * response, but it's read defensively (`=== false`, not `!`) so an
   * older cached response missing the field still reads as "tested"
   * rather than misfiring the honest-exemption copy below.
   */
  test: { available: boolean; question_count: number; exam_tested?: boolean };
}

interface WalkthroughResponse {
  concept_id: string;
  label: string;
  legs: WalkthroughLegs;
}

export interface WalkthroughRailProps {
  conceptId: string;
  /** Scrolls to / highlights the atom stack already rendered above the rail. */
  onExplanationTap: () => void;
  /** Jumps the atom carousel to the first interactive atom. Only called when tappable. */
  onInteractiveTap: () => void;
  /**
   * Client-side truth: can LessonPage actually resolve a first-interactive-
   * atom id to jump to from the lesson it already loaded? The server's
   * `legs.interactive.available` says whether interactive atoms EXIST;
   * this says whether THIS render can jump to one. Both must hold for the
   * row to be tappable — never offer a jump the client can't complete.
   */
  interactiveJumpReady: boolean;
}

type Phase = 'loading' | 'ready' | 'error';

const DOT_AVAILABLE: React.CSSProperties = { background: 'var(--green)', border: '1.5px solid var(--green)' };
const DOT_UNAVAILABLE: React.CSSProperties = { background: 'var(--surface-fill)', border: '1.5px solid var(--separator)' };

export function WalkthroughRail({ conceptId, onExplanationTap, onInteractiveTap, interactiveJumpReady }: WalkthroughRailProps) {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>('loading');
  const [data, setData] = useState<WalkthroughResponse | null>(null);

  useEffect(() => {
    if (!conceptId) return;
    let cancelled = false;
    setPhase('loading');
    setData(null);
    (async () => {
      try {
        const r = await fetch(`/api/lesson/walkthrough/${encodeURIComponent(conceptId)}`);
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const body = (await r.json()) as WalkthroughResponse;
        if (!cancelled) { setData(body); setPhase('ready'); }
      } catch {
        if (!cancelled) setPhase('error');
      }
    })();
    return () => { cancelled = true; };
  }, [conceptId]);

  if (phase === 'loading') {
    return (
      <div
        role="status"
        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 2px', fontSize: 'var(--text-subhead)', color: 'var(--text-tertiary)' }}
      >
        <Loader2 size={13} className="animate-spin" /> Checking what's ready for this concept…
      </div>
    );
  }
  if (phase === 'error' || !data) {
    return (
      <p style={{ margin: '10px 2px', fontSize: 'var(--text-subhead)', color: 'var(--text-tertiary)' }}>
        Couldn't load the next steps for this concept right now.
      </p>
    );
  }

  const { legs } = data;
  const interactiveTappable = legs.interactive.available && interactiveJumpReady;
  const practiceTappable = legs.practice.available && Boolean(legs.practice.first_object_id);
  const testTappable = legs.test.available;

  const s = (n: number) => (n === 1 ? '' : 's');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, marginTop: 8 }}>
      <p
        style={{
          margin: '10px 2px 4px', fontSize: 'var(--text-footnote)', fontWeight: 'var(--weight-semibold)',
          textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)',
        }}
      >
        Continue with this concept
      </p>

      <RailRow
        title="Explanation"
        subtitle={legs.explanation.available
          ? `${legs.explanation.atom_count} card${s(legs.explanation.atom_count)} above`
          : 'No explanation authored yet'}
        available={legs.explanation.available}
        onClick={legs.explanation.available ? onExplanationTap : undefined}
      />
      <RailRow
        title="Interactive"
        subtitle={legs.interactive.available
          ? `${legs.interactive.count} interactive figure${s(legs.interactive.count)} in this lesson`
          : 'No interactive figures for this concept yet'}
        available={interactiveTappable}
        onClick={interactiveTappable ? onInteractiveTap : undefined}
      />
      <RailRow
        title="Practice"
        subtitle={legs.practice.available
          ? `${legs.practice.item_count} graded practice question${s(legs.practice.item_count)}`
          : 'No practice items for this concept yet'}
        available={practiceTappable}
        onClick={practiceTappable ? () => navigate(`/attempt/${legs.practice.first_object_id}`) : undefined}
      />
      <RailRow
        title="Checkpoint quiz"
        subtitle={legs.test.available
          ? `${legs.test.question_count} exam-style question${s(legs.test.question_count)} for this concept · starts once you've banked enough practice XP`
          : legs.test.exam_tested === false
            ? 'Assumed prerequisite — not directly examined in past papers.'
            : 'No exam-style questions tagged for this concept yet'}
        available={testTappable}
        onClick={testTappable ? () => navigate(`/checkpoint?concept=${encodeURIComponent(conceptId)}`) : undefined}
        last
      />
    </div>
  );
}

function RailRow({
  title, subtitle, available, onClick, last = false,
}: {
  title: string;
  subtitle: string;
  available: boolean;
  onClick?: () => void;
  last?: boolean;
}) {
  return (
    <ListRow
      title={title}
      subtitle={subtitle}
      padding="10px 2px"
      last={last}
      muted={!onClick}
      onClick={onClick}
      chevron={Boolean(onClick)}
      ariaLabel={`${title}: ${subtitle}`}
      leading={
        <span
          aria-hidden="true"
          style={{ width: 10, height: 10, borderRadius: 999, flex: '0 0 10px', ...(available ? DOT_AVAILABLE : DOT_UNAVAILABLE) }}
        />
      }
    />
  );
}
