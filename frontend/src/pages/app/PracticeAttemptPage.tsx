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
  Target, AlertTriangle, Compass,
} from 'lucide-react';
import { clsx } from 'clsx';

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
  recorded: boolean;
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
    } catch (err) {
      setSubmitError((err as Error).message);
    } finally {
      setSubmitting(false);
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
    <div className="max-w-2xl mx-auto px-4 py-6">
      <Link to="/planned" className="inline-flex items-center gap-1.5 text-xs text-surface-400 hover:text-surface-200 transition-colors mb-4">
        <ArrowLeft size={13} /> Back to your plan
      </Link>

      {loading && (
        <div className="flex items-center gap-2 text-surface-400 text-sm py-12 justify-center">
          <Loader2 size={16} className="animate-spin" /> Loading item…
        </div>
      )}

      {loadError && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/25 text-sm text-red-300 flex items-start gap-2">
          <AlertTriangle size={15} className="shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Couldn't load this item</p>
            <p className="mt-0.5 opacity-80">{loadError}</p>
            <Link to="/smart-practice" className="mt-2 inline-block text-violet-400 hover:text-violet-300">Practice something else →</Link>
          </div>
        </div>
      )}

      {item && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-surface-900 border border-surface-800 p-5 space-y-4"
        >
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-violet-400">
              <Target size={12} />
              {item.topic ?? item.node_id}
              {item.question_type && <span className="text-surface-500 normal-case">· {item.question_type.toUpperCase()}</span>}
            </div>
            {item.marking && (
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-surface-800 border border-surface-700 text-surface-300">
                correct +{fmt(item.marking.marks_correct)} · wrong {item.marking.marks_wrong === 0 ? '0' : fmt(item.marking.marks_wrong)}
              </span>
            )}
          </div>

          <p className="text-sm text-surface-100 leading-relaxed whitespace-pre-wrap">
            {item.question_text ?? 'This item has no question text.'}
          </p>

          {!item.gradable && (
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/25 text-xs text-amber-300 flex items-start gap-2">
              <AlertTriangle size={14} className="shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Display-only practice</p>
                <p className="mt-0.5 opacity-80">
                  This item isn't deterministically gradable yet — work it on paper, then
                  {' '}<Link to="/smart-practice" className="text-violet-400 hover:text-violet-300">practice a graded set →</Link>
                </p>
              </div>
            </div>
          )}

          {item.gradable && item.options && (
            <div className="space-y-1.5" role={item.question_type === 'mcq' ? 'radiogroup' : 'group'}>
              {item.question_type === 'msq' && (
                <p className="text-[11px] text-surface-500">Select every correct option — full marks only for the exact set.</p>
              )}
              {item.options.map((opt, i) => (
                <button
                  key={i}
                  disabled={!!result || submitting}
                  onClick={() => toggleIndex(i)}
                  role={item.question_type === 'mcq' ? 'radio' : 'checkbox'}
                  aria-checked={isPicked(i)}
                  className={clsx(
                    'w-full text-left p-2.5 rounded-lg border transition-colors text-sm',
                    isPicked(i)
                      ? 'bg-violet-500/15 border-violet-500/40 text-violet-200'
                      : 'bg-surface-800 border-surface-700 text-surface-300 hover:border-surface-500',
                    (result || submitting) && 'opacity-70 cursor-default',
                  )}
                >
                  <span className="font-mono mr-2 font-bold">{String.fromCharCode(65 + i)}.</span>
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
              className="w-full px-3 py-2 rounded-lg bg-surface-800 border border-surface-700 text-surface-200 text-sm focus:outline-none focus:border-violet-500/50"
            />
          )}

          {item.gradable && !result && (
            <div className="flex gap-2">
              <button
                onClick={() => submit(false)}
                disabled={!canSubmit}
                className="flex-1 py-2.5 rounded-lg bg-violet-500 text-white text-sm font-semibold disabled:opacity-50 inline-flex items-center justify-center gap-2"
              >
                {submitting && <Loader2 size={14} className="animate-spin" />}
                Submit
              </button>
              <button
                onClick={() => submit(true)}
                disabled={submitting}
                title="Skipping earns and costs nothing"
                className="px-4 py-2.5 rounded-lg bg-surface-800 border border-surface-700 text-surface-400 text-sm hover:text-surface-200 inline-flex items-center gap-1.5"
              >
                <SkipForward size={13} /> Skip
              </button>
            </div>
          )}

          {submitError && (
            <p className="text-xs text-red-400">{submitError} — your answer wasn't lost; try Submit again.</p>
          )}

          {result && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className={clsx(
                'p-3 rounded-lg border flex items-start gap-2',
                result.grade.correct ? 'bg-emerald-500/10 border-emerald-500/25' : 'bg-red-500/10 border-red-500/25',
              )}
            >
              {result.grade.correct
                ? <CheckCircle2 size={15} className="text-emerald-400 shrink-0 mt-0.5" />
                : <XCircle size={15} className="text-red-400 shrink-0 mt-0.5" />}
              <div className="text-xs text-surface-300 space-y-1">
                <p className="font-semibold">
                  {result.grade.correct ? 'Correct' : 'Not this time'} — {fmt(result.grade.earned)} / {fmt(result.grade.max)} marks
                </p>
                <p className="opacity-80">{result.grade.feedback}</p>
                {!result.recorded && (
                  <p className="text-amber-400/90">Graded, but not recorded to your model (server storage unavailable).</p>
                )}
                <Link to="/planned" className="inline-flex items-center gap-1 text-violet-400 hover:text-violet-300 pt-1">
                  <Compass size={12} /> What's next for me?
                </Link>
              </div>
            </motion.div>
          )}
        </motion.div>
      )}
    </div>
  );
}
