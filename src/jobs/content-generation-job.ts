/**
 * content-generation job — background atom generation in FILE mode
 * (content-pipeline realignment plan, Accepted Scope item 4).
 *
 * Wraps the EXISTING concept-orchestrator
 * (src/content/concept-orchestrator/orchestrator.ts). "FILE mode" means
 * accepted atoms persist as markdown files under
 * modules/project-vidhya-content/concepts/<concept_id>/atoms/ in the
 * exact format the atom-loader parses (YAML frontmatter with id,
 * concept_id, atom_type, bloom_level, difficulty, exam_ids + body).
 * The orchestrator's own DB persistence (atom_versions) still runs when
 * DATABASE_URL is set; without a DB it no-ops and the files are the
 * artifact — the demo stays DB-less honest.
 *
 * Iterates concepts from the concept graph that are missing atoms,
 * honoring CONTENT_MAX_LLM_CALLS_PER_RUN (estimated calls per concept;
 * hitting the budget pauses the job resumably) and GEMINI_BATCH_SIZE
 * (breather between batches), checkpointing after each concept.
 *
 * Corner cases this job handles, not just the from-scratch case:
 *  - Already-complete concepts are skipped entirely (unchanged).
 *  - Partially-complete concepts (some atom types present, e.g. from a
 *    prior interrupted run, a manual/authored atom, or an earlier partial
 *    generation) are topped up — only the MISSING atom_types are
 *    requested from generateConcept(), so existing good atoms are never
 *    regenerated or clobbered.
 *  - Generation is ordered by the concept-graph prerequisite DAG so
 *    foundational concepts (e.g. `limits` before `continuity`) generate
 *    first — ordering only; prerequisite content is not (yet) fed into
 *    generation prompts.
 *  - Student-uploaded materials are intentionally NOT wired into this
 *    job: canonical atom generation stays lesson-composition-time and
 *    provider-agnostic; personalization draws on uploads separately (see
 *    personalized-regen.ts), so a bad/adversarial upload can never
 *    corrupt the canonical atom set.
 *
 * Without GEMINI_API_KEY the job REFUSES to start: generating
 * stub/placeholder atoms is banned by the realignment plan — the exact
 * regression that shipped 82 placeholder explainers. The preflight also
 * makes one LIVE call per configured provider (preflightProviders()) so a
 * bad/expired/quota-exhausted key is caught before the job burns budget
 * churning through per-concept failures: a broken Gemini key still
 * refuses to start (Gemini is required), a broken Anthropic key only
 * warns (Anthropic backs consensus/second-opinions, not primary
 * generation).
 *
 * Syllabus-agnostic by design: which concept graph to iterate and where
 * its atoms live both come from `./generation-syllabi`, which resolves
 * against the existing data/curriculum/*.yml + exam-loader.ts (select
 * with VIDHYA_SYLLABUS=<id>; defaults to GATE Engineering Mathematics).
 * This job has no GATE-specific literals in it. See
 * generation-syllabi.ts's module docblock for the (deliberately bounded)
 * scope of what "syllabus-agnostic" means here — this pipeline only, not
 * the ~30 other app modules still GATE-EM-only by design, and NOT the
 * canonical "syllabus registry" from
 * claude/2026-07-30-Content-Strategy-v2.md §3 (that's the same
 * data/curriculum/*.yml files, planned to absorb concept-graph.ts as
 * canonical once Loop A ships).
 */

import fs from 'fs';
import path from 'path';
import {
  registerJob,
  QuotaExhaustedError,
  type JobContext,
  type JobDefinition,
} from './job-runner';
import type { ConceptNode } from '../constants/concept-graph';
import {
  getSyllabus,
  DEFAULT_SYLLABUS_ID,
  listSyllabusIds,
  type GenerationSyllabus as Syllabus,
} from '../curriculum/exam-loader';
import { generateConcept, ALL_ATOM_TYPES } from '../content/concept-orchestrator';
import type { GeneratedAtom } from '../content/concept-orchestrator';
import type { AtomType } from '../content/content-types';
import { reloadAtoms } from '../content/atom-loader';
import { preflightProviders } from '../llm/env-config';
import { preflightDatabase } from './db-preflight';

export const CONTENT_GENERATION_JOB = 'content-generation';

