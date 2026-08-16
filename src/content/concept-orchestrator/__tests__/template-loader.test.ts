/**
 * template-loader tests — boot-time fail-fast schema validation.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { loadTemplates, getTemplate, _resetTemplateCacheForTests } from '../template-loader';

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'tpl-test-'));
}

describe('template-loader', () => {
  beforeEach(() => _resetTemplateCacheForTests());

  it('loads valid yaml', () => {
    const dir = makeTempDir();
    fs.writeFileSync(path.join(dir, 'calc.yaml'), 'topic_family: calculus\nintuition:\n  scaffold: zoom-to-tangent\n  bloom_floor: 2\n');
    const tpls = loadTemplates(dir);
    expect(tpls.size).toBe(1);
    expect(tpls.get('calculus')?.intuition?.scaffold).toBe('zoom-to-tangent');
  });

  it('throws on missing topic_family', () => {
    const dir = makeTempDir();
    fs.writeFileSync(path.join(dir, 'bad.yaml'), 'intuition:\n  scaffold: x\n');
    _resetTemplateCacheForTests();
    expect(() => loadTemplates(dir)).toThrow(/topic_family/);
  });

  it('throws on atom_type without scaffold', () => {
    const dir = makeTempDir();
    fs.writeFileSync(path.join(dir, 'bad.yaml'), 'topic_family: x\nintuition:\n  bloom_floor: 2\n');
    _resetTemplateCacheForTests();
    expect(() => loadTemplates(dir)).toThrow(/scaffold/);
  });

  it('throws on bloom_floor out of range', () => {
    const dir = makeTempDir();
    fs.writeFileSync(path.join(dir, 'bad.yaml'), 'topic_family: x\nintuition:\n  scaffold: y\n  bloom_floor: 99\n');
    _resetTemplateCacheForTests();
    expect(() => loadTemplates(dir)).toThrow(/bloom_floor/);
  });

  it('throws on duplicate topic_family', () => {
    const dir = makeTempDir();
    fs.writeFileSync(path.join(dir, 'a.yaml'), 'topic_family: calc\nintuition:\n  scaffold: a\n');
    fs.writeFileSync(path.join(dir, 'b.yaml'), 'topic_family: calc\nintuition:\n  scaffold: b\n');
    _resetTemplateCacheForTests();
    expect(() => loadTemplates(dir)).toThrow(/duplicate topic_family/);
  });

  it('returns empty map for missing dir', () => {
    expect(loadTemplates('/nonexistent/path')).toEqual(new Map());
  });

  it('getTemplate returns null for unknown family', () => {
    expect(getTemplate('does-not-exist', 'intuition')).toBeNull();
  });

  it('every bundled topic family loads with a usable intuition scaffold', () => {
    // Deliberately NOT a hardcoded family list. The previous version pinned
    // six names, three of which ('probability', 'complex-numbers',
    // 'discrete-math') declared a topic_family that matched no concept in the
    // graph — so the test passed while 20 concepts silently resolved to no
    // template at all. A list maintained by hand is what let that survive.
    //
    // Asserting over whatever is actually loaded keeps this honest as
    // templates are added, and scripts/check-template-coverage.ts is the
    // check that the set is COMPLETE with respect to the concept graph.
    _resetTemplateCacheForTests();
    const tpls = loadTemplates();
    expect(tpls.size).toBeGreaterThanOrEqual(11);
    for (const [family, tpl] of tpls) {
      expect(tpl?.intuition?.scaffold, `${family} has no intuition scaffold`).toBeTruthy();
    }
  });

  it('the families the concept graph actually needs are present', () => {
    // Two anchors, chosen because they are the largest topics by concept
    // count. A wholesale loss of the template directory fails here loudly
    // rather than passing an empty-set assertion above.
    _resetTemplateCacheForTests();
    const tpls = loadTemplates();
    expect(tpls.get('linear-algebra')?.intuition?.scaffold).toBeTruthy();
    expect(tpls.get('calculus')?.intuition?.scaffold).toBeTruthy();
  });
});
