/**
 * NotebookPage — Smart Notebook that auto-logs every query, structured by topic.
 */

import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { BookOpen, MessageCircle, CheckCircle, Pen, ChevronDown, ChevronRight } from 'lucide-react';
import { useSession } from '@/hooks/useSession';
import { apiFetch } from '@/hooks/useApi';
import { trackEvent } from '@/lib/analytics';
import { FilterPill } from '@/components/ui/FilterPill';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';

interface NotebookEntry {
  id: string;
  source: 'chat' | 'practice' | 'verify' | 'manual';
  topic: string;
  query_text: string;
  answer_text: string | null;
  status: 'mastered' | 'in_progress' | 'to_review';
  confidence: number;
  created_at: string;
}

interface TopicSummary {
  topic: string;
  total: number;
  mastered: number;
  inProgress: number;
  toReview: number;
}

const SOURCE_ICONS = {
  chat: MessageCircle,
  practice: Pen,
  verify: CheckCircle,
  manual: BookOpen,
};

const STATUS_TONE: Record<string, 'mastery' | 'warning' | 'neutral'> = {
  mastered: 'mastery',
  in_progress: 'warning',
  to_review: 'neutral',
};

const STATUS_LABELS = {
  mastered: 'Mastered',
  in_progress: 'In Progress',
  to_review: 'To Review',
};

// Dot colours matching Clarity status semantics
const STATUS_DOT: Record<string, string> = {
  mastered: 'var(--green)',
  in_progress: 'var(--orange)',
  to_review: 'var(--text-tertiary)',
};

function formatTopicName(id: string): string {
  return id.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
}

