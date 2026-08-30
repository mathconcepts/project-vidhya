/**
 * buildContentBundle — importable core of scripts/build-bundle.ts.
 *
 * Merges every content source into frontend/public/data/content-bundle.json.
 * This is what the Tier-0 resolver reads. Run after scrape + generate +
 * explainers (via `npm run content:bundle`, or in-process from the nightly
 * content chain — see below).
 *
 * Extracted from scripts/build-bundle.ts (content-pipeline realignment plan,
 * deferred TODO: "Export build-bundle logic as an importable function so the
 * nightly chain can rebuild the bundle in-process"). scripts/ sits outside
 * the tsc rootDir (tsconfig.json `include: ["src/**\/*"]`), so `src/` can
 * never import it without breaking `npm run build` — the fix is the reverse
 * direction: the logic lives here in `src/content/`, and
 * scripts/build-bundle.ts becomes a thin CLI wrapper that imports it
 * (the same established pattern as scripts/verify-wolfram-batch.ts wrapping
 * src/services/wolfram-service.ts). src/jobs/nightly-content-chain.ts can
 * now call this directly instead of shelling out or skipping the rebuild.
 *
 * Behavior is unchanged from the original script: same inputs, same output
 * shape, same dedup-by-fingerprint logic, same console output for CLI
 * parity. The only addition is a return value (BuildBundleResult) so
 * callers other than the CLI (e.g. the nightly chain's summary line) get a
 * structured result instead of having to scrape stdout.
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { ALL_CONCEPTS } from '../constants/concept-graph';

const TOPIC_NOTES_EXCERPT_CHARS = 2000;

/**
 * Every real concept id (src/constants/concept-graph.ts, loaded from
 * data/curriculum/gate-ma.yml). The only thing a `concept_id` /
 * `concept_ids` entry is ever allowed to be — never a topic label
 * ('linear-algebra'), never a plausible-looking-but-unregistered id
 * ('matrix-rank' — the real one is 'rank-nullity'). Both of those exact
 * bugs shipped into content-bundle.json before this guard existed: the
 * topic-label one from this file's own `concept_id: p.concept_id ||
 * p.topic` fallback (removed below), the unregistered one from raw
 * corpus JSONL passed through unchecked. `InvalidConceptIdError` below is
 * how both are refused going forward.
 */
const VALID_CONCEPT_IDS = new Set(ALL_CONCEPTS.map((c) => c.id));

export class InvalidConceptIdError extends Error {
  constructor(
    public readonly conceptId: string,
    public readonly problemId: string | undefined,
    public readonly source: string,
  ) {
    super(
      `Invalid concept id "${conceptId}" on problem "${problemId ?? '(no id)'}" (source: ${source}) — ` +
      `not a real concept in ALL_CONCEPTS (src/constants/concept-graph.ts). A topic label or an ` +
      `unregistered id must never be written as a concept_id/concept_ids entry.`,
    );
    this.name = 'InvalidConceptIdError';
  }
}

/**
 * Throws InvalidConceptIdError the moment ANY concept id a problem is
 * about to carry — its scalar `concept_id` primary or any entry of its
 * `concept_ids` array — isn't a real, registered concept. Called before
 * every push in `collectProblems` below, for every source (pyq-bank.json,
 * scraped corpus JSONL, CI-generated batches): "every concept id written
 * into either bundle" means every source, not just the ones this lane
 * authored. Callers catch this per-item (see collectProblems) so ONE bad
 * row is refused and skipped — logged, not silently dropped — without
 * aborting the rest of that source's otherwise-valid problems.
 */
export function validateConceptIds(problem: { id?: string; concept_id?: unknown; concept_ids?: unknown }, source: string): void {
  if (typeof problem.concept_id === 'string' && !VALID_CONCEPT_IDS.has(problem.concept_id)) {
    throw new InvalidConceptIdError(problem.concept_id, problem.id, source);
  }
  if (Array.isArray(problem.concept_ids)) {
    for (const conceptId of problem.concept_ids) {
      if (typeof conceptId === 'string' && !VALID_CONCEPT_IDS.has(conceptId)) {
        throw new InvalidConceptIdError(conceptId, problem.id, source);
      }
    }
  }
}

