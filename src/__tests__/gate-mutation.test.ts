/**
 * Mutation tests for the two content gates that had none.
 *
 * ── Why a gate needs its own test ───────────────────────────────────────
 *
 * A gate that passes tells you nothing on its own. It passes when the corpus
 * is clean, and it passes when the check is broken, and from CI those two look
 * identical — a green tick either way. This session has already paid for that
 * confusion twice: a `curl | head` pipeline printed "typecheck clean" while tsc
 * was failing, because `head` exits 0; and an opening-4-gram repetition rule
 * shipped catching none of the three files it was written for, because the
 * repeated idiom was trailing rather than leading. Both looked green.
 *
 * The only honest way to know a gate works is to break something on purpose
 * and watch it fail. Each test below mutates a copy of a real, currently-passing
 * fixture, in exactly one way, and asserts a non-zero exit. If a rule is ever
 * silently disabled — a regex loosened, a check returning early, a `for` loop
 * that stopped iterating — the matching test here goes red.
 *
 * Both gates are run as subprocesses rather than imported, because both are
 * top-level-executing CLIs that call `process.exit`. Importing one would kill
 * the test runner. The subprocess also tests the thing CI actually runs,
 * including its exit code, which is the part that was wrong last time.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';

const ROOT = process.cwd();
const REAL_CONCEPTS = path.join(ROOT, 'modules/project-vidhya-content/concepts');
const REAL_RAILS = path.join(ROOT, 'config/demo-rails.json');

let tmp: string;

beforeAll(() => {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'vidhya-gate-mutation-'));
});
afterAll(() => {
  fs.rmSync(tmp, { recursive: true, force: true });
});

/** Runs a gate and reports its exit code — the thing CI reads. */
function runGate(script: string, ...args: string[]): { code: number; out: string } {
  try {
    const out = execFileSync('npx', ['tsx', path.join('scripts', script), ...args], {
      cwd: ROOT,
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: 120_000,
    });
    return { code: 0, out };
  } catch (err) {
    const e = err as { status?: number; stdout?: string; stderr?: string };
    return { code: e.status ?? 1, out: `${e.stdout ?? ''}${e.stderr ?? ''}` };
  }
}

// ── content integrity ───────────────────────────────────────────────────

/** A minimal, clean one-concept corpus. Each mutation starts from this. */
function makeCorpus(name: string, body: string, frontmatter?: string): string {
  const dir = path.join(tmp, name, 'eigenvalues', 'atoms');
  fs.mkdirSync(dir, { recursive: true });
  const fm =
    frontmatter ??
    ['---', 'id: eigenvalues.intuition', 'concept_id: eigenvalues', 'atom_type: intuition', '---'].join('\n');
  fs.writeFileSync(path.join(dir, 'intuition.md'), `${fm}\n\n${body}\n`, 'utf-8');
  return path.join(tmp, name);
}

const CLEAN_BODY = 'A matrix sends most vectors somewhere new. A few it only stretches.';

