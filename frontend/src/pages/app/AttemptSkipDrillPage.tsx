/**
 * AttemptSkipDrillPage — the W3.2 attempt/skip drill.
 *
 * Design doc: docs/designs/2026-08-27-content-readiness-market-research-
 * integration.md §W3.2 + the W-UI "W3.2 attempt/skip drill" contract.
 *
 *   GET  /api/practice/attempt-skip-drill?concept_id=  → 5 gradable items,
 *        each with its marking and a break-even sentence. No answer key.
 *   POST /api/practice/attempt          → the Attempt arm, graded through
 *        the SAME path as ordinary practice (Elo + FSRS + XP).
 *   POST /api/practice/attempt-skip-drill/skip → the Skip arm, evaluated
 *        against the student's measured accuracy on the concept.
 *
 * Routed at /attempt-skip-drill; the mock results counterfactual's single
 * CTA links here with the concept it derived.
 *
 * ── The two buttons are equals, and that is the whole feature ────────────
 *
 * "Attempt" and "Skip" render at identical size (44px, flex: 1) from the
 * SAME style object, and NEITHER is styled primary. The UI must not teach
 * "skipping is giving up" while the content teaches the opposite — a
 * student who learns to skip a 25%-confidence MCQ has learned the thing
 * this drill exists for. AttemptSkipDrillPage.test.tsx asserts the parity
 * so a later "make the primary action obvious" edit cannot break it.
 *
 * ── Colour law ──────────────────────────────────────────────────────────
 *
 * A CORRECT SKIP gets green (`--green-ink`): green is correctness in
 * Clarity, and a correct skip is a correct answer to the question this
 * drill actually asks. That is the sanctioned use, and the most
 * persuasive pixel the feature ships.
 *
 * A wrong decision gets neutral tokens and WORDS — no red anywhere, no
 * hard-coded hex. "Wrong" has no colour in Clarity. The reason sentences
 * are 17px and come from the server, so the register is asserted there.
 *
 * ── Honest states ───────────────────────────────────────────────────────
 *
 * Every refusal is the server's own sentence, shown verbatim: fewer than
 * five gradable items names the count and the concept; a DB-less deploy
 * says "building your baseline". The page invents nothing. Without a
 * `?concept=` it says so rather than picking a concept on the student's
 * behalf.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { authFetch } from '@/lib/auth/client';

interface DrillItem {
  object_id: string;
  concept_id: string;
  topic: string | null;
  question_text: string | null;
  question_type: 'mcq' | 'msq' | 'nat';
  marks: number;
  options: string[] | null;
  marking: { marks_correct: number; marks_wrong: number };
  break_even_sentence: string;
}

interface DrillResponse {
  concept_id: string;
  concept_label: string;
  items: DrillItem[];
}

/** What the server said about the call the student just made. */
interface Outcome {
  choice: 'attempt' | 'skip';
  /** Green iff this is true — a right call, whichever arm it came from. */
  goodCall: boolean;
  headline: string;
  reason: string;
}

const fmt = (n: number) => {
  const abs = Math.abs(n);
  if (Number.isInteger(abs)) return String(abs);
  for (const [value, glyph] of [[1 / 3, '⅓'], [1 / 2, '½'], [2 / 3, '⅔']] as const) {
    if (Math.abs(abs - value) < 1e-4) return glyph;
  }
  return String(Math.round(abs * 100) / 100);
};

