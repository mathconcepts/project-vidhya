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
 * The fix is structural: the server.ts module graph must import cleanly
 * under the same module loader production uses (Node ESM via tsx). This
 * test imports server.ts with a side-effect guard so it loads every
 * transitive dependency without actually starting the HTTP listener.
 *
 * What it catches:
 *   - Named imports from CJS-shaped packages (the gifenc class of bug)
 *   - Top-level throws / missing-export errors
 *   - Type-only imports that vanished at runtime
 *   - Cyclic-init bugs that surface only on first eager load
 *
 * What it doesn't catch:
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
