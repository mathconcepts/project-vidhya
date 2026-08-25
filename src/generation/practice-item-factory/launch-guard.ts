/**
 * src/generation/practice-item-factory/launch-guard.ts — T4a launch guard.
 *
 * Fails a practice-item batch run LOUDLY at launch time (not silently at
 * poll time, one refused item at a time) when the run's atom_specs need a
 * verifier that isn't configured: mcq/msq need a distinct-provider
 * secondary model for dual-model consensus (answer-check.ts); nat needs
 * Wolfram|Alpha (src/services/wolfram-service.ts).
 *
 * Deliberately guards ONLY the launch — the batch orchestrator's prepare()
 * step's fresh-run branch (src/generation/batch/orchestrator.ts), which
 * runs exactly once, the first time a run's atom_specs are supplied.
 * Resuming an in-flight run (jobs already persisted, atom_specs omitted)
 * never calls this: a per-item refusal recorded mid-run is a valid
 * terminal outcome (see TODOS.md), not something to retroactively block.
 */

import type { AtomSpec } from '../batch/types';
import { practiceItemSpecFromAtomSpec } from './batch-dispatch';
import { resolveDistinctSecondaryModel } from './answer-check';

export class PracticeItemLaunchGuardError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PracticeItemLaunchGuardError';
  }
}

export interface LaunchGuardDeps {
  /** The primary model id mcq/msq consensus is routed against — the batch pipeline's fixed model (gemini-adapter.ts's DEFAULT_MODEL). */
  primaryModelId: string;
  /** Injectable for tests. Production default: resolveDistinctSecondaryModel. */
  resolveSecondary?: (primaryModelId: string) => Promise<string | null>;
  /** Injectable for tests. Production default: reads WOLFRAM_APP_ID. */
  wolframConfigured?: () => boolean;
}

/**
 * Throws PracticeItemLaunchGuardError when the batch's atom_specs include
 * a format whose verifier isn't configured. A no-op (never throws) for
 * atom_specs that don't reconstruct to any practice-item spec at all —
 * i.e. an ordinary atom-mode batch, which this guard has nothing to say
 * about.
 */
export async function assertPracticeItemLaunchReady(
  atomSpecs: readonly AtomSpec[],
  deps: LaunchGuardDeps,
): Promise<void> {
  const formats = new Set<string>();
  for (const atomSpec of atomSpecs) {
    const practiceSpec = practiceItemSpecFromAtomSpec(atomSpec);
    if (practiceSpec) formats.add(practiceSpec.format);
  }
  if (formats.size === 0) return;

  const resolveSecondary = deps.resolveSecondary ?? resolveDistinctSecondaryModel;
  const wolframConfigured = deps.wolframConfigured ?? (() => !!process.env.WOLFRAM_APP_ID);

  if (formats.has('mcq') || formats.has('msq')) {
    const secondary = await resolveSecondary(deps.primaryModelId);
    if (!secondary) {
      throw new PracticeItemLaunchGuardError(
        'practice-item run refused at launch: mcq/msq specs need a second distinct-provider model for ' +
          'dual-model consensus (src/generation/practice-item-factory/answer-check.ts), but no such provider ' +
          'is configured — set a live API key for a provider other than the batch pipeline\'s primary ' +
          `(${deps.primaryModelId}) in config/providers.yaml.`,
      );
    }
  }
  if (formats.has('nat') && !wolframConfigured()) {
    throw new PracticeItemLaunchGuardError(
      'practice-item run refused at launch: nat specs need Wolfram|Alpha for verification ' +
        '(src/services/wolfram-service.ts), but WOLFRAM_APP_ID is not set.',
    );
  }
}
