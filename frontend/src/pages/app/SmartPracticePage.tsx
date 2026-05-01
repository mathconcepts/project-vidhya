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
 *   → problem renders with provenance badge
 *   → user answers, GBrain updates locally
 *   → next problem via same resolver
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { trackEvent } from '@/lib/analytics';
import { useSession } from '@/hooks/useSession';
import { fadeInUp, staggerContainer } from '@/lib/animations';
import { resolve, warmContentBundle, type ResolvedContent, type ContentSource } from '@/lib/content/resolver';
import { recordAttempt } from '@/lib/gbrain/client';
import {
  Sparkles, Zap, Database, Server, CheckCircle2, XCircle, Loader2, ArrowRight,
  BookOpen, Target, GraduationCap,
} from 'lucide-react';
import { clsx } from 'clsx';

// Topics are loaded dynamically from the student's exam adapter (see useEffect below).
// This fallback covers the brief moment before the fetch completes.
const GATE_FALLBACK_TOPICS = [
  'linear-algebra', 'calculus', 'differential-equations', 'probability-statistics',
  'complex-variables', 'numerical-methods', 'transform-theory',
  'discrete-mathematics', 'graph-theory', 'vector-calculus',
];

const DIFFICULTY_LABELS: Array<{ label: string; value: number }> = [
  { label: 'Easy', value: 0.25 },
  { label: 'Medium', value: 0.5 },
  { label: 'Hard', value: 0.75 },
];

