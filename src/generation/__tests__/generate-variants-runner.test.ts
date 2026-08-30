/**
 * The corpus-walking runner.
 *
 * The interesting behaviour is what it refuses to do: invent a variant for a
 * base that does not exist, overwrite one that does, and keep burning calls
 * after the run has clearly gone wrong. Those are the three ways an unattended
 * 566-call run damages the corpus or the bill.
 */
import { describe, it, expect, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {
  findPending,
  baseAtomPath,
  configuredProviders,
  runGeneration,
  topicGuidanceFor,
  type PendingVariant,
} from '../../../scripts/generate-variants';
import { CADENCE_ATOM_TYPES } from '../../content/stance-cadence';

const BASE = `---
id: eigenvalues.intuition
concept_id: eigenvalues
atom_type: intuition
bloom_level: 2
difficulty: 0.15
exam_ids: ["*"]
---

A matrix sends most vectors somewhere new. A few it only stretches.
`;

function pending(n: number): PendingVariant[] {
  return Array.from({ length: n }, (_, i) => ({
    conceptId: `c${i}`,
    atomType: 'intuition',
    stance: 'shaken' as const,
    basePath: `/fake/c${i}.md`,
    targetPath: `modules/project-vidhya-content/concepts/c${i}/atoms/intuition-shaken.md`,
  }));
}

function deps(over: Record<string, unknown> = {}) {
  const logs: string[] = [];
  const written = new Map<string, string>();
  return {
    logs,
    written,
    readFile: () => BASE,
    log: (s: string) => logs.push(s),
    generate: vi.fn().mockResolvedValue('Shorter body.'),
    judge: vi.fn().mockResolvedValue({ agrees: true }),
    writeFile: vi.fn(async (p: string, c: string) => {
      written.set(p, c);
    }),
    ...over,
  } as never as Parameters<typeof runGeneration>[1] & { logs: string[]; written: Map<string, string> };
}

describe('findPending', () => {
  const root = path.join(process.cwd(), 'modules/project-vidhya-content/concepts');
  const haveCorpus = fs.existsSync(root);

  // A fixture concept, created and removed per test. The corpus is complete —
  // every base atom has both stances — so driving these assertions from it
  // would loop over an empty list and assert nothing. The fixture is one
  // deliberately un-varianted base atom, which keeps the contract tests honest
  // no matter how finished the real corpus is.
  const FIXTURE = '__pending_fixture__';
  function withFixture<T>(fn: () => T): T {
    const dir = path.join(root, FIXTURE, 'atoms');
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'intuition.md'), BASE);
    fs.writeFileSync(path.join(dir, 'worked-example.md'), BASE);
    try {
      return fn();
    } finally {
      fs.rmSync(path.join(root, FIXTURE), { recursive: true, force: true });
    }
  }

  it.runIf(haveCorpus)('proposes nothing when every base atom already has both stances', () => {
    // The steady state, and the reason it is worth asserting: add a base atom
    // without its shaken and assured siblings and this fails, naming the gap.
    // Completeness is not visible from a file count — a concept can carry a
    // second worked_example whose variants nobody wrote.
    expect(findPending()).toEqual([]);
  });

  it.runIf(haveCorpus)('never proposes a variant that already exists', () => {
    withFixture(() => {
      const all = findPending(FIXTURE);
      expect(all.length).toBeGreaterThan(0);
      for (const p of all) {
        expect(fs.existsSync(path.join(process.cwd(), p.targetPath)), p.targetPath).toBe(false);
      }
    });
  });

  it.runIf(haveCorpus)('never proposes a variant with no base atom to rewrite', () => {
    // Generating one anyway would produce content nothing verified.
    withFixture(() => {
      const all = findPending(FIXTURE);
      expect(all.length).toBeGreaterThan(0);
      for (const p of all) {
        expect(fs.existsSync(p.basePath), `${p.conceptId}/${p.atomType}`).toBe(true);
      }
    });
  });

  it.runIf(haveCorpus)('proposes only the narrative atom types and both stances', () => {
    withFixture(() => {
      const all = findPending(FIXTURE);
      expect(all.length).toBeGreaterThan(0);
      for (const p of all) {
        expect(CADENCE_ATOM_TYPES).toContain(p.atomType as never);
        expect(['shaken', 'assured']).toContain(p.stance);
      }
      // Both stances for both base atoms, and nothing invented beyond them.
      expect(all.map((p) => `${p.atomType}:${p.stance}`).sort()).toEqual([
        'intuition:assured',
        'intuition:shaken',
        'worked_example:assured',
        'worked_example:shaken',
      ]);
    });
  });

  it.runIf(haveCorpus)('honours the concept filter', () => {
    const one = findPending('eigenvalues');
    expect(one.every((p) => p.conceptId === 'eigenvalues')).toBe(true);
  });

  it.runIf(haveCorpus)('maps an atom type to its hyphenated file stem', () => {
    // worked_example lives in worked-example.md; getting this wrong reports the
    // whole corpus as having no base atoms.
    expect(baseAtomPath('eigenvalues', 'worked_example')).toMatch(/worked-example\.md$/);
  });
});

