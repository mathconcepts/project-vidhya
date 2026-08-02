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

const TOPIC_NOTES_EXCERPT_CHARS = 2000;

export interface BuildContentBundleOptions {
  /** Defaults to <cwd>/frontend/public/data */
  feDataDir?: string;
  /** Defaults to <cwd>/data/raw */
  rawDir?: string;
  /** Defaults to <cwd>/data/generated */
  genDir?: string;
  /** Defaults to <cwd>/data/courses/gate-em/topics */
  topicsDir?: string;
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
      for (const p of pyq.problems || []) {
        const fp = fingerprint(p);
        if (seen.has(fp)) continue;
        seen.add(fp);
        problems.push({
          ...p,
          // Legacy problems often lack concept_id — use topic as fallback so they're discoverable
          concept_id: p.concept_id || p.topic,
          difficulty: normalizeDifficulty(p.difficulty),
          source: p.source || 'pyq-bank',
          verified: true,
          wolfram_verified: p.wolfram_verified || false,
          fingerprint: fp,
        });
      }
      log(`  ✓ pyq-bank.json: ${pyq.problems?.length || 0} problems`);
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
      for (const line of lines) {
        try {
          const rec = JSON.parse(line);
          if (rec.kind !== 'problem') continue;
          const meta = rec.metadata || {};
          if (!meta.question_text && !rec.raw_text) continue;
          const p = {
            id: meta.id || fingerprint(meta),
            question_text: meta.question_text || rec.raw_text,
            correct_answer: meta.correct_answer || '',
            options: meta.options,
            explanation: meta.explanation,
            topic: meta.topic,
            concept_id: meta.concept_id,
            difficulty: normalizeDifficulty(meta.difficulty),
            marks: meta.marks || 2,
            year: meta.year,
            source: rec.source,
            source_url: rec.source_url,
            license: rec.license,
            verified: true,
            wolfram_verified: false,
          };
          const fp = fingerprint(p);
          if (seen.has(fp) || !p.correct_answer) continue;
          seen.add(fp);
          problems.push({ ...p, fingerprint: fp });
          added++;
        } catch {
          /* skip malformed line */
        }
      }
      log(`  ✓ ${file}: +${added} problems`);
    }
  }

  // 3. Generated (CI-produced, verified)
  if (fs.existsSync(genDir)) {
    const files = fs.readdirSync(genDir).filter((f) => f.endsWith('.json'));
    for (const file of files) {
      try {
        const gen = JSON.parse(fs.readFileSync(path.join(genDir, file), 'utf-8'));
        let added = 0;
        for (const p of gen.problems || []) {
          if (!p.verified) continue; // skip unverified
          const fp = fingerprint(p);
          if (seen.has(fp)) continue;
          seen.add(fp);
          problems.push({
            ...p,
            difficulty: normalizeDifficulty(p.difficulty),
            source: 'generated',
            fingerprint: fp,
          });
          added++;
        }
        log(`  ✓ ${file}: +${added} verified generated problems`);
      } catch (err) {
        log(`  ⚠ ${file}: ${(err as Error).message}`);
      }
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
  const outPath = path.join(feDataDir, 'content-bundle.json');
  const log = options.quiet ? () => {} : (msg: string) => console.log(msg);

  fs.mkdirSync(feDataDir, { recursive: true });
  log('Building content bundle...\n');

  log('Collecting problems:');
  const problems = collectProblems(feDataDir, rawDir, genDir, log);

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
