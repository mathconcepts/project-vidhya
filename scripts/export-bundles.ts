// @ts-nocheck
/**
 * Build static data bundles for DB-less operation.
 *
 * Outputs:
 *   frontend/public/data/concept-graph.json — 82 concepts + edges
 *   frontend/public/data/pyq-bank.json       — all PYQs from DB (or seed)
 *
 * Run: npx tsx scripts/export-bundles.ts (or `npm run export:bundles`)
 *
 * Wired into the Docker build (both Dockerfile and demo/Dockerfile) as an
 * explicit `RUN npx tsx scripts/export-bundles.ts` step in the builder
 * stage, executed BEFORE `npx vite build` so Vite copies the freshly
 * regenerated frontend/public/data/*.json into frontend/dist/data/ as part
 * of its normal public/ → dist/ copy. There is no npm-lifecycle prebuild
 * hook — the export script's OUT_DIR is process.cwd()-relative
 * (frontend/public/data), so it must run from the repo root, which an
 * npm --prefix frontend prebuild would not guarantee.
 */

import fs from 'fs';
import path from 'path';
import pg from 'pg';
import { ALL_CONCEPTS, CONCEPT_MAP } from '../src/constants/concept-graph';
import { mapPyqToConceptIds } from '../src/db/pyq-concept-mapper';
import { TOPIC_DIR_ALIAS } from '../src/db/seed-static-pyqs';

const { Pool } = pg;
const OUT_DIR = path.resolve(process.cwd(), 'frontend/public/data');

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  // 1. Concept graph — from code (authoritative source)
  const conceptGraph = {
    version: 1,
    exported_at: new Date().toISOString(),
    concepts: ALL_CONCEPTS,
    total: ALL_CONCEPTS.length,
  };
  fs.writeFileSync(path.join(OUT_DIR, 'concept-graph.json'), JSON.stringify(conceptGraph, null, 2));
  console.log(`✓ concept-graph.json (${ALL_CONCEPTS.length} concepts)`);

  // 2. PYQ bank — from DB if available, else seed
  const dbUrl = process.env.DATABASE_URL;
  let problems: any[] = [];

  if (dbUrl) {
    try {
      const pool = new Pool({ connectionString: dbUrl, max: 2 });
      const { rows } = await pool.query(
        `SELECT id, year, question_text, options, correct_answer, explanation, topic, difficulty, marks, source,
                concept_id, concept_ids
         FROM pyq_questions ORDER BY topic, difficulty, year DESC`
      );
      problems = rows;
      await pool.end();
      console.log(`✓ pyq-bank.json (${problems.length} problems from DB)`);
    } catch (err) {
      console.warn(`⚠ DB unreachable, using seed PYQs: ${(err as Error).message}`);
      problems = seedPYQs();
    }
  } else {
    problems = seedPYQs();
    console.log(`✓ pyq-bank.json (${problems.length} problems from seed — no DATABASE_URL)`);
  }

  const pyqBank = {
    version: 1,
    exported_at: new Date().toISOString(),
    problems,
    total: problems.length,
  };
  fs.writeFileSync(path.join(OUT_DIR, 'pyq-bank.json'), JSON.stringify(pyqBank, null, 2));

  console.log(`\nBundles written to ${OUT_DIR}`);
}

// Inverse of seed-static-pyqs.ts's TOPIC_DIR_ALIAS (canonical -> dirSlug):
// content files declare 'transform-theory'/'discrete-mathematics' as their
// internal `topic` field, but the app's canonical topic ids (and the
// pyq-concept-mapper.ts TAG_MAPS keys) are 'transforms'/'discrete'. Without
// this, mapPyqToConceptIds would look up TAG_MAPS['transform-theory'] —
// which doesn't exist — and every question in those two topics would
// silently export with no concept mapping, same class of bug this whole
// change fixes.
const DIR_TO_CANONICAL_TOPIC: Record<string, string> = Object.fromEntries(
  Object.entries(TOPIC_DIR_ALIAS).map(([canonical, dirSlug]) => [dirSlug, canonical]),
);

