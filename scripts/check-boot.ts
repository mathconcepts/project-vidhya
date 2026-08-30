#!/usr/bin/env npx tsx
/**
 * scripts/check-boot.ts — boot the server for real and wait for /health.
 *
 * ## Why this exists
 *
 * `src/__tests__/server-boot-smoke.test.ts` already imports the server's
 * module graph, and it is genuinely useful — but it runs under VITEST's
 * transformer, which is not the loader production uses. The two differ in at
 * least one way that has already taken production down: vitest injects
 * `__dirname` / `__filename` shims into the modules it transforms, and tsx
 * does not.
 *
 * `src/content/atomic-topic-spec.ts` shipped to main (PR #134) using
 * `__dirname` at module top level, on an unconditional import chain from
 * `src/server.ts`. Measured against that exact file:
 *
 *   npx tsx src/server.ts                     → ReferenceError, process dies
 *   vitest run server-boot-smoke.test.ts      → 3 tests passed
 *   npm run ci  (all 17 gates)                → green
 *   npm test    (4263 tests)                  → green
 *
 * Every signal the repo had was green while every boot of main died, and
 * Render's deploy for that commit failed with `update_failed` — so production
 * silently kept serving the previous image for a day.
 *
 * `src/__tests__/unit/esm-dirname-guard.test.ts` greps source for that one
 * identifier, which is cheap and deterministic but only covers the class we
 * already got burned by. This is the general form: run the actual production
 * command, in a subprocess, and require the process to reach a serving state.
 * Anything that throws at module-evaluation time — a bad named import from a
 * CJS package (the v4.11.0 `gifenc` incident), a missing export, a top-level
 * throw, a cyclic-init bug — fails here regardless of whether a bundler would
 * have papered over it.
 *
 * ## What it deliberately does NOT do
 *
 * No DATABASE_URL is set. The DB-less path is the one the demo deploy runs,
 * and requiring a database would make this a integration test rather than a
 * boot check. Nothing here asserts behaviour beyond "the process came up and
 * answered its own health check" — route behaviour is what the 4000+ unit
 * tests are for.
 */

import { spawn, type ChildProcess } from 'child_process';
import net from 'net';

/** Generous: a cold `npx tsx` parse of the whole graph is not fast. */
const BOOT_TIMEOUT_MS = 120_000;
const POLL_INTERVAL_MS = 500;

/** Ask the OS for a free port, then release it. */
function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.once('error', reject);
    srv.listen(0, '127.0.0.1', () => {
      const addr = srv.address();
      if (addr === null || typeof addr === 'string') {
        srv.close(() => reject(new Error('could not determine a free port')));
        return;
      }
      const { port } = addr;
      srv.close(() => resolve(port));
    });
  });
}

async function probe(port: number): Promise<boolean> {
  try {
    const res = await fetch(`http://127.0.0.1:${port}/health`);
    return res.ok;
  } catch {
    return false;
  }
}

/** SIGTERM the whole process group, then SIGKILL anything that ignored it.
 *  `npx` execs a child of its own, so killing only the direct pid can orphan
 *  the actual server and leave the port held. */
function killTree(child: ChildProcess): void {
  if (child.pid === undefined || child.exitCode !== null) return;
  try { process.kill(-child.pid, 'SIGTERM'); } catch { /* already gone */ }
  setTimeout(() => {
    if (child.pid !== undefined && child.exitCode === null) {
      try { process.kill(-child.pid, 'SIGKILL'); } catch { /* already gone */ }
    }
  }, 3_000).unref();
}

async function main(): Promise<void> {
  const port = await freePort();
  const env = { ...process.env, PORT: String(port), JWT_SECRET: 'ci-boot-check-secret' };
  delete env.DATABASE_URL;

  console.log(`[check-boot] spawning \`npx tsx src/server.ts\` on port ${port}`);
  const child = spawn('npx', ['tsx', 'src/server.ts'], {
    env,
    // Own process group so killTree can take the whole thing down.
    detached: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let output = '';
  child.stdout?.on('data', (d) => { output += d.toString(); });
  child.stderr?.on('data', (d) => { output += d.toString(); });

  // A crash is the signal this check exists for, so treat it as terminal
  // rather than waiting out the full timeout and reporting something vaguer.
  let exited: { code: number | null; signal: string | null } | null = null;
  child.on('exit', (code, signal) => { exited = { code, signal }; });

  const deadline = Date.now() + BOOT_TIMEOUT_MS;
  while (Date.now() < deadline) {
    if (exited !== null) {
      const { code, signal } = exited as { code: number | null; signal: string | null };
      console.error(
        `\n[check-boot] FAILED — the server process exited before answering /health ` +
          `(code ${code}, signal ${signal}).\n` +
          `This is a boot-time crash under the production loader. Output:\n\n${output}`,
      );
      process.exit(1);
    }
    if (await probe(port)) {
      console.log(`[check-boot] /health answered — the server booted under \`npx tsx\`.`);
      killTree(child);
      // The child holds the event loop open via its pipes; nothing is left to
      // wait for once it is signalled.
      process.exit(0);
    }
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }

  console.error(
    `\n[check-boot] FAILED — /health did not answer within ${BOOT_TIMEOUT_MS / 1000}s ` +
      `and the process is still running. Output so far:\n\n${output}`,
  );
  killTree(child);
  process.exit(1);
}

main().catch((err) => {
  console.error(`[check-boot] FAILED — ${(err as Error).message}`);
  process.exit(1);
});
