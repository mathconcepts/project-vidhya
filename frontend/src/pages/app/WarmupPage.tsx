/**
 * WarmupPage — T8 (A8, DR-2). Orchestrates the diagnostic warmup: fetches
 * the curated spine (GET /api/readiness/warmup/spine), walks each concept
 * via the Wave-4 stateless per-skill endpoints (POST .../warmup/next,
 * POST .../warmup/apply), and on completion persists the placement
 * (POST .../warmup/persist) before showing the result screen.
 *
 * State machine lives here; WarmupProbeScreen / WarmupResultScreen are
 * pure presentational components (frontend/src/components/warmup/).
 */
import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { authFetch, getToken } from '@/lib/auth/client';
import { WarmupProbeScreen, type WarmupProbe } from '@/components/warmup/WarmupProbeScreen';
import { WarmupResultScreen } from '@/components/warmup/WarmupResultScreen';
import {
  WARMUP_SAVE_ERROR_COPY,
  WARMUP_LOAD_ERROR_COPY,
  WARMUP_SIGNIN_REQUIRED_COPY,
  WARMUP_SIGNIN_CTA_LABEL,
  WARMUP_SIGNIN_RETRY_LABEL,
  WARMUP_COMPLETED_KEY,
  classifyPersistFailure,
  savePendingWarmupResults,
  loadPendingWarmupResults,
  clearPendingWarmupResults,
  type SpineConcept,
} from '@/lib/warmup-logic';

interface PersistResultEntry {
  skill_id: string;
  converged: boolean;
  ability_estimate: number;
  probes_used: number;
  predicted_success_at_close: number;
}

interface ClientProbe extends WarmupProbe {
  difficulty: number;
  answerIndex: number | null;
}

function toClientProbe(raw: any): ClientProbe {
  const payload = raw?.payload ?? {};
  return {
    id: raw?.id ?? '',
    questionText: typeof payload.questionText === 'string' ? payload.questionText : '',
    options: Array.isArray(payload.options) ? payload.options : [],
    difficulty: typeof raw?.difficulty === 'number' ? raw.difficulty : 1000,
    answerIndex: typeof payload.answerIndex === 'number' ? payload.answerIndex : null,
  };
}

type Phase = 'loading' | 'probe' | 'saving' | 'save-error' | 'sign-in' | 'load-error' | 'result';

