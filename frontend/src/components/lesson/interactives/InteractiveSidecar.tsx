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
import { parseInteractiveSpec } from './types';

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
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-200">
          <span className="font-medium">interactive-spec parse error:</span> {result.reason}
        </div>
      );
    }
    return null;
  }

  const { spec } = result;
  switch (spec.kind) {
    case 'manipulable':
      return <Manipulable spec={spec} />;
    case 'simulation':
      return <Simulation spec={spec} />;
    case 'guided_walkthrough':
      return <GuidedWalkthrough spec={spec} />;
  }
}

// Re-export for convenience so consumers can `import from interactives`
export { parseInteractiveSpec, evalFormula } from './types';
export type { InteractiveSpec, ManipulableSpec, SimulationSpec, GuidedWalkthroughSpec } from './types';