describe('check-content-integrity fails on what it claims to catch', () => {
  it('passes a clean corpus — the control', () => {
    // Without this the failures below prove nothing: a gate that fails on
    // everything is not a gate.
    const r = runGate('check-content-integrity.ts', makeCorpus('clean', CLEAN_BODY));
    expect(r.code, r.out).toBe(0);
  });

  it('still passes the real corpus', () => {
    expect(fs.existsSync(REAL_CONCEPTS)).toBe(true);
    expect(runGate('check-content-integrity.ts', REAL_CONCEPTS).code).toBe(0);
  });

  it('catches leaked authoring scaffolding', () => {
    const r = runGate(
      'check-content-integrity.ts',
      makeCorpus('scaffold', `**File 2:** the intuition atom\n\n${CLEAN_BODY}`),
    );
    expect(r.code).toBe(1);
    expect(r.out).toMatch(/scaffolding/i);
  });

  it('catches a leaked DONE marker', () => {
    // 29 atoms carried one of these into the lesson.
    const r = runGate(
      'check-content-integrity.ts',
      makeCorpus('done', `${CLEAN_BODY}\n\nDONE:eigenvalues`),
    );
    expect(r.code).toBe(1);
    expect(r.out).toMatch(/generation marker/i);
  });

  it('catches a sign-off addressed to the operator', () => {
    const r = runGate(
      'check-content-integrity.ts',
      makeCorpus('signoff', `${CLEAN_BODY}\n\nThe content is ready for Vidhya's curriculum system.`),
    );
    expect(r.code).toBe(1);
    expect(r.out).toMatch(/operator/i);
  });

  it('catches an unclosed code fence', () => {
    // An unclosed fence swallows the rest of the atom silently.
    const r = runGate(
      'check-content-integrity.ts',
      makeCorpus('fence', '```interactive-spec\n{"v":1}\n\nand then the lesson continues'),
    );
    expect(r.code).toBe(1);
    expect(r.out).toMatch(/unbalanced/i);
  });

  it('catches an id that belongs to a different atom', () => {
    // This is how a whole atom ends up rendered in the wrong slot.
    const r = runGate(
      'check-content-integrity.ts',
      makeCorpus(
        'wrongid',
        CLEAN_BODY,
        ['---', 'id: eigenvalues.worked-example', 'concept_id: eigenvalues', 'atom_type: worked_example', '---'].join('\n'),
      ),
    );
    expect(r.code).toBe(1);
    expect(r.out).toMatch(/does not match its filename/i);
  });

  it('does NOT trip on ordinary prose that merely mentions a file', () => {
    // The scaffolding rule is anchored and needs the colon. If it ever
    // loosens into a bare word match, this goes red — which is the point.
    const r = runGate(
      'check-content-integrity.ts',
      makeCorpus('prose', 'See File 2 of the appendix for the full derivation, or the path a vector takes.'),
    );
    expect(r.code, r.out).toBe(0);
  });

  it('catches a leaked tool/agent error message', () => {
    // Real leak from rank-nullity's worked-example.md: the authoring tool's
    // own permission-handler failure, rendered in the lesson.
    const r = runGate(
      'check-content-integrity.ts',
      makeCorpus(
        'toolerror',
        `${CLEAN_BODY}\n\n**Error encountered:** The Write tool permission handler is misconfigured on this system. The atoms above are ready to be written to the file paths specified.`,
      ),
    );
    expect(r.code).toBe(1);
    expect(r.out).toMatch(/tool\/agent error/i);
  });

  it('does NOT trip on legitimate math prose that uses the word "error" or "write"', () => {
    // A word-level match here would refuse every stats/numerical-methods
    // atom in the corpus. The rule needs the specific vocabulary of a tool
    // failure report, not the bare words.
    const r = runGate(
      'check-content-integrity.ts',
      makeCorpus(
        'mathprose',
        `${CLEAN_BODY}\n\nThe standard error shrinks as sample size grows, and round-off error compounds across iterations. We write the matrix in row-echelon form before reading off the rank.`,
      ),
    );
    expect(r.code, r.out).toBe(0);
  });

  it.each([
    // Near-miss variants of the sign-off/tool-error leak, found on a corpus
    // sweep across taylor-laurent, integration-substitution,
    // discrete-distributions, counting-principles, and conformal-mapping —
    // each phrased just differently enough from the rank-nullity original to
    // slip past the first version of checks 1b/1c.
    ['ready to be written to the file paths', 'These three atoms are ready to be written to the file paths. The content includes:'],
    ['ready to be written to the concept directory', 'The three atom files are ready to be written to the concept directory. Due to a system permission configuration issue, I have provided the complete content above.'],
    ['now ready to be written to their respective file paths', 'All three atoms are now ready to be written to their respective file paths.'],
    ['permission handler, no "misconfigured"', 'Fix the permission handler configuration to allow Write/Bash tool calls, or run this command manually.'],
    ['permission handler before "Write tool"', 'Due to permission handler configuration issues with the Write tool, I am unable to directly create these files on disk.'],
    ['self-reported inability to create files, no "permission handler"', 'I am unable to directly create these files on disk, so the content is provided above instead.'],
  ])('catches the near-miss leak variant: %s', (_label, leak) => {
    const r = runGate('check-content-integrity.ts', makeCorpus(`nearmiss-${_label.replace(/\W+/g, '-')}`, `${CLEAN_BODY}\n\n${leak}`));
    expect(r.code, r.out).toBe(1);
    expect(r.out).toMatch(/operator|tool\/agent error/i);
  });

  it('refuses an empty corpus rather than reporting success', () => {
    // "Nothing to check" passing as "everything is clean" is the exact
    // false-green this whole file exists to prevent.
    const empty = path.join(tmp, 'empty');
    fs.mkdirSync(empty, { recursive: true });
    const r = runGate('check-content-integrity.ts', empty);
    expect(r.code).toBe(1);
    expect(r.out).toMatch(/no content found/i);
  });
});

