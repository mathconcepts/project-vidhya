/**
 * Codegen drift: frontend/src/generated/concept-anchors.gen.ts must match
 * what the builder produces from data/registry/concept-anchors/*.yml right
 * now.
 *
 * Without this, editing an anchor's YAML and forgetting to regenerate ships
 * the OLD sentence to students while the registry, the CI gate and every
 * reviewer read the new one — the checked-in file would look authoritative
 * and be stale. Same guarantee intent-slices.gen.ts has.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import path from 'path';
import { buildConceptAnchorsModule } from '../../../frontend/scripts/generate-concept-anchors';

const GEN_PATH = path.resolve(process.cwd(), 'frontend/src/generated/concept-anchors.gen.ts');

describe('concept-anchors.gen.ts', () => {
  it('is checked in', () => {
    expect(existsSync(GEN_PATH)).toBe(true);
  });

  it('is byte-identical to a fresh build — regenerate with `npm run gen:concept-anchors`', () => {
    expect(readFileSync(GEN_PATH, 'utf8')).toBe(buildConceptAnchorsModule());
  });

  it('is import-free, so it never drags a backend module into the client bundle', () => {
    expect(readFileSync(GEN_PATH, 'utf8')).not.toMatch(/^\s*import\s/m);
  });

  it('omits honest nulls rather than emitting an empty string for them', () => {
    expect(buildConceptAnchorsModule()).not.toMatch(/:\s*""/);
  });
});
