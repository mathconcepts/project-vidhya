/**
 * Root-caused by /investigate (2026-09-07, live-QA screenshots): the live
 * AI Tutor chat path's system prompt carried NO register directive at all,
 * unlike every atom-generation prompt (src/content/prompt-registry/
 * resources/modifiers.ts's toneRegisterModifier, unconditional since
 * 2026-09-02). buildSystemPrompt() now imports the SAME TONE_REGISTER_BLOCK
 * constant rather than a second copy, so the two surfaces can't drift.
 */
import { describe, it, expect } from 'vitest';
import { buildSystemPrompt } from '../chat-routes';
import { TONE_REGISTER_BLOCK } from '../../content/prompt-registry/resources/modifiers';

describe('buildSystemPrompt — chat tutor tone/register', () => {
  it('includes the shared ELI5/Indian-English register directive', async () => {
    const prompt = await buildSystemPrompt({ headers: {} });
    expect(prompt).toContain(TONE_REGISTER_BLOCK);
    expect(prompt).toContain('ELI5 the reasoning');
    expect(prompt).toContain('Default to Indian English');
  });

  it('never invents a second, drifted copy of the directive', async () => {
    const prompt = await buildSystemPrompt({ headers: {} });
    // The directive should appear exactly once — a drift bug would be a
    // second, slightly different block rather than a literal duplicate,
    // but at minimum the shared constant itself must not be duplicated.
    const occurrences = prompt.split(TONE_REGISTER_BLOCK).length - 1;
    expect(occurrences).toBe(1);
  });
});
