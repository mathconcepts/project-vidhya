/**
 * src/scoring/adapters — concrete LLMJudge + CASChecker.
 *
 * Pure barrel. Pulls the rubric grader's two contracts into impls that
 * wrap the project's existing LLM runtime + verification cascade.
 */

export { RuntimeLLMJudge, makeRuntimeJudge, buildPrompt, parseJudgeResponse, MAX_RESPONSE_CHARS, MAX_SOLUTION_CHARS } from './llm-judge';
export { TieredCASChecker, makeCASChecker, CAS_TRUST_THRESHOLD } from './cas-checker';
