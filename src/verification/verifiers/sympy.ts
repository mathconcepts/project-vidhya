/**
 * SympyVerifier — the Tier 2.5 SymPy stage (B1c).
 *
 * ── DEPLOYMENT SHAPE (B1d, locked by review — read before wiring this
 *    anywhere new) ─────────────────────────────────────────────────────
 *
 * This verifier shells out to a local `python3` with `sympy` installed.
 * Neither `Dockerfile` in this repo installs python3, so this module MUST
 * NEVER run on a production request path:
 *
 *   - It is wired into `TieredVerificationOrchestrator` ONLY via the
 *     constructor's optional, nullable `sympy` slot — `src/server.ts`
 *     (the one production call site) does not pass it, so the built-in
 *     Tier 2.5 stage is always skipped in production, honestly (absent =
 *     skipped, never approximated).
 *   - It is NOT imported anywhere under `src/api/**` — see
 *     `src/verification/__tests__/sympy-deployment-shape.test.ts`, which
 *     greps the whole `src/api/` tree for an import of this file and fails
 *     the build if one ever appears.
 *   - It IS meant to run in authoring sessions (ad hoc contract checks) and
 *     in CI (`.github/workflows/ci.yml` installs `sympy` before the test
 *     step so `npm test` exercises the real subprocess there).
 *
 * The live student-facing cascade stays RAG → LLM → Wolfram; SymPy carries
 * the bulk of AUTHORING-TIME and CI-TIME checking instead (plan premise 3).
 *
 * ── Refusal discipline ────────────────────────────────────────────────
 *
 * This verifier never guesses:
 *   - Unparseable input      → `{ agrees: false, confidence: 0,
 *     reason: "sympy: could not parse head '<construct>'" }`, naming the
 *     unparseable construct verbatim.
 *   - Subprocess timeout     → a refusal (never a throw).
 *   - python3 or sympy absent → `healthCheck()` returns `false`, and
 *     `verify()` refuses with `reason: "sympy unavailable: <what is
 *     missing>"`.
 *
 * `verify(problem, answer)` treats `problem` as the reference/expected
 * symbolic expression and `answer` as the candidate to check against it —
 * the only two strings the `AnswerVerifier` contract makes available. It
 * does not attempt natural-language problem solving: a full English
 * question (as most GATE problem statements are) will usually come back
 * unparseable, which is the honest outcome — SymPy is a closed-form CAS,
 * not an NLP layer, and an honest refusal here is what lets the tiered
 * orchestrator fall through to Wolfram arbitration instead of a guess.
 */

import { execFile } from 'child_process';
import { promisify } from 'util';
import type { AnswerVerifier, AnswerVerifierContext, AnswerVerifierResult } from './types';

const execFileAsync = promisify(execFile);

export const DEFAULT_SYMPY_TIMEOUT_MS = 10_000;

/**
 * Reads two CLI args (expected, candidate), tries to sympify each, and
 * prints ONE line of JSON describing the outcome. Never raises past its own
 * top-level try/except — a python-side crash still produces a JSON line
 * (or, worst case, empty stdout, which the TS side treats as an error
 * outcome, never a guessed agreement).
 */
const PY_SCRIPT = `
import sys, json, re

def head_of(raw):
    m = re.match(r"^\\s*([A-Za-z_][A-Za-z0-9_]*)\\s*[\\[\\(]", raw)
    if m:
        return m.group(1)
    stripped = raw.strip()
    return stripped[:40] if stripped else "empty expression"

def main():
    expected_raw = sys.argv[1] if len(sys.argv) > 1 else ""
    candidate_raw = sys.argv[2] if len(sys.argv) > 2 else ""

    try:
        import sympy
        from sympy.parsing.sympy_parser import (
            parse_expr, standard_transformations, implicit_multiplication_application,
        )
    except Exception as e:
        print(json.dumps({"unavailable": True, "error": str(e)}))
        return

    transformations = standard_transformations + (implicit_multiplication_application,)

    def try_parse(raw):
        try:
            return parse_expr(raw, transformations=transformations, evaluate=True), None
        except Exception as e:
            return None, str(e)

    expected_expr, _ = try_parse(expected_raw)
    if expected_expr is None:
        print(json.dumps({"unparseable": True, "head": head_of(expected_raw)}))
        return

    candidate_expr, _ = try_parse(candidate_raw)
    if candidate_expr is None:
        print(json.dumps({"unparseable": True, "head": head_of(candidate_raw)}))
        return

    try:
        agrees = bool(sympy.simplify(expected_expr - candidate_expr) == 0)
    except Exception:
        try:
            agrees = bool(sympy.simplify(expected_expr) == sympy.simplify(candidate_expr))
        except Exception:
            print(json.dumps({"unparseable": True, "head": head_of(candidate_raw)}))
            return

    try:
        canonical = str(sympy.simplify(expected_expr))
    except Exception:
        canonical = str(expected_expr)

    print(json.dumps({"agrees": agrees, "canonical": canonical}))

main()
`;

interface SympyStdout {
  unavailable?: boolean;
  error?: string;
  unparseable?: boolean;
  head?: string;
  agrees?: boolean;
  canonical?: string;
}

