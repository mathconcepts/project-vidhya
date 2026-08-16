/**
 * The template-coverage gate, tested in both directions.
 *
 * A gate is only worth having if you have watched it say no. This one exists
 * because `getTemplate()` returns null on a miss and generation carries on
 * un-guided — 52 of 97 concepts were in that state and nothing said a word.
 * So the tests that matter here are the ones where the gate MUST fail.
 */
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  reconcile,
  declaredTopicFamilies,
  conceptTopicsWithAtoms,
} from '../../scripts/check-template-coverage';

const REAL_TEMPLATES = path.join(
  process.cwd(),
  'modules/project-vidhya-content/templates',
);
const REAL_CONCEPTS = path.join(
  process.cwd(),
  'modules/project-vidhya-content/concepts',
);

describe('declaredTopicFamilies', () => {
  it('reads the topic_family FIELD, not the filename', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tpl-'));
    // Filename and declared family deliberately disagree — the field wins,
    // which is the bug that hid three near-miss templates.
    fs.writeFileSync(path.join(dir, 'anything.yaml'), 'topic_family: real-topic\n');
    const d = declaredTopicFamilies(dir);
    expect(d.has('real-topic')).toBe(true);
    expect(d.has('anything')).toBe(false);
  });

  it('survives a template that is malformed below the topic_family line', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tpl-'));
    fs.writeFileSync(
      path.join(dir, 'broken.yaml'),
      'topic_family: still-readable\nintuition:\n  guidance: "unterminated\n   : : :\n',
    );
    expect(declaredTopicFamilies(dir).has('still-readable')).toBe(true);
  });

  it('returns empty rather than throwing when the directory is absent', () => {
    expect(declaredTopicFamilies('/no/such/dir').size).toBe(0);
  });
});

describe('reconcile', () => {
  const concepts = new Map([
    ['eigenvalues', 'linear-algebra'],
    ['determinants', 'linear-algebra'],
    ['root-finding', 'numerical-methods'],
  ]);

  it('passes when every topic has a template', () => {
    const declared = new Map([
      ['linear-algebra', 'linear-algebra.yaml'],
      ['numerical-methods', 'numerical-methods.yaml'],
    ]);
    const r = reconcile(concepts, declared);
    expect(r.missing).toEqual([]);
    expect(r.coveredConcepts).toBe(3);
  });

  it('FAILS when a topic has no template, and counts the affected concepts', () => {
    const declared = new Map([['linear-algebra', 'linear-algebra.yaml']]);
    const r = reconcile(concepts, declared);
    expect(r.missing).toHaveLength(1);
    expect(r.missing[0].topic).toBe('numerical-methods');
    expect(r.missing[0].concepts).toBe(1);
    expect(r.coveredConcepts).toBe(2);
  });

  it('FAILS on a near-miss name rather than fuzzy-matching it', () => {
    // `probability` vs `probability-statistics` is exactly the drift that hid
    // 8 concepts. A helpful fuzzy match here would re-hide them.
    const r = reconcile(
      new Map([['probability-basics', 'probability-statistics']]),
      new Map([['probability', 'probability.yaml']]),
    );
    expect(r.missing).toHaveLength(1);
    expect(r.coveredConcepts).toBe(0);
  });

  it('reports a template nobody uses as an orphan, not a failure', () => {
    const r = reconcile(
      new Map([['eigenvalues', 'linear-algebra']]),
      new Map([
        ['linear-algebra', 'linear-algebra.yaml'],
        ['algorithms', 'algorithms.yaml'],
      ]),
    );
    expect(r.missing).toEqual([]);
    expect(r.orphanTemplates).toEqual(['algorithms']);
  });

  it('ranks missing topics by how many concepts they strand', () => {
    const r = reconcile(
      new Map([
        ['a', 'big-topic'],
        ['b', 'big-topic'],
        ['c', 'big-topic'],
        ['d', 'small-topic'],
      ]),
      new Map(),
    );
    expect(r.missing.map((m) => m.topic)).toEqual(['big-topic', 'small-topic']);
  });
});

describe('the real corpus', () => {
  it('every concept with authored atoms resolves to a template', () => {
    const r = reconcile(
      conceptTopicsWithAtoms(REAL_CONCEPTS),
      declaredTopicFamilies(REAL_TEMPLATES),
    );
    // The failure message is the useful part when this breaks.
    expect(
      r.missing.map((m) => `${m.topic} (${m.concepts} concepts)`),
      'topics with no authoring template',
    ).toEqual([]);
    expect(r.coveredConcepts).toBe(r.totalConcepts);
  });

  it('every concept directory is present in the concept graph', () => {
    const topics = [...conceptTopicsWithAtoms(REAL_CONCEPTS).values()];
    expect(topics.filter((t) => t === '__not-in-concept-graph__')).toEqual([]);
  });
});
