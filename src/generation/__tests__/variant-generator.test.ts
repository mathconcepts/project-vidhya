/**
 * The variant generator.
 *
 * Every external thing is injected, so all of this runs without an API key or
 * a disk write. That matters more than usual here: no LLM provider is
 * configured in the environment this was written in, so anything that could
 * only be exercised through a real model call would have shipped unverified.
 *
 * The tests that matter are the refusals. A generator that writes an unchecked
 * rewrite of verified maths into the content tree is worse than one that
 * writes nothing, because the student reading it has no way to tell.
 */
import { describe, it, expect, vi } from 'vitest';
import {
  generateVariant,
  assembleVariantFile,
  buildVariantPrompt,
  variantIdFor,
  variantPathFor,
  validateGenerated,
  DRAFT_DIR,
  type GeneratorDeps,
} from '../variant-generator';

const BASE = `---
id: eigenvalues.intuition
concept_id: eigenvalues
atom_type: intuition
bloom_level: 2
difficulty: 0.15
exam_ids: ["*"]
---

A matrix sends most vectors somewhere new. A few it only stretches. Those are
its eigenvectors and the stretch factor is the eigenvalue.

\`\`\`interactive-spec
{"v":1,"kind":"manipulable","title":"drag","inputs":[],"outputs":[]}
\`\`\`
`;

const okBody = `Shorter body.

\`\`\`interactive-spec
{"v":1,"kind":"manipulable","title":"drag","inputs":[],"outputs":[]}
\`\`\``;

function deps(over: Partial<GeneratorDeps> = {}): GeneratorDeps & { written: Map<string, string> } {
  const written = new Map<string, string>();
  return {
    written,
    generate: vi.fn().mockResolvedValue(okBody),
    judge: vi.fn().mockResolvedValue({ agrees: true }),
    writeFile: vi.fn(async (p: string, c: string) => {
      written.set(p, c);
    }),
    ...over,
  } as GeneratorDeps & { written: Map<string, string> };
}

const req = {
  conceptId: 'eigenvalues',
  atomType: 'intuition',
  stance: 'shaken' as const,
  baseRaw: BASE,
};

describe('naming', () => {
  it('uses the dotted convention, hyphenating the atom type', () => {
    expect(variantIdFor('orthogonality', 'worked_example', 'shaken')).toBe(
      'orthogonality.worked-example.shaken',
    );
  });

  it('puts the file where the loader expects it', () => {
    expect(variantPathFor('orthogonality', 'worked_example', 'shaken')).toBe(
      'modules/project-vidhya-content/concepts/orthogonality/atoms/worked-example-shaken.md',
    );
  });

  it('does NOT inherit a drifted base id', () => {
    // A few base atoms carry legacy hyphenated ids the integrity gate tolerates
    // only as existing drift. Inheriting one spreads it into every new file —
    // which is exactly what happened when two variants were hand-written.
    const drifted = BASE.replace('id: eigenvalues.intuition', 'id: orthogonality-intuition');
    const out = assembleVariantFile({
      baseRaw: drifted,
      stance: 'shaken',
      body: 'x',
      conceptId: 'orthogonality',
      atomType: 'intuition',
    });
    expect(out).toContain('id: orthogonality.intuition.shaken');
    // but the link still points at the base's real, drifted id
    expect(out).toContain('variant_of: orthogonality-intuition');
  });
});

describe('assembleVariantFile', () => {
  const out = assembleVariantFile({
    baseRaw: BASE,
    stance: 'assured',
    body: 'terse body',
    conceptId: 'eigenvalues',
    atomType: 'intuition',
  });

  it('carries the base scalars rather than letting a model restate them', () => {
    expect(out).toContain('bloom_level: 2');
    expect(out).toContain('difficulty: 0.15');
    expect(out).toContain('concept_id: eigenvalues');
  });

  it('sets the variant markers', () => {
    expect(out).toContain('for_stance: assured');
    expect(out).toContain('variant_of: eigenvalues.intuition');
  });

  it('does not copy the base frontmatter comments into the variant', () => {
    const withComments = BASE.replace('---\nid:', '---\n# a stale note\nid:');
    const o = assembleVariantFile({
      baseRaw: withComments,
      stance: 'shaken',
      body: 'x',
      conceptId: 'eigenvalues',
      atomType: 'intuition',
    });
    expect(o).not.toContain('a stale note');
  });
});

describe('buildVariantPrompt', () => {
  it('gives a shaken request the base word count as a hard number', () => {
    const p = buildVariantPrompt(req);
    expect(p).toMatch(/at most \d+ prose words/);
  });

  it('does not cap an assured request against the base', () => {
    const p = buildVariantPrompt({ ...req, stance: 'assured' });
    expect(p).not.toContain('must not exceed it');
  });

  it('states the mechanical rules that will reject the output', () => {
    const p = buildVariantPrompt(req);
    expect(p).toContain('guided_walkthrough');
    expect(p).toMatch(/no frontmatter|body only/i);
  });

  it('includes the base body to rewrite', () => {
    expect(buildVariantPrompt(req)).toContain('its eigenvectors and the stretch factor');
  });
});