// Exported (not just used by main()) so tests can assert on its output
// directly without shelling out to the whole script (which also touches
// the filesystem / DB).
export function seedPYQs() {
  const problems: any[] = [];
  const topicsDir = path.resolve(process.cwd(), 'data/courses/gate-em/topics');

  if (fs.existsSync(topicsDir)) {
    const dirs = fs.readdirSync(topicsDir);
    dirs.forEach(d => {
      const f = path.join(topicsDir, d, 'mcqs.json');
      if (fs.existsSync(f)) {
        try {
          const content = JSON.parse(fs.readFileSync(f, 'utf-8'));
          const list = Array.isArray(content) ? content : (content.questions || content.problems || []);
          list.forEach((p: any) => {
            const questionText = p.question_text || p.question || '';
            const fileTopic = p.topic || d.replace(/^\d+-/, '');
            // The exported `topic` field is left exactly as before (the raw
            // fileTopic, e.g. 'transform-theory') — only the concept-mapper
            // lookup below needs the canonical (post-alias) topic id, since
            // that's the key pyq-concept-mapper.ts's TAG_MAPS actually uses.
            const canonicalTopic = DIR_TO_CANONICAL_TOPIC[fileTopic] || fileTopic;
            // This is the fix that makes the DB-less demo (the deployed
            // one) able to find exam questions by concept: pyq-bank.json
            // previously carried no concept mapping at all — p.concept_id
            // was always undefined since the source mcqs.json files have no
            // such field. Same "never a guess" mapper as the DB seed path.
            const conceptIds = mapPyqToConceptIds(canonicalTopic, p.tags, questionText);
            problems.push({
              id: p.id || `topic-${d}-${problems.length}`,
              year: p.year || 2024,
              question_text: questionText,
              options: p.options || {},
              correct_answer: p.correct_answer || p.correct || 'A',
              explanation: p.explanation || p.solution || '',
              topic: fileTopic,
              concept_id: conceptIds[0] ?? undefined,
              concept_ids: conceptIds.length > 0 ? conceptIds : undefined,
              difficulty: p.difficulty || 'medium',
              marks: p.marks || 2,
              source: p.source || 'GATE-EM-Topic-MCQs'
            });
          });
        } catch {}
      }
    });
  }

  // Fallback 12 seed items if topic directory empty
  if (problems.length === 0) {
    return [
      { id: 'gate-la-2023-1', year: 2023, question_text: 'If A is a 3x3 matrix with eigenvalues 1, 2, 3, then det(A) is:', options: { A: '6', B: '5', C: '9', D: '0' }, correct_answer: 'A', explanation: 'det(A) = product of eigenvalues = 1×2×3 = 6.', topic: 'linear-algebra', difficulty: 'easy', marks: 1, source: 'GATE' },
      { id: 'gate-la-2023-2', year: 2023, question_text: 'The rank of the matrix [[1,2,3],[2,4,6],[1,1,1]] is:', options: { A: '1', B: '2', C: '3', D: '0' }, correct_answer: 'B', explanation: 'Row reduce → two non-zero rows → rank 2.', topic: 'linear-algebra', difficulty: 'medium', marks: 2, source: 'GATE' },
      { id: 'gate-la-2022-1', year: 2022, question_text: 'If A is orthogonal, det(A) equals:', options: { A: '+1 or -1', B: '0', C: '1 only', D: 'Cannot be determined' }, correct_answer: 'A', explanation: 'A^T·A = I → (det A)^2 = 1 → det A = ±1.', topic: 'linear-algebra', difficulty: 'easy', marks: 1, source: 'GATE' },
      { id: 'gate-calc-2023-1', year: 2023, question_text: 'Value of lim(x→0) (sin x)/x is:', options: { A: '0', B: '1', C: '∞', D: 'Does not exist' }, correct_answer: 'B', explanation: 'Fundamental limit = 1.', topic: 'calculus', difficulty: 'easy', marks: 1, source: 'GATE' },
      { id: 'gate-calc-2023-2', year: 2023, question_text: 'The integral ∫₀¹ x·eˣ dx equals:', options: { A: '1', B: 'e-1', C: 'e', D: '2e-1' }, correct_answer: 'A', explanation: 'By parts: [x·eˣ]₀¹ - ∫₀¹ eˣ dx = e - (e-1) = 1.', topic: 'calculus', difficulty: 'medium', marks: 2, source: 'GATE' },
      { id: 'gate-calc-2022-1', year: 2022, question_text: 'If f(x) = x³ - 3x + 2, the number of real roots is:', options: { A: '1', B: '2', C: '3', D: '0' }, correct_answer: 'C', explanation: 'f(x) = (x-1)²(x+2). Three real roots.', topic: 'calculus', difficulty: 'medium', marks: 2, source: 'GATE' },
      { id: 'gate-prob-2023-1', year: 2023, question_text: 'If X follows Poisson with mean 2, P(X=0) is:', options: { A: 'e⁻²', B: '2e⁻²', C: '1-e⁻²', D: '0' }, correct_answer: 'A', explanation: 'P(X=0) = e^(-λ)·λ^0/0! = e^(-2).', topic: 'probability-statistics', difficulty: 'easy', marks: 1, source: 'GATE' },
      { id: 'gate-prob-2023-2', year: 2023, question_text: 'Two dice thrown. P(sum = 7) is:', options: { A: '1/6', B: '5/36', C: '1/12', D: '7/36' }, correct_answer: 'A', explanation: '6 favorable outcomes / 36 total = 1/6.', topic: 'probability-statistics', difficulty: 'easy', marks: 1, source: 'GATE' },
      { id: 'gate-de-2023-1', year: 2023, question_text: 'Solution of dy/dx + y = eˣ with y(0)=1:', options: { A: 'y = (eˣ+e⁻ˣ)/2', B: 'y = eˣ/2+e⁻ˣ/2', C: 'y = eˣ-e⁻ˣ', D: 'y = eˣ+e⁻ˣ' }, correct_answer: 'B', explanation: 'IF=eˣ. y·eˣ=e²ˣ/2+C. y(0)=1→C=1/2.', topic: 'differential-equations', difficulty: 'medium', marks: 2, source: 'GATE' },
      { id: 'gate-de-2022-1', year: 2022, question_text: 'Order and degree of (d²y/dx²)³ + (dy/dx)² + y = 0:', options: { A: '2 and 3', B: '3 and 2', C: '2 and 2', D: '3 and 3' }, correct_answer: 'A', explanation: 'Order=2 (highest derivative). Degree=3 (power of highest order).', topic: 'differential-equations', difficulty: 'easy', marks: 1, source: 'GATE' },
      { id: 'gate-cv-2023-1', year: 2023, question_text: 'If f(z)=u+iv is analytic and u=x²-y², then v=', options: { A: '2xy+C', B: 'x²+y²+C', C: '-2xy+C', D: 'xy+C' }, correct_answer: 'A', explanation: 'Cauchy-Riemann: ∂u/∂x=2x=∂v/∂y, so v=2xy+C.', topic: 'complex-variables', difficulty: 'medium', marks: 2, source: 'GATE' },
      { id: 'gate-nm-2023-1', year: 2023, question_text: 'Newton-Raphson on x²-2=0 starting x₀=1, after one iteration:', options: { A: '1.5', B: '1.414', C: '1.333', D: '2.0' }, correct_answer: 'A', explanation: 'x₁ = 1 - (1-2)/(2·1) = 1.5.', topic: 'numerical-methods', difficulty: 'easy', marks: 1, source: 'GATE' },
    ];
  }

  return problems;
}

// Guard so tests can `import { seedPYQs } from './export-bundles'` without
// triggering the full file-writing / DB-hitting main() as a side effect of
// module load (same pattern as scripts/check-practice-items.ts).
if (process.argv[1]?.endsWith('export-bundles.ts')) {
  main().catch(err => { console.error(err); process.exit(1); });
}
