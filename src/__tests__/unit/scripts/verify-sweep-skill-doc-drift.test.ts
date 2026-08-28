/**
 * B3 — `.claude/skills/verify-sweep/SKILL.md` doc-matches-code drift check,
 * on the `check-ci-aggregate-drift.ts` pattern (two independent statements
 * of the same fact must not silently diverge). Here the two statements are
 * the skill doc's prose and the real job it claims to drive
 * (`src/jobs/wolfram-verify-job.ts`, registered as `wolfram-verify` on
 * `src/jobs/job-runner.ts`).
 *
 * Before B3, the skill doc named three things that do not exist in this
 * codebase — `src/gbrain/operations/verify-sweep.ts`, a
 * `verification_audit_log` table, and a `quarantine_problems` table — and
 * described a `--topic`/`--strict` CLI the real job doesn't have. This test
 * locks two things going forward: those three phantoms never reappear, and
 * the doc keeps naming the real invocation path.
 */

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const SKILL_PATH = path.resolve(process.cwd(), '.claude/skills/verify-sweep/SKILL.md');

function readSkillDoc(): string {
  return fs.readFileSync(SKILL_PATH, 'utf-8');
}

describe('verify-sweep SKILL.md — doc matches the real wolfram-verify job', () => {
  it('never re-names the three phantom artifacts', () => {
    const doc = readSkillDoc();
    const PHANTOMS = [
      'src/gbrain/operations/verify-sweep.ts',
      'verification_audit_log',
      'quarantine_problems',
    ];
    const stillPresent = PHANTOMS.filter((p) => doc.includes(p) && !doc.includes(`\`${p}\` — no such`) && !isOnlyNamedAsPhantom(doc, p));
    expect(
      stillPresent,
      'SKILL.md must not describe these as if they exist — they were removed in B3. ' +
        'If one of these is intentionally re-mentioned as a phantom (e.g. in a "what this ' +
        'is NOT" list), the drift-test allowlist logic below needs updating alongside it.',
    ).toEqual([]);
  });

  /**
   * A phantom name IS allowed to appear once, specifically inside the
   * "What this is NOT" disclaimer — that mention is the fix, not the bug.
   * This helper checks each occurrence sits within two lines of the words
   * "no such", so a future accidental re-introduction as real behavior
   * still fails the test above.
   */
  function isOnlyNamedAsPhantom(doc: string, phantom: string): boolean {
    const lines = doc.split('\n');
    const hits = lines
      .map((line, i) => ({ line, i }))
      .filter(({ line }) => line.includes(phantom));
    if (hits.length === 0) return true;
    return hits.every(({ line }) => /no such/i.test(line));
  }

  it('names the real job file and its registered job name', () => {
    const doc = readSkillDoc();
    expect(doc).toContain('src/jobs/wolfram-verify-job.ts');
    expect(doc).toContain('wolfram-verify');
  });

  it('names the real bundle-file scope, not a generated_problems table', () => {
    const doc = readSkillDoc();
    expect(doc).toContain('frontend/public/data/content-bundle.json');
  });

  it('names the real invocation command', () => {
    const doc = readSkillDoc();
    expect(doc).toContain('npm run content:verify');
  });

  it('names the real env caps with their real default values', () => {
    const doc = readSkillDoc();
    expect(doc).toContain('WOLFRAM_APP_ID');
    expect(doc).toContain('WOLFRAM_RATE_MS=1200');
    expect(doc).toContain('WOLFRAM_MAX_CALLS_PER_RUN=200');
    expect(doc).toContain('WOLFRAM_STEPS_MAX_PER_RUN=50');
  });

  it('the real job source actually registers under the job name the doc claims', () => {
    // Cross-check against the source, not just against the doc's own prose —
    // if `WOLFRAM_VERIFY_JOB`'s value ever changes, this fails alongside the
    // doc rather than only the doc silently going stale.
    const jobSrc = fs.readFileSync(
      path.resolve(process.cwd(), 'src/jobs/wolfram-verify-job.ts'),
      'utf-8',
    );
    const match = jobSrc.match(/export const WOLFRAM_VERIFY_JOB = '([\w-]+)'/);
    expect(match, 'src/jobs/wolfram-verify-job.ts must export WOLFRAM_VERIFY_JOB').not.toBeNull();
    const jobName = match![1];
    expect(readSkillDoc()).toContain(jobName);
  });

  it('the real job source still enumerates the same default caps the doc quotes', () => {
    const runnerSrc = fs.readFileSync(path.resolve(process.cwd(), 'src/jobs/job-runner.ts'), 'utf-8');
    expect(runnerSrc).toContain("envInt('WOLFRAM_RATE_MS', 1200)");
    expect(runnerSrc).toContain("envInt('WOLFRAM_MAX_CALLS_PER_RUN', 200)");
    expect(runnerSrc).toContain("envInt('WOLFRAM_STEPS_MAX_PER_RUN', 50)");
  });
});
