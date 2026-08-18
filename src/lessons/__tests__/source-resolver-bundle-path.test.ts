/**
 * Regression test for T1 (Milestone A / A3): loadBundle() in source-resolver.ts
 * must resolve the content bundle from a dist-style path
 * (frontend/dist/data/content-bundle.json), matching the candidate-list
 * pattern already used by src/content/resolver.ts. Neither Dockerfile ships
 * frontend/public/ in the deployed image — only frontend/dist/ (which gets
 * public/ copied into it at Vite build time) — so a resolver that only ever
 * checks frontend/public/... silently loses the bundle in production.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';

describe('source-resolver loadBundle() candidate paths', () => {
  let tmpDir: string;
  let cwdSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vidhya-bundle-test-'));
  });

  afterEach(() => {
    cwdSpy?.mockRestore();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('resolves the bundle from frontend/dist/data (the deployed-image shape)', async () => {
    const distDataDir = path.join(tmpDir, 'frontend', 'dist', 'data');
    fs.mkdirSync(distDataDir, { recursive: true });
    fs.writeFileSync(
      path.join(distDataDir, 'content-bundle.json'),
      JSON.stringify({
        problems: [],
        explainers: {
          'eigenvalues': {
            concept_id: 'eigenvalues',
            topic: 'linear-algebra',
            label: 'Eigenvalues',
            canonical_definition: 'A scalar λ such that Av = λv for some nonzero v.',
          },
        },
      }),
    );

    // No frontend/public anywhere — proves the dist candidate alone is enough.
    cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(tmpDir);
    vi.resetModules();
    const { resolveSources } = await import('../source-resolver');

    const bundle = await resolveSources({ concept_id: 'eigenvalues' });
    expect(bundle.bundle.explainer).not.toBeNull();
    expect(bundle.bundle.explainer?.canonical_definition).toContain('Av = λv');
  });

  it('falls back to frontend/public/data when dist is absent (dev shape)', async () => {
    const publicDataDir = path.join(tmpDir, 'frontend', 'public', 'data');
    fs.mkdirSync(publicDataDir, { recursive: true });
    fs.writeFileSync(
      path.join(publicDataDir, 'content-bundle.json'),
      JSON.stringify({
        problems: [],
        explainers: {
          'eigenvalues': {
            concept_id: 'eigenvalues',
            topic: 'linear-algebra',
            label: 'Eigenvalues',
            canonical_definition: 'dev-path definition',
          },
        },
      }),
    );

    cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(tmpDir);
    vi.resetModules();
    const { resolveSources } = await import('../source-resolver');

    const bundle = await resolveSources({ concept_id: 'eigenvalues' });
    expect(bundle.bundle.explainer?.canonical_definition).toBe('dev-path definition');
  });

  it('degrades to an empty bundle (never throws) when no candidate path exists', async () => {
    cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(tmpDir);
    vi.resetModules();
    const { resolveSources } = await import('../source-resolver');

    const bundle = await resolveSources({ concept_id: 'eigenvalues' });
    expect(bundle.bundle.explainer).toBeNull();
    expect(bundle.bundle.problems).toEqual([]);
  });
});
