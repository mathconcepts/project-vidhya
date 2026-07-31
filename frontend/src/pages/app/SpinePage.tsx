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
import { fadeInUp, staggerContainer } from '@/lib/animations';
import { ReceiptBorder } from '@/components/ui/ReceiptBorder';
import {
  Grid3x3, Activity, GitBranch, Circle, BarChart, Hash, Repeat, Layers, Share2, Navigation,
  BookOpen, Target, CheckCircle2, RotateCcw, ChevronDown, ChevronRight,
} from 'lucide-react';
import { clsx } from 'clsx';

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
      // Session-scoped and can legitimately be empty (anonymous, no
      // attempts yet) — never blocks the rest of the screen.
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
      <div className="space-y-3">
        <div className="h-7 w-48 rounded bg-surface-800/60 animate-pulse" />
        <div className="h-4 w-64 rounded bg-surface-800/60 animate-pulse" />
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-28 rounded-xl bg-surface-800/60 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!rows || rows.length === 0) {
    return (
      <div className="text-center py-16 space-y-3">
        <BookOpen size={40} className="text-surface-700 mx-auto" />
        <h2 className="font-display text-xl font-semibold text-surface-300">Can't load the spine right now</h2>
        <p className="text-sm text-surface-500">Topic data is temporarily unavailable — try again shortly.</p>
      </div>
    );
  }

  return (
    <motion.div className="space-y-5" initial="hidden" animate="visible" variants={staggerContainer}>
      <motion.div variants={fadeInUp}>
        <h1 className="font-display text-xl font-semibold text-surface-100">
          Learn &rarr; Practice &rarr; Prove &rarr; Retain
        </h1>
        <p className="text-sm text-surface-400 mt-1">
          What's real for each topic today — expanding is an honest label, not a delay.
        </p>
      </motion.div>

      <motion.div variants={fadeInUp}>
        <button
          onClick={() => setLegendOpen(o => !o)}
          aria-expanded={legendOpen}
          className="flex items-center gap-1.5 text-xs text-surface-500 hover:text-surface-300 transition-colors cursor-pointer touch-manipulation"
        >
          {legendOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          What do these mean?
        </button>
        {legendOpen && (
          <dl className="mt-2 grid grid-cols-1 gap-2 text-xs text-surface-400 bg-surface-900 border border-surface-800 rounded-lg p-3">
            <div><dt className="inline font-semibold text-surface-300">Learn — </dt><dd className="inline">understand the concept, with a real explainer behind it.</dd></div>
            <div><dt className="inline font-semibold text-surface-300">Practice — </dt><dd className="inline">work real, marked problems on this topic.</dd></div>
            <div><dt className="inline font-semibold text-surface-300">Prove — </dt><dd className="inline">your verified accuracy from actual attempts, not an estimate.</dd></div>
            <div><dt className="inline font-semibold text-surface-300">Retain — </dt><dd className="inline">spaced review keeping marks you've already earned.</dd></div>
          </dl>
        )}
      </motion.div>

      <motion.div className="space-y-3" variants={staggerContainer}>
        {rows.map(row => (
          <SpineRow key={row.id} row={row} />
        ))}
      </motion.div>
    </motion.div>
  );
}

// ============================================================================
// Row
// ============================================================================

