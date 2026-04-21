// @ts-nocheck
/**
 * Rendering Types
 *
 * The rendering layer sits between the canonical Lesson (produced by
 * src/lessons/composer.ts) and the user's screen. It does two things:
 *
 * 1. Enrichment — Adds InteractiveBlocks to pedagogically-dense lesson
 *    components where interactivity improves resonance (worked examples
 *    benefit from step-by-step reveal; common traps benefit from
 *    flashcard-style flip; derivations benefit from scroll-driven
 *    animation).
 *
 * 2. Channel rendering — Produces the right representation for each
 *    delivery channel:
 *      - Web: rich HTML + Framer-Motion animation descriptors
 *      - Telegram: HTML text + inline keyboards (progressive reveal)
 *      - WhatsApp: Markdown + numbered-list stepping
 *      - Voice: SSML-friendly narration text
 *
 * The canonical Lesson is UNCHANGED by rendering. All enrichment sits
 * on top. This preserves the cache-stable property of Lessons.
 */

// ============================================================================
// Interactive block types — the enrichment vocabulary
// ============================================================================

/**
 * A single revealable piece of content. Used inside StepRevealBlock
 * and FlipCardBlock.
 */
export interface RevealFragment {
  id: string;
  label?: string;                  // prompt shown before reveal ("Next step")
  content_md: string;              // markdown-safe content
  latex?: string;                  // optional rendered math
  voice_narration?: string;        // plain-text SSML-friendly version
}

/**
 * StepRevealBlock — a sequence of steps revealed one at a time.
 * Used for worked examples and derivations.
 *
 * Web: collapses by default; tap/swipe to reveal next step with
 *      slide-in animation.
 * Telegram: first step + "Next step" button that edits the message
 *      to append the next step (progressive disclosure).
 * WhatsApp: all steps numbered 1..N as plain text.
 * Voice: each step narrated sequentially with pauses.
 */
export interface StepRevealBlock {
  kind: 'step-reveal';
  id: string;
  title?: string;
  steps: RevealFragment[];
  /** Meta: is there a single "aha moment" step? Highlighted across channels. */
  key_step_index?: number;
}

/**
 * FlipCardBlock — a set of cards that flip between prompt and explanation.
 * Used for common traps (each trap is a card: prompt = the mistake,
 * back = why students make it + how to avoid).
 *
 * Web: 3D flip animation on tap.
 * Telegram: two-message sequence — prompt first, tap "Show why"
 *      to get the explanation.
 * WhatsApp: "Trap 1: [prompt]. → [explanation]" format.
 * Voice: spoken as "Here's a common mistake: X. Here's why: Y."
 */
export interface FlipCardBlock {
  kind: 'flip-card';
  id: string;
  title?: string;
  cards: Array<{
    id: string;
    prompt: RevealFragment;
    explanation: RevealFragment;
    student_quote?: string;         // "I used to always..." — humanizes
  }>;
}

/**
 * QuickCheckBlock — a tiny 1-question check with instant feedback.
 * Used for micro-exercise components.
 *
 * Web: tap answer → animated feedback with color + hint if wrong.
 * Telegram: 2-4 inline keyboard buttons → callback_data reports result.
 * WhatsApp: numbered options → reply with number.
 * Voice: skipped (no input modality).
 */
export interface QuickCheckBlock {
  kind: 'quick-check';
  id: string;
  prompt_md: string;
  options: Array<{
    id: string;
    text: string;
    latex?: string;
    is_correct: boolean;
    feedback_if_wrong_md?: string;  // explains the mistake
  }>;
  correct_feedback_md: string;      // shown on correct answer
}

/**
 * AnimatedDerivationBlock — a sequence of mathematical lines where
 * each line is a transformation of the previous.
 *
 * Web: each line fades in + highlights the changed portion;
 *      "replay" button.
 * Telegram: numbered list, one line per row, with → arrows
 *      indicating the transformation.
 * WhatsApp: same numbered format.
 * Voice: narrates "starting with X; we multiply both sides by Y;
 *       this gives us Z"
 */
