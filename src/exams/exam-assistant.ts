// @ts-nocheck
/**
 * Exam Assistant — conversational setup helper
 *
 * Instead of dumping a 20-field form on the admin, the assistant walks them
 * through the setup in small conversational turns. It knows:
 *   - What fields are still missing
 *   - Which are highest-priority (from suggestNextFields)
 *   - How to phrase questions warmly
 *
 * The assistant is stateless on the backend — each call receives the
 * current exam state + last admin message, and returns the next turn.
 * The frontend holds the conversation history in component state.
 *
 * Three invocation modes:
 *   1. 'open'  — first contact, no prior turns. Assistant greets and
 *                proposes the next action based on completeness.
 *   2. 'reply' — admin sent a message. Assistant interprets + responds.
 *                May return field_updates to apply.
 *   3. 'tip'   — admin asked "what should I do next?". Returns guidance.
 *
 * Assistant never hallucinates exam content — when it needs facts, it
 * recommends the admin run "auto-enrich" (which uses exam-enrichment.ts)
 * or upload local data.
 */

import type { Exam, ExamAssistantTurn } from './types';
import { suggestNextFields, isEnrichmentAvailable } from './exam-enrichment';
import { getCompletenessBreakdown } from './exam-store';

export interface AssistantRequest {
  mode: 'open' | 'reply' | 'tip';
  exam: Exam;
  admin_message?: string;
  history?: ExamAssistantTurn[];
}

export interface AssistantResponse {
  turn: ExamAssistantTurn;
  actions?: Array<{
    kind: 'suggest_enrich' | 'suggest_upload' | 'suggest_manual_edit' | 'mark_ready';
    label: string;
    field?: string;
  }>;
}

// ============================================================================
// Opening turn — first contact
// ============================================================================

function openingTurn(exam: Exam): AssistantResponse {
  const completenessPct = Math.round(exam.completeness * 100);
  const suggestions = suggestNextFields(exam);
  const topSuggestion = suggestions[0];
  const hasEnrichment = isEnrichmentAvailable();

  let content: string;
  const quickReplies: string[] = [];
  const actions: AssistantResponse['actions'] = [];

  if (completenessPct < 20) {
    content = `Welcome — you've started setting up **${exam.name}**. Right now the exam profile is ${completenessPct}% complete, so we have work to do.`;
    if (hasEnrichment) {
      content += `\n\nThe fastest way to get started: let me research this exam automatically. I'll fill in what I can find, and you can review and correct anything.`;
      quickReplies.push('Auto-enrich from web', 'I\'ll fill it manually', 'Let me upload some notes first');
      actions.push({ kind: 'suggest_enrich', label: 'Auto-enrich from web' });
      actions.push({ kind: 'suggest_upload', label: 'Upload local data' });
    } else {
      content += `\n\nAutomatic enrichment is not configured on this instance, so we'll add the details manually. Don't worry — we can do this a few fields at a time, and you can leave anything unknown for later.`;
      quickReplies.push('Start with the basics', 'Upload local data', 'Where should I begin?');
    }
  } else if (completenessPct < 70) {
    content = `**${exam.name}** is ${completenessPct}% complete. You've got the foundation in — let's fill in the rest.`;
    if (topSuggestion) {
      content += `\n\nThe most impactful thing to add next: **${topSuggestion.label}**. ${topSuggestion.reason}`;
      quickReplies.push(`Add ${topSuggestion.label.toLowerCase()}`, 'Show me everything missing', 'Auto-enrich');
      actions.push({ kind: 'suggest_manual_edit', label: `Add ${topSuggestion.label.toLowerCase()}`, field: topSuggestion.field });
    }
  } else {
    content = `**${exam.name}** is looking good — ${completenessPct}% complete. You can mark it ready to use for students, or keep refining.`;
    quickReplies.push('Mark it ready', 'What am I still missing?', 'Review full profile');
    actions.push({ kind: 'mark_ready', label: 'Mark ready for students' });
  }

  return {
    turn: {
      role: 'assistant',
      content,
      suggestions: quickReplies,
      timestamp: new Date().toISOString(),
    },
    actions,
  };
}

// ============================================================================
// Tip turn — "what should I do next?"
// ============================================================================

function tipTurn(exam: Exam): AssistantResponse {
  const suggestions = suggestNextFields(exam);
  const breakdown = getCompletenessBreakdown(exam);

  if (suggestions.length === 0) {
    return {
      turn: {
        role: 'assistant',
        content: `This exam is in great shape. You can mark it ready for students now, or keep filling optional fields — the more complete it is, the more tailored the student experience will be.`,
        suggestions: ['Mark ready', 'Show full profile'],
        timestamp: new Date().toISOString(),
      },
      actions: [{ kind: 'mark_ready', label: 'Mark ready for students' }],
    };
  }

  const lines = [`Here's what I'd prioritize next for **${exam.name}**:`];
  suggestions.forEach((s, i) => {
    lines.push(`\n${i + 1}. **${s.label}** — ${s.reason}`);
  });

  const weakestCategory = breakdown
    .filter(c => c.filled < c.total)
    .sort((a, b) => a.filled / a.total - b.filled / b.total)[0];
  if (weakestCategory) {
    lines.push(`\n\nThe category most in need of attention is **${weakestCategory.category}** (${weakestCategory.filled}/${weakestCategory.total} fields filled).`);
  }

  return {
    turn: {
      role: 'assistant',
      content: lines.join(''),
      suggestions: suggestions.slice(0, 3).map(s => `Fill ${s.label.toLowerCase()}`),
      timestamp: new Date().toISOString(),
    },
    actions: suggestions.slice(0, 3).map(s => ({
      kind: 'suggest_manual_edit' as const,
      label: s.label,
      field: s.field,
    })),
  };
}

