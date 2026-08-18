/**
 * FrontierSpine — T13 (B4/A9, DR-1, wireframe 3).
 *
 * Never draws the graph: a topological vertical spine in 4 labeled
 * clusters. Mastered clusters collapse to one-line rollups; the first
 * non-collapsed cluster surfaces its frontier concepts in the screen's
 * ONE focal card ("You are here"); everything after it renders dimmed
 * with the real prerequisite named as the row's trailing label ("after
 * eigenvalues") — never the word "locked". Cross-branch prerequisite info
 * lives only in a per-concept bottom sheet, tapped open, never drawn
 * globally.
 */
import { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import {
  groupByCluster,
  rollupLabel,
  pickYouAreHere,
  type FrontierNode,
  type FrontierClusterSummary,
  type FrontierDot,
} from '@/lib/frontier-logic';

const DOT_STYLE: Record<FrontierDot, React.CSSProperties> = {
  mastered: { background: 'var(--green)', border: '1.5px solid var(--green)' },
  placed: { background: 'var(--green-tint)', border: '1.5px solid var(--green)' },
  frontier: { background: 'var(--surface-card)', border: '1.5px solid var(--text-primary)' },
  later: { background: 'var(--surface-fill)', border: '1.5px solid transparent' },
};

export interface FrontierSpineProps {
  nodes: FrontierNode[];
  clusters: FrontierClusterSummary[];
  onLearn: (conceptId: string) => void;
}

export function FrontierSpine({ nodes, clusters, onLearn }: FrontierSpineProps) {
  const reducedMotion = usePrefersReducedMotion();
  const focalRef = useRef<HTMLDivElement>(null);
  const [sheetFor, setSheetFor] = useState<FrontierNode | null>(null);

  const groups = groupByCluster(nodes, clusters);
  const youAreHere = pickYouAreHere(groups);
  const activeGroupId = youAreHere[0]?.cluster_id ?? null;
  const doneTotal = nodes.filter((n) => n.dot === 'mastered' || n.dot === 'placed').length;

  useEffect(() => {
    if (!focalRef.current) return;
    focalRef.current.scrollIntoView({
      behavior: reducedMotion ? 'auto' : 'smooth',
      block: 'center',
    });
    // Only on first mount / first time the focal card exists — re-running on
    // every render would fight the student's own scrolling.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Boolean(activeGroupId)]);

  if (nodes.length === 0) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <h1 style={{ margin: 0, fontSize: 'var(--text-title3)', fontWeight: 'var(--weight-semibold)', letterSpacing: 'var(--tracking-title)', color: 'var(--text-primary)' }}>
          Linear Algebra
        </h1>
        <span style={{ fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums', fontSize: 'var(--text-footnote)', color: 'var(--text-tertiary)' }}>
          {doneTotal} of {nodes.length}
        </span>
      </div>

      {groups.map((group) => {
        if (group.collapsed) {
          return (
            <div
              key={group.id}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: 'var(--touch-min)', padding: '2px 2px' }}
            >
              <span style={{ fontSize: 'var(--text-subhead)', fontWeight: 'var(--weight-semibold)', color: 'var(--text-primary)' }}>
                {rollupLabel(group)}
              </span>
              <span aria-hidden="true" style={{ width: 10, height: 10, borderRadius: 999, ...DOT_STYLE.mastered }} />
            </div>
          );
        }

        const isActive = group.id === activeGroupId;
        const focalIds = new Set(isActive ? youAreHere.map((n) => n.id) : []);
        const restOfGroup = group.nodes.filter((n) => !focalIds.has(n.id));

        return (
          <div key={group.id} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {isActive && youAreHere.length > 0 && (
              <div ref={focalRef}>
                <Card elevated padding={20} style={{ marginTop: 8 }}>
                  <p style={{ margin: '0 0 6px', fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-semibold)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-caps)', color: 'var(--green-ink)' }}>
                    You are here
                  </p>
                  {youAreHere.map((n, i) => (
                    <FrontierRow
                      key={n.id}
                      node={n}
                      last={i === youAreHere.length - 1}
                      bold
                      onOpenSheet={() => setSheetFor(n)}
                    />
                  ))}
                  <Button
                    tone="mastery"
                    size="lg"
                    full
                    onClick={() => onLearn(youAreHere[youAreHere.length - 1].id)}
                    style={{ marginTop: 12 }}
                  >
                    Learn {youAreHere[youAreHere.length - 1].name}
                  </Button>
                </Card>
              </div>
            )}

            {restOfGroup.length > 0 && (
              <div>
                <p style={{ margin: '14px 2px 2px', fontSize: 'var(--text-footnote)', fontWeight: 'var(--weight-semibold)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-caps)', color: 'var(--text-secondary)' }}>
                  {group.label}
                </p>
                {restOfGroup.map((n, i) => (
                  <FrontierRow
                    key={n.id}
                    node={n}
                    last={i === restOfGroup.length - 1}
                    dimmed={n.dot === 'later'}
                    onOpenSheet={() => setSheetFor(n)}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}

      {sheetFor && (
        <FrontierSheet node={sheetFor} onClose={() => setSheetFor(null)} />
      )}
    </div>
  );
}

function FrontierRow({
  node,
  last,
  bold = false,
  dimmed = false,
  onOpenSheet,
}: {
  node: FrontierNode;
  last: boolean;
  bold?: boolean;
  dimmed?: boolean;
  onOpenSheet: () => void;
}) {
  const accessibleName = node.why && node.why !== 'mastered' && node.why !== 'in progress'
    ? `${node.name}, ${node.why}`
    : node.name;
  return (
    <button
      type="button"
      onClick={onOpenSheet}
      aria-label={accessibleName}
      style={{
        display: 'flex', alignItems: 'center', gap: 12, width: '100%',
        minHeight: 'var(--touch-min)', padding: '0 2px',
        background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left',
        borderBottom: last ? 'none' : 'var(--hairline) solid var(--separator)',
        fontFamily: 'var(--font-sans)',
      }}
    >
      <span aria-hidden="true" style={{ width: 10, height: 10, borderRadius: 999, flex: '0 0 10px', ...DOT_STYLE[node.dot] }} />
      <span
        style={{
          flex: 1, fontSize: 'var(--text-body)', letterSpacing: 'var(--tracking-body)',
          fontWeight: bold ? 'var(--weight-semibold)' : 'var(--weight-regular)',
          color: dimmed ? 'var(--text-secondary)' : 'var(--text-primary)',
        }}
      >
        {node.name}
      </span>
      <span style={{ fontSize: 'var(--text-footnote)', color: 'var(--text-tertiary)' }}>
        {node.dot === 'placed' ? 'placed' : node.dot === 'later' ? node.why : node.dot === 'frontier' ? 'ready now' : ''}
      </span>
    </button>
  );
}

function FrontierSheet({ node, onClose }: { node: FrontierNode; onClose: () => void }) {
  return (
    <div
      role="dialog"
      aria-label={`${node.name} details`}
      style={{
        background: 'var(--surface-card)', borderRadius: 'var(--radius-md) var(--radius-md) 0 0',
        boxShadow: '0 -1px 0 rgba(0,0,0,.06), 0 -20px 60px rgba(0,0,0,.18)',
        padding: '16px 20px 20px', marginTop: 8,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <p style={{ margin: '0 0 6px', fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-semibold)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-caps)', color: 'var(--text-secondary)' }}>
          {node.name}
        </p>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 'var(--text-subhead)', color: 'var(--text-tertiary)' }}
        >
          Close
        </button>
      </div>
      {node.builds_on.length > 0 ? (
        <p style={{ margin: 0, fontSize: 'var(--text-subhead)', color: 'var(--text-secondary)' }}>
          Builds on:{' '}
          {node.builds_on.map((b, i) => (
            <span key={b.id} style={{ color: 'var(--text-primary)', fontWeight: 'var(--weight-medium)' }}>
              {b.label}{b.met ? ' ✓' : ''}{i < node.builds_on.length - 1 ? ', ' : ''}
            </span>
          ))}
        </p>
      ) : (
        <p style={{ margin: 0, fontSize: 'var(--text-subhead)', color: 'var(--text-secondary)' }}>
          A foundation concept — nothing else in linear algebra needs to come first.
        </p>
      )}
      {node.dot === 'placed' && (
        <p style={{ margin: '6px 0 0', fontSize: 'var(--text-caption)', color: 'var(--text-tertiary)' }}>
          Placed by your warmup — one practice session confirms it.
        </p>
      )}
    </div>
  );
}