export default function AttemptSkipDrillPage() {
  const [params] = useSearchParams();
  const conceptId = params.get('concept') ?? '';

  const [drill, setDrill] = useState<DrillResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<'deciding' | 'answering' | 'resolved'>('deciding');
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [natValue, setNatValue] = useState('');

  const item = drill?.items[index] ?? null;

  // Fixed per item: the server dedups attempts on (student, object, ts),
  // so a retried submit of the SAME item is idempotent.
  const attemptTs = useMemo(() => Date.now(), [item?.object_id]);

  useEffect(() => {
    if (conceptId === '') return;
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    authFetch(`/api/practice/attempt-skip-drill?concept_id=${encodeURIComponent(conceptId)}`)
      .then(async (r) => {
        const data = await r.json().catch(() => null);
        if (!r.ok) throw new Error(data?.error ?? `HTTP ${r.status}`);
        return data as DrillResponse;
      })
      .then((data) => { if (!cancelled) setDrill(data); })
      .catch((err) => { if (!cancelled) setLoadError((err as Error).message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [conceptId]);

  const reset = useCallback(() => {
    setPhase('deciding');
    setOutcome(null);
    setActionError(null);
    setSelectedIndex(null);
    setSelectedIndices(new Set());
    setNatValue('');
  }, []);

  async function chooseSkip() {
    if (!item || busy) return;
    setBusy(true);
    setActionError(null);
    try {
      const r = await authFetch('/api/practice/attempt-skip-drill/skip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ object_id: item.object_id }),
      });
      const data = await r.json().catch(() => null);
      if (!r.ok) throw new Error(data?.error ?? `HTTP ${r.status}`);
      setOutcome({
        choice: 'skip',
        goodCall: data.verdict === 'good_skip',
        headline: data.verdict === 'good_skip'
          ? 'Good skip'
          : data.verdict === 'should_have_attempted' ? 'This one was worth a try' : 'Skipped',
        reason: data.reason,
      });
      setPhase('resolved');
    } catch (err) {
      setActionError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function submitAnswer() {
    if (!item || busy) return;
    const response = item.question_type === 'mcq'
      ? { selectedIndex }
      : item.question_type === 'msq'
        ? { selectedIndices: [...selectedIndices] }
        : { value: Number(natValue) };

    setBusy(true);
    setActionError(null);
    try {
      const r = await authFetch('/api/practice/attempt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ object_id: item.object_id, response, ts: attemptTs, latency_ms: Date.now() - attemptTs }),
      });
      const data = await r.json().catch(() => null);
      if (!r.ok) throw new Error(data?.error ?? `HTTP ${r.status}`);
      const correct = data.grade?.correct === true;
      setOutcome({
        choice: 'attempt',
        goodCall: correct,
        headline: correct ? 'Correct' : 'Not this time',
        reason: correct
          ? `You banked ${fmt(data.grade.earned)} marks. Attempting was the right call.`
          : `That cost you ${fmt(data.grade.earned)} of a mark. ${item.break_even_sentence}`,
      });
      setPhase('resolved');
    } catch (err) {
      setActionError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const canSubmit = !busy && item !== null && (
    (item.question_type === 'mcq' && selectedIndex !== null)
    || (item.question_type === 'msq' && selectedIndices.size > 0)
    || (item.question_type === 'nat' && natValue.trim() !== '' && Number.isFinite(Number(natValue)))
  );

  const lastItem = drill ? index >= drill.items.length - 1 : false;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Link to="/mock-exam" style={backLinkStyle}>
        <ArrowLeft size={13} /> Back to your mock
      </Link>

      <div>
        <p style={eyebrowStyle}>Attempt or skip</p>
        <p style={bodyStyle}>
          Five questions. You don't have to answer them — decide whether answering is worth it, and
          find out whether the call was right.
        </p>
      </div>

      {conceptId === '' && (
        <p data-testid="drill-no-concept" style={supportingStyle}>
          This drill needs a concept to draw from. Open it from a mock result, which picks one for you.
        </p>
      )}

      {loading && (
        <p style={{ ...supportingStyle, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Loader2 size={15} className="animate-spin" /> Lining up five questions…
        </p>
      )}

      {loadError && (
        <p data-testid="drill-load-error" style={bodyStyle}>{loadError}</p>
      )}

      {item && (
        <div data-testid="drill-item" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
            <span style={supportingStyle}>Question {index + 1} of {drill!.items.length}</span>
            <span data-testid="drill-marking-chip" style={chipStyle}>
              {item.question_type.toUpperCase()} · right +{fmt(item.marking.marks_correct)} · wrong{' '}
              {item.marking.marks_wrong === 0 ? '0' : `−${fmt(item.marking.marks_wrong)}`}
            </span>
          </div>

          <p style={bodyStyle}>{item.question_text ?? 'This item has no question text.'}</p>

          {phase === 'deciding' && (
            <>
              <p style={supportingStyle}>{item.break_even_sentence}</p>
              {/* Equal weight, equal size, neither primary — see the header. */}
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  data-testid="drill-attempt-button"
                  className="attempt-skip-choice"
                  onClick={() => setPhase('answering')}
                  disabled={busy}
                  style={choiceButtonStyle}
                >
                  Attempt
                </button>
                <button
                  data-testid="drill-skip-button"
                  className="attempt-skip-choice"
                  onClick={chooseSkip}
                  disabled={busy}
                  style={choiceButtonStyle}
                >
                  Skip
                </button>
              </div>
            </>
          )}

          {phase === 'answering' && (
            <>
              {(item.question_type === 'mcq' || item.question_type === 'msq') && item.options && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {item.options.map((opt, i) => {
                    const picked = item.question_type === 'mcq' ? selectedIndex === i : selectedIndices.has(i);
                    return (
                      <button
                        key={i}
                        onClick={() => {
                          if (item.question_type === 'mcq') setSelectedIndex(i);
                          else setSelectedIndices((prev) => {
                            const next = new Set(prev);
                            next.has(i) ? next.delete(i) : next.add(i);
                            return next;
                          });
                        }}
                        style={{ ...optionButtonStyle, borderColor: picked ? 'var(--text-primary)' : 'var(--separator)' }}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              )}
              {item.question_type === 'nat' && (
                <input
                  aria-label="Your answer"
                  value={natValue}
                  onChange={(e) => setNatValue(e.target.value)}
                  inputMode="decimal"
                  style={inputStyle}
                />
              )}
              <button
                data-testid="drill-submit-button"
                onClick={submitAnswer}
                disabled={!canSubmit}
                style={{ ...choiceButtonStyle, opacity: canSubmit ? 1 : 0.5 }}
              >
                Submit answer
              </button>
            </>
          )}

          {phase === 'resolved' && outcome && (
            <div data-testid="drill-outcome" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <p
                data-testid="drill-outcome-headline"
                style={{
                  ...bodyStyle,
                  fontWeight: 'var(--weight-semibold)',
                  // Green ONLY for a right call — the sanctioned use.
                  color: outcome.goodCall ? 'var(--green-ink)' : 'var(--text-primary)',
                }}
              >
                {outcome.headline}
              </p>
              <p data-testid="drill-outcome-reason" style={bodyStyle}>{outcome.reason}</p>
              {!lastItem && (
                <button
                  data-testid="drill-next-button"
                  onClick={() => { setIndex((i) => i + 1); reset(); }}
                  style={choiceButtonStyle}
                >
                  Next question
                </button>
              )}
              {lastItem && (
                <p data-testid="drill-done" style={supportingStyle}>
                  That's all five. Every answer you gave counts toward your practice record.
                </p>
              )}
            </div>
          )}

          {actionError && <p style={supportingStyle}>{actionError}</p>}
        </div>
      )}
    </div>
  );
}

// ── Tokens only. No accent colour except green on a right call. ──

const backLinkStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  fontSize: 'var(--text-caption)',
  color: 'var(--text-tertiary)',
  textDecoration: 'none',
};

const eyebrowStyle: React.CSSProperties = {
  margin: '0 0 4px',
  fontSize: 'var(--text-caption2)',
  fontWeight: 'var(--weight-semibold)',
  textTransform: 'uppercase',
  letterSpacing: 'var(--tracking-caps)',
  color: 'var(--text-tertiary)',
};

const bodyStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 'var(--text-body)',
  lineHeight: 'var(--leading-relaxed)',
  color: 'var(--text-primary)',
};

const supportingStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 'var(--text-subhead)',
  lineHeight: 'var(--leading-normal)',
  color: 'var(--text-secondary)',
};

const chipStyle: React.CSSProperties = {
  flexShrink: 0,
  fontSize: 'var(--text-caption)',
  fontFamily: 'var(--font-mono)',
  padding: '2px 8px',
  borderRadius: 'var(--radius-xs)',
  background: 'var(--surface-fill)',
  border: 'var(--hairline) solid var(--separator)',
  color: 'var(--text-secondary)',
};

/**
 * ONE style object for both choice buttons. Not two that happen to match
 * — one, so they cannot drift apart in a later edit.
 */
const choiceButtonStyle: React.CSSProperties = {
  flex: 1,
  minHeight: 44,
  padding: '0 16px',
  borderRadius: 'var(--radius-sm)',
  border: 'var(--hairline) solid var(--separator)',
  background: 'var(--surface-fill)',
  color: 'var(--text-primary)',
  fontSize: 'var(--text-body)',
  fontFamily: 'var(--font-sans)',
  cursor: 'pointer',
};

const optionButtonStyle: React.CSSProperties = {
  minHeight: 44,
  padding: '10px 14px',
  textAlign: 'left',
  borderRadius: 'var(--radius-sm)',
  border: 'var(--hairline) solid var(--separator)',
  background: 'var(--surface-fill)',
  color: 'var(--text-primary)',
  fontSize: 'var(--text-body)',
  fontFamily: 'var(--font-sans)',
  cursor: 'pointer',
};

const inputStyle: React.CSSProperties = {
  minHeight: 44,
  padding: '10px 14px',
  borderRadius: 'var(--radius-sm)',
  border: 'var(--hairline) solid var(--separator)',
  background: 'var(--surface-fill)',
  color: 'var(--text-primary)',
  fontSize: 'var(--text-body)',
};
