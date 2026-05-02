/**
 * tts-generator tests (§4.15 Phase C).
 */
import { describe, it, expect } from 'vitest';
import { shouldNarrate, extractNarrationScript, generateNarration } from '../tts-generator';

describe('tts-generator', () => {
  describe('shouldNarrate', () => {
    it('narrates intuition only', () => {
      expect(shouldNarrate('intuition')).toBe(true);
      expect(shouldNarrate('formal_definition')).toBe(false);
      expect(shouldNarrate('hook')).toBe(false);
      expect(shouldNarrate('worked_example')).toBe(false);
    });
  });

  describe('extractNarrationScript', () => {
    it('strips frontmatter', () => {
      const md = '---\ntitle: foo\n---\n\nThe core idea is simple.';
      expect(extractNarrationScript(md)).toBe('The core idea is simple.');
    });

    it('replaces inline math with placeholder', () => {
      const s = extractNarrationScript('We have $x^2 + 1$ here.');
      expect(s).toContain('[math expression]');
      expect(s).not.toContain('$');
    });

    it('replaces display math with placeholder', () => {
      const s = extractNarrationScript('See: $$\\int_0^1 x \\, dx$$ done.');
      expect(s).toContain('[math expression]');
      expect(s).not.toContain('$$');
    });

    it('removes :::directive blocks', () => {
      const md = 'Before.\n\n:::manim{src="foo"}\nbody\n:::\n\nAfter.';
      const s = extractNarrationScript(md);
      expect(s).not.toContain('manim');
      expect(s).not.toContain(':::');
      expect(s).toContain('Before');
      expect(s).toContain('After');
    });

    it('strips code fences', () => {
      const s = extractNarrationScript('Read this:\n```js\nconst x = 1;\n```\nDone.');
      expect(s).not.toContain('const x');
      expect(s).toContain('Done');
    });

    it('strips formatting markers but keeps text', () => {
      const s = extractNarrationScript('This is **bold** and *italic* and `code`.');
      expect(s).toContain('bold');
      expect(s).toContain('italic');
      expect(s).toContain('code');
      expect(s).not.toContain('**');
      expect(s).not.toContain('`');
    });

    it('keeps link text only', () => {
      const s = extractNarrationScript('See [this guide](https://example.com).');
      expect(s).toContain('this guide');
      expect(s).not.toContain('example.com');
    });

    it('strips heading hashes', () => {
      const s = extractNarrationScript('# Title\n\nBody.');
      expect(s).toBe('Title. Body.');
    });

    it('caps script length', () => {
      const long = 'word '.repeat(2000);
      const s = extractNarrationScript(long);
      expect(s.length).toBeLessThanOrEqual(1501);
    });
  });

  describe('generateNarration', () => {
    it('returns null for non-narratable atom types', async () => {
      const r = await generateNarration('formal_definition', 'Some long body content here.');
      expect(r).toBeNull();
    });

    it('returns null when TTS_PROVIDER is unset/disabled', async () => {
      const prev = process.env.TTS_PROVIDER;
      delete process.env.TTS_PROVIDER;
      try {
        const r = await generateNarration('intuition', 'A '.repeat(50));
        expect(r).toBeNull();
      } finally {
        if (prev !== undefined) process.env.TTS_PROVIDER = prev;
      }
    });

    it('returns null when script is too short', async () => {
      const prev = process.env.TTS_PROVIDER;
      process.env.TTS_PROVIDER = 'openai';
      try {
        const r = await generateNarration('intuition', 'Hi.');
        expect(r).toBeNull();
      } finally {
        if (prev === undefined) delete process.env.TTS_PROVIDER;
        else process.env.TTS_PROVIDER = prev;
      }
    });
  });
});
