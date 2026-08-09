/**
 * PlaybooksPage — admin dashboard at /admin/playbooks
 *
 * One-click interface for every bulk operation registered in the Playbook
 * Layer (Track E5). Lists all playbooks, shows a cost estimate on demand,
 * and lets the operator launch or dry-run each one.
 */

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { isAdminRole } from '@/lib/auth/roles';
import {
  listPlaybooks,
  estimatePlaybook,
  launchPlaybook,
  listPlaybookRuns,
  abortPlaybookRun,
  type PlaybookSummary,
  type PlaybookRun,
  type DryRunEstimate,
} from '@/api/admin/playbooks';

const EXECUTOR_LABELS: Record<string, string> = {
  'job-runner': 'Job runner',
  'run-dispatcher': 'Run dispatcher',
  'batch': 'Batch API',
  'script': 'Script',
  'subagent': 'Subagent',
};

function StatusBadge({ status }: { status: string }) {
  const color: Record<string, string> = {
    pending: 'var(--text-secondary)',
    running: 'var(--indigo-ink)',
    completed: 'var(--green-ink)',
    failed: '#c0392b',
    aborted: '#888',
  };
  return (
    <span style={{
      fontSize: 12,
      fontWeight: 600,
      letterSpacing: 0.3,
      color: color[status] ?? 'var(--text-secondary)',
      textTransform: 'uppercase',
    }}>
      {status}
    </span>
  );
}

function EstimateCard({ estimate }: { estimate: DryRunEstimate }) {
  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 8,
      padding: '12px 16px',
      marginTop: 8,
    }}>
      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 8 }}>
        <span style={{ fontSize: 13 }}>
          <span style={{ color: 'var(--text-secondary)' }}>Cost: </span>
          <strong>${estimate.estimated_cost_usd.toFixed(2)}</strong>
        </span>
        <span style={{ fontSize: 13 }}>
          <span style={{ color: 'var(--text-secondary)' }}>Duration: </span>
          <strong>{estimate.estimated_duration_human}</strong>
        </span>
        <span style={{ fontSize: 13 }}>
          <span style={{ color: 'var(--text-secondary)' }}>Artifacts: </span>
          <strong>{estimate.estimated_artifact_count}</strong>
        </span>
      </div>
      {estimate.notes?.map((note, i) => (
        <div key={i} style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
          {note}
        </div>
      ))}
    </div>
  );
}