export default function WarmupPage() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>('loading');
  const [spine, setSpine] = useState<SpineConcept[]>([]);
  const [conceptIndex, setConceptIndex] = useState(0);
  const [probe, setProbe] = useState<ClientProbe | null>(null);
  const [warmupState, setWarmupState] = useState<unknown>(null);
  const [pending, setPending] = useState(false);
  const [probedAnyProbe, setProbedAnyProbe] = useState(false);
  const [placement, setPlacement] = useState<{ placed: string[]; frontier: string | null } | null>(null);

  // Accumulated per-concept summaries. A ref mirror keeps async callbacks
  // (which otherwise close over stale state) reading the latest list.
  const resultsRef = useRef<PersistResultEntry[]>([]);
  const pushResult = (entry: PersistResultEntry) => {
    resultsRef.current = [...resultsRef.current, entry];
  };

  const persist = useCallback(async (results: PersistResultEntry[]) => {
    setPhase('saving');
    // noClearOn401: an anonymous caller has no token to clear, and a
    // caller with a stale token should keep it around — the sign-in
    // phase below, not authFetch's ghost-JWT cleanup, is what routes
    // this case, and clearing here would just make the eventual real
    // sign-in indistinguishable from "never had a session".
    let status = 0;
    try {
      const r = await authFetch('/api/readiness/warmup/persist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ results }),
        noClearOn401: true,
      });
      status = r.status;
      const data = await r.json().catch(() => null);
      if (!r.ok) throw new Error(data?.error ?? `HTTP ${r.status}`);
      setPlacement({ placed: data.placed ?? [], frontier: data.frontier ?? null });
      setPhase('result');
      clearPendingWarmupResults();
      try { localStorage.setItem(WARMUP_COMPLETED_KEY, '1'); } catch { /* private mode */ }
    } catch {
      // Red-team fix 1: a 401 here means the platform's anonymous-first
      // warmup ran to completion but there's no signed-in student to
      // save the placement against. That is not transient — retrying
      // the identical unauthenticated request can never succeed, so it
      // gets its own honest phase instead of a "tap to retry" that lies.
      // The results are kept in localStorage (in addition to resultsRef,
      // which already survives in memory) so returning to /warmup after
      // signing in can save them without re-taking the diagnostic.
      const kind = classifyPersistFailure(status || null);
      if (kind === 'sign-in') {
        savePendingWarmupResults(results);
        setPhase('sign-in');
      } else {
        // §11 states table: "Couldn't save your placement — your answers
        // are kept, tap to retry." resultsRef still holds every answer.
        setPhase('save-error');
      }
    }
  }, []);

  const startConcept = useCallback(async (index: number, spineList: SpineConcept[]) => {
    if (index >= spineList.length) {
      await persist(resultsRef.current);
      return;
    }
    setConceptIndex(index);
    setPending(true);
    setPhase('loading');
    try {
      const r = await authFetch('/api/readiness/warmup/next', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skill_id: spineList[index].id }),
      });
      const data = await r.json().catch(() => null);
      if (!r.ok) throw new Error(data?.error ?? `HTTP ${r.status}`);

      if (data.probe) {
        setProbe(toClientProbe(data.probe));
        setWarmupState(data.state);
        setPending(false);
        setPhase('probe');
        return;
      }

      // Converged instantly (rare) or the catalog band for this concept is
      // empty ("no probe for band → early 'Your starting line is ready'" —
      // §11 states table). Either way, record what we have (probesUsed: 0
      // for an empty band) and move straight to the next concept without
      // showing a probe screen for this one.
      pushResult({
        skill_id: spineList[index].id,
        converged: Boolean(data.converged),
        ability_estimate: data.ability_estimate ?? data.summary?.abilityEstimate ?? 1000,
        probes_used: data.summary?.probesUsed ?? 0,
        predicted_success_at_close: data.summary?.predictedSuccessAtClose ?? 0,
      });
      await startConcept(index + 1, spineList);
    } catch {
      setPending(false);
      setPhase('load-error');
    }
  }, [persist]);

  const loadSpineAndStart = useCallback(async () => {
    setPhase('loading');
    try {
      const r = await authFetch('/api/readiness/warmup/spine');
      const data = await r.json().catch(() => null);
      if (!r.ok) throw new Error(data?.error ?? `HTTP ${r.status}`);
      const concepts: SpineConcept[] = data.concepts ?? [];
      setSpine(concepts);
      await startConcept(0, concepts);
    } catch {
      setPhase('load-error');
    }
  }, [startConcept]);

  // Red-team fix 1: if a prior anonymous run left results stranded by a
  // 401 at persist, and the student now has a token (they signed in and
  // came back to /warmup), save those results instead of making them
  // re-take the whole diagnostic. Cheap and only runs once on mount.
  useEffect(() => {
    const pending = loadPendingWarmupResults<PersistResultEntry[]>();
    if (pending && pending.length > 0 && getToken()) {
      resultsRef.current = pending;
      void persist(pending);
      return;
    }
    void loadSpineAndStart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleAnswer(selectedIndex: number) {
    if (!probe || pending) return;
    setPending(true);
    setProbedAnyProbe(true);
    const correct = selectedIndex >= 0 && selectedIndex === probe.answerIndex;
    try {
      const r = await authFetch('/api/readiness/warmup/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          state: warmupState,
          object_id: probe.id,
          difficulty: probe.difficulty,
          correct,
        }),
      });
      const data = await r.json().catch(() => null);
      if (!r.ok) throw new Error(data?.error ?? `HTTP ${r.status}`);

      if (data.converged) {
        pushResult({
          skill_id: spine[conceptIndex].id,
          converged: true,
          ability_estimate: data.ability_estimate ?? data.summary?.abilityEstimate ?? probe.difficulty,
          probes_used: data.summary?.probesUsed ?? 1,
          predicted_success_at_close: data.summary?.predictedSuccessAtClose ?? 0,
        });
        await startConcept(conceptIndex + 1, spine);
        return;
      }

      // Not converged — fetch the next probe within THIS concept. Quiet
      // crossfade: `phase` stays 'probe' the whole time; WarmupProbeScreen
      // dims via its own `pending` prop (≤180ms opacity transition) rather
      // than a full-screen spinner swap.
      setWarmupState(data.state);
      const nextR = await authFetch('/api/readiness/warmup/next', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skill_id: spine[conceptIndex].id, state: data.state }),
      });
      const nextData = await nextR.json().catch(() => null);
      if (!nextR.ok) throw new Error(nextData?.error ?? `HTTP ${nextR.status}`);

      if (nextData.probe) {
        setProbe(toClientProbe(nextData.probe));
        setPending(false);
        return;
      }

      // Exhausted mid-concept — the catalog ran out of probes for this
      // concept's band. Record the last summary and move on.
      pushResult({
        skill_id: spine[conceptIndex].id,
        converged: Boolean(nextData.converged),
        ability_estimate: nextData.ability_estimate ?? nextData.summary?.abilityEstimate ?? probe.difficulty,
        probes_used: nextData.summary?.probesUsed ?? 1,
        predicted_success_at_close: nextData.summary?.predictedSuccessAtClose ?? 0,
      });
      await startConcept(conceptIndex + 1, spine);
    } catch {
      setPending(false);
      setPhase('load-error');
    }
  }

  function handleStopHere() {
    void persist(resultsRef.current);
  }

  function handleStartPractising() {
    navigate('/planned');
  }

  function handleRetry() {
    if (spine.length === 0) {
      void loadSpineAndStart();
    } else if (probe) {
      // Retry from the current probe's concept — cheap (≤5 probes).
      void startConcept(conceptIndex, spine);
    } else {
      void startConcept(conceptIndex, spine);
    }
  }

  function handleRetryPersist() {
    void persist(resultsRef.current);
  }

  function handleGoToSignIn() {
    // Results already live in resultsRef (this tab) and localStorage
    // (survives navigation/reload) — SignInPage has no returnTo wiring
    // today, so the recovery path is the mount-time pending-results
    // check above, not a redirect back here.
    navigate('/sign-in');
  }

  return (
    <div style={{ maxWidth: 'var(--content-max)', margin: '0 auto', width: '100%', padding: '20px 20px 40px' }}>
      {phase === 'result' && placement && (
        <WarmupResultScreen
          spine={spine}
          placed={placement.placed}
          frontier={placement.frontier}
          probedAnyProbe={probedAnyProbe}
          onStartPractising={handleStartPractising}
        />
      )}

      {phase === 'save-error' && (
        <RetryPanel copy={WARMUP_SAVE_ERROR_COPY} onRetry={handleRetryPersist} />
      )}

      {phase === 'sign-in' && (
        <SignInPanel onSignIn={handleGoToSignIn} onRetryPersist={handleRetryPersist} />
      )}

      {phase === 'load-error' && (
        <RetryPanel copy={WARMUP_LOAD_ERROR_COPY} onRetry={handleRetry} />
      )}

      {(phase === 'loading' || phase === 'saving') && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 8 }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ height: 80, borderRadius: 'var(--radius-md)', background: 'var(--surface-fill)' }} />
          ))}
        </div>
      )}

      {phase === 'probe' && probe && spine[conceptIndex] && (
        <WarmupProbeScreen
          spine={spine}
          conceptIndex={conceptIndex}
          probe={probe}
          showFraming={!probedAnyProbe}
          pending={pending}
          onAnswer={handleAnswer}
          onStopHere={handleStopHere}
        />
      )}
    </div>
  );
}

