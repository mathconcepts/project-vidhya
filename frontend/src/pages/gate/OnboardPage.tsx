/**
 * OnboardPage — Exam-aware onboarding wizard.
 * Steps: Exam Date → Weekly Hours → Topic Confidence
 *
 * Reads the student's exam from their JWT profile so all text and
 * topic lists are tailored to their actual exam (BITSAT, NEET, GATE, etc.).
 * Saves to the flat-file profile store via POST /api/onboard (no Postgres).
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from '@/hooks/useSession';
import { authFetch } from '@/lib/auth/client';
import { trackEvent } from '@/lib/analytics';
import { Calendar, Clock, Brain, ChevronRight, ChevronLeft, Check } from 'lucide-react';
import { clsx } from 'clsx';
import { useAuthRedirect } from '@/hooks/useAuthRedirect';

const BUCKETS = [
  { key: 'weak',   label: 'Weak',   value: 1, border: 'border-red-500/30',     bg: 'bg-red-500/5',     chip: 'bg-red-500/15 text-red-400 border-red-500/30'       },
  { key: 'okay',   label: 'Okay',   value: 3, border: 'border-amber-500/30',   bg: 'bg-amber-500/5',   chip: 'bg-amber-500/15 text-amber-400 border-amber-500/30'   },
  { key: 'strong', label: 'Strong', value: 5, border: 'border-emerald-500/30', bg: 'bg-emerald-500/5', chip: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
] as const;

const STEPS = [
  { icon: Calendar, label: 'Exam Date' },
  { icon: Clock,    label: 'Weekly Hours' },
  { icon: Brain,    label: 'Confidence' },
];

// v2.5: removed the algebra/calculus/geometry FALLBACK_TOPICS list.
// When the exam adapter API fails, we now show an explicit error state with
// a "Pick your exam" CTA rather than fabricating fake topics that don't match
// any real exam. Showing wrong topics is worse than showing a loading skeleton.

interface ExamMeta {
  exam_id: string;
  exam_name: string;
  exam_short_name: string;
  topics: { id: string; name: string }[];
}

export default function OnboardPage() {
  const sessionId = useSession();
  const navigate = useNavigate();
  const checking = useAuthRedirect('/planned'); // redirect if already onboarded
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [examMeta, setExamMeta] = useState<ExamMeta | null>(null);
  const [loadingExam, setLoadingExam] = useState(true);

  // Form state
  const [examDate, setExamDate] = useState('');
  const [weeklyHours, setWeeklyHours] = useState<number>(10);
  const [confidence, setConfidence] = useState<Record<string, number>>({});

  const [examLoadError, setExamLoadError] = useState(false);

  // Load exam metadata from the server (exam_id, exam_name, topics).
  // v2.5: on failure, surface an error state with a "Pick your exam" CTA
  // rather than fabricate generic topics. See FALLBACK_TOPICS comment above.
  useEffect(() => {
    authFetch('/api/onboard/meta')
      .then(r => r.json())
      .then((data: ExamMeta) => {
        if (!data?.topics?.length) {
          setExamLoadError(true);
          return;
        }
        setExamMeta(data);
        // Initialise all topics to "Okay" (3)
        setConfidence(Object.fromEntries(data.topics.map(t => [t.id, 3])));
      })
      .catch(() => setExamLoadError(true))
      .finally(() => setLoadingExam(false));
  }, []);

  const topics = examMeta?.topics ?? [];
  const examLabel = examMeta?.exam_short_name ?? examMeta?.exam_name ?? 'Exam';

  const canAdvance = () => {
    if (step === 0) return examDate !== '';
    return true;
  };

  const handleNext = () => {
    if (step < STEPS.length - 1) setStep(step + 1);
    else handleSubmit();
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const handleSubmit = async () => {
    setSaving(true);
    setError('');
    try {
      const res = await authFetch('/api/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          exam_id: examMeta?.exam_id,
          exam_date: examDate,
          weekly_hours: weeklyHours,
          topic_confidence: confidence,
        }),
      });
      if (!res.ok) throw new Error('Failed to save profile');
      trackEvent('onboard_complete', { weekly_hours: weeklyHours, exam_id: examMeta?.exam_id });
      navigate('/diagnostic');
    } catch (err: any) {
      setError(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (loadingExam || checking) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-emerald-500/30 border-t-emerald-500 animate-spin" />
        <p className="text-xs text-surface-500 font-display">Loading your exam profile…</p>
      </div>
    );
  }

  // v2.5: explicit error state when the exam adapter API fails or returns
  // empty topics. Replaces the prior algebra/calculus/geometry fake-fallback.
  if (examLoadError || !examMeta) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4 text-center">
        <div className="w-12 h-12 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
          <Calendar size={20} className="text-amber-400" />
        </div>
        <div>
          <h1 className="text-xl font-display font-bold text-surface-100">Pick your exam first</h1>
          <p className="text-sm text-surface-400 mt-2 max-w-sm">
            We couldn't load your exam profile. Choose your exam so the topics, dates, and study plan
            calibrate to you — not to a generic placeholder.
          </p>
        </div>
        <button
          onClick={() => navigate('/exams')}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-violet-500 text-white text-sm font-bold inline-flex items-center gap-1.5"
        >
          Pick exam <ChevronRight size={14} />
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex flex-col">
      {/* Progress dots */}
      <div className="flex items-center justify-center gap-2 py-4">
        {STEPS.map((s, i) => (
          <div
            key={i}
            className={clsx(
              'w-2.5 h-2.5 rounded-full transition-all duration-300',
              i === step ? 'bg-emerald-500 scale-125' : i < step ? 'bg-emerald-500/50' : 'bg-surface-700'
            )}
          />
        ))}
      </div>

      {/* Step content */}
      <div className="flex-1 flex flex-col">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.2 }}
            className="flex-1 flex flex-col"
          >
            {/* Step 0 — Exam date */}
            {step === 0 && (
              <div className="space-y-6 px-1">
                <div className="text-center space-y-2">
                  <Calendar size={32} className="text-emerald-400 mx-auto" />
                  <h2 className="text-xl font-bold text-surface-100">When is your {examLabel} exam?</h2>
                  <p className="text-sm text-surface-400">Set your date — we'll make every day count</p>
                </div>
                <input
                  type="date"
                  value={examDate}
                  onChange={e => setExamDate(e.target.value)}
                  min={new Date().toISOString().slice(0, 10)}
                  className="w-full px-4 py-3 rounded-xl bg-surface-900 border border-surface-700 text-surface-100 focus:border-emerald-500 focus:outline-none text-center text-lg font-mono"
                />
                {examDate && (() => {
                  const days = Math.ceil((new Date(examDate).getTime() - Date.now()) / 86400000);
                  return (
                    <p className={clsx(
                      'text-center text-sm font-medium',
                      days < 60 ? 'text-amber-400' : 'text-emerald-400'
                    )}>
                      {days} days from now{days < 60 && ' — every day counts!'}
                    </p>
                  );
                })()}
              </div>
            )}

            {/* Step 1 — Weekly hours */}
            {step === 1 && (
              <div className="space-y-6 px-1">
                <div className="text-center space-y-2">
                  <Clock size={32} className="text-emerald-400 mx-auto" />
                  <h2 className="text-xl font-bold text-surface-100">Hours per week to study?</h2>
                  <p className="text-sm text-surface-400">Be realistic — we'll plan around this</p>
                </div>
                <div className="text-center">
                  <span className="text-5xl font-bold text-emerald-400 font-mono">{weeklyHours}</span>
                  <span className="text-xl text-surface-500 ml-1">hrs/week</span>
                </div>
                <input
                  type="range" min={3} max={40} step={1}
                  value={weeklyHours}
                  onChange={e => setWeeklyHours(parseInt(e.target.value))}
                  className="w-full accent-emerald-500"
                />
                <div className="flex justify-between text-xs text-surface-500">
                  <span>3 hrs</span>
                  <span>~{Math.round(weeklyHours / 7 * 60)} min/day</span>
                  <span>40 hrs</span>
                </div>
              </div>
            )}

            {/* Step 2 — Topic confidence */}
            {step === 2 && (
              <div className="space-y-4 px-1">
                <div className="text-center space-y-2">
                  <Brain size={32} className="text-emerald-400 mx-auto" />
                  <h2 className="text-xl font-bold text-surface-100">Rate your topics</h2>
                  <p className="text-sm text-surface-400">Tap a topic to cycle: Weak → Okay → Strong</p>
                </div>
                <div className="space-y-3 max-h-[50vh] overflow-y-auto pb-4">
                  {BUCKETS.map(bucket => {
                    const topicsInBucket = topics.filter(t => (confidence[t.id] ?? 3) === bucket.value);
                    return (
                      <div key={bucket.key} className={clsx('p-3 rounded-xl border', bucket.border, bucket.bg)}>
                        <p className="text-xs font-semibold text-surface-300 mb-2">{bucket.label}</p>
                        <div className="flex flex-wrap gap-2">
                          {topicsInBucket.length === 0 && (
                            <span className="text-[11px] text-surface-600 italic">Tap topics to move here</span>
                          )}
                          {topicsInBucket.map(topic => {
                            const nextLabel = bucket.value === 1 ? 'Okay' : bucket.value === 3 ? 'Strong' : 'Weak';
                            return (
                              <button
                                key={topic.id}
                                onClick={() => {
                                  const cur = confidence[topic.id] ?? 3;
                                  const next = cur === 1 ? 3 : cur === 3 ? 5 : 1;
                                  setConfidence(prev => ({ ...prev, [topic.id]: next }));
                                }}
                                aria-label={`Move ${topic.name} to ${nextLabel}`}
                                className={clsx(
                                  'px-3 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer touch-manipulation active:scale-95',
                                  bucket.chip,
                                )}
                              >
                                {topic.name}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {error && (
          <p className="text-sm text-red-400 text-center px-4">{error}</p>
        )}

        {/* Navigation */}
        <div className="flex gap-3 pt-4 pb-6 px-1">
          {step > 0 && (
            <button
              onClick={handleBack}
              className="flex items-center gap-1 px-4 py-3 rounded-xl border border-surface-700 text-surface-300 hover:bg-surface-800 transition-colors"
            >
              <ChevronLeft size={16} />
              Back
            </button>
          )}
          <button
            onClick={handleNext}
            disabled={!canAdvance() || saving}
            className={clsx(
              'flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-white transition-all',
              canAdvance() && !saving
                ? 'bg-gradient-to-r from-emerald-500 to-violet-500 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40'
                : 'bg-surface-700 text-surface-500 cursor-not-allowed'
            )}
          >
            {saving ? (
              <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            ) : step === STEPS.length - 1 ? (
              <><Check size={18} /> Start Diagnostic</>
            ) : (
              <><span>Next</span><ChevronRight size={18} /></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
