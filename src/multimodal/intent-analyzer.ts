// @ts-nocheck
/**
 * Intent Analyzer
 *
 * Single-shot vision call that reads an image (+ optional text + hinted intent)
 * and produces a structured IntentAnalysis. Downstream handlers dispatch on
 * analysis.intent to produce the response — explain / solve / practice / check.
 *
 * Cost optimization:
 *   - Uses Gemini 2.5 Flash-Lite (3× cheaper than Flash, vision-capable)
 *   - Structured JSON output → no re-parsing
 *   - Single call per request — we do NOT re-call for the response generation;
 *     intent-specific handlers use cached tier-0 content where possible.
 *
 * Privacy:
 *   - Image bytes flow through Gemini but are NEVER persisted on our side
 *   - We log only categorical fields (intent, concept, topic) to aggregate
 *   - User text is used for analysis but stripped before telemetry
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import type { MultimodalRequest, IntentAnalysis, ImageCategory, MultimodalIntent } from './types';
import { ALL_CONCEPTS } from '../constants/concept-graph';
import { resolveConfig, loadConfigFromEnv, type LLMConfig } from '../llm/config-resolver';
import { callChat } from '../api/llm-config-routes';

// ============================================================================
// Concept ID whitelist — used to sanity-check Gemini's detected_concepts field
// ============================================================================

const VALID_CONCEPT_IDS = new Set(ALL_CONCEPTS.map(c => c.id));
const VALID_TOPICS = new Set(ALL_CONCEPTS.map(c => c.topic));
const VALID_INTENTS: MultimodalIntent[] = [
  'concept_question', 'solution_check', 'practice_request',
  'expressing_confusion', 'solve_problem', 'extract_text',
];
const VALID_CATEGORIES: ImageCategory[] = [
  'math-problem', 'handwritten-work', 'textbook-page',
  'diagram', 'formula-sheet', 'screenshot', 'unclear',
];

// ============================================================================
// Prompt
// ============================================================================

function buildPrompt(req: MultimodalRequest): string {
  const hintLine = req.user_hinted_intent
    ? `The user has tapped an explicit intent button: "${req.user_hinted_intent}". Use this unless the image clearly contradicts it.`
    : '';
  const textLine = req.text && req.text.trim()
    ? `User's caption: "${req.text.trim().slice(0, 500)}"`
    : 'User provided no text caption.';

  return `You are Vidhya's Intent Analyzer. Given an image (and optional caption), classify it and extract math-specific metadata. Respond with ONLY a JSON object (no markdown, no prose).

Image categories (pick one):
- math-problem: a textbook-style problem statement
- handwritten-work: student's handwritten solution attempt
- textbook-page: a page of explanatory material
- diagram: graph, geometry, circuit, or pictorial aid
- formula-sheet: cheatsheet / reference card
- screenshot: screen capture from an app or site
- unclear: not math-related or unreadable

Intents (pick one):
- concept_question: student wants an overview / explanation of the concept
- solve_problem: wants a worked solution
- practice_request: wants similar problems to try
- solution_check: student has shown their work, wants verification or error spotting
- expressing_confusion: stuck, wants step-by-step walkthrough
- extract_text: wants OCR transcription, no reasoning

${hintLine}

${textLine}

Detect math concepts from this set (return concept_id strings matching exactly): eigenvalues, determinants, matrix-rank, matrix-operations, systems-linear, diagonalization, limits, continuity, differentiability, derivatives-basic, chain-rule, product-quotient-rule, maxima-minima, mean-value-theorems, integration-basics, integration-by-parts, definite-integrals, partial-derivatives, taylor-series, first-order-linear, second-order-linear, bayes-theorem, continuous-distributions, hypothesis-testing, cauchy-riemann, complex-integration, graph-coloring, graph-connectivity, fourier-series, laplace-transform, vector-calculus, gradient, divergence-curl.

Math topics: calculus, linear-algebra, differential-equations, probability-statistics, complex-variables, numerical-methods, transform-theory, vector-calculus, discrete-mathematics, graph-theory.

Output schema:
{
  "image_category": "math-problem" | "handwritten-work" | ...,
  "intent": "concept_question" | ... ,
  "intent_confidence": 0.0 to 1.0,
  "detected_concepts": ["concept-id", ...],
  "detected_topic": "calculus" | null,
  "extracted_problem_text": "LaTeX-preserving transcription of the problem, or null",
  "extracted_student_answer": "student's final answer if visible, or null",
  "estimated_difficulty": 0.0 to 1.0,
  "detected_error_type": "arithmetic" | "conceptual" | "notation" | "procedural" | "misreading" | null,
  "detected_misconception": "brief description of the misconception if any, or null",
  "summary": "one-sentence description of what the image contains"
}`;
}

// ============================================================================
// Response sanitizer — defends against invalid LLM output
// ============================================================================

function sanitize(raw: any, req: MultimodalRequest): IntentAnalysis {
  const fallback: IntentAnalysis = {
    image_category: 'unclear',
    intent: req.user_hinted_intent || 'concept_question',
    intent_confidence: 0,
    detected_concepts: [],
    detected_topic: null,
    extracted_problem_text: null,
    extracted_student_answer: null,
    estimated_difficulty: 0.5,
    detected_error_type: null,
    detected_misconception: null,
    summary: 'Unable to analyze the image.',
  };

  if (!raw || typeof raw !== 'object') return fallback;

  const category = VALID_CATEGORIES.includes(raw.image_category)
    ? raw.image_category
    : 'unclear';

  const intent = VALID_INTENTS.includes(raw.intent)
    ? raw.intent
    : (req.user_hinted_intent || 'concept_question');

  const conf = Number(raw.intent_confidence);
  const intentConfidence = Number.isFinite(conf) && conf >= 0 && conf <= 1 ? conf : 0.5;

  const concepts = Array.isArray(raw.detected_concepts)
    ? raw.detected_concepts.filter((c: any) => typeof c === 'string' && VALID_CONCEPT_IDS.has(c))
    : [];

  const topic = typeof raw.detected_topic === 'string' && VALID_TOPICS.has(raw.detected_topic)
    ? raw.detected_topic
    : null;

  const diff = Number(raw.estimated_difficulty);
  const difficulty = Number.isFinite(diff) && diff >= 0 && diff <= 1 ? diff : 0.5;

  const safeStr = (v: any, max: number) =>
    typeof v === 'string' && v.length > 0 && v.length <= max ? v : null;

  return {
    image_category: category,
    intent,
    intent_confidence: intentConfidence,
    detected_concepts: concepts,
    detected_topic: topic,
    extracted_problem_text: safeStr(raw.extracted_problem_text, 2000),
    extracted_student_answer: safeStr(raw.extracted_student_answer, 500),
    estimated_difficulty: difficulty,
    detected_error_type: safeStr(raw.detected_error_type, 50),
    detected_misconception: safeStr(raw.detected_misconception, 500),
    summary: safeStr(raw.summary, 500) || 'Image received.',
  };
}

// ============================================================================
// Main analyzer
// ============================================================================

/**
 * Analyze a multimodal input. Returns a structured IntentAnalysis.
 *
 * Graceful degradation: when GEMINI_API_KEY is missing or the call fails,
 * falls back to the user's hinted intent (or 'concept_question') with
 * image_category='unclear'. Downstream handlers still work, they just can't
 * personalize as well.
 */