/**
 * Estimated LLM calls per concept (all 11 atom types) for budget
 * accounting: 11 atom generations + 2 consensus second-opinions
 * (worked_example, formal_definition) + 11 llm-judge scorings = 24. The
 * orchestrator does not expose per-call hooks, so the budget is enforced
 * on this estimate, pro-rated for partial (top-up) runs; the quota
 * ledger records per-atom granularity.
 */
export const ESTIMATED_LLM_CALLS_PER_CONCEPT = 24;

/** Atoms shorter than this are treated as generation failures, never written. */
const MIN_ATOM_CONTENT_CHARS = 40;

/**
 * Consecutive concepts producing zero usable atoms trips the circuit
 * breaker. A handful of bad concepts is normal (a flaky call, a
 * template gap); a run of them back-to-back almost always means a
 * provider is down/misconfigured — the exact "everything fails but a
 * different, misleading error each time" pattern this job used to hit
 * silently. Pausing early (as a resumable QuotaExhaustedError, same
 * mechanism as budget exhaustion) beats burning the rest of the run's
 * budget on guaranteed failures.
 */
const FULL_FAILURE_CIRCUIT_BREAKER_THRESHOLD = 3;

/**
 * Concepts root — override the base with VIDHYA_CONCEPTS_ROOT (tests).
 * Joins the syllabus's `atomsSubdir` on top; GATE-MA's is '' (no
 * subdirectory), so the default call site is byte-identical to the
 * pre-generation-syllabi path.
 */
export function conceptsRoot(syllabus: Syllabus = currentSyllabus()): string {
  const base =
    process.env.VIDHYA_CONCEPTS_ROOT ||
    path.resolve(process.cwd(), 'modules/project-vidhya-content/concepts');
  return syllabus.atomsSubdir ? path.join(base, syllabus.atomsSubdir) : base;
}

/**
 * Resolve which syllabus this run targets. VIDHYA_SYLLABUS selects by id
 * (see generation-syllabi.ts); unset defaults to GATE-MA. An unknown id
 * throws with the full registered list — fail loud on a typo instead of
 * silently generating the wrong syllabus's concepts.
 */
export function currentSyllabus(): Syllabus {
  return getSyllabus(process.env.VIDHYA_SYLLABUS || DEFAULT_SYLLABUS_ID);
}

function atomFileName(atom_type: string): string {
  return `${atom_type.replace(/_/g, '-')}.md`;
}

/**
 * Which atom types is this concept still missing (empty array = fully
 * complete)? Replaces the old binary conceptHasAtoms() check so a
 * concept with, say, 8/11 atom types already present (from a prior
 * interrupted run, a hand-authored atom, or a partial earlier
 * generation) only regenerates the 3 it's missing, instead of being
 * skipped entirely (old behavior: "has ≥1 atom file" == done) or
 * regenerated in full (which would clobber good existing atoms).
 */
export function missingAtomTypes(concept_id: string, syllabus: Syllabus = currentSyllabus()): AtomType[] {
  try {
    const atomsDir = path.join(conceptsRoot(syllabus), concept_id, 'atoms');
    if (!fs.existsSync(atomsDir) || !fs.statSync(atomsDir).isDirectory()) {
      return [...ALL_ATOM_TYPES];
    }
    const present = new Set(
      fs
        .readdirSync(atomsDir)
        .filter((f) => f.endsWith('.md'))
        .map((f) => f.replace(/\.md$/, '').replace(/-/g, '_')),
    );
    return ALL_ATOM_TYPES.filter((t) => !present.has(t));
  } catch {
    return [...ALL_ATOM_TYPES];
  }
}

/** Does this concept already have at least one atom file on disk? (kept for callers/tests that only need the binary check.) */
export function conceptHasAtoms(concept_id: string, syllabus: Syllabus = currentSyllabus()): boolean {
  return missingAtomTypes(concept_id, syllabus).length < ALL_ATOM_TYPES.length;
}

/**
 * Order concepts so prerequisites generate before dependents (Kahn's
 * algorithm over concept-graph.ts's `prerequisites` edges, restricted to
 * the working set). Ordering only — prerequisite atoms are not fed into
 * generation prompts (deferred; see module docblock). A prerequisite
 * that isn't in the working set (already generated, or outside the
 * concept graph) is treated as already satisfied. Cycles or any node the
 * pass doesn't reach are appended in original order at the end — this
 * only ever reorders the list, it never drops a concept.
 */