export default function NotebookPage() {
  const sessionId = useSession();
  const [entries, setEntries] = useState<NotebookEntry[]>([]);
  const [summary, setSummary] = useState<TopicSummary[]>([]);
  const [totalEntries, setTotalEntries] = useState(0);
  const [selectedTopic, setSelectedTopic] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [entriesRes, summaryRes] = await Promise.all([
        apiFetch<{ entries: NotebookEntry[]; total: number }>(
          `/api/notebook/${sessionId}${selectedTopic !== 'all' ? `?topic=${selectedTopic}` : ''}`
        ),
        apiFetch<{ topics: TopicSummary[]; totalEntries: number }>(`/api/notebook/${sessionId}/summary`),
      ]);
      setEntries(entriesRes.entries);
      setSummary(summaryRes.topics);
      setTotalEntries(summaryRes.totalEntries);
    } catch {
      // Silently handle — empty state shown
    } finally {
      setLoading(false);
    }
  }, [sessionId, selectedTopic]);

  useEffect(() => {
    trackEvent('page_view', { page: 'notebook' });
    fetchData();
  }, [fetchData]);

  const updateStatus = async (entryId: string, status: string) => {
    try {
      await apiFetch(`/api/notebook/${sessionId}/${entryId}`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
      setEntries(prev => prev.map(e => e.id === entryId ? { ...e, status: status as any } : e));
      trackEvent('notebook_status_update', { status });
    } catch {}
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ height: 32, width: 120, borderRadius: 8, background: 'var(--surface-fill)' }} />
        <div style={{ height: 48, borderRadius: 'var(--radius-capsule)', background: 'var(--surface-fill)' }} />
        {[1, 2, 3].map(i => (
          <div key={i} style={{ height: 72, borderRadius: 'var(--radius-md)', background: 'var(--surface-fill)' }} />
        ))}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <h1 style={{ margin: 0, fontSize: 'var(--text-title2)', fontWeight: 'var(--weight-bold)', color: 'var(--text-primary)', letterSpacing: '-0.018em' }}>
        Notes
      </h1>

      {/* Topic filter pills */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none' }}>
        <FilterPill
          active={selectedTopic === 'all'}
          onClick={() => setSelectedTopic('all')}
        >
          All ({totalEntries})
        </FilterPill>
        {summary.map(t => (
          <FilterPill
            key={t.topic}
            active={selectedTopic === t.topic}
            onClick={() => setSelectedTopic(t.topic)}
          >
            {formatTopicName(t.topic)} ({t.total})
          </FilterPill>
        ))}
      </div>

      {/* Entries list */}
      {entries.length === 0 ? (
        <EmptyState
          title="Your notebook is empty"
          glyph={<BookOpen size={28} style={{ color: 'var(--text-tertiary)' }} />}
          body="Start chatting with the AI tutor or practising problems — your learning trail will appear here automatically."
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {entries.map((entry, i) => {
            const SourceIcon = SOURCE_ICONS[entry.source] || BookOpen;
            const isExpanded = expandedId === entry.id;
            return (
              <div
                key={entry.id}
                style={{
                  borderBottom: i < entries.length - 1 ? 'var(--hairline) solid var(--separator)' : 'none',
                }}
              >
                <button
                  onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '14px 0',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-sans)',
                    textAlign: 'left',
                  }}
                >
                  {/* Status dot */}
                  <span
                    style={{
                      width: 9,
                      height: 9,
                      borderRadius: '50%',
                      background: STATUS_DOT[entry.status],
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 'var(--text-body)',
                        color: 'var(--text-primary)',
                        letterSpacing: '-0.01em',
                        overflow: 'hidden',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                      }}
                    >
                      {entry.query_text}
                    </p>
                  </div>
                  <span style={{ fontSize: 'var(--text-caption2)', color: 'var(--text-tertiary)', flexShrink: 0 }}>{timeAgo(entry.created_at)}</span>
                  {isExpanded
                    ? <ChevronDown size={14} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
                    : <ChevronRight size={14} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />}
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.18, ease: [0.32, 0.72, 0, 1] }}
                      style={{ overflow: 'hidden' }}
                    >
                      <div style={{ paddingBottom: 14 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                          <span style={{ fontSize: 'var(--text-caption)', fontFamily: 'var(--font-mono)', color: 'var(--indigo-ink)' }}>
                            {formatTopicName(entry.topic)}
                          </span>
                          <SourceIcon size={10} style={{ color: 'var(--text-tertiary)' }} />
                        </div>
                        {entry.answer_text && (
                          <p style={{ margin: '0 0 12px', fontSize: 'var(--text-footnote)', color: 'var(--text-secondary)', lineHeight: 'var(--leading-normal)', whiteSpace: 'pre-wrap' }}>
                            {entry.answer_text}
                          </p>
                        )}
                        <div style={{ display: 'flex', gap: 8 }}>
                          {(['mastered', 'in_progress', 'to_review'] as const).map(s => (
                            <button
                              key={s}
                              onClick={(e) => { e.stopPropagation(); updateStatus(entry.id, s); }}
                              style={{
                                padding: '4px 10px',
                                borderRadius: 'var(--radius-xs)',
                                border: entry.status === s
                                  ? `1px solid ${s === 'mastered' ? 'var(--green)' : s === 'in_progress' ? 'var(--orange)' : 'var(--separator)'}`
                                  : '1px solid var(--separator)',
                                background: entry.status === s
                                  ? s === 'mastered' ? 'rgba(52,199,89,.12)' : s === 'in_progress' ? 'rgba(255,159,10,.12)' : 'var(--surface-fill)'
                                  : 'var(--surface-fill)',
                                color: entry.status === s
                                  ? s === 'mastered' ? 'var(--green-ink)' : s === 'in_progress' ? 'var(--orange)' : 'var(--text-secondary)'
                                  : 'var(--text-tertiary)',
                                fontSize: 'var(--text-caption)',
                                fontWeight: 'var(--weight-semibold)',
                                cursor: 'pointer',
                                fontFamily: 'var(--font-sans)',
                              }}
                            >
                              {STATUS_LABELS[s]}
                            </button>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
