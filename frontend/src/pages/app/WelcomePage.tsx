/**
 * WelcomePage — first-visit landing for the demo deploy.
 *
 * Sets clear expectations: "This demo runs on GATE Engineering Mathematics."
 * Demo users were previously dropped into Home / Studymate / Chat without
 * any exam context, then hit cryptic errors ("No concepts found for exam
 * 'gate-ma'") because the silent default didn't match their assumptions.
 *
 * Once dismissed, sets `vidhya.demo_welcomed` in localStorage so returning
 * visitors skip straight to Home. AppLayout checks the flag on mount.
 */

import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, BookOpen, Target, Brain } from 'lucide-react';
import { useActiveExam } from '@/hooks/useActiveExam';

const WELCOMED_KEY = 'vidhya.demo_welcomed';

export function markDemoWelcomed(): void {
  try { localStorage.setItem(WELCOMED_KEY, '1'); } catch { /* ignore */ }
}

export function hasSeenDemoWelcome(): boolean {
  try { return localStorage.getItem(WELCOMED_KEY) === '1'; } catch { return false; }
}

export default function WelcomePage() {
  const navigate = useNavigate();
  const { exam } = useActiveExam();

  const onContinue = () => {
    markDemoWelcomed();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 bg-gradient-to-br from-surface-950 via-surface-900 to-violet-950">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-md w-full"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 mb-4"
          >
            <Sparkles size={28} className="text-emerald-400" />
          </motion.div>
          <h1 className="text-3xl font-display font-black text-surface-100 mb-2">
            Welcome to Vidhya
          </h1>
          <p className="text-sm text-surface-400 leading-relaxed">
            An exam-agnostic adaptive tutor. This demo is loaded with one exam.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-5 rounded-xl bg-surface-900/80 border border-violet-500/30 backdrop-blur-sm mb-6"
        >
          <div className="text-xs uppercase tracking-wider text-violet-300/80 mb-2">Loaded exam</div>
          <div className="text-lg font-semibold text-surface-100 mb-1">
            {exam?.name ?? 'Loading…'}
          </div>
          {exam?.description ? (
            <p className="text-xs text-surface-400 leading-relaxed">{exam.description}</p>
          ) : (
            <p className="text-xs text-surface-400 leading-relaxed">
              Adaptive sessions, grounded explanations, and a live AI tutor.
            </p>
          )}
          {(exam?.duration_minutes || exam?.total_marks) && (
            <div className="flex gap-3 mt-3 text-[11px] text-surface-500">
              {exam.duration_minutes && <span>{exam.duration_minutes} min</span>}
              {exam.total_marks && <span>{exam.total_marks} marks</span>}
              {exam.scope && <span>{exam.scope}</span>}
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="space-y-3 mb-8"
        >
          <FeatureRow
            icon={Target}
            title="Anytime Studymate"
            description="15-minute adaptive sessions calibrated to your weak spots"
          />
          <FeatureRow
            icon={Brain}
            title="AI Tutor Chat"
            description="Ask anything about the syllabus — concept explanations, worked examples, exam strategy"
          />
          <FeatureRow
            icon={BookOpen}
            title="Concept Lessons"
            description="Bite-sized explainers with hooks, intuition, formal definitions, common traps"
          />
        </motion.div>

        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          onClick={onContinue}
          className="w-full px-5 py-3.5 rounded-xl bg-gradient-to-r from-violet-500 to-emerald-500 text-white font-semibold inline-flex items-center justify-center gap-2 hover:from-violet-400 hover:to-emerald-400 transition-all shadow-lg shadow-violet-500/20"
        >
          Get started
          <ArrowRight size={16} />
        </motion.button>

        <p className="text-center text-[11px] text-surface-600 mt-6">
          Production deployments support custom exams, persistent progress, and real cohorts.
        </p>
      </motion.div>
    </div>
  );
}

function FeatureRow({
  icon: Icon,
  title,
  description,
}: {
  icon: any;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-surface-900/40 border border-surface-800">
      <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-violet-500/15 border border-violet-500/30 flex items-center justify-center">
        <Icon size={16} className="text-violet-300" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-surface-100">{title}</div>
        <div className="text-xs text-surface-400 leading-relaxed">{description}</div>
      </div>
    </div>
  );
}
