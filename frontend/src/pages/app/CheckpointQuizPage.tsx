/**
 * CheckpointQuizPage — T14 (B5, DR-3): the timed checkpoint quiz.
 *
 *   POST /api/practice/quiz/start          → { quiz_id, items[], deadline_at, time_budget_sec }
 *   POST /api/practice/quiz/:id/submit     → { earned, max, correct, wrong, skipped, per_item, late, recorded }
 *
 * Header says "Checkpoint", never "Exam" (DR-3). The quiz is something the
 * student walked INTO from an offer row (NextBestActionCard's focused-work
 * strip) — never an interrupt — so this page opens on a framing screen
 * with verbatim copy before any question is shown, and declining costs
 * nothing (Back just leaves; the offer persists for next time).
 *
 * Question card deliberately reuses PracticeAttemptPage's vocabulary: meta
 * row, marking chip, option buttons, Submit+Skip, ReceiptBorder result —
 * server-graded via the SAME deterministic scorer, so the receipt is real.
 */

import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { authFetch } from '@/lib/auth/client';
import { ArrowLeft, Compass, Loader2, SkipForward } from 'lucide-react';
import { ReceiptBorder } from '@/components/ui/ReceiptBorder';
import { receiptFromServerGrade } from '@/lib/receipt';
import { TimerPrimitive } from '@/components/app/TimerPrimitive';

interface QuizItem {
  object_id: string;
  topic: string | null;
  question_text: string | null;
  gradable: boolean;
  question_type: 'mcq' | 'msq' | 'nat' | null;
  marks: number | null;
  options: string[] | null;
  marking: { marks_correct: number; marks_wrong: number } | null;
}

interface QuizStartResponse {
  quiz_id: string;
  deadline_at: string;
  time_budget_sec: number;
  items: QuizItem[];
}

interface PerItem { object_id: string; correct: boolean; earned: number; max: number; skipped: boolean }
interface QuizResult { earned: number; max: number; correct: number; wrong: number; skipped: number; per_item: PerItem[]; late: boolean; recorded: boolean }

type Response = { skipped: true } | { selectedIndex: number } | { selectedIndices: number[] } | { value: number };

const fmt = (n: number) => {
  const r = Math.round(n * 100) / 100;
  return Number.isInteger(r) ? String(r) : r.toFixed(2);
};

type Phase = 'framing' | 'starting' | 'in-quiz' | 'submitting' | 'result' | 'error';

