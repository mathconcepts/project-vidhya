// @ts-nocheck
/**
 * Concept Dependency Graph — the concept universe, across every exam pack.
 *
 * Thin loader (CEO plan Phase 0, §6 registry unification / Loop A). Concepts
 * and prerequisite edges are not hardcoded here — they live in each exam
 * pack's `concepts:` section under `data/curriculum/`, which is the single
 * source of truth. This file reads those packs once at module load and
 * reconstructs the exact same exported shape (`ConceptNode`, `ALL_CONCEPTS`,
 * `CONCEPT_MAP`, and every helper function below) so the dozens of existing
 * consumers across the codebase (curriculum-repo.ts, the Elo/FSRS/readiness
 * engine, batch generation, the content CI gate, etc.) need zero changes.
 *
 * MULTI-EXAM (Step A)
 *
 * This used to read exactly one file, `data/curriculum/gate-ma.yml`, and that
 * single line is what made the whole adaptive engine single-exam: Elo, FSRS,
 * readiness / next-best-action, prerequisite repair, FIRe credit propagation,
 * quiz-pool assembly and the frontier spine all read `ALL_CONCEPTS`, so a
 * second exam's concepts did not exist to any of them — even with a valid
 * pack installed and `DEFAULT_EXAM_ID` pointing at it.
 *
 * The universe is now the MERGE of every pack's `concepts:` block. Concept ids
 * are global, which is deliberate and already how the rest of the system
 * behaves: lesson atoms live at `modules/…/concepts/<concept_id>/` and
 * practice items carry a bare `node_id`, neither of which is namespaced by
 * exam. So a concept genuinely shared between exams (`eigenvalues` is the same
 * idea, and the same lesson, in GATE and in JEE) is DECLARED ONCE in whichever
 * pack owns it and REFERENCED by id from any other pack's `syllabus:`. That is
 * already the shape `jee-main.yml` uses today.
 *
 * Declaring the same id in two packs is therefore an error, not a merge: two
 * definitions of one concept would silently diverge in difficulty, topic and
 * prerequisites depending on load order. The error names both files.
 *
 * `SYLLABUS_SECTIONS` stays per-exam (it is the ACTIVE exam's navigation, and
 * section ids like `linear-algebra` legitimately recur across exams).
 *
 * Edit concepts by editing a pack's `concepts:` block, not this file. See
 * `gate-ma.yml`'s header for the split between `concepts:` (what nodes exist),
 * `syllabus:` (partial curation for weight/depth metadata), and
 * `concept_links:` (per-exam emphasis).
 *
 * `ConceptNode.gate_frequency` keeps its name across exams. It means "how
 * often does this exam's papers ask it", not anything GATE-specific; renaming
 * it touches ~40 call sites for no behaviour change, so it stays until there
 * is a reason beyond the word.
 *
 * Powers:
 *   - Prerequisite Auto-Repair (Pillar 3)
 *   - Adaptive Problem Generation (Pillar 4)
 *   - Mastery Vector granularity (Pillar 1)
 */

import { assertNoPrerequisiteCycles, assertNoGraphCycles } from '../curriculum/prereq-cycles';
import {
  CURRICULUM_DIR,
  listExamPackFiles,
  resolveActiveExamPack,
  type ExamPackFile,
} from '../curriculum/active-exam';

/**
 * T11 (Milestone B — B1). A concept X "encompasses" concept Y with weight
 * `w ∈ (0,1]` when a random X problem implicitly practices Y (Skycak's
 * semantics — `w` ≈ the fraction/probability of that implicit practice).
 * Distinct from `prerequisites`: encompassed topics are USUALLY
 * prerequisites but need not be, and the edge is directional the other
 * way in FIRe's credit-propagation sense (see fire.ts) — mastering the
 * more advanced X gives partial credit toward the simpler Y.
 */
export interface EncompassingEdge {
  id: string;
  weight: number;
}

export interface ConceptNode {
  id: string;
  topic: string;
  label: string;
  description: string;
  difficulty_base: number;
  gate_frequency: 'high' | 'medium' | 'low' | 'rare';
  prerequisites: string[];
  /** Optional — only the 26 linear-algebra concepts declare these today. */
  encompasses?: EncompassingEdge[];
  /**
   * Whether real exam papers directly ask questions on this concept, as
   * opposed to assuming a student can already do it because it underlies
   * something else the paper does test (a prerequisite/foundational skill
   * — e.g. the chain rule, or basic vector algebra). Defaults to `true`
   * (undefined ⇒ tested) — most concepts in the graph ARE directly examined.
   *
   * A concept explicitly flagged `exam_tested: false` in
   * `data/curriculum/gate-ma.yml` is EXPECTED to have zero questions mapped
   * to it in `frontend/public/data/pyq-bank.json` — that absence is a
   * correct, permanent property of the concept, not a content gap.
   * `scripts/check-la-walkthrough.ts`'s test leg treats it as a pass
   * (reported distinctly as "not examined", never silently as "✓"), and the
   * student-facing walkthrough rail explains it in place of an empty list.
   * Writing a question for one of these and filing it as past-exam material
   * would fabricate provenance — don't.
   */
  exam_tested?: boolean;
}

