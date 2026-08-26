/**
 * scripts/check-la-walkthrough.ts — Linear Algebra Complete Walkthrough
 * CI gate. Spawns the real script (via tsx) against isolated fixture
 * trees, same pattern as check-connection-budget.test.ts: nothing here
 * ever mutates the real repo's explainers.json, pyq-bank.json, content
 * module, or practice-item banks.
 *
 * Three read paths are overridden via env vars
 * (LA_WALKTHROUGH_EXPLAINERS_PATH / _CONTENT_ROOT / _PYQ_BANK_PATH); the
 * practice-item leg has no override of its own — it goes through
 * `FileLearningObjectCatalog`, which resolves `data/practice-items`
 * relative to `process.cwd()`, so the isolated tree is placed at the
 * spawned process's `cwd` instead (matching the catalog's own
 * resolution rather than parallelling it).
 *
 * The fixture spans the REAL set of linear-algebra concept ids (read
 * from concept-graph.ts in-process, not hardcoded) so the "all legs
 * present" scenario can assert a genuine exit 0 — a partial concept list
 * would always leave 20-odd real concepts uncovered and failing.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { ALL_CONCEPTS } from '../../../constants/concept-graph';

const SCRIPT = path.resolve(process.cwd(), 'scripts/check-la-walkthrough.ts');

/**
 * Spawn through the repo's OWN pinned tsx binary, never `npx tsx`.
 *
 * `npx` resolves tsx from the network when the cache is cold and announces it
 * on STDERR ("npm warn exec The following package was not found..."), which is
 * indistinguishable from the script's own stderr to a test that asserts silence
 * — green locally where tsx is already resolved, red on a cold CI runner.
 * tsx is a pinned devDependency, so the local binary always exists here.
 */
const TSX_BIN = path.resolve(process.cwd(), 'node_modules/.bin/tsx');

const LA_CONCEPT_IDS: string[] = ALL_CONCEPTS.filter((c) => c.topic === 'linear-algebra').map((c) => c.id);

/**
 * The complete, locked set of `exam_tested: false` concept ids (CEO plan —
 * "no past question, cannot be closed honestly"). Read from the real
 * concept graph, never hardcoded here, so this test fails the moment the
 * flag set drifts from the 15 documented in gate-ma.yml — same discipline
 * `LA_CONCEPT_IDS` above already applies to the linear-algebra set.
 */
const EXAM_TESTED_FALSE_IDS = new Set<string>([
  'sequences', 'chain-rule', 'product-quotient-rule', 'implicit-differentiation',
  'integration-basics', 'partial-fractions',
  'ode-higher-order',
  'sampling-distributions',
  'vector-algebra-basics',
  'graph-connectivity', 'shortest-paths',
  'conformal-mapping',
  'numerical-error-analysis',
  'laplace-applications',
  'group-theory-basics',
]);

function runScript(args: string[], cwd: string, extraEnv: Record<string, string>) {
  return spawnSync(TSX_BIN, [SCRIPT, ...args], {
    encoding: 'utf-8',
    timeout: 60_000,
    cwd,
    env: { ...process.env, ...extraEnv },
  });
}

interface Fixture {
  root: string;
  env: Record<string, string>;
  cleanup(): void;
}

/**
 * A complete fixture: every real linear-algebra concept id gets all four
 * legs. `mutate` (optional) runs after the complete tree is built, so a
 * test can knock out exactly one leg for one concept without hand-building
 * the other 25+.
 */
/**
 * `conceptIds` defaults to the real linear-algebra set (backward-compatible
 * with every existing test below); `omitTestLeg` skips writing ANY PYQ
 * entry for ANY concept, so a fixture can isolate "what does the test leg
 * do with zero mapped questions everywhere" without hand-editing the bank
 * afterward for each concept.
 */