export interface AnimatedDerivationBlock {
  kind: 'animated-derivation';
  id: string;
  title?: string;
  lines: Array<{
    id: string;
    latex: string;
    rationale_md: string;           // "because we divided both sides by..."
    voice_narration?: string;
  }>;
}

/**
 * DragMatchBlock — match items in column A to items in column B.
 * Used for connections between concepts, or definition-to-example.
 *
 * Web: drag-to-match with animated snap + highlight.
 * Telegram: quiz-style — "Which of the following matches 'eigenvector'?"
 *      cycled through items.
 * WhatsApp: skipped (degrade to text list).
 */
export interface DragMatchBlock {
  kind: 'drag-match';
  id: string;
  title?: string;
  pairs: Array<{
    id: string;
    left: RevealFragment;
    right: RevealFragment;
  }>;
  /** Decoys on the right side to make matching harder (optional) */
  right_decoys?: RevealFragment[];
}

/**
 * CalloutBlock — a small highlighted callout. NOT really interactive,
 * but carries a mood (tip / warning / insight) that affects rendering
 * across channels.
 */
export interface CalloutBlock {
  kind: 'callout';
  id: string;
  mood: 'tip' | 'warning' | 'insight' | 'gotcha';
  content_md: string;
}

export type InteractiveBlock =
  | StepRevealBlock
  | FlipCardBlock
  | QuickCheckBlock
  | AnimatedDerivationBlock
  | DragMatchBlock
  | CalloutBlock;

// ============================================================================
// Enriched lesson — extends canonical Lesson with interactive blocks
// ============================================================================

/**
 * A mapping from lesson-component-id to the interactive blocks that
 * enrich it. Multiple blocks per component are allowed.
 *
 * Stored separately from the canonical Lesson so that:
 *   a. Caching of the base Lesson is preserved
 *   b. A/B testing of different enrichment strategies is trivial
 *   c. Channels with no interactivity (WhatsApp plain text) can skip
 *      enrichment lookup entirely
 */
export type EnrichmentMap = Record<string, InteractiveBlock[]>;

export interface EnrichedLesson {
  /** The canonical base Lesson — preserved exactly */
  lesson: any;  // Lesson type from src/lessons/types — avoid circular import
  enrichments: EnrichmentMap;
  /** Which channels this enrichment is optimized for */
  channel_hints: string[];
}

// ============================================================================
// Channel types
// ============================================================================

export type DeliveryChannel = 'web' | 'telegram' | 'whatsapp' | 'voice';

/**
 * The result of rendering a lesson for a specific channel. The shape
 * differs per channel; the caller knows which channel they asked for.
 */
export type RenderedLesson =
  | { channel: 'web'; blocks: WebBlock[] }
  | { channel: 'telegram'; messages: TelegramMessage[] }
  | { channel: 'whatsapp'; messages: WhatsAppMessage[] }
  | { channel: 'voice'; narration: VoiceSegment[] };

// ── Web ─────────────────────────────────────────────────────────────────────

export type WebBlock =
  | { type: 'prose'; component_id: string; content_md: string }
  | { type: 'latex'; component_id: string; latex: string; display: boolean }
  | { type: 'interactive'; component_id: string; block: InteractiveBlock };

// ── Telegram ────────────────────────────────────────────────────────────────

export interface TelegramMessage {
  text: string;                      // HTML-safe Telegram markup
  parse_mode: 'HTML' | 'MarkdownV2';
  keyboard?: Array<Array<{
    text: string;
    callback_data: string;           // opaque routing string: "reveal:{block_id}:{step}"
  }>>;
  /** For progressive-reveal blocks, the id of the interactive that
   *  governs this message. Webhook uses this to route callbacks. */
  interactive_id?: string;
  /** If set, a static image URL to send before the text (for diagrams) */
  image_url?: string;
}

// ── WhatsApp ────────────────────────────────────────────────────────────────

export interface WhatsAppMessage {
  text: string;                      // plain markdown
  interactive_numbered?: Array<{ number: number; text: string }>;
}

// ── Voice ───────────────────────────────────────────────────────────────────

export interface VoiceSegment {
  text: string;                      // plain, SSML-friendly narration
  pause_after_ms?: number;
  emphasis?: 'none' | 'moderate' | 'strong';
}
