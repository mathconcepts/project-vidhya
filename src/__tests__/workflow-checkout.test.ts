/**
 * A workflow step cannot run a repo file the job never checked out.
 *
 * prod-smoke.yml started life as pure inline `curl` and needed no checkout.
 * When its wait loop moved into `scripts/wait-for-http.sh` and a version gate
 * started reading `package.json`, the checkout step was not added — so the job
 * died with
 *
 *     bash: scripts/wait-for-http.sh: No such file or directory
 *     exit code 127
 *
 * before it ever reached the service. Nothing local caught it: the YAML is
 * valid, the script exists and is tested, and the workflow only runs on
 * GitHub. Every failure in this file so far has been of that shape — a change
 * that can only be validated in production.
 *
 * So the rule is checked here instead: if a job's `run:` steps reference a
 * path that only exists in the repo, an `actions/checkout` step must come
 * first.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import yaml from 'js-yaml';

const ROOT = join(__dirname, '..', '..');
const WORKFLOWS = join(ROOT, '.github', 'workflows');

/**
 * Top-level repo entries, read from disk rather than hard-coded so a new
 * directory is covered the day it appears.
 */
const REPO_ENTRIES = readdirSync(ROOT, { withFileTypes: true })
  .filter((e) => !e.name.startsWith('.'))
  .map((e) => (e.isDirectory() ? `${e.name}/` : e.name))
  .filter((n) => n !== 'node_modules/');

interface Step {
  uses?: string;
  run?: string;
  name?: string;
}

/**
 * Does this shell line reference a repo path?
 *
 * URL lines are skipped first. `$URL/api/demo/rails` contains `demo/`, which
 * is also a repo directory — matching it would flag every HTTP call in the
 * file and train people to ignore this test.
 */
function referencesRepoFile(line: string): string | null {
  if (/https?:\/\/|\$URL|\$\{\{/.test(line)) return null;
  for (const entry of REPO_ENTRIES) {
    // Word-boundary-ish: start of line, whitespace, or an explicit ./ prefix.
    const re = new RegExp(`(^|\\s|\\./)${entry.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`);
    if (re.test(line)) return entry;
  }
  return null;
}

function workflowFiles(): string[] {
  if (!existsSync(WORKFLOWS)) return [];
  return readdirSync(WORKFLOWS).filter((f) => /\.ya?ml$/.test(f));
}

describe('workflow checkout discipline', () => {
  const files = workflowFiles();

  it('finds workflows to check', () => {
    expect(files.length).toBeGreaterThan(0);
  });

  for (const file of files) {
    it(`${file}: every job running repo files checks them out first`, () => {
      const doc = yaml.load(readFileSync(join(WORKFLOWS, file), 'utf8')) as {
        jobs?: Record<string, { steps?: Step[] }>;
      };
      for (const [jobName, job] of Object.entries(doc.jobs ?? {})) {
        let checkedOut = false;
        for (const step of job.steps ?? []) {
          if (typeof step.uses === 'string' && step.uses.startsWith('actions/checkout')) {
            checkedOut = true;
            continue;
          }
          if (typeof step.run !== 'string') continue;
          for (const line of step.run.split('\n')) {
            const hit = referencesRepoFile(line);
            if (!hit) continue;
            expect(
              checkedOut,
              `${file} job "${jobName}" step "${step.name ?? '(unnamed)'}" references ` +
                `\`${hit}\` before any actions/checkout — the runner has no repo, so this ` +
                `fails with "No such file or directory" (exit 127)`,
            ).toBe(true);
          }
        }
      }
    });
  }
});

describe('the guard actually detects the bug', () => {
  // A guard nobody has watched fail is a guard nobody should trust. This is
  // the exact shape that shipped: a run step invoking a repo script with no
  // checkout above it.
  it('flags a repo-file reference with no checkout', () => {
    const line = 'bash scripts/wait-for-http.sh "$1"';
    expect(referencesRepoFile(line)).toBe('scripts/');
  });

  it('flags a package.json read', () => {
    expect(referencesRepoFile(`WANT=$(node -p "require('./package.json').version")`)).toBe(
      'package.json',
    );
  });

  it('does not flag a URL path that collides with a repo directory name', () => {
    // `demo/` is a real directory here. Flagging this would make the test
    // noise, and noisy guards get disabled.
    expect(referencesRepoFile('curl -s "$URL/api/demo/rails"')).toBeNull();
    expect(referencesRepoFile('curl -s "https://example.test/src/thing"')).toBeNull();
  });

  it('does not flag a /tmp path', () => {
    expect(referencesRepoFile('cat /tmp/rails.json | head -c 400')).toBeNull();
  });
});
