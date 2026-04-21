// @ts-nocheck
/**
 * Channel Renderer — takes an EnrichedLesson and produces the right
 * representation for each delivery channel.
 *
 * The rule: every InteractiveBlock type has a renderer for each supported
 * channel. Channels that can't render a block gracefully degrade — never
 * crash, never drop content silently.
 *
 *   Block type             Web              Telegram              WhatsApp    Voice
 *   ─────────────────────  ────────────    ────────────────────  ──────────  ──────────
 *   step-reveal            tap to reveal   progressive buttons   numbered    sequential
 *   flip-card              3D flip         two-message sequence  "→" format  spoken
 *   quick-check            tap feedback    inline keyboard       number reply skip
 *   animated-derivation    fade-in lines   numbered with →       same        narrated
 *   drag-match             drag-to-match   quiz cycling          list only   skip
 *   callout                animated badge  emoji prefix          emoji prefix narrated
 *
 * Pure functions. No I/O. The Telegram messages still need to be
 * sent via the telegram channel adapter — the renderer just shapes them.
 */

import type {
  EnrichedLesson,
  InteractiveBlock,
  RenderedLesson,
  WebBlock,
  TelegramMessage,
  WhatsAppMessage,
  VoiceSegment,
  DeliveryChannel,
  StepRevealBlock,
  FlipCardBlock,
  QuickCheckBlock,
  AnimatedDerivationBlock,
  DragMatchBlock,
  CalloutBlock,
} from './types';

// ============================================================================
// Web renderer — produces WebBlock array
// ============================================================================

function renderForWeb(enriched: EnrichedLesson): WebBlock[] {
  const out: WebBlock[] = [];
  for (const component of enriched.lesson.components || []) {
    if (!component || !component.id) continue;

    const enrichBlocks = enriched.enrichments[component.id];
    if (enrichBlocks && enrichBlocks.length > 0) {
      // Component has interactive enrichment — render the blocks,
      // skipping the plain prose version to avoid duplication.
      for (const block of enrichBlocks) {
        out.push({ type: 'interactive', component_id: component.id, block });
      }
    } else {
      // No enrichment — render as plain prose
      if (component.content) {
        out.push({ type: 'prose', component_id: component.id, content_md: component.content });
      }
      if (component.latex) {
        out.push({ type: 'latex', component_id: component.id, latex: component.latex, display: true });
      }
    }
  }
  return out;
}

// ============================================================================
// Telegram renderer — produces TelegramMessage array with progressive reveal
// ============================================================================

