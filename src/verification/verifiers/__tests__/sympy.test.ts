/**
 * SympyVerifier (B1c) — contract compliance + the five locked scenarios:
 *   1. solvable closed-form agreement
 *   2. wrong-answer disagreement
 *   3. unparseable refusal (message names the construct)
 *   4. subprocess timeout → refusal, never a throw
 *   5. python3-or-sympy unavailable → healthCheck() false + a refusal
 *
 * Scenarios 4 and 5's python3-missing case use the `__testing` overrides so
 * they run deterministically regardless of whether THIS machine has real
 * sympy installed. Scenarios 1-3 need a genuine sympy install to prove real
 * CAS behavior (not a mocked stand-in) — they're skipped, with a printed
 * reason, when sympy is not importable locally. CI installs sympy
 * (.github/workflows/ci.yml) so they run for real there.
 */

import { describe, it, expect, afterEach } from 'vitest';
import { execFileSync } from 'child_process';
import { runAnswerVerifierContract } from '../contract';
import { SympyVerifier, __testing } from '../sympy';

function hasRealSympy(): boolean {
  try {
    execFileSync('python3', ['-c', 'import sympy'], { stdio: 'ignore', timeout: 5_000 });
    return true;
  } catch {
    return false;
  }
}

const SYMPY_AVAILABLE = hasRealSympy();
if (!SYMPY_AVAILABLE) {
  // eslint-disable-next-line no-console
  console.warn(
    '[sympy.test.ts] python3 + sympy not importable on this machine — skipping the ' +
      'real-computation scenarios (agree/disagree/unparseable-head). CI installs sympy ' +
      'and runs them for real there.',
  );
}

const restores: Array<() => void> = [];
afterEach(() => {
  while (restores.length > 0) restores.pop()!();
});

describe('SympyVerifier — AnswerVerifier contract', () => {
  runAnswerVerifierContract(new SympyVerifier());
});

describe.skipIf(!SYMPY_AVAILABLE)('SympyVerifier — real sympy computation', () => {
  it('agrees on a solvable closed-form match', async () => {
    const v = new SympyVerifier();
    const result = await v.verify('2 + 2', '4');
    expect(result.agrees).toBe(true);
    expect(result.confidence).toBeGreaterThan(0);
  });

  it('disagrees on a wrong closed-form answer', async () => {
    const v = new SympyVerifier();
    const result = await v.verify('2 + 2', '5');
    expect(result.agrees).toBe(false);
    expect(result.confidence).toBeGreaterThan(0); // decisive disagreement, not a refusal
  });

  it('refuses unparseable input, naming the construct in the reason', async () => {
    const v = new SympyVerifier();
    const result = await v.verify('Piecewise[{{1, x > 0}}, {0, x <= 0}]', '1');
    expect(result.agrees).toBe(false);
    expect(result.confidence).toBe(0);
    expect(result.reason).toMatch(/^sympy: could not parse head 'Piecewise'$/);
  });

  it('healthCheck() is true when sympy genuinely runs', async () => {
    const v = new SympyVerifier();
    await expect(v.healthCheck()).resolves.toBe(true);
  });
});

describe('SympyVerifier — subprocess timeout', () => {
  it('refuses (never throws) when the subprocess exceeds its timeout', async () => {
    restores.push(__testing.setScriptForTests('import time; time.sleep(5)'));
    const v = new SympyVerifier(100); // 100ms — the sleeping script cannot finish in time
    const result = await v.verify('2 + 2', '4');
    expect(result.agrees).toBe(false);
    expect(result.confidence).toBe(0);
    expect(result.reason).toMatch(/sympy: subprocess timed out after 100ms/);
  }, 15_000);
});

describe('SympyVerifier — python3/sympy unavailable', () => {
  it('healthCheck() is false and verify() refuses when python3 itself is missing', async () => {
    restores.push(__testing.setPythonBinForTests('python3-does-not-exist-xyz'));
    const v = new SympyVerifier();

    await expect(v.healthCheck()).resolves.toBe(false);

    const result = await v.verify('2 + 2', '4');
    expect(result.agrees).toBe(false);
    expect(result.confidence).toBe(0);
    expect(result.reason).toMatch(/^sympy unavailable: /);
  });

  it('refuses when python3 is present but sympy is not importable', async () => {
    restores.push(
      __testing.setScriptForTests(
        'import json; print(json.dumps({"unavailable": True, "error": "No module named \'sympy\'"}))',
      ),
    );
    const v = new SympyVerifier();
    const result = await v.verify('2 + 2', '4');
    expect(result.agrees).toBe(false);
    expect(result.confidence).toBe(0);
    expect(result.reason).toBe("sympy unavailable: No module named 'sympy'");
  });
});