describe('generateVariant — the happy path', () => {
  it('writes into the content tree when structure and judge both pass', async () => {
    const d = deps();
    const r = await generateVariant(req, d);
    expect(r.status).toBe('written');
    if (r.status !== 'written') return;
    expect(r.path).toContain('atoms/intuition-shaken.md');
    expect(d.written.get(r.path)).toContain('for_stance: shaken');
  });
});

describe('generateVariant — refusals', () => {
  it('refuses and drafts when the structural rules fail', async () => {
    // Longer than the base, which the gate rejects for a shaken variant.
    const long = `${'word '.repeat(400)}\n\n\`\`\`interactive-spec\n{"v":1,"kind":"manipulable","title":"drag","inputs":[],"outputs":[]}\n\`\`\``;
    const d = deps({ generate: vi.fn().mockResolvedValue(long) });
    const r = await generateVariant(req, d);
    expect(r.status).toBe('refused');
    if (r.status !== 'refused') return;
    expect(r.reason).toContain('shaken-longer-than-base');
    expect(r.draftPath).toContain(DRAFT_DIR);
    // The work is kept, outside the content tree.
    expect([...d.written.keys()]).toEqual([r.draftPath]);
  });

  it('does not consult the judge when structure already failed', async () => {
    const long = `${'word '.repeat(400)}\n\n\`\`\`interactive-spec\n{"v":1,"kind":"manipulable","title":"drag","inputs":[],"outputs":[]}\n\`\`\``;
    const d = deps({ generate: vi.fn().mockResolvedValue(long) });
    await generateVariant(req, d);
    expect(d.judge).not.toHaveBeenCalled();
  });

  it('refuses when the judge disagrees', async () => {
    const d = deps({
      judge: vi.fn().mockResolvedValue({ agrees: false, reason: 'drops the invertibility condition' }),
    });
    const r = await generateVariant(req, d);
    expect(r.status).toBe('refused');
    if (r.status !== 'refused') return;
    expect(r.reason).toContain('invertibility');
    expect([...d.written.keys()]).toEqual([r.draftPath]);
  });

  it('FAILS CLOSED when the judge throws', async () => {
    // A judge that cannot answer is not a judge that approved. This is the
    // rule that keeps an unchecked rewrite of verified maths off the page.
    const d = deps({ judge: vi.fn().mockRejectedValue(new Error('rate limited')) });
    const r = await generateVariant(req, d);
    expect(r.status).toBe('refused');
    if (r.status !== 'refused') return;
    expect(r.reason).toContain('judge unavailable');
    expect([...d.written.keys()]).toEqual([r.draftPath]);
  });

  it('refuses an empty body without writing anything at all', async () => {
    const d = deps({ generate: vi.fn().mockResolvedValue('   ') });
    const r = await generateVariant(req, d);
    expect(r.status).toBe('refused');
    expect(d.written.size).toBe(0);
  });

  it('refuses when generation itself throws', async () => {
    const d = deps({ generate: vi.fn().mockRejectedValue(new Error('no provider configured')) });
    const r = await generateVariant(req, d);
    expect(r.status).toBe('refused');
    if (r.status !== 'refused') return;
    expect(r.reason).toContain('no provider configured');
  });

  it('never writes into the content tree on any refusal path', async () => {
    for (const d of [
      deps({ judge: vi.fn().mockResolvedValue({ agrees: false }) }),
      deps({ judge: vi.fn().mockRejectedValue(new Error('x')) }),
      deps({ generate: vi.fn().mockResolvedValue('') }),
    ]) {
      await generateVariant(req, d);
      for (const k of d.written.keys()) {
        expect(k.startsWith(DRAFT_DIR)).toBe(true);
      }
    }
  });
});

describe('validateGenerated is the same check CI runs', () => {
  it('accepts a well-formed pair', () => {
    const file = assembleVariantFile({
      baseRaw: BASE,
      stance: 'shaken',
      body: okBody,
      conceptId: 'eigenvalues',
      atomType: 'intuition',
    });
    expect(validateGenerated(BASE, file, 'x.md')).toEqual([]);
  });

  it('catches a mutated interactive block', () => {
    const tampered = okBody.replace('"title":"drag"', '"title":"different"');
    const file = assembleVariantFile({
      baseRaw: BASE,
      stance: 'shaken',
      body: tampered,
      conceptId: 'eigenvalues',
      atomType: 'intuition',
    });
    expect(validateGenerated(BASE, file, 'x.md').map((v) => v.rule)).toContain(
      'interactive-not-identical',
    );
  });
});