// ============================================================================
// Reply turn — interpret admin's free-text message
// ============================================================================

function replyTurn(exam: Exam, message: string): AssistantResponse {
  const msg = message.toLowerCase().trim();

  // Intent: enrich
  if (/auto.?enrich|research|web|find it|look it up|fill.+for me/i.test(msg)) {
    if (!isEnrichmentAvailable()) {
      return {
        turn: {
          role: 'assistant',
          content: `I'd love to, but no LLM provider is configured on this instance. Ask your deployment admin to set \`GEMINI_API_KEY\`, \`ANTHROPIC_API_KEY\`, or \`OPENAI_API_KEY\`. In the meantime, we can fill fields manually — or you can upload some reference text and I can at least structure that.`,
          suggestions: ['Upload local data', 'Fill manually', 'What\'s needed?'],
          timestamp: new Date().toISOString(),
        },
        actions: [{ kind: 'suggest_upload', label: 'Upload local data' }],
      };
    }
    return {
      turn: {
        role: 'assistant',
        content: `Good call. Let me research **${exam.name}** and fill in what I can find. I'll never overwrite anything you've entered manually — you'll get a proposal to review.`,
        suggestions: ['Go ahead', 'First let me add some notes'],
        timestamp: new Date().toISOString(),
      },
      actions: [{ kind: 'suggest_enrich', label: 'Run auto-enrichment now' }],
    };
  }

  // Intent: upload local data
  if (/upload|paste|add (notes|syllabus|pdf|info)|attach/i.test(msg)) {
    return {
      turn: {
        role: 'assistant',
        content: `Perfect — local data always takes priority over web research. You can paste the official syllabus, prep-guide text, past-paper content, or any URL. I'll use it as authoritative context when filling fields.\n\nOpen the "Local data" tab on the exam page to upload.`,
        suggestions: ['Opened it', 'What format should I use?'],
        timestamp: new Date().toISOString(),
      },
      actions: [{ kind: 'suggest_upload', label: 'Open Local data tab' }],
    };
  }

  // Intent: ready
  if (/ready|mark (it )?done|finish|publish|make.+available/i.test(msg)) {
    if (exam.completeness < 0.5) {
      return {
        turn: {
          role: 'assistant',
          content: `It's at ${Math.round(exam.completeness * 100)}% — you can mark it ready, but students may see some "not yet defined" placeholders. I'd recommend at least adding the syllabus and marking scheme first. Want to do that?`,
          suggestions: ['Mark ready anyway', 'Add syllabus first', 'Show me what\'s missing'],
          timestamp: new Date().toISOString(),
        },
        actions: [
          { kind: 'mark_ready', label: 'Mark ready anyway' },
          { kind: 'suggest_manual_edit', label: 'Add syllabus', field: 'syllabus' },
        ],
      };
    }
    return {
      turn: {
        role: 'assistant',
        content: `You can mark it ready now. Students you assign to this exam will see the profile and the system will start tailoring their study plan. You can always come back and refine later.`,
        suggestions: ['Mark ready', 'One more review'],
        timestamp: new Date().toISOString(),
      },
      actions: [{ kind: 'mark_ready', label: 'Mark ready for students' }],
    };
  }

  // Intent: what's missing / status
  if (/missing|what.+next|what.+do|status|left/i.test(msg)) {
    return tipTurn(exam);
  }

  // Default: redirect to structured options
  return {
    turn: {
      role: 'assistant',
      content: `I can help you do three things right now: **auto-enrich** (let me research and propose field values), **upload local data** (give me official text to work from), or **edit fields manually** from the form below. Which would help most?`,
      suggestions: ['Auto-enrich', 'Upload local data', 'Edit manually'],
      timestamp: new Date().toISOString(),
    },
    actions: [
      { kind: 'suggest_enrich', label: 'Auto-enrich' },
      { kind: 'suggest_upload', label: 'Upload local data' },
    ],
  };
}

// ============================================================================
// Main entry
// ============================================================================

export function getAssistantResponse(req: AssistantRequest): AssistantResponse {
  if (req.mode === 'open') return openingTurn(req.exam);
  if (req.mode === 'tip') return tipTurn(req.exam);
  if (req.mode === 'reply') {
    if (!req.admin_message) return openingTurn(req.exam);
    return replyTurn(req.exam, req.admin_message);
  }
  return openingTurn(req.exam);
}
