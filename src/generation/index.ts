/**
 * src/generation/
 *
 * GenerationRun orchestration — wraps the existing flywheel + concept
 * orchestrator with run lifecycle, cost metering, and dry-run estimates.
 *
 *   run-orchestrator — createRun / mark* lifecycle helpers
 *   cost-meter       — per-run cost accumulator with $ cap enforcement
 *   dry-run          — predict cost/duration before launching
 *
 * Import from this barrel.
 */

export {
  createRun,
  getRun,
  listRuns,
  markRunStarted,
  markRunComplete,
  markRunFailed,
  updateRunCost,
  incrementRunArtifacts,
} from './run-orchestrator';
export type { CreateRunInput } from './run-orchestrator';

export {
  CostMeter,
  RunBudgetExceeded,
  priceForCall,
  PRICING_VERSION,
} from './cost-meter';
export type { CostMeterOptions } from './cost-meter';

export { estimateRunCost } from './dry-run';
export type { CostEstimate } from './dry-run';
