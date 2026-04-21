import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  BookOpen, Download, Target, Layers, Clock, TrendingDown,
  Loader2, RefreshCw, ChevronDown, Lightbulb,
  MessageSquare, Camera, FileUp,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useAuth } from '@/contexts/AuthContext';
import { authFetch } from '@/lib/auth/client';
import { fadeInUp, staggerContainer } from '@/lib/animations';

interface NotebookEntry {
  id: string;
  kind: string;
  title: string;
  content: {
    text?: string;
    concept_id?: string;
    topic?: string;
    correct?: boolean;
    difficulty?: string;
  };
  created_at: string;
}

interface ClustersResp {
  clusters: Array<{
    concept_id: string | null;
    concept_label: string;
    topic: string | null;
    entry_count: number;
    entries: NotebookEntry[];
    last_touched: string | null;
  }>;
  total_entries: number;
}

interface GapsResp {
  topics: Array<{
    topic: string;
    total_concepts: number;
    covered_concepts: number;
    uncovered_concepts: string[];
    coverage_pct: number;
  }>;
  overall_coverage_pct: number;
  total_syllabus_concepts: number;
  total_covered: number;
}

type View = 'gaps' | 'clusters' | 'log';

export default function SmartNotebookPage() {
  const { user } = useAuth();
  const [view, setView] = useState<View>('gaps');
  const [clusters, setClusters] = useState<ClustersResp | null>(null);
  const [gaps, setGaps] = useState<GapsResp | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [clustersR, gapsR] = await Promise.all([
        authFetch('/api/notebook/clusters'),
        authFetch('/api/notebook/gaps'),
      ]);
      if (!clustersR.ok) { setError(`HTTP ${clustersR.status}`); return; }
      setClusters(await clustersR.json());
      if (gapsR.ok) setGaps(await gapsR.json());
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const downloadMarkdown = async () => {
    const r = await authFetch('/api/notebook/download');
    if (!r.ok) { alert('Download failed: ' + r.status); return; }
    const blob = await r.blob();
    const href = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = href;
    a.download = `vidhya-notebook-${new Date().toISOString().slice(0, 10)}.md`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(href);
  };

  if (!user) {
    return (
      <div className="max-w-md mx-auto p-6 text-center space-y-3">
        <BookOpen size={24} className="text-surface-600 mx-auto" />
        <p className="text-sm text-surface-300">Sign in to access your Smart Notebook.</p>
        <p className="text-xs text-surface-500">
          Every question you've asked, every concept you've studied, and every gap in your coverage — in one place.
        </p>
        <a href="/sign-in" className="inline-block px-4 py-2 rounded-lg bg-sky-500 text-white text-sm font-medium">
          Sign in with Google
        </a>
      </div>
    );
  }

  return (
    <motion.div className="space-y-4 max-w-4xl mx-auto" initial="hidden" animate="visible" variants={staggerContainer}>
      <motion.div variants={fadeInUp} className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-surface-100 flex items-center gap-2">
            <BookOpen size={20} className="text-sky-400" />
            Smart Notebook
          </h1>
          <p className="text-xs text-surface-500 mt-1">
            Every question, concept, gap — your single source of truth.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={downloadMarkdown}
            className="px-3 h-9 rounded-lg bg-sky-500 hover:bg-sky-400 text-white text-xs font-medium inline-flex items-center gap-1.5 transition-colors"
          >
            <Download size={13} />
            Download .md
          </button>
          <button
            onClick={refresh}
            disabled={loading}
            className="p-2 rounded-lg bg-surface-900 border border-surface-800 text-surface-400 hover:text-surface-200"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
          </button>
        </div>
      </motion.div>

      {error && (
        <motion.div variants={fadeInUp} className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-xs text-rose-300">
          {error}
        </motion.div>
      )}

      {clusters && gaps && (
        <motion.div variants={fadeInUp} className="grid grid-cols-3 gap-2">
          <Stat label="Entries" value={clusters.total_entries} tone="sky" />
          <Stat label="Concepts touched" value={gaps.total_covered} tone="emerald" />
          <Stat label="Coverage" value={`${gaps.overall_coverage_pct}%`} tone="amber" />
        </motion.div>
      )}

      <motion.div variants={fadeInUp} className="inline-flex rounded-lg bg-surface-900 border border-surface-800 p-0.5 gap-0.5">
        <Tab active={view === 'gaps'} onClick={() => setView('gaps')} icon={Target} label="Gaps" />
        <Tab active={view === 'clusters'} onClick={() => setView('clusters')} icon={Layers} label="By concept" />
        <Tab active={view === 'log'} onClick={() => setView('log')} icon={Clock} label="Timeline" />
      </motion.div>

      {loading && !clusters ? (
        <div className="text-center py-12 text-surface-500 text-sm">
          <Loader2 size={14} className="inline animate-spin mr-2" />Loading...
        </div>
      ) : (
        <>
          {view === 'gaps' && <GapsView gaps={gaps} />}
          {view === 'clusters' && <ClustersView clusters={clusters} />}
          {view === 'log' && <LogView clusters={clusters} />}
        </>
      )}

      <motion.div variants={fadeInUp} className="p-3 rounded-xl bg-sky-500/5 border border-sky-500/20 flex items-start gap-2.5">
        <Lightbulb size={13} className="shrink-0 mt-0.5 text-sky-400" />
        <div className="text-[11px] text-sky-200/80 leading-relaxed">
          <span className="font-medium text-sky-300">How it works.</span>{' '}
          Every question in chat, every snap, every lesson you open becomes an entry. Auto-clustered by concept. Gaps = syllabus concepts you haven't touched yet. Download anytime as a study reference.
        </div>
      </motion.div>
    </motion.div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string | number; tone: 'sky' | 'emerald' | 'amber' }) {
  const t = tone === 'sky' ? 'text-sky-300' : tone === 'emerald' ? 'text-emerald-300' : 'text-amber-300';
  return (
    <div className="p-3 rounded-xl bg-surface-900 border border-surface-800 text-center">
      <p className={clsx('text-2xl font-bold', t)}>{value}</p>
      <p className="text-[10px] text-surface-500 uppercase tracking-wide">{label}</p>
    </div>
  );
}

