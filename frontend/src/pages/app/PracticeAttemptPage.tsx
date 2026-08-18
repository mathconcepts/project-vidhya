/**
 * PracticeAttemptPage — Wave 10: the practice surface for the Wave 9
 * server-side deterministic grading loop.
 *
 *   GET  /api/practice/item/:id   → render-safe item (question, kind,
 *                                    canonical options, marking display —
 *                                    NEVER the answer key)
 *   POST /api/practice/attempt    → structured response, graded on the
 *                                    server (GATE marking), fed into the
 *                                    student model (Elo + FSRS)
 *
 * Unlike SmartPracticePage (which compares strings client-side against a
 * correct_answer it was handed), this page never sees the answer: the
 * grade comes back from the server. `ts` is fixed once per item load so
 * a retried submit is idempotent (the server dedups on it).
 *
 * Routed at /attempt/:objectId; NextBestActionCard links here when a
 * practice/retain action carries an objectId.
 */

import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { authFetch } from '@/lib/auth/client';
import {
  CheckCircle2, XCircle, Loader2, ArrowLeft, SkipForward,
  Target, AlertTriangle, Compass, RefreshCw,
} from 'lucide-react';
import { ReceiptBorder } from '@/components/ui/ReceiptBorder';
import { receiptFromServerGrade } from '@/lib/receipt';
import { setDemoOutcome } from '@/lib/demoPersona';

interface PracticeItem {
  id: string;
  node_id: string;
  topic: string | null;
  question_text: string | null;
  est_minutes: number;
  gradable: boolean;
  question_type: 'mcq' | 'msq' | 'nat' | null;
  marks: number | null;
  options: string[] | null;
  marking: { marks_correct: number; marks_wrong: number } | null;
  not_gradable_reason: string | null;
}

interface AttemptResult {
  grade: { earned: number; max: number; correct: boolean; feedback: string };
  marking: { marks_correct: number; marks_wrong: number };
  /** Revealed only after the answer is committed; never on the item view. */
  solution_steps?: string[];
  recorded: boolean;
  /** T14 (B5, DR-4): populated only for a positive award — never a negative "-N min" line. */
  xp_minutes_awarded?: number | null;
}

const fmt = (n: number) => {
  const r = Math.round(n * 100) / 100;
  return Number.isInteger(r) ? String(r) : r.toFixed(2);
};

