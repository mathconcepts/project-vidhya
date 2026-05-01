/**
 * KnowledgeHomePage — Home shell for knowledge-track students.
 * Shows curriculum progress, today's recommended concept, concept map,
 * CompoundingCard, and the K→E bridge card at ≥70% coverage.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { authFetch } from '@/lib/auth/client';
import { CompoundingCard } from '@/components/app/CompoundingCard';
import { fadeInUp, staggerContainer } from '@/lib/animations';
import { BookOpen, ChevronRight, Lock, CheckCircle2, Circle, AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';

interface TrackProgress { mastered: number; total: number; pct: number; track_id: string }
interface NextConcept { concept_id: string; concept_name: string; why_next: string; lesson_url: string }
interface ConceptNode { id: string; name: string; status: 'mastered' | 'in-progress' | 'locked'; score: number; has_prerequisite_alert: boolean }
interface ConceptTree { nodes: ConceptNode[]; edges: Array<{ from: string; to: string }> }

export default function KnowledgeHomePage() {
  const navigate = useNavigate();
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
      <div className="space-y-4 pt-2">
        {[1, 2, 3].map(i => <div key={i} className="h-20 rounded-xl bg-surface-900 animate-pulse" />)}
      </div>
    );
  }

  const showBridge = !bridgeShown && progress && progress.pct >= 70 && noExams;

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="space-y-4 pt-2"
    >
      {/* Track progress header */}
      <motion.div variants={fadeInUp} className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/10 via-violet-500/5 to-transparent border border-emerald-500/20">
        <div className="text-xs uppercase tracking-wider text-emerald-300/80 mb-1">
          {trackName || 'Your curriculum'}
        </div>
        {progress ? (
          <>
            <div className="text-2xl font-display font-black text-surface-100 mb-1">
              {progress.mastered} <span className="text-base font-normal text-surface-400">of {progress.total} concepts mastered</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-surface-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-violet-500 transition-all"
                style={{ width: `${progress.pct}%` }}
              />
            </div>
            <div className="text-xs text-surface-500 mt-1">{progress.pct}% complete</div>
          </>
        ) : (
          <div className="text-sm text-surface-400">Loading progress…</div>
        )}
      </motion.div>

      {/* Today's concept card */}
      {nextConcept && (
        <motion.div variants={fadeInUp} className="p-4 rounded-xl bg-surface-900 border border-violet-500/20">
          <div className="text-xs text-violet-300/80 uppercase tracking-wider mb-2">Today</div>
          <div className="text-base font-semibold text-surface-100 mb-1">{nextConcept.concept_name}</div>
          <div className="text-xs text-surface-400 leading-relaxed mb-3">{nextConcept.why_next}</div>
          <button
            onClick={() => navigate(nextConcept.lesson_url)}
            className="px-4 py-2 rounded-lg bg-violet-500 hover:bg-violet-400 text-white text-sm font-semibold transition-colors inline-flex items-center gap-1.5"
          >
            <BookOpen size={14} /> Study {nextConcept.concept_name} <ChevronRight size={14} />
          </button>
        </motion.div>
      )}

      {/* Concept map */}
      {tree && tree.nodes.length > 0 && (
        <motion.div variants={fadeInUp} className="p-4 rounded-xl bg-surface-900 border border-surface-800">
          <div className="text-xs text-surface-500 uppercase tracking-wider mb-3">Concept map</div>
          <div className="flex flex-wrap gap-2">
            {tree.nodes.map(node => (
              <div
                key={node.id}
                className={clsx(
                  'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                  node.status === 'mastered'   && 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
                  node.status === 'in-progress' && 'bg-violet-500/10 border-violet-500/30 text-violet-300',
                  node.status === 'locked'      && 'bg-surface-800 border-surface-700 text-surface-500',
                )}
              >
                {node.status === 'mastered' && <CheckCircle2 size={11} />}
                {node.status === 'in-progress' && <Circle size={11} className="fill-violet-500" />}
                {node.status === 'locked' && <Lock size={11} />}
                {node.has_prerequisite_alert && <AlertCircle size={11} className="text-amber-400" />}
                {node.name}
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* CompoundingCard */}
      <CompoundingCard />

      {/* K→E bridge card — once only at ≥70% coverage */}
      <AnimatePresence>
        {showBridge && (
          <motion.div
            key="bridge"
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0 }}
            className="p-4 rounded-xl bg-gradient-to-br from-violet-500/10 to-emerald-500/5 border border-violet-500/25"
            onAnimationComplete={() => localStorage.setItem('vidhya.ke_bridge_shown', '1')}
          >
            <div className="text-xs text-violet-300/80 uppercase tracking-wider mb-2">Milestone</div>
            <div className="text-base font-semibold text-surface-100 mb-1">
              You've mastered {progress!.pct}% of {trackName || 'your curriculum'}
            </div>
            <div className="text-xs text-surface-400 leading-relaxed mb-3">
              Ready to test yourself on the full exam?
            </div>
            <button
              onClick={() => navigate('/onboard')}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-violet-500 text-white text-sm font-semibold inline-flex items-center gap-1.5"
            >
              Set your exam date <ChevronRight size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
