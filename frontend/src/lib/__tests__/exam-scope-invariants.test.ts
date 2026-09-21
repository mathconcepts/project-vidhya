/**
 * Exam-scope invariants — a source grep, in the style of the backend's
 * surveillance-invariant suite.
 *
 * The viewer's chosen exam rides along as `?exam_id=` and is appended in
 * exactly ONE place: `withExamChoice`, called centrally inside `apiFetch`
 * (see lib/exam-choice.ts for why it is central and not per-call-site).
 * A bare `fetch('/api/topics')` therefore silently asks for the DEPLOYMENT
 * default exam instead of the viewer's — and the server answers honestly,
 * so nothing anywhere errors.
 *
 * That is exactly what shipped: SmartPracticePage used a raw fetch, so a
 * viewer on JEE Main saw a "JEE Main (PCM)" header above GATE's eight
 * topic chips (/investigate, 2026-09-21). No test could catch it, because
 * every unit and every backend test was individually correct.
 *
 * This locks the rule at the only level it holds: no page or component may
 * reach an exam-scoped endpoint except through a wrapper that appends the
 * choice.
 */
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const SRC = path.resolve(__dirname, '../..');

/**
 * Endpoints whose response depends on `?exam_id=`. Derived from the
 * backend handlers that actually read it (`req.query.get('exam_id')`) and
 * that a student-facing surface calls. Add to this list when a new
 * exam-scoped endpoint lands, not when a test goes red.
 */
const EXAM_SCOPED = ['/api/topics', '/api/exam/active', '/api/demo/rails'];

/**
 * `useActiveExam` is the one deliberate exception: it uses a raw fetch but
 * wraps the path in `withExamChoice` itself, which its own doc comment
 * explains. The invariant is "the choice is appended", not "apiFetch is
 * used", so a call site that appends it explicitly passes.
 */
function appendsChoice(line: string): boolean {
  return line.includes('withExamChoice') || /[?&]exam_id=/.test(line);
}

function walk(dir: string, out: string[] = []): string[] {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === '__tests__' || e.name === 'node_modules') continue;
      walk(p, out);
    } else if (/\.(ts|tsx)$/.test(e.name) && !/\.test\.tsx?$/.test(e.name)) {
      out.push(p);
    }
  }
  return out;
}

describe('exam-scope invariants', () => {
  it('no source file reaches an exam-scoped endpoint with a bare fetch', () => {
    const violations: string[] = [];
    for (const file of walk(SRC)) {
      const lines = fs.readFileSync(file, 'utf-8').split('\n');
      lines.forEach((line, i) => {
        if (!/\bfetch\s*\(/.test(line)) return;
        // apiFetch/authFetch both route through the central appender.
        if (/\b(apiFetch|authFetch)\s*\(/.test(line)) return;
        if (!EXAM_SCOPED.some(ep => line.includes(ep))) return;
        if (appendsChoice(line)) return;
        violations.push(`${path.relative(SRC, file)}:${i + 1}: ${line.trim()}`);
      });
    }
    expect(violations, `Exam-scoped endpoint fetched without the viewer's exam choice:\n${violations.join('\n')}`).toEqual([]);
  });

  it('SmartPracticePage ships no hardcoded exam topic list', () => {
    const src = fs.readFileSync(path.join(SRC, 'pages/app/SmartPracticePage.tsx'), 'utf-8');
    // The exact fallback constant that produced the reported bug, plus the
    // hardcoded initial topic that named one exam's concept on every exam.
    expect(src).not.toContain('GATE_FALLBACK_TOPICS');
    expect(src).not.toMatch(/\|\|\s*'linear-algebra'/);
  });
});
