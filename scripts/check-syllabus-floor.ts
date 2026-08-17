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

/**
 * Explainers, keyed by concept id, always as an array.
 *
 * ── This read was wrong in two ways at once ─────────────────────────────
 *
 * The shipped file is `{version, generated_at, total, by_concept}` and the
 * old code returned that whole object, so `explainers['eigenvalues']` was
 * `undefined` for every concept. `by_concept[id]` is also a SINGLE OBJECT,
 * not an array, so fixing only the path would have swapped `undefined` for a
 * non-iterable and kept every count at zero.
 *
 * Both shapes are normalised here, and the legacy flat-array form is still
 * accepted, so a regenerated bundle in either layout keeps working.
 */
export function loadExplainersJson(): Record<string, unknown[]> | null {
  const p = path.join(ROOT, 'frontend/public/data/explainers.json');
  if (!fs.existsSync(p)) return null;
  try {
    const data = JSON.parse(fs.readFileSync(p, 'utf-8'));
    const byConceptId: Record<string, unknown[]> = {};

    const push = (atom: unknown) => {
      const cid = (atom as { concept_id?: string })?.concept_id;
      if (!cid) return;
      byConceptId[cid] = byConceptId[cid] ?? [];
      byConceptId[cid].push(atom);
    };

    if (Array.isArray(data)) {
      for (const atom of data) push(atom);
      return byConceptId;
    }
    if (typeof data === 'object' && data !== null) {
      const source = (data as { by_concept?: Record<string, unknown> }).by_concept ?? data;
      for (const [cid, value] of Object.entries(source)) {
        // Skip the bundle's own metadata keys when falling back to `data`.
        if (['version', 'generated_at', 'total', 'by_concept'].includes(cid)) continue;
        const list = Array.isArray(value) ? value : [value];
        byConceptId[cid] = list;
      }
      return byConceptId;
    }
    return byConceptId;
  } catch {
    return null;
  }
}

/**
 * Concept ids that have at least one verified practice item authored.
 *
 * Practice items live in `data/practice-items/*.json`, not in the explainer
 * bundle. The old code looked for `atom_type: 'micro_exercise' | 'mcq' |
 * 'worked_example'` rows inside explainers.json, where no such rows have ever
 * existed — so the practice count was structurally zero regardless of how
 * many items were authored.
 */
function loadPracticeCounts(): Map<string, number> {
  const dir = path.join(ROOT, 'data', 'practice-items');
  const counts = new Map<string, number>();
  if (!fs.existsSync(dir)) return counts;

  for (const file of fs.readdirSync(dir)) {
    if (!file.endsWith('.json')) continue;
    try {
      const parsed = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf-8'));
      const items: unknown[] = Array.isArray(parsed) ? parsed : (parsed.items ?? []);
      for (const item of items) {
        const it = item as { concept_id?: string; verification_method?: string };
        // "Verified" means an authored verification method is recorded. An
        // item with no method is display-only and must not inflate the floor.
        if (!it.concept_id || !it.verification_method) continue;
        counts.set(it.concept_id, (counts.get(it.concept_id) ?? 0) + 1);
      }
    } catch {
      // A malformed bank contributes nothing rather than crashing the gate.
    }
  }
  return counts;
}

export function loadTeachingTipsIndex(): Set<string> {
  const coursesDir = path.join(ROOT, 'data/courses');
  const conceptsWithTips = new Set<string>();

  if (!fs.existsSync(coursesDir)) return conceptsWithTips;

  const walkDir = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) walkDir(path.join(dir, entry.name));
      if (entry.name === 'teaching-tips.md') {
        // Directories are numbered — `01-linear-algebra`, `05-probability-
        // statistics`. Store the topic WITHOUT the ordering prefix, because
        // that is what the concept graph's `topic` field holds. The old code
        // stored `01-linear-algebra` and matched it against
        // `conceptId.split('-')[0]` (`"eigenvalues"`), which could never hit.
        const dirName = path.basename(path.dirname(path.join(dir, entry.name)));
        conceptsWithTips.add(dirName.replace(/^\d+-/, ''));
      }
    }
  };
  walkDir(coursesDir);
  return conceptsWithTips;
}

/** An explainer counts when it is not a placeholder and actually says something. */
export function isRealExplainer(a: {
  model?: string;
  deep_explanation?: string;
  canonical_definition?: string;
}): boolean {
  if (a?.model === 'placeholder') return false;
  // Deliberately NOT `atom_type !== undefined`. Explainer entries carry no
  // atom_type field at all — an explainer IS the entry — so that test
  // rejected all 82 real explainers and reported every concept as empty.
  const body = `${a?.deep_explanation ?? ''}${a?.canonical_definition ?? ''}`.trim();
  return body.length > 0;
}

export async function measureActual(
  conceptId: string,
  explainersJson: Record<string, unknown[]> | null,
  teachingTips: Set<string>,
  practiceCounts: Map<string, number> = new Map(),
  conceptTopic?: string,
): Promise<ConceptActual> {
  const atoms = explainersJson?.[conceptId] ?? [];
  const realExplainers = (atoms as Array<Parameters<typeof isRealExplainer>[0]>)
    .filter(isRealExplainer);

  // Strategy card: teaching tips are authored per TOPIC, so match on the
  // concept's topic, falling back to its own id for concept-level tips.
  const hasStrategyCard =
    teachingTips.has(conceptId) || (conceptTopic ? teachingTips.has(conceptTopic) : false);

  return {
    concept_id: conceptId,
    explainer_count: realExplainers.length,
    verified_practice_count: practiceCounts.get(conceptId) ?? 0,
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
  const practiceCounts = loadPracticeCounts();

  const violations: SyllabusFloorViolation[] = [];
  let checkedCount = 0;

  for (const concept of concepts) {
    const floor = getConceptFloor(manifest, concept.id);
    const actual = await measureActual(
      concept.id,
      explainersJson,
      teachingTips,
      practiceCounts,
      (concept as { topic?: string }).topic,
    );
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

// Only run when invoked as a CLI. Without this guard, importing the module to
// test its measurement functions executes main() and calls process.exit(1),
// which kills the test runner rather than failing a test.
if (process.argv[1]?.endsWith('check-syllabus-floor.ts')) {
  main().catch((e) => {
    console.error('[check-syllabus-floor] Fatal error:', e);
    process.exit(1);
  });
}