function buildFixture(
  mutate?: (root: string, ids: string[]) => void,
  conceptIds: string[] = LA_CONCEPT_IDS,
  omitTestLeg = false,
): Fixture {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'la-walkthrough-test-'));

  const explainersPath = path.join(root, 'explainers.json');
  const contentRoot = path.join(root, 'content');
  const pyqBankPath = path.join(root, 'pyq-bank.json');
  const practiceItemsDir = path.join(root, 'data', 'practice-items');
  fs.mkdirSync(practiceItemsDir, { recursive: true });
  fs.mkdirSync(contentRoot, { recursive: true });

  const byConcept: Record<string, unknown[]> = {};
  const pyqProblems: unknown[] = [];
  const practiceItems: unknown[] = [];

  for (const id of conceptIds) {
    // Leg 1 — explanation
    byConcept[id] = [{ model: 'test-authored', deep_explanation: `Real explanation body for ${id}.` }];

    // Leg 2 — interactive
    const atomsDir = path.join(contentRoot, id, 'atoms');
    fs.mkdirSync(atomsDir, { recursive: true });
    fs.writeFileSync(
      path.join(atomsDir, 'interactive.md'),
      [
        `Some prose about ${id}.`,
        '',
        '```interactive-spec',
        JSON.stringify({
          v: 1,
          kind: 'manipulable',
          title: 'Test widget',
          inputs: [{ id: 'a', label: 'a', min: 0, max: 10, initial: 5 }],
          outputs: [{ label: 'out', formula: 'a' }],
        }),
        '```',
        '',
      ].join('\n'),
    );

    // Leg 3 — practice (5 gradable mcq items)
    for (let i = 1; i <= 5; i++) {
      practiceItems.push({
        id: `pi-${id}-${String(i).padStart(3, '0')}`,
        concept_id: id,
        topic: 'linear-algebra',
        difficulty: 0.3,
        question_type: 'mcq',
        marks: 1,
        question_text: `Fixture question ${i} for ${id}?`,
        options: ['A', 'B', 'C', 'D'],
        answer_index: 0,
        correct_answer: 'A',
        solution_steps: ['step'],
        verification_method: 'authored',
      });
    }

    // Leg 4 — test (1 mapped PYQ), unless this fixture is deliberately
    // testing the zero-questions-everywhere scenario.
    if (!omitTestLeg) {
      pyqProblems.push({ id: `pyq-${id}-1`, concept_id: id, topic: 'linear-algebra' });
    }
  }

  fs.writeFileSync(
    explainersPath,
    JSON.stringify({ version: 1, generated_at: 'test', total: conceptIds.length, by_concept: byConcept }),
  );
  fs.writeFileSync(pyqBankPath, JSON.stringify({ problems: pyqProblems }));
  fs.writeFileSync(path.join(practiceItemsDir, 'fixture-bank.json'), JSON.stringify({ items: practiceItems }));

  if (mutate) mutate(root, conceptIds);

  return {
    root,
    env: {
      LA_WALKTHROUGH_EXPLAINERS_PATH: explainersPath,
      LA_WALKTHROUGH_CONTENT_ROOT: contentRoot,
      LA_WALKTHROUGH_PYQ_BANK_PATH: pyqBankPath,
    },
    cleanup() {
      fs.rmSync(root, { recursive: true, force: true });
    },
  };
}

const cleanups: Array<() => void> = [];
function track(fixture: Fixture): Fixture {
  cleanups.push(fixture.cleanup);
  return fixture;
}
afterEach(() => {
  while (cleanups.length) cleanups.pop()!();
});

