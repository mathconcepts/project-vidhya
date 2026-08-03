/**
 * RunConsolePage — admin dashboard at /admin/jobs.
 *
 * Mission Control Phase 1, "Run console" panel (SOTA-Facelift-CEO-Review.md
 * §7.5) — scoped to the checkpointed job-runner.ts system specifically
 * (content-generation, wolfram-verify). Wraps the EXISTING, already-tested
 * REST surface at src/api/job-routes.ts (GET /api/admin/jobs, POST
 * .../:name/start, POST .../:name/cancel) — no new backend behavior, this
 * page is the missing browser front end for an API that already worked.
 *
 * Scope note: the DB-backed generation_runs system (curriculum units,
 * blueprints, experiments) already has its own console at
 * /admin/content-rd (RunLauncher/ActiveRunsPanel) — this page does not
 * duplicate that. It closes the OTHER gap: content-generation-job.ts and
 * wolfram-verify-job.ts could only ever be started from a terminal/cron
 * before this page existed.
 *
 * Auth: admin role only. Honors the same global kill switch
 * (CONTENT_JOBS_DISABLED) the backend already enforces — this page can't
 * bypass it, and shows its state (read from platform-health) so a blocked
 * Start attempt isn't a mystery.
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Play, Square, Loader2, Shield, RefreshCw, Terminal, Ban, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { trackEvent } from '@/lib/analytics';
import { listJobs, startJob, cancelJob, type JobListing, type JobRunState, JobsApiError } from '@/api/admin/jobs';
import { getPlatformHealth } from '@/api/admin/platform-health';

const POLL_MS = 3000;

/** Pure — tone for a job's current state. Exported for tests. */
export function stateTone(state: JobRunState | undefined): 'good' | 'bad' | 'neutral' | 'warn' {
  switch (state) {
    case 'completed':
      return 'good';
    case 'failed':
    case 'cancelled':
      return 'bad';
    case 'paused':
      return 'warn';
    case 'running':
    default:
      return 'neutral';
  }
}

/** Pure — one-line progress summary. Exported for tests. */
export function formatProgress(job: JobListing): string {
  if (!job.status) return 'never run';
  const { done, total, skipped, failed } = job.status.progress;
  const extras: string[] = [];
  if (failed > 0) extras.push(`${failed} failed`);
  if (skipped > 0) extras.push(`${skipped} skipped`);
  const base = `${done}/${total}`;
  return extras.length > 0 ? `${base} (${extras.join(', ')})` : base;
}

/** Pure — can Start be clicked right now? Exported for tests. */
export function canStart(job: JobListing, killSwitchEngaged: boolean): boolean {
  if (killSwitchEngaged) return false;
  return job.status?.state !== 'running' && job.status?.state !== 'paused';
}

export const __testing = { stateTone, formatProgress, canStart };

