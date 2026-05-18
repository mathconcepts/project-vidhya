/**
 * Unit tests for the syllabus-bridge framework.
 *
 * Covers:
 *   - Registry loading + lookups
 *   - Content plan generation per gap class
 *   - Cost estimation
 *   - Batch runner with mock LLM (deterministic — no network)
 *   - Storage round-trips
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { existsSync, rmSync } from 'fs';
import {
  listCurricula, getCurriculum, listMappings, getMapping,
  getMappingByPair, getConcept,
} from '../../../syllabus-bridge/registry';
import {
  buildContentPlan, estimateCostUsd,
} from '../../../syllabus-bridge/content-plan';
import { runBatch } from '../../../syllabus-bridge/batch-runner';
import {
  saveBatch, getBatch, listBatches,
  saveGeneratedContent, getGeneratedContent,
  listGeneratedContentForMapping,
} from '../../../syllabus-bridge/store';
import type { BatchRequest, GeneratedContent } from '../../../syllabus-bridge/types';

const CONTENT_STORE = '.data/syllabus-bridge-content.json';
const BATCH_STORE   = '.data/syllabus-bridge-batches.json';

function clearStores() {
  if (existsSync(CONTENT_STORE)) rmSync(CONTENT_STORE);
  if (existsSync(BATCH_STORE))   rmSync(BATCH_STORE);
}

describe('syllabus-bridge/registry', () => {
  it('exposes at least one curriculum (TN-12-MATH)', () => {
    const all = listCurricula();
    expect(all.length).toBeGreaterThanOrEqual(1);
    const tn = getCurriculum('TN-12-MATH');
    expect(tn).not.toBeNull();
    expect(tn?.topics.length).toBeGreaterThanOrEqual(10);
  });

  it('every concept id is unique across the registry', () => {
    const seen = new Set<string>();
    for (const c of listCurricula()) {
      for (const t of c.topics) {
        for (const concept of t.concepts) {
          expect(seen.has(concept.id)).toBe(false);
          seen.add(concept.id);
        }
      }
    }
  });

  it('exposes at least one bridge mapping (TN-12-MATH -> JEE Main)', () => {
    const m = getMapping('TN-12-MATH--EXM-JEEMAIN-MATH-SAMPLE');
    expect(m).not.toBeNull();
    expect(m?.entries.length).toBeGreaterThanOrEqual(15);
  });

  it('getMappingByPair finds the mapping from (source, target)', () => {
    const m = getMappingByPair('TN-12-MATH', 'EXM-JEEMAIN-MATH-SAMPLE');
    expect(m).not.toBeNull();
    expect(m?.id).toBe('TN-12-MATH--EXM-JEEMAIN-MATH-SAMPLE');
  });

  it('every mapping entry references real source concept ids', () => {
    for (const m of listMappings()) {
      for (const e of m.entries) {
        for (const cid of e.source_concept_ids) {
          const found = getConcept(cid);
          expect(found, `mapping ${m.id} entry ${e.id} references unknown concept ${cid}`).not.toBeNull();
        }
      }
    }
  });
});

describe('syllabus-bridge/content-plan', () => {
  const mapping = getMapping('TN-12-MATH--EXM-JEEMAIN-MATH-SAMPLE')!;

  it('produces 2 units for aligned, 4 for depth-gap, 3 for breadth-gap, 5 for foundation', () => {
    const plan = buildContentPlan(mapping);
    const byEntry: Record<string, number> = {};
    for (const u of plan.units) byEntry[u.mapping_entry_id] = (byEntry[u.mapping_entry_id] ?? 0) + 1;
    for (const e of mapping.entries) {
      // Foundation entries with no target topic and difficulty 1 are skipped (note-only).
      const isNoOpFoundation = e.target_topic_ids.length === 0 && e.difficulty_jump === 1;
      if (isNoOpFoundation) {
        expect(byEntry[e.id]).toBeUndefined();
        continue;
      }
      const expected = { 'aligned': 2, 'depth-gap': 4, 'breadth-gap': 3, 'foundation': 5 }[e.gap_class];
      expect(byEntry[e.id], `entry ${e.id} (${e.gap_class})`).toBe(expected);
    }
  });

  it('cost estimate is positive but cheap (mock = $0, real Gemini < $1)', () => {
    const plan = buildContentPlan(mapping);
    const cost = estimateCostUsd(plan);
    expect(cost).toBeGreaterThan(0);
    expect(cost).toBeLessThan(1);
  });

  it('plan never produces an empty unit list for a non-trivial mapping', () => {
    const plan = buildContentPlan(mapping);
    expect(plan.units.length).toBeGreaterThan(0);
  });
});

describe('syllabus-bridge/store', () => {
  beforeEach(clearStores);

  it('saves and retrieves a batch', () => {
    const batch: BatchRequest = {
      batch_id: 'BATCH-test-1',
      mapping_id: 'TN-12-MATH--EXM-JEEMAIN-MATH-SAMPLE',
      unit_ids: ['u1'],
      submitted_by: 'tester',
      submitted_at: new Date().toISOString(),
      status: 'queued',
      results: [{ unit_id: 'u1', status: 'pending' }],
      total_units: 1, completed_units: 0, failed_units: 0,
      total_cost_estimate_usd: 0,
    };
    saveBatch(batch);
    const reloaded = getBatch('BATCH-test-1');
    expect(reloaded?.batch_id).toBe('BATCH-test-1');
    expect(listBatches().length).toBe(1);
  });

  it('saves and retrieves generated content', () => {
    const c: GeneratedContent = {
      content_id: 'CNT-test-1',
      unit_id: 'u-test-1',
      unit_type: 'worked-example',
      mapping_id: 'TN-12-MATH--EXM-JEEMAIN-MATH-SAMPLE',
      mapping_entry_id: 'matrices.inverse',
      title: 'Test',
      body_markdown: '## Test body',
      source: 'mock',
      generated_at: new Date().toISOString(),
    };
    saveGeneratedContent(c);
    const r = getGeneratedContent('CNT-test-1');
    expect(r?.title).toBe('Test');
    const list = listGeneratedContentForMapping('TN-12-MATH--EXM-JEEMAIN-MATH-SAMPLE');
    expect(list.length).toBe(1);
  });

  it('upsert: saving with same content_id replaces (no duplicates)', () => {
    const base: GeneratedContent = {
      content_id: 'CNT-dup',
      unit_id: 'u-dup',
      unit_type: 'worked-example',
      mapping_id: 'TN-12-MATH--EXM-JEEMAIN-MATH-SAMPLE',
      mapping_entry_id: 'matrices.inverse',
      title: 'First',
      body_markdown: 'first',
      source: 'mock',
      generated_at: new Date().toISOString(),
    };
    saveGeneratedContent(base);
    saveGeneratedContent({ ...base, title: 'Second', body_markdown: 'second' });
    const all = listGeneratedContentForMapping('TN-12-MATH--EXM-JEEMAIN-MATH-SAMPLE');
    expect(all.length).toBe(1);
    expect(all[0].title).toBe('Second');
  });
});

describe('syllabus-bridge/batch-runner (mock LLM)', () => {
  beforeEach(clearStores);

  it('runs a small batch and saves generated content', async () => {
    const mapping = getMapping('TN-12-MATH--EXM-JEEMAIN-MATH-SAMPLE')!;
    const plan = buildContentPlan(mapping);
    const firstUnit = plan.units[0];

    const batch: BatchRequest = {
      batch_id: 'BATCH-runner-1',
      mapping_id: mapping.id,
      unit_ids: [firstUnit.unit_id],
      submitted_by: 'tester',
      submitted_at: new Date().toISOString(),
      status: 'queued',
      results: [{ unit_id: firstUnit.unit_id, status: 'pending' }],
      total_units: 1, completed_units: 0, failed_units: 0,
      total_cost_estimate_usd: 0,
    };

    // Ensure no real LLM key — force mock path
    delete process.env.GEMINI_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.OPENAI_API_KEY;

    await runBatch(batch, plan.units);

    expect(batch.status).toBe('completed');
    expect(batch.completed_units).toBe(1);
    expect(batch.failed_units).toBe(0);

    const items = listGeneratedContentForMapping(mapping.id);
    expect(items.length).toBe(1);
    expect(items[0].source).toBe('mock');
    expect(items[0].body_markdown.length).toBeGreaterThan(50);
  });

  it('marks a batch failed when mapping_id is unknown', async () => {
    const batch: BatchRequest = {
      batch_id: 'BATCH-runner-bad',
      mapping_id: 'UNKNOWN-MAPPING',
      unit_ids: ['u1'],
      submitted_by: 'tester',
      submitted_at: new Date().toISOString(),
      status: 'queued',
      results: [{ unit_id: 'u1', status: 'pending' }],
      total_units: 1, completed_units: 0, failed_units: 0,
      total_cost_estimate_usd: 0,
    };
    await runBatch(batch, []);
    expect(batch.status).toBe('failed');
    expect(batch.error).toContain('Unknown mapping_id');
  });
});