export function topoSortByPrerequisites(concepts: ConceptNode[]): ConceptNode[] {
  const ids = new Set(concepts.map((c) => c.id));
  const byId = new Map(concepts.map((c) => [c.id, c]));
  const indegree = new Map<string, number>();
  const dependents = new Map<string, string[]>();

  for (const c of concepts) {
    indegree.set(c.id, 0);
    dependents.set(c.id, []);
  }
  for (const c of concepts) {
    for (const prereq of c.prerequisites) {
      if (!ids.has(prereq)) continue; // outside working set — treat as already satisfied
      indegree.set(c.id, (indegree.get(c.id) ?? 0) + 1);
      dependents.get(prereq)!.push(c.id);
    }
  }

  const queue: string[] = concepts.filter((c) => indegree.get(c.id) === 0).map((c) => c.id);
  const ordered: ConceptNode[] = [];
  const seen = new Set<string>();

  while (queue.length) {
    const id = queue.shift()!;
    if (seen.has(id)) continue;
    seen.add(id);
    ordered.push(byId.get(id)!);
    for (const dep of dependents.get(id) ?? []) {
      const remaining = (indegree.get(dep) ?? 0) - 1;
      indegree.set(dep, remaining);
      if (remaining === 0) queue.push(dep);
    }
  }

  // Cycle guard: append anything the pass didn't reach, original order.
  for (const c of concepts) {
    if (!seen.has(c.id)) ordered.push(c);
  }

  return ordered;
}

/** Serialize one generated atom in the existing authored-atom file format. */
export function renderAtomFile(atom: GeneratedAtom): string {
  const examIds = JSON.stringify(atom.exam_ids && atom.exam_ids.length ? atom.exam_ids : ['*']);
  return [
    '---',
    `id: ${atom.atom_id}`,
    `concept_id: ${atom.concept_id}`,
    `atom_type: ${atom.atom_type}`,
    `bloom_level: ${atom.bloom_level}`,
    `difficulty: ${atom.difficulty}`,
    `exam_ids: ${examIds}`,
    `generated_by: concept-orchestrator`,
    `generated_at: ${atom.meta?.generated_at ?? new Date().toISOString()}`,
    '---',
    '',
    atom.content.trim(),
    '',
  ].join('\n');
}

function atomicWriteFile(file: string, content: string): void {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = `${file}.tmp-${process.pid}`;
  fs.writeFileSync(tmp, content);
  fs.renameSync(tmp, file);
}

/** Minimal meta.yaml so a freshly generated concept dir is self-describing. */
function ensureMetaYaml(concept_id: string, label: string, syllabus: Syllabus): void {
  const metaPath = path.join(conceptsRoot(syllabus), concept_id, 'meta.yaml');
  if (fs.existsSync(metaPath)) return;
  atomicWriteFile(
    metaPath,
    [
      `concept_id: ${concept_id}`,
      `title: ${label}`,
      `licence: MIT`,
      `contributor: concept-orchestrator (content-generation job)`,
      '',
    ].join('\n'),
  );
}

// Injectable sleeper for the inter-batch breather (tests).
let _sleep: (ms: number) => Promise<void> = (ms) => new Promise((r) => setTimeout(r, ms));
const BATCH_BREATHER_MS = 500;

