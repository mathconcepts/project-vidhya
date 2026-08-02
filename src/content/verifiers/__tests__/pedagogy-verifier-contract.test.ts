/**
 * Wires pedagogyVerifier — the one real ContentVerifier implementation in
 * the codebase — into its own contract test (CEO plan Phase 0 §4 "the
 * law": one interface, one config source, one CI conformance suite every
 * implementation must pass).
 *
 * Before this file, `runContentVerifierContract` existed
 * (src/content/verifiers/contract.ts) and EXTENDING.md documented the
 * pattern, but nothing in the test suite actually called it — the
 * contract was scaffolded but not CI-enforced. This closes that gap for
 * the seam registered in seam-registry.json.
 *
 * No LLM keys are configured in CI / this sandbox — pedagogyVerifier
 * fails closed on `getLlmForRole()` returning null (see its own
 * docblock), so this exercises the real fail-closed path, not a mock.
 */

import { runContentVerifierContract } from '../contract';
import { pedagogyVerifier } from '../pedagogy-verifier';

runContentVerifierContract(pedagogyVerifier);
