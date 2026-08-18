/**
 * MockExamPage — full-length timed mock exam with GBrain calibration.
 *
 * Flow: Start → Review → Answer each question with timer → Submit → Post-analysis
 *
 * T22 (ENG-D3): this page used to receive every question's `correct_answer`
 * up front and grade itself client-side, self-reporting `isCorrect` back to
 * the server. Both are gone: `GET /api/gbrain/mock-exam/:sessionId` now
 * returns a render-safe question list (options only, no answer key — same
 * index-based options shape PracticeAttemptPage uses), and submission goes
 * through `POST /api/gbrain/mock-exam/:exam_id/submit`, which grades
 * server-side via the same deterministic scorer the practice path uses.
 * The timer chip is now the shared TimerPrimitive under its EXAM register
 * (full exam chrome preserved — red past the last 10 minutes, same as
 * before — this is the "MockExamPage's binary-red timer flip migrates to
 * the shared primitive under its exam register" item from T22/DR-3).
 */

import { useState, useEffect, useRef } from 'react';
import { authFetch } from '@/lib/auth/client';
import { useSession } from '@/hooks/useSession';
import { trackEvent } from '@/lib/analytics';
import { Flag, Loader2, Play } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { TimerPrimitive } from '@/components/app/TimerPrimitive';

interface Question {
  id: string;
  question_text: string | null;
  /** Index-ordered options (render-safe — no answer key). null = not gradable / free-text display only. */
  options: string[] | null;
  gradable: boolean;
  question_type: 'mcq' | 'msq' | 'nat' | null;
  topic: string;
  difficulty: string | number | null;
  marks: number | null;
  source?: string;
}

interface MockExam {
  exam_id: string;
  exam_name: string;
  time_limit_minutes: number;
  total_questions: number;
  marks_scheme: { correct: number; wrong: number };
  questions: Question[];
  section_breakdown: Record<string, number>;
}

interface SubmitResult {
  exam_id: string;
  total: number;
  correct: number;
  wrong: number;
  skipped: number;
  ungraded: number;
  marks: number;
  max_marks: number;
  accuracy: number;
  by_topic: Record<string, { correct: number; attempted: number; marks: number }>;
  late: boolean;
  recorded: boolean;
}

type Phase = 'ready' | 'in-progress' | 'submitting' | 'results';