/**
 * Some sources (scraped corpus JSONL, older generated batches) only ever
 * carried a single scalar `concept_id`, never a `concept_ids` array — that
 * field didn't exist yet when they were produced. Synthesize the
 * one-element array from the already-known scalar rather than leaving it
 * absent: it states nothing new (concept_ids[0] === concept_id, same
 * "primary first" contract every other source honors), and it's what lets
 * a concept_ids-only consumer (e.g. buildPyqConceptIndex,
 * src/db/pyq-bank-index.ts) find a single-concept corpus problem too. A
 * problem with no concept_id at all (unmapped) is left untouched — this
 * never guesses a concept, only restates one already present.
 */
function withConceptIdsFallback<T extends { concept_id?: unknown; concept_ids?: unknown }>(p: T): T {
  if (!p.concept_ids && typeof p.concept_id === 'string') {
    return { ...p, concept_ids: [p.concept_id] };
  }
  return p;
}

export interface BuildContentBundleOptions {
  /** Defaults to <cwd>/frontend/public/data */
  feDataDir?: string;
  /** Defaults to <cwd>/data/raw */
  rawDir?: string;
  /** Defaults to <cwd>/data/generated */
  genDir?: string;
  /** Defaults to <cwd>/data/courses/gate-em/topics */
  topicsDir?: string;
  /** Defaults to <cwd>/data/practice-items */
  practiceItemsDir?: string;
  /** Suppress console output (e.g. when called from the nightly chain). Defaults to false — CLI callers keep the original chatty output. */
  quiet?: boolean;
}

export interface BuildContentBundleResult {
  outPath: string;
  total_problems: number;
  total_explainers: number;
  total_topic_notes: number;
  wolfram_verified: number;
  by_topic: Record<string, number>;
  by_difficulty: Record<string, number>;
  size_bytes: number;
}

function fingerprint(problem: any): string {
  const normalized = `${problem.question_text}|${problem.correct_answer}`
    .toLowerCase()
    .replace(/\s+/g, '');
  return crypto.createHash('sha256').update(normalized).digest('hex').slice(0, 16);
}

function normalizeDifficulty(d: any): number {
  if (typeof d === 'number') return d;
  if (d === 'easy') return 0.25;
  if (d === 'medium') return 0.5;
  if (d === 'hard') return 0.75;
  return 0.5;
}

