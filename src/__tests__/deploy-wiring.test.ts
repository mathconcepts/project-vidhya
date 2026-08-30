/**
 * Deploy-wiring invariants: what the code reads at runtime must exist in the
 * image, and the flags a feature needs must be set on the service that runs it.
 *
 * Two independent gaps shipped together and produced one symptom. A visitor to
 * the demo deploy got an empty walkthrough because:
 *
 *   1. `render.yaml` set VIDHYA_DEMO_MODE (the older, narrower flag) but never
 *      DEMO_MODE_ENABLED, which is what gates the deck.
 *   2. `demo/Dockerfile` never copied `config/`, so `config/demo-rails.json` —
 *      the entire deck — was not in the image.
 *
 * Fixing either one alone still leaves an empty deck. That is what makes this
 * worth a test rather than a careful re-read: every unit test passed, the CI
 * gates passed, the rails validated locally, and the feature was still absent
 * in production because of the packaging, not the code.
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(__dirname, '..', '..');
const dockerfile = fs.readFileSync(path.join(ROOT, 'demo', 'Dockerfile'), 'utf8');
const rootDockerfile = fs.readFileSync(path.join(ROOT, 'Dockerfile'), 'utf8');
const renderYaml = fs.readFileSync(path.join(ROOT, 'render.yaml'), 'utf8');

describe('demo image contents', () => {
  it('copies config/, which holds the demo rails deck', () => {
    expect(dockerfile).toMatch(/^COPY config\/ config\//m);
  });

  it('still copies every other directory read at runtime', () => {
    // data/ = personas + practice items + curriculum YAML,
    // modules/ = lesson atoms, supabase/ = migrations.
    for (const dir of ['data/', 'modules/', 'supabase/', 'src/', 'demo/']) {
      expect(dockerfile).toMatch(new RegExp(`^COPY ${dir.replace('/', '\\/')}`, 'm'));
    }
  });

  it('copies docs/content-spec, which the content-spec admin API reads', () => {
    // The same packaging failure as config/ above, one directory over, and
    // quieter: loadAtomicTopicSpecs() catches its own readFileSync errors and
    // treats a missing spec file as "no spec available". That is correct for a
    // DB-less local run and wrong for a shipped image — the effect was
    // GET /api/admin/content-spec/atomic-topics answering 200 with an empty
    // catalogue, in every deployed image, from the day the feature shipped.
    // Nothing logged, nothing 500'd, so nothing surfaced it.
    expect(dockerfile).toMatch(/^COPY docs\/content-spec\/ docs\/content-spec\//m);
    // The root Dockerfile's runtime stage copies from the builder stage.
    expect(rootDockerfile).toMatch(/^COPY --from=builder \/app\/docs\/content-spec/m);
  });

  it('ships the two CSVs the spec loader resolves by name', () => {
    // atomic-topic-spec.ts joins these filenames onto SPEC_DIR, so a rename
    // is the same outage as a missing directory.
    for (const f of ['atomic-content-structure-map.csv', 'atomic-content-generation-specs.csv']) {
      expect(fs.existsSync(path.join(ROOT, 'docs', 'content-spec', f))).toBe(true);
    }
  });

  it('ships the file the rails endpoint actually reads', () => {
    // The path is built as process.cwd()/config/demo-rails.json, so the name
    // matters as much as the directory.
    expect(fs.existsSync(path.join(ROOT, 'config', 'demo-rails.json'))).toBe(true);
  });
});

describe('demo service flags', () => {
  it('sets DEMO_MODE_ENABLED on the service that serves the demo', () => {
    expect(renderYaml).toMatch(/key:\s*DEMO_MODE_ENABLED/);
  });

  it('keeps VIDHYA_DEMO_MODE as a separate flag', () => {
    // These mean different things on purpose: VIDHYA_DEMO_MODE shows sign-in
    // quick-access buttons and defaults on whenever OAuth is unconfigured,
    // which is why the deck must not inherit it. Collapsing them would expose
    // the visitor-facing deck on every OAuth-less deployment.
    expect(renderYaml).toMatch(/key:\s*VIDHYA_DEMO_MODE/);
  });

  it('does not let the deck gate inherit the older flag', () => {
    const gate = fs.readFileSync(path.join(ROOT, 'src', 'api', 'demo-routes.ts'), 'utf8');
    const fn = gate.slice(gate.indexOf('export function isDemoModeEnabled'));
    const body = fn.slice(0, fn.indexOf('}') + 1);
    expect(body).toContain('DEMO_MODE_ENABLED');
    expect(body).not.toContain('VIDHYA_DEMO_MODE');
  });
});