describe('check-la-walkthrough', () => {
  it('has at least one real linear-algebra concept to build fixtures against', () => {
    expect(LA_CONCEPT_IDS.length).toBeGreaterThan(0);
  });

  it('all-legs-present passes (exit 0) across every real linear-algebra concept', () => {
    const fixture = track(buildFixture());
    const r = runScript([], fixture.root, fixture.env);
    expect(r.stderr).toBe('');
    expect(r.status).toBe(0);
    expect(r.stdout).toContain('Every Linear Algebra concept has a complete 4-leg walkthrough');
    expect(r.stdout).toContain(`Checked ${LA_CONCEPT_IDS.length} concepts | Full walkthrough: ${LA_CONCEPT_IDS.length} pass, 0 fail`);
  });

  it('a concept missing the explanation leg fails, naming the concept and the leg', () => {
    const target = LA_CONCEPT_IDS[0];
    const fixture = track(
      buildFixture((root) => {
        const explainersPath = path.join(root, 'explainers.json');
        const bundle = JSON.parse(fs.readFileSync(explainersPath, 'utf-8'));
        delete bundle.by_concept[target]; // no explainer entry at all
        fs.writeFileSync(explainersPath, JSON.stringify(bundle));
      }),
    );
    const r = runScript([], fixture.root, fixture.env);
    expect(r.status).toBe(1);
    expect(r.stdout).toContain(`[${target}] explanation leg failing`);
  });

  it('a concept missing the interactive leg fails, naming the concept and the leg', () => {
    const target = LA_CONCEPT_IDS[0];
    const fixture = track(
      buildFixture((root) => {
        fs.rmSync(path.join(root, 'content', target, 'atoms'), { recursive: true, force: true });
      }),
    );
    const r = runScript([], fixture.root, fixture.env);
    expect(r.status).toBe(1);
    expect(r.stdout).toContain(`[${target}] interactive leg failing`);
  });

  it('a concept missing the practice leg (below the >=5 floor) fails, naming the concept and the leg', () => {
    const target = LA_CONCEPT_IDS[0];
    const fixture = track(
      buildFixture((root) => {
        const bankPath = path.join(root, 'data', 'practice-items', 'fixture-bank.json');
        const bank = JSON.parse(fs.readFileSync(bankPath, 'utf-8'));
        // Drop this concept's items to below the floor (keep everyone else's).
        bank.items = bank.items.filter(
          (it: { concept_id: string; id: string }) => !(it.concept_id === target && it.id.endsWith('004')) &&
            !(it.concept_id === target && it.id.endsWith('005')),
        );
        fs.writeFileSync(bankPath, JSON.stringify(bank));
      }),
    );
    const r = runScript([], fixture.root, fixture.env);
    expect(r.status).toBe(1);
    expect(r.stdout).toContain(`[${target}] practice leg failing`);
  });

  it('a concept missing the test leg (no mapped PYQ) fails, naming the concept and the leg', () => {
    const target = LA_CONCEPT_IDS[0];
    const fixture = track(
      buildFixture((root) => {
        const pyqPath = path.join(root, 'pyq-bank.json');
        const bank = JSON.parse(fs.readFileSync(pyqPath, 'utf-8'));
        bank.problems = bank.problems.filter((p: { concept_id: string }) => p.concept_id !== target);
        fs.writeFileSync(pyqPath, JSON.stringify(bank));
      }),
    );
    const r = runScript([], fixture.root, fixture.env);
    expect(r.status).toBe(1);
    expect(r.stdout).toContain(`[${target}] test leg failing`);
  });

  it('honors concept_ids[] over a legacy concept_id on the PYQ leg', () => {
    const target = LA_CONCEPT_IDS[0];
    const fixture = track(
      buildFixture((root) => {
        const pyqPath = path.join(root, 'pyq-bank.json');
        const bank = JSON.parse(fs.readFileSync(pyqPath, 'utf-8'));
        // Replace the target's problem with one that ONLY carries concept_ids,
        // no concept_id — this must still count.
        bank.problems = bank.problems.map((p: { concept_id: string }) =>
          p.concept_id === target ? { id: 'pyq-multi-1', concept_ids: [target] } : p,
        );
        fs.writeFileSync(pyqPath, JSON.stringify(bank));
      }),
    );
    const r = runScript([], fixture.root, fixture.env);
    expect(r.status).toBe(0);
  });

  it('--report-only exits 0 while still printing every failure', () => {
    const target = LA_CONCEPT_IDS[0];
    const fixture = track(
      buildFixture((root) => {
        const explainersPath = path.join(root, 'explainers.json');
        const bundle = JSON.parse(fs.readFileSync(explainersPath, 'utf-8'));
        delete bundle.by_concept[target];
        fs.writeFileSync(explainersPath, JSON.stringify(bundle));
      }),
    );
    const r = runScript(['--report-only'], fixture.root, fixture.env);
    expect(r.status).toBe(0);
    expect(r.stdout).toContain(`[${target}] explanation leg failing`);
    expect(r.stdout).toContain('not blocking (--report-only)');
  });
});