export default function CheckpointQuizPage() {
  const [phase, setPhase] = useState<Phase>('framing');
  const [error, setError] = useState<string | null>(null);
  const [quiz, setQuiz] = useState<QuizStartResponse | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [responses, setResponses] = useState<Record<string, Response>>({});
  const [remainingSec, setRemainingSec] = useState(0);
  const [result, setResult] = useState<QuizResult | null>(null);
  const submittingRef = useRef(false);

  useEffect(() => {
    if (phase !== 'in-quiz' || !quiz) return;
    const interval = setInterval(() => {
      setRemainingSec((prev) => {
        if (prev <= 1) {
          handleSubmit(); // expiry auto-submits what was answered
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, quiz]);

  async function handleStart() {
    setPhase('starting');
    setError(null);
    try {
      const r = await authFetch('/api/practice/quiz/start', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
      const data = await r.json().catch(() => null);
      if (!r.ok) throw new Error(data?.error ?? `HTTP ${r.status}`);
      setQuiz(data as QuizStartResponse);
      setRemainingSec((data as QuizStartResponse).time_budget_sec);
      setResponses({});
      setCurrentIdx(0);
      setPhase('in-quiz');
    } catch (err) {
      setError((err as Error).message);
      setPhase('error');
    }
  }

  async function handleSubmit() {
    if (submittingRef.current || !quiz) return;
    submittingRef.current = true;
    setPhase('submitting');
    try {
      const payload = {
        responses: quiz.items.map((it) => ({ object_id: it.object_id, ...responses[it.object_id] ?? { skipped: true } })),
      };
      const r = await authFetch(`/api/practice/quiz/${encodeURIComponent(quiz.quiz_id)}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await r.json().catch(() => null);
      if (!r.ok) throw new Error(data?.error ?? `HTTP ${r.status}`);
      setResult(data as QuizResult);
      setPhase('result');
    } catch (err) {
      setError((err as Error).message);
      setPhase('error');
    } finally {
      submittingRef.current = false;
    }
  }

  const current = quiz?.items[currentIdx] ?? null;
  const currentResponse = current ? responses[current.object_id] : undefined;

  function setResponse(r: Response) {
    if (!current) return;
    setResponses((prev) => ({ ...prev, [current.object_id]: r }));
  }

  function goNext() {
    if (!quiz) return;
    if (currentIdx < quiz.items.length - 1) setCurrentIdx(currentIdx + 1);
    else handleSubmit();
  }

  const canAdvance = current && currentResponse !== undefined;

  // ── Framing screen (DR-3 verbatim copy) ─────────────────────────
  if (phase === 'framing' || phase === 'starting' || phase === 'error') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <Link to="/planned" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 'var(--text-caption)', color: 'var(--text-tertiary)', textDecoration: 'none' }}>
          <ArrowLeft size={13} /> Back to your plan
        </Link>

        <div>
          <h1 style={{ margin: 0, fontSize: 'var(--text-title2)', fontWeight: 'var(--weight-bold)', color: 'var(--text-primary)', letterSpacing: '-0.018em' }}>
            Checkpoint
          </h1>
        </div>

        <div style={{ padding: '20px 16px', borderRadius: 'var(--radius-lg)', background: 'var(--surface-card)', boxShadow: 'var(--shadow-card)', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <p style={{ margin: 0, fontSize: 17, color: 'var(--text-primary)', lineHeight: 'var(--leading-relaxed)' }}>
            6 questions · about 8 minutes · GATE is timed — this is practice for the clock.
          </p>
          <p style={{ margin: 0, fontSize: 15, color: 'var(--text-secondary)' }}>
            Running over won't lose you marks.
          </p>
        </div>

        {error && (
          <p style={{ margin: 0, fontSize: 'var(--text-caption)', color: 'var(--red)' }}>{error}</p>
        )}

        <button
          onClick={handleStart}
          disabled={phase === 'starting'}
          style={{
            padding: '12px 0', borderRadius: 'var(--radius-sm)', background: 'var(--green)', color: '#fff',
            border: 'none', fontFamily: 'var(--font-sans)', fontWeight: 'var(--weight-semibold)', fontSize: 17,
            cursor: phase === 'starting' ? 'wait' : 'pointer',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
        >
          {phase === 'starting' && <Loader2 size={16} className="animate-spin" />}
          Start checkpoint
        </button>
      </div>
    );
  }

  // ── Submitting ──────────────────────────────────────────────
  if (phase === 'submitting') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', gap: 12 }}>
        <Loader2 size={28} style={{ color: 'var(--green-ink)', animation: 'spin 1s linear infinite' }} />
        <p style={{ margin: 0, fontSize: 15, color: 'var(--text-secondary)' }}>Grading your checkpoint…</p>
      </div>
    );
  }

  // ── Result ──────────────────────────────────────────────
  if (phase === 'result' && result) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <h1 style={{ margin: 0, fontSize: 'var(--text-title2)', fontWeight: 'var(--weight-bold)', color: 'var(--text-primary)' }}>Checkpoint result</h1>
        <div style={{ padding: '20px 16px', borderRadius: 'var(--radius-lg)', background: 'var(--surface-card)', boxShadow: 'var(--shadow-card)' }}>
          <ReceiptBorder receipt={receiptFromServerGrade({ max: result.max })}>
            <p style={{ margin: 0, fontSize: 28, fontWeight: 'var(--weight-bold)', color: 'var(--green-ink)', fontVariantNumeric: 'tabular-nums' }}>
              {fmt(result.earned)} / {fmt(result.max)} marks
            </p>
            <p style={{ margin: '4px 0 0', fontSize: 15, color: 'var(--text-secondary)' }}>
              {result.correct} correct · {result.wrong} incorrect · {result.skipped} skipped
            </p>
          </ReceiptBorder>
          {result.late && (
            <p style={{ margin: '8px 0 0', fontSize: 'var(--text-caption)', color: 'var(--orange-ink)' }}>
              Time's up — what you answered is graded.
            </p>
          )}
          {!result.recorded && (
            <p style={{ margin: '8px 0 0', fontSize: 'var(--text-caption)', color: 'var(--orange-ink)' }}>
              Graded, but not recorded to your model (server storage unavailable).
            </p>
          )}
        </div>
        <Link to="/planned" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--green-ink)', textDecoration: 'none', fontSize: 15 }}>
          <Compass size={14} /> What's next for me?
        </Link>
      </div>
    );
  }

  // ── In-quiz ──────────────────────────────────────────────
  if (!quiz || !current) return null;

  const isPicked = (i: number) => {
    if (!currentResponse || 'skipped' in currentResponse) return false;
    if ('selectedIndex' in currentResponse) return currentResponse.selectedIndex === i;
    if ('selectedIndices' in currentResponse) return currentResponse.selectedIndices.includes(i);
    return false;
  };

  function toggleIndex(i: number) {
    if (!current) return;
    if (current.question_type === 'mcq') {
      setResponse({ selectedIndex: i });
    } else {
      const existing = currentResponse && 'selectedIndices' in currentResponse ? currentResponse.selectedIndices : [];
      const next = existing.includes(i) ? existing.filter((x) => x !== i) : [...existing, i];
      setResponse({ selectedIndices: next });
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 'var(--text-caption)', color: 'var(--text-tertiary)' }}>
          {currentIdx + 1} of {quiz.items.length}
        </span>
        <TimerPrimitive totalSeconds={quiz.time_budget_sec} remainingSeconds={remainingSec} register="light" />
      </div>

      <motion.div
        key={current.object_id}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18 }}
        style={{ borderRadius: 'var(--radius-md)', background: 'var(--surface-card)', boxShadow: 'var(--shadow-raise)', padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 'var(--text-caption2)', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-tertiary)' }}>
            {current.topic ?? ''}
            {current.question_type && <span style={{ textTransform: 'none' }}>· {current.question_type.toUpperCase()}</span>}
          </div>
          {current.marking && (
            <span style={{ fontSize: 'var(--text-caption2)', fontFamily: 'var(--font-mono)', padding: '2px 8px', borderRadius: 'var(--radius-xs)', background: 'var(--surface-fill)', border: 'var(--hairline) solid var(--separator)', color: 'var(--text-secondary)' }}>
              correct +{fmt(current.marking.marks_correct)} · wrong {current.marking.marks_wrong === 0 ? '0' : fmt(current.marking.marks_wrong)}
            </span>
          )}
        </div>

        <p style={{ margin: 0, fontSize: 17, color: 'var(--text-primary)', lineHeight: 'var(--leading-relaxed)', whiteSpace: 'pre-wrap' }}>
          {current.question_text ?? 'This item has no question text.'}
        </p>

        {current.options && (
          <div
            style={{ display: 'flex', flexDirection: 'column', gap: 6 }}
            role={current.question_type === 'mcq' ? 'radiogroup' : 'group'}
            aria-label={current.question_text ?? undefined}
            onKeyDown={(e) => {
              if (!current.options) return;
              const focusable = Array.from((e.currentTarget as HTMLElement).querySelectorAll<HTMLButtonElement>('button'));
              const idx = focusable.findIndex((el) => el === document.activeElement);
              if ((e.key === 'ArrowDown' || e.key === 'ArrowRight') && idx >= 0) {
                e.preventDefault();
                focusable[(idx + 1) % focusable.length]?.focus();
              } else if ((e.key === 'ArrowUp' || e.key === 'ArrowLeft') && idx >= 0) {
                e.preventDefault();
                focusable[(idx - 1 + focusable.length) % focusable.length]?.focus();
              }
            }}
          >
            {current.options.map((opt, i) => (
              <button
                key={i}
                onClick={() => toggleIndex(i)}
                role={current.question_type === 'mcq' ? 'radio' : 'checkbox'}
                aria-checked={isPicked(i)}
                style={{
                  width: '100%', minHeight: 44, textAlign: 'left', padding: '10px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: `1px solid ${isPicked(i) ? 'var(--green)' : 'var(--separator)'}`,
                  background: isPicked(i) ? 'var(--green-tint, rgba(52,199,89,.08))' : 'var(--surface-fill)',
                  color: isPicked(i) ? 'var(--text-primary)' : 'var(--text-secondary)',
                  fontSize: 15, fontFamily: 'var(--font-sans)', cursor: 'pointer',
                  fontWeight: isPicked(i) ? 'var(--weight-medium)' : undefined,
                }}
              >
                <span style={{ fontFamily: 'var(--font-mono)', marginRight: 8, fontWeight: 'var(--weight-bold)' }}>{String.fromCharCode(65 + i)}.</span>
                {opt}
              </button>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={goNext}
            disabled={!canAdvance}
            style={{
              flex: 1, padding: '10px 0', borderRadius: 'var(--radius-sm)',
              background: canAdvance ? 'var(--green)' : 'var(--surface-fill)',
              color: canAdvance ? '#fff' : 'var(--text-tertiary)', border: 'none',
              fontFamily: 'var(--font-sans)', fontWeight: 'var(--weight-semibold)', fontSize: 15,
              cursor: canAdvance ? 'pointer' : 'not-allowed',
            }}
          >
            {currentIdx < quiz.items.length - 1 ? 'Submit & next' : 'Finish'}
          </button>
          <button
            onClick={() => { setResponse({ skipped: true }); goNext(); }}
            style={{
              padding: '10px 16px', borderRadius: 'var(--radius-sm)', background: 'var(--surface-fill)',
              border: 'var(--hairline) solid var(--separator)', color: 'var(--text-secondary)', fontSize: 15,
              fontFamily: 'var(--font-sans)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6,
            }}
          >
            <SkipForward size={13} /> Skip
          </button>
        </div>
      </motion.div>
    </div>
  );
}
