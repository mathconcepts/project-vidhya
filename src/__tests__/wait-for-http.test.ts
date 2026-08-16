/**
 * The deploy-verification wait loop.
 *
 * The bug this exists to prevent shipped in a workflow and stayed invisible
 * for weeks: `curl ... || echo 000` produced `000000` on a failed request
 * (curl writes its own `000` for %{http_code} AND exits non-zero), which
 * matched neither the `5*` nor the `000` case and fell through the catch-all
 * as "the service answered". The wait was a no-op exactly when the service was
 * down — the only situation it exists for — and the check went green every
 * time it ran against an already-healthy service.
 *
 * Nothing could catch that, because the logic only existed inside a workflow
 * step. So it moved into scripts/wait-for-http.sh, and these tests drive it
 * with a stubbed curl through every branch, including the literal `000000`
 * that started this.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, chmodSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const SCRIPT = join(__dirname, '..', '..', 'scripts', 'wait-for-http.sh');

let dir: string;

/** A fake curl that prints `output` and exits with `code`. */
function stubCurl(name: string, output: string, exitCode = 0): string {
  const p = join(dir, name);
  writeFileSync(p, `#!/usr/bin/env bash\nprintf '%s' '${output}'\nexit ${exitCode}\n`);
  chmodSync(p, 0o755);
  return p;
}

interface Run {
  status: number;
  stdout: string;
}

function run(curlPath: string, waitSeconds = 0): Run {
  try {
    const stdout = execFileSync('bash', [SCRIPT, 'https://example.test/', String(waitSeconds)], {
      env: { ...process.env, CURL_BIN: curlPath, POLL_SECONDS: '0', PROBE_TIMEOUT: '1' },
      encoding: 'utf8',
    });
    return { status: 0, stdout };
  } catch (err) {
    const e = err as { status?: number; stdout?: string };
    return { status: e.status ?? -1, stdout: e.stdout ?? '' };
  }
}

beforeAll(() => {
  dir = mkdtempSync(join(tmpdir(), 'wait-for-http-'));
});
afterAll(() => {
  rmSync(dir, { recursive: true, force: true });
});

describe('wait-for-http', () => {
  it('treats the literal 000000 as no answer — the original bug', () => {
    // curl printed 000 and exited non-zero; the old `|| echo 000` appended a
    // second one. If this ever passes again, the wait is a no-op once more.
    const r = run(stubCurl('curl-000000', '000000', 28));
    expect(r.status).toBe(1);
    expect(r.stdout).toContain('waiting... (000000)');
    expect(r.stdout).not.toContain('service answering');
  });

  it('treats a bare 000 as no answer', () => {
    const r = run(stubCurl('curl-000', '000', 28));
    expect(r.status).toBe(1);
    expect(r.stdout).not.toContain('service answering');
  });

  it('treats empty output as no answer rather than as success', () => {
    const r = run(stubCurl('curl-empty', '', 7));
    expect(r.status).toBe(1);
    expect(r.stdout).toContain('no-response');
  });

  it('keeps waiting through a 5xx', () => {
    // Render answers 502/503 while a deploy is spinning up.
    const r = run(stubCurl('curl-503', '503'));
    expect(r.status).toBe(1);
    expect(r.stdout).toContain('waiting... (503)');
  });

  it('accepts a 200', () => {
    const r = run(stubCurl('curl-200', '200'));
    expect(r.status).toBe(0);
    expect(r.stdout).toContain('service answering: 200');
  });

  it('accepts an auth-gated 403 — serving HTTP is the question, not correctness', () => {
    // This API answers 403 at the root by design. A liveness check that
    // demanded 200 would report a healthy service as down.
    const r = run(stubCurl('curl-403', '403'));
    expect(r.status).toBe(0);
    expect(r.stdout).toContain('service answering: 403');
  });

  it('accepts a 301 and a 404', () => {
    expect(run(stubCurl('curl-301', '301')).status).toBe(0);
    expect(run(stubCurl('curl-404', '404')).status).toBe(0);
  });

  it('fails safe on an unrecognised value instead of calling it success', () => {
    // The inverted allowlist is the actual fix: anything not explicitly an
    // answer waits. A future curl printing something unforeseen must not read
    // as healthy.
    const r = run(stubCurl('curl-weird', 'banana'));
    expect(r.status).toBe(1);
    expect(r.stdout).not.toContain('service answering');
  });

  it('reports the last observed value in its error, not a generic message', () => {
    const r = run(stubCurl('curl-502', '502'));
    expect(r.stdout).toContain('last: 502');
  });

  it('refuses to run without a url', () => {
    try {
      execFileSync('bash', [SCRIPT], { encoding: 'utf8', stdio: 'pipe' });
      throw new Error('should have exited non-zero');
    } catch (err) {
      expect((err as { status?: number }).status).toBe(2);
    }
  });
});
