// @ts-nocheck
/**
 * Multimodal Input Types
 *
 * The types that describe what a user sends (image + optional text + hinted
 * intent), what the system decides about it, and what we log to GBrain.
 *
 * Every multimodal turn produces:
 *   1. A MultimodalRequest from the client
 *   2. An IntentAnalysis (vision + reasoning to decide route)
 *   3. A MultimodalResponse tailored to the resolved intent
 *   4. A GBrainEvent logged to aggregate telemetry
 *
 * The StudentIntent taxonomy is shared with src/gbrain/task-reasoner.ts so
 * downstream GBrain pillars can operate on the same vocabulary.
 */

import type { StudentIntent } from '../gbrain/task-reasoner';

/**
 * Fine-grained intent the vision analyzer resolves to. Subset of StudentIntent
 * plus two image-specific modes that don't exist in text-only chat.
 */
export type MultimodalIntent =
  // Reuse from StudentIntent
  | 'concept_question'        // "What is this about?" — wants an overview / explanation
  | 'solution_check'          // "Did I do this right?" — wants verification of their work
  | 'practice_request'        // "Give me more like this" — wants similar problems
  | 'expressing_confusion'    // "I'm stuck" — wants step-by-step walkthrough
  // Image-specific
  | 'solve_problem'           // Pure "solve this problem" — show work, give answer
  | 'extract_text';           // Just transcribe — OCR mode for note-capture

export type ImageCategory =
  | 'math-problem'
  | 'handwritten-work'
  | 'textbook-page'
  | 'diagram'
  | 'formula-sheet'
  | 'screenshot'
  | 'unclear';

/**
 * Client-side payload. The image is base64-encoded, already sized-down in
 * the browser before upload to keep bandwidth and cost low.
 */
export interface MultimodalRequest {
  /** base64-encoded image bytes */
  image: string;
  image_mime_type: string;
  /** Max 2000 chars. Optional — user may upload an image with no caption. */
  text?: string;
  /** Hinted intent from UI (student tapped "Explain" vs "Solve"). Optional. */
  user_hinted_intent?: MultimodalIntent;
  /** Target exam scope. Affects response shape (shortcut vs full derivation). */
  scope?: 'mcq-fast' | 'mcq-rigorous' | 'subjective-short' | 'subjective-long' | 'oral-viva' | 'practical';
  /** Session ID for GBrain personalization. Optional for anonymous users. */
  session_id?: string;
  /** Optional student snapshot passed from IndexedDB for personalization. */
  student?: {
    total_attempts?: number;
    mastery_by_concept?: Record<string, number>;
    recent_errors?: Array<{ concept_id: string; error_type: string }>;
    zpd_concepts?: string[];
  };
}

/**
 * The LLM's reading of the image + inferred intent.
 * This is the bridge between "raw pixels" and "GBrain-typed event".
 */
export interface IntentAnalysis {
  /** High-level kind of image */
  image_category: ImageCategory;
  /** Detected intent. Takes user_hinted_intent into account. */
  intent: MultimodalIntent;
  /** 0..1 confidence in the intent classification */
  intent_confidence: number;

  /** Math concept IDs detected (kebab-case, from concept-graph) */
  detected_concepts: string[];
  /** Math topic bucket (one of the 10) */
  detected_topic: string | null;
  /** Extracted LaTeX transcription of the problem if any */
  extracted_problem_text: string | null;
  /** Extracted or photographed answer (what the student thought was correct) */
  extracted_student_answer: string | null;

  /** 0..1 estimate based on problem features */
  estimated_difficulty: number;

  /** If an answer sheet or handwritten work → attempt error diagnosis */
  detected_error_type: string | null;
  detected_misconception: string | null;

  /** Short free-form caption the model generated while reasoning */
  summary: string;
}

/**
 * The system's response. Contains what the student asked for plus provenance
 * (which tier served the practice, whether Wolfram verified it, etc.)
 */
export interface MultimodalResponse {
  request_id: string;
  processed_at: string;
  analysis: IntentAnalysis;

  /** Primary payload — exactly one of these is populated based on intent */
  explanation?: {
    summary: string;        // 2-3 sentences
    steps: string[];        // step-by-step walkthrough if a problem
    key_concepts: string[]; // concept_ids referenced
    example?: string;       // a worked mini-example if helpful
  };

  practice_problems?: Array<{
    id: string;
    concept_id: string;
    topic: string;
    difficulty: number;
    question_text: string;
    correct_answer: string;
    source: string;           // tier-0 / tier-2 / etc.
    wolfram_verified: boolean;
  }>;

  solution?: {
    final_answer: string;
    steps: string[];
    verification_method?: 'wolfram' | 'self-verify' | 'bundle-match' | 'none';
  };

  ocr?: {
    text: string;             // raw transcription
    latex: string;            // normalized LaTeX form
  };

  /** Additional structured hints */
  strategy_hints?: string[];

  /** Cost + latency for observability */
  latency_ms: number;
  cost_estimate_usd: number;
}

/**
 * What gets logged to GBrain aggregate telemetry.
 *
 * Strict privacy: NO raw image bytes, NO free text from the student.
 * Only categorical fields that match the anonymous aggregate schema.
 */
export interface GBrainEvent {
  event_type: 'multimodal_input';
  intent: MultimodalIntent;
  intent_confidence: number;
  image_category: ImageCategory;
  detected_topic: string | null;
  detected_concept_id: string | null;  // primary concept, first from detected_concepts
  estimated_difficulty: number;
  detected_error_type: string | null;
  scope: string | null;
  /** Whether the system could give a useful answer vs fell back to "unclear" */
  handled_successfully: boolean;
  /** Path taken in the resolver */
  response_tier: 'bundle' | 'rag' | 'generated' | 'mixed' | 'failed';
  latency_ms: number;
  cost_estimate_usd: number;
  session_id?: string;
}
