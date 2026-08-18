/**
 * KnowledgeHomePage — Home shell for knowledge-track students.
 *
 * T13 (B4/A9, DR-1): the four stacked shadow-cards this page used to
 * render (track progress, today's concept, a chip-grid "concept map",
 * CompoundingCard) competed for attention with no single focal element.
 * The frontier spine (FrontierSpine, wireframe 3) is now the ONE focal
 * surface: track progress + "today's concept" fold into a plain header
 * line (no card), the chip grid is replaced by real hairline rows in 4
 * topological clusters, and the spine's own "You are here" card carries
 * the single green CTA. CompoundingCard and the K→E bridge card stay
 * mounted below, unchanged.
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { authFetch } from '@/lib/auth/client';
import { CompoundingCard } from '@/components/app/CompoundingCard';
import { useSession } from '@/hooks/useSession';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ListRow } from '@/components/ui/ListRow';
import { ChevronRight } from 'lucide-react';
import { FrontierSpine } from '@/components/knowledge/FrontierSpine';
import type { FrontierNode, FrontierClusterSummary } from '@/lib/frontier-logic';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { EASE_STANDARD, DUR_FAST_S, framerDuration } from '@/lib/motion-tokens';

interface TrackProgress { mastered: number; total: number; pct: number; track_id: string }
interface ConceptTree { nodes: FrontierNode[]; edges: Array<{ from: string; to: string }>; clusters: FrontierClusterSummary[] }

type Phase = 'loading' | 'error' | 'empty' | 'success';

export default function KnowledgeHomePage() {
  const navigate = useNavigate();
  const sessionId = useSession();
  const [trackId, setTrackId] = useState<string | null>(null);
  const [trackName, setTrackName] = useState('');
  const [progress, setProgress] = useState<TrackProgress | null>(null);
  const [tree, setTree] = useState<ConceptTree | null>(null);
  const [phase, setPhase] = useState<Phase>('loading');
  const reducedMotion = usePrefersReducedMotion();
  const bridgeShown = localStorage.getItem('vidhya.ke_bridge_shown') === '1';
  const [noExams, setNoExams] = useState(false);

  const loadTree = useCallback(async (tid: string) => {
    try {
      const treeRes = await authFetch(`/api/knowledge/tracks/${tid}/concept-tree`);
      if (!treeRes.ok) { setPhase('error'); return; }
      const data: ConceptTree = await treeRes.json();
      setTree(data);
      const doneTotal = data.nodes.filter((n) => n.dot === 'mastered' || n.dot === 'placed').length;
      setPhase(doneTotal === 0 ? 'empty' : 'success');
    } catch {
      setPhase('error');
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const profileRes = await authFetch('/api/student/profile');
        if (!profileRes.ok) { setPhase('error'); return; }
        const profile = await profileRes.json();
        const tid = profile?.exams?.[0]?.knowledge_track_id ?? null;
        if (!tid) { navigate('/planned', { replace: true }); return; }
        setTrackId(tid);
        setNoExams(profile.exams.length === 0);

        const [trackRes, progRes] = await Promise.all([
          authFetch(`/api/knowledge/tracks/${tid}`),
          authFetch(`/api/knowledge/tracks/${tid}/progress`),
        ]);
        if (trackRes.ok) { const d = await trackRes.json(); setTrackName(d.track?.display_name ?? ''); }
        if (progRes.ok) setProgress(await progRes.json());
        await loadTree(tid);
      } catch {
        setPhase('error');
      }
    })();
  }, [navigate, loadTree]);

  if (phase === 'loading') {
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
      {/* Demoted header — plain text, not a card. Track progress + "today's
          concept" both fold in here; the frontier spine below is the one
          focal element on this screen. */}
      <div>
        <p style={{ margin: '0 0 2px', fontSize: 'var(--text-caption)', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-caps)', fontWeight: 'var(--weight-semibold)' }}>
          {trackName || 'Your curriculum'}
        </p>
        {progress && (
          <p style={{ margin: 0, fontSize: 'var(--text-subhead)', color: 'var(--text-secondary)' }}>
            {progress.mastered} of {progress.total} concepts mastered · {progress.pct}%
          </p>
        )}
      </div>

      {phase === 'error' && (
        <ListRow
          title="Couldn't load your map — pull to retry"
          onClick={() => trackId && loadTree(trackId)}
          padding="0 2px"
          last
          trailing={<ChevronRight size={16} color="var(--text-tertiary)" />}
        />
      )}

      {phase === 'empty' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 8 }}>
          <p style={{ margin: 0, fontSize: 'var(--text-body)', color: 'var(--text-secondary)' }}>
            Take the 2-minute warmup to light this up.
          </p>
          <Button tone="mastery" size="md" onClick={() => navigate('/warmup')} style={{ alignSelf: 'flex-start' }}>
            Start the warm-up
          </Button>
        </div>
      )}

      {phase === 'success' && tree && (
        <FrontierSpine
          nodes={tree.nodes}
          clusters={tree.clusters}
          onLearn={(conceptId) => navigate(`/lesson/${conceptId}`)}
        />
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
            transition={{ duration: framerDuration(DUR_FAST_S, reducedMotion), ease: EASE_STANDARD }}
            onAnimationComplete={() => localStorage.setItem('vidhya.ke_bridge_shown', '1')}
          >
            <Card padding={16} elevated style={{ border: '1px solid rgba(88,86,214,.2)' }}>
              <p style={{ margin: '0 0 4px', fontSize: 'var(--text-caption)', color: 'var(--indigo-ink)', fontWeight: 'var(--weight-semibold)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Milestone
              </p>
              <p style={{ margin: '0 0 4px', fontSize: 'var(--text-body)', fontWeight: 'var(--weight-semibold)', color: 'var(--text-primary)' }}>
                You've mastered {progress!.pct}% of {trackName || 'your curriculum'}
              </p>
              <p style={{ margin: '0 0 14px', fontSize: 'var(--text-subhead)', color: 'var(--text-secondary)', lineHeight: 'var(--leading-normal)' }}>
                Ready to test yourself on the full exam?
              </p>
              <Button size="sm" tone="tutor" onClick={() => navigate('/onboard')}>
                Set your exam date <ChevronRight size={14} />
              </Button>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
