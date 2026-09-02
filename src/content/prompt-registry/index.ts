/**
 * src/content/prompt-registry/index.ts
 *
 * Barrel: registers every built-in resource exactly once (idempotent —
 * safe to import from multiple call sites, e.g. orchestrator.ts and
 * scripts/content-registry-audit.ts, without a duplicate-resource_id
 * throw). A future non-built-in resource (an admin-authored one, once a
 * UI exists) would register itself the same way at its own module's
 * import time — nothing here is hardcoded to "only these files."
 */

import { registerTeachingBlockResources } from './resources/teaching-blocks';
import { registerModifierResources } from './resources/modifiers';
import { registerPersonaResources } from './resources/personas';
import { __resetPromptResourceRegistryForTests as _resetRegistry } from './registry';

let _registered = false;

export function ensureBuiltInPromptResourcesRegistered(): void {
  if (_registered) return;
  registerTeachingBlockResources();
  registerModifierResources();
  registerPersonaResources();
  _registered = true;
}

/**
 * Test-only. Clears the registry AND the "already registered built-ins"
 * flag, so a test can reset() then re-call ensureBuiltInPromptResources
 * Registered() and get a fresh, fully-populated registry — resetting
 * registry.ts's map alone would leave this module's flag stuck `true`
 * and silently skip re-registration.
 */
export function __resetPromptRegistryModuleForTests(): void {
  _resetRegistry();
  _registered = false;
}

export {
  registerPromptResource,
  resolvePromptResources,
  listPromptResources,
  getPromptResource,
} from './registry';
export { runPromptResourceContract, type PromptResourceContractResult } from './contract';
export * from './types';