async function run(ctx: JobContext): Promise<void> {
  const syllabus = currentSyllabus();
  const allConcepts = syllabus.concepts;

  const missingByConcept = new Map<string, AtomType[]>();
  for (const c of allConcepts) {
    const missing = missingAtomTypes(c.id, syllabus);
    if (missing.length > 0) missingByConcept.set(c.id, missing);
  }

  const incomplete = topoSortByPrerequisites(
    allConcepts.filter((c) => missingByConcept.has(c.id)),
  );
  const topUpCount = incomplete.filter(
    (c) => (missingByConcept.get(c.id)?.length ?? 0) < ALL_ATOM_TYPES.length,
  ).length;
  ctx.log(
    `[${syllabus.id}] ${incomplete.length}/${allConcepts.length} concepts have missing atoms ` +
      `(${topUpCount} partial top-ups, ${incomplete.length - topUpCount} from scratch), ` +
      `prerequisite-ordered — generating`,
  );

  let llmCallsUsed = 0;
  let processedThisRun = 0;
  let consecutiveFullFailures = 0;
  const cap = ctx.limits.content_max_llm_calls_per_run;
  const batchSize = ctx.limits.gemini_batch_size;

  await ctx.processItems(
    incomplete.map((c) => ({ key: c.id, concept: c })),
    async ({ concept }) => {
      const atom_types = missingByConcept.get(concept.id) ?? ALL_ATOM_TYPES;
      // Pro-rate the per-concept budget estimate for top-ups so a run of
      // mostly-complete concepts isn't charged the full 24-call estimate
      // for regenerating 1-2 missing atom types.
      const estimatedCalls = Math.max(
        1,
        Math.round((ESTIMATED_LLM_CALLS_PER_CONCEPT * atom_types.length) / ALL_ATOM_TYPES.length),
      );

      if (llmCallsUsed + estimatedCalls > cap) {
        throw new QuotaExhaustedError(
          `CONTENT_MAX_LLM_CALLS_PER_RUN budget exhausted (~${llmCallsUsed}/${cap} estimated calls) — ` +
            `job paused with a resumable checkpoint; restart to continue from ${concept.id}`,
        );
      }

      // Breather between provider batches (GEMINI_BATCH_SIZE concepts).
      if (processedThisRun > 0 && processedThisRun % batchSize === 0) {
        await _sleep(BATCH_BREATHER_MS);
      }
      processedThisRun++;

      const draft = await generateConcept({
        concept_id: concept.id,
        topic_family: concept.topic,
        dry_run: false,
        atom_types,
      });
      llmCallsUsed += estimatedCalls;

      // Ledger: one line per atom attempt. Provider approximated from the
      // atom's source cascade (per-call hooks are a deferred orchestrator
      // change). Cost is the atom's meta.cost_usd — the SAME per-atom-type
      // estimate (ESTIMATED_COST_USD in concept-orchestrator/orchestrator.ts)
      // already trusted platform-wide for budget gating (canSpend/recordSpend)
      // — not a new estimation method, just the existing one finally surfaced
      // to the cost dashboard. Atoms rejected before any generation attempt
      // (cost-cap pre-checks) carry meta.cost_usd === 0, which is correct:
      // no LLM call was made for them.
      for (const atom of draft.atoms) {
        const provider = atom.meta?.source_cascade?.includes('llm-gemini') ? 'gemini' : 'claude';
        ctx.recordProviderCall(provider, true, atom.meta?.cost_usd);
      }
      for (const atom of draft.rejected_atoms) {
        const provider = atom.meta?.source_cascade?.includes('llm-gemini') ? 'gemini' : 'claude';
        ctx.recordProviderCall(provider, false, atom.meta?.cost_usd);
      }

      // FILE mode: persist only atoms with real content. Empty or
      // near-empty bodies are failures, never written — stub atoms are
      // banned by the realignment plan.
      const writable = draft.atoms.filter(
        (a) => a.content && a.content.trim().length >= MIN_ATOM_CONTENT_CHARS,
      );
      if (writable.length === 0) {
        consecutiveFullFailures++;
        if (consecutiveFullFailures >= FULL_FAILURE_CIRCUIT_BREAKER_THRESHOLD) {
          throw new QuotaExhaustedError(
            `${consecutiveFullFailures} concepts in a row produced zero usable atoms — ` +
              `this almost always means a provider is down, quota-exhausted, or misconfigured ` +
              `rather than per-concept bad luck. Job paused with a resumable checkpoint at ` +
              `${concept.id}; check the preflight warnings above / provider dashboards, then ` +
              `rerun to resume.`,
          );
        }
        throw new Error(
          `no usable atoms generated for ${concept.id} ` +
            `(${draft.atoms.length} accepted, ${draft.rejected_atoms.length} rejected) — nothing written`,
        );
      }
      consecutiveFullFailures = 0;

      ensureMetaYaml(concept.id, concept.label, syllabus);
      const atomsDir = path.join(conceptsRoot(syllabus), concept.id, 'atoms');
      for (const atom of writable) {
        atomicWriteFile(path.join(atomsDir, atomFileName(atom.atom_type)), renderAtomFile(atom));
      }
      reloadAtoms(); // bust the atom-loader cache so lessons pick the new files up

      return {
        atoms_written: writable.length,
        atoms_rejected: draft.rejected_atoms.length,
        cost_usd: draft.total_cost_usd,
      };
    },
  );

  ctx.log(`run finished — ~${llmCallsUsed} estimated LLM calls used`);
}

