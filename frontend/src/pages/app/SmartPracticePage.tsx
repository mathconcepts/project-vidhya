/**
 * SmartPracticePage — content engine in action.
 *
 * Unlike the legacy PracticePage which fetches by problem ID, this page uses
 * the four-tier resolver so practice is delivered from the cheapest available
 * source. Shows the user exactly where each problem came from and what it cost
 * (educational + transparency).
 *
 * Flow:
 *   User picks topic + difficulty
 *   → resolve() walks tiers
 *   → Wave 11: if the resolved problem is a server-gradable item
 *     (generated_problems row with real 032/033 marking), hand off to
 *     /attempt/:id — deterministic GATE grading, student model update,
 *     answer key never in the browser.
 *   → otherwise the problem renders here with a provenance badge and the
 *     legacy SELF-CHECK flow (client string compare against a revealed
 *     answer). Self-check is labeled as such and never awards marks.
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { trackEvent } from '@/lib/analytics';
import { useSession } from '@/hooks/useSession';
import { useActiveExam } from '@/hooks/useActiveExam';
import { resolve, warmContentBundle, type ResolvedContent, type ContentSource } from '@/lib/content/resolver';
import { recordAttempt } from '@/lib/gbrain/client';
import { authFetch } from '@/lib/auth/client';
import { InteractiveSidecar } from '@/components/lesson/interactives/InteractiveSidecar';
import {
  Sparkles, Zap, Database, CheckCircle2, XCircle, Loader2, ArrowRight,
  BookOpen, Target, GraduationCap,
} from 'lucide-react';

const GATE_FALLBACK_TOPICS = [
  'linear-algebra', 'calculus', 'differential-equations', 'complex-variables',
  'probability-statistics', 'numerical-methods', 'transforms', 'discrete',
];

// The content bundle uses directory-slug topic IDs; the GATE syllabus section IDs
// differ in two cases. Normalize before passing to the client resolver.
const TOPIC_ALIAS: Record<string, string> = {
  'transforms': 'transform-theory',
  'discrete': 'discrete-mathematics',
};

const DIFFICULTY_LABELS: Array<{ label: string; value: number }> = [
  { label: 'Easy', value: 0.25 },
  { label: 'Medium', value: 0.5 },
  { label: 'Hard', value: 0.75 },
];

const SOURCE_META: Record<ContentSource, { label: string; icon: typeof Sparkles; color: string; description: string }> = {
  'tier-0-bundle-exact': { label: 'Bundled', icon: Database, color: 'var(--green-ink)', description: 'Served from pre-verified bundle — instant, free.' },
  'tier-0-explainer': { label: 'Explainer', icon: BookOpen, color: 'var(--indigo-ink)', description: 'Canonical concept explainer — pre-computed.' },
  'tier-0-client-cache': { label: 'Cached', icon: Zap, color: 'var(--green-ink)', description: 'Cached on your device from previous session.' },
  'tier-1-rag': { label: 'RAG', icon: Sparkles, color: 'var(--indigo-ink)', description: 'Semantic match over bundle.' },
  'tier-1-material': { label: 'Your Notes', icon: BookOpen, color: 'var(--orange)', description: 'Grounded in your uploaded materials.' },
  'tier-2-generated': { label: 'Generated', icon: Sparkles, color: 'var(--indigo-ink)', description: 'Generated live via Gemini Flash-Lite.' },
  'tier-3-wolfram-verified': { label: 'Wolfram-Verified', icon: CheckCircle2, color: 'var(--green-ink)', description: 'Computationally verified by Wolfram|Alpha.' },
  'miss': { label: 'No Match', icon: XCircle, color: 'var(--red)', description: 'No content available. Upload materials or pick another topic.' },
};

export default function SmartPracticePage() {
  const sessionId = useSession();
  const navigate = useNavigate();
  const { exam } = useActiveExam();

  const [searchParams] = useSearchParams();
  const initialTopic = searchParams.get('topic') || 'linear-algebra';
  const rawDiff = searchParams.get('difficulty');
  const initialDifficulty = rawDiff === 'easy' ? 0.2 : rawDiff === 'hard' ? 0.8 : rawDiff === 'medium' ? 0.5 : 0.5;
  const natOnly = searchParams.get('mode') === 'nat';

  const [examTopics, setExamTopics] = useState<string[]>(GATE_FALLBACK_TOPICS);
  const [topic, setTopic] = useState<string>(initialTopic);
  const [difficulty, setDifficulty] = useState<number>(initialDifficulty);
  const [loading, setLoading] = useState(false);
  const [resolved, setResolved] = useState<ResolvedContent | null>(null);
  const [answer, setAnswer] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [wasCorrect, setWasCorrect] = useState<boolean | null>(null);
  const [startedAt, setStartedAt] = useState<number>(0);
  const [sessionStats, setSessionStats] = useState({ problems_served: 0, total_cost_usd: 0, avg_latency_ms: 0 });

  useEffect(() => {
    trackEvent('page_view', { page: 'smart-practice' });
    warmContentBundle();
  }, []);

  useEffect(() => {
    fetch('/api/topics')
      .then(r => r.ok ? r.json() : null)
      .then((data: any) => {
        if (data?.topics?.length > 0) {
          const ids = data.topics.map((t: any) => t.id as string);
          setExamTopics(ids);
          setTopic(prev => ids.includes(prev) ? prev : ids[0]);
        }
      })
      .catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const nextProblem = useCallback(async () => {
    setLoading(true);
    setSubmitted(false);
    setWasCorrect(null);
    setAnswer('');
    try {
      const resolvedTopic = TOPIC_ALIAS[topic] ?? topic;
      const result = await resolve({
        intent: 'practice',
        concept_id: resolvedTopic,
        topic: resolvedTopic,
        difficulty,
        require_wolfram: false,
        use_materials: true,
      });
      if (result.problem?.id) {
        try {
          const r = await authFetch(`/api/practice/item/${encodeURIComponent(result.problem.id)}`);
          if (r.ok) {
            const item = await r.json();
            if (item?.gradable && (!natOnly || item.question_type === 'nat')) {
              navigate(`/attempt/${encodeURIComponent(result.problem.id)}`);
              return;
            }
          }
        } catch {}
      }
      setResolved(result);
      setStartedAt(Date.now());
      setSessionStats(s => ({
        problems_served: s.problems_served + 1,
        total_cost_usd: s.total_cost_usd + result.cost_estimate_usd,
        avg_latency_ms: Math.round((s.avg_latency_ms * s.problems_served + result.latency_ms) / (s.problems_served + 1)),
      }));
      trackEvent('content_resolved', { source: result.source, cost: result.cost_estimate_usd });
    } catch (err) {
      setResolved({ source: 'miss', confidence: 0, latency_ms: 0, cost_estimate_usd: 0 });
    } finally {
      setLoading(false);
    }
  }, [topic, difficulty]);

  const handleSubmit = async () => {
    if (!resolved?.problem) return;
    const timeTakenMs = Date.now() - startedAt;
    const correct = resolved.problem.correct_answer &&
      answer.trim().toLowerCase() === String(resolved.problem.correct_answer).trim().toLowerCase();
    setWasCorrect(!!correct);
    setSubmitted(true);
    try {
      await recordAttempt({
        sessionId,
        problem: resolved.problem.question_text,
        studentAnswer: answer.trim(),
        correctAnswer: String(resolved.problem.correct_answer),
        conceptId: resolved.problem.concept_id || '',
        isCorrect: !!correct,
        difficulty,
        timeTakenMs,
        problemId: resolved.problem.id,
      });
    } catch {}
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div>
        {exam?.name && (
          <p style={{ margin: '0 0 4px', fontSize: 'var(--text-caption)', color: 'var(--indigo-ink)', fontWeight: 'var(--weight-semibold)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {exam.name}
          </p>
        )}
        <h1 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8, fontSize: 'var(--text-title3)', fontWeight: 'var(--weight-bold)', color: 'var(--text-primary)', letterSpacing: '-0.015em' }}>
          <Sparkles size={18} style={{ color: 'var(--indigo-ink)', flexShrink: 0 }} />
          Smart Practice
        </h1>
        <p style={{ margin: '4px 0 0', fontSize: 'var(--text-caption)', color: 'var(--text-tertiary)' }}>
          Pick a topic and difficulty — the right problem comes to you.
        </p>
      </div>

      {natOnly && (
        <div style={{ padding: '10px 14px', borderRadius: 'var(--radius-sm)', background: 'rgba(88,86,214,.06)', border: '1px solid rgba(88,86,214,.18)', fontSize: 'var(--text-caption)', color: 'var(--indigo-ink)' }}>
          <strong>NAT-only mode</strong> — only numerical answer type questions will be served. Good for practising exact calculation.
        </div>
      )}

      {/* Controls */}
      <div style={{ padding: 14, borderRadius: 'var(--radius-md)', background: 'var(--surface-card)', boxShadow: 'var(--shadow-raise)', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div>
          <label style={{ display: 'block', fontSize: 'var(--text-caption2)', fontWeight: 'var(--weight-semibold)', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-tertiary)', marginBottom: 8 }}>
            Topic
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {examTopics.map(t => (
              <button
                key={t}
                onClick={() => setTopic(t)}
                style={{
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 'var(--text-caption)',
                  fontFamily: 'var(--font-sans)',
                  cursor: 'pointer',
                  border: topic === t ? 'none' : 'var(--hairline) solid var(--separator)',
                  background: topic === t ? 'var(--indigo)' : 'var(--surface-fill)',
                  color: topic === t ? '#fff' : 'var(--text-secondary)',
                  fontWeight: topic === t ? 'var(--weight-semibold)' : undefined,
                }}
              >
                {t.replace(/-/g, ' ')}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 'var(--text-caption2)', fontWeight: 'var(--weight-semibold)', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-tertiary)', marginBottom: 8 }}>
            Difficulty
          </label>
          <div style={{ display: 'flex', gap: 6 }}>
            {DIFFICULTY_LABELS.map(d => (
              <button
                key={d.value}
                onClick={() => setDifficulty(d.value)}
                style={{
                  flex: 1,
                  padding: '6px 0',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 'var(--text-caption)',
                  fontFamily: 'var(--font-sans)',
                  cursor: 'pointer',
                  border: 'none',
                  background: difficulty === d.value ? 'var(--indigo)' : 'var(--surface-fill)',
                  color: difficulty === d.value ? '#fff' : 'var(--text-secondary)',
                  fontWeight: difficulty === d.value ? 'var(--weight-semibold)' : undefined,
                }}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={nextProblem}
          disabled={loading}
          style={{
            width: '100%',
            padding: '10px 0',
            borderRadius: 'var(--radius-sm)',
            background: loading ? 'var(--surface-fill)' : 'var(--green)',
            color: loading ? 'var(--text-tertiary)' : '#fff',
            border: 'none',
            fontFamily: 'var(--font-sans)',
            fontWeight: 'var(--weight-semibold)',
            fontSize: 'var(--text-body)',
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
          }}
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <ArrowRight size={14} />}
          {loading ? 'Resolving...' : resolved ? 'Next problem' : 'Get problem'}
        </button>
      </div>

      {/* Resolved problem */}
      <AnimatePresence mode="wait">
        {loading && (
          <motion.div
            key="skeleton"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ padding: 16, borderRadius: 'var(--radius-md)', background: 'var(--surface-card)', border: 'var(--hairline) solid var(--separator)', display: 'flex', flexDirection: 'column', gap: 12 }}
          >
            <div style={{ height: 12, width: 96, borderRadius: 4, background: 'var(--surface-fill)' }} />
            {[100, 80, 60].map((w, i) => (
              <div key={i} style={{ height: 18, borderRadius: 4, background: 'var(--surface-fill)', width: `${w}%` }} />
            ))}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[1, 2, 3, 4].map(i => (
                <div key={i} style={{ height: 40, borderRadius: 'var(--radius-sm)', background: 'var(--surface-fill)' }} />
              ))}
            </div>
          </motion.div>
        )}

        {!loading && resolved && (
          <motion.div
            key={resolved.problem?.id || resolved.source}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
          >
            {/* Wolfram-verified — the only provenance signal worth showing students */}
            {resolved.source === 'tier-3-wolfram-verified' && (
              <div style={{ padding: '10px 12px', borderRadius: 'var(--radius-md)', border: 'var(--hairline) solid var(--green)', background: 'var(--green-tint)', display: 'flex', alignItems: 'center', gap: 8, color: 'var(--green-ink)' }}>
                <CheckCircle2 size={14} style={{ flexShrink: 0 }} />
                <p style={{ margin: 0, fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-medium)' }}>Computationally verified by Wolfram Alpha</p>
              </div>
            )}

            {resolved.source === 'miss' && (
              <div style={{ padding: 20, borderRadius: 'var(--radius-md)', background: 'var(--surface-card)', border: 'var(--hairline) solid var(--separator)', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--surface-fill)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <XCircle size={20} style={{ color: 'var(--text-tertiary)' }} />
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 'var(--text-body)', fontWeight: 'var(--weight-medium)', color: 'var(--text-primary)' }}>No problems found here</p>
                  <p style={{ margin: '4px 0 0', fontSize: 'var(--text-caption)', color: 'var(--text-tertiary)' }}>Try a different topic or difficulty level.</p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <a href="/materials" style={{ padding: '6px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--indigo-tint)', border: 'var(--hairline) solid var(--indigo)', color: 'var(--indigo-ink)', fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-medium)', textDecoration: 'none' }}>
                    Upload materials
                  </a>
                  <a href="/chat" style={{ padding: '6px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--surface-fill)', border: 'var(--hairline) solid var(--separator)', color: 'var(--text-secondary)', fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-medium)', textDecoration: 'none' }}>
                    Ask the tutor
                  </a>
                </div>
              </div>
            )}

            {resolved.problem && (
              <div style={{ padding: 16, borderRadius: 'var(--radius-md)', background: 'var(--surface-card)', boxShadow: 'var(--shadow-raise)', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--text-caption2)', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <Target size={10} />
                    {resolved.problem.topic?.replace(/-/g, ' ')}
                    <span>·</span>
                    <span>{resolved.problem.year || 'generated'}</span>
                    <span>·</span>
                    <span>{resolved.problem.marks || 2} marks</span>
                  </div>
                  <button
                    onClick={() => navigate(`/lesson/${resolved.problem.concept_id || (TOPIC_ALIAS[topic] ?? topic)}`)}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 'var(--radius-xs)', fontSize: 'var(--text-caption2)', color: 'var(--indigo-ink)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)', flexShrink: 0 }}
                  >
                    <GraduationCap size={11} />
                    Study this concept
                  </button>
                </div>

                <p style={{ margin: 0, fontSize: 'var(--text-body)', color: 'var(--text-primary)', lineHeight: 'var(--leading-relaxed)', whiteSpace: 'pre-wrap' }}>
                  {resolved.problem.question_text}
                </p>

                {resolved.problem.options && typeof resolved.problem.options === 'object' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {Object.entries(resolved.problem.options).map(([key, val]) => {
                      const isCorrectAfterSubmit = submitted && key === resolved.problem.correct_answer;
                      const isWrongSelected = submitted && key === answer && key !== resolved.problem.correct_answer;
                      const isSelected = !submitted && answer === key;
                      return (
                        <button
                          key={key}
                          disabled={submitted}
                          onClick={() => !submitted && setAnswer(key)}
                          style={{
                            width: '100%',
                            textAlign: 'left',
                            padding: '10px 12px',
                            borderRadius: 'var(--radius-sm)',
                            border: `var(--hairline) solid ${
                              isCorrectAfterSubmit ? 'var(--green)' :
                              isWrongSelected ? 'var(--red)' :
                              isSelected ? 'var(--indigo)' :
                              'var(--separator)'
                            }`,
                            background: isCorrectAfterSubmit ? 'var(--green-tint)' :
                              isWrongSelected ? 'var(--red-tint)' :
                              isSelected ? 'var(--indigo-tint)' :
                              'var(--surface-fill)',
                            color: isCorrectAfterSubmit ? 'var(--green-ink)' :
                              isWrongSelected ? 'var(--red)' :
                              isSelected ? 'var(--indigo-ink)' :
                              'var(--text-secondary)',
                            fontSize: 'var(--text-body)',
                            fontFamily: 'var(--font-sans)',
                            cursor: submitted ? 'default' : 'pointer',
                          }}
                        >
                          <span style={{ fontFamily: 'var(--font-mono)', marginRight: 8, fontWeight: 'var(--weight-bold)' }}>{key}.</span>
                          {String(val)}
                        </button>
                      );
                    })}
                  </div>
                )}

                {!resolved.problem.options && (
                  <input
                    type="text"
                    value={answer}
                    disabled={submitted}
                    onChange={e => setAnswer(e.target.value)}
                    placeholder="Your answer..."
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

                {!submitted ? (
                  <button
                    onClick={handleSubmit}
                    disabled={!answer}
                    style={{
                      width: '100%',
                      padding: '10px 0',
                      borderRadius: 'var(--radius-sm)',
                      background: answer ? 'var(--green)' : 'var(--surface-fill)',
                      color: answer ? '#fff' : 'var(--text-tertiary)',
                      border: 'none',
                      fontFamily: 'var(--font-sans)',
                      fontWeight: 'var(--weight-semibold)',
                      fontSize: 'var(--text-body)',
                      cursor: answer ? 'pointer' : 'not-allowed',
                    }}
                  >
                    Submit
                  </button>
                ) : (
                  <>
                    <div style={{
                      padding: 12,
                      borderRadius: 'var(--radius-sm)',
                      border: `var(--hairline) solid ${wasCorrect ? 'var(--green)' : 'var(--red)'}`,
                      background: wasCorrect ? 'var(--green-tint)' : 'var(--red-tint)',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 8,
                    }}>
                      {wasCorrect
                        ? <CheckCircle2 size={14} style={{ color: 'var(--green-ink)', flexShrink: 0, marginTop: 2 }} />
                        : <XCircle size={14} style={{ color: 'var(--red)', flexShrink: 0, marginTop: 2 }} />}
                      <div style={{ fontSize: 'var(--text-caption)', color: 'var(--text-secondary)' }}>
                        <p style={{ margin: 0, fontWeight: 'var(--weight-semibold)', color: 'var(--text-primary)' }}>
                          {wasCorrect ? 'Self-check: matches.' : 'Self-check: differs.'}
                        </p>
                        <p style={{ margin: '2px 0 0', fontSize: 'var(--text-caption2)', color: 'var(--text-tertiary)' }}>
                          Text comparison against the revealed answer — not exam grading, no marks recorded.
                        </p>
                        <p style={{ margin: '4px 0 0' }}>Answer: <span style={{ fontFamily: 'var(--font-mono)' }}>{resolved.problem.correct_answer}</span></p>
                      </div>
                    </div>
                    {resolved.problem.explanation && (
                      <div style={{ marginTop: 12, padding: '12px 14px', borderRadius: 'var(--radius-md)', background: 'var(--surface-card)', border: 'var(--hairline) solid var(--separator)' }}>
                        <p style={{ margin: '0 0 8px', fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-semibold)', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Explanation</p>
                        <p style={{ margin: 0, fontSize: 'var(--text-caption)', color: 'var(--text-secondary)', lineHeight: 'var(--leading-relaxed)' }}>{resolved.problem.explanation}</p>
                        <InteractiveSidecar body={resolved.problem.explanation} />
                      </div>
                    )}
                    <button
                      onClick={() => navigate(`/lesson/${resolved.problem.concept_id || (TOPIC_ALIAS[topic] ?? topic)}`)}
                      style={{
                        marginTop: 4,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '10px 16px',
                        borderRadius: 'var(--radius-sm)',
                        border: 'none',
                        background: 'var(--indigo)',
                        color: 'var(--text-on-accent)',
                        fontSize: 'var(--text-caption)',
                        fontWeight: 'var(--weight-semibold)',
                        cursor: 'pointer',
                        fontFamily: 'var(--font-sans)',
                        letterSpacing: '-0.01em',
                      }}
                    >
                      <BookOpen size={13} /> Explore this concept
                    </button>
                  </>
                )}

                {/* Always visible — not gated on submission */}
                <button
                  onClick={() => navigate(`/lesson/${resolved.problem.concept_id || (TOPIC_ALIAS[topic] ?? topic)}`)}
                  style={{
                    marginTop: 4,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '10px 16px',
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    background: 'var(--indigo)',
                    color: 'var(--text-on-accent)',
                    fontSize: 'var(--text-caption)',
                    fontWeight: 'var(--weight-semibold)',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-sans)',
                    letterSpacing: '-0.01em',
                  }}
                >
                  <BookOpen size={13} /> Explore this concept
                </button>
              </div>
            )}

            {resolved.explainer && (
              <div style={{ padding: 16, borderRadius: 'var(--radius-md)', background: 'var(--surface-card)', border: 'var(--hairline) solid var(--separator)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <h3 style={{ margin: 0, fontSize: 'var(--text-body)', fontWeight: 'var(--weight-semibold)', color: 'var(--text-primary)' }}>{resolved.explainer.label}</h3>
                <p style={{ margin: 0, fontSize: 'var(--text-caption)', color: 'var(--text-secondary)', lineHeight: 'var(--leading-relaxed)' }}>{resolved.explainer.canonical_definition}</p>
                {resolved.explainer.exam_tip && (
                  <p style={{ margin: 0, fontSize: 'var(--text-caption)', color: 'var(--indigo-ink)' }}>{resolved.explainer.exam_tip}</p>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Session stats — only problems_served surfaces (real Compounding evidence). */}
      {sessionStats.problems_served > 0 && (
        <div style={{ padding: 12, borderRadius: 'var(--radius-md)', background: 'var(--surface-card)', border: 'var(--hairline) solid var(--separator)', textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: 'var(--text-title3)', fontWeight: 'var(--weight-bold)', color: 'var(--text-primary)' }}>{sessionStats.problems_served}</p>
          <p style={{ margin: '2px 0 0', fontSize: 'var(--text-caption2)', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>problems this session</p>
        </div>
      )}
    </div>
  );
}