const VALID_FREQUENCIES = new Set(['high', 'medium', 'low', 'rare']);

/**
 * Parses one pack's `concepts:` block into nodes, validating each node's own
 * shape. Cross-node checks (prerequisite resolution, cycles) happen once over
 * the MERGED universe in `buildConceptUniverse()`, because a pack is allowed
 * to declare a concept whose prerequisite is declared by another pack.
 *
 * A pack with no `concepts:` block contributes nothing and is not an error:
 * that is a pack which references shared concepts from its `syllabus:`
 * without owning any (see this file's header). `jee-main.yml` is exactly
 * that today.
 */
function parseConceptNodes(pack: ExamPackFile): ConceptNode[] {
  const yamlPath = pack.path;

  // `pack.doc` is already parsed. This function used to re-read and re-parse
  // the file and THROW on failure — at module scope, so one unparseable YAML
  // anywhere in data/curriculum/ took the whole server down at boot. Parseability
  // is now listExamPackFiles()'s job (it skips a bad file with a warning and
  // exam-loader still reports the real error), which leaves this function to
  // validate only the `concepts:` block of a file already known to be a pack.
  const raw: any = pack.doc;

  const list = raw?.concepts;
  if (list === undefined || list === null) return [];
  if (!Array.isArray(list)) {
    throw new Error(
      `concept-graph.ts: ${yamlPath} has a "concepts:" key that is not a list. ` +
      `Omit the key entirely if this pack declares no concepts of its own.`,
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
      encompasses: parseEncompasses(raw_node.encompasses, id, yamlPath),
      // Only ever written as an explicit `false` in the YAML (see
      // ConceptNode.exam_tested above) — anything else (absent, `true`,
      // malformed) collapses to `undefined` so every call site's
      // `!== false` default-true check stays the single place that matters.
      exam_tested: raw_node.exam_tested === false ? false : undefined,
    };
  });

  return nodes;
}

/**
 * Where each concept came from. Exported for diagnostics: with more than one
 * pack installed, "which exam contributed these nodes" stops being obvious,
 * and an operator staring at a wrong-looking graph should be able to see it
 * without reading YAML.
 */
export interface ConceptGraphSource {
  exam_id: string;
  file: string;
  concept_count: number;
}

interface ConceptUniverse {
  nodes: ConceptNode[];
  sources: ConceptGraphSource[];
  /** concept id → the pack that declared it, for precise error messages. */
  declaredBy: Map<string, ExamPackFile>;
}

/**
 * Merges every pack's concepts into the one universe the engine reasons over,
 * then runs the cross-node checks that only make sense against the whole set.
 */
