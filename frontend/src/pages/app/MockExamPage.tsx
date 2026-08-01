/**
 * MockExamPage — full-length timed mock exam with GBrain calibration.
 *
 * Flow: Start → Review → Answer each question with timer → Submit → Post-analysis
 */

import { useState, useEffect, useRef } from 'react';
import { apiFetch } from '@/hooks/useApi';
import { useSession } from '@/hooks/useSession';
import { trackEvent } from '@/lib/analytics';
import { Clock, Flag, Loader2, Play } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface Question {
  id: string;
  question_text: string;
  options?: Record<string, string> | string;
  correct_answer: string;
  topic: string;
  difficulty: string | number;
  marks: number;
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

type Phase = 'ready' | 'in-progress' | 'submitting' | 'results';

export default function MockExamPage() {
  const sessionId = useSession();
  const [exam, setExam] = useState<MockExam | null>(null);
  const [phase, setPhase] = useState<Phase>('ready');
  const [loading, setLoading] = useState(false);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | null>>({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [results, setResults] = useState<any>(null);
  const startedAt = useRef(0);

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
  }, [phase]);

  const handleStart = async () => {
    setLoading(true);
    try {
      const data = await apiFetch<MockExam>(`/api/gbrain/mock-exam/${sessionId}`);
      setExam(data);
      setTimeRemaining(data.time_limit_minutes * 60);
      setPhase('in-progress');
      startedAt.current = Date.now();
      trackEvent('mock_exam_start', { exam_id: data.exam_id, total_questions: data.total_questions });
    } catch (err) {
      alert('Could not start exam: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (qId: string, answer: string | null) => {
    setAnswers(prev => ({ ...prev, [qId]: answer }));
  };

  const handleSubmit = async () => {
    if (!exam) return;
    setPhase('submitting');
    trackEvent('mock_exam_submit', { exam_id: exam.exam_id, elapsed: Date.now() - startedAt.current });

    const scheme = exam.marks_scheme;
    let correct = 0, wrong = 0, skipped = 0, marks = 0;
    const byTopic: Record<string, { correct: number; attempted: number; marks: number }> = {};

    for (const q of exam.questions) {
      const studentAnswer = answers[q.id];
      byTopic[q.topic] = byTopic[q.topic] || { correct: 0, attempted: 0, marks: 0 };

      if (!studentAnswer) {
        skipped++;
        continue;
      }
      byTopic[q.topic].attempted++;

      const isCorrect = studentAnswer === q.correct_answer;
      if (isCorrect) {
        correct++;
        marks += scheme.correct;
        byTopic[q.topic].correct++;
        byTopic[q.topic].marks += scheme.correct;
      } else {
        wrong++;
        marks += scheme.wrong;
        byTopic[q.topic].marks += scheme.wrong;
      }

      apiFetch('/api/gbrain/attempt', {
        method: 'POST',
        body: JSON.stringify({
          sessionId,
          problem: q.question_text,
          studentAnswer,
          correctAnswer: q.correct_answer,
          conceptId: q.topic,
          isCorrect,
          difficulty: typeof q.difficulty === 'number' ? q.difficulty : 0.5,
          problemId: q.id,
        }),
      }).catch(() => {});
    }

    setResults({
      exam_id: exam.exam_id,
      total: exam.questions.length,
      correct, wrong, skipped,
      marks,
      max_marks: exam.questions.length * scheme.correct,
      accuracy: correct + wrong > 0 ? Math.round((correct / (correct + wrong)) * 100) : 0,
      time_taken_sec: Math.round((Date.now() - startedAt.current) / 1000),
      by_topic: byTopic,
    });

    setPhase('results');
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
    const answered = Object.values(answers).filter(Boolean).length;
    const mins = Math.floor(timeRemaining / 60);
    const secs = timeRemaining % 60;
    const options = typeof q.options === 'string' ? JSON.parse(q.options || '{}') : (q.options || {});
    const isLowTime = timeRemaining < 600;

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
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 10px',
            borderRadius: 'var(--radius-xs)',
            background: isLowTime ? 'rgba(255,59,48,.1)' : 'var(--surface-fill)',
            fontFamily: 'var(--font-mono)',
            fontWeight: 'var(--weight-bold)',
            fontSize: 'var(--text-footnote)',
            color: isLowTime ? 'var(--red)' : 'var(--text-primary)',
          }}>
            <Clock size={13} />
            {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
          </div>
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
              {q.source === 'generated' ? 'GBrain' : 'PYQ'} · {q.marks || 2}m
            </span>
          </div>
          <p style={{ margin: '0 0 16px', fontSize: 'var(--text-body)', color: 'var(--text-primary)', lineHeight: 'var(--leading-normal)', whiteSpace: 'pre-wrap' }}>
            {q.question_text}
          </p>

          {Object.keys(options).length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {Object.entries(options).map(([key, value]) => {
                const isSelected = answers[q.id] === key;
                return (
                  <button
                    key={key}
                    onClick={() => handleAnswer(q.id, isSelected ? null : key)}
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
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 'var(--weight-bold)', marginRight: 8 }}>{key}.</span>
                    {value as string}
                  </button>
                );
              })}
            </div>
          ) : (
            <input
              type="text"
              value={answers[q.id] || ''}
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
                color: '#fff',
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
                color: '#fff',
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
            {exam.questions.map((qq, i) => (
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
                    : answers[qq.id]
                    ? 'rgba(52,199,89,.15)'
                    : 'var(--surface-card)',
                  color: i === currentQ
                    ? '#fff'
                    : answers[qq.id]
                    ? 'var(--green-ink)'
                    : 'var(--text-tertiary)',
                }}
              >
                {i + 1}
              </button>
            ))}
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
    const pct = Math.round((results.marks / results.max_marks) * 100);
    const scoreColor = pct >= 50 ? 'var(--green-ink)' : pct >= 25 ? 'var(--orange)' : 'var(--red)';
    const scoreBg = pct >= 50 ? 'rgba(52,199,89,.1)' : pct >= 25 ? 'rgba(255,149,0,.1)' : 'rgba(255,59,48,.1)';

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
            {Object.entries(results.by_topic).map(([topic, s]: [string, any]) => (
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