function PlaybookCard({
  playbook,
  onLaunched,
}: {
  playbook: PlaybookSummary;
  onLaunched: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [estimate, setEstimate] = useState<DryRunEstimate | null>(null);
  const [estimating, setEstimating] = useState(false);
  const [launching, setLaunching] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleEstimate = async () => {
    setEstimating(true);
    setError(null);
    try {
      const res = await estimatePlaybook(playbook.id, {});
      setEstimate(res.estimate);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setEstimating(false);
    }
  };

  const handleLaunch = async (dryRun: boolean) => {
    setLaunching(true);
    setError(null);
    setResult(null);
    try {
      const res = await launchPlaybook(playbook.id, {}, dryRun);
      setResult(dryRun
        ? `Dry-run complete. (status: ${res.status})`
        : `Launched. Run ID: ${res.run_id.slice(0, 8)}… (status: ${res.status})${res.brief_path ? ` Brief at: ${res.brief_path}` : ''}`
      );
      if (!dryRun) onLaunched();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLaunching(false);
    }
  };

  const isSubagent = playbook.executor === 'subagent';

  return (
    <div style={{
      border: '1px solid var(--border)',
      borderRadius: 10,
      padding: '16px 20px',
      marginBottom: 12,
    }}>
      <div
        style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
        onClick={() => setExpanded((v) => !v)}
      >
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: 15 }}>{playbook.title}</div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
            {EXECUTOR_LABELS[playbook.executor] ?? playbook.executor}
            {playbook.guards.requires_tier && ` · ${playbook.guards.requires_tier}`}
            {playbook.steps && ` · ${playbook.steps.length} steps`}
          </div>
        </div>
        <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
          {expanded ? '▲' : '▼'}
        </span>
      </div>

      {expanded && (
        <div style={{ marginTop: 12 }}>
          <p style={{ fontSize: 14, margin: '0 0 12px', color: 'var(--text-primary)' }}>
            {playbook.description}
          </p>

          {estimate && <EstimateCard estimate={estimate} />}
          {error && (
            <div style={{ fontSize: 13, color: '#c0392b', marginTop: 8 }}>{error}</div>
          )}
          {result && (
            <div style={{ fontSize: 13, color: 'var(--green-ink)', marginTop: 8 }}>{result}</div>
          )}

          <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
            <button
              onClick={handleEstimate}
              disabled={estimating}
              style={{
                padding: '7px 14px',
                fontSize: 13,
                border: '1px solid var(--border)',
                borderRadius: 6,
                background: 'var(--surface)',
                cursor: estimating ? 'not-allowed' : 'pointer',
              }}
            >
              {estimating ? 'Estimating...' : 'Estimate cost'}
            </button>

            <button
              onClick={() => handleLaunch(true)}
              disabled={launching}
              style={{
                padding: '7px 14px',
                fontSize: 13,
                border: '1px solid var(--indigo-ink)',
                borderRadius: 6,
                background: 'transparent',
                color: 'var(--indigo-ink)',
                cursor: launching ? 'not-allowed' : 'pointer',
              }}
            >
              {launching ? 'Working...' : 'Dry run'}
            </button>

            <button
              onClick={() => handleLaunch(false)}
              disabled={launching}
              style={{
                padding: '7px 14px',
                fontSize: 13,
                border: 'none',
                borderRadius: 6,
                background: isSubagent ? 'var(--indigo-ink)' : 'var(--green)',
                color: '#fff',
                cursor: launching ? 'not-allowed' : 'pointer',
              }}
            >
              {launching ? 'Working...' : isSubagent ? 'Prepare brief' : 'Launch'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function RunsPanel({ runs, onAbort }: { runs: PlaybookRun[]; onAbort: (id: string) => void }) {
  if (runs.length === 0) return (
    <p style={{ fontSize: 13, color: 'var(--text-secondary)', fontStyle: 'italic' }}>
      No runs yet.
    </p>
  );

  return (
    <div>
      {runs.slice(0, 10).map((run) => (
        <div key={run.run_id} style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '10px 0',
          borderBottom: '1px solid var(--border)',
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{run.playbook_id}</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              {run.run_id.slice(0, 8)} · {new Date(run.started_at).toLocaleString()}
            </div>
          </div>
          <StatusBadge status={run.status} />
          {(run.status === 'running' || run.status === 'pending') && (
            <button
              onClick={() => onAbort(run.run_id)}
              style={{
                padding: '4px 10px',
                fontSize: 12,
                border: '1px solid #c0392b',
                borderRadius: 4,
                background: 'transparent',
                color: '#c0392b',
                cursor: 'pointer',
              }}
            >
              Abort
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

export default function PlaybooksPage() {
  const { user, loading: authLoading } = useAuth();
  const [playbooks, setPlaybooks] = useState<PlaybookSummary[] | null>(null);
  const [runs, setRuns] = useState<PlaybookRun[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadRuns = useCallback(() => {
    listPlaybookRuns().then(setRuns).catch(() => setRuns([]));
  }, []);

  useEffect(() => {
    if (authLoading || !user || !isAdminRole(user.role)) return;
    listPlaybooks().then(setPlaybooks).catch((e) => setError((e as Error).message));
    loadRuns();
  }, [authLoading, user, loadRuns]);

  const handleAbort = async (runId: string) => {
    try {
      await abortPlaybookRun(runId);
      loadRuns();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  if (authLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
        <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Loading...</span>
      </div>
    );
  }

  if (!user || !isAdminRole(user.role)) {
    return (
      <div style={{ padding: '40px 24px', maxWidth: 480 }}>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
          This page is restricted to admin users.
        </p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 820, margin: '0 auto', padding: '32px 24px' }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Playbooks</h1>
      <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 28 }}>
        One-click bulk operations. All playbooks respect the kill switch and quota ledger.
        Subagent playbooks prepare a brief for human review — nothing fires automatically.
      </p>

      {error && (
        <div style={{
          background: '#fdf0f0',
          border: '1px solid #f5c6c6',
          borderRadius: 8,
          padding: '10px 14px',
          fontSize: 13,
          color: '#c0392b',
          marginBottom: 20,
        }}>
          {error}
        </div>
      )}

      {playbooks === null ? (
        <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Loading playbooks...</p>
      ) : playbooks.length === 0 ? (
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', fontStyle: 'italic' }}>
          No playbooks registered.
        </p>
      ) : (
        <section style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Registered Playbooks ({playbooks.length})
          </h2>
          {playbooks.map((p) => (
            <PlaybookCard key={p.id} playbook={p} onLaunched={loadRuns} />
          ))}
        </section>
      )}

      <section>
        <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Recent Runs
        </h2>
        <RunsPanel runs={runs} onAbort={handleAbort} />
      </section>
    </div>
  );
}
