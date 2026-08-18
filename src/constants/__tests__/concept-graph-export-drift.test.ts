/**
 * CI drift check (T2 / Milestone A / A4): the committed
 * frontend/public/data/concept-graph.json is a snapshot written by
 * `scripts/export-bundles.ts` (run via `npm run export:bundles`, and as a
 * Docker build step in both Dockerfile and demo/Dockerfile). Nothing keeps
 * that snapshot honest automatically — it can silently drift stale behind
 * data/curriculum/gate-ma.yml (the loader ALL_CONCEPTS reads at import
 * time), exactly as it did before this test existed (82/11 committed vs.
 * 97/26/140 actual).
 *
 * This test fails whenever the export goes stale, so a future YAML edit
 * without a re-export gets caught in CI instead of shipping a frozen
 * client concept graph.
 */
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { ALL_CONCEPTS } from '../concept-graph';

interface ExportedConcept {
  id: string;
  topic: string;
  prerequisites: string[];
}

interface ExportedGraph {
  version: number;
  concepts: ExportedConcept[];
  total: number;
}

const EXPORT_PATH = path.resolve(__dirname, '../../../frontend/public/data/concept-graph.json');

function loadExportedGraph(): ExportedGraph {
  const raw = fs.readFileSync(EXPORT_PATH, 'utf-8');
  return JSON.parse(raw);
}

function countEdges(concepts: Array<{ prerequisites: string[] }>): number {
  return concepts.reduce((sum, c) => sum + (c.prerequisites?.length ?? 0), 0);
}

describe('frontend/public/data/concept-graph.json — export drift', () => {
  it('the export file exists (run `npm run export:bundles` if this fails)', () => {
    expect(fs.existsSync(EXPORT_PATH)).toBe(true);
  });

  it('node count matches the YAML-loaded concept graph', () => {
    const exported = loadExportedGraph();
    expect(exported.concepts.length).toBe(ALL_CONCEPTS.length);
    expect(exported.total).toBe(ALL_CONCEPTS.length);
  });

  it('edge count (summed prerequisites) matches the YAML-loaded concept graph', () => {
    const exported = loadExportedGraph();
    expect(countEdges(exported.concepts)).toBe(countEdges(ALL_CONCEPTS));
  });

  it('linear-algebra concept count matches the YAML-loaded concept graph', () => {
    const exported = loadExportedGraph();
    const exportedLA = exported.concepts.filter(c => c.topic === 'linear-algebra').length;
    const actualLA = ALL_CONCEPTS.filter(c => c.topic === 'linear-algebra').length;
    expect(exportedLA).toBe(actualLA);
  });

  it('every exported concept id is a real concept id (no orphaned entries)', () => {
    const exported = loadExportedGraph();
    const actualIds = new Set(ALL_CONCEPTS.map(c => c.id));
    for (const c of exported.concepts) {
      expect(actualIds.has(c.id)).toBe(true);
    }
  });
});
