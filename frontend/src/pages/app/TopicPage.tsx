/**
 * TopicPage — Problem list with mastery header and concept notes.
 */

import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { apiFetch } from '@/hooks/useApi';
import { useSession } from '@/hooks/useSession';
import { trackEvent } from '@/lib/analytics';
import { MasteryRing } from '@/components/ui/MasteryRing';
import { MarkdownAtomRenderer } from '@/components/lesson/MarkdownAtomRenderer';
import { ChevronLeft, ChevronRight, ChevronDown, BookOpen, GraduationCap } from 'lucide-react';

interface Problem {
  id: string;
  year: number | null;
  question_text: string;
  difficulty: string;
  marks: number;
  topic: string;
  source?: string;
}

interface TopicMastery {
  topic: string;
  mastery: number;
  correct: number;
  attempts: number;
}

const DIFF_STYLE: Record<string, { color: string; bg: string }> = {
  easy:   { color: 'var(--green-ink)', bg: 'rgba(52,199,89,.10)' },
  medium: { color: 'var(--orange)',    bg: 'rgba(255,149,0,.10)' },
  hard:   { color: 'var(--red)',       bg: 'rgba(255,59,48,.10)' },
};

export default function TopicPage() {
  const { topicId } = useParams<{ topicId: string }>();
  const sessionId = useSession();
  const [problems, setProblems] = useState<Problem[]>([]);
  const [mastery, setMastery] = useState<TopicMastery | null>(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState<string | null>(null);
  const [notesOpen, setNotesOpen] = useState(false);

  const topicName = (topicId || '')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());

  useEffect(() => {
    if (!topicId) return;
    trackEvent('page_view', { page: 'topic', topic: topicId });

    Promise.all([
      apiFetch<{ problems: Problem[] }>(`/api/problems/${topicId}`),
      apiFetch<{ topics: TopicMastery[] }>(`/api/progress/${sessionId}`).catch(() => ({ topics: [] as TopicMastery[] })),
      apiFetch<{ notes: string | null }>(`/api/topics/${topicId}/notes`).catch(() => ({ notes: null })),
    ]).then(([problemRes, progressRes, notesRes]) => {
      setProblems(problemRes.problems);
      const topicProgress = (progressRes.topics || []).find(t => t.topic === topicId);
      if (topicProgress) setMastery(topicProgress);
      setNotes(notesRes.notes);
    }).finally(() => setLoading(false));
  }, [topicId, sessionId]);

  const masteryPct = mastery ? Math.round(mastery.mastery * 100) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Back + Title + Mastery ring */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link
          to="/"
          style={{ display: 'flex', alignItems: 'center', marginLeft: -6, padding: 6, color: 'var(--text-tertiary)', textDecoration: 'none' }}
        >
          <ChevronLeft size={20} />
        </Link>
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: 0, fontSize: 'var(--text-title2)', fontWeight: 'var(--weight-bold)', color: 'var(--text-primary)', letterSpacing: '-0.018em' }}>
            {topicName}
          </h1>
          <p style={{ margin: '2px 0 0', fontSize: 'var(--text-caption)', color: 'var(--text-secondary)' }}>
            {problems.length} problems
            {mastery ? ` · ${mastery.correct}/${mastery.attempts} correct` : ''}
          </p>
        </div>
        {mastery && mastery.attempts > 0 && (
          <MasteryRing
            value={masteryPct}
            size={44}
            stroke={3}
            label={
              <span style={{ fontSize: '10px', fontWeight: 'var(--weight-bold)', color: 'var(--text-secondary)' }}>
                {masteryPct}%
              </span>
            }
          />
        )}
      </div>

      {/* Concept notes — file-based, works even without DB */}
      {notes && (
        <div style={{
          borderRadius: 'var(--radius-md)',
          background: 'var(--surface-card)',
          boxShadow: 'var(--shadow-raise)',
          overflow: 'hidden',
        }}>
          <button
            type="button"
            onClick={() => {
              setNotesOpen(o => !o);
              trackEvent('topic_notes_toggle', { topic: topicId, open: !notesOpen });
            }}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '14px 16px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
              textAlign: 'left',
            }}
          >
            <GraduationCap size={18} style={{ color: 'var(--indigo-ink)', flexShrink: 0 }} />
            <span style={{ flex: 1, fontSize: 'var(--text-body)', fontWeight: 'var(--weight-medium)', color: 'var(--text-primary)' }}>
              Concept notes
            </span>
            <ChevronDown
              size={16}
              style={{
                color: 'var(--text-tertiary)',
                transform: notesOpen ? 'rotate(180deg)' : 'none',
                transition: 'transform var(--dur-fast) var(--ease-out)',
              }}
            />
          </button>
          <AnimatePresence initial={false}>
            {notesOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.18, ease: [0.32, 0.72, 0, 1] }}
                style={{ overflow: 'hidden' }}
              >
                <div style={{ padding: '0 16px 16px', borderTop: 'var(--hairline) solid var(--separator)' }}>
                  <div className="prose prose-sm max-w-none" style={{ paddingTop: 12 }}>
                    <MarkdownAtomRenderer content={notes} atomId={`topic-notes-${topicId}`} />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Problem list */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} style={{ height: 72, borderRadius: 'var(--radius-md)', background: 'var(--surface-fill)' }} />
          ))}
        </div>
      ) : problems.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <BookOpen size={36} style={{ color: 'var(--text-tertiary)', margin: '0 auto 12px' }} />
          <p style={{ margin: '0 0 4px', fontSize: 'var(--text-body)', fontWeight: 'var(--weight-medium)', color: 'var(--text-secondary)' }}>
            Coming soon!
          </p>
          <p style={{ margin: '0 0 12px', fontSize: 'var(--text-footnote)', color: 'var(--text-tertiary)' }}>
            Problems for this topic are being verified and added.
          </p>
          <Link to="/" style={{ color: 'var(--indigo-ink)', fontSize: 'var(--text-footnote)', textDecoration: 'none' }}>
            Back to topics
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {problems.map((problem, i) => {
            const ds = DIFF_STYLE[problem.difficulty] || { color: 'var(--text-secondary)', bg: 'var(--surface-fill)' };
            return (
              <Link
                key={problem.id}
                to={`/practice/${problem.id}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '14px 0',
                  borderBottom: i < problems.length - 1 ? 'var(--hairline) solid var(--separator)' : 'none',
                  textDecoration: 'none',
                }}
                onClick={() => trackEvent('problem_view', { problemId: problem.id, topic: topicId })}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: '0 0 6px', fontSize: 'var(--text-body)', color: 'var(--text-primary)', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {problem.question_text.slice(0, 120)}{problem.question_text.length > 120 ? '…' : ''}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 'var(--text-caption)', color: 'var(--text-tertiary)' }}>
                      {problem.year ? `GATE ${problem.year}` : 'Generated · verified'}
                    </span>
                    <span style={{ width: 2, height: 2, borderRadius: '50%', background: 'var(--text-tertiary)', flexShrink: 0 }} />
                    <span style={{
                      fontSize: 'var(--text-caption2)',
                      fontWeight: 'var(--weight-semibold)',
                      padding: '1px 6px',
                      borderRadius: 'var(--radius-capsule)',
                      color: ds.color,
                      background: ds.bg,
                    }}>
                      {problem.difficulty}
                    </span>
                    <span style={{ width: 2, height: 2, borderRadius: '50%', background: 'var(--text-tertiary)', flexShrink: 0 }} />
                    <span style={{ fontSize: 'var(--text-caption)', color: 'var(--text-tertiary)' }}>{problem.marks}M</span>
                  </div>
                </div>
                <ChevronRight size={16} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
