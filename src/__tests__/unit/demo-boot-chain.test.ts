/**
 * The demo container must serve even when seeding fails.
 *
 * demo/Dockerfile's CMD seeds and then starts the server. It used to chain
 * every step with `&&`, which makes the server's start conditional on three
 * best-effort seed scripts exiting zero. On 2026-08-19 that turned a bad
 * DATABASE_URL into a dead site: `demo:seed-history` reached its
 * database-only path for the first time, `autoMigrate` could not connect,
 * the unguarded top-level await rejected, and Render reported "Exited with
 * status 1 while running your code" — with no server ever started.
 *
 * The distinction the CMD has to encode: a demo missing its sample history
 * is degraded and still demoable; a demo that will not boot is nothing. So
 * seeds are advisory (`;` with a `||` notice) and the server is the one
 * thing that must run.
 *
 * These are static assertions on the Dockerfile text. A container-level test
 * would be better and needs Docker, which CI here does not have — so this
 * pins the property that actually broke rather than nothing at all.
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const DOCKERFILE = path.resolve(__dirname, '../../..', 'demo', 'Dockerfile');
const SEED_HISTORY = path.resolve(__dirname, '../../..', 'demo', 'seed-history.ts');

function cmdLine(): string {
  const lines = fs.readFileSync(DOCKERFILE, 'utf8').split('\n');
  const cmd = lines.find((l) => l.startsWith('CMD '));
  expect(cmd, 'demo/Dockerfile must declare a CMD').toBeDefined();
  return cmd!;
}

describe('demo container boot chain', () => {
  it('starts the server', () => {
    expect(cmdLine()).toMatch(/src\/server\.ts/);
  });

  it('never makes the server conditional on a seed step succeeding', () => {
    const cmd = cmdLine();
    // Everything before the server start must be `;`-separated. A single
    // `&&` anywhere ahead of it re-introduces the outage.
    const beforeServer = cmd.slice(0, cmd.indexOf('src/server.ts'));
    expect(
      beforeServer.includes('&&'),
      `demo/Dockerfile CMD chains a seed step to the server with "&&":\n  ${cmd}\n` +
        `That makes booting conditional on seeding. Use ";" with a "|| echo ..." notice ` +
        `so a failed seed degrades the demo instead of killing it.`,
    ).toBe(false);
  });

  it('reports a failed seed rather than swallowing it silently', () => {
    const cmd = cmdLine();
    for (const step of ['demo:seed', 'demo:seed-media', 'demo:seed-history']) {
      expect(
        new RegExp(`${step.replace(':', ':')}\\b[^;]*\\|\\|`).test(cmd),
        `${step} has no "|| echo ..." notice — a silent skip looks identical to a success in the logs`,
      ).toBe(true);
    }
  });

  it('execs the server so it receives the platform signals as PID 1', () => {
    expect(cmdLine()).toMatch(/exec\s+npx\s+tsx\s+src\/server\.ts/);
  });

  it('seed-history guards its migration step instead of exiting non-zero', () => {
    const src = fs.readFileSync(SEED_HISTORY, 'utf8');
    // The autoMigrate call must sit inside a try, and the failure path must
    // leave with status 0 — this script runs ahead of the server.
    const migrateIdx = src.indexOf('autoMigrate(migratePool)');
    expect(migrateIdx, 'seed-history should still apply migrations').toBeGreaterThan(-1);
    const before = src.slice(0, migrateIdx);
    expect(
      before.lastIndexOf('try {') > before.lastIndexOf('} catch'),
      'autoMigrate in demo/seed-history.ts must run inside a try block',
    ).toBe(true);
    expect(src).toMatch(/process\.exit\(0\)/);
  });
});