export async function analyzeIntent(
  req: MultimodalRequest,
  llm_config?: LLMConfig | null,
): Promise<IntentAnalysis> {
  // Resolve which provider handles vision for this request
  const config = llm_config || loadConfigFromEnv();
  if (!config) return sanitize(null, req);
  const resolved = resolveConfig(config).vision;
  if (!resolved) return sanitize(null, req);

  try {
    // Gemini gets the SDK path (keeps existing streaming + inlineData semantics)
    if (resolved.provider_id === 'google-gemini') {
      const genAI = new GoogleGenerativeAI(resolved.key || '');
      const model = genAI.getGenerativeModel({
        model: resolved.model_id,
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.1,
        },
      });
      const prompt = buildPrompt(req);
      const result = await model.generateContent([
        prompt,
        { inlineData: { mimeType: req.image_mime_type || 'image/jpeg', data: req.image } },
      ]);
      const text = result.response.text();
      const parsed = JSON.parse(text);
      return sanitize(parsed, req);
    }

    // Other providers — use the universal adapter with a text-shaped prompt.
    // (MVP: image-input shape varies by provider; full multimodal for
    // non-Gemini providers is a follow-up. We still get hinted-intent
    // + caption-based classification.)
    const textOnlyPrompt = buildPrompt(req) +
      '\n\nNOTE: Classify based on user caption only (image analysis for this provider is a follow-up).';
    const text = await callChat({
      provider_id: resolved.provider_id,
      endpoint: resolved.endpoint,
      key: resolved.key,
      model_id: resolved.model_id,
      prompt: textOnlyPrompt,
      max_tokens: 512,
    });
    const parsed = JSON.parse(text);
    return sanitize(parsed, req);
  } catch {
    return sanitize(null, req);
  }
}
