// @ts-nocheck
/**
 * Upload & Consolidate GATE Engineering Mathematics Materials
 *
 * Compiles 150 topic MCQs, 50 SQL seed PYQs, 30 Supabase seed PYQs, and 36 pilot items
 * into frontend/public/data/pyq-bank.json, verifies concept explainers, and builds the Tier-0
 * static content bundle frontend/public/data/content-bundle.json.
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { mapPyqToConceptIds } from '../src/db/pyq-concept-mapper';
import { TOPIC_DIR_ALIAS } from '../src/db/seed-static-pyqs';

// Inverse of TOPIC_DIR_ALIAS (canonical -> dirSlug), same as
// scripts/export-bundles.ts's DIR_TO_CANONICAL_TOPIC: the concept mapper's
// TAG_MAPS keys are the canonical post-alias topic ids ('transforms' /
// 'discrete'), not the raw content-file topic ('transform-theory' /
// 'discrete-mathematics') normalizeTopic() below preserves.
const DIR_TO_CANONICAL_TOPIC: Record<string, string> = Object.fromEntries(
  Object.entries(TOPIC_DIR_ALIAS).map(([canonical, dirSlug]) => [dirSlug, canonical]),
);

const ROOT_DIR = process.cwd();
const FE_DATA = path.resolve(ROOT_DIR, 'frontend/public/data');
const TOPICS_DIR = path.resolve(ROOT_DIR, 'data/courses/gate-em/topics');
const SEED_SQL_PATH = path.resolve(ROOT_DIR, 'scripts/seed-pyqs.sql');
const SUPABASE_SQL_PATH = path.resolve(ROOT_DIR, 'supabase/seeds/gate_em_pyqs.sql');
const PILOT_HTML_PATH = path.resolve(ROOT_DIR, '../GATE-EM-Sample/index.html');
const PYQ_BANK_PATH = path.join(FE_DATA, 'pyq-bank.json');

function fingerprint(problem: any): string {
  const qText = problem.question_text || problem.question || '';
  const cAns = String(problem.correct_answer || problem.ans || '');
  const normalized = `${qText}|${cAns}`.toLowerCase().replace(/\s+/g, '');
  return crypto.createHash('sha256').update(normalized).digest('hex').slice(0, 16);
}

function normalizeDifficulty(d: any): number {
  if (typeof d === 'number') return d;
  if (d === 'easy') return 0.25;
  if (d === 'medium') return 0.5;
  if (d === 'hard') return 0.75;
  return 0.5;
}

function normalizeTopic(t: string): string {
  if (!t) return 'linear-algebra';
  const topicLower = t.toLowerCase();
  if (topicLower.includes('la') || topicLower.includes('linear')) return 'linear-algebra';
  if (topicLower.includes('ca') || (topicLower.includes('calculus') && !topicLower.includes('vector'))) return 'calculus';
  if (topicLower.includes('od') || topicLower.includes('differential')) return 'differential-equations';
  if (topicLower.includes('cv') || topicLower.includes('complex')) return 'complex-variables';
  if (topicLower.includes('ps') || topicLower.includes('probab')) return 'probability-statistics';
  if (topicLower.includes('nm') || topicLower.includes('numeric')) return 'numerical-methods';
  if (topicLower.includes('transform')) return 'transform-theory';
  if (topicLower.includes('discrete')) return 'discrete-mathematics';
  if (topicLower.includes('graph')) return 'graph-theory';
  if (topicLower.includes('vector')) return 'vector-calculus';
  return t;
}

function parseSqlInserts(sqlContent: string, sourceName: string): any[] {
  const problems: any[] = [];
  const tupleRegex = /\('gate-engineering-maths',\s*(\d+),\s*'((?:''|[^'])*)',\s*'((?:''|[^'])*)',\s*'((?:''|[^'])*)',\s*'((?:''|[^'])*)',\s*'((?:''|[^'])*)',\s*'((?:''|[^'])*)',\s*(\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)\)/g;

  let match;
  while ((match = tupleRegex.exec(sqlContent)) !== null) {
    const year = parseInt(match[1]);
    const question_text = match[2].replace(/''/g, "'");
    const optionsRaw = match[3].replace(/''/g, "'");
    const correct_answer = match[4].replace(/''/g, "'");
    const explanation = match[5].replace(/''/g, "'");
    const topic = match[6].replace(/''/g, "'");
    const difficulty = match[7].replace(/''/g, "'");
    const marks = parseFloat(match[8]);
    const negative_marks = parseFloat(match[9]);

    let options = {};
    try {
      options = JSON.parse(optionsRaw);
    } catch {
      options = { raw: optionsRaw };
    }

    problems.push({
      id: `sql-${sourceName}-${problems.length + 1}`,
      year,
      question_text,
      options,
      correct_answer,
      explanation,
      topic: normalizeTopic(topic),
      difficulty: normalizeDifficulty(difficulty),
      marks,
      negative_marks,
      source: sourceName,
      verified: true
    });
  }
  return problems;
}

function parsePilotHtml(): any[] {
  const problems: any[] = [];
  if (!fs.existsSync(PILOT_HTML_PATH)) return problems;
  try {
    const content = fs.readFileSync(PILOT_HTML_PATH, 'utf-8');
    const itemsMatch = content.match(/const ITEMS = (\[[\s\S]*?\]);/);
    if (itemsMatch) {
      const rawItemsStr = itemsMatch[1];
      const cleanJson = rawItemsStr
        .replace(/([{,])\s*([a-zA-Z0-9_]+)\s*:/g, '$1"$2":')
        .replace(/'/g, '"');
      const items = JSON.parse(cleanJson);
      for (const item of items) {
        let corrAns = 'A';
        if (typeof item.ans === 'number' && item.opts && item.opts[item.ans]) {
          corrAns = String.fromCharCode(65 + item.ans);
        } else if (Array.isArray(item.ans)) {
          corrAns = String(item.ans[0]);
        }
        let optsObj: any = {};
        if (Array.isArray(item.opts)) {
          item.opts.forEach((o: string, idx: number) => {
            optsObj[String.fromCharCode(65 + idx)] = o;
          });
        }
        problems.push({
          id: `pilot-${item.id}`,
          question_text: item.q,
          options: optsObj,
          correct_answer: corrAns,
          explanation: item.sol,
          topic: normalizeTopic(item.t),
          difficulty: item.r ? (item.r > 1100 ? 0.75 : item.r > 1050 ? 0.5 : 0.25) : 0.5,
          marks: item.marks || 1,
          source: 'GATE-EM-Pilot-Sample',
          verified: true
        });
      }
    }
  } catch (err) {
    console.warn(`  ⚠ Failed parsing pilot sample: ${(err as Error).message}`);
  }
  return problems;
}

async function main() {
  console.log('=== Compiling & Uploading GATE Engineering Mathematics Materials ===\n');

  fs.mkdirSync(FE_DATA, { recursive: true });

  const allCollected: any[] = [];
  const seenFp = new Set<string>();

  // 1. Topic MCQs (150 questions)
  if (fs.existsSync(TOPICS_DIR)) {
    const topicDirs = fs.readdirSync(TOPICS_DIR);
    let topicMcqCount = 0;
    for (const d of topicDirs) {
      const mcqFile = path.join(TOPICS_DIR, d, 'mcqs.json');
      if (fs.existsSync(mcqFile)) {
        try {
          const raw = JSON.parse(fs.readFileSync(mcqFile, 'utf-8'));
          const questions = raw.questions || (Array.isArray(raw) ? raw : []);
          for (const q of questions) {
            const questionText = q.question || q.question_text || '';
            const fileTopic = q.topic || d.replace(/^\d+-/, '');
            // Concept mapping (multi-concept mapping fix, mirrors
            // scripts/export-bundles.ts's seedPYQs()): q.concept_id was
            // ALWAYS undefined before — the source mcqs.json files have no
            // such field — so no exam question in this bundle was
            // discoverable by concept. mapPyqToConceptIds runs the same
            // "never a guess" tag/text mapper the DB seed path uses,
            // against the canonical (post-TOPIC_DIR_ALIAS) topic id.
            const canonicalTopic = DIR_TO_CANONICAL_TOPIC[fileTopic] || fileTopic;
            const conceptIds = mapPyqToConceptIds(canonicalTopic, q.tags, questionText);
            const problem = {
              id: q.id || `mcq-${d}-${topicMcqCount}`,
              year: q.year || 2024,
              question_text: questionText,
              options: q.options || {},
              correct_answer: q.correct_answer || 'A',
              explanation: q.explanation || q.solution || '',
              topic: normalizeTopic(fileTopic),
              concept_id: conceptIds[0] ?? undefined,
              concept_ids: conceptIds.length > 0 ? conceptIds : undefined,
              difficulty: normalizeDifficulty(q.difficulty),
              marks: q.marks || 2,
              negative_marks: q.negative_marks || -0.67,
              source: 'GATE-EM-Topic-MCQs',
              verified: true
            };
            const fp = fingerprint(problem);
            if (!seenFp.has(fp) && problem.question_text) {
              seenFp.add(fp);
              allCollected.push({ ...problem, fingerprint: fp });
              topicMcqCount++;
            }
          }
        } catch (err) {
          console.warn(`  ⚠ ${d}/mcqs.json error: ${(err as Error).message}`);
        }
      }
    }
    console.log(`✓ Collected ${topicMcqCount} topic MCQs across 10 topics`);
  }

  // 2. Parse SQL Seed Files
  if (fs.existsSync(SEED_SQL_PATH)) {
    const seedSqlContent = fs.readFileSync(SEED_SQL_PATH, 'utf-8');
    const sqlProbs = parseSqlInserts(seedSqlContent, 'GATE-PYQs-Seed');
    let addedSql = 0;
    for (const p of sqlProbs) {
      const fp = fingerprint(p);
      if (!seenFp.has(fp)) {
        seenFp.add(fp);
        allCollected.push({ ...p, fingerprint: fp });
        addedSql++;
      }
    }
    console.log(`✓ Parsed seed-pyqs.sql (+${addedSql} unique PYQs)`);
  }

  if (fs.existsSync(SUPABASE_SQL_PATH)) {
    const supaSqlContent = fs.readFileSync(SUPABASE_SQL_PATH, 'utf-8');
    const supaProbs = parseSqlInserts(supaSqlContent, 'Supabase-PYQs-Seed');
    let addedSupa = 0;
    for (const p of supaProbs) {
      const fp = fingerprint(p);
      if (!seenFp.has(fp)) {
        seenFp.add(fp);
        allCollected.push({ ...p, fingerprint: fp });
        addedSupa++;
      }
    }
    console.log(`✓ Parsed gate_em_pyqs.sql (+${addedSupa} unique PYQs)`);
  }

  // 3. Parse Pilot HTML
  const pilotProbs = parsePilotHtml();
  let addedPilot = 0;
  for (const p of pilotProbs) {
    const fp = fingerprint(p);
    if (!seenFp.has(fp)) {
      seenFp.add(fp);
      allCollected.push({ ...p, fingerprint: fp });
      addedPilot++;
    }
  }
  if (addedPilot > 0) {
    console.log(`✓ Parsed GATE-EM-Sample (+${addedPilot} unique pilot items)`);
  }

  // Write master pyq-bank.json
  const pyqBankData = {
    version: 2,
    exported_at: new Date().toISOString(),
    problems: allCollected,
    total: allCollected.length,
    stats: {
      total_problems: allCollected.length,
      topics_covered: Array.from(new Set(allCollected.map(p => p.topic))),
    }
  };
  fs.writeFileSync(PYQ_BANK_PATH, JSON.stringify(pyqBankData, null, 2));
  console.log(`\n✓ Master pyq-bank.json updated with ${allCollected.length} total deduplicated GATE Engineering Mathematics problems.`);

  // 4. Run build-bundle.ts to construct content-bundle.json
  console.log('\nRunning build-bundle.ts...');
  const { execSync } = await import('child_process');
  try {
    const out = execSync('npx tsx scripts/build-bundle.ts', { cwd: ROOT_DIR, encoding: 'utf-8' });
    console.log(out);
  } catch (err) {
    console.error(`✗ Error running build-bundle.ts: ${err.message}`);
  }

  // Statistics Summary
  const bundlePath = path.join(FE_DATA, 'content-bundle.json');
  const explainersPath = path.join(FE_DATA, 'explainers.json');
  const graphPath = path.join(FE_DATA, 'concept-graph.json');

  console.log('=== Final Materials Audit Summary ===');
  console.log(`- Problem Bank (${PYQ_BANK_PATH}): ${allCollected.length} problems, ${(fs.statSync(PYQ_BANK_PATH).size / 1024).toFixed(1)} KB`);
  if (fs.existsSync(bundlePath)) {
    console.log(`- Tier-0 Bundle (${bundlePath}): ${(fs.statSync(bundlePath).size / 1024).toFixed(1)} KB`);
  }
  if (fs.existsSync(explainersPath)) {
    const expData = JSON.parse(fs.readFileSync(explainersPath, 'utf-8'));
    console.log(`- Concept Explainers (${explainersPath}): ${Object.keys(expData.by_concept || {}).length} concepts, ${(fs.statSync(explainersPath).size / 1024).toFixed(1)} KB`);
  }
  if (fs.existsSync(graphPath)) {
    const cgData = JSON.parse(fs.readFileSync(graphPath, 'utf-8'));
    console.log(`- Concept Graph (${graphPath}): ${cgData.total} concepts mapped`);
  }
  console.log('\nGATE Engineering Mathematics materials upload & bundle compilation complete!');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
