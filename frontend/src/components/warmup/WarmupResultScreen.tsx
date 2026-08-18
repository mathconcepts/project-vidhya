/**
 * WarmupResultScreen — wireframe 2 (docs/designs/linear-algebra-wireframes.html).
 *
 * DR-2: "the most emotionally loaded screen — leads with competence, one
 * placement line, one green CTA. No score, no per-item review, no red, no
 * Elo number." Presentational: takes the server's placement result as
 * props.
 */
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { buildResultCopy, WARMUP_RESULT_FOOTNOTE, type SpineConcept, type PlacementDot } from '@/lib/warmup-logic';

const DOT_STYLE: Record<PlacementDot, React.CSSProperties> = {
  placed: { background: 'var(--green-tint)', border: '1.5px solid var(--green)' },
  frontier: { background: 'var(--surface-card)', border: '1.5px solid var(--text-primary)' },
  later: { background: 'var(--surface-fill)', border: '1.5px solid transparent' },
};

const DOT_CAPTION: Record<PlacementDot, string> = {
  placed: 'placed',
  frontier: 'start here',
  later: '',
};

export interface WarmupResultScreenProps {
  spine: SpineConcept[];
  placed: string[];
  frontier: string | null;
  probedAnyProbe: boolean;
  onStartPractising: () => void;
}

export function WarmupResultScreen({
  spine,
  placed,
  frontier,
  probedAnyProbe,
  onStartPractising,
}: WarmupResultScreenProps) {
  const { headline, placementLine, rows } = buildResultCopy(spine, placed, frontier, probedAnyProbe);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <h1 style={{ margin: 0, fontSize: 'var(--text-title3)', fontWeight: 'var(--weight-semibold)', letterSpacing: 'var(--tracking-title)', color: 'var(--text-primary)' }}>
          Your starting line
        </h1>
      </div>

      <Card elevated padding={20}>
        <p style={{ margin: '0 0 6px', fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-semibold)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-caps)', color: 'var(--green-ink)' }}>
          Placement complete
        </p>
        <p style={{ margin: '0 0 4px', fontSize: 'var(--text-title2)', fontWeight: 'var(--weight-bold)', letterSpacing: 'var(--tracking-title)', color: 'var(--text-primary)' }}>
          {headline}
        </p>
        {placementLine && (
          <p style={{ margin: 0, fontSize: 'var(--text-subhead)', color: 'var(--text-secondary)' }}>
            {placementLine}
          </p>
        )}

        {rows.length > 0 && (
          <>
            <hr style={{ border: 0, borderTop: 'var(--hairline) solid var(--separator)', margin: '14px 0' }} />
            <div>
              {rows.map((row, i) => (
                <div
                  key={row.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    minHeight: 'var(--touch-min)',
                    borderBottom: i === rows.length - 1 ? 'none' : 'var(--hairline) solid var(--separator)',
                  }}
                >
                  <span aria-hidden="true" style={{ width: 10, height: 10, borderRadius: 999, flex: '0 0 10px', ...DOT_STYLE[row.dot] }} />
                  <span style={{ flex: 1, fontSize: 'var(--text-body)', letterSpacing: 'var(--tracking-body)', color: 'var(--text-primary)' }}>
                    {row.label}
                  </span>
                  {DOT_CAPTION[row.dot] && (
                    <span style={{ fontSize: 'var(--text-footnote)', color: 'var(--text-tertiary)' }}>
                      {DOT_CAPTION[row.dot]}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        <Button tone="mastery" size="lg" full onClick={onStartPractising} style={{ marginTop: 14 }}>
          Start practising
        </Button>
      </Card>

      <p style={{ margin: 0, textAlign: 'center', fontSize: 'var(--text-footnote)', color: 'var(--text-tertiary)' }}>
        {WARMUP_RESULT_FOOTNOTE}
      </p>
    </div>
  );
}
