// @ts-nocheck
/**
 * src/content/intent-classifier.ts
 *
 * Intent classification for content requests. Two strategies:
 *
 *   1. RULE-BASED (default, deterministic) — fast, testable, free
 *   2. LLM-BACKED (opt-in via VIDHYA_INTENT_CLASSIFIER=llm) —
 *      higher accuracy, costs a small LLM call per request
 *
 * The rule-based classifier ships and runs by default. The LLM
 * wrapper is scaffolded but falls back to rules if:
 *   - env var not set to 'llm'
 *   - no LLM keys configured
 *   - LLM call fails or takes longer than 2s
 *
 * This is the drop-in path documented in PENDING.md §4.6 — same
 * signature classifyIntent(text) -> Intent, just swap-in via env.
 */

export type Intent =
  | 'explain-concept'
  | 'walkthrough-problem'
  | 'verify-answer'
  | 'solve-for-me'
  | 'find-in-uploads'
  | 'practice-problem';

// ─── Rule-based (always available) ───────────────────────────────────

export function classifyByRules(text: string): Intent {
  const t = text.toLowerCase().trim();
  if (/(is my|check my|verify)\s+(answer|result|solution)/i.test(t)) return 'verify-answer';
  if (/^solve\s|^compute\s|^evaluate\s|^factoris/i.test(t))            return 'solve-for-me';
  if (/walk\s*me\s*through|step[\s-]*by[\s-]*step/i.test(t))           return 'walkthrough-problem';
  if (/(what did i|my upload|in my notes|in my files)/i.test(t))       return 'find-in-uploads';
  if (/(give me|show me|practice)\s+(a |an )?\s*(problem|question)/i.test(t)) return 'practice-problem';
  return 'explain-concept';
}

// ─── LLM-backed (opt-in) ─────────────────────────────────────────────

const CLASSIFIER_SYSTEM_PROMPT = `You classify a student's content request into exactly one intent.

Return only a single JSON object: {"intent": "<one of the 6 intents>"}.

Intents:
  - explain-concept: student wants a concept explained
  - walkthrough-problem: student wants a step-by-step walkthrough
  - verify-answer: student has an answer and wants it checked
  - solve-for-me: student wants a direct computation
  - find-in-uploads: student is looking for their own uploaded material
  - practice-problem: student wants a new problem to practise on

Fail closed — if ambiguous, return explain-concept.`;

/**
 * Startup warning when VIDHYA_INTENT_CLASSIFIER=llm is set but no LLM keys are
 * configured. Without this, operators silently fall back to rule-based
 * classification thinking they got the smarter LLM path. Per ER-D-P2B.
 *
 * Idempotent: only warns once per process. Call from server bootstrap.
 */
let _llmWarningFired = false;
export function warnIfLlmClassifierStubActive(env: Record<string, string | undefined> = process.env): void {
  if (_llmWarningFired) return;
  if (env.VIDHYA_INTENT_CLASSIFIER !== 'llm') return;
  const hasKey =
    !!env.GEMINI_API_KEY ||
    !!env.ANTHROPIC_API_KEY ||
    !!env.OPENAI_API_KEY ||
    !!env.VIDHYA_LLM_PRIMARY_KEY;
  if (!hasKey) {
    // eslint-disable-next-line no-console
    console.warn(
      'WARN: VIDHYA_INTENT_CLASSIFIER=llm but no LLM keys found ' +
        '(GEMINI_API_KEY / ANTHROPIC_API_KEY / OPENAI_API_KEY / VIDHYA_LLM_PRIMARY_KEY). ' +
        'Falling back to rule-based classifier.',
    );
  } else {
    // eslint-disable-next-line no-console
    console.warn(
      'WARN: VIDHYA_INTENT_CLASSIFIER=llm is set, but the LLM classifier path ' +
        'is currently a no-op stub. Rule-based classification is in effect. ' +
        'See src/content/intent-classifier.ts:_classifyByLLM.',
    );
  }
  _llmWarningFired = true;
}

/** Test-only helper: reset the warning idempotency flag between tests. */
export function _resetLlmWarningForTest(): void {
  _llmWarningFired = false;
}

/**
 * Async entry. Route to LLM if configured; fall back to rules on any
 * error, missing key, or timeout. Safe to call in a hot path.
 */
export async function classifyIntent(text: string): Promise<Intent> {
  if (process.env.VIDHYA_INTENT_CLASSIFIER !== 'llm') {
    return classifyByRules(text);
  }

  // Timeout wrapper — fall back to rules if LLM is slow
  const timeoutMs = parseInt(process.env.VIDHYA_INTENT_CLASSIFIER_TIMEOUT_MS || '2000', 10);

  try {
    const result = await Promise.race<Intent>([
      _classifyByLLM(text),
      new Promise<Intent>((_, rej) =>
        setTimeout(() => rej(new Error('classifier timeout')), timeoutMs),
      ),
    ]);
    return result;
  } catch {
    // All LLM errors — fall through to rules silently
    return classifyByRules(text);
  }
}

async function _classifyByLLM(text: string): Promise<Intent> {
  // Implementation hook — the LLM router is substantial and its exact
  // wiring depends on the deployment's configured provider. For now
  // this method is a scaffolded no-op that returns rules; when an
  // operator wants to activate LLM classification, they wire in the
  // actual LLM call here.
  //
  // The interface above (classifyIntent) is stable — callers don't
  // need to change when the LLM path lights up.
  return classifyByRules(text);
}

// ─── Synchronous compatibility ────────────────────────────────────────

/**
 * Sync variant for callers that can't use async. Always uses rules.
 * The async classifyIntent() is preferred.
 */
export function classifyIntentSync(text: string): Intent {
  return classifyByRules(text);
}