export default function RunConsolePage() {
  const { user, loading: authLoading } = useAuth();

  const [jobs, setJobs] = useState<JobListing[] | null>(null);
  const [killSwitchEngaged, setKillSwitchEngaged] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<string | null>(null); // job name mid-request
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadJobs = useCallback(async () => {
    try {
      setJobs(await listJobs());
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  const loadKillSwitch = useCallback(async () => {
    try {
      const health = await getPlatformHealth();
      setKillSwitchEngaged(health.kill_switch_engaged);
    } catch {
      // Non-fatal — the backend enforces the kill switch regardless of
      // whether this page can show its state right now.
    }
  }, []);

  useEffect(() => {
    trackEvent('page_view', { page: 'admin-run-console' });
    if (authLoading || !user || user.role !== 'admin') return;
    void loadJobs();
    void loadKillSwitch();
  }, [authLoading, user, loadJobs, loadKillSwitch]);

  // Poll only while at least one job is actively running — otherwise the
  // list is static and polling would just be noise.
  useEffect(() => {
    const anyRunning = jobs?.some((j) => j.status?.state === 'running') ?? false;
    if (anyRunning && !pollRef.current) {
      pollRef.current = setInterval(() => void loadJobs(), POLL_MS);
    } else if (!anyRunning && pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [jobs, loadJobs]);

  const handleStart = useCallback(async (name: string) => {
    setActionError(null);
    setPendingAction(name);
    try {
      await startJob(name);
      await loadJobs();
    } catch (e) {
      setActionError(e instanceof JobsApiError ? `${name}: ${e.message}` : (e as Error).message);
    } finally {
      setPendingAction(null);
    }
  }, [loadJobs]);

  const handleCancel = useCallback(async (name: string) => {
    setActionError(null);
    setPendingAction(name);
    try {
      await cancelJob(name);
      await loadJobs();
    } catch (e) {
      setActionError(e instanceof JobsApiError ? `${name}: ${e.message}` : (e as Error).message);
    } finally {
      setPendingAction(null);
    }
  }, [loadJobs]);

  if (authLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '40vh' }}>
        <Loader2 className="animate-spin" size={20} style={{ color: 'var(--indigo-ink)' }} />
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <div style={{ textAlign: 'center', padding: '64px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <Shield size={40} style={{ color: 'var(--text-tertiary)' }} />
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 'var(--weight-semibold)', color: 'var(--text-secondary)' }}>Admin access required</h2>
        <p style={{ margin: 0, fontSize: 11, color: 'var(--text-tertiary)' }}>Run console is gated to admin accounts.</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ maxWidth: 768, margin: '0 auto', paddingBottom: 48, display: 'flex', flexDirection: 'column', gap: 24 }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <h1 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 'var(--weight-bold)', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Terminal size={18} style={{ color: 'var(--indigo-ink)' }} />
            Run console
          </h1>
          <p style={{ margin: 0, fontSize: 11, color: 'var(--text-tertiary)' }}>
            Start, watch, and cancel checkpointed background jobs from the browser — no terminal needed.
            Runs are resumable: cancel is cooperative and finishes the in-flight item first.
          </p>
        </div>
        <button
          onClick={() => { void loadJobs(); void loadKillSwitch(); }}
          aria-label="Refresh job list"
          style={{ padding: 6, borderRadius: 'var(--radius-sm)', background: 'var(--surface-card)', border: 'var(--hairline) solid var(--separator)', color: 'var(--text-tertiary)', cursor: 'pointer' }}
        >
          <RefreshCw size={12} />
        </button>
      </div>

      {killSwitchEngaged && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 12, borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,59,48,.22)', background: 'rgba(255,59,48,.06)' }}>
          <Ban size={14} style={{ color: 'var(--red)' }} />
          <span style={{ fontSize: 'var(--text-caption)', color: 'var(--red)', fontWeight: 'var(--weight-medium)' }}>
            Global kill switch engaged (CONTENT_JOBS_DISABLED=true) — every start is refused. This is an env
            flag set in the repo's deploy config, not editable from here by design.
          </span>
        </div>
      )}

      {error && (
        <div style={{ padding: 12, borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,59,48,.22)', background: 'rgba(255,59,48,.06)', fontSize: 'var(--text-caption)', color: 'var(--red)' }}>
          {error}
        </div>
      )}

      {actionError && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 12, borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,59,48,.22)', background: 'rgba(255,59,48,.06)', fontSize: 'var(--text-caption)', color: 'var(--red)' }}>
          <AlertCircle size={14} />
          {actionError}
        </div>
      )}

      {jobs === null && !error && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}>
          <Loader2 className="animate-spin" size={18} style={{ color: 'var(--indigo-ink)' }} />
        </div>
      )}

      {jobs !== null && jobs.length === 0 && (
        <div style={{ padding: 24, textAlign: 'center', fontSize: 11, color: 'var(--text-tertiary)' }}>
          No jobs registered.
        </div>
      )}

      {jobs?.map((job) => {
        const tone = stateTone(job.status?.state);
        const toneColor = tone === 'good' ? 'var(--green-ink)' : tone === 'bad' ? 'var(--red)' : tone === 'warn' ? 'var(--orange-ink)' : 'var(--text-tertiary)';
        const running = job.status?.state === 'running';
        const busy = pendingAction === job.name;
        return (
          <div
            key={job.name}
            style={{ borderRadius: 'var(--radius-md)', border: 'var(--hairline) solid var(--separator)', background: 'var(--surface-card)', padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 'var(--weight-semibold)', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                  {job.name}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>{job.description}</div>
              </div>
              <span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 'var(--weight-medium)', color: toneColor, whiteSpace: 'nowrap' }}>
                {job.status?.state ?? 'idle'}
              </span>
            </div>

            <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
              {formatProgress(job)}
            </div>

            {job.status?.message && (
              <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{job.status.message}</div>
            )}
            {job.status?.last_error && (
              <div style={{ fontSize: 11, color: 'var(--red)' }}>Last error: {job.status.last_error}</div>
            )}

            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              {running ? (
                <ActionButton icon={Square} label="Cancel" tone="bad" disabled={busy} onClick={() => void handleCancel(job.name)} />
              ) : (
                <ActionButton
                  icon={Play}
                  label="Start"
                  tone="good"
                  disabled={busy || !canStart(job, killSwitchEngaged)}
                  onClick={() => void handleStart(job.name)}
                />
              )}
              {busy && <Loader2 className="animate-spin" size={14} style={{ color: 'var(--text-tertiary)', alignSelf: 'center' }} />}
            </div>
          </div>
        );
      })}
    </motion.div>
  );
}

function ActionButton({
  icon: Icon,
  label,
  tone,
  disabled,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  tone: 'good' | 'bad';
  disabled?: boolean;
  onClick: () => void;
}) {
  const color = tone === 'good' ? 'var(--green-ink)' : 'var(--red)';
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '8px 14px',
        minHeight: 32,
        borderRadius: 'var(--radius-sm)',
        border: `1px solid ${color}`,
        background: 'var(--surface-card)',
        color,
        fontSize: 12,
        fontWeight: 'var(--weight-medium)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
      }}
    >
      <Icon size={12} />
      {label}
    </button>
  );
}
