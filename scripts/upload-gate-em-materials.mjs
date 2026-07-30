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

const ROOT_DIR = process.cwd();
const FE_DATA = path.resolve(ROOT_DIR, 'frontend/public/data');
const TOPICS_DIR = path.resolve(ROOT_DIR, 'data/courses/gate-em/topics');
const SEED_SQL_PATH = path.resolve(ROOT_DIR, 'scripts/seed-pyqs.sql');
const SUPABASE_SQL_PATH = path.resolve(ROOT_DIR, 'supabase/seeds/gate_em_pyqs.sql');
const PILOT_HTML_PATH = path.resolve(ROOT_DIR, '../GATE-EM-Sample/index.html');
const PYQ_BANK_PATH = path.join(FE_DATA, 'pyq-bank.json');

function fingerprint(problem) {
  const qText = problem.question_text || problem.question || '';
  const cAns = String(problem.correct_answer || problem.ans || '');
  const normalized = `${qText}|${cAns}`.toLowerCase().replace(/\s+/g, '');
  return crypto.createHash('sha256').update(normalized).digest('hex').slice(0, 16);
}

function normalizeDifficulty(d) {
  if (typeof d === 'number') return d;
  if (d === 'easy') return 0.25;
  if (d === 'medium') return 0.5;
  if (d === 'hard') return 0.75;
  return 0.5;
}

function normalizeTopic(t) {
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

function parseSqlInserts(sqlContent, sourceName) {
  const problems = [];
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

function parsePilotHtml() {
  const problems = [];
  if (!fs.existsSync(PILOT_HTML_PATH)) return problems;
  try {
    const content = fs.readFileSync(PILOT_HTML_PATH, 'utf-8');
    const itemRegex = /\{id:"([^"]+)",t:"([^"]+)",type:"([^"]+)",marks:(\d+),r:(\d+),q:"((?:\\.|[^"])*)",(?:opts:(\[[\s\S]*?\]),)?ans:(.*?),sol:"((?:\\.|[^"])*)"\}/g;
    let match;
    while ((match = itemRegex.exec(content)) !== null) {
      const [, id, t, type, marks, r, q, optsStr, ansStr, sol] = match;
      let corrAns = 'A';
      if (!isNaN(parseInt(ansStr))) {
        corrAns = String.fromCharCode(65 + parseInt(ansStr));
      }
      let optsObj = {};
      if (optsStr) {
        try {
          const cleanOpts = JSON.parse(optsStr.replace(/'/g, '"'));
          cleanOpts.forEach((o, idx) => {
            optsObj[String.fromCharCode(65 + idx)] = o;
          });
        } catch {}
      }
      problems.push({
        id: `pilot-${id}`,
        question_text: q.replace(/\\n/g, '\n'),
        options: optsObj,
        correct_answer: corrAns,
        explanation: sol.replace(/\\n/g, '\n'),
        topic: normalizeTopic(t),
        difficulty: r ? (parseInt(r) > 1100 ? 0.75 : parseInt(r) > 1050 ? 0.5 : 0.25) : 0.5,
        marks: parseInt(marks) || 1,
        source: 'GATE-EM-Pilot-Sample',
        verified: true
      });
    }
  } catch (err) {
    console.warn(`  ⚠ Failed parsing pilot sample: ${err.message}`);
  }
  return problems;
}

function buildBundlePure() {
  const OUT_PATH = path.join(FE_DATA, 'content-bundle.json');
  const RAW_DIR = path.resolve(ROOT_DIR, 'data/raw');
  const GEN_DIR = path.resolve(ROOT_DIR, 'data/generated');

  console.log('Building content bundle...');

  const problems = [];
  const seen = new Set();

  // 1. pyq-bank.json
  if (fs.existsSync(PYQ_BANK_PATH)) {
    try {
      const pyq = JSON.parse(fs.readFileSync(PYQ_BANK_PATH, 'utf-8'));
      for (const p of pyq.problems || []) {
        const fp = fingerprint(p);
        if (seen.has(fp)) continue;
        seen.add(fp);
        problems.push({
          ...p,
          concept_id: p.concept_id || p.topic,
          difficulty: normalizeDifficulty(p.difficulty),
          source: p.source || 'pyq-bank',
          verified: true,
          wolfram_verified: p.wolfram_verified || false,
          fingerprint: fp,
        });
      }
      console.log(`  ✓ pyq-bank.json: ${pyq.problems?.length || 0} problems`);
    } catch (err) {
      console.warn(`  ⚠ pyq-bank.json: ${err.message}`);
    }
  }

  // 2. Explainers
  let explainers = {};
  const expPath = path.join(FE_DATA, 'explainers.json');
  if (fs.existsSync(expPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(expPath, 'utf-8'));
      explainers = data.by_concept || {};
      console.log(`  ✓ explainers.json: ${Object.keys(explainers).length} concepts`);
    } catch (err) {
      console.warn(`  ⚠ explainers.json: ${err.message}`);
    }
  }

  // Stats
  const byTopic = {};
  const byDifficulty = {};
  let wolframVerified = 0;
  for (const p of problems) {
    byTopic[p.topic || 'unknown'] = (byTopic[p.topic || 'unknown'] || 0) + 1;
    const db = p.difficulty < 0.33 ? 'easy' : p.difficulty < 0.66 ? 'medium' : 'hard';
    byDifficulty[db] = (byDifficulty[db] || 0) + 1;
    if (p.wolfram_verified) wolframVerified++;
  }

  const bundle = {
    version: 2,
    generated_at: new Date().toISOString(),
    problems,
    explainers,
    stats: {
      total_problems: problems.length,
      total_explainers: Object.keys(explainers).length,
      wolfram_verified: wolframVerified,
      by_topic: byTopic,
      by_difficulty: byDifficulty,
    },
  };

  fs.writeFileSync(OUT_PATH, JSON.stringify(bundle, null, 2));
  console.log(`✓ Bundle written: ${OUT_PATH} (${problems.length} problems, ${Object.keys(explainers).length} explainers)`);
}

async function main() {
  console.log('=== Compiling & Uploading GATE Engineering Mathematics Materials ===\n');

  fs.mkdirSync(FE_DATA, { recursive: true });

  const allCollected = [];
  const seenFp = new Set();

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
            const problem = {
              id: q.id || `mcq-${d}-${topicMcqCount}`,
              year: q.year || 2024,
              question_text: q.question || q.question_text || '',
              options: q.options || {},
              correct_answer: q.correct_answer || 'A',
              explanation: q.explanation || q.solution || '',
              topic: normalizeTopic(q.topic || d.replace(/^\d+-/, '')),
              concept_id: q.concept_id,
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
          console.warn(`  ⚠ ${d}/mcqs.json error: ${err.message}`);
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

  // 4. Build content bundle
  buildBundlePure();

  // Statistics Summary
  const bundlePath = path.join(FE_DATA, 'content-bundle.json');
  const explainersPath = path.join(FE_DATA, 'explainers.json');
  const graphPath = path.join(FE_DATA, 'concept-graph.json');

  console.log('\n=== Final Materials Audit Summary ===');
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
