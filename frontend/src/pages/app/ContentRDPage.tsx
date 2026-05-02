/**
 * ContentRDPage — admin page at /admin/content-rd.
 *
 * The operator's primary surface for the Content R&D Loop:
 *   1. Launch a generation run (with live cost estimate)
 *   2. Watch active runs progress
 *   3. Read effectiveness ledger to decide which experiments to promote
 *
 * Auth: admin role only. Falls back to gentle gate for non-admins.
 */

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Shield, Loader2, FlaskConical } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { trackEvent } from '@/lib/analytics';
import { fadeInUp, staggerContainer } from '@/lib/animations';
import { RunLauncher } from '@/components/admin/RunLauncher';
import { ActiveRunsPanel } from '@/components/admin/ActiveRunsPanel';
import { EffectivenessLedger } from '@/components/admin/EffectivenessLedger';
import {
  listExperiments,
  listRuns,
  type ExperimentRow,
  type GenerationRunRow,
} from '@/api/admin/content-rd';

export default function ContentRDPage() {
  const { user, loading: authLoading } = useAuth();

  const [experiments, setExperiments] = useState<ExperimentRow[]>([]);
  const [runs, setRuns] = useState<GenerationRunRow[]>([]);
  const [loadingExperiments, setLoadingExperiments] = useState(false);
  const [loadingRuns, setLoadingRuns] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadExperiments = useCallback(async () => {
    setLoadingExperiments(true);
    try {
      const r = await listExperiments({ exam: 'gate-ma', limit: 100 });
      setExperiments(r.experiments);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoadingExperiments(false);
    }
  }, []);

  const loadRuns = useCallback(async () => {
    setLoadingRuns(true);
    try {
      const r = await listRuns({ exam: 'gate-ma', limit: 20 });
      setRuns(r.runs);
    } catch {
      // experiments page will surface error; keep this silent to avoid double-banners
    } finally {
      setLoadingRuns(false);
    }
  }, []);

  useEffect(() => {
    trackEvent('page_view', { page: 'admin-content-rd' });
    if (authLoading || !user) return;
    if (user.role !== 'admin') return;
    void loadExperiments();
    void loadRuns();
  }, [authLoading, user, loadExperiments, loadRuns]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="animate-spin text-violet-400" size={20} />
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="text-center py-16 space-y-4">
        <Shield size={40} className="text-surface-700 mx-auto" />
        <h2 className="text-lg font-semibold text-surface-300">Admin access required</h2>
        <p className="text-xs text-surface-500">
          The Content R&D page is gated to admin accounts.
        </p>
        {!user && (
          <a
            href="/login"
            className="inline-block px-5 py-2 rounded-xl bg-violet-500 text-white text-xs font-medium"
          >
            Sign in
          </a>
        )}
      </div>
    );
  }

  return (
    <motion.div
      className="space-y-6 max-w-3xl mx-auto pb-12"
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
    >
      <motion.header variants={fadeInUp}>
        <h1 className="text-xl font-bold text-surface-100 flex items-center gap-2">
          <FlaskConical size={20} className="text-violet-400" />
          Content R&D
        </h1>
        <p className="text-xs text-surface-500 mt-1">
          Launch generation runs, watch active jobs, decide what to promote based on
          measured mastery lift.
        </p>
      </motion.header>

      {error && (
        <motion.div
          variants={fadeInUp}
          className="rounded-xl bg-red-500/10 border border-red-500/30 text-sm text-red-300 p-3"
        >
          {error}
        </motion.div>
      )}

      <RunLauncher
        defaultExam="gate-ma"
        onLaunched={() => {
          void loadRuns();
          void loadExperiments();
        }}
      />

      <ActiveRunsPanel
        runs={runs}
        loading={loadingRuns}
        onRefresh={loadRuns}
        onAborted={() => void loadRuns()}
      />

      <EffectivenessLedger
        experiments={experiments}
        loading={loadingExperiments}
        onRefresh={loadExperiments}
        onRecomputed={loadExperiments}
      />
    </motion.div>
  );
}