// ── demo rails ──────────────────────────────────────────────────────────

function mutateRails(name: string, mutate: (cfg: any) => void): string {
  const cfg = JSON.parse(fs.readFileSync(REAL_RAILS, 'utf-8'));
  mutate(cfg);
  const p = path.join(tmp, `rails-${name}.json`);
  fs.writeFileSync(p, JSON.stringify(cfg, null, 2), 'utf-8');
  return p;
}

/** The first card that has the shape a given mutation needs. */
function firstCardWith(cfg: any, pred: (c: any) => boolean): any {
  const card = (cfg.cards ?? []).find(pred);
  if (!card) throw new Error('fixture has no card of the required shape');
  return card;
}

describe('check-demo-rails fails on what it claims to catch', () => {
  it('passes the real rails file — the control', () => {
    expect(runGate('check-demo-rails.ts', REAL_RAILS).code).toBe(0);
  });

  it('passes an unmutated copy, so the copy itself is not the variable', () => {
    expect(runGate('check-demo-rails.ts', mutateRails('noop', () => {})).code).toBe(0);
  });

  it('catches a card pointing at a persona that does not exist', () => {
    const p = mutateRails('persona', (cfg) => {
      firstCardWith(cfg, (c) => Boolean(c.persona)).persona = 'nobody-at-all';
    });
    const r = runGate('check-demo-rails.ts', p);
    expect(r.code).toBe(1);
    expect(r.out).toMatch(/persona/i);
  });

  it('catches a rail pointing at a concept with no atoms on disk', () => {
    // A visitor would walk into an empty lesson.
    const p = mutateRails('concept', (cfg) => {
      firstCardWith(cfg, (c) => c.rail?.kind === 'atoms').rail.concept_id = 'no-such-concept';
    });
    const r = runGate('check-demo-rails.ts', p);
    expect(r.code).toBe(1);
  });

  it('catches puffery in a caption', () => {
    const p = mutateRails('puffery', (cfg) => {
      const card = firstCardWith(cfg, (c) => Array.isArray(c.captions) && c.captions.length > 0);
      card.captions[0].text = 'This revolutionary experience will transform your exam prep.';
    });
    const r = runGate('check-demo-rails.ts', p);
    expect(r.code).toBe(1);
    expect(r.out).toMatch(/revolutionary|puffery/i);
  });

  it('catches a caption anchored to a step that is not on its own rail', () => {
    // CaptionTargetMissingError, made structurally impossible rather than
    // handled at runtime.
    const p = mutateRails('anchor', (cfg) => {
      const card = firstCardWith(cfg, (c) => Array.isArray(c.captions) && c.captions.length > 0);
      card.captions[0].at = 'a-step-that-is-on-no-rail';
    });
    const r = runGate('check-demo-rails.ts', p);
    expect(r.code).toBe(1);
  });

  it('catches an unknown rail kind rather than skipping it', () => {
    // Silently skipping an unrecognised kind is how a whole rail goes
    // unvalidated while the gate still reports green.
    const p = mutateRails('kind', (cfg) => {
      firstCardWith(cfg, (c) => Boolean(c.rail)).rail.kind = 'somethingelse';
    });
    const r = runGate('check-demo-rails.ts', p);
    expect(r.code).toBe(1);
  });

  it('catches an unknown audience', () => {
    const p = mutateRails('audience', (cfg) => {
      firstCardWith(cfg, (c) => Boolean(c.audience)).audience = 'investor';
    });
    expect(runGate('check-demo-rails.ts', p).code).toBe(1);
  });

  it('refuses a malformed rails file rather than passing it', () => {
    const p = path.join(tmp, 'rails-broken.json');
    fs.writeFileSync(p, '{ "version": 1, "cards": [', 'utf-8');
    expect(runGate('check-demo-rails.ts', p).code).toBe(1);
  });

  it('refuses a missing rails file rather than passing it', () => {
    expect(runGate('check-demo-rails.ts', path.join(tmp, 'does-not-exist.json')).code).toBe(1);
  });
});

