/**
 * Unit tests for the Phase B student-context module.
 *
 * Tests the prompt formatter exhaustively (it's the SOLE boundary where
 * gbrain context fields become externally-visible bytes). DB-touching
 * builder is exercised lightly here; full DB path is integration-tested
 * via docker-compose smoke.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { toPromptText, NEUTRAL_CONTEXT, buildStudentContext } from '../student-context';
import type { StudentContext } from '../student-context';

const FULL_CTX: StudentContext = {
  representation_mode: 'geometric',
  motivation_state: 'frustrated',
  current_concept_mastery: 0.18,
  recent_misconceptions: ['m_inverts_chain_rule', 'm_drops_negatives'],
  shaky_prerequisites: ['derivatives-basic'],
  is_neutral: false,
};

describe('toPromptText', () => {
  it('returns empty string for the neutral payload', () => {
    expect(toPromptText(NEUTRAL_CONTEXT)).toBe('');
  });

  it('returns empty string for any context with is_neutral=true', () => {
    const ctx: StudentContext = { ...FULL_CTX, is_neutral: true };
    expect(toPromptText(ctx)).toBe('');
  });

  it('renders the geometric representation hint', () => {
    const out = toPromptText({ ...NEUTRAL_CONTEXT, is_neutral: false, representation_mode: 'geometric' });
    expect(out).toContain('think visually');
  });

  it('renders the algebraic representation hint', () => {
    const out = toPromptText({ ...NEUTRAL_CONTEXT, is_neutral: false, representation_mode: 'algebraic' });
    expect(out).toContain('formal manipulation');
  });

  it('renders the new-to-concept hint when mastery < 0.3', () => {
    const out = toPromptText({ ...NEUTRAL_CONTEXT, is_neutral: false, current_concept_mastery: 0.1 });
    expect(out).toContain('NEW to this concept');
    expect(out).toContain('intuition');
  });

  it('renders the strong-mastery hint when mastery > 0.7', () => {
    const out = toPromptText({ ...NEUTRAL_CONTEXT, is_neutral: false, current_concept_mastery: 0.85 });
    expect(out).toContain('STRONG mastery');
    expect(out).toContain('edge cases');
  });

  it('renders frustrated motivation gently', () => {
    const out = toPromptText({ ...NEUTRAL_CONTEXT, is_neutral: false, motivation_state: 'frustrated' });
    expect(out).toContain('gentle');
    expect(out).toContain('one-step-at-a-time');
  });

  it('renders driven motivation crisply', () => {
    const out = toPromptText({ ...NEUTRAL_CONTEXT, is_neutral: false, motivation_state: 'driven' });
    expect(out).toContain('Crisp');
    expect(out).toContain('rigour');
  });

  it('lists recent misconceptions verbatim', () => {
    const out = toPromptText(FULL_CTX);
    expect(out).toContain('m_inverts_chain_rule');
    expect(out).toContain('m_drops_negatives');
  });

  it('warns the LLM not to make the student feel observed', () => {
    const out = toPromptText(FULL_CTX);
    expect(out).toContain('Do NOT mention "you", "we noticed", "your error"');
    expect(out).toContain('the student should not feel observed');
  });

  it('full context renders all 5 sections (mastery+motivation+misconceptions+prereqs+representation)', () => {
    const out = toPromptText(FULL_CTX);
    // representation
    expect(out).toContain('think visually');
    // mastery hint
    expect(out).toContain('NEW to this concept');
    // motivation
    expect(out).toContain('gentle');
    // misconceptions
    expect(out).toContain('m_inverts_chain_rule');
    // prereqs
    expect(out).toContain('derivatives-basic');
  });
});

describe('buildStudentContext (DB-less safety)', () => {
  let original: string | undefined;
  beforeEach(() => { original = process.env.DATABASE_URL; });
  afterEach(() => {
    if (original === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = original;
  });

  it('returns NEUTRAL_CONTEXT when DATABASE_URL is unset', async () => {
    delete process.env.DATABASE_URL;
    const ctx = await buildStudentContext({ student_id: 'some-uuid', concept_id: 'eigenvalues' });
    expect(ctx.is_neutral).toBe(true);
    expect(ctx.representation_mode).toBe('balanced');
    expect(ctx.recent_misconceptions).toEqual([]);
  });

  it('returns NEUTRAL_CONTEXT when student_id is null', async () => {
    process.env.DATABASE_URL = 'postgres://nowhere';
    const ctx = await buildStudentContext({ student_id: null, concept_id: 'eigenvalues' });
    expect(ctx.is_neutral).toBe(true);
  });

  it('NEUTRAL_CONTEXT is frozen (immutable)', () => {
    expect(() => {
      (NEUTRAL_CONTEXT as any).representation_mode = 'algebraic';
    }).toThrow(); // strict mode throws; non-strict silently noops which is also fine
  });
});
