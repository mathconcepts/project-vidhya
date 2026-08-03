/**
 * WelcomePage — first-visit landing for the demo deploy.
 */

import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, BookOpen, Target, Brain } from 'lucide-react';
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 448, margin: '0 auto', paddingTop: 24 }}>
      <motion.div
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18 }}
        style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}
      >
        <h1 style={{ margin: 0, fontSize: 'var(--text-title2)', fontWeight: 'var(--weight-bold)', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
          Welcome to Vidhya
        </h1>
        <p style={{ margin: 0, fontSize: 'var(--text-body)', color: 'var(--text-secondary)' }}>
          An exam-agnostic adaptive tutor. This demo is loaded with one exam.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        style={{
          padding: '12px 16px',
          borderRadius: 'var(--radius-md)',
          background: 'rgba(88,86,214,.05)',
          border: '1px solid rgba(88,86,214,.18)',
        }}
      >
        <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--indigo-ink)', marginBottom: 4 }}>Loaded exam</div>
        <div style={{ fontSize: 'var(--text-body)', fontWeight: 'var(--weight-semibold)', color: 'var(--text-primary)', marginBottom: 4 }}>
          {exam?.name ?? 'Loading…'}
        </div>
        {exam?.description ? (
          <p style={{ margin: 0, fontSize: 'var(--text-caption)', color: 'var(--text-secondary)', lineHeight: 'var(--leading-relaxed)' }}>{exam.description}</p>
        ) : (
          <p style={{ margin: 0, fontSize: 'var(--text-caption)', color: 'var(--text-secondary)', lineHeight: 'var(--leading-relaxed)' }}>
            Adaptive sessions, grounded explanations, and a live AI tutor.
          </p>
        )}
        {(exam?.duration_minutes || exam?.total_marks) && (
          <div style={{ display: 'flex', gap: 12, marginTop: 8, fontSize: 11, color: 'var(--text-tertiary)' }}>
            {exam.duration_minutes && <span>{exam.duration_minutes} min</span>}
            {exam.total_marks && <span>{exam.total_marks} marks</span>}
            {exam.scope && <span>{exam.scope}</span>}
          </div>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
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
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        onClick={onContinue}
        style={{
          width: '100%',
          padding: '12px 20px',
          borderRadius: 'var(--radius-md)',
          background: 'var(--green)',
          color: 'var(--text-on-accent)',
          fontWeight: 'var(--weight-semibold)',
          fontSize: 'var(--text-body)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          border: 'none',
          cursor: 'pointer',
        }}
      >
        Get started
        <ArrowRight size={16} />
      </motion.button>

      <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-tertiary)', margin: 0 }}>
        Production deployments support custom exams, persistent progress, and real cohorts.
      </p>
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
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: 12, borderRadius: 'var(--radius-sm)', background: 'var(--surface-fill)', border: 'var(--hairline) solid var(--separator)' }}>
      <div style={{ flexShrink: 0, width: 36, height: 36, borderRadius: 'var(--radius-sm)', background: 'rgba(88,86,214,.08)', border: '1px solid rgba(88,86,214,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={16} style={{ color: 'var(--indigo-ink)' }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 'var(--text-body)', fontWeight: 'var(--weight-semibold)', color: 'var(--text-primary)' }}>{title}</div>
        <div style={{ fontSize: 'var(--text-caption)', color: 'var(--text-secondary)', lineHeight: 'var(--leading-relaxed)' }}>{description}</div>
      </div>
    </div>
  );
}