export default function PracticeAttemptPage() {
  const { objectId } = useParams<{ objectId: string }>();

  const [item, setItem] = useState<PracticeItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [natValue, setNatValue] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<AttemptResult | null>(null);

  // E7: "New numbers, same concept"
  const [variantQuestion, setVariantQuestion] = useState<string | null>(null);
  const [generatingVariant, setGeneratingVariant] = useState(false);

  // Fixed per item load: idempotency key half + latency clock start.
  const attemptTs = useMemo(() => Date.now(), [objectId]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    setItem(null);
    setResult(null);
    setSelectedIndex(null);
    setSelectedIndices(new Set());
    setNatValue('');

    authFetch(`/api/practice/item/${encodeURIComponent(objectId ?? '')}`)
      .then(async r => {
        if (!r.ok) throw new Error((await r.json().catch(() => null))?.error ?? `HTTP ${r.status}`);
        return r.json();
      })
      .then((data: PracticeItem) => { if (!cancelled) setItem(data); })
      .catch(err => { if (!cancelled) setLoadError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [objectId]);

  const canSubmit = item?.gradable && !submitting && !result && (
    (item.question_type === 'mcq' && selectedIndex !== null) ||
    (item.question_type === 'msq' && selectedIndices.size > 0) ||
    (item.question_type === 'nat' && natValue.trim() !== '' && Number.isFinite(Number(natValue)))
  );

  async function submit(skipped = false) {
    if (!item || submitting || result) return;
    setSubmitting(true);
    setSubmitError(null);

    const response = skipped
      ? { skipped: true }
      : item.question_type === 'mcq' ? { selectedIndex }
      : item.question_type === 'msq' ? { selectedIndices: [...selectedIndices] }
      : { value: Number(natValue) };

    try {
      const r = await authFetch('/api/practice/attempt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          object_id: item.id,
          response,
          latency_ms: Date.now() - attemptTs,
          ts: attemptTs,
        }),
      });
      const data = await r.json().catch(() => null);
      if (!r.ok) throw new Error(data?.error ?? `HTTP ${r.status}`);
      setResult(data as AttemptResult);
      // Hand the graded outcome to the demo rail. The caption reframe and the
      // re-targeted ending both depend on what actually happened — recorded
      // from the server's grade, never inferred, because that moment is the
      // one the whole miss choreography rests on.
      setDemoOutcome({ objectId: item.id, correct: (data as AttemptResult).grade.correct });
    } catch (err) {
      setSubmitError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  async function fetchNewNumbers() {
    if (!item || generatingVariant || result) return;
    setGeneratingVariant(true);
    setVariantQuestion(null);
    try {
      const r = await authFetch(`/api/practice/new-numbers/${encodeURIComponent(item.id)}`, { method: 'POST' });
      const data = await r.json().catch(() => null);
      if (!r.ok) throw new Error(data?.error ?? `HTTP ${r.status}`);
      setVariantQuestion(data?.question_text ?? null);
    } catch {
      setVariantQuestion(null);
    } finally {
      setGeneratingVariant(false);
    }
  }

  function toggleIndex(i: number) {
    if (result) return;
    if (item?.question_type === 'mcq') {
      setSelectedIndex(i);
    } else {
      setSelectedIndices(prev => {
        const next = new Set(prev);
        next.has(i) ? next.delete(i) : next.add(i);
        return next;
      });
    }
  }

  const isPicked = (i: number) =>
    item?.question_type === 'mcq' ? selectedIndex === i : selectedIndices.has(i);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Link
        to="/planned"
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 'var(--text-caption)', color: 'var(--text-tertiary)', textDecoration: 'none' }}
      >
        <ArrowLeft size={13} /> Back to your plan
      </Link>

      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)', fontSize: 'var(--text-body)', padding: '48px 0', justifyContent: 'center' }}>
          <Loader2 size={16} className="animate-spin" /> Loading item…
        </div>
      )}

      {loadError && (
        <div style={{ padding: 16, borderRadius: 'var(--radius-md)', background: 'rgba(255,59,48,.06)', border: '1px solid rgba(255,59,48,.22)', fontSize: 'var(--text-body)', color: 'var(--red)', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
          <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <p style={{ margin: 0, fontWeight: 'var(--weight-semibold)' }}>Couldn't load this item</p>
            <p style={{ margin: '4px 0 0', opacity: 0.8 }}>{loadError}</p>
            <Link to="/smart-practice" style={{ marginTop: 8, display: 'inline-block', color: 'var(--green-ink)', textDecoration: 'none' }}>Practice something else →</Link>
          </div>
        </div>
      )}

      {item && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ borderRadius: 'var(--radius-md)', background: 'var(--surface-card)', boxShadow: 'var(--shadow-raise)', padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 'var(--text-caption2)', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-tertiary)' }}>
              <Target size={12} />
              {item.topic ?? item.node_id}
              {item.question_type && (
                <span style={{ color: 'var(--text-tertiary)', textTransform: 'none' }}>· {item.question_type.toUpperCase()}</span>
              )}
            </div>
            {item.marking && (
              <span style={{ fontSize: 'var(--text-caption2)', fontFamily: 'var(--font-mono)', padding: '2px 8px', borderRadius: 'var(--radius-xs)', background: 'var(--surface-fill)', border: 'var(--hairline) solid var(--separator)', color: 'var(--text-secondary)' }}>
                correct +{fmt(item.marking.marks_correct)} · wrong {item.marking.marks_wrong === 0 ? '0' : fmt(item.marking.marks_wrong)}
              </span>
            )}
          </div>

          <div>
            <p style={{ margin: 0, fontSize: 'var(--text-body)', color: 'var(--text-primary)', lineHeight: 'var(--leading-relaxed)', whiteSpace: 'pre-wrap' }}>
              {variantQuestion ?? item.question_text ?? 'This item has no question text.'}
            </p>
            {variantQuestion && (
              <p style={{ margin: '6px 0 0', fontSize: 'var(--text-caption2)', color: 'var(--text-tertiary)' }}>
                ↑ New numbers — same concept. Submit the original item above for grading.
              </p>
            )}
          </div>

          {/* E7: New numbers button — only for NAT/MCQ items, before result */}
          {(item.question_type === 'nat' || item.question_type === 'mcq') && !result && (
            <button
              onClick={fetchNewNumbers}
              disabled={generatingVariant}
              title="Same concept, different numbers — self-check only"
              style={{
                alignSelf: 'flex-start',
                padding: '6px 12px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--surface-fill)',
                border: 'var(--hairline) solid var(--separator)',
                color: 'var(--indigo-ink)',
                fontSize: 'var(--text-caption)',
                fontFamily: 'var(--font-sans)',
                cursor: generatingVariant ? 'wait' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              {generatingVariant
                ? <><Loader2 size={12} className="animate-spin" /> Generating…</>
                : <><RefreshCw size={12} /> New numbers, same concept</>
              }
            </button>
          )}

          {!item.gradable && (
            <div style={{ padding: 12, borderRadius: 'var(--radius-sm)', background: 'rgba(255,159,10,.06)', border: '1px solid rgba(255,159,10,.22)', fontSize: 'var(--text-caption)', color: 'var(--orange)', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <p style={{ margin: 0, fontWeight: 'var(--weight-semibold)' }}>Display-only practice</p>
                <p style={{ margin: '4px 0 0', opacity: 0.8 }}>
                  This item isn't deterministically gradable yet — work it on paper, then
                  {' '}<Link to="/smart-practice" style={{ color: 'var(--green-ink)', textDecoration: 'none' }}>practice a graded set →</Link>
                </p>
              </div>
            </div>
          )}

          {item.gradable && item.options && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }} role={item.question_type === 'mcq' ? 'radiogroup' : 'group'}>
              {item.question_type === 'msq' && (
                <p style={{ margin: 0, fontSize: 'var(--text-caption2)', color: 'var(--text-tertiary)' }}>Select every correct option — full marks only for the exact set.</p>
              )}
              {item.options.map((opt, i) => (
                <button
                  key={i}
                  disabled={!!result || submitting}
                  onClick={() => toggleIndex(i)}
                  role={item.question_type === 'mcq' ? 'radio' : 'checkbox'}
                  aria-checked={isPicked(i)}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: `var(--hairline) solid ${isPicked(i) ? 'var(--text-secondary)' : 'var(--separator)'}`,
                    background: isPicked(i) ? 'var(--surface-fill)' : 'var(--surface-fill)',
                    color: isPicked(i) ? 'var(--text-primary)' : 'var(--text-secondary)',
                    fontSize: 'var(--text-body)',
                    fontFamily: 'var(--font-sans)',
                    cursor: result || submitting ? 'default' : 'pointer',
                    opacity: result || submitting ? 0.7 : 1,
                    fontWeight: isPicked(i) ? 'var(--weight-medium)' : undefined,
                  }}
                >
                  <span style={{ fontFamily: 'var(--font-mono)', marginRight: 8, fontWeight: 'var(--weight-bold)' }}>{String.fromCharCode(65 + i)}.</span>
                  {opt}
                </button>
              ))}
            </div>
          )}

          {item.gradable && item.question_type === 'nat' && (
            <input
              type="number"
              step="any"
              inputMode="decimal"
              value={natValue}
              disabled={!!result || submitting}
              onChange={e => setNatValue(e.target.value)}
              placeholder="Numeric answer…"
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--surface-fill)',
                border: 'var(--hairline) solid var(--separator)',
                color: 'var(--text-primary)',
                fontSize: 'var(--text-body)',
                fontFamily: 'var(--font-sans)',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          )}

          {item.gradable && !result && (
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => submit(false)}
                disabled={!canSubmit}
                style={{
                  flex: 1,
                  padding: '10px 0',
                  borderRadius: 'var(--radius-sm)',
                  background: canSubmit ? 'var(--green)' : 'var(--surface-fill)',
                  color: canSubmit ? '#fff' : 'var(--text-tertiary)',
                  border: 'none',
                  fontFamily: 'var(--font-sans)',
                  fontWeight: 'var(--weight-semibold)',
                  fontSize: 'var(--text-body)',
                  cursor: canSubmit ? 'pointer' : 'not-allowed',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                {submitting && <Loader2 size={14} className="animate-spin" />}
                Submit
              </button>
              <button
                onClick={() => submit(true)}
                disabled={submitting}
                title="Skipping earns and costs nothing"
                style={{
                  padding: '10px 16px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--surface-fill)',
                  border: 'var(--hairline) solid var(--separator)',
                  color: 'var(--text-secondary)',
                  fontSize: 'var(--text-body)',
                  fontFamily: 'var(--font-sans)',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <SkipForward size={13} /> Skip
              </button>
            </div>
          )}

          {submitError && (
            <p style={{ margin: 0, fontSize: 'var(--text-caption)', color: 'var(--red)' }}>
              {submitError} — your answer wasn't lost; try Submit again.
            </p>
          )}

          {result && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
              <div style={{
                padding: 12,
                borderRadius: 'var(--radius-sm)',
                border: `1px solid ${result.grade.correct ? 'rgba(52,199,89,.25)' : 'rgba(255,59,48,.25)'}`,
                background: result.grade.correct ? 'rgba(52,199,89,.06)' : 'rgba(255,59,48,.06)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 8,
              }}>
                {result.grade.correct
                  ? <CheckCircle2 size={15} style={{ color: 'var(--green-ink)', flexShrink: 0, marginTop: 2 }} />
                  : <XCircle size={15} style={{ color: 'var(--red)', flexShrink: 0, marginTop: 2 }} />}
                <div style={{ fontSize: 'var(--text-caption)', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 4, width: '100%' }}>
                  {/* Server-graded: GateDeterministicScorer computed this on the
                      server from the canonical answer key, which the client
                      never sees. That's a real backing verification, not a
                      client-side string match — earns the receipt border. */}
                  <ReceiptBorder receipt={receiptFromServerGrade(result.grade)}>
                    <p style={{ margin: 0, fontWeight: 'var(--weight-semibold)', color: 'var(--text-primary)' }}>
                      {result.grade.correct ? 'Correct' : 'Not this time'} — {fmt(result.grade.earned)} / {fmt(result.grade.max)} marks
                    </p>
                    <p style={{ margin: '4px 0 0', opacity: 0.8 }}>{result.grade.feedback}</p>
                  </ReceiptBorder>
                  {/* Full-step reveal. Withheld until the answer is committed —
                      the item view never carries it — and shown either way: a
                      student who missed needs the steps most, and one who got
                      it right should be able to check their route rather than
                      trust the mark. */}
                  {!!result.solution_steps?.length && (
                    <ol style={{ margin: '10px 0 0', paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {result.solution_steps.map((s, i) => (
                        <li key={i} style={{ fontSize: 15, lineHeight: 1.45, color: 'var(--text-secondary)' }}>{s}</li>
                      ))}
                    </ol>
                  )}
                  {!result.recorded && (
                    <p style={{ margin: 0, color: 'var(--orange)', paddingTop: 4 }}>
                      Graded, but not recorded to your model (server storage unavailable).
                    </p>
                  )}
                  {/* DR-4: one quiet line, no toast, no floating number — and
                      only ever positive (a wrong-MCQ's negative XP event is
                      written server-side but never shown here). */}
                  {!!result.xp_minutes_awarded && result.xp_minutes_awarded > 0 && (
                    <p style={{ margin: 0, color: 'var(--green-ink)', paddingTop: 4 }}>
                      +{result.xp_minutes_awarded} min of focused work
                    </p>
                  )}
                  <Link to="/planned" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--green-ink)', textDecoration: 'none', paddingTop: 4 }}>
                    <Compass size={12} /> What's next for me?
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      )}
    </div>
  );
}
