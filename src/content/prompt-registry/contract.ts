/**
 * src/content/prompt-registry/contract.ts
 *
 * Every PromptResource must pass this before it can be registered at
 * approval_state 'released' or 'pilot' — same shape as
 * src/scoring/marking-strategy-contract.ts's runMarkingStrategyContract
 * and src/verification/verifiers/contract.ts's runAnswerVerifierContract.
 * A new resource author runs this against their implementation the same
 * way EXTENDING.md already documents for AnswerVerifier/ContentVerifier —
 * no new discovery cost for anyone who has extended one of those.
 */

import { RESOLVABLE_APPROVAL_STATES, type PromptResource } from './types';

export interface PromptResourceContractResult {
  ok: boolean;
  errors: string[];
}

const SYNTHETIC_ARGS = {
  concept_id: '__contract_test_concept__',
  topic_family: '__contract_test_topic_family__',
  atom_type: 'hook',
  generation_context: 'batch' as const,
};

export async function runPromptResourceContract(
  resource: PromptResource,
): Promise<PromptResourceContractResult> {
  const errors: string[] = [];

  if (!resource.resource_id) errors.push('resource_id is required');
  if (!resource.version) errors.push('version is required');
  if (!resource.category) errors.push('category is required');
  if (!resource.topics || resource.topics.length === 0) errors.push('topics must be non-empty');

  if (RESOLVABLE_APPROVAL_STATES.has(resource.approval_state) && resource.test_fixtures.length === 0) {
    errors.push(`approval_state "${resource.approval_state}" requires at least one test_fixture`);
  }

  // build() must never throw for a well-formed call, even one it has
  // nothing to say for.
  let output: string;
  try {
    output = resource.build(SYNTHETIC_ARGS);
  } catch (e) {
    errors.push(`build() threw on a synthetic call: ${(e as Error).message}`);
    return { ok: false, errors };
  }
  if (typeof output !== 'string') {
    errors.push('build() must return a string (empty string for "not applicable")');
  }

  // No-leakage check: a resource scoped to a specific topic must produce
  // nothing for a topic it isn't registered against (unless it declares
  // '*'). Catches a resource whose build() ignores its own `topics` scope.
  if (!resource.topics.includes('*')) {
    const outsideTopicArgs = { ...SYNTHETIC_ARGS, topic_family: '__contract_test_outside_scope__' };
    let outsideOutput: string;
    try {
      outsideOutput = resource.build(outsideTopicArgs);
    } catch (e) {
      errors.push(`build() threw on an out-of-scope synthetic call: ${(e as Error).message}`);
      return { ok: false, errors };
    }
    if (outsideOutput !== '') {
      errors.push('build() must return "" for a topic outside its declared `topics` scope');
    }
  }

  return { ok: errors.length === 0, errors };
}