function collectProblems(feDataDir: string, rawDir: string, genDir: string, log: (msg: string) => void): any[] {
  const problems: any[] = [];
  const seen = new Set<string>();

  // 1. Legacy pyq-bank.json
  const pyqPath = path.join(feDataDir, 'pyq-bank.json');
  if (fs.existsSync(pyqPath)) {
    try {
      const pyq = JSON.parse(fs.readFileSync(pyqPath, 'utf-8'));
      let skippedInvalid = 0;
      for (const p of pyq.problems || []) {
        const fp = fingerprint(p);
        if (seen.has(fp)) continue;
        // p.concept_id / p.concept_ids pass through EXACTLY as pyq-bank.json
        // wrote them (src/db/pyq-concept-mapper.ts's mapper output — real
        // concepts only, or absent when honestly unmapped). Previously this
        // spot fell back to `p.concept_id || p.topic`, which is exactly how
        // the topic label 'linear-algebra' ended up written as a fake
        // concept id: a "discoverability" shortcut that silently lied about
        // what the question tests. An unmapped question now stays
        // concept_id-less here too, same as it already is in pyq-bank.json —
        // never guessed.
        const candidate = withConceptIdsFallback({
          ...p,
          difficulty: normalizeDifficulty(p.difficulty),
          source: p.source || 'pyq-bank',
          verified: true,
          wolfram_verified: p.wolfram_verified || false,
          fingerprint: fp,
        });
        try {
          validateConceptIds(candidate, 'pyq-bank.json');
        } catch (err) {
          if (err instanceof InvalidConceptIdError) {
            log(`  ⚠ pyq-bank.json: refusing "${candidate.id}" — ${err.message}`);
            skippedInvalid++;
            continue;
          }
          throw err;
        }
        seen.add(fp);
        problems.push(candidate);
      }
      log(`  ✓ pyq-bank.json: ${(pyq.problems?.length || 0) - skippedInvalid} problems${skippedInvalid ? ` (${skippedInvalid} refused for an invalid concept id)` : ''}`);
    } catch (err) {
      log(`  ⚠ pyq-bank.json: ${(err as Error).message}`);
    }
  }

  // 2. Scraped corpus JSONL
  if (fs.existsSync(rawDir)) {
    const files = fs.readdirSync(rawDir).filter((f) => f.endsWith('.jsonl'));
    for (const file of files) {
      const content = fs.readFileSync(path.join(rawDir, file), 'utf-8');
      const lines = content.split('\n').filter(Boolean);
      let added = 0;
      let refusedInvalid = 0;
      for (const line of lines) {
        try {
          const rec = JSON.parse(line);
          if (rec.kind !== 'problem') continue;
          const meta = rec.metadata || {};
          if (!meta.question_text && !rec.raw_text) continue;
          const p = withConceptIdsFallback({
            id: meta.id || fingerprint(meta),
            question_text: meta.question_text || rec.raw_text,
            correct_answer: meta.correct_answer || '',
            options: meta.options,
            explanation: meta.explanation,
            topic: meta.topic,
            // meta.concept_id comes straight from the scraper/annotator with
            // no guarantee it's a real registered concept — validated below
            // before this row is allowed into the bundle at all. These
            // sources never carry a concept_ids array of their own (only
            // ever one concept per scraped item), so withConceptIdsFallback
            // synthesizes the one-element array from it.
            concept_id: meta.concept_id,
            difficulty: normalizeDifficulty(meta.difficulty),
            marks: meta.marks || 2,
            year: meta.year,
            source: rec.source,
            source_url: rec.source_url,
            license: rec.license,
            verified: true,
            wolfram_verified: false,
          });
          const fp = fingerprint(p);
          if (seen.has(fp) || !p.correct_answer) continue;
          try {
            validateConceptIds(p, file);
          } catch (err) {
            if (err instanceof InvalidConceptIdError) {
              log(`  ⚠ ${file}: refusing "${p.id}" — ${err.message}`);
              refusedInvalid++;
              continue;
            }
            throw err;
          }
          seen.add(fp);
          problems.push({ ...p, fingerprint: fp });
          added++;
        } catch {
          /* skip malformed line — invalid concept ids are already caught
             and logged above, so anything reaching here is a genuine
             JSON/shape problem, same as before this change. */
        }
      }
      log(`  ✓ ${file}: +${added} problems${refusedInvalid ? ` (${refusedInvalid} refused for an invalid concept id)` : ''}`);
    }
  }

  // 3. Generated (CI-produced, verified)
  if (fs.existsSync(genDir)) {
    const files = fs.readdirSync(genDir).filter((f) => f.endsWith('.json'));
    for (const file of files) {
      try {
        const gen = JSON.parse(fs.readFileSync(path.join(genDir, file), 'utf-8'));
        let added = 0;
        let refusedInvalid = 0;
        for (const p of gen.problems || []) {
          if (!p.verified) continue; // skip unverified
          const fp = fingerprint(p);
          if (seen.has(fp)) continue;
          const candidate = withConceptIdsFallback({
            ...p,
            difficulty: normalizeDifficulty(p.difficulty),
            source: 'generated',
            fingerprint: fp,
          });
          try {
            validateConceptIds(candidate, file);
          } catch (err) {
            if (err instanceof InvalidConceptIdError) {
              log(`  ⚠ ${file}: refusing "${candidate.id}" — ${err.message}`);
              refusedInvalid++;
              continue;
            }
            throw err;
          }
          seen.add(fp);
          problems.push(candidate);
          added++;
        }
        log(`  ✓ ${file}: +${added} verified generated problems${refusedInvalid ? ` (${refusedInvalid} refused for an invalid concept id)` : ''}`);
      } catch (err) {
        log(`  ⚠ ${file}: ${(err as Error).message}`);
      }
    }
  }

  return problems;
}

