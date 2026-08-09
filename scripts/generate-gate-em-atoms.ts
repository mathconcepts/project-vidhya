#!/usr/bin/env npx tsx
/**
 * generate-gate-em-atoms.ts
 *
 * Converts generated concept files in data/courses/gate-em/concepts/{id}/
 * into proper atom .md files at modules/project-vidhya-content/concepts/{id}/atoms/
 * so loadConceptAtoms() finds real content instead of throwing ConceptNotFoundError.
 *
 * Run: npx tsx scripts/generate-gate-em-atoms.ts
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const CONCEPT_SRC = path.join(ROOT, 'data/courses/gate-em/concepts');
const ATOM_DEST = path.join(ROOT, 'modules/project-vidhya-content/concepts');

// ── helpers ─────────────────────────────────────────────────────────────────

function extractSection(md: string, heading: string): string {
  const re = new RegExp(`^##\\s+${heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`, 'im');
  const match = re.exec(md);
  if (!match) return '';
  const start = match.index + match[0].length;
  const next = md.slice(start).search(/^##\s/m);
  const raw = next === -1 ? md.slice(start) : md.slice(start, start + next);
  return raw.trim();
}

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function frontmatter(fields: Record<string, string | number | string[]>): string {
  const lines = ['---'];
  for (const [k, v] of Object.entries(fields)) {
    if (Array.isArray(v)) {
      lines.push(`${k}: [${v.map(x => `"${x}"`).join(', ')}]`);
    } else if (typeof v === 'number') {
      lines.push(`${k}: ${v}`);
    } else {
      lines.push(`${k}: ${v}`);
    }
  }
  lines.push('---');
  return lines.join('\n');
}

// ── per-concept processing ────────────────────────────────────────────────────

function processConceptDir(conceptId: string): void {
  const src = path.join(CONCEPT_SRC, conceptId);
  if (!fs.statSync(src).isDirectory()) return;

  const explainerPath = path.join(src, 'explainer.md');
  const mcqsPath = path.join(src, 'mcqs.json');
  const tipsPath = path.join(src, 'tips.md');

  if (!fs.existsSync(explainerPath)) return;

  const explainer = fs.readFileSync(explainerPath, 'utf8');

  // Parse difficulty from the metadata line
  const metaLine = explainer.split('\n').find(l => l.startsWith('>'));
  const diffMatch = metaLine?.match(/difficulty:\s*([\d.]+)/);
  const difficulty = diffMatch ? parseFloat(diffMatch[1]) : 0.5;

  // Parse topic from the metadata line
  const topicMatch = metaLine?.match(/\| ([^|]+) \|/);
  const topic = topicMatch ? slugify(topicMatch[1].trim()) : 'uncategorized';

  // Determine gate_frequency tag
  const freqMatch = metaLine?.match(/(high|medium|low|rare) frequency/i);
  const freq = freqMatch ? freqMatch[1].toLowerCase() : 'medium';

  const dest = path.join(ATOM_DEST, conceptId, 'atoms');
  // Skip if this concept's atom directory already has files — the original
  // curated content (complex-numbers, derivatives-basic, eigenvalues) must
  // not be overwritten.
  const destExists = fs.existsSync(dest) && fs.readdirSync(dest).length > 0;
  if (destExists) return;

  fs.mkdirSync(dest, { recursive: true });

  // ── meta.yaml ────────────────────────────────────────────────────────────
  const metaDest = path.join(ATOM_DEST, conceptId, 'meta.yaml');
  if (!fs.existsSync(metaDest)) {
    const conceptLabel = conceptId.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');
    fs.writeFileSync(metaDest,
      `concept_id: ${conceptId}\nlabel: "${conceptLabel}"\ntopic: ${topic}\ndifficulty_base: ${difficulty}\ngate_frequency: ${freq}\nexam_ids: ["*"]\n`,
    );
  }

  // ── hook.md — "Intuition First" section ─────────────────────────────────
  const intuitionContent = extractSection(explainer, 'Intuition First');
  if (intuitionContent) {
    const fm = frontmatter({
      id: `${conceptId}.hook`,
      concept_id: conceptId,
      atom_type: 'hook',
      bloom_level: 1,
      difficulty: 0.0,
      exam_ids: ['*'],
    });
    fs.writeFileSync(path.join(dest, 'hook.md'), `${fm}\n\n${intuitionContent}\n`);
  }

  // ── formal-definition.md — "Core Definition" section ────────────────────
  const coreContent = extractSection(explainer, 'Core Definition');
  if (coreContent) {
    const fm = frontmatter({
      id: `${conceptId}.formal-definition`,
      concept_id: conceptId,
      atom_type: 'formal_definition',
      bloom_level: 2,
      difficulty: parseFloat((difficulty * 0.8).toFixed(2)),
      exam_ids: ['*'],
    });
    fs.writeFileSync(path.join(dest, 'formal-definition.md'), `${fm}\n\n${coreContent}\n`);
  }

  // ── worked-example.md — "What Happens" section ──────────────────────────
  const workedContent = extractSection(explainer, 'What Happens \\(Worked Example\\)')
    || extractSection(explainer, 'What Happens');
  if (workedContent) {
    const fm = frontmatter({
      id: `${conceptId}.worked-example`,
      concept_id: conceptId,
      atom_type: 'worked_example',
      bloom_level: 3,
      difficulty: parseFloat((difficulty + 0.1).toFixed(2)),
      exam_ids: ['*'],
      estimated_minutes: 5,
    });
    fs.writeFileSync(path.join(dest, 'worked-example.md'), `${fm}\n\n${workedContent}\n`);
  }

  // ── MCQ-based atoms ──────────────────────────────────────────────────────
  if (fs.existsSync(mcqsPath)) {
    let mcqData: any;
    try {
      mcqData = JSON.parse(fs.readFileSync(mcqsPath, 'utf8'));
    } catch { mcqData = null; }

    const questions: any[] = mcqData?.questions ?? [];
    const easy = questions.filter((q: any) => q.difficulty === 'easy');
    const medium = questions.filter((q: any) => q.difficulty === 'medium');
    const hard = questions.filter((q: any) => q.difficulty === 'hard');

    const microQ = easy[0] || questions[0];
    if (microQ) {
      const opts = Object.entries(microQ.options || {})
        .map(([k, v]) => `- **(${k})** ${v}`)
        .join('\n');
      const fm = frontmatter({
        id: `${conceptId}.micro-exercise`,
        concept_id: conceptId,
        atom_type: 'micro_exercise',
        bloom_level: 3,
        difficulty: 0.25,
        exam_ids: ['*'],
        estimated_minutes: 2,
      });
      const body = `${microQ.question}\n\n${opts}\n\n<details>\n<summary>Answer</summary>\n\n**${microQ.correct_answer}**. ${microQ.explanation}\n\n</details>`;
      fs.writeFileSync(path.join(dest, 'micro-exercise.md'), `${fm}\n\n${body}\n`);
    }

    const practiceQ = medium[0] || hard[0] || questions[1];
    if (practiceQ) {
      const opts = Object.entries(practiceQ.options || {})
        .map(([k, v]) => `- **(${k})** ${v}`)
        .join('\n');
      const diff = practiceQ.difficulty === 'hard' ? 0.75 : 0.5;
      const fm = frontmatter({
        id: `${conceptId}.retrieval-prompt`,
        concept_id: conceptId,
        atom_type: 'retrieval_prompt',
        bloom_level: 4,
        difficulty: diff,
        exam_ids: ['*'],
        estimated_minutes: 3,
      });
      const body = `${practiceQ.question}\n\n${opts}\n\n<details>\n<summary>Answer</summary>\n\n**${practiceQ.correct_answer}**. ${practiceQ.explanation}\n\n</details>`;
      fs.writeFileSync(path.join(dest, 'retrieval-prompt.md'), `${fm}\n\n${body}\n`);
    }
  }

  // ── common-traps.md — from tips.md ───────────────────────────────────────
  if (fs.existsSync(tipsPath)) {
    const tips = fs.readFileSync(tipsPath, 'utf8');
    const errorsContent = extractSection(tips, 'Common Student Errors');
    if (errorsContent) {
      const fm = frontmatter({
        id: `${conceptId}.common-traps`,
        concept_id: conceptId,
        atom_type: 'common_traps',
        bloom_level: 2,
        difficulty: 0.3,
        exam_ids: ['*'],
      });
      fs.writeFileSync(path.join(dest, 'common-traps.md'), `${fm}\n\n${errorsContent}\n`);
    }
  }

  // ── intuition.md — "Visual Analogy" section from explainer if present ────
  const visualContent = extractSection(explainer, 'Visual Analogy')
    || extractSection(explainer, 'Geometric Intuition')
    || extractSection(explainer, 'Intuition');
  if (visualContent) {
    const fm = frontmatter({
      id: `${conceptId}.intuition`,
      concept_id: conceptId,
      atom_type: 'visual_analogy',
      bloom_level: 2,
      difficulty: 0.1,
      exam_ids: ['*'],
    });
    fs.writeFileSync(path.join(dest, 'intuition.md'), `${fm}\n\n${visualContent}\n`);
  }
}

// ── main ──────────────────────────────────────────────────────────────────────

const conceptDirs = fs.readdirSync(CONCEPT_SRC).filter(d =>
  fs.statSync(path.join(CONCEPT_SRC, d)).isDirectory()
);

let done = 0;
let skipped = 0;
const errors: string[] = [];

for (const conceptId of conceptDirs) {
  try {
    processConceptDir(conceptId);
    done++;
  } catch (err) {
    errors.push(`${conceptId}: ${(err as Error).message}`);
    skipped++;
  }
}

console.log(`✓ Generated atoms for ${done} concepts, ${skipped} skipped`);
if (errors.length) {
  console.log('Errors:');
  errors.forEach(e => console.log(' ', e));
}
