/**
 * DemoDeckPage — the `/demo` entry: pick a journey, walk it.
 *
 * The CEO plan calls this a "journey card deck" and shows 5-6 cards. It is
 * built here as hairline-separated rows instead, deliberately:
 * DESIGN-SYSTEM.md's layout rule is "One focal block per screen. Everything
 * else is plain text or hairline-separated rows directly on the canvas", and
 * the design review's first hard-rejection criterion is "generic SaaS card
 * grid as first impression". This screen IS the first impression, and one of
 * its two audiences is a principal who came specifically to judge whether the
 * product is serious. A tile mosaic is the wrong first sentence.
 *
 * Every state here is honest about what it knows:
 *   - loading  : says it is loading, claims nothing
 *   - 404      : demo mode is off on this instance — the true reason, not a
 *                generic error, so an operator at the venue can fix it
 *   - failure  : names that the deck could not be read
 * There is no empty state, because the server refuses to serve an empty deck
 * and CI refuses to ship one — an empty `/demo` in front of a visitor is the
 * failure the whole validator exists to prevent.
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { setDemoPersona, clearDemoPersona, setDemoCaptions, setDemoRail } from '@/lib/demoPersona';

interface AtomRail {
  kind: 'atoms';
  concept_id: string;
  atoms: string[];
  first_exposure?: boolean;
  /** Authored, server-gradable item the rail ends on. */
  practice_item_id?: string;
  /** Close the rail by inviting the visitor's own problem. */
  invite_doubt?: boolean;
}
interface CompareRail {
  kind: 'compare';
  concept_id: string;
  against_persona: string;
}
interface SurfacesRail {
  kind: 'surfaces';
  steps: Array<{ at: string; route: string; label: string }>;
}

export interface DemoCard {
  id: string;
  title: string;
  subtitle?: string;
  audience: 'student' | 'teacher' | 'principal';
  persona: string;
  rail: AtomRail | CompareRail | SurfacesRail;
  captions?: Array<{ at: string; text: string }>;
  persona_signal?: {
    id: string;
    display_name: string;
    mastery_by_concept: Record<string, number>;
    recent_errors: string[];
    /** Selects which authored body of each atom the composer serves. */
    motivation_state?: string;
    representation_mode?: 'geometric' | 'algebraic' | 'balanced';
  };
}

type LoadState =
  | { status: 'loading' }
  | { status: 'off' }
  | { status: 'error'; message: string }
  | { status: 'ready'; cards: DemoCard[] };

/** Where a card sends the visitor. Kept next to the type it switches on. */
export function railDestination(card: DemoCard): string {
  if (card.rail.kind === 'compare') return '/admin/scenarios';
  if (card.rail.kind === 'surfaces') return card.rail.steps[0]?.route ?? '/';
  return `/lesson/${card.rail.concept_id}`;
}

/**
 * The rail's navigable steps.
 *
 * An atoms rail with a practice item becomes two steps — the lesson, then the
 * graded question — so it reuses DemoRailNav rather than growing a second
 * mechanism. Captions inside the lesson stay anchored to atoms; only the
 * between-screens hop is a rail step.
 */
export function railSteps(card: DemoCard): Array<{ at: string; route: string; label: string }> {
  if (card.rail.kind === 'surfaces') return card.rail.steps;
  // A compare rail is one screen, but it still needs to BE a step: the deck's
  // validator accepts a caption anchored at "compare", and a rail with no
  // steps means railPosition() finds nothing, DemoRailNav renders null, and
  // that caption is silently never shown. One step is what makes the anchor
  // real rather than nominal.
  if (card.rail.kind === 'compare') {
    return [{ at: 'compare', route: '/admin/scenarios', label: 'Two students, one lesson' }];
  }
  if (card.rail.kind === 'atoms' && card.rail.practice_item_id) {
    const steps = [
      { at: 'lesson', route: `/lesson/${card.rail.concept_id}`, label: 'The concept' },
      { at: 'practice', route: `/attempt/${card.rail.practice_item_id}`, label: 'Try one yourself' },
    ];
    if (card.rail.invite_doubt) {
      steps.push({ at: 'doubt', route: '/demo/doubt', label: 'Bring your own problem' });
    }
    return steps;
  }
  return [];
}