describe('exam_tested exemption (test leg)', () => {
  // discrete-mathematics: 6 real concepts, exactly one (`group-theory-basics`)
  // flagged `exam_tested: false`. Small enough to build a full fixture over
  // without hand-picking a subset, and it deliberately is NOT the
  // linear-algebra set — none of the 26 LA concepts are flagged, so this
  // exemption can only be exercised against a different topic.
  const DM_TOPIC = 'discrete-mathematics';
  const DM_CONCEPT_IDS = ALL_CONCEPTS.filter((c) => c.topic === DM_TOPIC).map((c) => c.id);
  const DM_FLAGGED_ID = 'group-theory-basics';
  const DM_UNFLAGGED_ID = DM_CONCEPT_IDS.find((id) => id !== DM_FLAGGED_ID)!;

  it('the flag exists on exactly the documented 15 concepts and no others', () => {
    const actual = new Set(ALL_CONCEPTS.filter((c) => c.exam_tested === false).map((c) => c.id));
    expect(actual).toEqual(EXAM_TESTED_FALSE_IDS);
    expect(actual.size).toBe(15);
  });

  it('none of the 26 real linear-algebra concepts are flagged', () => {
    const flaggedLA = LA_CONCEPT_IDS.filter((id) => EXAM_TESTED_FALSE_IDS.has(id));
    expect(flaggedLA).toEqual([]);
  });

  it('sanity: discrete-mathematics has exactly one flagged concept, matching the fixture assumption above', () => {
    const flaggedInTopic = DM_CONCEPT_IDS.filter((id) => EXAM_TESTED_FALSE_IDS.has(id));
    expect(flaggedInTopic).toEqual([DM_FLAGGED_ID]);
  });

  it('a flagged concept with zero mapped PYQs still passes the walkthrough, marked "not examined" rather than a bare ✓ — and an unflagged sibling with zero PYQs still fails', () => {
    const fixture = track(buildFixture(undefined, DM_CONCEPT_IDS, /* omitTestLeg */ true));
    const r = runScript(['--topic=' + DM_TOPIC], fixture.root, fixture.env);

    // Blocking run: the 5 unflagged concepts genuinely have no PYQ, so the
    // gate must still fail overall — the flag excuses exactly one concept,
    // never the whole topic.
    expect(r.status).toBe(1);

    // The flagged concept's row shows the honest "— (not examined)" cell,
    // never a bare "✓" (which would claim real evidence that doesn't exist).
    const flaggedRow = r.stdout!.split('\n').find((line) => line.startsWith(DM_FLAGGED_ID));
    expect(flaggedRow).toBeDefined();
    expect(flaggedRow).toContain('— (not examined)');

    // The flagged concept must NOT be listed among the failures at all —
    // this is the property that matters most: the exemption cannot
    // silently swallow a real gap.
    expect(r.stdout).not.toContain(`[${DM_FLAGGED_ID}] test leg failing`);

    // THE CASE THAT MATTERS: an unflagged concept with the exact same
    // "zero mapped PYQs" condition must still fail. A flag that accidentally
    // excuses everything is worse than no flag at all.
    expect(r.stdout).toContain(`[${DM_UNFLAGGED_ID}] test leg failing`);
  });

  it('the summary line separates real test-leg passes from flagged ("not examined") passes — never inflates to 100%', () => {
    const fixture = track(buildFixture(undefined, DM_CONCEPT_IDS, /* omitTestLeg */ true));
    const r = runScript(['--topic=' + DM_TOPIC, '--report-only'], fixture.root, fixture.env);

    expect(r.status).toBe(0); // --report-only never blocks
    // 6 concepts total, 0 real PYQ matches (omitTestLeg), 1 flagged pass.
    expect(r.stdout).toContain(`test 0/${DM_CONCEPT_IDS.length} (+1 not examined)`);
    // Must not print a summary that reads as full coverage.
    expect(r.stdout).not.toContain(`test ${DM_CONCEPT_IDS.length}/${DM_CONCEPT_IDS.length}`);
  });

  it('a flagged concept that DOES have a mapped PYQ anyway reports the real count, not the exemption — the flag never hides real evidence', () => {
    const fixture = track(
      buildFixture(
        (root) => {
          const pyqPath = path.join(root, 'pyq-bank.json');
          const bank = JSON.parse(fs.readFileSync(pyqPath, 'utf-8'));
          bank.problems.push({ id: 'pyq-bonus-1', concept_id: DM_FLAGGED_ID, topic: DM_TOPIC });
          fs.writeFileSync(pyqPath, JSON.stringify(bank));
        },
        DM_CONCEPT_IDS,
        /* omitTestLeg */ true,
      ),
    );
    const r = runScript(['--topic=' + DM_TOPIC, '--report-only'], fixture.root, fixture.env);

    const flaggedRow = r.stdout!.split('\n').find((line) => line.startsWith(DM_FLAGGED_ID));
    expect(flaggedRow).toBeDefined();
    expect(flaggedRow).toContain('✓ (1)');
    expect(flaggedRow).not.toContain('not examined');
  });
});

describe('against the real repo (no fixture — default paths)', () => {
  it('runs cleanly and reports on every real linear-algebra concept', () => {
    const r = spawnSync(TSX_BIN, [SCRIPT, '--report-only'], {
      encoding: 'utf-8',
      timeout: 60_000,
      cwd: process.cwd(),
      env: process.env,
    });
    expect(r.status).toBe(0); // --report-only never blocks
    expect(r.stdout).toContain(`Checked ${LA_CONCEPT_IDS.length} concepts`);
  });
});