describe('configuredProviders', () => {
  it('reads keys from the environment it is given', () => {
    expect(configuredProviders({ ANTHROPIC_API_KEY: 'x' } as never)).toEqual(['anthropic']);
    expect(configuredProviders({} as never)).toEqual([]);
  });

  it('ignores a key set to whitespace', () => {
    expect(configuredProviders({ OPENAI_API_KEY: '   ' } as never)).toEqual([]);
  });

  it('reports every provider that has a key', () => {
    const got = configuredProviders({ GEMINI_API_KEY: 'a', OPENROUTER_API_KEY: 'b' } as never);
    expect(got.sort()).toEqual(['google-gemini', 'openrouter']);
  });
});

describe('runGeneration', () => {
  it('counts what it wrote and what it refused', async () => {
    const d = deps();
    const s = await runGeneration(pending(3), d);
    expect(s).toMatchObject({ written: 3, refused: 0, skipped: 0 });
  });

  it('keeps going after a single refusal', async () => {
    let call = 0;
    const d = deps({
      judge: vi.fn(async () => ({ agrees: ++call !== 2 })),
    });
    const s = await runGeneration(pending(4), d);
    expect(s).toMatchObject({ written: 3, refused: 1 });
  });

  it('STOPS after a run of refusals rather than burning 566 calls', async () => {
    // The expensive failure is not one bad variant. It is finding out after the
    // whole corpus that the prompt was wrong for all of them.
    const d = deps({ judge: vi.fn().mockResolvedValue({ agrees: false }) });
    const s = await runGeneration(pending(100), d, { maxConsecutiveRefusals: 5 });
    expect(s.refused).toBe(5);
    expect(s.stoppedEarly).toMatch(/consecutive refusals/);
    expect(d.generate).toHaveBeenCalledTimes(5);
  });

  it('resets the refusal streak on a success', async () => {
    let call = 0;
    const d = deps({
      // refuse, refuse, accept, refuse, refuse — never three in a row
      judge: vi.fn(async () => ({ agrees: ++call === 3 })),
    });
    const s = await runGeneration(pending(5), d, { maxConsecutiveRefusals: 3 });
    expect(s.stoppedEarly).toBeUndefined();
    expect(s).toMatchObject({ written: 1, refused: 4 });
  });

  it('skips an unreadable base instead of aborting the run', async () => {
    let n = 0;
    const d = deps({
      readFile: () => {
        if (++n === 1) throw new Error('ENOENT');
        return BASE;
      },
    });
    const s = await runGeneration(pending(3), d);
    expect(s).toMatchObject({ written: 2, skipped: 1 });
    expect(d.logs[0]).toMatch(/cannot read base/);
  });

  it('does not consume a generation call for a skipped base', async () => {
    const d = deps({
      readFile: () => {
        throw new Error('ENOENT');
      },
    });
    await runGeneration(pending(3), d);
    expect(d.generate).not.toHaveBeenCalled();
  });

  it('logs the reason on every refusal, so a draft is traceable', async () => {
    const d = deps({ judge: vi.fn().mockResolvedValue({ agrees: false, reason: 'dropped the domain' }) });
    await runGeneration(pending(1), d);
    expect(d.logs.join('\n')).toMatch(/refuse .* dropped the domain/);
  });

  it('writes nothing into the content tree for a refusal', async () => {
    const d = deps({ judge: vi.fn().mockRejectedValue(new Error('down')) });
    await runGeneration(pending(2), d);
    for (const k of d.written.keys()) {
      expect(k.startsWith('.data/variant-drafts')).toBe(true);
    }
  });

  it('is a no-op on an empty work list', async () => {
    const d = deps();
    expect(await runGeneration([], d)).toMatchObject({ written: 0, refused: 0, skipped: 0 });
    expect(d.generate).not.toHaveBeenCalled();
  });
});

describe('topicGuidanceFor', () => {
  const haveTemplates = fs.existsSync(
    path.join(process.cwd(), 'modules/project-vidhya-content/templates'),
  );

  it.runIf(haveTemplates)('reads the pilot topic voice out of the template', () => {
    const g = topicGuidanceFor('linear-algebra', 'hook', 'shaken');
    expect(g).toBeTruthy();
    expect(g!.length).toBeGreaterThan(20);
  });

  it.runIf(haveTemplates)('returns undefined for a topic no template declares', () => {
    expect(topicGuidanceFor('underwater-basket-weaving', 'hook', 'shaken')).toBeUndefined();
  });

  it.runIf(haveTemplates)('returns undefined for an atom type with no stance block', () => {
    expect(topicGuidanceFor('linear-algebra', 'formal_definition', 'shaken')).toBeUndefined();
  });
});