const SOURCE_META: Record<ContentSource, { label: string; icon: typeof Sparkles; color: string; description: string }> = {
  'tier-0-bundle-exact': { label: 'Bundled', icon: Database, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25', description: 'Served from pre-verified bundle — instant, free.' },
  'tier-0-explainer': { label: 'Explainer', icon: BookOpen, color: 'text-violet-400 bg-violet-500/10 border-violet-500/25', description: 'Canonical concept explainer — pre-computed.' },
  'tier-0-client-cache': { label: 'Cached', icon: Zap, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25', description: 'Cached on your device from previous session.' },
  'tier-1-rag': { label: 'RAG', icon: Sparkles, color: 'text-purple-400 bg-purple-500/10 border-purple-500/25', description: 'Semantic match over bundle.' },
  'tier-1-material': { label: 'Your Notes', icon: BookOpen, color: 'text-amber-400 bg-amber-500/10 border-amber-500/25', description: 'Grounded in your uploaded materials.' },
  'tier-2-generated': { label: 'Generated', icon: Sparkles, color: 'text-violet-400 bg-violet-500/10 border-violet-500/25', description: 'Generated live via Gemini Flash-Lite.' },
  'tier-3-wolfram-verified': { label: 'Wolfram-Verified', icon: CheckCircle2, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25', description: 'Computationally verified by Wolfram|Alpha.' },
  'miss': { label: 'No Match', icon: XCircle, color: 'text-red-400 bg-red-500/10 border-red-500/25', description: 'No content available. Upload materials or pick another topic.' },
};

export default function SmartPracticePage() {
  const sessionId = useSession();
  const navigate = useNavigate();

  // Read plan-seeded params from the URL query string.
  // PlannedSessionPage navigates here with:
  //   ?topic=calculus&difficulty=hard&from_plan=PLN-xxx&action_id=act-yyy
  // We initialize topic + difficulty from those values so the practice
  // session starts on the topic the plan recommended.
  const [searchParams] = useSearchParams();
  const initialTopic = searchParams.get('topic') || 'linear-algebra';
  const rawDiff = searchParams.get('difficulty');
  const initialDifficulty = rawDiff === 'easy' ? 0.2
    : rawDiff === 'hard' ? 0.8
    : rawDiff === 'medium' ? 0.5
    : 0.5;

  // Dynamic topic list from the student's exam adapter.
  // Falls back to GATE topics until the profile fetch completes.
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

  // Load the student's exam topic list so the topic picker shows their
  // actual exam syllabus instead of the hardcoded GATE topic list.
  useEffect(() => {
    import('@/lib/auth/client').then(({ authFetch, getToken }) => {
      if (!getToken()) return; // anonymous → keep GATE fallback
      authFetch('/api/onboard/meta')
        .then(r => r.ok ? r.json() : null)
        .then((data: any) => {
          if (data?.topics?.length > 0) {
            const ids = data.topics.map((t: any) => t.id as string);
            setExamTopics(ids);
            // If the current topic (from URL param or default) isn't in
            // the student's syllabus, reset to their first topic.
            setTopic(prev => ids.includes(prev) ? prev : ids[0]);
          }
        })
        .catch(() => {}); // keep GATE fallback on error
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const nextProblem = useCallback(async () => {
    setLoading(true);
    setSubmitted(false);
    setWasCorrect(null);
    setAnswer('');
    try {
      const result = await resolve({
        intent: 'practice',
        concept_id: topic,
        topic,
        difficulty,
        require_wolfram: false,
        use_materials: true,
      });
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
        conceptId: resolved.problem.concept_id || topic,
        isCorrect: !!correct,
        difficulty,
        timeTakenMs,
        problemId: resolved.problem.id,
      });
    } catch {}
  };

  const sourceMeta = resolved ? SOURCE_META[resolved.source] : null;

  return (
    <motion.div className="space-y-5" initial="hidden" animate="visible" variants={staggerContainer}>
      <motion.div variants={fadeInUp}>
        <h1 className="text-xl font-display font-bold text-surface-100 flex items-center gap-2">
          <Sparkles size={20} className="text-violet-400" />
          Smart Practice
        </h1>
        <p className="text-xs text-surface-500 mt-1">
          Pick a topic and difficulty — the right problem comes to you.
        </p>
      </motion.div>


      {/* Controls */}
      <motion.div variants={fadeInUp} className="p-3 rounded-xl bg-surface-900 border border-surface-800 space-y-3">
        <div>
          <label className="text-[10px] text-surface-500 uppercase tracking-wide">Topic</label>
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {examTopics.map(t => (
              <button key={t}
                onClick={() => setTopic(t)}
                className={clsx(
                  'px-2.5 py-1 rounded-lg text-xs transition-colors',
                  topic === t ? 'bg-violet-500 text-white' : 'bg-surface-800 text-surface-400 hover:text-surface-200',
                )}>
                {t.replace(/-/g, ' ')}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-[10px] text-surface-500 uppercase tracking-wide">Difficulty</label>
          <div className="flex gap-1.5 mt-1.5">
            {DIFFICULTY_LABELS.map(d => (
              <button key={d.value}
                onClick={() => setDifficulty(d.value)}
                className={clsx(
                  'flex-1 py-1.5 rounded-lg text-xs',
                  difficulty === d.value ? 'bg-violet-500 text-white' : 'bg-surface-800 text-surface-400',
                )}>
                {d.label}
              </button>
            ))}
          </div>
        </div>
        <button
          onClick={nextProblem}
          disabled={loading}
          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-emerald-500 text-white font-semibold flex items-center justify-center gap-1.5"
        >
          {loading ? <Loader2 className="animate-spin" size={14} /> : <ArrowRight size={14} />}
          {loading ? 'Resolving...' : resolved ? 'Next problem' : 'Get problem'}
        </button>
      </motion.div>

      {/* Resolved problem */}
      <AnimatePresence mode="wait">
        {loading && (
          <motion.div
            key="skeleton"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="p-4 rounded-xl bg-surface-900 border border-surface-800 space-y-3"
          >
            <div className="h-3 w-24 rounded bg-surface-800 animate-pulse" />
            <div className="h-5 w-full rounded bg-surface-800 animate-pulse" />
            <div className="h-5 w-4/5 rounded bg-surface-800 animate-pulse" />
            <div className="h-5 w-3/5 rounded bg-surface-800 animate-pulse" />
            <div className="space-y-1.5 pt-1">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-10 rounded-lg bg-surface-800 animate-pulse" />
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
            className="space-y-3"
          >
            {/* Wolfram-verified is the only provenance signal worth surfacing
                to students — it's a trust marker. All other tiers (bundle,
                cache, RAG, generated) are admin telemetry and don't help the
                student learn. Latency + per-problem USD cost stripped per
                v2.5 frugal-layout principle. Aggregate session cost moved
                behind the "transparency" expandable below. */}
            {resolved.source === 'tier-3-wolfram-verified' && (
              <div className="p-2.5 rounded-xl border border-emerald-500/25 bg-emerald-500/10 flex items-center gap-2 text-emerald-400">
                <CheckCircle2 size={14} className="shrink-0" />
                <p className="text-xs font-medium">Computationally verified by Wolfram Alpha</p>
              </div>
            )}

            {resolved.source === 'miss' && (
              <div className="p-5 rounded-xl bg-surface-900 border border-surface-800 space-y-3 text-center">
                <div className="w-10 h-10 rounded-full bg-surface-800 flex items-center justify-center mx-auto">
                  <XCircle size={20} className="text-surface-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-surface-200">No problems found here</p>
                  <p className="text-xs text-surface-500 mt-1">Try a different topic or difficulty level.</p>
                </div>
                <div className="flex gap-2 justify-center">
                  <a href="/materials" className="px-3 py-2 rounded-lg bg-violet-500/15 border border-violet-500/25 text-violet-400 text-xs font-medium hover:bg-violet-500/20 transition-colors">
                    Upload materials
                  </a>
                  <a href="/chat" className="px-3 py-2 rounded-lg bg-surface-800 border border-surface-700 text-surface-300 text-xs font-medium hover:bg-surface-700 transition-colors">
                    Ask the tutor
                  </a>
                </div>
              </div>
            )}

            {resolved.problem && (
              <div className="p-4 rounded-xl bg-surface-900 border border-surface-800 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-[10px] text-surface-500 uppercase tracking-wide">
                    <Target size={10} />
                    {resolved.problem.topic?.replace(/-/g, ' ')}
                    <span>·</span>
                    <span>{resolved.problem.year || 'generated'}</span>
                    <span>·</span>
                    <span>{resolved.problem.marks || 2} marks</span>
                  </div>
                  {(resolved.problem.concept_id || topic) && (
                    <button
                      onClick={() => navigate(`/lesson/${resolved.problem.concept_id || topic}`)}
                      className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] text-violet-400 hover:text-violet-300 hover:bg-violet-500/10 transition-colors"
                    >
                      <GraduationCap size={11} />
                      Study this concept
                    </button>
                  )}
                </div>
                <p className="text-sm text-surface-100 leading-relaxed whitespace-pre-wrap">
                  {resolved.problem.question_text}
                </p>

                {resolved.problem.options && typeof resolved.problem.options === 'object' && (
                  <div className="space-y-1.5">
                    {Object.entries(resolved.problem.options).map(([key, val]) => (
                      <button
                        key={key}
                        disabled={submitted}
                        onClick={() => !submitted && setAnswer(key)}
                        className={clsx(
                          'w-full text-left p-2.5 rounded-lg border transition-colors text-sm',
                          submitted && key === resolved.problem.correct_answer ? 'bg-emerald-500/15 border-emerald-500/40' :
                          submitted && key === answer && key !== resolved.problem.correct_answer ? 'bg-red-500/15 border-red-500/40' :
                          answer === key ? 'bg-violet-500/15 border-violet-500/40 text-violet-200' :
                          'bg-surface-800 border-surface-700 text-surface-300',
                        )}
                      >
                        <span className="font-mono mr-2 font-bold">{key}.</span>
                        {String(val)}
                      </button>
                    ))}
                  </div>
                )}

                {!resolved.problem.options && (
                  <input
                    type="text"
                    value={answer}
                    disabled={submitted}
                    onChange={e => setAnswer(e.target.value)}
                    placeholder="Your answer..."
                    className="w-full px-3 py-2 rounded-lg bg-surface-800 border border-surface-700 text-surface-200 text-sm focus:outline-none focus:border-violet-500/50"
                  />
                )}

                {!submitted ? (
                  <button
                    onClick={handleSubmit}
                    disabled={!answer}
                    className="w-full py-2.5 rounded-lg bg-violet-500 text-white text-sm font-semibold disabled:opacity-50"
                  >
                    Submit
                  </button>
                ) : (
                  <div className={clsx(
                    'p-3 rounded-lg border flex items-start gap-2',
                    wasCorrect ? 'bg-emerald-500/10 border-emerald-500/25' : 'bg-red-500/10 border-red-500/25',
                  )}>
                    {wasCorrect ? <CheckCircle2 size={14} className="text-emerald-400 shrink-0 mt-0.5" /> : <XCircle size={14} className="text-red-400 shrink-0 mt-0.5" />}
                    <div className="text-xs text-surface-300">
                      <p className="font-semibold">{wasCorrect ? 'Correct!' : 'Not quite.'}</p>
                      <p className="mt-0.5">Answer: <span className="font-mono">{resolved.problem.correct_answer}</span></p>
                      {resolved.problem.explanation && <p className="mt-1 opacity-80">{resolved.problem.explanation}</p>}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Explainer mode */}
            {resolved.explainer && (
              <div className="p-4 rounded-xl bg-surface-900 border border-surface-800 space-y-2">
                <h3 className="text-sm font-semibold text-surface-100">{resolved.explainer.label}</h3>
                <p className="text-xs text-surface-400 leading-relaxed">{resolved.explainer.canonical_definition}</p>
                {resolved.explainer.exam_tip && (
                  <p className="text-xs text-violet-300 mt-2">💡 {resolved.explainer.exam_tip}</p>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Session stats. v2.5: avg-latency + total-cost stripped (admin
          telemetry, not student value). Kept the problem count because
          "you've done N problems this session" is real Compounding evidence. */}
      {sessionStats.problems_served > 0 && (
        <motion.div variants={fadeInUp} className="p-3 rounded-xl bg-surface-900 border border-surface-800 text-center">
          <p className="text-lg font-bold text-surface-200">{sessionStats.problems_served}</p>
          <p className="text-[10px] text-surface-500 uppercase tracking-wide">problems this session</p>
        </motion.div>
      )}
    </motion.div>
  );
}