/** Escape HTML entities for Telegram's HTML parse mode */
function telegramEscape(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Convert markdown-ish content to Telegram HTML. Conservative: bold, italic, code. */
function mdToTelegramHTML(md: string): string {
  let s = telegramEscape(md);
  s = s.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
  s = s.replace(/__(.+?)__/g, '<b>$1</b>');
  s = s.replace(/(?<!\*)\*([^*]+?)\*(?!\*)/g, '<i>$1</i>');
  s = s.replace(/_(.+?)_/g, '<i>$1</i>');
  s = s.replace(/`([^`]+?)`/g, '<code>$1</code>');
  return s;
}

function renderCalloutTelegram(block: CalloutBlock): TelegramMessage {
  const icon =
    block.mood === 'tip' ? '💡'
    : block.mood === 'warning' ? '⚠️'
    : block.mood === 'gotcha' ? '🪤'
    : '✨';
  return {
    text: `${icon} <b>${block.mood.toUpperCase()}</b>\n\n${mdToTelegramHTML(block.content_md)}`,
    parse_mode: 'HTML',
  };
}

function renderStepRevealTelegram(block: StepRevealBlock): TelegramMessage[] {
  if (block.steps.length === 0) return [];
  const firstStep = block.steps[0];
  const title = block.title ? `<b>${telegramEscape(block.title)}</b>\n\n` : '';
  const keyBadge = block.key_step_index === 0 ? ' ⭐' : '';

  const text = `${title}<b>${telegramEscape(firstStep.label || 'Step 1')}${keyBadge}</b>\n${mdToTelegramHTML(firstStep.content_md)}`;

  // Initial message with reveal keyboard
  return [{
    text,
    parse_mode: 'HTML',
    interactive_id: block.id,
    keyboard: block.steps.length > 1 ? [[
      { text: `Next step (${block.steps.length - 1} more)  ▶`, callback_data: `reveal:${block.id}:1` }
    ]] : undefined,
  }];
}

function renderFlipCardTelegram(block: FlipCardBlock): TelegramMessage[] {
  // Each card: front as a separate message, with "Show why" button to
  // trigger the explanation via callback.
  const msgs: TelegramMessage[] = [];
  if (block.title) {
    msgs.push({
      text: `<b>${telegramEscape(block.title)}</b>`,
      parse_mode: 'HTML',
    });
  }
  block.cards.forEach((card, idx) => {
    const quote = card.student_quote ? `<i>"${telegramEscape(card.student_quote)}"</i>\n\n` : '';
    msgs.push({
      text: `🪤 <b>Trap ${idx + 1}</b>\n\n${quote}${mdToTelegramHTML(card.prompt.content_md)}`,
      parse_mode: 'HTML',
      interactive_id: block.id,
      keyboard: [[
        { text: 'Why does this happen?  ▶', callback_data: `flip:${block.id}:${idx}` }
      ]],
    });
  });
  return msgs;
}

function renderQuickCheckTelegram(block: QuickCheckBlock): TelegramMessage {
  const optionsLabel = 'ABCD'.split('');
  const prompt = `✍️ <b>Quick check</b>\n\n${mdToTelegramHTML(block.prompt_md)}`;

  // Render options in one row if ≤3, else two-column grid
  const keyboard = block.options.length <= 3
    ? [block.options.map((opt, idx) => ({
        text: `${optionsLabel[idx]}) ${opt.text.slice(0, 30)}${opt.text.length > 30 ? '...' : ''}`,
        callback_data: `check:${block.id}:${idx}`,
      }))]
    : chunks(block.options.map((opt, idx) => ({
        text: `${optionsLabel[idx]}) ${opt.text.slice(0, 30)}${opt.text.length > 30 ? '...' : ''}`,
        callback_data: `check:${block.id}:${idx}`,
      })), 2);

  return {
    text: prompt,
    parse_mode: 'HTML',
    interactive_id: block.id,
    keyboard,
  };
}

function chunks<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function renderAnimatedDerivationTelegram(block: AnimatedDerivationBlock): TelegramMessage {
  const lines = block.lines.map((line, idx) => {
    const arrow = idx === 0 ? '' : '   ↓ ';
    const rationale = idx === 0 ? '' : ` <i>${telegramEscape(line.rationale_md)}</i>`;
    return `${arrow}${rationale}\n<code>${telegramEscape(line.latex)}</code>`;
  }).join('\n');

  return {
    text: (block.title ? `<b>${telegramEscape(block.title)}</b>\n\n` : '') + lines,
    parse_mode: 'HTML',
  };
}

function renderDragMatchTelegram(block: DragMatchBlock): TelegramMessage[] {
  // Telegram can't drag — degrade to quiz-style: for each pair, ask
  // which right-side item matches the left-side concept.
  const msgs: TelegramMessage[] = [];
  if (block.title) {
    msgs.push({ text: `<b>${telegramEscape(block.title)}</b>`, parse_mode: 'HTML' });
  }

  // Pick the first pair as a sample; full cycling handled by the webhook
  const firstPair = block.pairs[0];
  if (!firstPair) return msgs;

  const allRightOptions = [
    ...block.pairs.map(p => p.right),
    ...(block.right_decoys || []),
  ];

  const keyboard = chunks(
    allRightOptions.map((opt, idx) => ({
      text: opt.content_md.slice(0, 30),
      callback_data: `match:${block.id}:0:${idx}`,
    })),
    2,
  );

  msgs.push({
    text: `🔗 <b>Match:</b> ${mdToTelegramHTML(firstPair.left.content_md)}`,
    parse_mode: 'HTML',
    interactive_id: block.id,
    keyboard,
  });
  return msgs;
}

function renderBlockForTelegram(block: InteractiveBlock): TelegramMessage[] {
  switch (block.kind) {
    case 'callout':             return [renderCalloutTelegram(block)];
    case 'step-reveal':         return renderStepRevealTelegram(block);
    case 'flip-card':           return renderFlipCardTelegram(block);
    case 'quick-check':         return [renderQuickCheckTelegram(block)];
    case 'animated-derivation': return [renderAnimatedDerivationTelegram(block)];
    case 'drag-match':          return renderDragMatchTelegram(block);
    default:                    return [];
  }
}

function renderForTelegram(enriched: EnrichedLesson): TelegramMessage[] {
  const msgs: TelegramMessage[] = [];

  for (const component of enriched.lesson.components || []) {
    if (!component || !component.id) continue;
    const enrichBlocks = enriched.enrichments[component.id];

    if (enrichBlocks && enrichBlocks.length > 0) {
      for (const block of enrichBlocks) {
        msgs.push(...renderBlockForTelegram(block));
      }
    } else {
      // Plain prose component — render as single message
      if (component.content) {
        msgs.push({
          text: mdToTelegramHTML(component.content),
          parse_mode: 'HTML',
        });
      }
      if (component.latex) {
        msgs.push({
          text: `<code>${telegramEscape(component.latex)}</code>`,
          parse_mode: 'HTML',
        });
      }
    }
  }
  return msgs;
}

// ============================================================================
// Follow-up rendering for Telegram callbacks — "reveal next step", "flip card"
// ============================================================================

/**
 * Given a callback data string ("reveal:{block_id}:{step_index}" etc.),
 * produce the follow-up TelegramMessage(s) to send. Used by the
 * Telegram webhook to drive the progressive reveal state machine.
 */
export function renderTelegramCallback(
  enriched: EnrichedLesson,
  callback_data: string,
): TelegramMessage[] {
  // Callback format: "action:{block_id}:{arg}[:arg2]"
  // Problem: block_ids may themselves contain colons (e.g. "c2:reveal").
  // Solution: find the block by trying progressively longer id prefixes
  // until one matches — or split from the end on known action names.
  const firstColon = callback_data.indexOf(':');
  if (firstColon === -1) return [];
  const action = callback_data.slice(0, firstColon);
  const rest = callback_data.slice(firstColon + 1);

  // Collect all known block ids
  const allBlocks: InteractiveBlock[] = [];
  for (const list of Object.values(enriched.enrichments)) {
    allBlocks.push(...list);
  }

  // Find the longest block id that is a prefix of `rest` followed by a colon
  let block: InteractiveBlock | null = null;
  let argString = '';
  for (const candidate of allBlocks) {
    if (rest === candidate.id) {
      block = candidate;
      argString = '';
      break;
    }
    if (rest.startsWith(candidate.id + ':')) {
      if (!block || candidate.id.length > block.id.length) {
        block = candidate;
        argString = rest.slice(candidate.id.length + 1);
      }
    }
  }
  if (!block) return [];
  const args = argString ? argString.split(':') : [];

  if (action === 'reveal' && block.kind === 'step-reveal') {
    const stepIdx = parseInt(args[0] || '0');
    const step = block.steps[stepIdx];
    if (!step) return [];
    const keyBadge = block.key_step_index === stepIdx ? ' ⭐' : '';
    const hasMore = stepIdx < block.steps.length - 1;

    return [{
      text: `<b>${telegramEscape(step.label || `Step ${stepIdx + 1}`)}${keyBadge}</b>\n${mdToTelegramHTML(step.content_md)}`,
      parse_mode: 'HTML',
      interactive_id: block.id,
      keyboard: hasMore ? [[
        { text: `Next step (${block.steps.length - stepIdx - 1} more)  ▶`, callback_data: `reveal:${block.id}:${stepIdx + 1}` }
      ]] : undefined,
    }];
  }

  if (action === 'flip' && block.kind === 'flip-card') {
    const cardIdx = parseInt(args[0] || '0');
    const card = block.cards[cardIdx];
    if (!card) return [];
    return [{
      text: `💡 <b>Why it happens:</b>\n\n${mdToTelegramHTML(card.explanation.content_md)}`,
      parse_mode: 'HTML',
    }];
  }

  if (action === 'check' && block.kind === 'quick-check') {
    const optIdx = parseInt(args[0] || '0');
    const option = block.options[optIdx];
    if (!option) return [];

    if (option.is_correct) {
      return [{
        text: `✅ <b>Correct</b>\n\n${mdToTelegramHTML(block.correct_feedback_md)}`,
        parse_mode: 'HTML',
      }];
    } else {
      const feedback = option.feedback_if_wrong_md || 'Not quite. Try again.';
      return [{
        text: `❌ <b>Not quite</b>\n\n${mdToTelegramHTML(feedback)}`,
        parse_mode: 'HTML',
        keyboard: [[
          { text: 'Try again  ↻', callback_data: `check:${block.id}:retry` }
        ]],
      }];
    }
  }

  if (action === 'match' && block.kind === 'drag-match') {
    const pairIdx = parseInt(args[0] || '0');
    const rightIdx = parseInt(args[1] || '0');
    const pair = block.pairs[pairIdx];
    const rightOptions = [...block.pairs.map(p => p.right), ...(block.right_decoys || [])];
    const chosen = rightOptions[rightIdx];
    if (!pair || !chosen) return [];

    const isCorrect = chosen.id === pair.right.id || chosen.content_md === pair.right.content_md;
    const nextPairIdx = pairIdx + 1;
    const hasMore = nextPairIdx < block.pairs.length;

    const feedbackMsg: TelegramMessage = {
      text: isCorrect
        ? `✅ <b>Right!</b>\n\n${mdToTelegramHTML(pair.left.content_md)} ↔ ${mdToTelegramHTML(pair.right.content_md)}`
        : `❌ <b>Not quite</b>\n\nThe correct match for ${mdToTelegramHTML(pair.left.content_md)} is: ${mdToTelegramHTML(pair.right.content_md)}`,
      parse_mode: 'HTML',
    };

    if (hasMore) {
      const nextPair = block.pairs[nextPairIdx];
      feedbackMsg.keyboard = chunks(
        rightOptions.map((opt, idx) => ({
          text: opt.content_md.slice(0, 30),
          callback_data: `match:${block.id}:${nextPairIdx}:${idx}`,
        })),
        2,
      );
      feedbackMsg.text += `\n\n🔗 <b>Next:</b> ${mdToTelegramHTML(nextPair.left.content_md)}`;
      feedbackMsg.interactive_id = block.id;
    }

    return [feedbackMsg];
  }

  return [];
}

// ============================================================================
// WhatsApp renderer — plain markdown with numbered steps
// ============================================================================

function renderForWhatsApp(enriched: EnrichedLesson): WhatsAppMessage[] {
  const msgs: WhatsAppMessage[] = [];

  for (const component of enriched.lesson.components || []) {
    if (!component || !component.id) continue;
    const enrichBlocks = enriched.enrichments[component.id];

    if (enrichBlocks && enrichBlocks.length > 0) {
      for (const block of enrichBlocks) {
        const rendered = renderBlockForWhatsApp(block);
        if (rendered) msgs.push(rendered);
      }
    } else if (component.content) {
      msgs.push({ text: component.content });
    }
  }
  return msgs;
}

function renderBlockForWhatsApp(block: InteractiveBlock): WhatsAppMessage | null {
  switch (block.kind) {
    case 'callout': {
      const icon = block.mood === 'tip' ? '💡' : block.mood === 'warning' ? '⚠️' : '✨';
      return { text: `${icon} *${block.mood.toUpperCase()}*\n\n${block.content_md}` };
    }
    case 'step-reveal': {
      const title = block.title ? `*${block.title}*\n\n` : '';
      const lines = block.steps.map((s, i) => {
        const star = block.key_step_index === i ? ' ⭐' : '';
        return `${i + 1}. *${s.label || `Step ${i + 1}`}${star}*\n${s.content_md}`;
      }).join('\n\n');
      return { text: title + lines };
    }
    case 'flip-card': {
      const lines = block.cards.map((card, i) => {
        const quote = card.student_quote ? `_"${card.student_quote}"_\n` : '';
        return `*Trap ${i + 1}:* ${quote}${card.prompt.content_md}\n→ ${card.explanation.content_md}`;
      }).join('\n\n');
      return { text: (block.title ? `*${block.title}*\n\n` : '') + lines };
    }
    case 'quick-check': {
      const options = block.options.map((opt, i) => ({
        number: i + 1,
        text: opt.text,
      }));
      const list = options.map(o => `${o.number}. ${o.text}`).join('\n');
      return {
        text: `✍️ *Quick check*\n\n${block.prompt_md}\n\n${list}\n\nReply with the number.`,
        interactive_numbered: options,
      };
    }
    case 'animated-derivation': {
      const title = block.title ? `*${block.title}*\n\n` : '';
      const lines = block.lines.map((line, i) => {
        const arrow = i === 0 ? '' : `   ↓ _${line.rationale_md}_\n`;
        return `${arrow}\`${line.latex}\``;
      }).join('\n');
      return { text: title + lines };
    }
    case 'drag-match': {
      // No drag on WhatsApp — degrade to a list
      const title = block.title ? `*${block.title}*\n\n` : '';
      const lines = block.pairs.map((p, i) => `${i + 1}. ${p.left.content_md} ↔ ${p.right.content_md}`).join('\n');
      return { text: title + lines };
    }
  }
  return null;
}

