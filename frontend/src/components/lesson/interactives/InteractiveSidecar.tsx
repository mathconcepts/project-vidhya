/**
 * InteractiveSidecar.tsx
 *
 * Atom-body dispatcher. Looks for a fenced ```interactive-spec``` JSON
 * block in the atom body; if found, parses it and renders the matching
 * widget (Manipulable / Simulation / GuidedWalkthrough).
 *
 * Mirrors the §4.15 MediaSidecar pattern — same authoring surface
 * (fenced block in the body), same "render below the prose" placement.
 *
 * Renders nothing (and surfaces no error to the student) when the body
 * doesn't contain a spec block. Malformed spec blocks render as a small
 * admin-only diagnostic so authoring problems surface in QA without
 * leaking to students.
 */

import { Manipulable } from './Manipulable';
import { Simulation } from './Simulation';
import { GuidedWalkthrough } from './GuidedWalkthrough';
import { WhyThisHelps } from './WhyThisHelps';
import { parseInteractiveSpec } from './types';
import { deriveLinearMapWhy } from './eigen-2x2';

interface Props {
  body: string;
  /** When true, malformed-spec errors render visibly. False in production for students. */
  showAuthoringErrors?: boolean;
}

export function InteractiveSidecar({ body, showAuthoringErrors }: Props) {
  const result = parseInteractiveSpec(body);
  if (!result.ok) {
    if (result.reason === 'no interactive-spec block' || result.reason === 'empty body') {
      return null;
    }
    if (showAuthoringErrors) {
      return (
        <div
          className="rounded-xl border p-3 text-xs"
          style={{ borderColor: 'rgba(255,159,10,.3)', background: 'rgba(255,159,10,.05)', color: 'var(--orange)' }}
        >
          <span className="font-medium">interactive-spec parse error:</span> {result.reason}
        </div>
      );
    }
    return null;
  }

  const { spec } = result;
  const widget = (() => {
    switch (spec.kind) {
      case 'manipulable':
        return <Manipulable spec={spec} />;
      case 'simulation':
        return <Simulation spec={spec} />;
      case 'guided_walkthrough':
        return <GuidedWalkthrough spec={spec} />;
    }
  })();

  // Dynamic why fallback (/investigate, 2026-09-06: "dynamically adapted
  // for any problems") — an authored `why` always wins; a `simulation`
  // scene with a `linear_map` but no authored `why` still gets a real
  // derivation sentence computed from its own matrix + eigen data. This is
  // the non-promoted path (a linear_map scene authored on an atom type
  // other than hook/intuition); AtomCardRenderer.tsx's promoted-figure
  // branch does the same for the common case.
  const computedWhy = spec.kind === 'simulation' ? deriveLinearMapWhy(spec.linear_map) : null;

  return (
    <div>
      <WhyThisHelps why={spec.why ?? computedWhy ?? undefined} idHint={spec.title} />
      {widget}
    </div>
  );
}

// Re-export for convenience so consumers can `import from interactives`
export { parseInteractiveSpec, evalFormula } from './types';
export { DecisionTreeWalkthrough } from './DecisionTreeWalkthrough';
export type {
  InteractiveSpec,
  ManipulableSpec,
  SimulationSpec,
  GuidedWalkthroughSpec,
  BranchesSpec,
  BranchNode,
  BranchLeaf,
} from './types';
