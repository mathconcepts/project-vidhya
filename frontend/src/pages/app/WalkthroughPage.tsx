/**
 * WalkthroughPage — `/admin/walkthrough`, the operator's one button before a demo.
 *
 * The itinerary is built server-side from the artefacts it depends on (the
 * rails config, the atoms on disk, the widget blocks inside them, the persona
 * files), so this page never advertises a stop the corpus cannot deliver. A
 * stop whose dependency is missing is shown greyed with the reason rather than
 * hidden — an operator needs to know what is missing BEFORE they start
 * walking, not when a screen comes up empty in front of someone.
 *
 * "Start" enters the first walkable stop. From there the persistent
 * WalkthroughBar carries the tour; every stop is also individually clickable,
 * because a demo rarely survives contact with the room and jumping straight to
 * the graded question is a normal thing to need.
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { isAdminRole } from '@/lib/auth/roles';
import { authFetch } from '@/lib/auth/client';
import { applyStop, walkableStops, type WalkthroughItinerary } from '@/lib/walkthrough';

export default function WalkthroughPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<WalkthroughItinerary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading || !user || !isAdminRole(user.role)) return;
    let cancelled = false;
    (async () => {
      try {
        const r = await authFetch('/api/admin/walkthrough');
        if (!r.ok) {
          if (!cancelled) setError(`HTTP ${r.status}`);
          return;
        }
        const body = (await r.json()) as WalkthroughItinerary;
        if (!cancelled) setData(body);
      } catch (e) {
        if (!cancelled) setError(String((e as Error)?.message ?? e));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authLoading, user]);

  if (authLoading) return <p style={{ fontSize: 'var(--text-subhead)' }}>Loading…</p>;
  if (!user || !isAdminRole(user.role)) {
    return (
      <p style={{ fontSize: 'var(--text-body)', color: 'var(--text-secondary)' }}>
        Admin access required.
      </p>
    );
  }

  const start = (index: number) => {
    if (!data) return;
    const route = applyStop(data.stops, index);
    if (route) navigate(route);
  };

  const firstWalkable = data ? data.stops.findIndex((s) => s.available) : -1;

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h1
          style={{
            margin: '0 0 4px',
            fontSize: 'var(--text-title2)',
            fontWeight: 'var(--weight-semibold)',
            letterSpacing: 'var(--tracking-title)',
            color: 'var(--text-primary)',
          }}
        >
          Demo walkthrough
        </h1>
        <p style={{ margin: 0, fontSize: 'var(--text-subhead)', color: 'var(--text-secondary)' }}>
          Every capability the product can currently show, in one pass. Built from what is
          actually on this instance, so nothing here is a stop that cannot be walked.
        </p>
      </div>

      {error && (
        <p style={{ fontSize: 'var(--text-subhead)', color: 'var(--orange-ink)' }}>
          Could not build the itinerary: {error}
        </p>
      )}

      {data && (
        <>
          <button
            onClick={() => firstWalkable >= 0 && start(firstWalkable)}
            disabled={firstWalkable < 0}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              width: '100%',
              minHeight: 'var(--touch-min)',
              padding: '14px 20px',
              borderRadius: 'var(--radius-sm)',
              background: firstWalkable < 0 ? 'var(--surface-fill)' : 'var(--indigo)',
              color: firstWalkable < 0 ? 'var(--text-tertiary)' : 'var(--text-on-accent)',
              fontSize: 'var(--text-body)',
              fontWeight: 'var(--weight-semibold)',
              border: 'none',
              cursor: firstWalkable < 0 ? 'not-allowed' : 'pointer',
            }}
          >
            <Play size={18} />
            Start the walkthrough ({data.coverage.available_stops} stops)
          </button>

          {/* Coverage, stated plainly. If a widget kind exists in the corpus but
              no stop reaches it, that is the operator's problem to know about. */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 16,
              fontSize: 'var(--text-footnote)',
              color: 'var(--text-secondary)',
            }}
          >
            <span>
              Interactive kinds covered:{' '}
              <strong style={{ fontFamily: 'var(--font-mono)' }}>
                {data.coverage.widget_kinds_covered.length}/{data.coverage.widget_kinds_in_corpus.length}
              </strong>{' '}
              ({data.coverage.widget_kinds_in_corpus.join(', ') || 'none in corpus'})
            </span>
            <span>
              Learner stances:{' '}
              <strong style={{ fontFamily: 'var(--font-mono)' }}>
                {data.coverage.stances_covered.length ? data.coverage.stances_covered.join(' + ') : 'none authored'}
              </strong>
            </span>
          </div>

          <ol style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {data.stops.map((stop, i) => (
              <li
                key={stop.id}
                style={{
                  borderTop: 'var(--hairline) solid var(--separator)',
                  padding: '14px 0',
                  opacity: stop.available ? 1 : 0.55,
                }}
              >
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <span
                    style={{
                      flexShrink: 0,
                      marginTop: 2,
                      width: 22,
                      fontSize: 'var(--text-footnote)',
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--text-tertiary)',
                    }}
                  >
                    {i + 1}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 'var(--text-subhead)',
                        fontWeight: 'var(--weight-semibold)',
                        color: 'var(--text-primary)',
                      }}
                    >
                      {stop.title}
                    </div>
                    <div
                      style={{
                        fontSize: 'var(--text-footnote)',
                        color: 'var(--text-secondary)',
                        marginTop: 3,
                        lineHeight: 'var(--leading-normal)',
                      }}
                    >
                      {stop.look_for}
                    </div>
                    <div
                      style={{
                        fontSize: 'var(--text-footnote)',
                        color: 'var(--text-tertiary)',
                        marginTop: 3,
                      }}
                    >
                      {stop.proves}
                    </div>
                    {!stop.available && (
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5,
                          marginTop: 6,
                          fontSize: 'var(--text-footnote)',
                          color: 'var(--orange-ink)',
                        }}
                      >
                        <AlertTriangle size={13} />
                        Not walkable — {stop.unavailable_reason}
                      </div>
                    )}
                  </div>
                  {stop.available && (
                    <button
                      onClick={() => start(i)}
                      style={{
                        flexShrink: 0,
                        minHeight: 'var(--touch-min)',
                        padding: '0 12px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--surface-fill)',
                        border: 'var(--hairline) solid var(--separator)',
                        color: 'var(--text-primary)',
                        fontSize: 'var(--text-footnote)',
                        cursor: 'pointer',
                      }}
                    >
                      Go
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ol>

          {walkableStops(data).length === data.stops.length && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 'var(--text-footnote)',
                color: 'var(--green-ink)',
              }}
            >
              <CheckCircle2 size={14} />
              Every stop on this instance is walkable.
            </div>
          )}
        </>
      )}
    </div>
  );
}