// ============================================================================
// Voice renderer — produces VoiceSegment array for narration
// ============================================================================

function renderForVoice(enriched: EnrichedLesson): VoiceSegment[] {
  const segs: VoiceSegment[] = [];

  for (const component of enriched.lesson.components || []) {
    if (!component || !component.id) continue;
    const enrichBlocks = enriched.enrichments[component.id];

    if (enrichBlocks && enrichBlocks.length > 0) {
      for (const block of enrichBlocks) {
        segs.push(...renderBlockForVoice(block));
      }
    } else if (component.content) {
      segs.push({ text: stripMarkdown(component.content), pause_after_ms: 400 });
    }
  }
  return segs;
}

function stripMarkdown(s: string): string {
  return s
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*([^*]+?)\*/g, '$1')
    .replace(/_(.+?)_/g, '$1')
    .replace(/`([^`]+?)`/g, '$1')
    .replace(/\n{2,}/g, '. ');
}

function renderBlockForVoice(block: InteractiveBlock): VoiceSegment[] {
  switch (block.kind) {
    case 'callout':
      return [{
        text: stripMarkdown(block.content_md),
        emphasis: block.mood === 'warning' || block.mood === 'gotcha' ? 'strong' : 'moderate',
        pause_after_ms: 500,
      }];
    case 'step-reveal':
      return block.steps.map(s => ({
        text: s.voice_narration || stripMarkdown(s.content_md),
        pause_after_ms: 700,
        emphasis: 'none',
      }));
    case 'flip-card':
      return block.cards.flatMap(card => [
        { text: `Here's a common mistake: ${stripMarkdown(card.prompt.content_md)}`, pause_after_ms: 500 },
        { text: `Here's why: ${stripMarkdown(card.explanation.content_md)}`, pause_after_ms: 800 },
      ]);
    case 'quick-check':
      // Skip interactive question in voice mode — can't handle input
      return [];
    case 'animated-derivation':
      return block.lines.map((line, i) => ({
        text: i === 0
          ? `Starting from: ${line.voice_narration || stripMarkdown(line.rationale_md)}`
          : `${stripMarkdown(line.rationale_md)}`,
        pause_after_ms: 600,
      }));
    case 'drag-match':
      // Skip — no input modality
      return [];
  }
  return [];
}

// ============================================================================
// Main entry — dispatch to the right channel
// ============================================================================

/**
 * Render an enriched lesson for a specific delivery channel.
 * Pure function. Always returns a valid RenderedLesson for the channel.
 */
export function renderLesson(
  enriched: EnrichedLesson,
  channel: DeliveryChannel,
): RenderedLesson {
  switch (channel) {
    case 'web':      return { channel: 'web',      blocks: renderForWeb(enriched) };
    case 'telegram': return { channel: 'telegram', messages: renderForTelegram(enriched) };
    case 'whatsapp': return { channel: 'whatsapp', messages: renderForWhatsApp(enriched) };
    case 'voice':    return { channel: 'voice',    narration: renderForVoice(enriched) };
  }
}