export default function MockExamPage() {
  const sessionId = useSession();
  const [exam, setExam] = useState<MockExam | null>(null);
  const [phase, setPhase] = useState<Phase>('ready');
  const [loading, setLoading] = useState(false);
  const [currentQ, setCurrentQ] = useState(0);
  // Per-question response: mcq/msq → selected option index; nat → the raw string typed.
  const [answers, setAnswers] = useState<Record<string, number | string | null>>({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [results, setResults] = useState<SubmitResult | null>(null);
  const startedAt = useRef(0);
  const submittingRef = useRef(false);

  useEffect(() => {
    trackEvent('page_view', { page: 'mock-exam' });
  }, []);

  useEffect(() => {
    if (phase !== 'in-progress') return;
    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) { handleSubmit(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const handleStart = async () => {
    setLoading(true);
    try {
      const r = await authFetch(`/api/gbrain/mock-exam/${sessionId}`);
      const data = await r.json().catch(() => null);
      if (!r.ok) throw new Error(data?.error ?? `HTTP ${r.status}`);
      setExam(data as MockExam);
      setTimeRemaining(data.time_limit_minutes * 60);
      setAnswers({});
      setCurrentQ(0);
      setPhase('in-progress');
      startedAt.current = Date.now();
      trackEvent('mock_exam_start', { exam_id: data.exam_id, total_questions: data.total_questions });
    } catch (err) {
      alert('Could not start exam: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (qId: string, value: number | string | null) => {
    setAnswers(prev => ({ ...prev, [qId]: value }));
  };

  const handleSubmit = async () => {
    if (!exam || submittingRef.current) return;
    submittingRef.current = true;
    setPhase('submitting');
    trackEvent('mock_exam_submit', { exam_id: exam.exam_id, elapsed: Date.now() - startedAt.current });

    const responses = exam.questions
      .filter(q => q.gradable)
      .map(q => {
        const a = answers[q.id];
        if (a === undefined || a === null || a === '') return { id: q.id }; // skipped
        if (q.question_type === 'nat') {
          const num = Number(a);
          return Number.isFinite(num) ? { id: q.id, value: num } : { id: q.id };
        }
        return typeof a === 'number' ? { id: q.id, selectedIndex: a } : { id: q.id };
      });

    try {
      const r = await authFetch(`/api/gbrain/mock-exam/${exam.exam_id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, responses }),
      });
      const data = await r.json().catch(() => null);
      if (!r.ok) throw new Error(data?.error ?? `HTTP ${r.status}`);
      setResults(data as SubmitResult);
    } catch (err) {
      alert('Could not submit exam: ' + (err as Error).message);
    } finally {
      submittingRef.current = false;
      setPhase('results');
    }
  };

  // ── Ready screen ──────────────────────────────────────────────
  if (phase === 'ready') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 'var(--text-title2)', fontWeight: 'var(--weight-bold)', color: 'var(--text-primary)', letterSpacing: '-0.018em' }}>
            Mock Exam
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 'var(--text-caption)', color: 'var(--text-secondary)' }}>
            Full-length, GBrain-calibrated to your mastery
          </p>
        </div>

        {/* Info card */}
        <div style={{
          padding: '20px 16px',
          borderRadius: 'var(--radius-lg)',
          background: 'var(--surface-card)',
          boxShadow: 'var(--shadow-card)',
          textAlign: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 32, paddingBottom: 16, marginBottom: 16, borderBottom: 'var(--hairline) solid var(--separator)' }}>
            <div>
              <p style={{ margin: 0, fontSize: 28, fontWeight: 'var(--weight-bold)', color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>180</p>
              <p style={{ margin: '2px 0 0', fontSize: 'var(--text-caption)', color: 'var(--text-tertiary)' }}>minutes</p>
            </div>
            <div style={{ width: 1, height: 36, background: 'var(--separator)' }} />
            <div>
              <p style={{ margin: 0, fontSize: 28, fontWeight: 'var(--weight-bold)', color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>65</p>
              <p style={{ margin: '2px 0 0', fontSize: 'var(--text-caption)', color: 'var(--text-tertiary)' }}>questions</p>
            </div>
          </div>
          <p style={{ margin: 0, fontSize: 'var(--text-footnote)', color: 'var(--text-secondary)', lineHeight: 'var(--leading-normal)' }}>
            Syllabus-weighted, mastery-calibrated. Difficulty biased to your Zone of Proximal Development.
          </p>
        </div>

        {/* Rules */}
        <div style={{
          padding: '14px 16px',
          borderRadius: 'var(--radius-md)',
          background: 'var(--surface-fill)',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}>
          <p style={{ margin: 0, fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-semibold)', color: 'var(--text-secondary)' }}>Rules</p>
          {[
            'Marks scheme matches your exam',
            'Timer starts when you click Start — runs continuously',
            'You can skip questions and return',
            'Results update your GBrain student model',
          ].map((rule, i) => (
            <p key={i} style={{ margin: 0, fontSize: 'var(--text-footnote)', color: 'var(--text-secondary)' }}>· {rule}</p>
          ))}
        </div>

        <Button size="lg" tone="mastery" onClick={handleStart} disabled={loading} style={{ width: '100%' }}>
          {loading ? <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Preparing your exam…</> : <><Play size={18} /> Start Mock Exam</>}
        </Button>
      </div>
    );
  }

  // ── In progress ──────────────────────────────────────────────
  if (phase === 'in-progress' && exam) {
    const q = exam.questions[currentQ];
    const answered = Object.values(answers).filter(v => v !== null && v !== undefined && v !== '').length;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Timer + Progress */}
        <div style={{
          position: 'sticky',
          top: 52,
          zIndex: 30,
          margin: '0 -16px',
          padding: '10px 16px',
          background: 'var(--material-thick)',
          backdropFilter: 'var(--blur-nav)',
          borderBottom: 'var(--hairline) solid var(--separator)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <TimerPrimitive
            totalSeconds={exam.time_limit_minutes * 60}
            remainingSeconds={timeRemaining}
            register="exam"
            lowThresholdSeconds={600}
          />
          <span style={{ fontSize: 'var(--text-caption)', color: 'var(--text-tertiary)' }}>
            {currentQ + 1} / {exam.questions.length} · {answered} answered
          </span>
        </div>

        {/* Question card */}
        <div style={{
          padding: '16px',
          borderRadius: 'var(--radius-lg)',
          background: 'var(--surface-card)',
          boxShadow: 'var(--shadow-card)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 'var(--text-caption2)', fontFamily: 'var(--font-mono)', color: 'var(--indigo-ink)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {q.topic}
            </span>
            <span style={{ fontSize: 'var(--text-caption2)', color: 'var(--text-tertiary)' }}>
              {q.source === 'generated' ? 'GBrain' : 'PYQ'} · {q.marks ?? 2}m
            </span>
          </div>
          <p style={{ margin: '0 0 16px', fontSize: 'var(--text-body)', color: 'var(--text-primary)', lineHeight: 'var(--leading-normal)', whiteSpace: 'pre-wrap' }}>
            {q.question_text}
          </p>

          {!q.gradable && (
            <p style={{ margin: '0 0 12px', fontSize: 'var(--text-caption)', color: 'var(--orange-ink)' }}>
              This item isn't deterministically gradable — it won't count toward your marks.
            </p>
          )}

          {q.options && q.options.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }} role="radiogroup">
              {q.options.map((opt, i) => {
                const isSelected = answers[q.id] === i;
                return (
                  <button
                    key={i}
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => handleAnswer(q.id, isSelected ? null : i)}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '12px',
                      borderRadius: 'var(--radius-sm)',
                      border: isSelected ? '1px solid var(--indigo)' : 'var(--hairline) solid var(--separator)',
                      background: isSelected ? 'rgba(88,86,214,.08)' : 'var(--surface-fill)',
                      color: isSelected ? 'var(--indigo-ink)' : 'var(--text-secondary)',
                      fontSize: 'var(--text-footnote)',
                      cursor: 'pointer',
                      fontFamily: 'var(--font-sans)',
                      transition: 'border-color var(--dur-fast) var(--ease-standard)',
                    }}
                  >
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 'var(--weight-bold)', marginRight: 8 }}>{String.fromCharCode(65 + i)}.</span>
                    {opt}
                  </button>
                );
              })}
            </div>
          ) : (
            <input
              type="text"
              value={typeof answers[q.id] === 'string' ? (answers[q.id] as string) : ''}
              onChange={e => handleAnswer(q.id, e.target.value || null)}
              placeholder="Enter your answer…"
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--surface-fill)',
                border: 'var(--hairline) solid var(--separator)',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--text-footnote)',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          )}
        </div>

        {/* Navigation */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setCurrentQ(Math.max(0, currentQ - 1))}
            disabled={currentQ === 0}
            style={{
              flex: 1,
              padding: '10px 0',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--surface-fill)',
              border: 'var(--hairline) solid var(--separator)',
              fontSize: 'var(--text-footnote)',
              color: 'var(--text-secondary)',
              cursor: currentQ === 0 ? 'not-allowed' : 'pointer',
              opacity: currentQ === 0 ? 0.4 : 1,
              fontFamily: 'var(--font-sans)',
            }}
          >
            ← Previous
          </button>
          {currentQ < exam.questions.length - 1 ? (
            <button
              onClick={() => setCurrentQ(currentQ + 1)}
              style={{
                flex: 1,
                padding: '10px 0',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--indigo)',
                border: 'none',
                color: 'var(--text-on-accent)',
                fontSize: 'var(--text-footnote)',
                fontWeight: 'var(--weight-semibold)',
                cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
              }}
            >
              Next →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              style={{
                flex: 1,
                padding: '10px 0',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--green)',
                border: 'none',
                color: 'var(--text-on-accent)',
                fontSize: 'var(--text-footnote)',
                fontWeight: 'var(--weight-semibold)',
                cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <Flag size={13} /> Submit Exam
            </button>
          )}
        </div>

        {/* Question grid */}
        <div style={{ padding: '12px', borderRadius: 'var(--radius-md)', background: 'var(--surface-fill)' }}>
          <p style={{ margin: '0 0 8px', fontSize: 'var(--text-caption2)', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Jump to</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 4 }}>
            {exam.questions.map((qq, i) => {
              const isAnswered = answers[qq.id] !== null && answers[qq.id] !== undefined && answers[qq.id] !== '';
              return (
                <button
                  key={qq.id}
                  onClick={() => setCurrentQ(i)}
                  style={{
                    height: 28,
                    borderRadius: 6,
                    border: 'none',
                    fontSize: 10,
                    fontWeight: 'var(--weight-bold)',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-mono)',
                    background: i === currentQ
                      ? 'var(--indigo)'
                      : isAnswered
                      ? 'rgba(52,199,89,.15)'
                      : 'var(--surface-card)',
                    color: i === currentQ
                      ? '#fff'
                      : isAnswered
                      ? 'var(--green-ink)'
                      : 'var(--text-tertiary)',
                  }}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ── Submitting ──────────────────────────────────────────────
  if (phase === 'submitting') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', gap: 12 }}>
        <Loader2 size={32} style={{ color: 'var(--indigo)', animation: 'spin 1s linear infinite' }} />
        <p style={{ margin: 0, fontSize: 'var(--text-footnote)', color: 'var(--text-secondary)' }}>
          Grading your exam and updating GBrain…
        </p>
      </div>
    );
  }

  // ── Results ──────────────────────────────────────────────
  if (phase === 'results' && results) {
    const pct = results.max_marks > 0 ? Math.round((results.marks / results.max_marks) * 100) : 0;
    const scoreColor = pct >= 50 ? 'var(--green-ink)' : pct >= 25 ? 'var(--orange)' : 'var(--red)';
    const scoreBg = pct >= 50 ? 'rgba(52,199,89,.1)' : pct >= 25 ? 'rgba(255,159,10,.1)' : 'rgba(255,59,48,.1)';

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Score */}
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <div style={{
            width: 96,
            height: 96,
            borderRadius: '50%',
            background: scoreBg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px',
          }}>
            <span style={{ fontSize: 32, fontWeight: 'var(--weight-bold)', color: scoreColor, fontVariantNumeric: 'tabular-nums' }}>
              {results.marks}
            </span>
          </div>
          <p style={{ margin: 0, fontSize: 'var(--text-footnote)', color: 'var(--text-secondary)' }}>
            out of {results.max_marks} marks · {pct}%
          </p>
          {results.late && (
            <p style={{ margin: '6px 0 0', fontSize: 'var(--text-caption)', color: 'var(--orange-ink)' }}>
              Time's up — what you answered is graded.
            </p>
          )}
          {results.ungraded > 0 && (
            <p style={{ margin: '6px 0 0', fontSize: 'var(--text-caption)', color: 'var(--text-tertiary)' }}>
              {results.ungraded} question{results.ungraded === 1 ? '' : 's'} couldn't be graded and {results.ungraded === 1 ? "wasn't" : "weren't"} counted.
            </p>
          )}
          {!results.recorded && (
            <p style={{ margin: '6px 0 0', fontSize: 'var(--text-caption)', color: 'var(--orange-ink)' }}>
              Graded, but not recorded (server storage unavailable).
            </p>
          )}
        </div>

        {/* Stats grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {[
            { label: 'correct', value: results.correct, color: 'var(--green-ink)', bg: 'rgba(52,199,89,.08)' },
            { label: 'wrong', value: results.wrong, color: 'var(--red)', bg: 'rgba(255,59,48,.08)' },
            { label: 'skipped', value: results.skipped, color: 'var(--text-tertiary)', bg: 'var(--surface-fill)' },
          ].map(({ label, value, color, bg }) => (
            <div key={label} style={{ padding: '12px 8px', borderRadius: 'var(--radius-md)', background: bg, textAlign: 'center' }}>
              <p style={{ margin: 0, fontSize: 20, fontWeight: 'var(--weight-bold)', color, fontVariantNumeric: 'tabular-nums' }}>{value}</p>
              <p style={{ margin: '2px 0 0', fontSize: 'var(--text-caption2)', color: 'var(--text-tertiary)' }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Topic breakdown */}
        <div style={{ padding: '14px 16px', borderRadius: 'var(--radius-md)', background: 'var(--surface-card)', boxShadow: 'var(--shadow-raise)' }}>
          <p style={{ margin: '0 0 10px', fontSize: 'var(--text-caption)', color: 'var(--text-tertiary)', fontWeight: 'var(--weight-semibold)' }}>
            Topic breakdown
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {Object.entries(results.by_topic).map(([topic, s]) => (
              <div key={topic} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 'var(--text-footnote)', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                  {topic.replace(/-/g, ' ')}
                </span>
                <span style={{
                  fontSize: 'var(--text-caption)',
                  fontFamily: 'var(--font-mono)',
                  color: s.marks > 0 ? 'var(--green-ink)' : s.marks < 0 ? 'var(--red)' : 'var(--text-tertiary)',
                }}>
                  {s.correct}/{s.attempted} ({s.marks > 0 ? '+' : ''}{s.marks}m)
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* GBrain insight */}
        <div style={{
          padding: '14px 16px',
          borderRadius: 'var(--radius-md)',
          background: 'rgba(88,86,214,.06)',
          border: '1px solid rgba(88,86,214,.2)',
        }}>
          <p style={{ margin: '0 0 4px', fontSize: 'var(--text-footnote)', fontWeight: 'var(--weight-semibold)', color: 'var(--indigo-ink)' }}>
            What GBrain learned
          </p>
          <p style={{ margin: 0, fontSize: 'var(--text-footnote)', color: 'var(--text-secondary)', lineHeight: 'var(--leading-normal)' }}>
            {results.correct + results.wrong} attempts recorded. Your mastery vector, speed profile,
            and error patterns have been updated. Check /error-patterns and /exam-strategy for
            refreshed recommendations.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <Button size="md" tone="mastery" onClick={() => window.location.reload()} style={{ flex: 1 }}>
            Take Another Mock
          </Button>
          <Button size="md" tone="neutral" onClick={() => window.location.href = '/error-patterns'} style={{ flex: 1 }}>
            View Errors
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
