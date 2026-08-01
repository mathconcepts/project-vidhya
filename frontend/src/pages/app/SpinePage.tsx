/**
 * SpinePage — the "spine screen" (U1-4, Vidhya Master Design & Backlog §5.1).
 *
 * One dashboard: topics × the four loop segments (Learn / Practice / Prove /
 * Retain). This IS the "not just a question bank" claim, made checkable at
 * a glance — so every segment must be backed by a real, checkable fact.
 * Design law #1 (labels never lie): a segment with no real signal renders
 * as an honest "expanding" / "not started" state, never a fabricated bar
 * or percentage.
 *
 * Data sources (no new engine calls — Learning Platform Narrative Design
 * §3.2's explicit constraint):
 *   - GET /api/spine               — Learn depth per topic (bundle metadata)
 *   - GET /api/topics               — Practice content availability
 *   - GET /api/progress/:sessionId  — Prove (mastery from real attempts)
 *                                      + Retain (spaced-review scheduling)
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { apiFetch } from '@/hooks/useApi';
import { useSession } from '@/hooks/useSession';
import { trackEvent } from '@/lib/analytics';
import { ReceiptBorder } from '@/components/ui/ReceiptBorder';
import {
  Grid3x3, Activity, GitBranch, Circle, BarChart, Hash, Repeat, Layers, Share2, Navigation,
  BookOpen, Target, CheckCircle2, RotateCcw, ChevronDown, ChevronRight,
} from 'lucide-react';

const ICON_MAP: Record<string, React.ElementType> = {
  'grid': Grid3x3, 'activity': Activity, 'git-branch': GitBranch,
  'circle': Circle, 'bar-chart': BarChart, 'hash': Hash,
  'repeat': Repeat, 'layers': Layers, 'share-2': Share2, 'navigation': Navigation,
};

// ============================================================================
// Types (mirroring the three source endpoints — no new shapes invented)
// ============================================================================

interface SpineLearnTopic {
  topic: string;
  name: string;
  icon: string;
  weight_pct: number;
  total_concepts: number;
  curated_concepts: number;
  status: 'available' | 'partial' | 'expanding';
}

interface TopicListEntry {
  id: string;
  name: string;
  icon: string;
  problemCount: number;
}

interface ProgressTopic {
  topic: string;
  totalProblems: number;
  correct: number;
  attempts: number;
  mastery: number;
  easiness: number;
  due: number;
}

interface Row {
  id: string;
  name: string;
  icon: string;
  weightPct: number;
  learn: SpineLearnTopic | null;
  problemCount: number;
  progress: ProgressTopic | null;
}

// ============================================================================
// Component
// ============================================================================

export default function SpinePage() {
  const sessionId = useSession();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [legendOpen, setLegendOpen] = useState(false);

  useEffect(() => {
    trackEvent('page_view', { page: 'spine' });

    Promise.all([
      apiFetch<{ learn: SpineLearnTopic[] }>('/api/spine'),
      apiFetch<{ topics: TopicListEntry[] }>('/api/topics'),
      apiFetch<{ topics: ProgressTopic[] }>(`/api/progress/${sessionId}`).catch(() => ({ topics: [] as ProgressTopic[] })),
    ])
      .then(([spine, topicsRes, progressRes]) => {
        const learnByTopic = new Map(spine.learn.map(l => [l.topic, l]));
        const progressByTopic = new Map(progressRes.topics.map(p => [p.topic, p]));

        const merged: Row[] = topicsRes.topics.map(t => ({
          id: t.id,
          name: t.name,
          icon: t.icon,
          weightPct: learnByTopic.get(t.id)?.weight_pct ?? 0,
          learn: learnByTopic.get(t.id) ?? null,
          problemCount: t.problemCount,
          progress: progressByTopic.get(t.id) ?? null,
        }));
        setRows(merged);
      })
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [sessionId]);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ height: 28, width: 192, borderRadius: 'var(--radius-sm)', background: 'var(--surface-fill)' }} className="animate-pulse" />
        <div style={{ height: 16, width: 256, borderRadius: 'var(--radius-sm)', background: 'var(--surface-fill)' }} className="animate-pulse" />
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} style={{ height: 112, borderRadius: 'var(--radius-md)', background: 'var(--surface-fill)' }} className="animate-pulse" />
        ))}
      </div>
    );
  }

  if (!rows || rows.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '64px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <BookOpen size={40} style={{ color: 'var(--text-tertiary)' }} />
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 'var(--weight-semibold)', color: 'var(--text-secondary)' }}>Can't load the spine right now</h2>
        <p style={{ margin: 0, fontSize: 'var(--text-caption)', color: 'var(--text-tertiary)' }}>Topic data is temporarily unavailable — try again shortly.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 'var(--weight-semibold)', color: 'var(--text-primary)' }}>
          Learn → Practice → Prove → Retain
        </h1>
        <p style={{ margin: '4px 0 0', fontSize: 'var(--text-caption)', color: 'var(--text-secondary)' }}>
          What's real for each topic today — expanding is an honest label, not a delay.
        </p>
      </div>

      <div>
        <button
          onClick={() => setLegendOpen(o => !o)}
          aria-expanded={legendOpen}
          style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-tertiary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          {legendOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          What do these mean?
        </button>
        {legendOpen && (
          <dl style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8, fontSize: 11, color: 'var(--text-tertiary)', background: 'var(--surface-card)', border: 'var(--hairline) solid var(--separator)', borderRadius: 'var(--radius-sm)', padding: 12 }}>
            <div><dt style={{ display: 'inline', fontWeight: 'var(--weight-semibold)', color: 'var(--text-secondary)' }}>Learn — </dt><dd style={{ display: 'inline', margin: 0 }}>understand the concept, with a real explainer behind it.</dd></div>
            <div><dt style={{ display: 'inline', fontWeight: 'var(--weight-semibold)', color: 'var(--text-secondary)' }}>Practice — </dt><dd style={{ display: 'inline', margin: 0 }}>work real, marked problems on this topic.</dd></div>
            <div><dt style={{ display: 'inline', fontWeight: 'var(--weight-semibold)', color: 'var(--text-secondary)' }}>Prove — </dt><dd style={{ display: 'inline', margin: 0 }}>your verified accuracy from actual attempts, not an estimate.</dd></div>
            <div><dt style={{ display: 'inline', fontWeight: 'var(--weight-semibold)', color: 'var(--text-secondary)' }}>Retain — </dt><dd style={{ display: 'inline', margin: 0 }}>spaced review keeping marks you've already earned.</dd></div>
          </dl>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {rows.map(row => (
          <SpineRow key={row.id} row={row} />
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Row
// ============================================================================

function SpineRow({ row }: { row: Row }) {
  const Icon = ICON_MAP[row.icon] || Grid3x3;

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ borderRadius: 'var(--radius-md)', background: 'var(--surface-card)', border: 'var(--hairline) solid var(--separator)', padding: 12 }}
    >
      <Link to={`/topic/${row.id}`} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, textDecoration: 'none' }}>
        <div style={{ width: 32, height: 32, borderRadius: 'var(--radius-sm)', background: 'var(--surface-fill)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon size={16} style={{ color: 'var(--text-secondary)' }} />
        </div>
        <span style={{ fontSize: 17, fontWeight: 'var(--weight-medium)', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, minWidth: 0 }}>
          {row.name}
        </span>
        {row.weightPct > 0 && (
          <span style={{ marginLeft: 'auto', fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)', flexShrink: 0 }}>{row.weightPct}% marks</span>
        )}
      </Link>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <LearnSegment learn={row.learn} />
        <PracticeSegment problemCount={row.problemCount} topicId={row.id} />
        <ProveSegment progress={row.progress} topicId={row.id} />
        <RetainSegment progress={row.progress} />
      </div>
    </motion.div>
  );
}

// ============================================================================
// Segment shell — shared visual language for the four cells
// ============================================================================

type SegmentTone = 'lit' | 'partial' | 'muted';

function SegmentShell({
  icon: SegIcon,
  label,
  tone,
  primary,
  secondary,
  verified,
}: {
  icon: React.ElementType;
  label: string;
  tone: SegmentTone;
  primary: string;
  secondary: string;
  verified?: boolean;
}) {
  const containerStyle: React.CSSProperties = {
    borderRadius: 'var(--radius-sm)',
    border: tone === 'lit'
      ? '1px solid rgba(52,199,89,.25)'
      : tone === 'partial'
      ? 'var(--hairline) solid var(--separator)'
      : 'var(--hairline) solid var(--separator)',
    background: tone === 'lit'
      ? 'rgba(52,199,89,.05)'
      : tone === 'partial'
      ? 'var(--surface-fill)'
      : 'var(--surface-fill)',
    padding: 10,
    height: '100%',
    boxSizing: 'border-box' as const,
    opacity: tone === 'muted' ? 0.7 : 1,
  };

  const content = (
    <div style={containerStyle}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
        <SegIcon size={11} style={{ color: tone === 'lit' ? 'var(--green-ink)' : 'var(--text-tertiary)' }} />
        <span style={{ fontSize: 10, fontWeight: 'var(--weight-semibold)', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-tertiary)' }}>{label}</span>
      </div>
      <p style={{
        margin: '0 0 2px',
        fontSize: 13,
        fontFamily: tone === 'muted' ? 'var(--font-sans)' : 'var(--font-mono)',
        fontStyle: tone === 'muted' ? 'italic' : 'normal',
        lineHeight: 1.3,
        color: tone === 'lit' ? 'var(--green-ink)' : tone === 'partial' ? 'var(--text-secondary)' : 'var(--text-tertiary)',
      }}>
        {primary}
      </p>
      <p style={{ margin: 0, fontSize: 10, color: 'var(--text-tertiary)', lineHeight: 1.3 }}>{secondary}</p>
    </div>
  );

  if (verified) {
    return <ReceiptBorder receipt={{ verified: true }} className="h-full">{content}</ReceiptBorder>;
  }
  return content;
}

// ============================================================================
// Learn
// ============================================================================

function LearnSegment({ learn }: { learn: SpineLearnTopic | null }) {
  if (!learn || learn.total_concepts === 0) {
    return (
      <SegmentShell icon={BookOpen} label="Learn" tone="muted" primary="Expanding" secondary="No explainers yet" />
    );
  }
  if (learn.status === 'expanding') {
    return (
      <SegmentShell icon={BookOpen} label="Learn" tone="muted" primary="Expanding" secondary={`0/${learn.total_concepts} concepts explained`} />
    );
  }
  return (
    <SegmentShell
      icon={BookOpen}
      label="Learn"
      tone={learn.status === 'available' ? 'lit' : 'partial'}
      primary={`${learn.curated_concepts}/${learn.total_concepts} concepts`}
      secondary={learn.status === 'available' ? 'Full chapter depth' : 'Partial chapter depth'}
    />
  );
}

// ============================================================================
// Practice
// ============================================================================

function PracticeSegment({ problemCount, topicId: _topicId }: { problemCount: number; topicId: string }) {
  if (problemCount <= 0) {
    return <SegmentShell icon={Target} label="Practice" tone="muted" primary="Expanding" secondary="No problems yet" />;
  }
  return (
    <SegmentShell icon={Target} label="Practice" tone="lit" primary={`${problemCount} problems`} secondary="Real, marked questions" />
  );
}

// ============================================================================
// Prove
// ============================================================================

function ProveSegment({ progress, topicId: _topicId }: { progress: ProgressTopic | null; topicId: string }) {
  if (!progress || progress.attempts === 0) {
    return <SegmentShell icon={CheckCircle2} label="Prove" tone="muted" primary="Not started" secondary="No attempts yet" />;
  }
  const masteryPct = Math.round(progress.mastery * 100);
  return (
    <SegmentShell
      icon={CheckCircle2}
      label="Prove"
      tone="lit"
      primary={`${masteryPct}% accuracy`}
      secondary={`from ${progress.attempts} verified attempt${progress.attempts === 1 ? '' : 's'}`}
      verified
    />
  );
}

// ============================================================================
// Retain
// ============================================================================

function RetainSegment({ progress }: { progress: ProgressTopic | null }) {
  if (!progress || progress.attempts === 0) {
    return <SegmentShell icon={RotateCcw} label="Retain" tone="muted" primary="Not scheduled" secondary="Starts after practice" />;
  }
  if (progress.due === 0) {
    return <SegmentShell icon={RotateCcw} label="Retain" tone="lit" primary="All caught up" secondary="Nothing due right now" />;
  }
  return <SegmentShell icon={RotateCcw} label="Retain" tone="lit" primary={`${progress.due} due`} secondary="Scheduled for review" />;
}
