/**
 * ContentMaturityCard — admin-only answer to "is any of this actually
 * personalised, or is everyone getting the same fallback?"
 *
 * There was no way to tell before. Three separate mechanisms could each
 * silently flatten the product to one-size-fits-all — an unset DATABASE_URL,
 * an activation row that no migration creates, and a thinking-gap cache that
 * held one sentence per error type and served it to everybody — and none of
 * them said a word. The UI looked identical either way.
 *
 * Presentation rules that follow from that:
 *
 *   - Blockers lead. When personalisation cannot run, the card says so at the
 *     top and the coverage numbers are visibly de-emphasised, because they
 *     describe a system that is switched off.
 *   - "Not measurable" is its own state, drawn differently from zero.
 *   - Every non-healthy row carries its remedy inline; a status with no next
 *     action just makes the operator feel bad.
 *
 * Self-fetching and self-hiding: renders nothing at all if the caller is not
 * an admin (the endpoint 401/403s) so it can be dropped onto a shared page.
 */
import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, HelpCircle, MinusCircle } from 'lucide-react';
import { authFetch } from '@/lib/auth/client';

export type Severity = 'blocked' | 'partial' | 'healthy' | 'unknown';

export interface MaturitySignal {
  id: string;
  label: string;
  severity: Severity;
  remedy: string | null;
  detail?: Record<string, number | string | null>;
}

export interface MaturityReport {
  overall: Severity;
  personalization_active: boolean;
  signals: MaturitySignal[];
  generated_at: string;
}

/**
 * Tone per severity. Red and orange are system states only, never decoration
 * — which is exactly what these are.
 */
const TONE: Record<Severity, { color: string; tint: string; border: string; Icon: typeof AlertTriangle }> = {
  blocked: {
    color: 'var(--red-ink)',
    tint: 'var(--red-tint)',
    border: 'var(--red)',
    Icon: AlertTriangle,
  },
  partial: {
    color: 'var(--orange-ink)',
    tint: 'var(--orange-tint)',
    border: 'var(--orange)',
    Icon: MinusCircle,
  },
  unknown: {
    color: 'var(--text-secondary)',
    tint: 'var(--surface-fill)',
    border: 'var(--separator-opaque)',
    Icon: HelpCircle,
  },
  healthy: {
    color: 'var(--green-ink)',
    tint: 'var(--green-tint)',
    border: 'var(--green)',
    Icon: CheckCircle2,
  },
};

const HEADLINE: Record<Severity, string> = {
  blocked: 'Students are seeing generic content',
  partial: 'Partly personalised',
  unknown: 'Cannot confirm personalisation',
  healthy: 'Personalised content is live',
};

export function ContentMaturityCard() {
  const [report, setReport] = useState<MaturityReport | null>(null);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await authFetch('/api/admin/content-maturity');
        // Not an admin, or the route is not deployed — say nothing rather than
        // showing a broken card on someone else's dashboard.
        if (!r.ok) { if (!cancelled) setHidden(true); return; }
        const data = (await r.json()) as MaturityReport;
        if (!cancelled) setReport(data);
      } catch {
        if (!cancelled) setHidden(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (hidden || !report) return null;

  const tone = TONE[report.overall];
  const { Icon } = tone;

  return (
    <section
      aria-label="Content maturity"
      style={{
        borderRadius: 'var(--radius-md)',
        border: `1px solid ${tone.border}`,
        background: 'var(--surface-card)',
        overflow: 'hidden',
      }}
    >
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '12px 16px',
          background: tone.tint,
        }}
      >
        <Icon size={18} style={{ color: tone.color, flexShrink: 0 }} aria-hidden />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 'var(--text-subhead)', fontWeight: 'var(--weight-semibold)', color: tone.color }}>
            {HEADLINE[report.overall]}
          </div>
          {!report.personalization_active && (
            <div style={{ fontSize: 'var(--text-footnote)', color: 'var(--text-secondary)', marginTop: 2 }}>
              Coverage figures below describe a mechanism that is currently switched off.
            </div>
          )}
        </div>
      </header>

      <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {report.signals.map((s) => {
          const t = TONE[s.severity];
          const SIcon = t.Icon;
          // When nothing can run, measurements are context, not progress.
          const dim = !report.personalization_active && s.severity === 'healthy';
          return (
            <li
              key={s.id}
              style={{
                display: 'flex',
                gap: 10,
                padding: '12px 16px',
                borderTop: 'var(--hairline) solid var(--separator)',
                opacity: dim ? 0.55 : 1,
              }}
            >
              <SIcon size={16} style={{ color: t.color, flexShrink: 0, marginTop: 2 }} aria-hidden />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 'var(--text-subhead)', color: 'var(--text-primary)' }}>{s.label}</div>
                {s.remedy && (
                  <div style={{ fontSize: 'var(--text-footnote)', color: 'var(--text-secondary)', marginTop: 4, lineHeight: 'var(--leading-normal)' }}>
                    {s.remedy}
                  </div>
                )}
                {s.detail && Object.keys(s.detail).length > 0 && (
                  <div
                    style={{
                      fontSize: 'var(--text-footnote)',
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--text-tertiary)',
                      marginTop: 4,
                    }}
                  >
                    {Object.entries(s.detail)
                      .filter(([, v]) => v !== null && v !== undefined)
                      .map(([k, v]) => `${k.replace(/_/g, ' ')} ${v}`)
                      .join(' · ')}
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export default ContentMaturityCard;