type SympyOutcome =
  | { kind: 'ok'; agrees: boolean; canonical?: string }
  | { kind: 'unparseable'; head: string }
  | { kind: 'unavailable'; detail: string }
  | { kind: 'timeout' }
  | { kind: 'error'; detail: string };

// ── Test-only overrides (mirrors wolfram-verify-job.ts's __testing.setSleepForTests
// pattern) — lets tests exercise the timeout / unavailable / ENOENT paths
// deterministically without depending on whether THIS machine happens to
// have sympy installed. ──────────────────────────────────────────────────
let _pythonBin = 'python3';
let _scriptOverride: string | null = null;

async function runSympy(expected: string, candidate: string, timeoutMs: number): Promise<SympyOutcome> {
  const script = _scriptOverride ?? PY_SCRIPT;
  try {
    const { stdout } = await execFileAsync(_pythonBin, ['-c', script, expected, candidate], {
      timeout: timeoutMs,
      killSignal: 'SIGKILL',
    });
    const trimmed = stdout.trim();
    if (!trimmed) return { kind: 'error', detail: 'sympy subprocess produced no output' };
    let parsed: SympyStdout;
    try {
      parsed = JSON.parse(trimmed) as SympyStdout;
    } catch {
      return { kind: 'error', detail: `sympy subprocess produced non-JSON output: ${trimmed.slice(0, 200)}` };
    }
    if (parsed.unavailable) {
      return { kind: 'unavailable', detail: parsed.error || 'sympy module not importable' };
    }
    if (parsed.unparseable) {
      return { kind: 'unparseable', head: parsed.head || 'expression' };
    }
    return { kind: 'ok', agrees: !!parsed.agrees, canonical: parsed.canonical };
  } catch (err) {
    const e = err as NodeJS.ErrnoException & { killed?: boolean; signal?: string | null };
    if (e.killed || e.signal === 'SIGKILL' || e.signal === 'SIGTERM') {
      return { kind: 'timeout' };
    }
    if (e.code === 'ENOENT') {
      return { kind: 'unavailable', detail: `${_pythonBin} not found on PATH` };
    }
    return { kind: 'error', detail: e.message || 'unknown sympy subprocess failure' };
  }
}

export class SympyVerifier implements AnswerVerifier {
  readonly name = 'sympy';
  /**
   * Not an integer tier: this value is documentation only. The verifier is
   * NEVER passed to `registerVerifier()` (which enforces tier >= 4) — it is
   * wired directly into the orchestrator's dedicated Tier 2.5 constructor
   * slot. 2.5 signals its real cascade position (between Tier 2 LLM and
   * Tier 3 Wolfram) rather than implying it belongs in the >=4 registry.
   */
  readonly tier = 2.5;

  constructor(private readonly timeoutMs: number = DEFAULT_SYMPY_TIMEOUT_MS) {}

  async verify(
    problem: string,
    answer: string,
    _context?: AnswerVerifierContext,
  ): Promise<AnswerVerifierResult> {
    const outcome = await runSympy(problem, answer, this.timeoutMs);
    switch (outcome.kind) {
      case 'ok':
        return {
          agrees: outcome.agrees,
          confidence: 0.95,
          canonicalAnswer: outcome.canonical,
          reason: outcome.agrees ? undefined : `sympy: '${answer}' does not equal '${problem}'`,
        };
      case 'unparseable':
        return {
          agrees: false,
          confidence: 0,
          reason: `sympy: could not parse head '${outcome.head}'`,
        };
      case 'timeout':
        return {
          agrees: false,
          confidence: 0,
          reason: `sympy: subprocess timed out after ${this.timeoutMs}ms`,
        };
      case 'unavailable':
        return {
          agrees: false,
          confidence: 0,
          reason: `sympy unavailable: ${outcome.detail}`,
        };
      case 'error':
      default:
        return {
          agrees: false,
          confidence: 0,
          reason: `sympy: unexpected failure (${outcome.detail})`,
        };
    }
  }

  /**
   * Reuses the exact same subprocess path `verify()` takes (rather than a
   * separate `import sympy` probe) so the same test overrides cover both —
   * an 'ok' or 'unparseable' outcome means sympy genuinely ran and produced
   * a real verdict (even a "can't parse THIS input" verdict is a live
   * process); 'unavailable' / 'timeout' / 'error' mean it did not.
   */
  async healthCheck(): Promise<boolean> {
    const outcome = await runSympy('1', '1', this.timeoutMs);
    return outcome.kind === 'ok' || outcome.kind === 'unparseable';
  }
}

export default SympyVerifier;

export const __testing = {
  /** Swap the python binary (e.g. to a nonexistent one to force ENOENT). */
  setPythonBinForTests(bin: string): () => void {
    const prev = _pythonBin;
    _pythonBin = bin;
    return () => {
      _pythonBin = prev;
    };
  },
  /** Swap the inline script (e.g. to sleep, to force a deterministic timeout). */
  setScriptForTests(script: string): () => void {
    const prev = _scriptOverride;
    _scriptOverride = script;
    return () => {
      _scriptOverride = prev;
    };
  },
};
