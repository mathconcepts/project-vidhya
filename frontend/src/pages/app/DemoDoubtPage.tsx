/**
 * DemoDoubtPage — "bring your own doubt", collect-and-send-after.
 *
 * D3.5 describes a live moment: the visitor pastes a problem from their own
 * material and watches it get generated and verified. That path needs a
 * network, and the venue is deliberately offline — the whole SPA is verified to
 * make zero external requests. A "verifying…" spinner that can never resolve is
 * exactly the theatre this demo refuses.
 *
 * So this is the first rung of the plan's own degradation ladder, shipped as
 * the intended behaviour: the promise survives, the stage gamble goes. The
 * question is captured; the answer arrives later, from a person, verified.
 *
 * The copy does the honest work. It says up front that nothing will be solved
 * on screen, so the visitor is never waiting for something that is not coming.
 */

import { useState } from 'react';
import { getDemoPersona } from '@/lib/demoPersona';

type State =
  | { status: 'idle' }
  | { status: 'sending' }
  | { status: 'sent'; promise: string }
  | { status: 'error'; message: string };

const MAX_CHARS = 2000;

export default function DemoDoubtPage() {
  const [problem, setProblem] = useState('');
  const [state, setState] = useState<State>({ status: 'idle' });

  async function submit() {
    if (!problem.trim()) return;
    setState({ status: 'sending' });
    try {
      const r = await fetch('/api/demo/doubt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ problem, persona: getDemoPersona()?.id ?? null }),
      });
      const body = await r.json().catch(() => ({}));
      if (!r.ok) {
        setState({ status: 'error', message: body?.error ?? `HTTP ${r.status}` });
        return;
      }
      setState({ status: 'sent', promise: body.promise });
    } catch (e) {
      setState({ status: 'error', message: String((e as Error)?.message ?? e) });
    }
  }

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '32px 20px 96px' }}>
      <h1
        style={{
          margin: '0 0 6px',
          fontSize: 28,
          fontWeight: 'var(--weight-bold)',
          letterSpacing: '-0.022em',
          color: 'var(--text-primary)',
        }}
      >
        Bring a problem of your own
      </h1>
      <p style={{ margin: '0 0 24px', fontSize: 17, lineHeight: 1.5, color: 'var(--text-secondary)' }}>
        Type or paste anything you are stuck on. This demo is running offline, so
        it will not be solved on this screen — you will get a worked, verified
        solution afterwards.
      </p>

      {state.status === 'sent' ? (
        <p
          style={{
            margin: 0,
            padding: '16px 18px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--surface-sunken)',
            boxShadow: 'inset 0 0 0 1px var(--separator)',
            fontSize: 17,
            lineHeight: 1.5,
            color: 'var(--text-primary)',
          }}
        >
          {state.promise}
        </p>
      ) : (
        <>
          <label
            htmlFor="doubt"
            style={{
              display: 'block',
              marginBottom: 6,
              fontSize: 15,
              fontWeight: 'var(--weight-semibold)',
              color: 'var(--text-primary)',
            }}
          >
            Your question
          </label>
          <textarea
            id="doubt"
            value={problem}
            maxLength={MAX_CHARS}
            onChange={(e) => setProblem(e.target.value)}
            rows={6}
            style={{
              width: '100%',
              padding: 14,
              fontSize: 17,
              lineHeight: 1.5,
              fontFamily: 'var(--font-sans)',
              color: 'var(--text-primary)',
              background: 'var(--surface-card)',
              border: '1px solid var(--separator)',
              borderRadius: 'var(--radius-sm)',
              resize: 'vertical',
            }}
          />

          {state.status === 'error' && (
            <p style={{ margin: '10px 0 0', fontSize: 15, color: 'var(--orange-ink)' }}>
              Could not record it: {state.message}. Nothing was saved — try again, or tell whoever
              is running the demo.
            </p>
          )}

          <button
            onClick={submit}
            disabled={!problem.trim() || state.status === 'sending'}
            style={{
              marginTop: 14,
              minHeight: 44,
              padding: '0 20px',
              fontSize: 17,
              fontWeight: 'var(--weight-semibold)',
              color: 'var(--text-on-accent)',
              background: problem.trim() ? 'var(--green)' : 'var(--fill)',
              border: 'none',
              borderRadius: 'var(--radius-capsule)',
              cursor: problem.trim() ? 'pointer' : 'default',
            }}
          >
            {state.status === 'sending' ? 'Sending…' : 'Send it to me'}
          </button>
        </>
      )}
    </div>
  );
}
