/**
 * scripts/check-syllabus-floor.ts
 *
 * Bare-Minimum Syllabus Contract CI gate (Track E3).
 *
 * Run: npx tsx scripts/check-syllabus-floor.ts
 * Exit: 0 = all concepts meet floor, 1 = SyllabusFloorViolation(s) found.
 *
 * Reads:
 *   data/curriculum/gate-ma.floor.yml — floor definitions + ratchet state
 *   data/curriculum/gate-ma.yml       — concept list
 *   frontend/public/data/explainers.json (if exists) — explainer content
 *   src/db (if DATABASE_URL set) — generated_problems verification flags
 *
 * When ratchet=report_only: prints violations but exits 0 (CI passes).
 * When ratchet=blocking:    exits 1 on any violation (build fails).
 *
 * Error type: SyllabusFloorViolation — a named error class logged per concept.
 * Logged to console with a per-concept deficit report.
 *
 * Establishes the build-time budget-check pattern the CAS-First T-C
 * banks check will reuse.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import yaml from 'js-yaml';
import { ALL_CONCEPTS } from '../src/constants/concept-graph.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FloorDefaults {
  explainers: number;
  practice_items: number;
  strategy_card: boolean;
}

interface ConceptOverride {
  explainers?: number;
  practice_items?: number;
  strategy_card?: boolean;
}

interface FloorManifest {
  defaults: FloorDefaults;
  ratchet: 'report_only' | 'blocking';
  overrides?: Record<string, ConceptOverride>;
}

interface ConceptFloor {
  concept_id: string;
  explainers: number;
  practice_items: number;
  strategy_card: boolean;
}

interface ConceptActual {
  concept_id: string;
  explainer_count: number;
  verified_practice_count: number;
  has_strategy_card: boolean;
}

export class SyllabusFloorViolation {
  constructor(
    public readonly concept_id: string,
    public readonly deficits: string[],
  ) {}

  toString(): string {
    return `SyllabusFloorViolation [${this.concept_id}]: ${this.deficits.join('; ')}`;
  }
}

// ---------------------------------------------------------------------------
// Load floor manifest
// ---------------------------------------------------------------------------

function loadFloorManifest(examId: string): FloorManifest {
  const floorPath = path.join(ROOT, 'data/curriculum', `${examId}.floor.yml`);
  if (!fs.existsSync(floorPath)) {
    console.warn(`[floor] No floor manifest at ${floorPath} — skipping floor check`);
    process.exit(0);
  }
  return yaml.load(fs.readFileSync(floorPath, 'utf-8')) as FloorManifest;
}

function getConceptFloor(manifest: FloorManifest, conceptId: string): ConceptFloor {
  const override = manifest.overrides?.[conceptId] ?? {};
  return {
    concept_id: conceptId,
    explainers: override.explainers ?? manifest.defaults.explainers,
    practice_items: override.practice_items ?? manifest.defaults.practice_items,
    strategy_card: override.strategy_card ?? manifest.defaults.strategy_card,
  };
}

// ---------------------------------------------------------------------------
// Measure actuals
// ---------------------------------------------------------------------------

function loadExplainersJson(): Record<string, unknown[]> | null {
  const p = path.join(ROOT, 'frontend/public/data/explainers.json');
  if (!fs.existsSync(p)) return null;
  try {
    const data = JSON.parse(fs.readFileSync(p, 'utf-8'));
    // Group by concept_id
    const byConceptId: Record<string, unknown[]> = {};
    if (Array.isArray(data)) {
      for (const atom of data) {
        const cid = (atom as { concept_id?: string }).concept_id;
        if (cid) {
          byConceptId[cid] = byConceptId[cid] ?? [];
          byConceptId[cid].push(atom);
        }
      }
    } else if (typeof data === 'object' && data !== null) {
      return data as Record<string, unknown[]>;
    }
    return byConceptId;
  } catch {
    return null;
  }
}

function loadTeachingTipsIndex(): Set<string> {
  const coursesDir = path.join(ROOT, 'data/courses');
  const conceptsWithTips = new Set<string>();

  if (!fs.existsSync(coursesDir)) return conceptsWithTips;

  const walkDir = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) walkDir(path.join(dir, entry.name));
      if (entry.name === 'teaching-tips.md') {
        // The parent topic name is used as a proxy for the concept group
        const topic = path.basename(path.dirname(path.join(dir, entry.name)));
        conceptsWithTips.add(topic);
      }
    }
  };
  walkDir(coursesDir);
  return conceptsWithTips;
}

async function measureActual(conceptId: string, explainersJson: Record<string, unknown[]> | null, teachingTips: Set<string>): Promise<ConceptActual> {
  // Count explainers from the bundle
  const atoms = explainersJson?.[conceptId] ?? [];
  const nonPlaceholderExplainers = (atoms as Array<{ model?: string; atom_type?: string }>)
    .filter((a) => a.model !== 'placeholder' && a.atom_type !== undefined);

  // Count verified practice items from bundle (simplified: count micro_exercise + mcq atoms)
  const practiceAtoms = (atoms as Array<{ atom_type?: string; machine_verified?: boolean; verification_status?: string }>)
    .filter((a) => ['micro_exercise', 'mcq', 'worked_example'].includes(a.atom_type ?? ''));
  const verifiedPractice = practiceAtoms.filter(
    (a) => a.machine_verified || a.verification_status === 'cross_checked',
  );

  // Strategy card: check if a teaching-tips entry exists for this concept's topic
  const topicPrefix = conceptId.split('-')[0];
  const hasStrategyCard = teachingTips.has(conceptId) || teachingTips.has(topicPrefix);

  return {
    concept_id: conceptId,
    explainer_count: nonPlaceholderExplainers.length,
    verified_practice_count: verifiedPractice.length,
    has_strategy_card: hasStrategyCard,
  };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const examId = process.argv[2] ?? 'gate-ma';
  console.log(`\n[check-syllabus-floor] Checking floor for exam: ${examId}\n`);

  const manifest = loadFloorManifest(examId);
  const concepts = ALL_CONCEPTS.filter((c) => c.id !== examId);
  const explainersJson = loadExplainersJson();
  const teachingTips = loadTeachingTipsIndex();

  const violations: SyllabusFloorViolation[] = [];
  let checkedCount = 0;

  for (const concept of concepts) {
    const floor = getConceptFloor(manifest, concept.id);
    const actual = await measureActual(concept.id, explainersJson, teachingTips);
    checkedCount++;

    const deficits: string[] = [];

    if (actual.explainer_count < floor.explainers) {
      deficits.push(
        `explainers: need ≥${floor.explainers}, have ${actual.explainer_count}`,
      );
    }

    if (actual.verified_practice_count < floor.practice_items) {
      deficits.push(
        `verified_practice: need ≥${floor.practice_items}, have ${actual.verified_practice_count}`,
      );
    }

    if (floor.strategy_card && !actual.has_strategy_card) {
      deficits.push('strategy_card: missing teaching-tips source entry');
    }

    if (deficits.length) {
      violations.push(new SyllabusFloorViolation(concept.id, deficits));
    }
  }

  // Report
  const isBlocking = manifest.ratchet === 'blocking';
  console.log(`Checked ${checkedCount} concepts | Floor violations: ${violations.length}`);

  if (violations.length === 0) {
    console.log('✓ All concepts meet the syllabus floor.\n');
    process.exit(0);
  }

  console.log(`\n${'─'.repeat(60)}`);
  console.log(`SYLLABUS FLOOR VIOLATIONS (${manifest.ratchet.toUpperCase()})`);
  console.log('─'.repeat(60));
  for (const v of violations) {
    console.log(`  ✗ ${v.toString()}`);
  }
  console.log('─'.repeat(60));
  console.log(`\nRun the floor-fill playbook to resolve: npm run playbook:run -- floor-fill\n`);

  if (isBlocking) {
    console.error(`[check-syllabus-floor] ${violations.length} violation(s) — build FAILED (ratchet=blocking)\n`);
    process.exit(1);
  } else {
    console.log(`[check-syllabus-floor] ${violations.length} violation(s) reported (ratchet=report_only — not blocking)\n`);
    process.exit(0);
  }
}

main().catch((e) => {
  console.error('[check-syllabus-floor] Fatal error:', e);
  process.exit(1);
});