/**
 * Entering a journey signs the visitor in AS the persona the rail narrates.
 *
 * A gradable item needs an authenticated session, and every persona now has its
 * own seeded demo account — so the account and the story are the same person.
 * This is a full navigation because /demo-login is a server route that writes
 * the token before handing back to the SPA; sessionStorage survives it, so the
 * persona signal set just above is still there on arrival.
 */
export function entryHref(card: DemoCard): string {
  const dest = railDestination(card);
  return `/demo-login?role=${encodeURIComponent(card.persona)}&next=${encodeURIComponent(dest)}`;
}

export default function DemoDeckPage() {
  const navigate = useNavigate();
  const [state, setState] = useState<LoadState>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    fetch('/api/demo/rails')
      .then(async (r) => {
        if (cancelled) return;
        if (r.status === 404) {
          setState({ status: 'off' });
          return;
        }
        if (!r.ok) {
          const body = await r.json().catch(() => ({}));
          setState({ status: 'error', message: body?.error ?? `HTTP ${r.status}` });
          return;
        }
        const body = await r.json();
        setState({ status: 'ready', cards: body.cards ?? [] });
      })
      .catch((e) => {
        if (!cancelled) setState({ status: 'error', message: String(e?.message ?? e) });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '32px 20px 64px' }}>
      <h1
        style={{
          margin: '0 0 6px',
          fontSize: 28,
          fontWeight: 'var(--weight-bold)',
          letterSpacing: '-0.022em',
          color: 'var(--text-primary)',
        }}
      >
        Pick a starting point
      </h1>
      <p style={{ margin: '0 0 28px', fontSize: 17, lineHeight: 1.45, color: 'var(--text-secondary)' }}>
        Each one opens the real product as a different student. Nothing here is a slideshow.
      </p>

      {state.status === 'loading' && (
        <p style={{ fontSize: 15, color: 'var(--text-tertiary)' }}>Loading…</p>
      )}

      {state.status === 'off' && (
        <p style={{ fontSize: 17, lineHeight: 1.5, color: 'var(--text-secondary)' }}>
          Demo mode is off on this instance. Set <code>DEMO_MODE_ENABLED=true</code> on the
          venue install and reload.
        </p>
      )}

      {state.status === 'error' && (
        <p style={{ fontSize: 17, lineHeight: 1.5, color: 'var(--orange-ink)' }}>
          Could not load the journeys: {state.message}
        </p>
      )}

      {state.status === 'ready' && (
        <div role="list">
          {state.cards.map((card, i) => (
            <button
              key={card.id}
              role="listitem"
              onClick={() => {
                // Carry the persona into the rail, or clear a stale one from a
                // previous journey so this card cannot inherit it.
                if (card.persona_signal) setDemoPersona(card.persona_signal);
                else clearDemoPersona();
                setDemoCaptions(card.captions);
                const steps = railSteps(card);
                setDemoRail(steps.length ? steps : undefined);
                // Sign in as the persona; the server route lands on the rail.
                window.location.assign(entryHref(card));
              }}
              style={{
                display: 'block',
                width: '100%',
                minHeight: 44,
                textAlign: 'left',
                padding: '18px 0',
                background: 'transparent',
                border: 'none',
                borderTop: i === 0 ? 'none' : '1px solid var(--separator)',
                cursor: 'pointer',
                font: 'inherit',
              }}
            >
              <span
                style={{
                  display: 'block',
                  fontSize: 17,
                  fontWeight: 'var(--weight-semibold)',
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.01em',
                }}
              >
                {card.title}
              </span>
              {card.subtitle && (
                <span
                  style={{
                    display: 'block',
                    marginTop: 3,
                    fontSize: 15,
                    lineHeight: 1.4,
                    color: 'var(--text-secondary)',
                  }}
                >
                  {card.subtitle}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
