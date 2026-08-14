import { describe, it, expect } from 'vitest';
import { resolveAtom, resolveAtomFromMessage, streamAtomContent } from '../atom-responder';

describe('resolveAtom', () => {
  it('resolves a known concept + action to atom content', () => {
    const result = resolveAtom('matrix-operations', 'worked_example');
    expect(result).not.toBeNull();
    expect(result!.conceptId).toBe('matrix-operations');
    expect(result!.atomType).toBe('worked-example');
    expect(result!.content.length).toBeGreaterThan(100);
    // Should not contain YAML frontmatter
    expect(result!.content.startsWith('---')).toBe(false);
  });

  it('falls back to alternative atom types for the same concept', () => {
    // scaffolded_hint falls back to intuition.md
    const result = resolveAtom('eigenvalues', 'scaffolded_hint');
    expect(result).not.toBeNull();
    expect(result!.conceptId).toBe('eigenvalues');
  });

  it('returns null for unknown concept', () => {
    expect(resolveAtom('definitely-not-a-concept', 'worked_example')).toBeNull();
  });

  it('returns null when concept is null', () => {
    expect(resolveAtom(null, 'worked_example')).toBeNull();
  });

  it('returns null when concept is undefined', () => {
    expect(resolveAtom(undefined, 'worked_example')).toBeNull();
  });

  it('resolves multiple GATE-MA engineering math concepts', () => {
    const concepts = [
      'determinants',
      'fourier-series',
      'laplace-transform',
      'probability-basics',
      'graph-basics',
    ];
    for (const concept of concepts) {
      const result = resolveAtom(concept, 'worked_example');
      expect(result, `Expected atom for concept: ${concept}`).not.toBeNull();
    }
  });

  it('strips YAML frontmatter from returned content', () => {
    const result = resolveAtom('matrix-operations', 'worked_example');
    expect(result).not.toBeNull();
    // Content should start with a heading or paragraph, not frontmatter
    expect(result!.content.trimStart()).not.toMatch(/^---/);
  });

  it('returns content without requiring LLM or DB', () => {
    // resolveAtom is pure synchronous file-read — no external dependencies
    const result = resolveAtom('integration-basics', 'confidence_building');
    expect(result).not.toBeNull();
  });
});

describe('resolveAtomFromMessage', () => {
  it('resolves "Explain Matrix Operations with a worked example"', () => {
    const result = resolveAtomFromMessage('Explain Matrix Operations with a worked example', 'worked_example');
    expect(result).not.toBeNull();
    expect(result!.conceptId).toBe('matrix-operations');
  });

  it('resolves single-word concept "eigenvalues"', () => {
    const result = resolveAtomFromMessage('How do eigenvalues work?', 'worked_example');
    expect(result).not.toBeNull();
    expect(result!.conceptId).toBe('eigenvalues');
  });

  it('resolves "Fourier series" by slug keywords', () => {
    const result = resolveAtomFromMessage('Explain Fourier series', 'scaffolded_hint');
    expect(result).not.toBeNull();
    expect(result!.conceptId).toBe('fourier-series');
  });

  it('resolves "Laplace transform" by slug keywords', () => {
    const result = resolveAtomFromMessage('What is the Laplace transform?', 'worked_example');
    expect(result).not.toBeNull();
    expect(result!.conceptId).toBe('laplace-transform');
  });

  it('resolves "ODE" via keyword override to ode-first-order', () => {
    const result = resolveAtomFromMessage('Explain ODEs', 'worked_example');
    expect(result).not.toBeNull();
    expect(result!.conceptId).toBe('ode-first-order');
  });

  it('resolves "partial differential equation" via keyword override', () => {
    const result = resolveAtomFromMessage('What is a partial differential equation?', 'worked_example');
    expect(result).not.toBeNull();
    expect(result!.conceptId).toBe('pde-basics');
  });

  it('returns null for generic greetings with no concept', () => {
    const result = resolveAtomFromMessage('Hello, how are you?', 'worked_example');
    expect(result).toBeNull();
  });

  it('returns null for empty message', () => {
    expect(resolveAtomFromMessage('', 'worked_example')).toBeNull();
    expect(resolveAtomFromMessage(null as any, 'worked_example')).toBeNull();
  });

  it('resolves "determinant" to determinants', () => {
    const result = resolveAtomFromMessage('How do I calculate a determinant?', 'worked_example');
    expect(result).not.toBeNull();
    expect(result!.conceptId).toBe('determinants');
  });

  it('resolves "probability" to probability-basics', () => {
    const result = resolveAtomFromMessage('Explain probability concepts', 'scaffolded_hint');
    expect(result).not.toBeNull();
    expect(result!.conceptId).toBe('probability-basics');
  });
});

describe('streamAtomContent', () => {
  it('yields all content in chunks', async () => {
    const content = 'Hello world, this is test content for streaming.';
    const chunks: string[] = [];
    for await (const chunk of streamAtomContent(content)) {
      chunks.push(chunk);
    }
    expect(chunks.join('')).toBe(content);
  });

  it('handles short content in a single chunk', async () => {
    const content = 'Short.';
    const chunks: string[] = [];
    for await (const chunk of streamAtomContent(content)) {
      chunks.push(chunk);
    }
    expect(chunks.join('')).toBe(content);
  });

  it('yields multiple chunks for long content', async () => {
    const content = 'A'.repeat(500);
    const chunks: string[] = [];
    for await (const chunk of streamAtomContent(content)) {
      chunks.push(chunk);
    }
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.join('')).toBe(content);
  });
});
