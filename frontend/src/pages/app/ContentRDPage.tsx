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
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Loader2, FlaskConical, Database } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { trackEvent } from '@/lib/analytics';
import { RunLauncher } from '@/components/admin/RunLauncher';
import { ActiveRunsPanel } from '@/components/admin/ActiveRunsPanel';
import { EffectivenessLedger } from '@/components/admin/EffectivenessLedger';
import { SuggestedRunsPanel } from '@/components/admin/SuggestedRunsPanel';
import {
  listExperiments,
  listRuns,
  listSuggestions,
  type ExperimentRow,
  type GenerationRunRow,
  type RunSuggestionRow,
} from '@/api/admin/content-rd';
import { getBlueprint } from '@/api/admin/blueprints';
import { JourneyNudge } from '@/components/admin/JourneyNudge';

export default function ContentRDPage() {
  const { user, loading: authLoading } = useAuth();
  const [searchParams] = useSearchParams();

  const [experiments, setExperiments] = useState<ExperimentRow[]>([]);
  const [runs, setRuns] = useState<GenerationRunRow[]>([]);
  const [suggestions, setSuggestions] = useState<RunSuggestionRow[]>([]);
  const [loadingExperiments, setLoadingExperiments] = useState(false);
  const [loadingRuns, setLoadingRuns] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Arrived from BlueprintsPage's "Launch this blueprint" CTA
  // (/admin/content-rd?blueprint=<id>) — load it so RunLauncher can
  // pre-fill unit mode and thread blueprint_id through on launch.
  const blueprintParam = searchParams.get('blueprint');
  const [initialBlueprint, setInitialBlueprint] = useState<{
    id: string;
    concept_id: string;
    exam_pack_id: string;
    unit_name?: string;
  } | null>(null);
  useEffect(() => {
    if (!blueprintParam) { setInitialBlueprint(null); return; }
    let cancelled = false;
    getBlueprint(blueprintParam)
      .then(({ blueprint }) => {
        if (cancelled) return;
        setInitialBlueprint({
          id: blueprint.id,
          concept_id: blueprint.concept_id,
          exam_pack_id: blueprint.exam_pack_id,
        });
      })
      .catch(() => { /* blueprint may have been superseded — form falls back to manual entry */ });
    return () => { cancelled = true; };
  }, [blueprintParam]);

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

  const loadSuggestions = useCallback(async () => {
    setLoadingSuggestions(true);
    try {
      const r = await listSuggestions({ exam: 'gate-ma', status: 'pending' });
      setSuggestions(r.suggestions);
    } catch {
      // silent — surfaced via empty state
    } finally {
      setLoadingSuggestions(false);
    }
  }, []);

  useEffect(() => {
    trackEvent('page_view', { page: 'admin-content-rd' });
    if (authLoading || !user) return;
    if (user.role !== 'admin') return;
    void loadExperiments();
    void loadRuns();
    void loadSuggestions();
  }, [authLoading, user, loadExperiments, loadRuns, loadSuggestions]);

  if (authLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '40vh' }}>
        <Loader2 className="animate-spin" size={20} style={{ color: 'var(--indigo-ink)' }} />
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <div style={{ textAlign: 'center', padding: '64px 0' }}>
        <Shield size={40} style={{ color: 'var(--text-tertiary)', margin: '0 auto 16px' }} />
        <h2 style={{ margin: '0 0 8px', fontSize: 'var(--text-body)', fontWeight: 'var(--weight-semibold)', color: 'var(--text-secondary)' }}>Admin access required</h2>
        <p style={{ margin: '0 0 16px', fontSize: 11, color: 'var(--text-tertiary)' }}>
          The Content R&D page is gated to admin accounts.
        </p>
        {!user && (
          <a
            href="/login"
            style={{ display: 'inline-block', padding: '8px 20px', borderRadius: 'var(--radius-md)', background: 'var(--indigo)', color: 'var(--text-on-accent)', fontSize: 11, fontWeight: 'var(--weight-medium)', textDecoration: 'none' }}
          >
            Sign in
          </a>
        )}
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 768, margin: '0 auto', paddingBottom: 48, display: 'flex', flexDirection: 'column', gap: 24 }}>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <JourneyNudge currentHref="/admin/content-rd" />
      </motion.div>
      <motion.header initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 'var(--weight-bold)', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <FlaskConical size={20} style={{ color: 'var(--indigo-ink)' }} />
          Content R&D
        </h1>
        <p style={{ margin: 0, fontSize: 11, color: 'var(--text-tertiary)' }}>
          Launch generation runs, watch active jobs, decide what to promote based on
          measured mastery lift.
        </p>
      </motion.header>

      {error && /DATABASE_URL/i.test(error) ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ padding: 16, borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,159,10,.22)', background: 'rgba(255,159,10,.06)', display: 'flex', flexDirection: 'column', gap: 8 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--orange)', fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-medium)' }}>
            <Database size={14} /> Content R&D needs a database
          </div>
          <p style={{ margin: 0, fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            This deploy is running without <code>DATABASE_URL</code>. Generation
            runs, experiments, and the lift ledger all persist to Postgres, so
            the launcher is hidden until a DB is configured.
          </p>
          <p style={{ margin: 0, fontSize: 11, color: 'var(--text-tertiary)', lineHeight: 1.6 }}>
            <strong>Local:</strong> run <code>docker compose up</code> for the
            full stack with Postgres + pgvector. <strong>Cloud:</strong> set
            the <code>DATABASE_URL</code> env var (a Supabase or Render Postgres
            connection string) and redeploy. See{' '}
            <a href="/admin/scenarios" style={{ color: 'var(--indigo-ink)' }}>
              /admin/scenarios
            </a>{' '}
            for the demo path that runs without a DB.
          </p>
        </motion.div>
      ) : (
        <>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ padding: 12, borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,59,48,.22)', background: 'rgba(255,59,48,.06)', fontSize: 'var(--text-caption)', color: 'var(--red)' }}
            >
              {error}
            </motion.div>
          )}

          <SuggestedRunsPanel
            suggestions={suggestions}
            loading={loadingSuggestions}
            onRefresh={loadSuggestions}
            onActed={() => {
              void loadSuggestions();
              void loadRuns();
              void loadExperiments();
            }}
          />

          <RunLauncher
            defaultExam="gate-ma"
            initialBlueprint={initialBlueprint}
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
        </>
      )}
    </div>
  );
}