function buildConceptUniverse(): ConceptUniverse {
  const packs = listExamPackFiles();
  if (packs.length === 0) {
    throw new Error(
      `concept-graph.ts: no exam packs found in ${CURRICULUM_DIR}. ` +
      `The concept universe is built from each pack's "concepts:" section — ` +
      `this file can no longer construct it from hardcoded data.`,
    );
  }

  const nodes: ConceptNode[] = [];
  const sources: ConceptGraphSource[] = [];
  const declaredBy = new Map<string, ExamPackFile>();

  for (const pack of packs) {
    const packNodes = parseConceptNodes(pack);
    for (const node of packNodes) {
      const prior = declaredBy.get(node.id);
      if (prior) {
        throw new Error(
          `concept-graph.ts: concept "${node.id}" is declared in both ` +
          `${prior.filename} and ${pack.filename}. Concept ids are global — ` +
          `declare a shared concept in exactly one pack and reference it by id ` +
          `from the other pack's "syllabus:" block.`,
        );
      }
      declaredBy.set(node.id, pack);
      nodes.push(node);
    }
    sources.push({ exam_id: pack.id, file: pack.filename, concept_count: packNodes.length });
  }

  if (nodes.length === 0) {
    throw new Error(
      `concept-graph.ts: no exam pack in ${CURRICULUM_DIR} declares a "concepts:" block ` +
      `(scanned: ${packs.map((p) => p.filename).join(', ')}). The concept universe cannot be empty.`,
    );
  }

  // Prerequisites must point at real nodes — an unresolvable prerequisite
  // id is a data bug, not something to silently ignore (it would make
  // getPrerequisites() quietly drop an edge and getDependents() never see
  // it at all). Checked across the merged set, so one pack may depend on a
  // concept another pack declares.
  const ids = new Set(nodes.map((n) => n.id));
  for (const node of nodes) {
    const where = declaredBy.get(node.id)!.filename;
    for (const prereqId of node.prerequisites) {
      if (!ids.has(prereqId)) {
        throw new Error(
          `concept-graph.ts: ${where} concept "${node.id}" declares prerequisite ` +
          `"${prereqId}" which is not a known concept id.`,
        );
      }
    }
    for (const edge of node.encompasses ?? []) {
      if (!ids.has(edge.id)) {
        throw new Error(
          `concept-graph.ts: ${where} concept "${node.id}" declares encompasses ` +
          `"${edge.id}" which is not a known concept id.`,
        );
      }
      if (edge.id === node.id) {
        throw new Error(
          `concept-graph.ts: ${where} concept "${node.id}" declares encompasses ` +
          `pointing at itself.`,
        );
      }
    }
  }

  // Fail fast, loudly, on a broken DAG rather than let topologicalSort()
  // silently drop the cyclic nodes from its result (see prereq-cycles.ts).
  assertNoPrerequisiteCycles(nodes);

  // T11 (B1): the encompassing graph carries the same "must not cycle"
  // invariant as prerequisites (FIRe's depth-capped closure walk in
  // fire.ts would loop forever on a cycle, same failure class
  // topologicalSort() has for prerequisites). Parameterized cycle check
  // (prereq-cycles.ts's assertNoGraphCycles) — same DFS, different edge
  // field, distinct error type so a broken encompasses: edit doesn't read
  // like a prerequisite bug.
  assertNoGraphCycles(nodes, (n) => (n.encompasses ?? []).map((e) => e.id), 'encompasses');

  return { nodes, sources, declaredBy };
}

/**
 * Parses + validates the optional `encompasses:` list for one concept.
 * Weights must be in (0,1]; malformed entries are a data bug (thrown),
 * not silently dropped — an author's typo in a weight should fail CI
 * loudly, not quietly produce a smaller/wrong closure.
 */
function parseEncompasses(raw: any, conceptId: string, yamlPath: string): EncompassingEdge[] | undefined {
  if (raw === undefined || raw === null) return undefined;
  if (!Array.isArray(raw)) {
    throw new Error(
      `concept-graph.ts: ${yamlPath} concept "${conceptId}": "encompasses" must be a list.`,
    );
  }
  return raw.map((entry: any, i: number) => {
    const id = entry?.id;
    const weight = Number(entry?.weight);
    if (typeof id !== 'string' || id.length === 0) {
      throw new Error(
        `concept-graph.ts: ${yamlPath} concept "${conceptId}" encompasses[${i}] missing a string "id".`,
      );
    }
    if (!Number.isFinite(weight) || weight <= 0 || weight > 1) {
      throw new Error(
        `concept-graph.ts: ${yamlPath} concept "${conceptId}" encompasses "${id}": weight must be ` +
        `in (0,1], got ${entry?.weight}.`,
      );
    }
    return { id, weight };
  });
}

// ============================================================================
// COMBINED GRAPH — loaded once at module init
// ============================================================================

const _universe = buildConceptUniverse();

export const ALL_CONCEPTS: ConceptNode[] = _universe.nodes;

/** Which pack contributed how many concepts. Diagnostics only. */
export const CONCEPT_GRAPH_SOURCES: ConceptGraphSource[] = _universe.sources;

/** concept id → the exam pack id that declares it. */
export const CONCEPT_DECLARED_BY: Map<string, string> = new Map(
  Array.from(_universe.declaredBy.entries()).map(([conceptId, pack]) => [conceptId, pack.id]),
);

/**
 * The concepts one exam pack declares of its own.
 *
 * Distinct from `ALL_CONCEPTS`, which is every pack's concepts merged, and
 * the distinction is load-bearing: a caller asking "what is THIS exam about"
 * (generation scope, coverage reporting, an exam-scoped dashboard) must not
 * be handed another exam's concepts just because they share a graph. While
 * only one pack declared anything the two were interchangeable, which is
 * exactly why the difference is easy to miss.
 *
 * Returns [] for a pack that declares none — a stub pack that only references
 * shared concepts from its `syllabus:`. That emptiness is the honest answer,
 * and callers that can fall back to the syllabus should do so explicitly.
 */
export function conceptsDeclaredByExam(exam_id: string): ConceptNode[] {
  return ALL_CONCEPTS.filter((c) => CONCEPT_DECLARED_BY.get(c.id) === exam_id);
}

/** The pack whose `syllabus:` drives SYLLABUS_SECTIONS below, or null. */
const ACTIVE_PACK: ExamPackFile | null = resolveActiveExamPack();