// ── demo rails: the intent-lanes flag ───────────────────────────────────

/**
 * The lanes-on assertion is the one check here whose subject is the deploy
 * rather than the deck, and it is the one most in need of a mutation test: a
 * flag check that silently stopped checking would leave every other assertion
 * green while the demo went dark again — which is the exact history this
 * assertion exists because of.
 */
function blueprintFixture(name: string, mutate: (bp: any) => void): string {
  const bp = parseYaml(fs.readFileSync(path.join(ROOT, 'render.yaml'), 'utf-8'));
  mutate(bp);
  const p = path.join(tmp, `render-${name}.yaml`);
  fs.writeFileSync(p, stringifyYaml(bp), 'utf-8');
  return p;
}

function intentLanesEntry(bp: any): any {
  const entry = (bp.services?.[0]?.envVars ?? []).find((v: any) => v?.key === 'VIDHYA_INTENT_LANES');
  if (!entry) throw new Error('render.yaml no longer declares VIDHYA_INTENT_LANES — fixture is stale');
  return entry;
}

describe('check-demo-rails asserts the demo deploy turns the intent lanes on', () => {
  it('passes the committed render.yaml — the control', () => {
    const r = runGate('check-demo-rails.ts', REAL_RAILS, path.join(ROOT, 'render.yaml'));
    expect(r.code, r.out).toBe(0);
    expect(r.out).toMatch(/VIDHYA_INTENT_LANES=on/);
  });

  it('passes an unmutated re-serialised copy, so the copy is not the variable', () => {
    const p = blueprintFixture('noop', () => {});
    expect(runGate('check-demo-rails.ts', REAL_RAILS, p).code).toBe(0);
  });

  it('catches the flag being removed from the blueprint', () => {
    const p = blueprintFixture('absent', (bp) => {
      bp.services[0].envVars = bp.services[0].envVars.filter(
        (v: any) => v?.key !== 'VIDHYA_INTENT_LANES',
      );
    });
    const r = runGate('check-demo-rails.ts', REAL_RAILS, p);
    expect(r.code).toBe(1);
    expect(r.out).toMatch(/VIDHYA_INTENT_LANES not declared at all/);
  });

  it('catches the flag being turned off rather than removed', () => {
    const p = blueprintFixture('off', (bp) => {
      intentLanesEntry(bp).value = 'off';
    });
    const r = runGate('check-demo-rails.ts', REAL_RAILS, p);
    expect(r.code).toBe(1);
    expect(r.out).toMatch(/expected: VIDHYA_INTENT_LANES: "on"/);
  });

  it('catches the flag being demoted to an operator-supplied key', () => {
    // `sync: false` means "the Render UI prompts for this" — the value stops
    // being committed, which is the state the whole assertion is about.
    const p = blueprintFixture('sync-false', (bp) => {
      const entry = intentLanesEntry(bp);
      delete entry.value;
      entry.sync = false;
    });
    expect(runGate('check-demo-rails.ts', REAL_RAILS, p).code).toBe(1);
  });

  it('refuses a missing blueprint rather than passing it', () => {
    const r = runGate('check-demo-rails.ts', REAL_RAILS, path.join(tmp, 'no-render.yaml'));
    expect(r.code).toBe(1);
  });
});