export const contentGenerationJob: JobDefinition = {
  name: CONTENT_GENERATION_JOB,
  description:
    'Generate atoms (via the concept-orchestrator, FILE mode) for every concept-graph concept ' +
    'missing atoms — full or partial (top-up), prerequisite-ordered; budgeted, batched, checkpointed per concept. ' +
    'Syllabus-agnostic: select with VIDHYA_SYLLABUS=<id> (defaults to gate-ma).',
  async preflight(): Promise<string | null> {
    // Fail loud on an unknown VIDHYA_SYLLABUS id before touching any
    // provider or DB — same "surface the problem upfront, not 8 concepts
    // in" principle as the provider/DB checks below.
    const requestedSyllabus = process.env.VIDHYA_SYLLABUS || DEFAULT_SYLLABUS_ID;
    if (!listSyllabusIds().includes(requestedSyllabus)) {
      return (
        `VIDHYA_SYLLABUS="${requestedSyllabus}" is not a registered syllabus — ` +
        `the content-generation job refuses to start. Registered: ${listSyllabusIds().join(', ')}. ` +
        'Register one by adding data/curriculum/<exam-id>.yml — see docs/CURRICULUM-FRAMEWORK.md §6.'
      );
    }

    // A syllabus can be a REGISTERED exam (its YAML exists) with ZERO
    // concepts resolvable in concept-graph.ts yet — e.g. jee-main.yml is a
    // deliberate Phase-1 stub (its own header says so). Refuse with the
    // honest reason instead of silently iterating an empty concept list.
    const syllabus = getSyllabus(requestedSyllabus);
    if (syllabus.concepts.length === 0) {
      return (
        `VIDHYA_SYLLABUS="${requestedSyllabus}" is registered (data/curriculum/${requestedSyllabus}.yml ` +
        `exists) but 0 of its ${syllabus.unresolvedConceptIds.length} linked concepts have ` +
        'concept-graph.ts entries yet — nothing to generate. See docs/CURRICULUM-FRAMEWORK.md §6 ' +
        '("Adding a concept: one line in concept-graph.ts, then link to exams") to add concepts for this exam.'
      );
    }

    if (!process.env.GEMINI_API_KEY) {
      return (
        'GEMINI_API_KEY is not set — the content-generation job refuses to start. ' +
        'Generating stub/placeholder atoms is banned by the content-pipeline realignment plan; ' +
        'set GEMINI_API_KEY and retry.'
      );
    }

    // Live per-provider health check — catches an invalid/expired/quota-
    // exhausted key BEFORE the job burns its LLM-call budget churning
    // through per-concept failures with a confusing, potentially
    // misattributed error (see orchestrator.ts's callLlm() fix).
    const results = await preflightProviders();
    const gemini = results.find((r) => r.provider === 'gemini');
    if (gemini && !gemini.ok) {
      return (
        `GEMINI_API_KEY is set but failed a live preflight call (${gemini.error}) — ` +
        'the content-generation job refuses to start since Gemini is the required primary ' +
        'provider. Check the key / quota and retry.'
      );
    }

    for (const r of results) {
      if (r.provider !== 'gemini' && !r.ok) {
        // Non-Gemini providers (e.g. Anthropic) back consensus/second-opinions,
        // not primary generation — warn but don't block the run.
        console.warn(
          `[content-generation preflight] ${r.provider} failed a live health check (${r.error}) — ` +
            'continuing without it; consensus/second-opinion atoms may fall back to a single provider.',
        );
      }
    }

    // DB corner case: DATABASE_URL set but unreachable (DB not created, bad
    // connection string, etc). This is a WARNING only, never a mutation —
    // this preflight can run inside the long-lived server process (admin
    // job routes), where unsetting process.env.DATABASE_URL here would
    // break DB access for every other concurrent request. The standalone
    // CLI entrypoint (job-cli.ts) additionally acts on this to avoid
    // per-concept connection-timeout latency; see the comment there.
    if (process.env.DATABASE_URL) {
      const db = await preflightDatabase();
      if (!db.ok) {
        console.warn(
          `[content-generation preflight] DATABASE_URL is set but unreachable (${db.error}) — ` +
            'DB-dependent features (atom versioning, cost ledger, PYQ grounding) will no-op ' +
            'per-call rather than block the run; atoms still persist as files. Create the ' +
            'database or fix the connection string if you need DB features.',
        );
      }
    }

    return null;
  },
  run,
};

registerJob(contentGenerationJob);

export const __testing = {
  setSleepForTests(fn: (ms: number) => Promise<void>): () => void {
    const prev = _sleep;
    _sleep = fn;
    return () => {
      _sleep = prev;
    };
  },
};
