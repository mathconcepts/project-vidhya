/**
 * maybeGenerateMedia QA-hard-fail wiring (§4.15 W3.6/E9). Confirms the
 * orchestrator's media hook actually consumes renderScene()'s `qa` field:
 * a hard QA failure (label overlap on the final frame) routes through
 * markFailed instead of writeArtifact, exactly like a render exception —
 * so the existing applyMediaUrls skip machinery keeps an illegible GIF off
 * the page rather than shipping it.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import { maybeGenerateMedia } from '../orchestrator';
import { getActiveArtifact, pathForArtifact } from '../media-artifacts';
import type { GeneratedAtom } from '../types';

// media-artifacts.ts resolves MEDIA_STORAGE_DIR into a module-level const
// AT IMPORT TIME (env var read once, not per-call), so tests cannot steer
// it via process.env — pathForArtifact() always reports wherever that
// import-time value actually points, and every test cleans up exactly that
// path afterward regardless of what it is (usually the repo's real,
// gitignored .data/media/ since nothing overrides it before first import).
function buildAtom(gifSceneJson: string, atomId: string): GeneratedAtom {
  return {
    atom_id: atomId,
    concept_id: 'fixture-concept',
    atom_type: 'visual_analogy',
    bloom_level: 'understand',
    difficulty: 0.5,
    exam_ids: [],
    content: `Some prose.\n\n\`\`\`gif-scene\n${gifSceneJson}\n\`\`\`\n`,
    meta: {
      source_cascade: [],
      wolfram_grounded: false,
      pyq_grounded: [],
      generated_at: new Date().toISOString(),
      cost_usd: 0,
    },
  };
}

const CLEAN_SCENE = JSON.stringify({
  type: 'function-trace',
  expression: 'sin(x)',
  x_range: [-6, 6],
  y_range: [-1.5, 1.5],
  frames: 4,
});

// Same fixture shape used in gif-generator-qa.test.ts and
// check-gif-scenes-qa.test.ts to force a final-frame label overlap.
const OVERLAPPING_SCENE = JSON.stringify({
  type: 'discrete-bars',
  values: Array.from({ length: 20 }, (_, i) => i + 1),
  labels: Array.from({ length: 20 }, (_, i) => `Day ${i + 1}`),
  frames: 4,
  width: 200,
  height: 100,
});

describe('maybeGenerateMedia — QA hard-fail wiring', () => {
  const prevDb = process.env.DATABASE_URL;
  const writtenPaths: string[] = [];

  beforeEach(() => {
    delete process.env.DATABASE_URL; // DB-less path — markFailed is a no-op, so absence of a file IS the signal
  });

  afterEach(() => {
    while (writtenPaths.length) {
      const p = writtenPaths.pop()!;
      try { fs.rmSync(p, { force: true }); } catch { /* best effort */ }
    }
    if (prevDb) process.env.DATABASE_URL = prevDb; else delete process.env.DATABASE_URL;
  });

  it('writes a GIF sidecar file for a scene that passes media QA', async () => {
    const atom = buildAtom(CLEAN_SCENE, 'fixture-concept.qa-clean');
    const expected = pathForArtifact(atom.atom_id, 1, 'gif');
    writtenPaths.push(expected);
    await maybeGenerateMedia(atom, 1);
    expect(fs.existsSync(expected)).toBe(true);
  });

  it('does NOT write a GIF sidecar file for a scene that hard-fails media QA', async () => {
    const atom = buildAtom(OVERLAPPING_SCENE, 'fixture-concept.qa-overlap');
    const expected = pathForArtifact(atom.atom_id, 1, 'gif');
    writtenPaths.push(expected);
    await maybeGenerateMedia(atom, 1);
    expect(fs.existsSync(expected)).toBe(false);
  });

  it('getActiveArtifact still returns null without a DB either way (DB-less honesty preserved)', async () => {
    const atom = buildAtom(OVERLAPPING_SCENE, 'fixture-concept.qa-overlap-dbless');
    writtenPaths.push(pathForArtifact(atom.atom_id, 1, 'gif'));
    await maybeGenerateMedia(atom, 1);
    expect(await getActiveArtifact(atom.atom_id, 'gif')).toBeNull();
  });
});