function RetryPanel({ copy, onRetry }: { copy: string; onRetry: () => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center', paddingTop: 40 }}>
      <p style={{ margin: 0, fontSize: 'var(--text-subhead)', color: 'var(--text-secondary)', textAlign: 'center' }}>
        {copy}
      </p>
      <button
        type="button"
        onClick={onRetry}
        style={{
          minHeight: 'var(--touch-min)', padding: '0 20px', borderRadius: 'var(--radius-sm)',
          background: 'var(--green)', color: 'var(--text-on-accent, #fff)', border: 'none',
          fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-subhead)', cursor: 'pointer',
        }}
      >
        Tap to retry
      </button>
    </div>
  );
}

/**
 * Red-team fix 1 — the honest 401 phase. Distinct from RetryPanel: there
 * is no "tap to retry" promise here, because retrying the same
 * unauthenticated request cannot ever succeed. The answers are kept
 * (resultsRef.current in memory + localStorage via
 * savePendingWarmupResults), so the only actionable move is signing in;
 * a secondary action covers the case where the student already signed in
 * elsewhere (another tab, or came back via browser-back) without this
 * page having remounted yet.
 */
function SignInPanel({ onSignIn, onRetryPersist }: { onSignIn: () => void; onRetryPersist: () => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center', paddingTop: 40 }}>
      <p style={{ margin: 0, fontSize: 'var(--text-subhead)', color: 'var(--text-secondary)', textAlign: 'center' }}>
        {WARMUP_SIGNIN_REQUIRED_COPY}
      </p>
      <button
        type="button"
        onClick={onSignIn}
        style={{
          minHeight: 'var(--touch-min)', padding: '0 20px', borderRadius: 'var(--radius-sm)',
          background: 'var(--green)', color: 'var(--text-on-accent, #fff)', border: 'none',
          fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-subhead)', cursor: 'pointer',
        }}
      >
        {WARMUP_SIGNIN_CTA_LABEL}
      </button>
      <button
        type="button"
        onClick={onRetryPersist}
        style={{
          minHeight: 'var(--touch-min)', padding: '0 12px', borderRadius: 'var(--radius-sm)',
          background: 'transparent', color: 'var(--text-secondary)', border: 'none',
          fontWeight: 'var(--weight-medium)', fontSize: 'var(--text-subhead)', cursor: 'pointer',
        }}
      >
        {WARMUP_SIGNIN_RETRY_LABEL}
      </button>
    </div>
  );
}