function Tab({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: typeof Target; label: string }) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'px-3 h-8 rounded-md text-xs font-medium inline-flex items-center gap-1.5 transition-colors',
        active ? 'bg-sky-500/20 text-sky-200 border border-sky-500/30' : 'text-surface-400 hover:text-surface-200',
      )}
    >
      <Icon size={12} />
      {label}
    </button>
  );
}

function GapsView({ gaps }: { gaps: GapsResp | null }) {
  if (!gaps || gaps.topics.length === 0) {
    return <div className="p-6 rounded-xl bg-surface-900 border border-surface-800 text-center text-sm text-surface-500">No syllabus data yet.</div>;
  }
  return (
    <motion.div variants={fadeInUp} className="space-y-2">
      {gaps.topics.map(topic => {
        const emoji = topic.coverage_pct >= 80 ? '🟢' : topic.coverage_pct >= 50 ? '🟡' : '🔴';
        return (
          <details key={topic.topic} className="group rounded-xl bg-surface-900 border border-surface-800 open:border-surface-700">
            <summary className="p-3 cursor-pointer flex items-center gap-3 list-none">
              <span className="shrink-0">{emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-surface-200 capitalize">{topic.topic.replace(/-/g, ' ')}</p>
                <p className="text-[10px] text-surface-500">{topic.covered_concepts} of {topic.total_concepts} concepts touched</p>
              </div>
              <p className={clsx(
                'text-lg font-bold shrink-0',
                topic.coverage_pct >= 80 ? 'text-emerald-400' : topic.coverage_pct >= 50 ? 'text-amber-400' : 'text-rose-400',
              )}>{topic.coverage_pct}%</p>
              <ChevronDown size={13} className="text-surface-600 group-open:rotate-180 transition-transform" />
            </summary>
            {topic.uncovered_concepts.length > 0 && (
              <div className="px-3 pb-3 pt-1 border-t border-surface-800">
                <p className="text-[10px] text-surface-500 uppercase tracking-wide mb-1.5">{topic.uncovered_concepts.length} not yet touched</p>
                <div className="grid grid-cols-2 gap-1">
                  {topic.uncovered_concepts.slice(0, 12).map(c => (
                    <div key={c} className="flex items-center gap-1.5 text-[11px] text-surface-400">
                      <TrendingDown size={9} className="shrink-0 text-amber-400" />
                      <span className="capitalize truncate">{c.replace(/-/g, ' ')}</span>
                    </div>
                  ))}
                </div>
                {topic.uncovered_concepts.length > 12 && (
                  <p className="text-[10px] text-surface-600 mt-1">+{topic.uncovered_concepts.length - 12} more…</p>
                )}
              </div>
            )}
          </details>
        );
      })}
    </motion.div>
  );
}

function ClustersView({ clusters }: { clusters: ClustersResp | null }) {
  if (!clusters || clusters.total_entries === 0) {
    return (
      <div className="p-6 rounded-xl bg-surface-900 border border-surface-800 text-center space-y-2">
        <BookOpen size={24} className="text-surface-600 mx-auto" />
        <p className="text-sm text-surface-400">Your notebook is empty.</p>
        <p className="text-xs text-surface-500">Ask a question in chat or snap a problem — entries appear here automatically.</p>
      </div>
    );
  }
  return (
    <motion.div variants={fadeInUp} className="space-y-2">
      {clusters.clusters.map(cluster => (
        <details key={(cluster.concept_id || 'none') + cluster.concept_label} className="group rounded-xl bg-surface-900 border border-surface-800 open:border-surface-700">
          <summary className="p-3 cursor-pointer flex items-center gap-3 list-none">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-surface-200 capitalize">{cluster.concept_label.replace(/-/g, ' ')}</p>
              {cluster.topic && <p className="text-[10px] text-surface-500">{cluster.topic}</p>}
            </div>
            <span className="text-[10px] text-surface-400 shrink-0">{cluster.entry_count} entries</span>
            <ChevronDown size={13} className="text-surface-600 group-open:rotate-180 transition-transform" />
          </summary>
          <div className="px-3 pb-3 pt-1 border-t border-surface-800 space-y-1.5">
            {cluster.entries.slice(0, 20).map(entry => <EntryRow key={entry.id} entry={entry} />)}
            {cluster.entries.length > 20 && (
              <p className="text-[10px] text-surface-600 italic text-center pt-2">+{cluster.entries.length - 20} more in this concept</p>
            )}
          </div>
        </details>
      ))}
    </motion.div>
  );
}

function LogView({ clusters }: { clusters: ClustersResp | null }) {
  if (!clusters || clusters.total_entries === 0) return <div className="p-6 rounded-xl bg-surface-900 border border-surface-800 text-center text-sm text-surface-500">No entries yet.</div>;
  const all = clusters.clusters.flatMap(c => c.entries);
  all.sort((a, b) => b.created_at.localeCompare(a.created_at));
  const byDate: Record<string, NotebookEntry[]> = {};
  for (const e of all) {
    const date = e.created_at.slice(0, 10);
    if (!byDate[date]) byDate[date] = [];
    byDate[date].push(e);
  }
  return (
    <motion.div variants={fadeInUp} className="space-y-4">
      {Object.entries(byDate).slice(0, 14).map(([date, entries]) => (
        <div key={date}>
          <p className="text-[10px] text-surface-500 uppercase tracking-wide mb-2">{date}</p>
          <div className="space-y-1.5">
            {entries.map(e => <EntryRow key={e.id} entry={e} />)}
          </div>
        </div>
      ))}
    </motion.div>
  );
}

function EntryRow({ entry }: { entry: NotebookEntry }) {
  const Icon = ({
    chat_question: MessageSquare, snap: Camera, lesson_viewed: BookOpen,
    problem_attempted: Target, material_uploaded: FileUp,
    diagnostic_taken: Target, note: BookOpen,
  }[entry.kind] || BookOpen);
  return (
    <div className="p-2.5 rounded-lg bg-surface-950/60 border border-surface-800/60 flex items-start gap-2">
      <Icon size={11} className="shrink-0 mt-0.5 text-surface-500" />
      <div className="flex-1 min-w-0">
        <p className="text-[12px] text-surface-200 leading-snug">{entry.title}</p>
        {entry.content.text && entry.content.text.length < 300 && (
          <p className="text-[11px] text-surface-500 leading-relaxed mt-0.5 line-clamp-2">{entry.content.text}</p>
        )}
        <p className="text-[10px] text-surface-600 mt-0.5">
          {entry.created_at.slice(11, 16)}
          {entry.content.correct !== undefined && (
            <span className={clsx('ml-2', entry.content.correct ? 'text-emerald-400' : 'text-amber-400')}>
              {entry.content.correct ? '✓' : '✗'}
            </span>
          )}
        </p>
      </div>
    </div>
  );
}