/**
 * How many concepts the ACTIVE exam declares of its own.
 *
 * Zero is a real and meaningful state, not a bug to paper over: it means the
 * deployment is configured to serve an exam whose pack references concepts
 * without owning any (a stub pack, like `jee-main.yml` today). The graph is
 * still non-empty, because other packs contributed — so without this the app
 * would boot happily, label itself with the active exam's name, and teach
 * another exam's concepts underneath. That is the exact silent falsehood this
 * codebase refuses elsewhere, so it is surfaced rather than swallowed.
 *
 * Surfaced, not thrown: a stub pack is a legitimate intermediate state while
 * an exam is being filled in, and hard-failing boot would make that state
 * impossible to work in. Callers that need to gate on readiness read this.
 */
export const ACTIVE_EXAM_CONCEPT_COUNT: number = ACTIVE_PACK
  ? (CONCEPT_GRAPH_SOURCES.find((s) => s.exam_id === ACTIVE_PACK.id)?.concept_count ?? 0)
  : 0;

if (ACTIVE_PACK && ACTIVE_EXAM_CONCEPT_COUNT === 0) {
  console.warn(
    `[concept-graph] active exam "${ACTIVE_PACK.id}" (${ACTIVE_PACK.filename}) declares no ` +
    `concepts of its own. The graph has ${ALL_CONCEPTS.length} concepts from ` +
    `${CONCEPT_GRAPH_SOURCES.filter((s) => s.concept_count > 0).map((s) => s.exam_id).join(', ')}, ` +
    `so anything adaptive (readiness, spaced repetition, prerequisites) will reason over ` +
    `those and not over "${ACTIVE_PACK.id}". Fill in its "concepts:" block, or set ` +
    `DEFAULT_EXAM_ID to an exam that has one.`,
  );
}

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

function loadSyllabusFromPack(pack: ExamPackFile): SyllabusSection[] {
  try {
    const raw: any = pack.doc;
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

/**
 * The ACTIVE exam's sections, not every pack's merged together.
 *
 * Unlike concept ids, section ids are per-exam navigation labels and
 * legitimately recur — two exams can both have a `linear-algebra` section
 * covering different concept lists. Merging them would make SECTION_MAP
 * ambiguous and `resolveConceptOrSection()` land on whichever pack loaded
 * first, so this stays scoped to the exam the deployment is serving.
 */
export const SYLLABUS_SECTIONS: SyllabusSection[] =
  ACTIVE_PACK ? loadSyllabusFromPack(ACTIVE_PACK) : [];

/** Map section_id → SyllabusSection for O(1) lookup */
export const SECTION_MAP: Map<string, SyllabusSection> = new Map(
  SYLLABUS_SECTIONS.map(s => [s.id, s])
);

/**
 * Maps bundle concept_ids that aren't in the YAML concept graph to the
 * canonical leaf concept they belong to. Checked before SECTION_MAP so
 * navigating to /lesson/simpson-rule shows the numerical-integration lesson
 * rather than the "uncategorized" fallback.
 */
const CONCEPT_ALIASES: Record<string, string> = {
  // Numerical methods sub-concepts
  'simpson-rule': 'numerical-integration',
  'trapezoidal-rule': 'numerical-integration',
  'runge-kutta': 'numerical-ode',
  'euler-method': 'numerical-ode',
  'newton-raphson': 'root-finding',
  'bisection-method': 'root-finding',
  // Topic names used as concept_ids in the content bundle → canonical leaf concept
  'transform-theory': 'laplace-transform',
  'discrete-mathematics': 'functions-combinatorics',
  'graph-theory': 'graph-basics',
  'combinatorics': 'functions-combinatorics',
  // ODE sub-concepts
  'first-order-linear': 'ode-first-order',
  'second-order-linear': 'ode-second-order-homo',
  // Calculus sub-concepts
  'taylor-series': 'series',
  'partial-derivatives': 'multivariable-calculus',
  'gradient': 'vector-fields',
  // Linear algebra sub-concepts
  'matrix-rank': 'rank-nullity',
  // Probability sub-concepts
  'bayes-theorem': 'probability-basics',
  // Complex analysis sub-concepts
  'cauchy-riemann': 'analytic-functions',
};

/**
 * Resolve a concept_id that may be either a leaf concept or a syllabus section
 * ID. When it's a section ID, returns the first concept in that section that
 * exists in the concept graph. Returns undefined when nothing matches.
 */
export function resolveConceptOrSection(id: string): ConceptNode | undefined {
  const direct = CONCEPT_MAP.get(id);
  if (direct) return direct;
  const alias = CONCEPT_ALIASES[id];
  if (alias) {
    const node = CONCEPT_MAP.get(alias);
    if (node) return node;
  }
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
