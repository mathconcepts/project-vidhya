/**
 * src/content/prompt-registry/registry.ts
 *
 * In-process, module-scope registry — same shape as
 * src/scoring/marking-strategy.ts's register/resolve split (register()
 * throws on a duplicate id; resolve() is a synchronous lookup, no DB, no
 * network). No new service, no new latency on the generation hot path.
 */

import {
  RESOLVABLE_APPROVAL_STATES,
  type PromptResource,
  type ResourceCategory,
} from './types';

const _registry = new Map<string, PromptResource>();

/**
 * Registers a resource. Throws on a duplicate resource_id — same
 * discipline as registerMarkingStrategy() and AnswerVerifier's tier<4
 * refusal in registerVerifier(): a silently-shadowed resource is a worse
 * failure mode than a loud one at startup.
 */
export function registerPromptResource(resource: PromptResource): void {
  if (_registry.has(resource.resource_id)) {
    throw new Error(`registerPromptResource: duplicate resource_id "${resource.resource_id}"`);
  }
  _registry.set(resource.resource_id, resource);
}

/**
 * Resources currently resolvable for a given category + topic set.
 *
 * Only 'released' and 'pilot' resources are ever returned — 'draft',
 * 'benchmarked', 'deprecated' and 'blocked' resources are invisible to
 * prompt composition (mirrors pain-points.ts's getReviewedModule(): an
 * unreviewed resource never reaches a live prompt). A resource whose
 * `topics` includes '*' matches every topic; otherwise at least one of
 * the caller's topics must appear in the resource's own `topics` list.
 */
export function resolvePromptResources(
  category: ResourceCategory,
  topics: readonly string[],
): PromptResource[] {
  const out: PromptResource[] = [];
  for (const resource of _registry.values()) {
    if (resource.category !== category) continue;
    if (!RESOLVABLE_APPROVAL_STATES.has(resource.approval_state)) continue;
    const matches =
      resource.topics.includes('*') || topics.some((t) => resource.topics.includes(t));
    if (!matches) continue;
    out.push(resource);
  }
  return out;
}

/** Every registered resource, any category or approval_state — for the audit script and admin surfaces. */
export function listPromptResources(): PromptResource[] {
  return [..._registry.values()];
}

export function getPromptResource(resourceId: string): PromptResource | undefined {
  return _registry.get(resourceId);
}

/** For tests only — clears the singleton registry. */
export function __resetPromptResourceRegistryForTests(): void {
  _registry.clear();
}
