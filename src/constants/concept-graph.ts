// @ts-nocheck
/**
 * Concept Dependency Graph — GATE Engineering Mathematics
 *
 * Thin loader (CEO plan Phase 0, §6 registry unification / Loop A). The 82
 * concepts + prerequisite edges are no longer hardcoded here — they live in
 * `data/curriculum/gate-ma.yml`'s `concepts:` section, which is now the
 * single source of truth for the GATE-MA concept graph. This file reads
 * that YAML once at module load and reconstructs the exact same exported
 * shape (`ConceptNode`, `ALL_CONCEPTS`, `CONCEPT_MAP`, and every helper
 * function below) so the dozens of existing consumers across the codebase
 * (curriculum-repo.ts, the Elo/FSRS/readiness engine, batch generation,
 * the content CI gate, etc.) need zero changes.
 *
 * Edit concepts by editing `data/curriculum/gate-ma.yml`'s `concepts:`
 * block, not this file. See that file's header comment for the split
 * between `concepts:` (what nodes exist), `syllabus:` (partial curation
 * for weight/depth metadata), and `concept_links:` (per-exam emphasis).
 *
 * Powers:
 *   - Prerequisite Auto-Repair (Pillar 3)
 *   - Adaptive Problem Generation (Pillar 4)
 *   - Mastery Vector granularity (Pillar 1)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parse as parseYaml } from 'yaml';
import { assertNoPrerequisiteCycles } from '../curriculum/prereq-cycles';

export interface ConceptNode {
  id: string;
  topic: string;
  label: string;
  description: string;
  difficulty_base: number;
  gate_frequency: 'high' | 'medium' | 'low' | 'rare';
  prerequisites: string[];
}

// Resolved relative to THIS module's own location (not process.cwd()) —
// unlike exam-loader.ts / registry.ts, which scan a whole directory and
// degrade gracefully when it's absent, this is the one canonical file the
// concept graph cannot function without, and callers (scripts, tests
// spawned with an unrelated cwd) shouldn't have to run from the repo root
// just to import it.
const GATE_MA_YAML_PATH = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../data/curriculum/gate-ma.yml',
);
const VALID_FREQUENCIES = new Set(['high', 'medium', 'low', 'rare']);

function loadConceptsFromYaml(yamlPath: string): ConceptNode[] {
  if (!fs.existsSync(yamlPath)) {
    throw new Error(
      `concept-graph.ts: canonical concept file not found at ${yamlPath}. ` +
      `The GATE-MA concept graph (82 nodes) lives in data/curriculum/gate-ma.yml's ` +
      `"concepts:" section — this file can no longer construct it from hardcoded data.`,
    );
  }

  let raw: any;
  try {
    raw = parseYaml(fs.readFileSync(yamlPath, 'utf-8'));
  } catch (err) {
    throw new Error(`concept-graph.ts: failed to parse ${yamlPath}: ${(err as Error).message}`);
  }

  const list = raw?.concepts;
  if (!Array.isArray(list) || list.length === 0) {
    throw new Error(
      `concept-graph.ts: ${yamlPath} has no "concepts:" list (or it's empty). ` +
      `This section is the canonical concept universe — it must not be missing.`,
    );
  }

  const seen = new Set<string>();
  const nodes: ConceptNode[] = list.map((raw_node: any, i: number) => {
    const id = raw_node?.id;
    if (typeof id !== 'string' || id.length === 0) {
      throw new Error(`concept-graph.ts: ${yamlPath} concepts[${i}] missing a string "id"`);
    }
    if (seen.has(id)) {
      throw new Error(`concept-graph.ts: ${yamlPath} concepts[${i}] duplicate id "${id}"`);
    }
    seen.add(id);
    const gate_frequency = raw_node.gate_frequency;
    if (!VALID_FREQUENCIES.has(gate_frequency)) {
      throw new Error(
        `concept-graph.ts: ${yamlPath} concept "${id}": gate_frequency must be one of ` +
        `${[...VALID_FREQUENCIES].join('/')}, got "${gate_frequency}"`,
      );
    }
    return {
      id,
      topic: String(raw_node.topic ?? ''),
      label: String(raw_node.label ?? id),
      description: String(raw_node.description ?? ''),
      difficulty_base: Number(raw_node.difficulty_base ?? 0),
      gate_frequency,
      prerequisites: Array.isArray(raw_node.prerequisites)
        ? raw_node.prerequisites.filter((p: any) => typeof p === 'string')
        : [],
    };
  });

  // Prerequisites must point at real nodes — an unresolvable prerequisite
  // id is a data bug, not something to silently ignore (it would make
  // getPrerequisites() quietly drop an edge and getDependents() never see
  // it at all).
  const ids = new Set(nodes.map((n) => n.id));
  for (const node of nodes) {
    for (const prereqId of node.prerequisites) {
      if (!ids.has(prereqId)) {
        throw new Error(
          `concept-graph.ts: ${yamlPath} concept "${node.id}" declares prerequisite ` +
          `"${prereqId}" which is not a known concept id.`,
        );
      }
    }
  }

  // Fail fast, loudly, on a broken DAG rather than let topologicalSort()
  // silently drop the cyclic nodes from its result (see prereq-cycles.ts).
  assertNoPrerequisiteCycles(nodes);

  return nodes;
}

// ============================================================================
// COMBINED GRAPH — loaded once at module init
// ============================================================================

export const ALL_CONCEPTS: ConceptNode[] = loadConceptsFromYaml(GATE_MA_YAML_PATH);

/** Map concept_id → ConceptNode for O(1) lookup */
export const CONCEPT_MAP: Map<string, ConceptNode> = new Map(
  ALL_CONCEPTS.map(c => [c.id, c])
);