/**
 * 4. Authored, server-gradable practice items (data/practice-items/*.json —
 *    the 505-item bank `check-la-walkthrough`/`FileLearningObjectCatalog`
 *    already serve through `GET /api/practice/item/:id`, on every deploy
 *    shape, DB or none — see the T21 comment on `getLearningObjectCatalog()`
 *    in learning-object-catalog-pg.ts).
 *
 *    Before this, these ids never reached the client at all: the Tier-0
 *    resolver only ever draws from `content-bundle.json`'s `problems[]`,
 *    which this bank was never folded into. A student browsing Smart
 *    Practice was therefore capped at whatever the (much smaller) PYQ bank
 *    happened to carry for that concept — bug #4 from live QA
 *    ("only saw 10/15 questions").
 *
 *    Deliberately NOT copied here: `correct_answer` / `options` /
 *    `answer_index` / `answer_indices` / `answer_range` / `solution_steps`.
 *    `content-bundle.json` ships to every browser as a public static file —
 *    unlike `GET /api/practice/item/:id`'s deliberate answer-key withholding
 *    (server-only, never serialized), putting the key here would hand it to
 *    any student who opens devtools, defeating the entire point of routing
 *    these ids to `/attempt/:id` for real grading. The resolver only needs
 *    enough to MATCH (concept, difficulty, topic) and an id; SmartPracticePage
 *    resolves that id against `GET /api/practice/item/:id` and redirects to
 *    `/attempt/:id` before ever reading `problem.correct_answer` for a
 *    gradable hit — see SmartPracticePage.tsx's Wave 11 hand-off comment.
 */
function collectPracticeItems(practiceItemsDir: string, log: (msg: string) => void): any[] {
  const problems: any[] = [];
  if (!fs.existsSync(practiceItemsDir)) {
    log('  ⚠ practice-items dir missing — bundle ships without the authored bank');
    return problems;
  }
  const files = fs.readdirSync(practiceItemsDir).filter((f) => f.endsWith('.json'));
  for (const file of files) {
    try {
      const bank = JSON.parse(fs.readFileSync(path.join(practiceItemsDir, file), 'utf-8'));
      let added = 0;
      let refusedInvalid = 0;
      for (const it of bank.items || []) {
        if (!it.id || !it.question_text) continue;
        const candidate = withConceptIdsFallback({
          id: it.id,
          question_text: it.question_text,
          topic: it.topic,
          concept_id: it.concept_id,
          difficulty: normalizeDifficulty(it.difficulty),
          marks: it.marks,
          source: 'practice-items',
          verified: true,
          wolfram_verified: false,
          gradable: true,
        });
        try {
          validateConceptIds(candidate, file);
        } catch (err) {
          if (err instanceof InvalidConceptIdError) {
            log(`  ⚠ ${file}: refusing "${candidate.id}" — ${err.message}`);
            refusedInvalid++;
            continue;
          }
          throw err;
        }
        problems.push({ ...candidate, fingerprint: fingerprint(candidate) });
        added++;
      }
      log(`  ✓ ${file}: +${added} gradable practice items${refusedInvalid ? ` (${refusedInvalid} refused for an invalid concept id)` : ''}`);
    } catch (err) {
      log(`  ⚠ ${file}: ${(err as Error).message}`);
    }
  }
  return problems;
}

function collectExplainers(feDataDir: string, log: (msg: string) => void): Record<string, any> {
  const expPath = path.join(feDataDir, 'explainers.json');
  if (!fs.existsSync(expPath)) {
    log('  ⚠ explainers.json missing — run build-explainers.ts first');
    return {};
  }
  try {
    const data = JSON.parse(fs.readFileSync(expPath, 'utf-8'));
    log(`  ✓ explainers.json: ${Object.keys(data.by_concept || {}).length} concepts`);
    return data.by_concept || {};
  } catch (err) {
    log(`  ⚠ explainers.json: ${(err as Error).message}`);
    return {};
  }
}

/**
 * Per-topic lecture-notes excerpts, keyed by concept-graph topic id
 * (dir `01-linear-algebra` → key `linear-algebra`). First ~2000 chars
 * each — enough for the frontend resolver to serve real topic prose
 * without bloating the bundle. Missing dir/files are skipped silently.
 */
