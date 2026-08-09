/**
 * FormulaMapPage — E7 Delight Bundle: per-module formula reference.
 *
 * Route: /formula-map/:module
 * Driven by ue_*=cheatsheet user-expectation entries in the pain-point registry.
 *
 * The formulas are served from GET /api/lesson/formula-map/:module.
 * In DB-less mode the backend returns a static seed set from the pain-point
 * registry (ue_*=cheatsheet entries).
 */

import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { authFetch } from '@/lib/auth/client';
import { Loader2, ArrowLeft, BookOpen } from 'lucide-react';

interface FormulaEntry {
  id: string;
  name: string;
  latex: string;
  description: string;
  tags?: string[];
}

interface FormulaMapResponse {
  module: string;
  title: string;
  entries: FormulaEntry[];
}

const MODULE_LABELS: Record<string, string> = {
  'linear-algebra': 'Linear Algebra',
  'calculus': 'Calculus',
  'probability': 'Probability & Statistics',
  'differential-equations': 'Differential Equations',
  'discrete-mathematics': 'Discrete Mathematics',
};

export default function FormulaMapPage() {
  const { module: moduleId } = useParams<{ module: string }>();
  const [data, setData] = useState<FormulaMapResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!moduleId) return;
    setLoading(true);
    setError(null);
    authFetch(`/api/lesson/formula-map/${encodeURIComponent(moduleId)}`)
      .then(async r => {
        if (!r.ok) throw new Error((await r.json().catch(() => null))?.error ?? `HTTP ${r.status}`);
        return r.json() as Promise<FormulaMapResponse>;
      })
      .then(setData)
      .catch(err => setError((err as Error).message))
      .finally(() => setLoading(false));
  }, [moduleId]);

  const title = data?.title ?? MODULE_LABELS[moduleId ?? ''] ?? moduleId ?? 'Formula Map';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 720, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Link
          to="/knowledge-home"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 'var(--text-caption)', color: 'var(--text-tertiary)', textDecoration: 'none' }}
        >
          <ArrowLeft size={13} /> Back
        </Link>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <BookOpen size={20} style={{ color: 'var(--indigo-ink)', flexShrink: 0 }} />
        <h1 style={{ margin: 0, fontSize: 'var(--text-title2)', fontWeight: 'var(--weight-semibold)', color: 'var(--text-primary)' }}>
          {title} — Formula Map
        </h1>
      </div>
      <p style={{ margin: 0, fontSize: 'var(--text-caption)', color: 'var(--text-secondary)' }}>
        Quick-reference for key formulas. Tap any row to expand the derivation hint.
      </p>

      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)', padding: '32px 0', justifyContent: 'center' }}>
          <Loader2 size={16} className="animate-spin" /> Loading formulas…
        </div>
      )}

      {error && (
        <p style={{ color: 'var(--red)', fontSize: 'var(--text-body)' }}>Couldn't load formulas: {error}</p>
      )}

      {data && data.entries.length === 0 && (
        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-body)' }}>
          No formulas registered for this module yet.
        </p>
      )}

      {data && data.entries.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {data.entries.map((entry, i) => (
            <FormulaRow key={entry.id} entry={entry} isLast={i === data.entries.length - 1} />
          ))}
        </div>
      )}
    </div>
  );
}

function FormulaRow({ entry, isLast }: { entry: FormulaEntry; isLast: boolean }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      style={{
        borderTop: 'var(--hairline) solid var(--separator)',
        borderBottom: isLast ? 'var(--hairline) solid var(--separator)' : 'none',
        padding: '12px 0',
      }}
    >
      <button
        onClick={() => setExpanded(e => !e)}
        style={{
          width: '100%',
          background: 'none',
          border: 'none',
          padding: 0,
          textAlign: 'left',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <div style={{ flex: 1 }}>
          <span style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-body)', color: 'var(--text-primary)' }}>
            {entry.name}
          </span>
          <div style={{ marginTop: 4, fontFamily: 'var(--font-mono)', fontSize: 'var(--text-body)', color: 'var(--indigo-ink)', wordBreak: 'break-all' }}>
            {entry.latex}
          </div>
        </div>
        <span style={{ fontSize: 18, color: 'var(--text-tertiary)', flexShrink: 0, lineHeight: 1 }}>
          {expanded ? '−' : '+'}
        </span>
      </button>

      {expanded && (
        <div style={{ marginTop: 10, paddingLeft: 0, fontSize: 'var(--text-caption)', color: 'var(--text-secondary)', lineHeight: 'var(--leading-relaxed)' }}>
          {entry.description}
          {entry.tags && entry.tags.length > 0 && (
            <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {entry.tags.map(tag => (
                <span
                  key={tag}
                  style={{ fontSize: 'var(--text-caption2)', padding: '2px 8px', borderRadius: 'var(--radius-xs)', background: 'var(--surface-fill)', border: 'var(--hairline) solid var(--separator)', color: 'var(--text-tertiary)' }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
