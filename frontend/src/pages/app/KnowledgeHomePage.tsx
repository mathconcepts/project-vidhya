/**
 * KnowledgeHomePage — Home shell for knowledge-track students.
 * Shows curriculum progress, today's recommended concept, concept map,
 * CompoundingCard, and the K→E bridge card at ≥70% coverage.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { authFetch } from '@/lib/auth/client';
import { CompoundingCard } from '@/components/app/CompoundingCard';
import { useSession } from '@/hooks/useSession';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Button } from '@/components/ui/Button';
import { BookOpen, ChevronRight, Lock, CheckCircle2, Circle, AlertCircle } from 'lucide-react';

interface TrackProgress { mastered: number; total: number; pct: number; track_id: string }
interface NextConcept { concept_id: string; concept_name: string; why_next: string; lesson_url: string }
interface ConceptNode { id: string; name: string; status: 'mastered' | 'in-progress' | 'locked'; score: number; has_prerequisite_alert: boolean }
interface ConceptTree { nodes: ConceptNode[]; edges: Array<{ from: string; to: string }> }

const NODE_STYLES: Record<string, { bg: string; border: string; color: string }> = {
  mastered:    { bg: 'rgba(52,199,89,.1)',  border: 'rgba(52,199,89,.3)',  color: 'var(--green-ink)' },
  'in-progress': { bg: 'rgba(88,86,214,.1)', border: 'rgba(88,86,214,.3)', color: 'var(--indigo-ink)' },
  locked:      { bg: 'var(--surface-fill)', border: 'var(--separator)',    color: 'var(--text-tertiary)' },
};

export default function KnowledgeHomePage() {
  const navigate = useNavigate();
  const sessionId = useSession();
  const [trackId, setTrackId] = useState<string | null>(null);
  const [trackName, setTrackName] = useState('');
  const [progress, setProgress] = useState<TrackProgress | null>(null);
  const [nextConcept, setNextConcept] = useState<NextConcept | null>(null);
  const [tree, setTree] = useState<ConceptTree | null>(null);
  const [loading, setLoading] = useState(true);
  const bridgeShown = localStorage.getItem('vidhya.ke_bridge_shown') === '1';
  const [noExams, setNoExams] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const profileRes = await authFetch('/api/student/profile');
        if (!profileRes.ok) { setLoading(false); return; }
        const profile = await profileRes.json();
        const tid = profile?.exams?.[0]?.knowledge_track_id ?? null;
        if (!tid) { navigate('/planned', { replace: true }); return; }
        setTrackId(tid);
        setNoExams(profile.exams.length === 0);

        const [trackRes, progRes, nextRes, treeRes] = await Promise.all([
          authFetch(`/api/knowledge/tracks/${tid}`),
          authFetch(`/api/knowledge/tracks/${tid}/progress`),
          authFetch(`/api/knowledge/tracks/${tid}/next-concept`),
          authFetch(`/api/knowledge/tracks/${tid}/concept-tree`),
        ]);
        if (trackRes.ok) { const d = await trackRes.json(); setTrackName(d.track?.display_name ?? ''); }
        if (progRes.ok) setProgress(await progRes.json());
        if (nextRes.ok) setNextConcept(await nextRes.json());
        if (treeRes.ok) setTree(await treeRes.json());
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate]);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 8 }}>
        {[1, 2, 3].map(i => (
          <div key={i} style={{ height: 80, borderRadius: 'var(--radius-lg)', background: 'var(--surface-fill)' }} />
        ))}
      </div>
    );
  }

  const showBridge = !bridgeShown && progress && progress.pct >= 70 && noExams;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 8 }}>
      {/* Track progress card */}
      <div style={{
        padding: '16px',
        borderRadius: 'var(--radius-lg)',
        background: 'var(--surface-card)',
        boxShadow: 'var(--shadow-card)',
      }}>
        <p style={{ margin: '0 0 4px', fontSize: 'var(--text-caption)', color: 'var(--green-ink)', fontWeight: 'var(--weight-semibold)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {trackName || 'Your curriculum'}
        </p>
        {progress ? (
          <>
            <p style={{ margin: '0 0 10px', fontSize: 'var(--text-title2)', fontWeight: 'var(--weight-bold)', color: 'var(--text-primary)', letterSpacing: '-0.018em' }}>
              {progress.mastered}{' '}
              <span style={{ fontSize: 'var(--text-body)', fontWeight: 'var(--weight-regular)', color: 'var(--text-secondary)' }}>
                of {progress.total} concepts mastered
              </span>
            </p>
            <ProgressBar value={progress.pct} tone={progress.pct >= 70 ? 'mastery' : 'neutral'} />
            <p style={{ margin: '6px 0 0', fontSize: 'var(--text-caption)', color: 'var(--text-tertiary)' }}>
              {progress.pct}% complete
            </p>
          </>
        ) : (
          <p style={{ margin: 0, fontSize: 'var(--text-footnote)', color: 'var(--text-secondary)' }}>Loading progress…</p>
        )}
      </div>

      {/* Today's concept card */}
      {nextConcept && (
        <div style={{
          padding: '16px',
          borderRadius: 'var(--radius-lg)',
          background: 'var(--surface-card)',
          boxShadow: 'var(--shadow-card)',
        }}>
          <p style={{ margin: '0 0 6px', fontSize: 'var(--text-caption)', color: 'var(--indigo-ink)', fontWeight: 'var(--weight-semibold)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Today
          </p>
          <p style={{ margin: '0 0 4px', fontSize: 'var(--text-body)', fontWeight: 'var(--weight-semibold)', color: 'var(--text-primary)' }}>
            {nextConcept.concept_name}
          </p>
          <p style={{ margin: '0 0 14px', fontSize: 'var(--text-footnote)', color: 'var(--text-secondary)', lineHeight: 'var(--leading-normal)' }}>
            {nextConcept.why_next}
          </p>
          <Button size="sm" tone="tutor" onClick={() => navigate(nextConcept.lesson_url)}>
            <BookOpen size={14} /> Study {nextConcept.concept_name} <ChevronRight size={14} />
          </Button>
        </div>
      )}

      {/* Concept map */}
      {tree && tree.nodes.length > 0 && (
        <div style={{ padding: '14px 16px', borderRadius: 'var(--radius-md)', background: 'var(--surface-fill)' }}>
          <p style={{ margin: '0 0 10px', fontSize: 'var(--text-caption)', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 'var(--weight-semibold)' }}>
            Concept map
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {tree.nodes.map(node => {
              const st = NODE_STYLES[node.status] || NODE_STYLES.locked;
              return (
                <div
                  key={node.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 10px',
                    borderRadius: 'var(--radius-xs)',
                    background: st.bg,
                    border: `1px solid ${st.border}`,
                    color: st.color,
                    fontSize: 'var(--text-caption)',
                    fontWeight: 'var(--weight-medium)',
                  }}
                >
                  {node.status === 'mastered' && <CheckCircle2 size={11} />}
                  {node.status === 'in-progress' && <Circle size={11} />}
                  {node.status === 'locked' && <Lock size={11} />}
                  {node.has_prerequisite_alert && <AlertCircle size={11} style={{ color: 'var(--orange)' }} />}
                  {node.name}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* CompoundingCard */}
      <CompoundingCard sessionId={sessionId} />

      {/* K→E bridge card — once only at ≥70% coverage */}
      <AnimatePresence>
        {showBridge && (
          <motion.div
            key="bridge"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: [0.32, 0.72, 0, 1] }}
            style={{
              padding: '16px',
              borderRadius: 'var(--radius-lg)',
              background: 'var(--surface-card)',
              boxShadow: 'var(--shadow-card)',
              border: '1px solid rgba(88,86,214,.2)',
            }}
            onAnimationComplete={() => localStorage.setItem('vidhya.ke_bridge_shown', '1')}
          >
            <p style={{ margin: '0 0 4px', fontSize: 'var(--text-caption)', color: 'var(--indigo-ink)', fontWeight: 'var(--weight-semibold)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Milestone
            </p>
            <p style={{ margin: '0 0 4px', fontSize: 'var(--text-body)', fontWeight: 'var(--weight-semibold)', color: 'var(--text-primary)' }}>
              You've mastered {progress!.pct}% of {trackName || 'your curriculum'}
            </p>
            <p style={{ margin: '0 0 14px', fontSize: 'var(--text-footnote)', color: 'var(--text-secondary)', lineHeight: 'var(--leading-normal)' }}>
              Ready to test yourself on the full exam?
            </p>
            <Button size="sm" tone="tutor" onClick={() => navigate('/onboard')}>
              Set your exam date <ChevronRight size={14} />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