function collectTopicNotes(topicsDir: string, log: (msg: string) => void): Record<string, string> {
  const notes: Record<string, string> = {};
  if (!fs.existsSync(topicsDir)) {
    log('  ⚠ topics dir missing — bundle ships without topic_notes');
    return notes;
  }
  for (const entry of fs.readdirSync(topicsDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const m = /^\d+-(.+)$/.exec(entry.name);
    if (!m) continue;
    const topicId = m[1];
    const file = path.join(topicsDir, entry.name, 'lecture-notes.md');
    if (!fs.existsSync(file)) continue;
    try {
      const raw = fs.readFileSync(file, 'utf-8');
      const excerpt = raw.slice(0, TOPIC_NOTES_EXCERPT_CHARS).trim();
      if (excerpt) {
        notes[topicId] = raw.length > TOPIC_NOTES_EXCERPT_CHARS ? `${excerpt}\n\n…` : excerpt;
        log(`  ✓ ${entry.name}/lecture-notes.md: ${excerpt.length} chars`);
      }
    } catch (err) {
      log(`  ⚠ ${entry.name}/lecture-notes.md: ${(err as Error).message}`);
    }
  }
  return notes;
}

/**
 * Build (or rebuild) frontend/public/data/content-bundle.json from every
 * available content source. Safe to call repeatedly (idempotent — always
 * a full rebuild from current sources on disk, never an incremental patch).
 */
export function buildContentBundle(options: BuildContentBundleOptions = {}): BuildContentBundleResult {
  const feDataDir = options.feDataDir ?? path.resolve(process.cwd(), 'frontend/public/data');
  const rawDir = options.rawDir ?? path.resolve(process.cwd(), 'data/raw');
  const genDir = options.genDir ?? path.resolve(process.cwd(), 'data/generated');
  const topicsDir = options.topicsDir ?? path.resolve(process.cwd(), 'data/courses/gate-em/topics');
  const practiceItemsDir = options.practiceItemsDir ?? path.resolve(process.cwd(), 'data/practice-items');
  const outPath = path.join(feDataDir, 'content-bundle.json');
  const log = options.quiet ? () => {} : (msg: string) => console.log(msg);

  fs.mkdirSync(feDataDir, { recursive: true });
  log('Building content bundle...\n');

  log('Collecting problems:');
  const problems = collectProblems(feDataDir, rawDir, genDir, log);

  log('\nCollecting authored practice items:');
  problems.push(...collectPracticeItems(practiceItemsDir, log));

  log('\nCollecting explainers:');
  const explainers = collectExplainers(feDataDir, log);

  log('\nCollecting topic notes:');
  const topic_notes = collectTopicNotes(topicsDir, log);

  // Stats
  const by_topic: Record<string, number> = {};
  const by_difficulty: Record<string, number> = {};
  let wolfram_verified = 0;
  for (const p of problems) {
    by_topic[p.topic || 'unknown'] = (by_topic[p.topic || 'unknown'] || 0) + 1;
    const db = p.difficulty < 0.33 ? 'easy' : p.difficulty < 0.66 ? 'medium' : 'hard';
    by_difficulty[db] = (by_difficulty[db] || 0) + 1;
    if (p.wolfram_verified) wolfram_verified++;
  }

  const bundle = {
    version: 3,
    generated_at: new Date().toISOString(),
    problems,
    explainers,
    topic_notes,
    stats: {
      total_problems: problems.length,
      total_explainers: Object.keys(explainers).length,
      total_topic_notes: Object.keys(topic_notes).length,
      wolfram_verified,
      by_topic,
      by_difficulty,
    },
  };

  fs.writeFileSync(outPath, JSON.stringify(bundle, null, 2));
  const size_bytes = fs.statSync(outPath).size;

  log(`\n✓ Bundle written: ${outPath}`);
  log(`  ${problems.length} problems, ${Object.keys(explainers).length} explainers, ${Object.keys(topic_notes).length} topic notes`);
  log(`  ${wolfram_verified} Wolfram-verified`);
  log(`  Size: ${(size_bytes / 1024).toFixed(1)} KB`);
  log(`  Topics: ${Object.entries(by_topic).map(([t, c]) => `${t}(${c})`).join(', ')}`);

  return {
    outPath,
    total_problems: problems.length,
    total_explainers: Object.keys(explainers).length,
    total_topic_notes: Object.keys(topic_notes).length,
    wolfram_verified,
    by_topic,
    by_difficulty,
    size_bytes,
  };
}