// ============================================================================
// SYLLABUS SECTIONS — section-level IDs (e.g. "differential-equations") that
// group granular concept IDs. Navigation sometimes lands on a section ID;
// section-aware consumers resolve it to the first concept in the section.
// ============================================================================

export interface SyllabusSection {
  id: string;
  title: string;
  concept_ids: string[];
}

function loadSyllabusFromYaml(yamlPath: string): SyllabusSection[] {
  try {
    const raw = parseYaml(fs.readFileSync(yamlPath, 'utf-8'));
    const sections = raw?.syllabus;
    if (!Array.isArray(sections)) return [];
    return sections
      .filter((s: any) => typeof s?.id === 'string')
      .map((s: any) => ({
        id: String(s.id),
        title: String(s.title ?? s.id),
        concept_ids: Array.isArray(s.concept_ids)
          ? s.concept_ids.filter((id: any) => typeof id === 'string')
          : [],
      }));
  } catch {
    return [];
  }
}

export const SYLLABUS_SECTIONS: SyllabusSection[] = loadSyllabusFromYaml(GATE_MA_YAML_PATH);

/** Map section_id → SyllabusSection for O(1) lookup */
export const SECTION_MAP: Map<string, SyllabusSection> = new Map(
  SYLLABUS_SECTIONS.map(s => [s.id, s])
);

/**
 * Resolve a concept_id that may be either a leaf concept or a syllabus section
 * ID. When it's a section ID, returns the first concept in that section that
 * exists in the concept graph. Returns undefined when nothing matches.
 */
export function resolveConceptOrSection(id: string): ConceptNode | undefined {
  const direct = CONCEPT_MAP.get(id);
  if (direct) return direct;
  const section = SECTION_MAP.get(id);
  if (!section) return undefined;
  for (const cid of section.concept_ids) {
    const node = CONCEPT_MAP.get(cid);
    if (node) return node;
  }
  return undefined;
}

/** Get all concepts for a topic */
export function getConceptsForTopic(topic: string): ConceptNode[] {
  return ALL_CONCEPTS.filter(c => c.topic === topic);
}

/** Get direct prerequisites for a concept */
export function getPrerequisites(conceptId: string): ConceptNode[] {
  const node = CONCEPT_MAP.get(conceptId);
  if (!node) return [];
  return node.prerequisites.map(id => CONCEPT_MAP.get(id)).filter(Boolean) as ConceptNode[];
}

/** Get all dependents (concepts that require this one) */
export function getDependents(conceptId: string): ConceptNode[] {
  return ALL_CONCEPTS.filter(c => c.prerequisites.includes(conceptId));
}

/**
 * Trace prerequisite chain backward from a concept to find the weakest ancestor.
 * Uses BFS with mastery scores to find the root cause of struggles.
 */
export function traceWeakestPrerequisite(
  conceptId: string,
  masteryVector: Record<string, { score: number }>,
  threshold: number = 0.3,
): ConceptNode[] {
  const weak: ConceptNode[] = [];
  const visited = new Set<string>();
  const queue = [conceptId];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visited.has(current)) continue;
    visited.add(current);

    const node = CONCEPT_MAP.get(current);
    if (!node) continue;

    for (const prereqId of node.prerequisites) {
      const mastery = masteryVector[prereqId]?.score ?? 0;
      if (mastery < threshold) {
        const prereqNode = CONCEPT_MAP.get(prereqId);
        if (prereqNode) weak.push(prereqNode);
      }
      queue.push(prereqId);
    }
  }

  // Sort by mastery (weakest first)
  return weak.sort((a, b) => {
    const ma = masteryVector[a.id]?.score ?? 0;
    const mb = masteryVector[b.id]?.score ?? 0;
    return ma - mb;
  });
}

/**
 * Get concept IDs in topological order (prerequisites before dependents).
 * Useful for determining learning path.
 */
export function topologicalSort(): string[] {
  const inDegree = new Map<string, number>();
  const adjList = new Map<string, string[]>();

  for (const c of ALL_CONCEPTS) {
    inDegree.set(c.id, c.prerequisites.length);
    for (const p of c.prerequisites) {
      if (!adjList.has(p)) adjList.set(p, []);
      adjList.get(p)!.push(c.id);
    }
  }

  const queue = ALL_CONCEPTS.filter(c => c.prerequisites.length === 0).map(c => c.id);
  const result: string[] = [];

  while (queue.length > 0) {
    const current = queue.shift()!;
    result.push(current);
    for (const dep of (adjList.get(current) || [])) {
      inDegree.set(dep, (inDegree.get(dep) || 1) - 1);
      if (inDegree.get(dep) === 0) queue.push(dep);
    }
  }

  return result;
}
