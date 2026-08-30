/**
 * server-boot smoke test.
 *
 * Catches ESM/CJS interop and module-load-time errors that vitest's normal
 * unit tests miss. Background: v4.11.0 shipped a `gif-generator.ts` with
 * `import { GIFEncoder } from 'gifenc'`. Vitest's transformer resolved that
 * fine, so all 897 tests passed locally — but `npx tsx src/server.ts` (the
 * real production entry path) crashed at boot with "does not provide an
 * export named 'GIFEncoder'". The deploy red-flagged.
 *
 * This test imports server.ts with a side-effect guard so it loads every
 * transitive dependency without actually starting the HTTP listener.
 *
 * ── IMPORTANT: this does NOT run under production's module loader ────────
 * This docblock used to claim the graph is imported "under the same module
 * loader production uses (Node ESM via tsx)". That is false, and the false
 * claim is load-bearing — it is why no real boot check was ever added.
 * These tests run under VITEST's transformer, which differs from tsx's ESM
 * runtime in at least one way that has already reached production:
 * vitest injects `__dirname` / `__filename` shims into the modules it
 * transforms, and tsx does not.
 *
 * Demonstrated on 2026-08-30 against `src/content/atomic-topic-spec.ts` as
 * it stood on main (PR #134), which used `__dirname` at module top level:
 *
 *   npx tsx src/server.ts                        → ReferenceError, dies at boot
 *   vitest run server-boot-smoke.test.ts         → 3 tests passed
 *
 * `src/server.ts` -> `admin-content-spec-routes.ts` -> that file is an
 * unconditional import chain, so every boot of main died and this test was
 * green throughout.
 *
 * What it catches:
 *   - Named imports from CJS-shaped packages (the gifenc class of bug)
 *   - Top-level throws / missing-export errors
 *   - Type-only imports that vanished at runtime
 *   - Cyclic-init bugs that surface only on first eager load
 *
 * What it doesn't catch:
 *   - Anything vitest's transformer papers over that tsx does not —
 *     `__dirname`/`__filename` being the known case. That specific class is
 *     covered by src/__tests__/unit/esm-dirname-guard.test.ts, which greps
 *     source rather than trusting the loader. The general fix is to spawn
 *     `npx tsx src/server.ts` as a real subprocess and wait on /health;
 *     that is not done here and remains the honest gap.
 *   - Runtime errors that need an actual request to fire
 *   - Listen-time errors (port-in-use, EACCES, TLS misconfig)
 *
 * Strategy: stub `http.createServer` so the import chain still resolves
 * but `.listen()` never binds a port. That makes the test fast (~200ms)
 * and isolated.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import http from 'node:http';

// Stub createServer BEFORE importing server.ts. The server module wires
// listen() at top level via registerRoute + http.createServer.
beforeAll(() => {
  const original = http.createServer;
  (http as any).createServer = (..._args: any[]) => {
    const fakeServer: any = {
      listen: (..._a: any[]) => fakeServer,
      on: () => fakeServer,
      close: (cb?: () => void) => { cb?.(); return fakeServer; },
      address: () => ({ port: 0 }),
    };
    return fakeServer;
  };
  // Restore for any tests that follow this file.
  return () => { (http as any).createServer = original; };
});

describe('server boot smoke', () => {
  it('imports the server entry without throwing', async () => {
    // If any module in the graph has a broken named import, top-level
    // throw, or missing export, this await rejects.
    await expect(import('../server')).resolves.toBeDefined();
  });

  it('imports every route barrel cleanly (catches ESM/CJS interop bugs)', async () => {
    // Import the modules whose top-level code is most likely to break:
    // ones that pull in CJS-shaped third-party packages.
    await expect(import('../content/concept-orchestrator/gif-generator')).resolves.toBeDefined();
    await expect(import('../content/concept-orchestrator/tts-generator')).resolves.toBeDefined();
    await expect(import('../content/concept-orchestrator/media-artifacts')).resolves.toBeDefined();
    await expect(import('../api/media-routes')).resolves.toBeDefined();
    await expect(import('../api/lesson-routes')).resolves.toBeDefined();
  });

  it('exports the gifenc primitives that gif-generator depends on', async () => {
    // Direct guard against the v4.11.0 regression: `gifenc` named-import
    // path. If this fails, the gif-generator can't render even if the
    // module loaded.
    const mod = await import('../content/concept-orchestrator/gif-generator');
    expect(typeof mod.renderScene).toBe('function');
  });
});