function SpineRow({ row }: { row: Row }) {
  const Icon = ICON_MAP[row.icon] || Grid3x3;

  return (
    <motion.div variants={fadeInUp} className="rounded-xl bg-surface-900 border border-surface-800 p-3">
      <Link to={`/topic/${row.id}`} className="flex items-center gap-2.5 mb-3 group">
        <div className="w-8 h-8 rounded-lg bg-surface-800 flex items-center justify-center shrink-0 group-hover:bg-surface-700 transition-colors">
          <Icon size={16} className="text-surface-300" />
        </div>
        <span className="font-display text-[18px] font-medium text-surface-100 group-hover:text-emerald-300 transition-colors truncate">
          {row.name}
        </span>
        {row.weightPct > 0 && (
          <span className="ml-auto text-[10px] font-mono text-surface-500 shrink-0">{row.weightPct}% marks</span>
        )}
      </Link>

      <div className="grid grid-cols-2 gap-2">
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
  const toneClasses =
    tone === 'lit'
      ? 'border-emerald-500/25 bg-emerald-500/5'
      : tone === 'partial'
      ? 'border-surface-700 bg-surface-800/40'
      : 'border-surface-800 bg-surface-950/40';

  const content = (
    <div className={clsx('rounded-lg border p-2.5 h-full', toneClasses)}>
      <div className="flex items-center gap-1.5 mb-1">
        <SegIcon size={11} className={tone === 'lit' ? 'text-emerald-400' : 'text-surface-500'} />
        <span className="text-[10px] font-semibold uppercase tracking-wide text-surface-500">{label}</span>
      </div>
      <p className={clsx('text-[13px] font-mono leading-tight', tone === 'lit' ? 'text-emerald-300' : tone === 'partial' ? 'text-surface-300' : 'text-surface-500 italic font-sans')}>
        {primary}
      </p>
      <p className="text-[10px] text-surface-500 mt-0.5 leading-tight">{secondary}</p>
    </div>
  );

  if (verified) {
    return <ReceiptBorder receipt={{ verified: true }} className="h-full">{content}</ReceiptBorder>;
  }
  return content;
}

// ============================================================================
// Learn — bundle-metadata signal (src/content/resolver.ts explainerCoverageByTopic)
// ============================================================================

function LearnSegment({ learn }: { learn: SpineLearnTopic | null }) {
  if (!learn || learn.total_concepts === 0) {
    return (
      <SegmentShell
        icon={BookOpen}
        label="Learn"
        tone="muted"
        primary="Expanding"
        secondary="No explainers yet"
      />
    );
  }

  if (learn.status === 'expanding') {
    return (
      <SegmentShell
        icon={BookOpen}
        label="Learn"
        tone="muted"
        primary="Expanding"
        secondary={`0/${learn.total_concepts} concepts explained`}
      />
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
// Practice — GET /api/topics problemCount (DB-first, static-fallback; same
// number TopicPage already shows)
// ============================================================================

function PracticeSegment({ problemCount, topicId: _topicId }: { problemCount: number; topicId: string }) {
  if (problemCount <= 0) {
    return (
      <SegmentShell
        icon={Target}
        label="Practice"
        tone="muted"
        primary="Expanding"
        secondary="No problems yet"
      />
    );
  }
  return (
    <SegmentShell
      icon={Target}
      label="Practice"
      tone="lit"
      primary={`${problemCount} problems`}
      secondary="Real, marked questions"
    />
  );
}

// ============================================================================
// Prove — GET /api/progress/:sessionId (real attempts only; no attempts,
// no percentage)
// ============================================================================

function ProveSegment({ progress, topicId: _topicId }: { progress: ProgressTopic | null; topicId: string }) {
  if (!progress || progress.attempts === 0) {
    return (
      <SegmentShell
        icon={CheckCircle2}
        label="Prove"
        tone="muted"
        primary="Not started"
        secondary="No attempts yet"
      />
    );
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
// Retain — GET /api/progress/:sessionId's `due` (spaced-review scheduling
// only exists once real attempts have been recorded for the topic)
// ============================================================================

function RetainSegment({ progress }: { progress: ProgressTopic | null }) {
  if (!progress || progress.attempts === 0) {
    return (
      <SegmentShell
        icon={RotateCcw}
        label="Retain"
        tone="muted"
        primary="Not scheduled"
        secondary="Starts after practice"
      />
    );
  }
  if (progress.due === 0) {
    return (
      <SegmentShell
        icon={RotateCcw}
        label="Retain"
        tone="lit"
        primary="All caught up"
        secondary="Nothing due right now"
      />
    );
  }
  return (
    <SegmentShell
      icon={RotateCcw}
      label="Retain"
      tone="lit"
      primary={`${progress.due} due`}
      secondary="Scheduled for review"
    />
  );
}
