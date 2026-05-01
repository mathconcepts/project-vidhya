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

  it('loads all six bundled topic families from project', () => {
    _resetTemplateCacheForTests();
    const tpls = loadTemplates();
    expect(tpls.size).toBeGreaterThanOrEqual(6);
    for (const family of ['calculus', 'linear-algebra', 'probability', 'complex-numbers', 'algorithms', 'discrete-math']) {
      expect(tpls.get(family)?.intuition?.scaffold).toBeTruthy();
    }
  });
});
